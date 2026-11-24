import type { H3Event } from 'h3'
import { createHash } from 'node:crypto'
import { resolveClientIp } from '#shared/utils/clientIp'

// NÚCLEO COMPARTIDO del envío de formularios públicos por CORREO (SMTP autenticado). Solo servidor. Lo usan todos los formularios que se envían por correo
// (estudio de crédito, solicitud de financiación…): ninguno crea su propio transporte, validación de conexión, manejo de errores ni guardas.
//  · Credenciales SMTP (NUXT_MAIL_*) y destinatarios por formulario (p. ej. NUXT_CREDIT_STUDY_TO/CC, NUXT_LEAD_FORM_TO/CC) salen SOLO de la configuración del
//    servidor. El navegador no puede fijar destinatarios, copia, remitente ni asunto. Sin configuración válida => 503 `not_configured` antes de leer el cuerpo.
//  · Conexión cifrada obligatoria (465 = TLS; otros puertos exigen STARTTLS). Éxito SOLO si el SMTP aceptó el mensaje para TODOS los destinatarios
//    (aceptación, no entrega en bandeja). Sin reintentos automáticos.
//  · Límite de intentos por IP y huella del contenido para no duplicar envíos, por formulario. No se registra ningún dato personal, financiero ni de archivos:
//    solo códigos de error. Los guardas viven en la memoria de ESTE proceso: la aplicación debe ejecutarse como una sola instancia.

const RATE = { max: 5, windowMs: 10 * 60_000 }
const DUPLICATE_WINDOW_MS = 10 * 60_000
const MAX_TRACKED = 5000

export const MSG_FORM_UNAVAILABLE = 'El envío del formulario no está disponible temporalmente. Inténtalo de nuevo más tarde.'
export const MSG_SEND_FAILED = 'No pudimos enviar tu solicitud. Inténtalo de nuevo en unos minutos.'

const hits = new Map<string, number[]>()
const inflight = new Set<string>()
const accepted = new Map<string, number>()

/** Solo pruebas: vacía el estado en memoria. */
export function resetMailGuards() {
  hits.clear()
  inflight.clear()
  accepted.clear()
  resetNotifications()
}

export function formFail(statusCode: number, message: string, data: Record<string, unknown> = {}): never {
  throw createError({ statusCode, message, data: { message, ...data } })
}

// ── Configuración de correo ──────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface MailConfig {
  host: string
  port: number
  username: string
  password: string
  fromAddress: string
  fromName: string
  to: string[]
  cc: string[]
}

/** Claves de runtimeConfig con los destinatarios de cada formulario (Para y Copia). Solo servidor. */
export interface MailRecipientKeys { to: string, cc: string }
export const CREDIT_STUDY_RECIPIENTS: MailRecipientKeys = { to: 'creditStudyTo', cc: 'creditStudyCc' }
export const LEAD_FORM_RECIPIENTS: MailRecipientKeys = { to: 'leadFormTo', cc: 'leadFormCc' }
export const VALUATION_RECIPIENTS: MailRecipientKeys = { to: 'valuationTo', cc: 'valuationCc' }
export const REFERRAL_RECIPIENTS: MailRecipientKeys = { to: 'referralTo', cc: 'referralCc' }

/** Nombre de la variable de entorno de una clave de runtimeConfig (`leadFormTo` → `NUXT_LEAD_FORM_TO`). Solo para diagnóstico: nunca se registran los valores. */
export const envName = (key: string) => `NUXT_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`

const MAIL_RE = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]{2,}$/
// eslint-disable-next-line no-control-regex
export const CTRL_RE = /[\u0000-\u001f\u007f]/
const text = (v: unknown) => (typeof v === 'string' ? v.trim() : (typeof v === 'number' && Number.isFinite(v) ? String(v) : ''))

function parseAddresses(raw: unknown): string[] | null {
  const list = text(raw).split(/[,;]/).map(s => s.trim()).filter(Boolean)
  if (list.length > 5 || !list.every(a => MAIL_RE.test(a))) return null
  return [...new Set(list.map(a => a.toLowerCase()))]
}

/** Valida la configuración de correo. Devuelve la configuración normalizada o los NOMBRES de variables ausentes/inválidas (nunca valores). */
export function resolveMailConfig(src: Record<string, unknown> | null | undefined, keys: MailRecipientKeys = CREDIT_STUDY_RECIPIENTS): { ok: true, config: MailConfig } | { ok: false, invalid: string[] } {
  const c = (src && typeof src === 'object' ? src : {}) as Record<string, unknown>
  const invalid: string[] = []
  const host = text(c.mailHost)
  if (!host || CTRL_RE.test(host) || /\s/.test(host)) invalid.push('NUXT_MAIL_HOST')
  const port = Number(text(c.mailPort))
  if (!Number.isInteger(port) || port < 1 || port > 65535) invalid.push('NUXT_MAIL_PORT')
  const username = text(c.mailUsername)
  if (!username || CTRL_RE.test(username)) invalid.push('NUXT_MAIL_USERNAME')
  const password = typeof c.mailPassword === 'string' ? c.mailPassword : ''
  if (!password || CTRL_RE.test(password)) invalid.push('NUXT_MAIL_PASSWORD')
  // El remitente sale de NUXT_MAIL_FROM_ADDRESS o, si falta, del usuario SMTP cuando es un correo.
  const fromAddress = text(c.mailFromAddress) || (MAIL_RE.test(username) ? username : '')
  if (!MAIL_RE.test(fromAddress)) invalid.push('NUXT_MAIL_FROM_ADDRESS')
  const to = parseAddresses(c[keys.to])
  if (!to || !to.length) invalid.push(envName(keys.to))
  const cc = text(c[keys.cc]) ? parseAddresses(c[keys.cc]) : []
  if (!cc) invalid.push(envName(keys.cc))
  if (invalid.length) return { ok: false, invalid }
  const fromName = text(c.mailFromName).replace(CTRL_RE, ' ').replace(/["<>]/g, '').slice(0, 100)
  return { ok: true, config: { host, port, username, password, fromAddress, fromName, to: to!, cc: cc! } }
}

/** Configuración de correo del formulario o 503 `not_configured` (sin leer el cuerpo ni consumir el límite por IP). */
export function requireMailConfig(event: H3Event, tag: string, keys: MailRecipientKeys): { runtime: Record<string, any>, config: MailConfig } {
  const runtime = useRuntimeConfig(event) as Record<string, any>
  const mail = resolveMailConfig(runtime, keys)
  if (!mail.ok) {
    console.error(`[${tag}] configuración de correo incompleta o inválida (${mail.invalid.join(', ')}): el envío permanece bloqueado.`)
    formFail(503, MSG_FORM_UNAVAILABLE, { reason: 'not_configured' })
  }
  return { runtime, config: mail.config }
}

/** Límite de intentos por IP y formulario. true = excedido. */
export function isRateLimited(form: string, event: H3Event, runtime: Record<string, any>, now: number): boolean {
  const ip = resolveClientIp(getRequestIP(event), getRequestHeader(event, 'x-forwarded-for'), Number(runtime.trustedProxyHops) || 0)
  const key = `${form}|${ip}`
  if (hits.size >= MAX_TRACKED) {
    for (const [k, times] of hits) if (times.every(t => now - t >= RATE.windowMs)) hits.delete(k)
    if (hits.size >= MAX_TRACKED && !hits.has(key)) return true // saturado: falla cerrado en vez de crecer sin límite
  }
  const recent = (hits.get(key) ?? []).filter(t => now - t < RATE.windowMs)
  if (recent.length >= RATE.max) { hits.set(key, recent); return true }
  recent.push(now)
  hits.set(key, recent)
  return false
}

export interface MailTransport {
  sendMail: (message: Record<string, unknown>) => Promise<{ accepted?: unknown[], rejected?: unknown[] }>
  close?: () => void
}
type TransportFactory = (config: MailConfig) => Promise<MailTransport>

// Conexión cifrada obligatoria: 465 = TLS implícito; cualquier otro puerto exige STARTTLS (`requireTLS`) y no envía credenciales en claro.
const defaultFactory: TransportFactory = async (config) => {
  const { createTransport } = await import('nodemailer')
  return createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    requireTLS: config.port !== 465,
    auth: { user: config.username, pass: config.password },
    tls: { minVersion: 'TLSv1.2' },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 60_000,
    disableFileAccess: true,
    disableUrlAccess: true
  }) as unknown as MailTransport
}
let transportFactory: TransportFactory = defaultFactory

/** Solo pruebas: reemplaza el transporte SMTP (nunca se envían correos reales en las pruebas). Sin argumento, restaura el real. */
export function setMailTransportFactory(factory?: TransportFactory) {
  transportFactory = factory ?? defaultFactory
}

// ── Contenido del correo (plantilla común) ───────────────────────────────────────────────────────────────────────────────────────────────

// Colores de la marca de ESTE proyecto (cabecera del correo).
const THEME = { header: '#0C2619', accent: '#d3a76a' }

export const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
export const cleanLine = (s: string) => s.replace(CTRL_RE, ' ').trim()
export const fmtMoney = (n: number) => `$ ${n.toLocaleString('es-CO')}`

export interface MailRow { label: string, value: string }
export interface MailSection { title: string, rows: MailRow[] }

export function formatReceivedAt(date: Date): string {
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'full', timeStyle: 'medium', timeZone: 'America/Bogota' }).format(date)
}

/** Texto y HTML del correo. Marca, formulario y fecha de recepción en la cabecera; datos por secciones. Todo valor se escapa. */
export function renderFormEmail(input: { brand: string, title: string, receivedAt: Date, sections: MailSection[], documents?: string[], footer: string }) {
  const { brand, title, sections, documents, footer } = input
  const received = formatReceivedAt(input.receivedAt)

  const text = [
    `${brand} — ${title}`,
    `Recibida: ${received}`,
    '',
    ...sections.flatMap(s => [s.title.toUpperCase(), ...s.rows.map(r => `  ${r.label}: ${r.value}`), '']),
    ...(documents ? ['DOCUMENTOS ADJUNTOS', ...(documents.length ? documents.map(d => `  ${d}`) : ['  (ninguno)']), ''] : []),
    footer
  ].join('\n')

  const heading = (t: string) => `<div style="font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid ${THEME.header};padding-bottom:4px">${escapeHtml(t)}</div>`
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f4f1ec;font-family:Arial,Helvetica,sans-serif;color:#1c1b1b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="680" cellpadding="0" cellspacing="0" style="max-width:680px;width:100%;background:#ffffff;border:1px solid #e3ddd3">
<tr><td style="background:${THEME.header};color:#ffffff;padding:20px 24px"><div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:${THEME.accent}">${escapeHtml(brand)}</div>
<div style="font-size:20px;font-weight:bold;margin-top:4px">${escapeHtml(title)}</div>
<div style="font-size:13px;margin-top:6px;color:#dddddd">Recibida: ${escapeHtml(received)}</div></td></tr>
${sections.map(s => `<tr><td style="padding:18px 24px 0">${heading(s.title)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px">${s.rows.map(r => `<tr><td style="padding:4px 12px 4px 0;width:42%;vertical-align:top;font-size:13px;color:#555555">${escapeHtml(r.label)}</td><td style="padding:4px 0;font-size:13px;vertical-align:top">${escapeHtml(r.value)}</td></tr>`).join('')}</table></td></tr>`).join('\n')}
${documents ? `<tr><td style="padding:18px 24px 0">${heading('Documentos adjuntos')}
<ul style="margin:8px 0 0;padding-left:18px;font-size:13px">${documents.length ? documents.map(d => `<li>${escapeHtml(d)}</li>`).join('') : '<li>(ninguno)</li>'}</ul></td></tr>` : ''}
<tr><td style="padding:20px 24px;font-size:11px;color:#777777">${escapeHtml(footer)}</td></tr>
</table></td></tr></table></body></html>`

  return { text, html }
}

// ── Entrega ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Huella SHA-256 del contenido: un mismo envío repetido no genera otro correo. */
export function contentFingerprint(values: Record<string, unknown>, files: { id: string, content: Uint8Array }[] = []): string {
  const hash = createHash('sha256')
  hash.update(JSON.stringify(Object.keys(values).sort().map(k => [k, values[k]])))
  for (const f of files) hash.update(`|${f.id}:`).update(f.content)
  return hash.digest('hex')
}

export interface MailAttachment { filename: string, content: Uint8Array, contentType: string }

/**
 * Entrega del correo ya armado: descarta duplicados, envía con el transporte SMTP y responde `{ ok: true }` SOLO si el servidor SMTP aceptó el mensaje
 * para todos los destinatarios. Los errores se registran como código y se devuelven genéricos (nunca detalles del servidor SMTP).
 */
export async function deliverFormMail(opts: {
  tag: string
  form: string
  print: string
  now: number
  mail: MailConfig
  subject: string
  text: string
  html: string
  replyTo?: string
  attachments?: MailAttachment[]
}) {
  const { tag, mail: m } = opts
  const dupKey = `${opts.form}|${opts.print}`
  const last = accepted.get(dupKey)
  if (inflight.has(dupKey) || (last && opts.now - last < DUPLICATE_WINDOW_MS)) {
    formFail(409, 'Ya recibimos esta solicitud. No es necesario enviarla de nuevo.', { reason: 'duplicate' })
  }
  const recipients = [...new Set([...m.to, ...m.cc])]

  inflight.add(dupKey)
  let transport: MailTransport | undefined
  try {
    try {
      transport = await transportFactory(m)
      const info = await transport.sendMail({
        from: m.fromName ? { name: m.fromName, address: m.fromAddress } : m.fromAddress,
        to: m.to,
        ...(m.cc.length ? { cc: m.cc } : {}),
        // Responder al solicitante es cómodo para el equipo; no es un destinatario del mensaje.
        ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
        attachments: (opts.attachments ?? []).map(a => ({ filename: a.filename, content: Buffer.from(a.content), contentType: a.contentType }))
      })
      const ok = (info?.accepted?.length ?? 0) >= recipients.length && (info?.rejected?.length ?? 0) === 0
      if (!ok) {
        console.error(`[${tag}] el servidor SMTP no aceptó a todos los destinatarios`)
        formFail(502, MSG_SEND_FAILED, { reason: 'smtp_rejected' })
      }
    } catch (e: any) {
      if (e?.statusCode) throw e
      // Solo el código del error: el mensaje del servidor SMTP puede contener direcciones o fragmentos del correo.
      const code = typeof e?.code === 'string' && /^[A-Za-z0-9_]{1,30}$/.test(e.code) ? e.code : 'ERROR'
      const unreachable = ['ECONNECTION', 'ETIMEDOUT', 'ESOCKET', 'ECONNREFUSED', 'EDNS', 'ENOTFOUND', 'ECONNRESET'].includes(code)
      console.error(`[${tag}] fallo SMTP (${code})`)
      formFail(unreachable ? 503 : 502, MSG_SEND_FAILED, { reason: unreachable ? 'smtp_unreachable' : 'smtp_error' })
    }

    accepted.set(dupKey, opts.now)
    return { ok: true }
  } finally {
    inflight.delete(dupKey)
    try { transport?.close?.() } catch { /* sin efecto */ }
  }
}


// ── Notificación COMPLEMENTARIA (después de que Hub/CRM confirmaron) ───────────────
// El correo es un RESPALDO: nunca altera el resultado de un registro que Hub/CRM ya confirmaron. `notifyComplementary` NO lanza y devuelve `sent` (SMTP
// aceptó), `pending` (falló o tardó; queda en cola de REINTENTO en memoria) o `skipped` (sin correo configurado o sin nada que encolar).
//
// LÍMITES (no hay persistencia: sin base de datos, disco ni migraciones; NO se garantiza «exactamente una vez»):
//  · Todo vive en la memoria de ESTE proceso. Si Node se reinicia se pierden la cola de pendientes y el registro de entregados.
//  · Con varias instancias cada una tiene su propia memoria: no comparten pendientes ni entregados.
//  · Consecuencia: tras un reinicio, en otra instancia o pasadas 24 h, reenviar el MISMO formulario (Hub lo trata como repetición idempotente) puede enviar
//    OTRO correo; y un correo pendiente puede perderse si el proceso se reinicia o si el SMTP sigue caído tras los reintentos (3 reintentos: 30 s, 2 min y 10 min).
//  · La idempotencia de Hub/CRM es independiente de esto: el registro principal nunca se duplica ni se pierde por el correo.
// Retención mínima: de un pendiente solo se conserva el mensaje YA CONSTRUIDO (con los datos bancarios enmascarados), nunca el formulario completo; se libera al
// entregar o abandonar. De un entregado solo se conserva su clave y la hora. Tampoco se registran datos personales ni bancarios en los logs.

const NOTIFY_RETRY_DELAYS_MS = [30_000, 120_000, 600_000]
const NOTIFY_MAX_PENDING = 200
const NOTIFY_PENDING_TTL_MS = 30 * 60_000
const NOTIFY_MAX_DELIVERED = 5000
const NOTIFY_DELIVERED_TTL_MS = 24 * 60 * 60_000
const NOTIFY_WAIT_MS = 4_000

export interface ComplementaryMessage { subject: string, text: string, html: string, replyTo?: string }
interface NotifyEntry { attempts: number, at: number, mail: MailConfig, tag: string, form: string, msg?: ComplementaryMessage, timer?: ReturnType<typeof setTimeout>, gaveUp?: boolean }
const pending = new Map<string, NotifyEntry>()
const delivered = new Map<string, number>()
const notifyInFlight = new Set<Promise<unknown>>()
export type NotifyResult = 'sent' | 'pending' | 'skipped'

/** Entregado = recordado y dentro de su plazo de 24 h (pasado el plazo se olvida: sin persistencia no se puede recordar más). */
function isDelivered(key: string, now: number): boolean {
  const at = delivered.get(key)
  if (at === undefined) return false
  if (now - at >= NOTIFY_DELIVERED_TTL_MS) { delivered.delete(key); return false }
  return true
}

/** Estado de la notificación de un registro (pruebas y diagnóstico): no expone datos personales. */
export function notificationState(key: string): 'sent' | 'pending' | 'gave_up' | undefined {
  if (isDelivered(key, Date.now())) return 'sent'
  const n = pending.get(key)
  return n ? (n.gaveUp ? 'gave_up' : 'pending') : undefined
}

/** Espera a que terminen los envíos en curso (pruebas y apagado ordenado). */
export async function settleNotifications() {
  while (notifyInFlight.size) await Promise.allSettled([...notifyInFlight])
}

function resetNotifications() {
  for (const n of pending.values()) if (n.timer) clearTimeout(n.timer)
  pending.clear()
  delivered.clear()
}

const track = <T>(p: Promise<T>) => {
  notifyInFlight.add(p)
  void p.finally(() => notifyInFlight.delete(p)).catch(() => {})
  return p
}

function purgeNotifications(now: number) {
  for (const [k, at] of delivered) if (now - at >= NOTIFY_DELIVERED_TTL_MS) delivered.delete(k)
  while (delivered.size >= NOTIFY_MAX_DELIVERED) delivered.delete(delivered.keys().next().value as string)
  for (const [k, n] of pending) if (now - n.at >= NOTIFY_PENDING_TTL_MS) { if (n.timer) clearTimeout(n.timer); pending.delete(k) }
  while (pending.size >= NOTIFY_MAX_PENDING) {
    const oldest = pending.keys().next().value as string
    const n = pending.get(oldest)
    if (n?.timer) clearTimeout(n.timer)
    pending.delete(oldest) // el más antiguo se descarta (límite de memoria): su correo no se entregará
  }
}

function markDelivered(key: string) {
  const n = pending.get(key)
  if (n?.timer) clearTimeout(n.timer)
  pending.delete(key)
  delivered.set(key, Date.now())
}

async function attemptNotify(key: string): Promise<NotifyResult> {
  const n = pending.get(key)
  if (!n || !n.msg) return isDelivered(key, Date.now()) ? 'sent' : 'skipped'
  if (n.timer) { clearTimeout(n.timer); n.timer = undefined }
  try {
    await deliverFormMail({ tag: n.tag, form: n.form, print: key, now: Date.now(), mail: n.mail, ...n.msg })
    markDelivered(key)
    return 'sent'
  } catch (e: any) {
    // 409 = ese mismo correo ya fue aceptado hace poco (o hay un envío en curso): no se envía otro.
    if (e?.statusCode === 409) { markDelivered(key); return 'sent' }
    n.attempts += 1
    const delay = NOTIFY_RETRY_DELAYS_MS[n.attempts - 1]
    if (delay === undefined) {
      n.gaveUp = true
      n.msg = undefined // libera los datos personales retenidos
      console.error(`[${n.tag}] correo de respaldo sin entregar tras ${n.attempts} intentos (el registro principal se conservó)`)
      return 'pending'
    }
    n.timer = setTimeout(() => { void track(attemptNotify(key)) }, delay)
    n.timer.unref?.()
    return 'pending'
  }
}

/**
 * Envía (o reintenta) el correo de respaldo de un registro ya confirmado por Hub/CRM. Nunca lanza.
 * `build` se evalúa UNA vez, solo si no hay ya un mensaje pendiente para esa clave; el mensaje construido es lo único que se retiene.
 * Espera como máximo NOTIFY_WAIT_MS el resultado (los llamadores del flujo principal ni siquiera esperan: ver `void` en prpEnrollment/valuation).
 */
export async function notifyComplementary(opts: { tag: string, form: string, key: string, mail: MailConfig | null, build: () => ComplementaryMessage }): Promise<NotifyResult> {
  try {
    if (!opts.mail) return 'skipped'
    const now = Date.now()
    if (isDelivered(opts.key, now)) return 'sent'
    purgeNotifications(now)
    const cur = pending.get(opts.key)
    if (!cur || cur.gaveUp) {
      pending.set(opts.key, { attempts: 0, at: now, mail: opts.mail, tag: opts.tag, form: opts.form, msg: opts.build() })
    } else {
      cur.mail = opts.mail // pendiente: se conserva el mensaje ya construido
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    const budget = new Promise<NotifyResult>((resolve) => { timer = setTimeout(() => resolve('pending'), NOTIFY_WAIT_MS); timer.unref?.() })
    try { return await Promise.race([track(attemptNotify(opts.key)), budget]) } finally { if (timer) clearTimeout(timer) }
  } catch {
    console.error(`[${opts.tag}] error inesperado en la notificación complementaria`)
    return 'skipped'
  }
}

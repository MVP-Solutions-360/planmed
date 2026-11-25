// Registro del cliente en el CRM Médico (POST JSON a …/api/chat/create/client). SOLO servidor.
//
// Mecanismo tomado de Crediestética (server/utils/valuationPayment.ts, commit 536c1f8: crmPhone, buildCrmClientPayload, crmChatConfirmed, registerCrmClient)
// y adaptado a Planmed: se añade `city`, `ad_headline` es «Quiero más info» y el teléfono lleva «+57». No se portan las piezas propias del
// pago (idempotencia persistente por pago, ejecución en segundo plano): aquí el usuario espera el resultado y el bloqueo de reenvíos vive en ./valuation.
//
//  · Sin reintentos y sin seguir redirecciones (reenviarían datos personales a otro host).
//  · No se registra ningún dato personal, ni el payload ni el cuerpo de la respuesta.
//  · TRAZA: una sola línea por petición (identificador, clasificación, motivo, código HTTP, duración y NOMBRES de las claves de primer nivel de la respuesta;
//    nunca sus valores, cabeceras ni la URL). Se queda en el servidor: nada de esto llega al navegador.
//  · El destino es configuración (NUXT_CRM_CLIENT_URL), vacío por defecto: sin él no sale ninguna petición.

import type { ValuationInput } from '#shared/utils/valuation'
import { randomUUID } from 'node:crypto'

import { cleanLine } from './formMail'

/** Valores confirmados para Planmed. Se pueden sustituir por entorno (NUXT_CRM_CLIENT_LINE_ID / NUXT_CRM_CLIENT_ADVISOR_EMAIL). */
export const CRM_CLIENT_DEFAULTS = { lineId: 12, advisorEmail: 'disenadoraplanmed@gmail.com' } as const
export const CRM_CLIENT_AD_HEADLINE = 'Quiero más info'
export const CRM_CLIENT_TIMEOUT_MS = 15_000

export interface CrmClientConfig { url: string, lineId: number, advisorEmail: string }

export interface CrmClientPayload {
  name: string
  phone: string
  city: string
  identificacion: string
  ad_headline: string
  advisor_email: string
  id_line: number
}

const oneLine = (s: string) => cleanLine(s).replace(/\s+/g, ' ')

/**
 * Teléfono para el CRM. Un celular colombiano sale con «+57» sin duplicar el indicativo (3001234567, 573001234567 o +57 300 123 4567), y se respeta un número
 * que ya venga escrito con «+57». Para cualquier otro (fijo, extranjero) no hay regla confirmada: igual que en la referencia, se envían solo sus dígitos.
 */
export function crmPhone(phone: string): string {
  const raw = phone.trim()
  const digits = raw.replace(/\D/g, '')
  const international = raw.startsWith('+')
  if (!international && digits.length === 10 && digits.startsWith('3')) return `+57${digits}`
  if (digits.length === 12 && digits.startsWith('573')) return `+${digits}`
  if (international && digits.startsWith('57')) return `+${digits}`
  return digits
}

/** Cuerpo EXACTO que recibe el CRM, a partir del formulario ya validado. */
export function buildCrmClientPayload(v: ValuationInput, cfg: Pick<CrmClientConfig, 'lineId' | 'advisorEmail'>): CrmClientPayload {
  if (!v.accept) throw new Error('Formulario no validado.')
  return {
    name: oneLine(`${v.nombres} ${v.apellidos}`),
    phone: crmPhone(v.telefono),
    city: oneLine(v.direccion),
    identificacion: v.identificacion,
    ad_headline: CRM_CLIENT_AD_HEADLINE,
    advisor_email: cfg.advisorEmail,
    id_line: cfg.lineId
  }
}

/** Solo https (o http en la propia máquina, para pruebas) y sin usuario ni contraseña en la URL. */
function validDestination(url: string): boolean {
  let u: URL
  try { u = new URL(url) } catch { return false }
  if (u.username || u.password) return false
  const host = u.hostname.toLowerCase()
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(host) || host.endsWith('.localhost') || host.endsWith('.test')
  return u.protocol === 'https:' || (u.protocol === 'http:' && local)
}

/** Configuración del servidor. `invalid` lista las variables que impiden enviar (nunca sus valores). */
export function resolveCrmClientConfig(runtime: Record<string, unknown>): { ok: true, config: CrmClientConfig } | { ok: false, invalid: string[] } {
  const url = String(runtime.crmClientUrl ?? '').trim()
  const rawLine = String(runtime.crmClientLineId ?? '').trim()
  const lineId = rawLine ? Number(rawLine) : CRM_CLIENT_DEFAULTS.lineId
  const advisorEmail = String(runtime.crmClientAdvisorEmail ?? '').trim() || CRM_CLIENT_DEFAULTS.advisorEmail
  const invalid: string[] = []
  if (!validDestination(url)) invalid.push('NUXT_CRM_CLIENT_URL')
  if (!Number.isInteger(lineId) || lineId <= 0) invalid.push('NUXT_CRM_CLIENT_LINE_ID')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(advisorEmail)) invalid.push('NUXT_CRM_CLIENT_ADVISOR_EMAIL')
  return invalid.length ? { ok: false, invalid } : { ok: true, config: { url, lineId, advisorEmail } }
}

/**
 * Criterio de éxito, copiado de Crediestética. PROVISIONAL: el contrato de respuesta del CRM NO está confirmado. Solo vale un cuerpo JSON (objeto) con una marca
 * POSITIVA explícita (`success: true`, `ok: true` o `status` = success/ok/created) y ninguna marca de fallo. Cualquier otra cosa es ambigua.
 */
export function crmChatConfirmed(data: unknown): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  const d = data as Record<string, unknown>
  if (d.success === false || d.ok === false || d.status === false) return false
  if (d.error || (Array.isArray(d.errors) ? d.errors.length : d.errors)) return false
  if (typeof d.status === 'string' && /^(error|fail|failed|failure)$/i.test(d.status)) return false
  return d.success === true || d.ok === true || (typeof d.status === 'string' && /^(success|ok|created)$/i.test(d.status))
}

/** Códigos de red que demuestran que NO se llegó a conectar (la petición no salió). */
const CRM_NO_CONNECTION_CODES = new Set(['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'])

/** `failed` solo si TODOS los códigos de la cadena de causas demuestran que no hubo conexión; cualquier otra duda es `unknown`. */
export function classifyCrmError(error: unknown): 'failed' | 'unknown' {
  const codes: string[] = []
  const seen = new Set<unknown>()
  let abort = false
  const walk = (e: any, depth: number) => {
    if (!e || typeof e !== 'object' || seen.has(e) || depth > 8) return
    seen.add(e)
    if (e.name === 'TimeoutError' || e.name === 'AbortError') abort = true
    if (typeof e.code === 'string') codes.push(e.code)
    if (e.cause) walk(e.cause, depth + 1)
    if (Array.isArray(e.errors)) for (const x of e.errors) walk(x, depth + 1)
  }
  walk(error, 0)
  return !abort && codes.length > 0 && codes.every(c => CRM_NO_CONNECTION_CODES.has(c)) ? 'failed' : 'unknown'
}

/** 4xx transitorios: el resto de 4xx es un rechazo que no se resuelve repitiendo la misma petición. */
const CRM_RETRYABLE_HTTP = new Set([408, 429])

export type CrmClientReason =
  | 'confirmed' | 'unconfirmed_response' | 'http_rejected' | 'http_retryable' | 'redirect_not_followed' | 'http_other'
  | 'no_connection' | 'timeout' | 'no_response'

export interface CrmClientResult {
  /** `sent` = confirmado · `failed` = rechazado o nunca salió · `unknown` = no se sabe si el cliente quedó creado. */
  state: 'sent' | 'failed' | 'unknown'
  reason: CrmClientReason
  status?: number
  /** Cuerpo del 422, solo para señalar campos al usuario. No se registra. */
  body?: unknown
}

/** Qué se pudo leer de la respuesta. `ilegible` = el cuerpo no terminó de llegar (corte o tiempo agotado). */
export type CrmResponseKind = 'json' | 'json_no_objeto' | 'no_json' | 'ilegible' | 'sin_respuesta'

const LOG_KEY_RE = /^[A-Za-z_][A-Za-z0-9_.-]{0,39}$/
const LOG_MAX_KEYS = 20
const HIDDEN_KEY = '[omitida]'

/**
 * Nombres de las claves de primer nivel, NUNCA sus valores. Una respuesta podría usar datos como nombre de clave, así que se oculta la que no parezca un nombre
 * de campo (caracteres raros, más de 40, 4 o más cifras seguidas) o que repita una palabra del nombre, la ciudad o el documento enviados.
 */
export function crmResponseKeys(data: unknown, payload: CrmClientPayload): string[] {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return []
  const words = (s: string) => s.toLowerCase().split(/[\s_.-]+/).filter(Boolean)
  const personal = new Set([payload.name, payload.city, payload.identificacion].flatMap(words))
  const keys = Object.keys(data)
  const shown = keys.slice(0, LOG_MAX_KEYS).map(k => (LOG_KEY_RE.test(k) && !/\d{4}/.test(k) && !words(k).some(w => personal.has(w)) ? k : HIDDEN_KEY))
  return keys.length > LOG_MAX_KEYS ? [...shown, `(+${keys.length - LOG_MAX_KEYS})`] : shown
}

const LOG_CLASS = { sent: 'confirmado', failed: 'rechazado', unknown: 'incierto' } as const

/** Línea de traza. Solo recibe datos ya saneados; un fallo al escribirla no puede alterar el resultado del registro. */
function logCrmCall(entry: { id: string, result: CrmClientResult, ms: number, kind: CrmResponseKind, keys: string[] }) {
  const { id, result, ms, kind, keys } = entry
  const line = `[valuation] crm-registro id=${id} clasificacion=${LOG_CLASS[result.state]} motivo=${result.reason} http=${result.status ?? '-'} duracion_ms=${ms} respuesta=${kind} claves=${keys.join(',') || '-'}`
  try {
    if (result.state === 'sent') console.info(line)
    else console.warn(line)
  } catch { /* la traza es accesoria */ }
}

/** Una única petición al CRM. Nunca lanza: devuelve la clasificación del resultado. */
export async function registerCrmClient(config: CrmClientConfig, payload: CrmClientPayload): Promise<CrmClientResult> {
  const id = randomUUID()
  const started = performance.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CRM_CLIENT_TIMEOUT_MS)
  let kind: CrmResponseKind = 'sin_respuesta'
  let keys: string[] = []
  const done = (result: CrmClientResult): CrmClientResult => {
    logCrmCall({ id, result, ms: Math.round(performance.now() - started), kind, keys })
    return result
  }
  try {
    const res = await fetch(config.url, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'manual',
      signal: controller.signal
    })
    const status = res.status
    // El cuerpo se lee una vez para la traza; en los códigos que no son 2xx NO influye en la clasificación.
    let data: unknown = null
    try {
      data = await res.json()
      kind = data && typeof data === 'object' && !Array.isArray(data) ? 'json' : 'json_no_objeto'
      keys = crmResponseKeys(data, payload)
    } catch (error) {
      kind = !controller.signal.aborted && (error as Error)?.name === 'SyntaxError' ? 'no_json' : 'ilegible'
    }
    if (status >= 200 && status < 300) {
      return done(crmChatConfirmed(data) ? { state: 'sent', reason: 'confirmed', status } : { state: 'unknown', reason: 'unconfirmed_response', status })
    }
    if (status >= 400 && status < 500) {
      const body = status === 422 ? data : undefined
      return done({ state: 'failed', reason: CRM_RETRYABLE_HTTP.has(status) ? 'http_retryable' : 'http_rejected', status, body })
    }
    if (status >= 300 && status < 400) return done({ state: 'unknown', reason: 'redirect_not_followed', status })
    return done({ state: 'unknown', reason: 'http_other', status })
  } catch (error) {
    if (classifyCrmError(error) === 'failed') return done({ state: 'failed', reason: 'no_connection' })
    return done({ state: 'unknown', reason: controller.signal.aborted ? 'timeout' : 'no_response' })
  } finally {
    clearTimeout(timer)
  }
}

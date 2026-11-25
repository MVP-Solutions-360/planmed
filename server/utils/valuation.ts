import type { H3Event } from 'h3'
import { createHash } from 'node:crypto'
import { normalizeValuation, validateValuation, type ValuationErrors, type ValuationInput } from '#shared/utils/valuation'

import {
  VALUATION_RECIPIENTS, cleanLine, notifyComplementary, renderFormEmail, resolveMailConfig,
  type MailSection, type NotifyResult
} from './formMail'
import { registerCrmClient, resolveCrmClientConfig, type CrmClientResult } from './crmClient'

// Solicitud de valoración → CRM Médico (formulario multipart, ver ./crmClient). Solo servidor.
//  · Valida TODO antes de llamar al CRM (una petición inválida nunca llega a él).
//  · Sin reintentos: un timeout, un error del servidor del CRM o una respuesta ambigua pueden haber creado el registro; repetirlo duplicaría.
//  · No se registra ningún dato personal ni el payload (solo el resultado: estado HTTP del CRM y el motivo).
//  · Límite por IP y bloqueo de reenvíos por huella SHA-256 de cédula + teléfono (sin guardar los datos): 2 minutos tras un registro confirmado y
//    24 horas tras un resultado incierto o un error 5xx del CRM. Vive en memoria: se pierde al reiniciar y no se comparte entre instancias.

//  · CORREO COMPLEMENTARIO: después de que el CRM CONFIRMA el registro se envía un correo con la solicitud (NUXT_VALUATION_TO/CC). Nunca sustituye al CRM ni
//    altera su resultado: si el correo falla el registro sigue vigente y el usuario no ve error (cola de reintento en memoria, ver ./formMail).
//    Si el CRM no confirma no se envía correo ni se afirma que se registró.

const TAG = 'valuation'
const FORM = 'valuation'
const RATE = { max: 8, windowMs: 10 * 60_000 }
const DUPLICATE_WINDOW_MS = 2 * 60_000
const UNCERTAIN_WINDOW_MS = 24 * 60 * 60_000

const hits = new Map<string, number[]>()
const inflight = new Set<string>()
const accepted = new Map<string, number>()
const uncertain = new Map<string, number>()

/** Solo pruebas: vacía el estado en memoria. */
export function resetValuationGuards() {
  hits.clear()
  inflight.clear()
  accepted.clear()
  uncertain.clear()
}

function fail(statusCode: number, message: string, data: Record<string, unknown> = {}): never {
  throw createError({ statusCode, message, data: { message, ...data } })
}

function rateLimited(key: string, now: number): boolean {
  const recent = (hits.get(key) ?? []).filter(t => now - t < RATE.windowMs)
  if (recent.length >= RATE.max) { hits.set(key, recent); return true }
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every(t => now - t >= RATE.windowMs)) hits.delete(k)
  return false
}

/** Mismo celular colombiano escrito con o sin indicativo (3001234567, +57 300 123 4567) => misma huella. */
const phoneKey = (phone: string) => phone.replace(/\D/g, '').replace(/^57(?=3\d{9}$)/, '')

const fingerprint = (v: { identificacion: string, telefono: string }) =>
  createHash('sha256').update(`${v.identificacion.toUpperCase()}|${phoneKey(v.telefono)}`).digest('hex')

const MSG_UNCERTAIN = 'No pudimos confirmar el registro. Antes de reenviar, comunícate con nosotros para evitar duplicados.'
const MSG_NOT_REGISTERED = 'No pudimos registrar tus datos. Inténtalo de nuevo en unos minutos.'

/** Campos que el CRM y el formulario llaman igual. Los identificadores internos (id_user, id_line…) no son campos del usuario. */
const CRM_FORM_FIELDS: ReadonlyArray<keyof ValuationInput> = [
  'nombres', 'apellidos', 'identificacion', 'fecha_nacimiento', 'direccion', 'telefono', 'email', 'name_surgery', 'forma_pago', 'accept'
]

/** Errores del CRM por campo, para señalar un error de validación (422) sin repetir el cuerpo del CRM. */
function crmFieldErrors(body: unknown): ValuationErrors {
  const src = ((body && typeof body === 'object' ? (body as { errors?: unknown }).errors : null) ?? {}) as Record<string, unknown>
  const out: Record<string, string> = {}
  for (const field of CRM_FORM_FIELDS) {
    const raw = src[field]
    const msg = Array.isArray(raw) ? raw[0] : raw
    if (typeof msg === 'string' && msg.length < 200) out[field] = msg
  }
  return out as ValuationErrors
}

/** Traduce un resultado no confirmado a la respuesta de la ruta. */
function failFromCrm(result: CrmClientResult): never {
  if (result.state === 'unknown') {
    if (result.reason === 'timeout') fail(504, MSG_UNCERTAIN, { reason: 'timeout', uncertain: true })
    if (result.reason === 'no_response') fail(503, MSG_UNCERTAIN, { reason: 'network', uncertain: true })
    fail(502, MSG_UNCERTAIN, { reason: result.reason === 'unconfirmed_response' ? 'unconfirmed' : 'crm_error', uncertain: true })
  }
  if (result.reason === 'internal_error') fail(500, MSG_NOT_REGISTERED, { reason: 'internal_error' })
  // No se pudo abrir la sesión: los datos del paciente no llegaron a enviarse y se puede reintentar.
  if (result.reason.startsWith('session_')) fail(503, MSG_NOT_REGISTERED, { reason: 'crm_session' })
  if (result.reason === 'no_connection') fail(503, 'No pudimos conectar para registrar tus datos. Inténtalo de nuevo en unos minutos.', { reason: 'network' })
  if (result.status === 422) fail(422, 'El registro no pudo validarse. Revisa los datos ingresados.', { reason: 'crm_validation', errors: crmFieldErrors(result.body) })
  if (result.reason === 'http_retryable') fail(502, MSG_NOT_REGISTERED, { reason: 'crm_error' })
  fail(502, 'No pudimos registrar tus datos. Comunícate con nosotros para completar tu solicitud.', { reason: 'crm_error' })
}

/** Manejador de POST /api/forms/valuation. Devuelve { ok: true } solo si el CRM confirma el registro. */
export async function handleValuation(event: H3Event) {
  assertSameOrigin(event)
  setHeader(event, 'Cache-Control', 'no-store')

  const now = Date.now()
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  if (rateLimited(ip, now)) fail(429, 'Recibimos demasiados intentos. Espera unos minutos e inténtalo de nuevo.', { reason: 'rate_limited' })

  const value = normalizeValuation(await readBody(event).catch(() => null))
  const errors = validateValuation(value)
  if (Object.keys(errors).length) fail(422, 'Revisa los datos ingresados.', { reason: 'validation', errors })

  const print = fingerprint(value)
  const doubt = uncertain.get(print)
  if (doubt && now - doubt < UNCERTAIN_WINDOW_MS) fail(409, MSG_UNCERTAIN, { reason: 'duplicate', uncertain: true })
  const last = accepted.get(print)
  if (inflight.has(print) || (last && now - last < DUPLICATE_WINDOW_MS)) {
    fail(409, 'Ya recibimos tu solicitud. No es necesario enviarla de nuevo.', { reason: 'duplicate' })
  }

  const crm = resolveCrmClientConfig(useRuntimeConfig(event) as Record<string, unknown>)
  if (!crm.ok) {
    console.error(`[${TAG}] registro en el CRM no configurado (${crm.invalid.join(', ')})`)
    fail(503, 'El envío no está disponible en este momento.', { reason: 'not_configured' })
  }

  inflight.add(print)
  try {
    const result = await registerCrmClient(crm.config, value)
    if (result.state !== 'sent') {
      console.error(`[${TAG}] CRM: ${result.state} (${result.reason}${result.status ? `, HTTP ${result.status}` : ''})`)
      // Un 5xx se informa como error, pero el CRM pudo haber guardado el registro antes de fallar: tampoco se permite reenviar.
      if (result.state === 'unknown' || result.reason === 'http_server_error') {
        if (uncertain.size > 5000) for (const [k, t] of uncertain) if (now - t >= UNCERTAIN_WINDOW_MS) uncertain.delete(k)
        uncertain.set(print, now)
      }
      failFromCrm(result)
    }

    accepted.set(print, now)
    // CRM confirmó: correo de RESPALDO en segundo plano (la respuesta no espera al SMTP; `notifyValuationByEmail` no lanza ni cambia este resultado).
    void notifyValuationByEmail(event, value, print)
    return { ok: true }
  } finally {
    inflight.delete(print)
  }
}

/** Asunto, texto y HTML del correo. Todo valor se escapa. */
export function buildValuationEmail(input: { brand: string, receivedAt: Date, value: ValuationInput }) {
  const { brand, value: v } = input
  const l = cleanLine
  const sections: MailSection[] = [
    { title: 'Procedimiento solicitado', rows: [
      { label: 'Cirugía de interés', value: l(v.name_surgery) },
      { label: 'Forma de pago', value: l(v.forma_pago) }
    ] },
    { title: 'Solicitante', rows: [
      { label: 'Nombres', value: l(v.nombres) },
      { label: 'Apellidos', value: l(v.apellidos) },
      { label: 'Número de cédula', value: l(v.identificacion) },
      { label: 'Fecha de nacimiento', value: l(v.fecha_nacimiento) },
      { label: 'Ciudad', value: l(v.direccion) }
    ] },
    { title: 'Contacto', rows: [
      { label: 'Teléfono', value: l(v.telefono) },
      { label: 'Correo electrónico', value: l(v.email) }
    ] },
    { title: 'Autorización', rows: [{ label: 'Política de tratamiento de datos personales', value: 'Aceptada por el solicitante en el formulario' }] }
  ]
  const subject = l(`[${brand}] Nueva solicitud de valoración`).slice(0, 150)
  const { text, html } = renderFormEmail({
    brand,
    title: 'Nueva solicitud de valoración',
    receivedAt: input.receivedAt,
    sections,
    footer: 'Mensaje generado automáticamente por el formulario web. Contiene datos personales: trátalo como confidencial.'
  })
  return { subject, text, html }
}

/** Correo de respaldo de una valoración que el CRM ya confirmó. Nunca lanza ni altera el resultado del CRM: `sent`, `pending` (cola de reintento) o `skipped`. */
export async function notifyValuationByEmail(event: H3Event, value: ValuationInput, key: string): Promise<NotifyResult> {
  try {
    const runtime = useRuntimeConfig(event) as Record<string, any>
    const mail = resolveMailConfig(runtime, VALUATION_RECIPIENTS)
    if (!mail.ok) {
      console.error(`[${TAG}] correo complementario omitido: configuración incompleta (${mail.invalid.join(', ')})`)
      return 'skipped'
    }
    const brand = String(runtime.public?.appName || 'Planmed')
    return await notifyComplementary({
      tag: TAG,
      form: FORM,
      key: `valuation|${key}`,
      mail: mail.config,
      build: () => ({ ...buildValuationEmail({ brand, receivedAt: new Date(), value }), replyTo: value.email })
    })
  } catch {
    // Cualquier fallo de configuración o de correo queda aquí: jamás llega al resultado confirmado de Hub/CRM. Solo un texto fijo (sin datos).
    console.error(`[${TAG}] correo complementario omitido: error inesperado`)
    return 'skipped'
  }
}

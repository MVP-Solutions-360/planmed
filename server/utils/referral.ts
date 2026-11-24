import type { H3Event } from 'h3'
import { createHmac } from 'node:crypto'
import { buildHubPayload, isTransfer, normalizeEnrollment, validateEnrollment, type EnrollmentInput } from '#shared/utils/prpEnrollment'
import {
  REFERRAL_RECIPIENTS, cleanLine, formFail, isRateLimited, notificationState, notifyComplementary, renderFormEmail, resolveMailConfig,
  type MailSection, type NotifyResult
} from './formMail'

// Programa de referidos (ReferralForm, «Regístrate en el programa»): CORREO COMPLEMENTARIO. Solo servidor.
// ATENCIÓN: NO es el PRP de pacientes (PrpLeadForm, /prp/[slug], CRM PTD).
// Wellezy Hub es el DESTINO PRINCIPAL y el único que confirma la inscripción (server/utils/prpEnrollment.ts → POST /v1/web/prp-enrollments). Este módulo
// solo agrega un correo de RESPALDO que se envía DESPUÉS de que Hub confirmó:
//  · El correo nunca altera el resultado de Hub: si falla, la inscripción sigue registrada, el usuario no ve ningún error y el envío queda en cola de
//    reintento en memoria (ver `notifyComplementary` en ./formMail). Si Hub falla, no se envía correo ni se afirma que se registró.
//  · Reintentar la misma inscripción (misma clave de idempotencia) nunca crea otra en Hub. El correo se deduplica SOLO dentro de este proceso (memoria): tras un
//    reinicio, en otra instancia o pasadas 24 h un reenvío puede volver a enviarlo. NO hay garantía de «exactamente una vez» (ver LÍMITES en ./formMail).
//  · Destinatarios: NUXT_REFERRAL_TO/CC (servidor). Asunto fijo: «[Marca] Nueva inscripción al programa de referidos». Sin NUXT_REFERRAL_TO el correo se omite.
//  · DATOS BANCARIOS: el correo lleva el titular y SOLO los últimos 4 dígitos del documento del titular y de la cuenta; el número completo no viaja por correo.
//  · POST /api/forms/referral solo REINTENTA la notificación de una inscripción que Hub ya confirmó (no registra nada ni llama a Hub).

const TAG = 'referral'
const FORM = 'referral'

/** Clave de idempotencia de Hub: HMAC (secreto del servidor) del payload COMPLETO; también identifica la notificación de esa inscripción. */
export const enrollmentKey = (secret: string, payload: unknown) =>
  createHmac('sha256', secret).update(`prp-enrollment-v1|${JSON.stringify(payload)}`).digest('hex').slice(0, 48)

/** Oculta todo menos los últimos 4 caracteres. */
export const maskTail = (s: string) => (s.length <= 4 ? '****' : `****${s.slice(-4)}`)

/** Asunto, texto y HTML del correo. Todo valor se escapa. */
export function buildReferralEmail(input: { brand: string, receivedAt: Date, value: EnrollmentInput }) {
  const { brand, value: v } = input
  const l = cleanLine
  const transfer = isTransfer(v.payment_method)
  const sections: MailSection[] = [
    { title: 'Participante', rows: [
      { label: 'Nombre completo', value: l(v.full_name) },
      { label: 'WhatsApp / celular', value: l(v.phone) },
      { label: 'Correo electrónico', value: l(v.email) },
      { label: 'Tipo de documento', value: l(v.document_type) },
      { label: 'Número de documento', value: l(v.document_number) }
    ] },
    { title: 'Cirugía realizada', rows: [
      { label: 'Fecha de la cirugía', value: l(v.surgery_date) },
      { label: 'Cirugía', value: l(v.surgery_name) }
    ] },
    { title: 'Preferencias', rows: [
      { label: '¿Desea cita de control?', value: v.wants_control ? 'Sí' : 'No' },
      { label: 'Pago de la bonificación', value: l(v.payment_method) }
    ] }
  ]
  if (transfer) {
    sections.push({ title: 'Datos bancarios (parcialmente ocultos)', rows: [
      { label: 'Titular', value: l(v.bank_holder_name) },
      { label: 'Documento del titular', value: maskTail(l(v.bank_holder_document)) },
      { label: 'Cuenta', value: maskTail(l(v.bank_account_number)) },
      { label: 'Nota', value: 'Por seguridad, el número completo de cuenta no se envía por correo.' }
    ] })
  }
  if (v.suggestion) sections.push({ title: 'Sugerencia', rows: [{ label: 'Comentario de la participante', value: v.suggestion.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/g, ' ') }] })
  sections.push({ title: 'Aceptación', rows: [{ label: 'Condiciones del programa de referidos', value: 'Aceptadas por la participante en el formulario' }] })

  const subject = l(`[${brand}] Nueva inscripción al programa de referidos`).slice(0, 150)
  const { text, html } = renderFormEmail({
    brand,
    title: 'Nueva inscripción al programa de referidos',
    receivedAt: input.receivedAt,
    sections,
    footer: 'Mensaje generado automáticamente por el formulario web. Contiene datos personales: trátalo como confidencial.'
  })
  return { subject, text, html }
}

/** Correo de respaldo de una inscripción que Hub ya confirmó. Nunca lanza: devuelve `sent`, `pending` (en cola de reintento) o `skipped` (sin correo configurado). */
export async function notifyReferralByEmail(event: H3Event, value: EnrollmentInput, key: string): Promise<NotifyResult> {
  try {
    const runtime = useRuntimeConfig(event) as Record<string, any>
    const mail = resolveMailConfig(runtime, REFERRAL_RECIPIENTS)
    if (!mail.ok) {
      console.error(`[${TAG}] correo de respaldo omitido: configuración incompleta (${mail.invalid.join(', ')})`)
      return 'skipped'
    }
    const brand = String(runtime.public?.appName || 'Planmed')
    return await notifyComplementary({
      tag: TAG,
      form: FORM,
      key,
      mail: mail.config,
      build: () => ({ ...buildReferralEmail({ brand, receivedAt: new Date(), value }), replyTo: value.email })
    })
  } catch {
    // Cualquier fallo de configuración o de correo queda aquí: jamás llega al resultado confirmado de Hub/CRM. Solo un texto fijo (sin datos).
    console.error(`[${TAG}] correo complementario omitido: error inesperado`)
    return 'skipped'
  }
}

/**
 * Manejador de POST /api/forms/referral: REINTENTA el correo de respaldo de una inscripción que Hub ya confirmó. No registra nada ni llama a Hub:
 * si la inscripción no consta como confirmada en este proceso responde 409 y no envía correo (nadie puede usarlo para enviar correos sin Hub).
 */
export async function handleReferral(event: H3Event) {
  assertSameOrigin(event)
  setHeader(event, 'Cache-Control', 'no-store')
  const runtime = useRuntimeConfig(event) as Record<string, any>
  if (isRateLimited(FORM, event, runtime, Date.now())) formFail(429, 'Recibimos demasiados intentos. Espera unos minutos e inténtalo de nuevo.', { reason: 'rate_limited' })

  const length = Number(getRequestHeader(event, 'content-length'))
  if (!Number.isFinite(length) || length <= 0) formFail(411, 'No pudimos procesar el envío. Inténtalo de nuevo.', { reason: 'length_required' })
  if (length > 16 * 1024) formFail(413, 'El envío es demasiado grande.', { reason: 'too_large' })
  if (!String(getRequestHeader(event, 'content-type') ?? '').toLowerCase().startsWith('application/json')) {
    formFail(415, 'No pudimos procesar el envío. Inténtalo de nuevo.', { reason: 'malformed' })
  }
  const value = normalizeEnrollment(await readBody(event).catch(() => null))
  const errors = validateEnrollment(value)
  if (Object.keys(errors).length) formFail(422, 'Revisa los datos ingresados.', { reason: 'validation', errors })

  const secret = String(runtime.sessionPassword || '')
  if (secret.length < 32) formFail(503, 'No pudimos procesar el envío. Inténtalo de nuevo en unos minutos.', { reason: 'unavailable' })
  const key = enrollmentKey(secret, buildHubPayload(value))
  const state = notificationState(key)
  if (state === 'sent') return { ok: true, notification: 'sent' as NotifyResult }
  if (state !== 'pending') formFail(409, 'Esta inscripción no consta como confirmada.', { reason: 'hub_not_confirmed' })
  return { ok: true, notification: await notifyReferralByEmail(event, value, key) }
}

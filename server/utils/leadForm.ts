import type { H3Event } from 'h3'
import { LEAD_LIMITS, validateLead, type LeadValues } from '#shared/utils/leadForm'
import {
  LEAD_FORM_RECIPIENTS, cleanLine, contentFingerprint, deliverFormMail, fmtMoney, formFail, isRateLimited, renderFormEmail, requireMailConfig,
  type MailSection
} from './formMail'

// Formulario «Solicitud de financiación» (LeadForm) → CORREO ELECTRÓNICO. Solo servidor. Sin CRM: aquí no se llama a ningún CRM.
// Transporte SMTP, configuración, guardas, errores y plantilla base: los comunes de ./formMail. Aquí solo lo propio de este formulario:
//  · El navegador envía JSON; esta ruta VALIDA todo de nuevo (shared/utils/leadForm). Los campos desconocidos se ignoran (cualquier destinatario, copia,
//    remitente o asunto que venga del navegador no tiene efecto: salen de la configuración del servidor).
//  · Destinatarios: NUXT_LEAD_FORM_TO/CC. Asunto fijo en el servidor: «[Marca] Nuevo prospecto de financiación».
//  · Éxito SOLO si el SMTP aceptó el mensaje para todos los destinatarios. No se registran datos personales ni financieros.

const TAG = 'lead-form'
const FORM = 'lead-form'

const META_LABELS: Record<string, string> = {
  doc_type: 'Tipo de documento',
  doc_number: 'Número de documento',
  doc_issue_place: 'Lugar de expedición',
  doc_issue_date: 'Fecha de expedición',
  birth_date: 'Fecha de nacimiento',
  birth_place: 'Lugar de nacimiento',
  occupation: 'Profesión / ocupación',
  dependents: 'Personas a cargo',
  housing_type: 'Tipo de vivienda',
  residence_city: 'Ciudad de residencia',
  surgery_city: 'Ciudad de la cirugía',
  activity_type: 'Tipo de actividad',
  social_security: '¿Aporta seguridad social?',
  monthly_income: 'Ingresos mensuales',
  monthly_expenses: 'Egresos mensuales',
  contract_type: 'Tipo de contrato',
  contract_duration: 'Duración del contrato',
  has_property: '¿Tiene propiedad?',
  has_vehicle: '¿Tiene vehículo?',
  is_reported: '¿Está reportado?'
}
const PERSON = ['doc_type', 'doc_number', 'doc_issue_place', 'doc_issue_date', 'birth_date', 'birth_place', 'occupation', 'dependents', 'housing_type', 'residence_city', 'surgery_city']
const ACTIVITY = ['activity_type', 'social_security', 'monthly_income', 'monthly_expenses', 'contract_type', 'contract_duration', 'has_property', 'has_vehicle', 'is_reported']
const MONEY = new Set(['monthly_income', 'monthly_expenses'])

function sectionsOf(v: LeadValues): MailSection[] {
  const rows = (keys: string[]) => keys.filter(k => v.meta[k] !== undefined).map(k => ({ label: META_LABELS[k]!, value: MONEY.has(k) ? fmtMoney(Number(v.meta[k])) : String(v.meta[k]) }))
  const out: MailSection[] = [
    { title: 'Prospecto', rows: [
      { label: 'Nombre completo', value: v.first_name },
      { label: 'Teléfono celular', value: v.phone },
      ...(v.email ? [{ label: 'Correo electrónico', value: v.email }] : []),
      { label: 'Ciudad', value: v.city }
    ] },
    { title: 'Solicitud de financiación', rows: [
      { label: 'Procedimiento de interés', value: v.procedure_name },
      { label: 'Monto solicitado', value: fmtMoney(v.requested_amount) },
      { label: 'Plazo', value: `${v.installments} cuotas mensuales` },
      ...(v.meta.quote_rate_percent !== undefined ? [{ label: 'Tasa de la cotización (mensual, informativa)', value: `${v.meta.quote_rate_percent} %` }] : []),
      ...(v.meta.quote_monthly_payment !== undefined ? [{ label: 'Cuota mensual estimada (informativa)', value: fmtMoney(Number(v.meta.quote_monthly_payment)) }] : [])
    ] }
  ]
  const person = rows(PERSON)
  if (person.length) out.push({ title: 'Datos del tomador del crédito (preaprobado)', rows: person })
  const activity = rows(ACTIVITY)
  if (activity.length) out.push({ title: 'Actividad económica (preaprobado)', rows: activity })
  if (v.comments) out.push({ title: 'Comentarios', rows: [{ label: 'Comentarios del prospecto', value: v.comments }] })
  out.push({ title: 'Autorización', rows: [{ label: 'Política de tratamiento de datos personales', value: 'Aceptada por el prospecto en el formulario' }] })
  return out
}

/** Asunto, texto y HTML del correo. Todo valor se escapa. */
export function buildLeadEmail(input: { brand: string, receivedAt: Date, values: LeadValues }) {
  const { brand, values } = input
  const subject = cleanLine(`[${brand}] Nuevo prospecto de financiación`).slice(0, 150)
  const { text, html } = renderFormEmail({
    brand,
    title: 'Nuevo prospecto de financiación',
    receivedAt: input.receivedAt,
    sections: sectionsOf(values),
    footer: 'Mensaje generado automáticamente por el formulario web. Contiene datos personales: trátalo como confidencial.'
  })
  return { subject, text, html }
}

/** Manejador de POST /api/forms/lead. Devuelve { ok: true } solo si el servidor SMTP aceptó el mensaje. */
export async function handleLead(event: H3Event) {
  assertSameOrigin(event)
  setHeader(event, 'Cache-Control', 'no-store')

  // Configuración de correo y destinatarios (solo servidor): ANTES de leer el cuerpo y de consumir el límite por IP.
  const { runtime: config, config: mail } = requireMailConfig(event, TAG, LEAD_FORM_RECIPIENTS)

  const now = Date.now()
  if (isRateLimited(FORM, event, config, now)) formFail(429, 'Recibimos demasiados intentos. Espera unos minutos e inténtalo de nuevo.', { reason: 'rate_limited' })

  const length = Number(getRequestHeader(event, 'content-length'))
  if (!Number.isFinite(length) || length <= 0) formFail(411, 'No pudimos procesar el envío. Inténtalo de nuevo.', { reason: 'length_required' })
  if (length > LEAD_LIMITS.maxRequestBytes) formFail(413, 'El envío es demasiado grande.', { reason: 'too_large' })
  if (!String(getRequestHeader(event, 'content-type') ?? '').toLowerCase().startsWith('application/json')) {
    formFail(415, 'No pudimos procesar el envío. Inténtalo de nuevo.', { reason: 'malformed' })
  }

  let body: unknown
  try { body = await readBody(event) } catch { body = undefined }
  const { values, errors } = validateLead(body)
  if (!values) formFail(422, 'Revisa los datos ingresados.', { reason: 'validation', errors })

  const { subject, text, html } = buildLeadEmail({ brand: String(config.public?.appName || 'Planmed'), receivedAt: new Date(now), values })
  return await deliverFormMail({
    tag: TAG,
    form: FORM,
    print: contentFingerprint({ ...values, ...Object.fromEntries(Object.entries(values.meta).map(([k, v]) => [`m_${k}`, v])), meta: undefined }),
    now,
    mail,
    subject,
    text,
    html,
    ...(values.email ? { replyTo: values.email } : {})
  })
}

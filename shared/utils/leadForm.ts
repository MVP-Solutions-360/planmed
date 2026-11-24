// Formulario «Solicitud de financiación» (LeadForm, modal del simulador): definición ÚNICA de campos, listas y reglas, compartida por el componente, el servicio,
// el servidor (POST /api/forms/lead → correo) y las pruebas. Datos personales y financieros: la validación del servidor es la que manda.

export const LEAD_LIMITS = {
  maxRequestBytes: 16 * 1024,
  maxText: 150,
  maxComments: 1000,
  maxAmount: 1_000_000_000,
  maxMoney: 100_000_000_000
} as const

// Listas cerradas del preaprobado (las mismas del formulario).
export const LEAD_DOC_TYPES = ['Cedula ciudadania', 'Tarjeta identidad', 'Numero identificacion personal', 'Pasaporte', 'Permiso permanencia temporal', 'Cedula extranjeria'] as const
export const LEAD_HOUSING = ['Propia', 'Arrendada', 'Familiar'] as const
export const LEAD_ACTIVITY = ['Empleado', 'Independiente'] as const
export const LEAD_CONTRACT = ['Fijo', 'Indefinido', 'Prestacion de servicio'] as const
export const LEAD_CONTRACT_DURATION = ['2 años o mas', 'Menos de 1 año', '1 año o mas'] as const
export const LEAD_YES_NO = ['Si', 'No'] as const
export const LEAD_INSTALLMENTS = [12, 18, 24, 36, 48, 60, 72] as const

/** Carga que envía el navegador (mismo contrato que `LeadData`). */
export interface LeadPayload {
  first_name: string
  phone: string
  email?: string
  city: string
  procedure_name: string
  requested_amount: number
  installments: number
  comments?: string
  accepted_habeas_data?: boolean
  metadata?: Record<string, string | number | boolean | null>
}

/** Valores ya normalizados (todos texto o número; vacío = no informado). */
export interface LeadValues {
  first_name: string
  phone: string
  email: string
  city: string
  procedure_name: string
  requested_amount: number
  installments: number
  comments: string
  accepted_habeas_data: true
  meta: Record<string, string | number>
}

export type LeadErrors = Partial<Record<string, string>>

const MAIL_RE = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]{2,}$/
// eslint-disable-next-line no-control-regex
const CTRL_RE = /[\u0000-\u001f\u007f]/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const str = (v: unknown) => (typeof v === 'string' ? v.replace(CTRL_RE, ' ').replace(/\s+/g, ' ').trim() : '')
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : null))

// Campos opcionales del preaprobado: clave → regla.
type MetaRule = { kind: 'text' } | { kind: 'date' } | { kind: 'list', options: readonly string[] } | { kind: 'money' } | { kind: 'count' } | { kind: 'rate' }
export const LEAD_META: Record<string, MetaRule> = {
  doc_type: { kind: 'list', options: LEAD_DOC_TYPES },
  doc_number: { kind: 'text' },
  doc_issue_place: { kind: 'text' },
  doc_issue_date: { kind: 'date' },
  birth_date: { kind: 'date' },
  birth_place: { kind: 'text' },
  occupation: { kind: 'text' },
  dependents: { kind: 'count' },
  housing_type: { kind: 'list', options: LEAD_HOUSING },
  residence_city: { kind: 'text' },
  surgery_city: { kind: 'text' },
  activity_type: { kind: 'list', options: LEAD_ACTIVITY },
  social_security: { kind: 'list', options: LEAD_YES_NO },
  monthly_income: { kind: 'money' },
  monthly_expenses: { kind: 'money' },
  contract_type: { kind: 'list', options: LEAD_CONTRACT },
  contract_duration: { kind: 'list', options: LEAD_CONTRACT_DURATION },
  has_property: { kind: 'list', options: LEAD_YES_NO },
  has_vehicle: { kind: 'list', options: LEAD_YES_NO },
  is_reported: { kind: 'list', options: LEAD_YES_NO },
  // Condiciones con las que se cotizó (informativas: se calculan en el navegador).
  quote_rate_percent: { kind: 'rate' },
  quote_monthly_payment: { kind: 'money' },
  quote_rate_version: { kind: 'text' }
}

/** Valida y normaliza la carga. Solo se conservan los campos conocidos; los demás se ignoran (en particular cualquier intento de fijar destinatarios). */
export function validateLead(input: unknown): { values: LeadValues | null, errors: LeadErrors } {
  const errors: LeadErrors = {}
  const p = (input && typeof input === 'object' && !Array.isArray(input) ? input : {}) as Record<string, unknown>

  const first_name = str(p.first_name)
  if (first_name.length < 2) errors.first_name = 'El nombre es obligatorio.'
  else if (first_name.length > 120) errors.first_name = 'El nombre es demasiado largo.'

  const phone = str(p.phone)
  const digits = phone.replace(/[\s()+-]/g, '')
  if (!phone) errors.phone = 'El teléfono es obligatorio.'
  else if (!/^\d{7,15}$/.test(digits) || phone.length > 25) errors.phone = 'Ingresa un teléfono válido.'

  const email = str(p.email)
  if (email && (!MAIL_RE.test(email) || email.length > LEAD_LIMITS.maxText)) errors.email = 'Ingresa un correo válido.'

  const city = str(p.city)
  if (!city) errors.city = 'La ciudad es obligatoria.'
  else if (city.length > 80) errors.city = 'La ciudad es demasiado larga.'

  const procedure_name = str(p.procedure_name)
  if (!procedure_name) errors.procedure_name = 'El procedimiento es obligatorio.'
  else if (procedure_name.length > LEAD_LIMITS.maxText) errors.procedure_name = 'El procedimiento es demasiado largo.'

  const amount = num(p.requested_amount)
  if (amount === null || !Number.isInteger(amount) || amount <= 0 || amount > LEAD_LIMITS.maxAmount) errors.requested_amount = 'Ingresa un monto válido.'

  const installments = num(p.installments)
  if (installments === null || !(LEAD_INSTALLMENTS as readonly number[]).includes(installments)) errors.installments = 'Selecciona el plazo en cuotas.'

  const comments = typeof p.comments === 'string' ? p.comments.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/g, ' ').trim() : ''
  if (comments.length > LEAD_LIMITS.maxComments) errors.comments = 'Los comentarios son demasiado largos.'

  if (p.accepted_habeas_data !== true) errors.accepted_habeas_data = 'Debes aceptar la política de tratamiento de datos.'

  const meta: Record<string, string | number> = {}
  const raw = (p.metadata && typeof p.metadata === 'object' && !Array.isArray(p.metadata) ? p.metadata : {}) as Record<string, unknown>
  for (const [key, rule] of Object.entries(LEAD_META)) {
    const v = raw[key]
    if (v === undefined || v === null || v === '') continue
    if (rule.kind === 'text') {
      const t = str(v)
      if (t.length > 80) errors[key] = 'Texto demasiado largo.'
      else if (t) meta[key] = t
    } else if (rule.kind === 'date') {
      const t = str(v)
      if (!DATE_RE.test(t) || Number.isNaN(Date.parse(`${t}T00:00:00Z`))) errors[key] = 'Fecha inválida.'
      else meta[key] = t
    } else if (rule.kind === 'list') {
      const t = str(v)
      if (!rule.options.includes(t)) errors[key] = 'Opción no válida.'
      else meta[key] = t
    } else if (rule.kind === 'rate') {
      const n = num(v)
      if (n === null || n < 0 || n > 100) errors[key] = 'Valor inválido.'
      else meta[key] = n
    } else {
      const n = num(v)
      if (n === null || n < 0 || (rule.kind === 'count' ? n > 50 || !Number.isInteger(n) : n > LEAD_LIMITS.maxMoney)) errors[key] = 'Valor inválido.'
      else meta[key] = rule.kind === 'money' ? Math.round(n) : n
    }
  }
  // El contrato solo aplica a empleados.
  if (meta.activity_type !== 'Empleado') { delete meta.contract_type; delete meta.contract_duration }

  if (Object.keys(errors).length) return { values: null, errors }
  return {
    values: { first_name, phone, email, city, procedure_name, requested_amount: amount!, installments: installments!, comments, accepted_habeas_data: true, meta },
    errors
  }
}

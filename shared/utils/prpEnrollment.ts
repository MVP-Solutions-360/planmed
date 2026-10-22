// Inscripción al Programa de Remisión de Pacientes (PRP / Programa de referidos): formulario «Regístrate en el programa». Módulo PURO
// (sin imports): lo usan el formulario (validación en el navegador), la ruta de Nitro (validación OBLIGATORIA en el servidor) y las pruebas.
//
// Destino: Wellezy Hub (POST /v1/web/prp-enrollments, línea resuelta por el servidor). El envío al CRM médico lo coordina Hub y está
// bloqueado hasta confirmar su contrato: hasta entonces la respuesta es «received» (recibida), nunca un éxito definitivo.

/** Tipos de documento: etiqueta visible → valor que guarda Hub (el mismo formato de `clients.document_type`). */
export const DOCUMENT_TYPES = [
  { label: 'Cédula de ciudadanía', value: 'CÉDULA DE CIUDADANÍA' },
  { label: 'Tarjeta de identidad', value: 'TARJETA DE IDENTIDAD' },
  { label: 'Cédula de extranjería', value: 'CÉDULA DE EXTRANJERÍA' },
  { label: 'Pasaporte', value: 'PASAPORTE' },
  { label: 'NIT', value: 'NIT' },
  { label: 'Otro', value: 'OTRO' }
] as const

export const PAYMENT_METHODS = ['Efectivo', 'Transferencia Bancaria (Bancolombia)'] as const

export interface EnrollmentInput {
  full_name: string
  phone: string
  email: string
  /** Etiqueta visible del tipo de documento. */
  document_type: string
  document_number: string
  surgery_date: string
  surgery_name: string
  wants_control: boolean
  /** Etiqueta visible de la forma de pago. */
  payment_method: string
  suggestion: string
  /** Datos bancarios: SOLO con transferencia (con efectivo se descartan). */
  bank_holder_name: string
  bank_holder_document: string
  bank_account_number: string
  accepted_contract: boolean
}

export type EnrollmentErrors = Partial<Record<keyof EnrollmentInput, string>>

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
export const isTransfer = (paymentLabel: string) => paymentLabel.startsWith('Transferencia')

/** Normaliza el cuerpo: solo campos conocidos; con efectivo los datos bancarios se VACÍAN (nunca se conservan ni se envían). */
export function normalizeEnrollment(body: unknown): EnrollmentInput {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  const transfer = isTransfer(text(b.payment_method))
  return {
    full_name: text(b.full_name),
    phone: text(b.phone),
    email: text(b.email).toLowerCase(),
    document_type: text(b.document_type),
    document_number: text(b.document_number).replace(/[\s.]/g, '').toUpperCase(),
    surgery_date: text(b.surgery_date),
    surgery_name: text(b.surgery_name),
    wants_control: b.wants_control === true,
    payment_method: text(b.payment_method),
    suggestion: text(b.suggestion),
    bank_holder_name: transfer ? text(b.bank_holder_name) : '',
    bank_holder_document: transfer ? text(b.bank_holder_document) : '',
    bank_account_number: transfer ? text(b.bank_account_number).replace(/[\s-]/g, '') : '',
    accepted_contract: b.accepted_contract === true
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function documentOk(value: string, number: string): boolean {
  switch (value) {
    case 'CÉDULA DE CIUDADANÍA':
    case 'CÉDULA DE EXTRANJERÍA': return /^\d{5,12}$/.test(number)
    case 'TARJETA DE IDENTIDAD': return /^\d{8,12}$/.test(number)
    case 'NIT': return /^\d{6,10}-?\d?$/.test(number)
    default: return /^[A-Z0-9-]{5,20}$/.test(number)
  }
}

/** Valida el formulario (un mensaje por campo inválido). `today` se inyecta para poder probarlo. */
export function validateEnrollment(v: EnrollmentInput, today: Date = new Date()): EnrollmentErrors {
  const e: EnrollmentErrors = {}
  const type = DOCUMENT_TYPES.find(t => t.label === v.document_type)

  if (!v.full_name) e.full_name = 'Ingresa tu nombre completo.'
  else if (v.full_name.length < 3 || v.full_name.length > 150) e.full_name = 'Ingresa tu nombre completo (entre 3 y 150 caracteres).'

  const digits = v.phone.replace(/\D/g, '')
  if (!v.phone) e.phone = 'Ingresa tu número de WhatsApp o celular.'
  else if (digits.length < 7 || digits.length > 15 || !/^[+\d\s()-]+$/.test(v.phone)) e.phone = 'Ingresa un número de teléfono válido.'

  if (!v.email) e.email = 'Ingresa tu correo electrónico.'
  else if (v.email.length > 150 || !EMAIL_RE.test(v.email)) e.email = 'Ingresa un correo electrónico válido.'

  if (!type) e.document_type = 'Selecciona el tipo de documento.'
  if (!v.document_number) e.document_number = 'Ingresa tu número de documento.'
  else if (type && !documentOk(type.value, v.document_number)) e.document_number = 'El número de documento no es válido para el tipo seleccionado.'
  else if (!type && !/^[A-Z0-9-]{5,20}$/.test(v.document_number)) e.document_number = 'El número de documento no es válido.'

  if (!v.surgery_date) e.surgery_date = 'Ingresa la fecha de tu cirugía.'
  else {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.surgery_date)
    const d = m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null
    const real = !!m && !!d && d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3])
    if (!real || Number(m![1]) < 1990) e.surgery_date = 'Ingresa una fecha válida.'
    else if (d!.getTime() > Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) e.surgery_date = 'La fecha de la cirugía no puede ser futura.'
  }

  if (!v.surgery_name) e.surgery_name = 'Cuéntanos qué cirugía te practicaste.'
  else if (v.surgery_name.length < 2 || v.surgery_name.length > 150) e.surgery_name = 'Ingresa la cirugía (entre 2 y 150 caracteres).'

  if (!PAYMENT_METHODS.some(p => p === v.payment_method)) e.payment_method = 'Selecciona cómo prefieres el pago de la bonificación.'

  if (v.suggestion.length > 1000) e.suggestion = 'La sugerencia es demasiado larga (máximo 1000 caracteres).'

  if (isTransfer(v.payment_method)) {
    if (!v.bank_holder_name) e.bank_holder_name = 'Ingresa el nombre del titular.'
    else if (v.bank_holder_name.length < 3 || v.bank_holder_name.length > 150) e.bank_holder_name = 'Ingresa el nombre completo del titular.'
    if (!v.bank_holder_document) e.bank_holder_document = 'Ingresa la cédula del titular.'
    else if (!/^[A-Za-z0-9.-]{5,20}$/.test(v.bank_holder_document)) e.bank_holder_document = 'Ingresa un número de cédula válido.'
    if (!v.bank_account_number) e.bank_account_number = 'Ingresa el número de cuenta.'
    else if (!/^\d{6,20}$/.test(v.bank_account_number)) e.bank_account_number = 'El número de cuenta solo debe tener números (entre 6 y 20).'
  }

  if (!v.accepted_contract) e.accepted_contract = 'Debes aceptar las condiciones del contrato de remisión de pacientes para continuar.'
  return e
}

/** Cuerpo que recibe Hub (valores canónicos). Los datos bancarios solo viajan con transferencia. */
export function buildHubPayload(v: EnrollmentInput): Record<string, unknown> {
  const type = DOCUMENT_TYPES.find(t => t.label === v.document_type)
  if (!type || !PAYMENT_METHODS.some(p => p === v.payment_method) || !v.accepted_contract) throw new Error('Formulario no validado.')
  const transfer = isTransfer(v.payment_method)
  return {
    full_name: v.full_name,
    phone: v.phone,
    email: v.email,
    document_type: type.value,
    document_number: v.document_number,
    surgery_date: v.surgery_date,
    surgery_name: v.surgery_name,
    wants_control: v.wants_control,
    payment_method: transfer ? 'transferencia' : 'efectivo',
    suggestion: v.suggestion || null,
    accepted_contract: true,
    ...(transfer ? { bank_holder_name: v.bank_holder_name, bank_holder_document: v.bank_holder_document, bank_account_number: v.bank_account_number } : {})
  }
}

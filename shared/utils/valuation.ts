// Formulario «Pide tu cita de valoración» → CRM médico (POST /crm-public/api/clients/forms). Módulo PURO (sin imports): lo usan el
// formulario (validación en el navegador), la ruta de Nitro (validación OBLIGATORIA en el servidor) y las pruebas.
//
// Contrato de la petición observada del CRM (multipart/form-data): nombres, apellidos, identificacion, fecha_nacimiento, direccion,
// telefono, email, name_surgery, forma_pago, state, origen, id_user, id_line, id_user_asesora, accept. `_token` y `_method` NO se envían:
// el endpoint hermano de PRP funciona sin ellos y no hay evidencia de que este los exija (ver informe: se confirma en la prueba real).

export const VALUATION_STATE = 'No Contactada'
export const VALUATION_ORIGIN = 'Formulario Web'

/** Identificadores del CRM médico indicados por el responsable (formulario de referencia). Se envían desde el SERVIDOR. */
export const VALUATION_CRM_IDS = { id_user: '73', id_line: '16', id_user_asesora: '73' } as const

/**
 * Forma de pago: opciones visibles → valor que recibe el CRM. La única convención observada en la petición real es
 * `forma_pago=financiacion` (minúsculas, sin tilde); `contado` sigue esa misma convención y debe confirmarse con el CRM.
 */
export const PAYMENT_OPTIONS = [
  { label: 'Contado', value: 'contado' },
  { label: 'Financiación', value: 'financiacion' }
] as const
export type PaymentLabel = typeof PAYMENT_OPTIONS[number]['label']

export interface ValuationInput {
  nombres: string
  apellidos: string
  identificacion: string
  fecha_nacimiento: string
  /** Ciudad (campo visible «Ciudad»); el CRM la recibe como `direccion`. */
  direccion: string
  telefono: string
  email: string
  /** Nombre visible del procedimiento seleccionado. */
  name_surgery: string
  /** Etiqueta visible de la forma de pago (Contado | Financiación). */
  forma_pago: string
  /** Consentimiento explícito del usuario. */
  accept: boolean
}

export type ValuationErrors = Partial<Record<keyof ValuationInput, string>>

export const VALUATION_FIELDS: ReadonlyArray<keyof ValuationInput> = [
  'nombres', 'apellidos', 'identificacion', 'fecha_nacimiento', 'direccion', 'telefono', 'email', 'name_surgery', 'forma_pago', 'accept'
]

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Normaliza el cuerpo recibido: solo los campos conocidos, como texto recortado (accept solo si es exactamente `true`). */
export function normalizeValuation(body: unknown): ValuationInput {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  return {
    nombres: text(b.nombres),
    apellidos: text(b.apellidos),
    identificacion: text(b.identificacion),
    fecha_nacimiento: text(b.fecha_nacimiento),
    direccion: text(b.direccion),
    telefono: text(b.telefono),
    email: text(b.email),
    name_surgery: text(b.name_surgery),
    forma_pago: text(b.forma_pago),
    accept: b.accept === true
  }
}

/** Valida el formulario; devuelve un mensaje por campo inválido (vacío = válido). `today` se inyecta para poder probarlo. */
export function validateValuation(v: ValuationInput, today: Date = new Date()): ValuationErrors {
  const e: ValuationErrors = {}

  if (!v.nombres) e.nombres = 'Ingresa tus nombres.'
  else if (v.nombres.length < 2 || v.nombres.length > 100) e.nombres = 'Ingresa tus nombres (entre 2 y 100 caracteres).'

  if (!v.apellidos) e.apellidos = 'Ingresa tus apellidos.'
  else if (v.apellidos.length < 2 || v.apellidos.length > 100) e.apellidos = 'Ingresa tus apellidos (entre 2 y 100 caracteres).'

  if (!v.identificacion) e.identificacion = 'Ingresa tu número de cédula.'
  else if (!/^[A-Za-z0-9]{5,20}$/.test(v.identificacion)) e.identificacion = 'Ingresa un número de cédula válido (solo letras y números, sin puntos ni espacios).'

  if (!v.fecha_nacimiento) e.fecha_nacimiento = 'Ingresa tu fecha de nacimiento.'
  else {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.fecha_nacimiento)
    const d = m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null
    const real = !!m && !!d && d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3])
    if (!real) e.fecha_nacimiento = 'Ingresa una fecha de nacimiento válida.'
    else if (d!.getTime() > Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) e.fecha_nacimiento = 'La fecha de nacimiento no puede ser futura.'
    else if (Number(m![1]) < 1900) e.fecha_nacimiento = 'Ingresa una fecha de nacimiento válida.'
  }

  if (!v.direccion) e.direccion = 'Ingresa tu ciudad.'
  else if (v.direccion.length < 2 || v.direccion.length > 100) e.direccion = 'Ingresa tu ciudad (entre 2 y 100 caracteres).'

  const digits = v.telefono.replace(/\D/g, '')
  if (!v.telefono) e.telefono = 'Ingresa tu número de teléfono.'
  else if (digits.length < 7 || digits.length > 15 || !/^[+\d\s()-]+$/.test(v.telefono)) e.telefono = 'Ingresa un número de teléfono válido.'

  if (!v.email) e.email = 'Ingresa tu email.'
  else if (v.email.length > 150 || !EMAIL_RE.test(v.email)) e.email = 'Ingresa un email válido.'

  if (!v.name_surgery) e.name_surgery = 'Selecciona la cirugía que quieres realizarte.'
  else if (v.name_surgery.length > 150) e.name_surgery = 'Selecciona una cirugía de la lista.'

  if (!v.forma_pago) e.forma_pago = 'Selecciona la forma de pago.'
  else if (!PAYMENT_OPTIONS.some(o => o.label === v.forma_pago)) e.forma_pago = 'Selecciona una forma de pago válida.'

  if (!v.accept) e.accept = 'Debes aceptar la política de tratamiento de datos personales para continuar.'

  return e
}

/** Campos EXACTOS (nombre → valor) que recibe el CRM, ya validado el formulario. Los datos personales vienen solo del formulario. */
export function buildCrmFields(v: ValuationInput): Array<[string, string]> {
  const pago = PAYMENT_OPTIONS.find(o => o.label === v.forma_pago)
  if (!pago || !v.accept) throw new Error('Formulario no validado.')
  return [
    ['nombres', v.nombres],
    ['apellidos', v.apellidos],
    ['identificacion', v.identificacion],
    ['fecha_nacimiento', v.fecha_nacimiento],
    ['direccion', v.direccion],
    ['telefono', v.telefono],
    ['email', v.email],
    ['name_surgery', v.name_surgery],
    ['forma_pago', pago.value],
    ['state', VALUATION_STATE],
    ['origen', VALUATION_ORIGIN],
    ['id_user', VALUATION_CRM_IDS.id_user],
    ['id_line', VALUATION_CRM_IDS.id_line],
    ['id_user_asesora', VALUATION_CRM_IDS.id_user_asesora],
    ['accept', '1']
  ]
}

/**
 * Confirmación del CRM: un 2xx NO basta. El cuerpo debe traer el texto de éxito observado en `mensagge` (así lo devuelve hoy) o, como
 * respaldo, un `message` que hable de registro; un `message` cualquiera podría ser un error con estado 200.
 */
export function crmConfirmed(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  if (typeof b.mensagge === 'string' && b.mensagge.trim() !== '') return true
  return typeof b.message === 'string' && /registrad/i.test(b.message)
}

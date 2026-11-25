// Formulario «Pide tu cita de valoración». Módulo PURO (sin imports): lo usan el formulario (validación en el navegador), la ruta de Nitro
// (validación OBLIGATORIA en el servidor) y las pruebas. El envío al CRM Médico se arma SOLO en el servidor (server/utils/crmClient.ts).

/**
 * Forma de pago: opciones visibles → `value` es lo que recibe el CRM. En el formulario público del CRM es un campo de texto libre rotulado
 * «Forma de pago (Contado/Financiación)»; en una solicitud real se observó `Financiacion` (sin tilde) y «Contado» se envía como dice el rótulo.
 */
export const PAYMENT_OPTIONS = [
  { label: 'Contado', value: 'Contado' },
  { label: 'Financiación', value: 'Financiacion' }
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

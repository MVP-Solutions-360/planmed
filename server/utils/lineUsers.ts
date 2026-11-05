import type { H3Event } from 'h3'

// Colaboradores (usuarios) de la línea Planmed, leídos de Wellezy Hub: GET /cms/line-users (solo líder de la línea).
// Empresa y línea las decide el Hub a partir del token de la sesión (company_id y linea_id del personal del usuario), nunca desde el
// navegador: así, al pasar a los IDs de producción no hay nada que cambiar en la web. Lectura y ALTA (POST /cms/line-users); no hay
// edición, cambio de estado, corrección de correo ni reenvío de activación.
// Helpers de Nitro (createError, authError, requireAreaLeader, wellezyRequest, MSG_*) son auto-imports.

export interface LineUser {
  id: number
  userId: number | null
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  isAreaLeader: boolean
}
export interface LineUsersPage {
  users: LineUser[]
  meta: { page: number, lastPage: number, total: number, perPage: number }
}

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.slice(0, max) : '')
const int = (v: unknown, fallback: number) => (Number.isSafeInteger(Number(v)) && Number(v) > 0 ? Number(v) : fallback)

/** Filtros aceptados del navegador (todo lo demás se ignora). */
export function parseLineUsersQuery(q: Record<string, unknown>) {
  const search = typeof q.search === 'string' ? q.search.trim().slice(0, 100) : ''
  return {
    ...(search ? { search } : {}),
    ...(q.status === 'active' || q.status === 'inactive' ? { status: q.status } : {}),
    page: int(q.page, 1),
    per_page: Math.min(int(q.per_page, 15), 50)
  }
}

/** Solo los campos que la pantalla necesita (el Hub podría devolver más). */
export function normalizeLineUsers(body: any): LineUsersPage {
  const rows: any[] = Array.isArray(body?.data) ? body.data : []
  const users: LineUser[] = rows.filter(r => r && Number.isSafeInteger(Number(r.id))).map(r => ({
    id: Number(r.id),
    userId: Number.isSafeInteger(Number(r.user_id)) ? Number(r.user_id) : null,
    name: str(r.name),
    email: str(r.email),
    role: str(r.role?.name),
    status: r.status === 'inactive' ? 'inactive' : 'active',
    isAreaLeader: r.is_area_leader === true
  }))
  const m = body?.meta ?? {}
  return { users, meta: { page: int(m.current_page, 1), lastPage: int(m.last_page, 1), total: Number.isSafeInteger(Number(m.total)) ? Number(m.total) : users.length, perPage: int(m.per_page, users.length || 15) } }
}

export async function fetchLineUsers(event: H3Event, query: Record<string, unknown>): Promise<LineUsersPage> {
  await requireAreaLeader(event) // 401 sin sesión · 403 si no es líder · 503 si el Hub no responde
  const session = await useAdminSession(event)
  const token = session.data.token as string
  const res = await wellezyRequest<any>(event, token, 'GET', '/cms/line-users', { query: parseLineUsersQuery(query) })
  if (res.status === 401) {
    await session.clear()
    throw authError(401, 'No autenticado')
  }
  if (res.status === 403) throw authError(403, MSG_LEADER_ONLY)
  if (res.status !== 200) throw authError(503, MSG_UNAVAILABLE)
  return normalizeLineUsers(res.data)
}

// ───────────────────────────── Alta de colaboradores ─────────────────────────────
// Contrato (Hub: docs/cms/colaboradores-admin-api.md, «Credencial inicial: contraseña temporal»). El navegador solo aporta los campos de la lista blanca; todo lo demás se descarta
// (nunca se reenvía). company_id, linea_id, password e is_area_leader no existen para el cliente; el salario y el auxilio los fija el servidor
// en 0 (valores provisionales, se actualizan después desde Hub). Empresa y línea las resuelve Hub a partir del token de la sesión. La
// contraseña temporal la genera Hub (no hay correo de activación) y se devuelve una sola vez; el portal no la guarda ni la registra.

export const CREATE_FIELDS = ['name', 'lastname', 'email', 'document_type', 'document_number', 'role_id'] as const
export type CreateField = typeof CREATE_FIELDS[number]
export interface CreateLineUserInput { name: string, lastname: string, email: string, document_type: string, document_number: string, role_id: number }
/** `temporaryPassword` la genera Hub y se entrega UNA vez: solo viaja en la respuesta del alta (nunca en el listado) y no se guarda. */
export interface CreatedLineUser { user: LineUser, temporaryPassword: string }
export interface LineUserOptions { company: { id: number, name: string } | null, linea: { id: number, name: string } | null, roles: { id: number, name: string }[] }

export const MSG_CREATE_INVALID = 'Revisa los datos del colaborador.'
export const MSG_CREATE_UNCONFIRMED = 'No se pudo confirmar si el colaborador fue creado. Revisa el listado de colaboradores antes de intentarlo de nuevo.'
export const MSG_CREATE_FAILED = 'No se pudo crear el colaborador. Intenta nuevamente.'
export const MSG_CREATE_CONFLICT = 'El colaborador no se pudo crear por un conflicto con datos existentes.'
export const MSG_TOO_MANY = 'Demasiados intentos. Espera unos minutos e intenta nuevamente.'

export const CREATE_TIMEOUT_MS = 30_000

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validationError(errors: Record<string, string[]>, message: string) {
  return createError({ statusCode: 422, message, data: { message, errors } })
}

/** Valida el cuerpo con lista blanca estricta. Devuelve los datos limpios o lanza 422 con `errors` por campo. Sin salario/auxilio: los añade el servidor. */
export function parseCreateLineUserBody(body: unknown): CreateLineUserInput {
  const src = body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {}
  const errors: Record<string, string[]> = {}
  const text = (f: CreateField, label: string, max: number) => {
    const v = typeof src[f] === 'string' ? (src[f] as string).trim() : ''
    if (!v) errors[f] = [`${label} es obligatorio.`]
    else if (v.length > max) errors[f] = [`${label} no puede superar ${max} caracteres.`]
    return v
  }
  const name = text('name', 'El nombre', 255)
  const lastname = text('lastname', 'El apellido', 255)
  const document_type = text('document_type', 'El tipo de documento', 20)
  if (document_type && !LINE_USER_DOCUMENT_TYPE_VALUES.includes(document_type)) errors.document_type = ['Selecciona un tipo de documento válido.']
  const document_number = text('document_number', 'El número de documento', 50)
  const email = typeof src.email === 'string' ? src.email.trim().toLowerCase() : ''
  if (!email) errors.email = ['El correo electrónico es obligatorio.']
  else if (email.length > 255 || !EMAIL_RE.test(email)) errors.email = ['Ingresa un correo electrónico válido.']
  const raw = src.role_id
  const role_id = typeof raw === 'number' || (typeof raw === 'string' && /^\d+$/.test(raw.trim())) ? Number(raw) : 0
  if (!Number.isSafeInteger(role_id) || role_id <= 0) errors.role_id = ['Selecciona un rol.']

  if (Object.keys(errors).length) throw validationError(errors, MSG_CREATE_INVALID)
  return { name, lastname, email, document_type, document_number, role_id }
}

/** Conserva solo errores de los campos del formulario (arreglos de textos acotados); cualquier otro campo se resume en `_form`. */
export function normalizeHubErrors(raw: unknown): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    const msgs = (Array.isArray(val) ? val : [val]).filter((m): m is string => typeof m === 'string' && m.length > 0).map(m => m.slice(0, 300))
    if (!msgs.length) continue
    const field = (CREATE_FIELDS as readonly string[]).includes(key) ? key : '_form'
    out[field] = [...(out[field] ?? []), ...msgs].slice(0, 5)
  }
  return out
}

/** Cuerpo que se envía a Hub: solo la lista blanca + salario y auxilio fijos en 0. */
export function buildHubCreatePayload(input: CreateLineUserInput) {
  return {
    name: input.name,
    lastname: input.lastname,
    email: input.email,
    document_type: input.document_type,
    document_number: input.document_number,
    role_id: input.role_id,
    base_salary: 0,
    transportation_assistance: 0
  }
}

/** Solo lo que la pantalla necesita del 201 de Hub (usuario y contraseña temporal; nunca token, hash ni otros campos). Null si falta el usuario o la contraseña temporal: la creación no se puede dar por confirmada. */
export function normalizeCreatedLineUser(body: any): CreatedLineUser | null {
  const r = body?.data
  if (!r || !Number.isSafeInteger(Number(r.id))) return null
  const temporaryPassword = typeof r.temporary_password === 'string' ? r.temporary_password : ''
  if (!temporaryPassword || temporaryPassword.length > 128) return null
  return {
    user: {
      id: Number(r.id),
      userId: Number.isSafeInteger(Number(r.user_id)) ? Number(r.user_id) : null,
      name: str(r.name),
      email: str(r.email),
      role: str(r.role?.name),
      status: r.status === 'inactive' ? 'inactive' : 'active',
      isAreaLeader: r.is_area_leader === true
    },
    temporaryPassword
  }
}

const idName = (v: any) => (v && Number.isSafeInteger(Number(v.id)) ? { id: Number(v.id), name: str(v.name) } : null)

export function normalizeLineUserOptions(body: any): LineUserOptions {
  const d = body?.data ?? {}
  return {
    company: idName(d.company),
    linea: idName(d.linea),
    roles: (Array.isArray(d.roles) ? d.roles : []).map(idName).filter((r: any): r is { id: number, name: string } => !!r)
  }
}

export async function fetchLineUserOptions(event: H3Event): Promise<LineUserOptions> {
  await requireAreaLeader(event)
  const session = await useAdminSession(event)
  const res = await wellezyRequest<any>(event, session.data.token as string, 'GET', '/cms/line-users/options')
  if (res.status === 401) {
    await session.clear()
    throw authError(401, 'No autenticado')
  }
  if (res.status === 403) throw authError(403, MSG_LEADER_ONLY)
  if (res.status !== 200) throw authError(503, MSG_UNAVAILABLE)
  return normalizeLineUserOptions(res.data)
}

/** Alta en Hub. Una sola llamada: NUNCA se reintenta (Hub no es idempotente). La ruta ya validó origen y líder. */
export async function createLineUser(event: H3Event, input: CreateLineUserInput): Promise<CreatedLineUser> {
  const session = await useAdminSession(event)
  const token = session.data.token as string
  // El alta del Hub hashea la contraseña y escribe varias tablas en la misma petición: puede tardar más que las lecturas (en local superó
  // los 10 s y el portal informó un timeout aunque el colaborador sí se creó).
  const res = await wellezyRequest<any>(event, token, 'POST', '/cms/line-users', { body: buildHubCreatePayload(input), timeout: CREATE_TIMEOUT_MS })
  const hubMessage = typeof res.data?.message === 'string' && res.data.message ? res.data.message.slice(0, 300) : ''
  const fail = (statusCode: number, message: string, extra: Record<string, unknown> = {}) =>
    createError({ statusCode, message, data: { message, ...extra } })

  switch (res.status) {
    case 201: {
      const created = normalizeCreatedLineUser(res.data)
      if (!created) throw fail(504, MSG_CREATE_UNCONFIRMED, { code: 'creation_unconfirmed' })
      return created
    }
    case 401:
      await session.clear()
      throw authError(401, 'No autenticado')
    case 403:
      throw authError(403, MSG_LEADER_ONLY)
    case 409:
      throw fail(409, hubMessage || MSG_CREATE_CONFLICT, { code: 'conflict' })
    case 422:
      throw fail(422, hubMessage || MSG_CREATE_INVALID, { errors: normalizeHubErrors(res.data?.errors) })
    case 429:
      throw fail(429, MSG_TOO_MANY)
    case 503:
      throw fail(503, MSG_UNAVAILABLE)
    case 500:
      throw fail(502, MSG_CREATE_FAILED)
    default:
      // 0 (timeout/red) u otro estado inesperado: no se sabe si el alta se hizo.
      throw fail(504, MSG_CREATE_UNCONFIRMED, { code: 'creation_unconfirmed' })
  }
}

import type { H3Event } from 'h3'

// Colaboradores (usuarios) de la línea Planmed, leídos de Wellezy Hub: GET /cms/line-users (solo líder de la línea).
// Empresa y línea las decide el Hub a partir del token de la sesión (company_id y linea_id del personal del usuario), nunca desde el
// navegador: así, al pasar a los IDs de producción no hay nada que cambiar en la web. Solo lectura.
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

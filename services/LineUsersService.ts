import { toAboutError, type Fetcher } from '~/services/AboutService'

// Colaboradores de la línea (/api/admin/config/line-users): listado y alta, solo líder. Los datos salen de Wellezy Hub.
export interface LineUser { id: number, userId: number | null, name: string, email: string, role: string, status: 'active' | 'inactive', isAreaLeader: boolean }
export interface LineUsersPage { users: LineUser[], meta: { page: number, lastPage: number, total: number, perPage: number } }
export interface LineUserOptions { company: { id: number, name: string } | null, linea: { id: number, name: string } | null, roles: { id: number, name: string }[] }
export interface CreateLineUserInput { name: string, lastname: string, email: string, document_type: string, document_number: string, role_id: number }
/** La contraseña temporal solo existe en esta respuesta: la pantalla la mantiene en memoria hasta cerrar el aviso. */
export interface CreatedLineUser { user: LineUser, temporaryPassword: string }
export interface LineUsersFilters { search?: string, status?: '' | 'active' | 'inactive', page?: number, perPage?: number }

const requestFetch: Fetcher = (url, options) => (useRequestFetch() as any)(url, options)

export class LineUsersService {
  constructor(private readonly request: Fetcher = requestFetch) {}

  async list(f: LineUsersFilters = {}): Promise<LineUsersPage> {
    const query: Record<string, unknown> = { page: f.page ?? 1, per_page: f.perPage ?? 15 }
    if (f.search?.trim()) query.search = f.search.trim()
    if (f.status) query.status = f.status
    try { return await this.request<LineUsersPage>('/api/admin/config/line-users', { query }) } catch (e) { throw toAboutError(e) }
  }

  /** Catálogos del formulario de alta (empresa, línea y roles), tal como los devuelve Hub. */
  async options(): Promise<LineUserOptions> {
    try { return await this.request<LineUserOptions>('/api/admin/config/line-users/options') } catch (e) { throw toAboutError(e) }
  }

  /** Alta de un colaborador. Una sola petición: nunca se reintenta (Hub no es idempotente). */
  async create(input: CreateLineUserInput): Promise<CreatedLineUser> {
    try { return await this.request<CreatedLineUser>('/api/admin/config/line-users', { method: 'POST', body: input }) } catch (e) { throw toAboutError(e) }
  }
}

export const lineUsersService = new LineUsersService()

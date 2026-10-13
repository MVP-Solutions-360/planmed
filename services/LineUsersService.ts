import { toAboutError, type Fetcher } from '~/services/AboutService'

// Colaboradores de la línea (/api/admin/config/line-users): solo lectura, solo líder. Los datos salen de Wellezy Hub.
export interface LineUser { id: number, userId: number | null, name: string, email: string, role: string, status: 'active' | 'inactive', isAreaLeader: boolean }
export interface LineUsersPage { users: LineUser[], meta: { page: number, lastPage: number, total: number, perPage: number } }
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
}

export const lineUsersService = new LineUsersService()

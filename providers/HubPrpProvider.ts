import type { PrpProvider } from './PrpProvider'
import { PrpError, type Prp, type PrpFieldErrors, type PrpInput, type PrpListParams, type PrpPage } from '~/types/prp'
import { useRequestFetch } from '#imports'

// Habla únicamente con las rutas internas de Nitro (/api/admin/prp/*). Nitro es quien se comunica con
// Wellezy Hub con el Bearer de la sesión; este código nunca maneja tokens ni empresa/línea.

const BASE = '/api/admin/prp'
const GENERIC_ERROR = 'No fue posible completar la operación. Intenta nuevamente.'

// Nombres de campo de Hub -> nombres de PrpInput.
const FIELD_MAP: Record<string, keyof PrpInput> = {
  name: 'name',
  external_code: 'externalCode',
  slug: 'slug',
  title: 'title',
  is_active: 'isActive'
}

function toError(e: any): PrpError {
  const payload = e?.data?.data
  const message = payload?.message || e?.data?.message
  const fieldErrors: PrpFieldErrors = {}
  const errors = payload?.errors
  if (errors && typeof errors === 'object') {
    for (const [field, msgs] of Object.entries(errors)) {
      const key = FIELD_MAP[field]
      const first = Array.isArray(msgs) ? msgs[0] : msgs
      if (key && typeof first === 'string') fieldErrors[key] = first
    }
  }
  return new PrpError(
    typeof message === 'string' && message ? message : GENERIC_ERROR,
    e?.statusCode ?? e?.response?.status,
    fieldErrors
  )
}

function fromHub(row: any): Prp {
  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    externalCode: String(row.external_code ?? ''),
    slug: String(row.slug ?? ''),
    title: row.title ?? null,
    isActive: !!row.is_active,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null
  }
}

function toHub(data: Partial<PrpInput>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (data.name !== undefined) out.name = data.name
  if (data.externalCode !== undefined) out.external_code = data.externalCode
  if (data.slug !== undefined) out.slug = data.slug
  if (data.title !== undefined) out.title = data.title
  if (data.isActive !== undefined) out.is_active = data.isActive
  return out
}

export class HubPrpProvider implements PrpProvider {
  async getPrps(params: PrpListParams = {}): Promise<PrpPage> {
    const request = useRequestFetch()
    const query: Record<string, string | number> = {}
    if (params.search) query.search = params.search
    if (params.isActive !== undefined) query.is_active = params.isActive ? 1 : 0
    if (params.page) query.page = params.page
    if (params.perPage) query.per_page = params.perPage

    try {
      const res = await request<any>(BASE, { query })
      return {
        items: (res.data ?? []).map(fromHub),
        currentPage: Number(res.meta?.current_page ?? 1),
        lastPage: Number(res.meta?.last_page ?? 1),
        total: Number(res.meta?.total ?? (res.data ?? []).length)
      }
    } catch (e) {
      throw toError(e)
    }
  }

  async getPrpById(id: number): Promise<Prp | null> {
    const request = useRequestFetch()
    try {
      const res = await request<any>(`${BASE}/${id}`)
      return fromHub(res.data)
    } catch (e: any) {
      if ((e?.statusCode ?? e?.response?.status) === 404) return null
      throw toError(e)
    }
  }

  async createPrp(data: PrpInput): Promise<Prp> {
    const request = useRequestFetch()
    try {
      const res = await request<any>(BASE, { method: 'POST', body: toHub(data) })
      return fromHub(res.data)
    } catch (e) {
      throw toError(e)
    }
  }

  async updatePrp(id: number, data: Partial<PrpInput>): Promise<Prp> {
    const request = useRequestFetch()
    try {
      const res = await request<any>(`${BASE}/${id}`, { method: 'PUT', body: toHub(data) })
      return fromHub(res.data)
    } catch (e) {
      throw toError(e)
    }
  }

  async deactivatePrp(id: number): Promise<Prp> {
    const request = useRequestFetch()
    try {
      const res = await request<any>(`${BASE}/${id}`, { method: 'DELETE' })
      return fromHub(res.data)
    } catch (e) {
      throw toError(e)
    }
  }
}

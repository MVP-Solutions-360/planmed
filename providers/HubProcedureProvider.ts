import type { ProcedureProvider } from './ProcedureProvider'
import type { Procedure } from '~/types/procedure'
import { useRequestFetch } from '#imports'

// Administración de procedimientos contra Wellezy Hub (fuente de verdad), SOLO a través de las rutas internas de Nitro
// (/api/admin/procedures*). El Bearer de Hub, company_id y linea_id nunca pasan por el navegador: Hub deriva la línea
// del usuario autenticado. El identificador de ruta del admin es el slug; Hub identifica por id, así que se resuelve por slug.

const GENERIC_ERROR = 'No fue posible conectar con Wellezy Hub. Intenta nuevamente.'

function toError(e: any): Error {
  const message = e?.data?.data?.message || e?.data?.message
  const error = new Error(typeof message === 'string' && message ? message : GENERIC_ERROR) as Error & { statusCode?: number }
  error.statusCode = e?.statusCode ?? e?.response?.status
  return error
}

export class HubProcedureProvider implements ProcedureProvider {
  async getProcedures(): Promise<Procedure[]> {
    const request = useRequestFetch()
    try {
      const res = await request<{ data: Procedure[] }>('/api/admin/procedures')
      return res.data
    } catch (e) {
      throw toError(e)
    }
  }

  async getProcedureBySlug(slug: string): Promise<Procedure | null> {
    const all = await this.getProcedures()
    return all.find(p => p.slug === slug) ?? null
  }

  async createProcedure(data: Omit<Procedure, 'id' | 'slug'> & { slug?: string }): Promise<Procedure> {
    const request = useRequestFetch()
    try {
      return await request<Procedure>('/api/admin/procedures', { method: 'POST', body: data })
    } catch (e) {
      throw toError(e)
    }
  }

  async updateProcedure(slug: string, data: Partial<Procedure>): Promise<Procedure> {
    const current = await this.getProcedureBySlug(slug)
    if (!current) throw new Error('Procedimiento no encontrado')
    const request = useRequestFetch()
    try {
      return await request<Procedure>(`/api/admin/procedures/${current.id}`, { method: 'PUT', body: data })
    } catch (e) {
      throw toError(e)
    }
  }

  /** En Hub "eliminar" desactiva (el procedimiento propio se conserva; un maestro solo se deshabilita en la línea). */
  async deleteProcedure(slug: string): Promise<boolean> {
    const current = await this.getProcedureBySlug(slug)
    if (!current) return false
    const request = useRequestFetch()
    try {
      await request(`/api/admin/procedures/${current.id}`, { method: 'DELETE' })
      return true
    } catch (e) {
      throw toError(e)
    }
  }
}

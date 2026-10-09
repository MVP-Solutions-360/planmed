import type { PublicProcedureProvider } from './PublicProcedureProvider'
import type { Procedure } from '~/types/procedure'
import { useRequestFetch } from '#imports'

// Habla únicamente con las rutas internas de Nitro (/api/public/procedures*). Nitro consulta a Wellezy Hub con el tenant de la
// configuración de Planmed; este código no conoce la URL de Hub ni el tenant. Funciona igual en SSR y en el navegador
// (sin localStorage), así que una URL directa /procedimientos/{slug} resuelve igual que la navegación interna.
// La lista pública trae lo necesario para tarjetas/menús/selectores; el detalle trae el contenido completo.

export class HubPublicProcedureProvider implements PublicProcedureProvider {
  async getProcedures(): Promise<Procedure[]> {
    const request = useRequestFetch()
    return await request<Procedure[]>('/api/public/procedures')
  }

  async getProcedureBySlug(slug: string): Promise<Procedure | null> {
    const request = useRequestFetch()
    try {
      return await request<Procedure>(`/api/public/procedures/${encodeURIComponent(slug)}`)
    } catch (e: any) {
      if ((e?.statusCode ?? e?.response?.status) === 404) return null
      throw e
    }
  }
}

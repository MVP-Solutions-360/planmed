import type { PublicPrpProvider } from './PublicPrpProvider'
import type { PublicPrp } from '~/types/prpPublic'
import { useRequestFetch } from '#imports'

// Habla únicamente con la ruta interna de Nitro (/api/public/prp/{slug}). Nitro consulta a Wellezy Hub
// con el tenant de la configuración de Planmed; este código no conoce la URL de Hub ni el tenant.

export class HubPublicPrpProvider implements PublicPrpProvider {
  async getBySlug(slug: string): Promise<PublicPrp | null> {
    const request = useRequestFetch()
    try {
      return await request<PublicPrp>(`/api/public/prp/${encodeURIComponent(slug)}`)
    } catch (e: any) {
      if ((e?.statusCode ?? e?.response?.status) === 404) return null
      throw e
    }
  }
}

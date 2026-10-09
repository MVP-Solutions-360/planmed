import type { PublicRecommendationsProvider } from './PublicRecommendationsProvider'
import type { Fetcher } from './HubRecommendationsProvider'
import type { RecommendationPage } from '~/types/recommendations'

// Habla únicamente con las rutas internas de Nitro (/api/public/recommendations*). Nitro consulta a Wellezy Hub con el tenant de
// la configuración de Planmed; este código no conoce la URL de Hub ni el tenant. Funciona igual en SSR y en el navegador (sin
// localStorage), así que una URL directa /recomendaciones/{slug} resuelve igual que la navegación interna.

const requestFetch: Fetcher = (url, options) => (useRequestFetch() as any)(url, options)

export class HubPublicRecommendationsProvider implements PublicRecommendationsProvider {
  private readonly request: Fetcher

  // Fetcher inyectable (pruebas); por defecto useRequestFetch de Nuxt. Sin "parameter properties" para poder ejecutarse con Node.
  constructor(request: Fetcher = requestFetch) {
    this.request = request
  }

  async getPages(): Promise<RecommendationPage[]> {
    return await this.request<RecommendationPage[]>('/api/public/recommendations')
  }

  async getPage(slug: string): Promise<RecommendationPage | null> {
    try {
      return await this.request<RecommendationPage>(`/api/public/recommendations/${encodeURIComponent(slug)}`)
    } catch (e: any) {
      if ((e?.statusCode ?? e?.response?.status) === 404) return null
      throw e
    }
  }
}

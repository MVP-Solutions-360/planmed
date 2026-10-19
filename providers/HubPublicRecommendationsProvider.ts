import type { PublicRecommendationsProvider } from './PublicRecommendationsProvider'
import type { Fetcher } from './HubRecommendationsProvider'
import type { RecommendationPage } from '~/types/recommendations'
import type { TreeSubtopic, TreeTopic } from '#shared/utils/recommendationTree'

// Habla únicamente con las rutas internas de Nitro (/api/public/recommendation-topics* y /api/public/recommendations*). Nitro consulta
// a Wellezy Hub con el tenant de la configuración de Planmed; este código no conoce la URL de Hub ni el tenant. Funciona igual en SSR y
// en el navegador (sin localStorage), así que una URL directa /recomendaciones/{tema}/{subtema} resuelve igual que la navegación interna.

const requestFetch: Fetcher = (url, options) => (useRequestFetch() as any)(url, options)

export class HubPublicRecommendationsProvider implements PublicRecommendationsProvider {
  private readonly request: Fetcher

  // Fetcher inyectable (pruebas); por defecto useRequestFetch de Nuxt. Sin "parameter properties" para poder ejecutarse con Node.
  constructor(request: Fetcher = requestFetch) {
    this.request = request
  }

  async getTopics(): Promise<TreeTopic[]> {
    return await this.request<TreeTopic[]>('/api/public/recommendation-topics')
  }

  async getSubtopic(topic: string, subtopic: string): Promise<TreeSubtopic | null> {
    try {
      return await this.request<TreeSubtopic>(`/api/public/recommendation-topics/${encodeURIComponent(topic)}/${encodeURIComponent(subtopic)}`)
    } catch (e: any) {
      if ((e?.statusCode ?? e?.response?.status) === 404) return null
      throw e
    }
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

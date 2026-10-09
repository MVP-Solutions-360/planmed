import type { PublicRecommendationsProvider } from '~/providers/PublicRecommendationsProvider'
import type { RecommendationPage } from '~/types/recommendations'
import { HubPublicRecommendationsProvider } from '~/providers/HubPublicRecommendationsProvider'

// Lectura PÚBLICA de páginas de recomendaciones: Wellezy Hub (API pública /v1/web/recommendation-pages) es la fuente de verdad.
// Para administración usa RecommendationsService.
export class PublicRecommendationsService {
  private provider: PublicRecommendationsProvider

  constructor(provider?: PublicRecommendationsProvider) {
    this.provider = provider || new HubPublicRecommendationsProvider()
  }

  getPages(): Promise<RecommendationPage[]> {
    return this.provider.getPages()
  }

  getPage(slug: string): Promise<RecommendationPage | null> {
    return this.provider.getPage(slug)
  }
}

export const publicRecommendationsService = new PublicRecommendationsService()

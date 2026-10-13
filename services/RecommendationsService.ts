import type { RecommendationsProvider } from '~/providers/RecommendationsProvider'
import type { RecommendationGroup, RecommendationPage } from '~/types/recommendations'
import { HubRecommendationsProvider } from '~/providers/HubRecommendationsProvider'

// Servicio ADMINISTRATIVO de páginas de recomendaciones: Wellezy Hub es la fuente de verdad.
// Para lectura pública usa PublicRecommendationsService.
export class RecommendationsService {
  private provider: RecommendationsProvider

  constructor(provider?: RecommendationsProvider) {
    this.provider = provider || new HubRecommendationsProvider()
  }

  getPages(): Promise<RecommendationPage[]> {
    return this.provider.getPages()
  }

  getPage(slug: string): Promise<RecommendationPage | null> {
    return this.provider.getPage(slug)
  }

  savePage(page: RecommendationPage): Promise<RecommendationPage> {
    return this.provider.savePage(page)
  }

  setPublished(slug: string, published: boolean): Promise<RecommendationPage> {
    return this.provider.setPublished(slug, published)
  }

  createPage(data: { title: string; group: RecommendationGroup }): Promise<RecommendationPage> {
    return this.provider.createPage(data)
  }

  deletePage(slug: string): Promise<void> {
    return this.provider.deletePage(slug)
  }
}

export const recommendationsService = new RecommendationsService()

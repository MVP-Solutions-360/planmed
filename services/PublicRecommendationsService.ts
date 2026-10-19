import type { PublicRecommendationsProvider } from '~/providers/PublicRecommendationsProvider'
import type { RecommendationPage } from '~/types/recommendations'
import type { TreeSubtopic, TreeTopic } from '#shared/utils/recommendationTree'
import { HubPublicRecommendationsProvider } from '~/providers/HubPublicRecommendationsProvider'

// Lectura PÚBLICA de recomendaciones: Wellezy Hub es la fuente de verdad.
//  · Árbol nuevo (tema principal → subtemas → secciones → recomendaciones): /v1/web/recommendation-topics.
//  · Contrato histórico por página (/v1/web/recommendation-pages): rutas antiguas y listados por procedimiento.
// Para administración usa RecommendationsService.
export class PublicRecommendationsService {
  private provider: PublicRecommendationsProvider

  constructor(provider?: PublicRecommendationsProvider) {
    this.provider = provider || new HubPublicRecommendationsProvider()
  }

  getTopics(): Promise<TreeTopic[]> {
    return this.provider.getTopics()
  }

  getSubtopic(topic: string, subtopic: string): Promise<TreeSubtopic | null> {
    return this.provider.getSubtopic(topic, subtopic)
  }

  getPages(): Promise<RecommendationPage[]> {
    return this.provider.getPages()
  }

  getPage(slug: string): Promise<RecommendationPage | null> {
    return this.provider.getPage(slug)
  }
}

export const publicRecommendationsService = new PublicRecommendationsService()

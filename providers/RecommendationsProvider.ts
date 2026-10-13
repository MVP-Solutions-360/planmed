import type { RecommendationGroup, RecommendationPage } from '~/types/recommendations'

export interface RecommendationsProvider {
  getPages(): Promise<RecommendationPage[]>
  getPage(slug: string): Promise<RecommendationPage | null>
  savePage(page: RecommendationPage): Promise<RecommendationPage>
  /** Publica u oculta una página sin enviar ningún otro campo (PUT parcial). */
  setPublished(slug: string, published: boolean): Promise<RecommendationPage>
  createPage(data: { title: string; group: RecommendationGroup }): Promise<RecommendationPage>
  deletePage(slug: string): Promise<void>
}

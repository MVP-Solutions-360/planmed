import type { RecommendationGroup, RecommendationPage } from '~/types/recommendations'

export interface RecommendationsProvider {
  getPages(): Promise<RecommendationPage[]>
  getPage(slug: string): Promise<RecommendationPage | null>
  savePage(page: RecommendationPage): Promise<RecommendationPage>
  createPage(data: { title: string; group: RecommendationGroup }): Promise<RecommendationPage>
  deletePage(slug: string): Promise<void>
}

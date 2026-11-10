import type { NewsArticle, NewsPage } from '~/types/news'

/** Lectura pública de noticias (solo publicadas y vigentes; Hub filtra por línea). */
export interface PublicNewsProvider {
  getNews(): Promise<NewsArticle[]>
  getNewsPage(page: number, perPage?: number): Promise<NewsPage>
  getNewsBySlug(slug: string): Promise<NewsArticle | null>
}

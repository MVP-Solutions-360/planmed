import type { NewsArticle } from '~/types/news'

/** Lectura pública de noticias (solo publicadas y vigentes; Hub filtra por línea). */
export interface PublicNewsProvider {
  getNews(): Promise<NewsArticle[]>
  getNewsBySlug(slug: string): Promise<NewsArticle | null>
}

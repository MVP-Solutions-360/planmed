import type { NewsArticle } from '~/types/news'

export interface NewsProvider {
  getNews(): Promise<NewsArticle[]>
  getNewsBySlug(slug: string): Promise<NewsArticle | null>
  createNews(data: Omit<NewsArticle, 'id' | 'slug'>): Promise<NewsArticle>
  updateNews(slug: string, data: Partial<NewsArticle>): Promise<NewsArticle>
  deleteNews(slug: string): Promise<boolean>
}
import type { NewsProvider } from '~/providers/NewsProvider'
import type { NewsArticle } from '~/types/news'
import { HubNewsProvider } from '~/providers/HubNewsProvider'

// Servicio ADMINISTRATIVO de noticias (CMS): Wellezy Hub es la fuente de verdad.
// Para lectura pública usa PublicNewsService.
export class NewsService {
  private provider: NewsProvider

  constructor(provider?: NewsProvider) {
    this.provider = provider || new HubNewsProvider();
  }

  async getNews(): Promise<NewsArticle[]> {
    return this.provider.getNews();
  }

  async getNewsBySlug(slug: string): Promise<NewsArticle | null> {
    return this.provider.getNewsBySlug(slug);
  }

  async createNews(data: Omit<NewsArticle, 'id' | 'slug'>): Promise<NewsArticle> {
    return this.provider.createNews(data);
  }

  async updateNews(slug: string, data: Partial<NewsArticle>): Promise<NewsArticle> {
    return this.provider.updateNews(slug, data);
  }

  async deleteNews(slug: string): Promise<boolean> {
    return this.provider.deleteNews(slug);
  }
}

export const newsService = new NewsService();

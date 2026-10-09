import type { PublicNewsProvider } from '~/providers/PublicNewsProvider'
import type { NewsArticle } from '~/types/news'
import { HubPublicNewsProvider } from '~/providers/HubPublicNewsProvider'

export class PublicNewsService {
  private provider: PublicNewsProvider

  constructor(provider?: PublicNewsProvider) {
    this.provider = provider || new HubPublicNewsProvider();
  }

  async getNews(): Promise<NewsArticle[]> {
    return this.provider.getNews();
  }

  async getNewsBySlug(slug: string): Promise<NewsArticle | null> {
    return this.provider.getNewsBySlug(slug);
  }
}

export const publicNewsService = new PublicNewsService();

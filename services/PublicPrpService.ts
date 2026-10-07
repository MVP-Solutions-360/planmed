import type { PublicPrpProvider } from '~/providers/PublicPrpProvider'
import type { PublicPrp } from '~/types/prpPublic'
import { HubPublicPrpProvider } from '~/providers/HubPublicPrpProvider'

export class PublicPrpService {
  private provider: PublicPrpProvider

  constructor(provider?: PublicPrpProvider) {
    this.provider = provider || new HubPublicPrpProvider();
  }

  async getBySlug(slug: string): Promise<PublicPrp | null> {
    return this.provider.getBySlug(slug);
  }
}

export const publicPrpService = new PublicPrpService();

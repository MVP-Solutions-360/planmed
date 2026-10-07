import type { PrpLeadProvider } from '~/providers/PrpLeadProvider'
import type { PrpLeadInput } from '~/types/prpPublic'
import { CrmPrpLeadProvider } from '~/providers/CrmPrpLeadProvider'

export class PrpLeadService {
  private provider: PrpLeadProvider

  constructor(provider?: PrpLeadProvider) {
    this.provider = provider || new CrmPrpLeadProvider();
  }

  async submitLead(lead: PrpLeadInput): Promise<void> {
    return this.provider.submit(lead);
  }
}

export const prpLeadService = new PrpLeadService();

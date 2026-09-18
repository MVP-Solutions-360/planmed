import { MockLeadProvider, type LeadData } from '../providers/MockLeadProvider';

export class LeadService {
  private provider: MockLeadProvider;

  constructor() {
    this.provider = new MockLeadProvider();
  }

  async submitLead(lead: LeadData): Promise<boolean> {
    return await this.provider.submit(lead);
  }
}

export const leadService = new LeadService();

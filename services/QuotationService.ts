import { MockQuotationProvider, type QuotationResult } from '../providers/MockQuotationProvider';
import { financingRateService } from './FinancingRateService';

export class QuotationService {
  private provider: MockQuotationProvider;

  constructor() {
    this.provider = new MockQuotationProvider(financingRateService);
  }

  async calculateQuotation(amount: number, months: number, procedure: string, signal?: AbortSignal): Promise<QuotationResult> {
    return await this.provider.getQuote(amount, months, procedure, signal);
  }
}

// Singleton for easy access in composables
export const quotationService = new QuotationService();

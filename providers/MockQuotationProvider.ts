import type { FinancingRateService } from '~/services/FinancingRateService'
import { buildFinancingQuote } from '#shared/utils/financing'

export interface QuotationResult {
  monthlyPayment: number;
  totalAmount: number;
  /** Se mantiene por compatibilidad: la cuota es una estimación referencial, no una oferta. */
  isMock: boolean;
  /** Tasa mensual aplicada (% con 4 decimales) y versión de la configuración con la que se calculó. */
  ratePercent: string;
  rateUpdatedAt: string;
  disclaimer: string;
}

// Cotización referencial: cuota fija amortizada con la tasa mensual CONFIGURADA en el panel (financing-rate.json). La fórmula vive en
// shared/utils/financing.ts (sin redondeo a centenas). Sin tasa disponible lanza FinancingRateUnavailableError: no hay tasa de respaldo.
export class MockQuotationProvider {
  private readonly rates: Pick<FinancingRateService, 'getPublicRate'>

  constructor(rates: Pick<FinancingRateService, 'getPublicRate'>) {
    this.rates = rates
  }

  async getQuote(amount: number, months: number, procedure: string, signal?: AbortSignal): Promise<QuotationResult> {
    const current = await this.rates.getPublicRate()

    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const quote = buildFinancingQuote(amount, months, current.rate)

    return {
      monthlyPayment: quote.monthlyPayment,
      totalAmount: quote.totalAmount,
      isMock: true,
      ratePercent: quote.ratePercent,
      rateUpdatedAt: current.updatedAt,
      disclaimer: `Esta simulación es una estimación preliminar con una tasa de interés de ${quote.ratePercent} % mensual, que puede variar de acuerdo con la tasa de usura vigente, fijada mensualmente. Las condiciones definitivas estarán sujetas al estudio y aprobación de la solicitud.`
    };
  }
}

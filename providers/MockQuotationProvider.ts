export interface QuotationResult {
  monthlyPayment: number | null;
  totalAmount: number | null;
  isMock: boolean;
  disclaimer: string;
}

export class MockQuotationProvider {
  async getQuote(amount: number, months: number, procedure: string, signal?: AbortSignal): Promise<QuotationResult> {
    // Simular latencia de red para demostrar la mitigación de race conditions
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    // Calculo estándar de amortización de crédito
    // Tasa de interés mensual de ejemplo (e.g., 2.0% mensual)
    const rate = 0.02; 
    
    // PMT = P * r(1+r)^n / ((1+r)^n - 1)
    const factor = Math.pow(1 + rate, months);
    let calculatedPayment = (amount * rate * factor) / (factor - 1);
    
    // Round up to nearest hundred
    calculatedPayment = Math.ceil(calculatedPayment / 100) * 100;

    return {
      monthlyPayment: calculatedPayment,
      totalAmount: calculatedPayment * months,
      isMock: true,
      disclaimer: "Esta simulación es una estimación preliminar utilizando una tasa referencial que puede variar de acuerdo con la tasa de usura vigente, fijada mensualmente. Las condiciones definitivas estarán sujetas al estudio y aprobación de la solicitud."
    };
  }
}

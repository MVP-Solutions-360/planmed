export interface LeadData {
  first_name: string;
  phone: string;
  city: string;
  procedure_name: string;
  requested_amount: number;
  installments: number;
  email?: string;
  comments?: string;
  // Datos del preaprobado (tomador del crédito y actividad económica). El contrato de Hub /v1/leads admite `metadata` (array/objeto libre).
  metadata?: Record<string, string | number | boolean | null>;
}

export class MockLeadProvider {
  async submit(lead: LeadData): Promise<boolean> {
    return new Promise((resolve) => {
      console.log('[MOCK LEAD PROVIDER] Solicitud de lead recibida:', lead);
      setTimeout(() => {
        console.log('[MOCK LEAD PROVIDER] Solicitud procesada exitosamente.');
        resolve(true);
      }, 1500);
    });
  }
}

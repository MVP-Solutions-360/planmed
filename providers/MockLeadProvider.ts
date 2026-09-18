export interface LeadData {
  first_name: string;
  phone: string;
  city: string;
  procedure_name: string;
  requested_amount: number;
  installments: number;
  email?: string;
  comments?: string;
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

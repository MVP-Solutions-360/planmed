import type { PrpLeadInput } from '~/types/prpPublic'

export interface PrpLeadProvider {
  // Resuelve solo si el CRM confirmó el registro; en cualquier otro caso lanza PrpLeadError.
  submit(lead: PrpLeadInput): Promise<void>
}

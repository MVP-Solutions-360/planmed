import type { PublicProcedureProvider } from '~/providers/PublicProcedureProvider'
import type { Procedure } from '~/types/procedure'
import { HubPublicProcedureProvider } from '~/providers/HubPublicProcedureProvider'

// Lectura PÚBLICA de procedimientos: Wellezy Hub (API pública /v1/web/cirugias) es la fuente de verdad.
// Para administración usa ProcedureService.
export class PublicProcedureService {
  private provider: PublicProcedureProvider

  constructor(provider?: PublicProcedureProvider) {
    this.provider = provider || new HubPublicProcedureProvider();
  }

  async getProcedures(): Promise<Procedure[]> {
    return this.provider.getProcedures();
  }

  async getProcedureBySlug(slug: string): Promise<Procedure | null> {
    return this.provider.getProcedureBySlug(slug);
  }
}

export const publicProcedureService = new PublicProcedureService();

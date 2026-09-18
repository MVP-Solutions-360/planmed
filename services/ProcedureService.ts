import type { ProcedureProvider } from '~/providers/ProcedureProvider'
import type { Procedure } from '~/types/procedure'
import { MockProcedureProvider } from '~/providers/MockProcedureProvider'

export class ProcedureService {
  private provider: ProcedureProvider

  constructor(provider?: ProcedureProvider) {
    this.provider = provider || new MockProcedureProvider();
  }

  async getProcedures(): Promise<Procedure[]> {
    return this.provider.getProcedures();
  }

  async getProcedureBySlug(slug: string): Promise<Procedure | null> {
    return this.provider.getProcedureBySlug(slug);
  }

  async createProcedure(data: Omit<Procedure, 'id' | 'slug'>): Promise<Procedure> {
    return this.provider.createProcedure(data);
  }

  async updateProcedure(slug: string, data: Partial<Procedure>): Promise<Procedure> {
    return this.provider.updateProcedure(slug, data);
  }

  async deleteProcedure(slug: string): Promise<boolean> {
    return this.provider.deleteProcedure(slug);
  }
}

export const procedureService = new ProcedureService();
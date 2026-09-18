import type { Procedure } from '~/types/procedure'

export interface ProcedureProvider {
  getProcedures(): Promise<Procedure[]>
  getProcedureBySlug(slug: string): Promise<Procedure | null>
  createProcedure(data: Omit<Procedure, 'id' | 'slug'>): Promise<Procedure>
  updateProcedure(slug: string, data: Partial<Procedure>): Promise<Procedure>
  deleteProcedure(slug: string): Promise<boolean>
}
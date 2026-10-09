import type { Procedure } from '~/types/procedure'

// Lectura pública del catálogo (solo procedimientos activos y habilitados para la línea). Sin escritura.
export interface PublicProcedureProvider {
  getProcedures(): Promise<Procedure[]>
  getProcedureBySlug(slug: string): Promise<Procedure | null>
}

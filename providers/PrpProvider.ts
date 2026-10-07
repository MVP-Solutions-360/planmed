import type { Prp, PrpInput, PrpListParams, PrpPage } from '~/types/prp'

export interface PrpProvider {
  getPrps(params?: PrpListParams): Promise<PrpPage>
  getPrpById(id: number): Promise<Prp | null>
  createPrp(data: PrpInput): Promise<Prp>
  updatePrp(id: number, data: Partial<PrpInput>): Promise<Prp>
  // "Eliminar" en Hub desactiva el PRP; no borra el registro.
  deactivatePrp(id: number): Promise<Prp>
}

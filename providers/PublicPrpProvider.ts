import type { PublicPrp } from '~/types/prpPublic'

export interface PublicPrpProvider {
  // null si el micrositio no existe, está inactivo o no pertenece al tenant de Planmed.
  getBySlug(slug: string): Promise<PublicPrp | null>
}

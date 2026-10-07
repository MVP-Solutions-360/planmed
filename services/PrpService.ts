import type { PrpProvider } from '~/providers/PrpProvider'
import type { Prp, PrpInput, PrpListParams, PrpPage } from '~/types/prp'
import { HubPrpProvider } from '~/providers/HubPrpProvider'

export class PrpService {
  private provider: PrpProvider

  constructor(provider?: PrpProvider) {
    this.provider = provider || new HubPrpProvider();
  }

  async getPrps(params?: PrpListParams): Promise<PrpPage> {
    return this.provider.getPrps(params);
  }

  async getPrpById(id: number): Promise<Prp | null> {
    return this.provider.getPrpById(id);
  }

  async createPrp(data: PrpInput): Promise<Prp> {
    return this.provider.createPrp(this.normalize(data) as PrpInput);
  }

  async updatePrp(id: number, data: Partial<PrpInput>): Promise<Prp> {
    return this.provider.updatePrp(id, this.normalize(data));
  }

  async activatePrp(id: number): Promise<Prp> {
    return this.provider.updatePrp(id, { isActive: true });
  }

  async deactivatePrp(id: number): Promise<Prp> {
    return this.provider.deactivatePrp(id);
  }

  // Ruta pública del micrositio (independiente del código PRP).
  publicPath(slug: string): string {
    return `/prp/${slug}`;
  }

  // Hub también normaliza; se hace aquí para reflejarlo en la UI y evitar espacios accidentales.
  private normalize(data: Partial<PrpInput>): Partial<PrpInput> {
    const out = { ...data };
    if (out.name !== undefined) out.name = out.name.trim();
    if (out.externalCode !== undefined) out.externalCode = out.externalCode.trim().toUpperCase();
    if (out.slug !== undefined) out.slug = out.slug.trim().toLowerCase();
    if (typeof out.title === 'string') out.title = out.title.trim() || null;
    return out;
  }
}

export const prpService = new PrpService();

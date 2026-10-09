import type { PublicTestimonialsProvider } from '~/providers/PublicTestimonialsProvider'
import type { TestimonialsContent } from '~/types/testimonials'
import { HubPublicTestimonialsProvider } from '~/providers/HubPublicTestimonialsProvider'

// Lectura PÚBLICA de «Nuestros Pacientes»: Wellezy Hub (API pública /v1/web/patient-section) es la fuente de verdad.
// Para administración usa TestimonialsService.
export class PublicTestimonialsService {
  private provider: PublicTestimonialsProvider

  constructor(provider?: PublicTestimonialsProvider) {
    this.provider = provider || new HubPublicTestimonialsProvider()
  }

  getContent(): Promise<TestimonialsContent> {
    return this.provider.getContent()
  }
}

export const publicTestimonialsService = new PublicTestimonialsService()

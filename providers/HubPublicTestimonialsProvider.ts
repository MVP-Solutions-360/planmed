import type { PublicTestimonialsProvider } from './PublicTestimonialsProvider'
import type { Fetcher } from './HubTestimonialsProvider'
import type { TestimonialsContent } from '~/types/testimonials'

// Habla únicamente con la ruta interna de Nitro (/api/public/patient-section). Nitro consulta a Wellezy Hub con el tenant de la
// configuración de Planmed; este código no conoce la URL de Hub ni el tenant. Funciona igual en SSR y en el navegador (sin localStorage).

const requestFetch: Fetcher = (url, options) => (useRequestFetch() as any)(url, options)

export class HubPublicTestimonialsProvider implements PublicTestimonialsProvider {
  constructor(private readonly request: Fetcher = requestFetch) {}

  getContent(): Promise<TestimonialsContent> {
    return this.request<TestimonialsContent>('/api/public/patient-section')
  }
}

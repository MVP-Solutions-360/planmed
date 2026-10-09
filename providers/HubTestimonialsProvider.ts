import type { TestimonialsProvider } from './TestimonialsProvider'
import type { TestimonialsContent } from '~/types/testimonials'

// Administración de «Nuestros Pacientes» contra Wellezy Hub (fuente de verdad), SOLO a través de las rutas internas de Nitro
// (/api/admin/patient-section). El Bearer de Hub, company_id y linea_id nunca pasan por el navegador: Hub deriva la línea del
// usuario autenticado. No usa localStorage.

export type Fetcher = <T>(url: string, options?: Record<string, unknown>) => Promise<T>

// useRequestFetch (auto-import de Nuxt) reenvía la cookie de sesión en SSR; se resuelve al llamar, no al importar.
const requestFetch: Fetcher = (url, options) => (useRequestFetch() as any)(url, options)

const GENERIC_ERROR = 'No fue posible conectar con Wellezy Hub. Intenta nuevamente.'

export type SaveError = Error & { statusCode?: number, partial?: boolean, content?: TestimonialsContent | null }

export function toError(e: any): SaveError {
  const message = e?.data?.data?.message || e?.data?.message
  const error = new Error(typeof message === 'string' && message ? message : GENERIC_ERROR) as SaveError
  error.statusCode = e?.statusCode ?? e?.response?.status
  // Guardado parcial: el servidor aplicó parte de los cambios y devuelve lo que quedó guardado.
  if (e?.data?.data?.partial === true) {
    error.partial = true
    error.content = e.data.data.content ?? null
  }
  return error
}

export class HubTestimonialsProvider implements TestimonialsProvider {
  constructor(private readonly request: Fetcher = requestFetch) {}

  async getContent(): Promise<TestimonialsContent> {
    try {
      return await this.request<TestimonialsContent>('/api/admin/patient-section')
    } catch (e) {
      throw toError(e)
    }
  }

  async saveContent(data: TestimonialsContent): Promise<TestimonialsContent> {
    try {
      return await this.request<TestimonialsContent>('/api/admin/patient-section', { method: 'PUT', body: data })
    } catch (e) {
      throw toError(e)
    }
  }
}

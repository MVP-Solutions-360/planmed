import type { AboutContent, AboutErrors } from '#shared/utils/aboutContent'

// Administración de «Nosotros» a través de las rutas internas de Nitro (/api/admin/about). El contenido se persiste en el servidor
// de la web de Planmed (no en Wellezy Hub ni en el navegador). La sesión viaja en la cookie httpOnly; no se usa localStorage.

export type Fetcher = <T>(url: string, options?: Record<string, unknown>) => Promise<T>
export type AboutSaveError = Error & { statusCode?: number, errors: AboutErrors }

// useRequestFetch (auto-import de Nuxt) reenvía la cookie de sesión en SSR; se resuelve al llamar, no al importar.
const requestFetch: Fetcher = (url, options) => (useRequestFetch() as any)(url, options)

export function toAboutError(e: any): AboutSaveError {
  const data = e?.data?.data ?? e?.data
  const message = typeof data?.message === 'string' && data.message ? data.message : 'No fue posible conectar con el servidor. Intenta nuevamente.'
  const error = new Error(message) as AboutSaveError
  error.statusCode = e?.statusCode ?? e?.response?.status
  error.errors = data?.errors && typeof data.errors === 'object' ? data.errors : {}
  return error
}

export class AboutService {
  constructor(private readonly request: Fetcher = requestFetch) {}

  async getContent(): Promise<AboutContent> {
    try { return await this.request<AboutContent>('/api/admin/about') } catch (e) { throw toAboutError(e) }
  }

  async saveContent(content: AboutContent): Promise<AboutContent> {
    try { return await this.request<AboutContent>('/api/admin/about', { method: 'PUT', body: content }) } catch (e) { throw toAboutError(e) }
  }
}

export const aboutService = new AboutService()

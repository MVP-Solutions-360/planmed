import type { RecommendationsProvider } from './RecommendationsProvider'
import type { RecommendationGroup, RecommendationPage } from '~/types/recommendations'

// Administración de las páginas de recomendaciones contra Wellezy Hub (fuente de verdad), SOLO a través de las rutas internas
// de Nitro (/api/admin/recommendations*). El Bearer de Hub, company_id y linea_id nunca pasan por el navegador: Hub deriva la
// línea del usuario autenticado. El admin identifica por slug; Nitro lo resuelve al id de Hub.

export type Fetcher = <T>(url: string, options?: Record<string, unknown>) => Promise<T>

// useRequestFetch (auto-import de Nuxt) reenvía la cookie de sesión en SSR; se resuelve al llamar, no al importar.
const requestFetch: Fetcher = (url, options) => (useRequestFetch() as any)(url, options)

const GENERIC_ERROR = 'No fue posible conectar con Wellezy Hub. Intenta nuevamente.'

export function toError(e: any): Error {
  const message = e?.data?.data?.message || e?.data?.message
  const error = new Error(typeof message === 'string' && message ? message : GENERIC_ERROR) as Error & { statusCode?: number, fieldErrors?: Record<string, unknown> }
  error.statusCode = e?.statusCode ?? e?.response?.status
  // Errores de validación por campo que devuelve el Hub (422); la pantalla los muestra junto a la acción que falló.
  const fieldErrors = e?.data?.data?.errors ?? e?.data?.errors
  if (fieldErrors && typeof fieldErrors === 'object') error.fieldErrors = fieldErrors
  return error
}

export class HubRecommendationsProvider implements RecommendationsProvider {
  private readonly request: Fetcher

  // Fetcher inyectable (pruebas); por defecto useRequestFetch de Nuxt. Sin "parameter properties" para poder ejecutarse con Node.
  constructor(request: Fetcher = requestFetch) {
    this.request = request
  }

  async getPages(): Promise<RecommendationPage[]> {
    try {
      return (await this.request<{ data: RecommendationPage[] }>('/api/admin/recommendations')).data
    } catch (e) {
      throw toError(e)
    }
  }

  async getPage(slug: string): Promise<RecommendationPage | null> {
    return (await this.getPages()).find(p => p.slug === slug) ?? null
  }

  /**
   * Guarda título, etiqueta, video, contenido y publicación. La imagen solo se envía si cambió: una data URL (nueva) o '' (quitar);
   * una URL ya publicada no se reenvía.
   */
  async savePage(page: RecommendationPage): Promise<RecommendationPage> {
    const body: Record<string, unknown> = {
      title: page.title,
      menuLabel: page.menuLabel,
      videoUrl: page.videoUrl,
      content: page.content,
      published: page.published
    }
    if (page.image === '' || page.image.startsWith('data:')) body.image = page.image
    try {
      return await this.request<RecommendationPage>(`/api/admin/recommendations/${encodeURIComponent(page.slug)}`, { method: 'PUT', body })
    } catch (e) {
      throw toError(e)
    }
  }

  /** Publica u oculta: PUT parcial con SOLO `published` (el contenido guardado no se reenvía ni se modifica). */
  async setPublished(slug: string, published: boolean): Promise<RecommendationPage> {
    try {
      return await this.request<RecommendationPage>(`/api/admin/recommendations/${encodeURIComponent(slug)}`, { method: 'PUT', body: { published } })
    } catch (e) {
      throw toError(e)
    }
  }

  async createPage(data: { title: string, group: RecommendationGroup }): Promise<RecommendationPage> {
    const title = data.title.trim()
    if (!title) throw new Error('Escribe un título para la página.')
    try {
      return await this.request<RecommendationPage>('/api/admin/recommendations', { method: 'POST', body: { title, group: data.group } })
    } catch (e) {
      throw toError(e)
    }
  }

  async deletePage(slug: string): Promise<void> {
    try {
      await this.request(`/api/admin/recommendations/${encodeURIComponent(slug)}`, { method: 'DELETE' })
    } catch (e) {
      throw toError(e)
    }
  }
}

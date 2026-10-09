import type { NewsProvider } from './NewsProvider'
import type { NewsArticle } from '~/types/news'
import { useRequestFetch } from '#imports'

// Administración de noticias contra Wellezy Hub (fuente de verdad), SOLO a través de las rutas internas de Nitro
// (/api/admin/news*). El Bearer de Hub, company_id y linea_id nunca pasan por el navegador; el autor lo fija Hub.
// El identificador de ruta del admin es el slug; Hub identifica por id, así que se resuelve el id por slug.

const GENERIC_ERROR = 'No fue posible conectar con Wellezy Hub. Intenta nuevamente.'

function toError(e: any): Error {
  const message = e?.data?.data?.message || e?.data?.message
  const error = new Error(typeof message === 'string' && message ? message : GENERIC_ERROR) as Error & { statusCode?: number }
  error.statusCode = e?.statusCode ?? e?.response?.status
  return error
}

export class HubNewsProvider implements NewsProvider {
  private async list(query: Record<string, unknown>): Promise<NewsArticle[]> {
    const request = useRequestFetch()
    try {
      const res = await request<{ data: NewsArticle[] }>('/api/admin/news', { query })
      return res.data
    } catch (e) {
      throw toError(e)
    }
  }

  async getNews(): Promise<NewsArticle[]> {
    return this.list({ per_page: 100 })
  }

  async getNewsBySlug(slug: string): Promise<NewsArticle | null> {
    const found = await this.list({ search: slug, per_page: 100 })
    return found.find(n => n.slug === slug) ?? null
  }

  async createNews(data: Omit<NewsArticle, 'id' | 'slug'>): Promise<NewsArticle> {
    const request = useRequestFetch()
    try {
      return await request<NewsArticle>('/api/admin/news', { method: 'POST', body: data })
    } catch (e) {
      throw toError(e)
    }
  }

  async updateNews(slug: string, data: Partial<NewsArticle>): Promise<NewsArticle> {
    const current = await this.getNewsBySlug(slug)
    if (!current) throw new Error('Noticia no encontrada')
    const request = useRequestFetch()
    try {
      return await request<NewsArticle>(`/api/admin/news/${current.id}`, { method: 'PUT', body: data })
    } catch (e) {
      throw toError(e)
    }
  }

  /** En Hub "eliminar" despublica (la noticia pasa a borrador y se conserva). */
  async deleteNews(slug: string): Promise<boolean> {
    const current = await this.getNewsBySlug(slug)
    if (!current) return false
    const request = useRequestFetch()
    try {
      await request(`/api/admin/news/${current.id}`, { method: 'DELETE' })
      return true
    } catch (e) {
      throw toError(e)
    }
  }
}

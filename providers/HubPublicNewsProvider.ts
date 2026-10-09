import type { PublicNewsProvider } from './PublicNewsProvider'
import type { NewsArticle } from '~/types/news'
import { useRequestFetch } from '#imports'

// Habla únicamente con las rutas internas de Nitro (/api/public/news*). Nitro consulta a Wellezy Hub con el tenant de la
// configuración de Planmed; este código no conoce la URL de Hub ni el tenant. Funciona igual en SSR y en el navegador
// (no depende de localStorage), así que una URL directa /noticias/{slug} resuelve igual que la navegación interna.

export class HubPublicNewsProvider implements PublicNewsProvider {
  async getNews(): Promise<NewsArticle[]> {
    const request = useRequestFetch()
    return await request<NewsArticle[]>('/api/public/news')
  }

  async getNewsBySlug(slug: string): Promise<NewsArticle | null> {
    const request = useRequestFetch()
    try {
      return await request<NewsArticle>(`/api/public/news/${encodeURIComponent(slug)}`)
    } catch (e: any) {
      if ((e?.statusCode ?? e?.response?.status) === 404) return null
      throw e
    }
  }
}

import type { SitePageContent, SitePageSlug } from '#shared/utils/sitePages'
import { toAboutError, type Fetcher } from '~/services/AboutService'

// Administración de las páginas informativas simples (/api/admin/pages/<slug>). Persistencia local en el servidor de la web.
const requestFetch: Fetcher = (url, options) => (useRequestFetch() as any)(url, options)

export class SitePagesService {
  constructor(private readonly request: Fetcher = requestFetch) {}

  async getPage(slug: SitePageSlug): Promise<SitePageContent> {
    try { return await this.request<SitePageContent>(`/api/admin/pages/${slug}`) } catch (e) { throw toAboutError(e) }
  }

  async savePage(slug: SitePageSlug, content: SitePageContent): Promise<SitePageContent> {
    try { return await this.request<SitePageContent>(`/api/admin/pages/${slug}`, { method: 'PUT', body: content }) } catch (e) { throw toAboutError(e) }
  }
}

export const sitePagesService = new SitePagesService()

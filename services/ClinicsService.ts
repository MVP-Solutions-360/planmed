import type { ClinicsContent } from '#shared/utils/clinics'
import { toAboutError, type Fetcher } from '~/services/AboutService'

// Administración de «Clínicas aliadas» (/api/admin/clinics). El contenido y los archivos se guardan en el servidor de la web de Planmed.
const requestFetch: Fetcher = (url, options) => (useRequestFetch() as any)(url, options)

export class ClinicsService {
  constructor(private readonly request: Fetcher = requestFetch) {}

  async getContent(): Promise<ClinicsContent> {
    try { return await this.request<ClinicsContent>('/api/admin/clinics') } catch (e) { throw toAboutError(e) }
  }

  async saveContent(content: ClinicsContent): Promise<ClinicsContent> {
    try { return await this.request<ClinicsContent>('/api/admin/clinics', { method: 'PUT', body: content }) } catch (e) { throw toAboutError(e) }
  }

  /** Sube una imagen o un documento (data URL) y devuelve su URL pública. */
  async uploadFile(dataUrl: string, kind: 'image' | 'document'): Promise<string> {
    try { return (await this.request<{ url: string }>('/api/admin/clinics/upload', { method: 'POST', body: { dataUrl, kind } })).url } catch (e) { throw toAboutError(e) }
  }
}

export const clinicsService = new ClinicsService()

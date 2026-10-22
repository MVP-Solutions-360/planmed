import type { NewsSectionAdmin, NewsSectionInput } from '~/types/news'

// Administración de las secciones de UNA noticia contra Wellezy Hub, SOLO a través de /api/admin/news-sections/* (Nitro).
// El Bearer de Hub, company_id y linea_id nunca pasan por el navegador; Hub resuelve la línea del token. Sin reintentos: una escritura
// repetida podría duplicar contenido.

export type Fetcher = <T>(url: string, options?: Record<string, unknown>) => Promise<T>

const requestFetch: Fetcher = (url, options) => (useRequestFetch() as any)(url, options)

const BASE = '/api/admin/news-sections'
const GENERIC_ERROR = 'No fue posible conectar con Wellezy Hub. Intenta nuevamente.'

function toError(e: any): Error {
  const message = e?.data?.data?.message || e?.data?.message
  const error = new Error(typeof message === 'string' && message ? message : GENERIC_ERROR) as Error & { statusCode?: number, fieldErrors?: Record<string, unknown> }
  error.statusCode = e?.statusCode ?? e?.response?.status
  const fieldErrors = e?.data?.data?.errors ?? e?.data?.errors
  if (fieldErrors && typeof fieldErrors === 'object') error.fieldErrors = fieldErrors
  return error
}

export class HubNewsSectionsProvider {
  private readonly request: Fetcher

  constructor(request: Fetcher = requestFetch) {
    this.request = request
  }

  private async call<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: Record<string, unknown>): Promise<T> {
    try {
      const res = await this.request<{ data?: T }>(`${BASE}${path}`, { method, body })
      if (!res || typeof res !== 'object') throw Object.assign(new Error('Wellezy Hub respondió con un formato inesperado.'), { statusCode: 503 })
      return res.data as T
    } catch (e) {
      throw toError(e)
    }
  }

  list(postId: number) { return this.call<NewsSectionAdmin[]>('GET', `/posts/${postId}`) }
  create(postId: number, data: NewsSectionInput) { return this.call<NewsSectionAdmin>('POST', `/posts/${postId}`, { ...data }) }
  reorder(postId: number, ids: number[]) { return this.call<unknown>('POST', `/posts/${postId}/reorder`, { ids }) }
  update(id: number, data: Partial<NewsSectionInput>) { return this.call<NewsSectionAdmin>('PUT', `/sections/${id}`, { ...data }) }
  remove(id: number) { return this.call<void>('DELETE', `/sections/${id}`) }
  /** Imagen de un bloque de tipo imagen (data URL). Devuelve la sección completa con sus bloques. */
  setBlockImage(blockId: number, dataUrl: string) { return this.call<NewsSectionAdmin>('POST', `/blocks/${blockId}/image`, { image: dataUrl }) }
  removeBlockImage(blockId: number) { return this.call<NewsSectionAdmin>('DELETE', `/blocks/${blockId}/image`) }
}

export const newsSectionsAdmin = new HubNewsSectionsProvider()

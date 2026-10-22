import type { ProcedureSectionAdmin, ProcedureSectionInput } from '~/types/procedureSection'

// Administración de las secciones de un procedimiento contra Wellezy Hub, SOLO a través de /api/admin/procedure-sections/* (Nitro).
// El Bearer de Hub, company_id y linea_id nunca pasan por el navegador; Hub resuelve la línea del token. Sin reintentos: una escritura
// repetida podría duplicar contenido.

export type Fetcher = <T>(url: string, options?: Record<string, unknown>) => Promise<T>

const requestFetch: Fetcher = (url, options) => (useRequestFetch() as any)(url, options)

const BASE = '/api/admin/procedure-sections'
const GENERIC_ERROR = 'No fue posible conectar con Wellezy Hub. Intenta nuevamente.'

function toError(e: any): Error {
  const message = e?.data?.data?.message || e?.data?.message
  const error = new Error(typeof message === 'string' && message ? message : GENERIC_ERROR) as Error & { statusCode?: number, fieldErrors?: Record<string, unknown> }
  error.statusCode = e?.statusCode ?? e?.response?.status
  const fieldErrors = e?.data?.data?.errors ?? e?.data?.errors
  if (fieldErrors && typeof fieldErrors === 'object') error.fieldErrors = fieldErrors
  return error
}

export class HubProcedureSectionsProvider {
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

  list(procedureId: number) { return this.call<ProcedureSectionAdmin[]>('GET', `/procedures/${procedureId}`) }
  create(procedureId: number, data: ProcedureSectionInput) { return this.call<ProcedureSectionAdmin>('POST', `/procedures/${procedureId}`, data) }
  reorder(procedureId: number, ids: number[]) { return this.call<unknown>('POST', `/procedures/${procedureId}/reorder`, { ids }) }
  update(id: number, data: ProcedureSectionInput) { return this.call<ProcedureSectionAdmin>('PUT', `/sections/${id}`, data) }
  remove(id: number) { return this.call<void>('DELETE', `/sections/${id}`) }
  setImage(id: number, dataUrl: string) { return this.call<ProcedureSectionAdmin>('POST', `/sections/${id}/image`, { image: dataUrl }) }
  removeImage(id: number) { return this.call<ProcedureSectionAdmin>('DELETE', `/sections/${id}/image`) }
  /** Imagen de un bloque de tipo imagen (data URL). Devuelve la sección completa con sus bloques. */
  setBlockImage(blockId: number, dataUrl: string) { return this.call<ProcedureSectionAdmin>('POST', `/blocks/${blockId}/image`, { image: dataUrl }) }
  removeBlockImage(blockId: number) { return this.call<ProcedureSectionAdmin>('DELETE', `/blocks/${blockId}/image`) }
}

export const procedureSectionsAdmin = new HubProcedureSectionsProvider()

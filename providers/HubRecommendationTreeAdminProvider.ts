import type { SectionInput, SectionTypesCatalog, TreeIntro, TreeItem, TreeSection, TreeShortLink, TreeSubtopic, TreeTopic } from '~/types/recommendationTree'

// Administración de la jerarquía de Recomendaciones contra Wellezy Hub, SOLO a través de /api/admin/recommendation-tree/* (Nitro).
// El Bearer de Hub, company_id y linea_id nunca pasan por el navegador. No hay reintentos: una escritura repetida podría duplicar contenido.

export type Fetcher = <T>(url: string, options?: Record<string, unknown>) => Promise<T>

// useRequestFetch (auto-import de Nuxt) reenvía la cookie de sesión en SSR; se resuelve al llamar, no al importar.
const requestFetch: Fetcher = (url, options) => (useRequestFetch() as any)(url, options)

const BASE = '/api/admin/recommendation-tree'

const GENERIC_ERROR = 'No fue posible conectar con Wellezy Hub. Intenta nuevamente.'

/** Error de la petición → Error con `statusCode` y `fieldErrors` (los errores de validación por campo que devuelve Hub, 422). */
function toError(e: any): Error {
  const message = e?.data?.data?.message || e?.data?.message
  const error = new Error(typeof message === 'string' && message ? message : GENERIC_ERROR) as Error & { statusCode?: number, fieldErrors?: Record<string, unknown> }
  error.statusCode = e?.statusCode ?? e?.response?.status
  const fieldErrors = e?.data?.data?.errors ?? e?.data?.errors
  if (fieldErrors && typeof fieldErrors === 'object') error.fieldErrors = fieldErrors
  return error
}

export type TopicInput = Partial<{ title: string, menu_label: string, slug: string, orden: number, published: boolean }>
export type SubtopicInput = Partial<{ title: string, menu_label: string, slug: string, grupo: string, orden: number, published: boolean, topic_id: number }>
export type ItemInput = Partial<{ title: string, content: string | null, slug: string, orden: number, published: boolean }>

export class HubRecommendationTreeAdminProvider {
  private readonly request: Fetcher

  constructor(request: Fetcher = requestFetch) {
    this.request = request
  }

  private async call<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: Record<string, unknown>): Promise<T> {
    try {
      const res = await this.request<{ data?: T }>(`${BASE}${path}`, { method, body })
      // Una respuesta que no es un objeto JSON no es un resultado verificable: nunca se trata como éxito.
      if (!res || typeof res !== 'object') throw Object.assign(new Error('Wellezy Hub respondió con un formato inesperado.'), { statusCode: 503 })
      return res.data as T
    } catch (e) {
      throw toError(e)
    }
  }

  sectionTypes() { return this.call<SectionTypesCatalog>('GET', '/section-types') }

  // Temas
  listTopics() { return this.call<TreeTopic[]>('GET', '/topics') }
  getTopic(id: number) { return this.call<TreeTopic>('GET', `/topics/${id}`) }
  createTopic(data: TopicInput) { return this.call<TreeTopic>('POST', '/topics', data) }
  updateTopic(id: number, data: TopicInput) { return this.call<TreeTopic>('PUT', `/topics/${id}`, data) }
  deleteTopic(id: number) { return this.call<void>('DELETE', `/topics/${id}`) }
  reorderTopics(ids: number[]) { return this.call<unknown>('POST', '/topics/reorder', { ids }) }

  // Subtemas (el tema sale de la ruta; nunca del cuerpo)
  listSubtopics(topicId: number) { return this.call<TreeSubtopic[]>('GET', `/topics/${topicId}/subtopics`) }
  createSubtopic(topicId: number, data: SubtopicInput) { return this.call<TreeSubtopic>('POST', `/topics/${topicId}/subtopics`, data) }
  reorderSubtopics(topicId: number, ids: number[]) { return this.call<unknown>('POST', `/topics/${topicId}/subtopics/reorder`, { ids }) }
  getSubtopic(id: number) { return this.call<TreeSubtopic>('GET', `/subtopics/${id}`) }
  updateSubtopic(id: number, data: SubtopicInput) { return this.call<TreeSubtopic>('PUT', `/subtopics/${id}`, data) }
  deleteSubtopic(id: number) { return this.call<void>('DELETE', `/subtopics/${id}`) }

  // Introducción (independiente de las secciones)
  getIntro(id: number) { return this.call<TreeIntro>('GET', `/subtopics/${id}/intro`) }
  updateIntro(id: number, data: { content?: string | null, video_url?: string | null }) { return this.call<TreeIntro>('PUT', `/subtopics/${id}/intro`, data) }
  setIntroImage(id: number, dataUrl: string) { return this.call<TreeIntro>('POST', `/subtopics/${id}/intro/image`, { image: dataUrl }) }
  removeIntroImage(id: number) { return this.call<TreeIntro>('DELETE', `/subtopics/${id}/intro/image`) }
  getShortLink(id: number) { return this.call<TreeShortLink>('GET', `/subtopics/${id}/short-link`) }

  // Secciones
  listSections(subtopicId: number) { return this.call<TreeSection[]>('GET', `/subtopics/${subtopicId}/sections`) }
  createSection(subtopicId: number, data: SectionInput) { return this.call<TreeSection>('POST', `/subtopics/${subtopicId}/sections`, data) }
  reorderSections(subtopicId: number, ids: number[]) { return this.call<unknown>('POST', `/subtopics/${subtopicId}/sections/reorder`, { ids }) }
  getSection(id: number) { return this.call<TreeSection>('GET', `/sections/${id}`) }
  updateSection(id: number, data: SectionInput) { return this.call<TreeSection>('PUT', `/sections/${id}`, data) }
  deleteSection(id: number) { return this.call<void>('DELETE', `/sections/${id}`) }
  setSectionImage(id: number, dataUrl: string) { return this.call<TreeSection>('POST', `/sections/${id}/image`, { image: dataUrl }) }
  removeSectionImage(id: number) { return this.call<TreeSection>('DELETE', `/sections/${id}/image`) }
  /** Imagen de un bloque de tipo imagen (data URL). Devuelve la sección completa con sus bloques. */
  setBlockImage(blockId: number, dataUrl: string) { return this.call<TreeSection>('POST', `/section-blocks/${blockId}/image`, { image: dataUrl }) }
  removeBlockImage(blockId: number) { return this.call<TreeSection>('DELETE', `/section-blocks/${blockId}/image`) }

  // Recomendaciones individuales (solo en secciones de tipo «recommendations»)
  listItems(sectionId: number) { return this.call<TreeItem[]>('GET', `/sections/${sectionId}/items`) }
  createItem(sectionId: number, data: ItemInput) { return this.call<TreeItem>('POST', `/sections/${sectionId}/items`, data) }
  reorderItems(sectionId: number, ids: number[]) { return this.call<unknown>('POST', `/sections/${sectionId}/items/reorder`, { ids }) }
  updateItem(id: number, data: ItemInput) { return this.call<TreeItem>('PUT', `/items/${id}`, data) }
  deleteItem(id: number) { return this.call<void>('DELETE', `/items/${id}`) }
}

export const recommendationTreeAdmin = new HubRecommendationTreeAdminProvider()

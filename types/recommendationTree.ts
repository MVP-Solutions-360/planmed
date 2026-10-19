// Modelos de la API administrativa de Recomendaciones de Wellezy Hub (/cms/recommendation-*), tal como los entrega Hub (snake_case).
// Jerarquía: Tema principal → Subtemas → Secciones → Recomendaciones individuales.

export interface TreeTopic {
  id: number
  slug: string
  title: string
  menu_label: string
  orden: number
  published: boolean
  subtopics_count: number
  published_subtopics_count: number
}

export interface TreeIntro { content: string | null, video_url: string | null, image_url: string | null }

export interface TreeSubtopic {
  id: number
  topic_id: number
  topic: { id: number, slug: string, title: string, published: boolean } | null
  slug: string
  grupo: 'general' | 'cuidados' | 'revision'
  menu_label: string
  title: string
  orden: number
  published: boolean
  is_custom: boolean
  sections_count: number
  intro: TreeIntro
  /** Enlace corto activo (solo lectura, de Hub) o null. */
  short_url: string | null
}

export type SectionType = 'description' | 'recommendations' | 'callout' | 'contact' | 'custom'
export type SectionField = 'subtitle' | 'content' | 'image' | 'video' | 'layout' | 'cta'

export interface TreeSection {
  id: number
  recommendation_page_id: number
  type: SectionType
  type_label: string
  title: string
  subtitle: string | null
  content: string | null
  layout: 'stacked' | 'media_left' | 'media_right'
  image_url: string | null
  image_alt: string | null
  video_url: string | null
  cta: { label: string, url: string } | null
  orden: number
  visible: boolean
  items_count: number
  published_items_count: number
}

export interface TreeItem {
  id: number
  recommendation_page_id: number
  recommendation_section_id: number
  slug: string
  title: string
  content: string | null
  orden: number
  published: boolean
  short_url: string | null
}

export interface SectionTypesCatalog {
  types: { value: SectionType, label: string, fields: SectionField[] }[]
  layouts: { value: string, label: string }[]
}

export interface TreeShortLink { url: string | null, active: boolean, state: string, message: string }

/** Cuerpo de crear/editar una sección (solo los campos enviados). */
export type SectionInput = Partial<{
  type: SectionType, title: string, subtitle: string | null, content: string | null, layout: string, image_alt: string | null,
  video_url: string | null, cta_label: string | null, cta_url: string | null, orden: number, visible: boolean
}>

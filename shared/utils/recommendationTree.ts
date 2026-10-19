// Árbol de Recomendaciones de Wellezy Hub: TEMA PRINCIPAL → SUBTEMAS → SECCIONES → RECOMENDACIONES.
// Módulo PURO (sin imports), compartido por el navegador, el servidor Nitro y las pruebas.
//
// Contrato real del Hub (GET /api/v1/web/recommendation-topics[/{topic}[/{subtopic}]]), solo lectura y solo contenido publicado:
//   · lista:    data[] = { slug, menu_label, title, orden, path, subtopics[] }
//               subtopics[] = { slug, grupo, menu_label, title, orden, path, short_url }
//   · subtema:  data = { slug, grupo, menu_label, title, orden, path, short_url, topic: { slug, title, menu_label },
//               intro: { content, image: { url, alt } | null, video: { provider, url, embed_url } | null },
//               sections[] = { type, orden, title, subtitle, content, layout, image, video, cta: { label, url } | null,
//                              items[] = { slug, title, content, orden } } }
// `path` NO se usa: depende de la configuración de la línea (puede ser null o la ruta histórica). Las URLs de Planmed se construyen
// siempre con los slugs: /recomendaciones/{tema}/{subtema}. Todo valor que no cumple el contrato se descarta; nunca se inventa.

export const SECTION_TYPES = ['description', 'recommendations', 'callout', 'contact', 'custom'] as const
export type SectionType = typeof SECTION_TYPES[number]
export const SECTION_LAYOUTS = ['stacked', 'media_left', 'media_right'] as const
export type SectionLayout = typeof SECTION_LAYOUTS[number]

export interface TreeImage { url: string, alt: string }
export interface TreeVideo { url: string, embedUrl: string }
export interface TreeCta { label: string, url: string }
export interface TreeItem { slug: string, title: string, content: string, order: number }
export interface TreeSection {
  type: SectionType
  order: number
  title: string
  subtitle: string
  /** HTML tal como lo entrega el Hub: se sanea SIEMPRE al mostrarlo (CommonRichContent). */
  content: string
  layout: SectionLayout
  image: TreeImage | null
  video: TreeVideo | null
  cta: TreeCta | null
  items: TreeItem[]
}
export interface TreeSubtopicSummary { slug: string, group: string, menuLabel: string, title: string, order: number, shortUrl: string | null }
export interface TreeTopic { slug: string, menuLabel: string, title: string, order: number, subtopics: TreeSubtopicSummary[] }
export interface TreeSubtopic extends TreeSubtopicSummary {
  topic: { slug: string, title: string, menuLabel: string }
  intro: { content: string, image: TreeImage | null, video: TreeVideo | null }
  sections: TreeSection[]
}

// ── Utilidades de texto y validación ───────────────────────────────────────────────────────────────────────────────────────────

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

export const isRecommendationSlug = (v: unknown): v is string => typeof v === 'string' && v.length <= 120 && SLUG_RE.test(v)
const str = (v: unknown) => (typeof v === 'string' ? v.replace(CONTROL_RE, '') : '')
const label = (v: unknown) => str(v).replace(/\s+/g, ' ').trim()
const int = (v: unknown) => (Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : 0)
const obj = (v: unknown): Record<string, any> | null => (v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, any> : null)

/** URL absoluta http(s) sin credenciales (imágenes y enlaces cortos). Cualquier otro esquema (javascript:, data:, file:…) => null. */
export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const raw = value.trim()
  if (!raw || raw.length > 2048 || /[\u0000- \u007F\\]/.test(raw)) return null
  try {
    const u = new URL(raw)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    if (u.username || u.password || !u.hostname) return null
    return raw
  } catch {
    return null
  }
}

/**
 * Destino de un botón de acción: las mismas reglas del Hub (https, mailto:, tel: o ruta interna «/ruta»). Un http: sin cifrar, una ruta
 * «//otro-sitio», javascript:, data: o un enlace con credenciales no son válidos: el botón simplemente no se muestra.
 */
export function safeCtaUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const raw = value.trim()
  if (!raw || raw.length > 2048 || /[\u0000- \u007F\\]/.test(raw)) return null
  if (raw.startsWith('/')) return raw.startsWith('//') ? null : raw
  if (/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(raw)) return raw
  if (/^tel:\+?[0-9().-]{5,25}$/i.test(raw)) return raw
  try {
    const u = new URL(raw)
    return u.protocol === 'https:' && !!u.hostname && !u.username && !u.password ? raw : null
  } catch {
    return null
  }
}

const YT_ID_RE = /^[A-Za-z0-9_-]{6,20}$/

/** Vídeo de YouTube validado. Solo se acepta un embed de youtube.com (o youtube-nocookie.com) con un identificador válido. */
export function safeVideo(value: unknown): TreeVideo | null {
  const v = obj(value)
  if (!v) return null
  const candidates = [v.embed_url, v.url]
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue
    try {
      const u = new URL(candidate.trim())
      if (u.protocol !== 'https:') continue
      const host = u.hostname.replace(/^www\./, '')
      let id = ''
      if ((host === 'youtube.com' || host === 'youtube-nocookie.com') && u.pathname.startsWith('/embed/')) id = u.pathname.slice('/embed/'.length)
      else if (host === 'youtube.com' && u.pathname === '/watch') id = u.searchParams.get('v') ?? ''
      else if (host === 'youtu.be') id = u.pathname.slice(1)
      if (YT_ID_RE.test(id)) return { url: `https://www.youtube.com/watch?v=${id}`, embedUrl: `https://www.youtube.com/embed/${id}` }
    } catch { /* siguiente candidato */ }
  }
  return null
}

function image(value: unknown): TreeImage | null {
  const v = obj(value)
  const url = safeHttpUrl(v?.url)
  return url ? { url, alt: label(v?.alt) } : null
}

/** Texto plano de un HTML (sin etiquetas ni entidades básicas), para decidir si hay contenido real y para descripciones SEO. */
export function plainText(html: unknown): string {
  return str(html)
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

export const hasText = (html: unknown) => plainText(html) !== ''

// ── Mapeo del contrato ─────────────────────────────────────────────────────────────────────────────────────────────────────────

function summary(d: unknown): TreeSubtopicSummary | null {
  const s = obj(d)
  if (!s || !isRecommendationSlug(s.slug)) return null
  const title = label(s.title)
  const menuLabel = label(s.menu_label) || title
  if (!menuLabel) return null
  return { slug: s.slug, group: label(s.grupo), menuLabel, title: title || menuLabel, order: int(s.orden), shortUrl: safeHttpUrl(s.short_url) }
}

/**
 * Lista del Hub → árbol del menú. Respeta el orden recibido; descarta entradas sin slug o sin texto, subtemas repetidos (un mismo
 * subtema nunca aparece dos veces, ni en dos temas) y temas que se quedan sin subtemas (no se muestran opciones vacías).
 */
export function fromPublicTopics(data: unknown): TreeTopic[] {
  if (!Array.isArray(data)) return []
  const seenTopics = new Set<string>()
  const seenSubtopics = new Set<string>()
  const out: TreeTopic[] = []
  for (const raw of data) {
    const t = obj(raw)
    if (!t || !isRecommendationSlug(t.slug) || seenTopics.has(t.slug)) continue
    const title = label(t.title)
    const menuLabel = label(t.menu_label) || title
    if (!menuLabel) continue
    const subtopics: TreeSubtopicSummary[] = []
    for (const rawSub of Array.isArray(t.subtopics) ? t.subtopics : []) {
      const sub = summary(rawSub)
      if (!sub || seenSubtopics.has(sub.slug)) continue
      seenSubtopics.add(sub.slug)
      subtopics.push(sub)
    }
    if (!subtopics.length) continue
    seenTopics.add(t.slug)
    out.push({ slug: t.slug, menuLabel, title: title || menuLabel, order: int(t.orden), subtopics })
  }
  return out
}

function item(d: unknown): TreeItem | null {
  const i = obj(d)
  if (!i) return null
  const slug = isRecommendationSlug(i.slug) ? i.slug : ''
  const title = label(i.title)
  const content = str(i.content)
  // Una recomendación sin título ni texto no tiene nada que mostrar.
  if (!title && !hasText(content)) return null
  return { slug, title, content, order: int(i.orden) }
}

function section(d: unknown): TreeSection | null {
  const s = obj(d)
  if (!s) return null
  // Un tipo desconocido (el Hub puede añadir tipos nuevos) se muestra como sección genérica: nunca se oculta contenido por eso.
  const type = (SECTION_TYPES as readonly string[]).includes(s.type) ? s.type as SectionType : 'custom'
  const layout = (SECTION_LAYOUTS as readonly string[]).includes(s.layout) ? s.layout as SectionLayout : 'stacked'
  const ctaLabel = label(s.cta?.label)
  const ctaUrl = safeCtaUrl(s.cta?.url)
  const items = (Array.isArray(s.items) ? s.items : []).map(item).filter((i): i is TreeItem => !!i)
  return {
    type,
    order: int(s.orden),
    title: label(s.title),
    subtitle: label(s.subtitle),
    content: str(s.content),
    layout,
    image: image(s.image),
    video: safeVideo(s.video),
    // El botón es opcional: sin texto o con un destino no válido no existe (no se reserva espacio).
    cta: ctaLabel && ctaUrl ? { label: ctaLabel, url: ctaUrl } : null,
    items
  }
}

/** Detalle del subtema del Hub → modelo de Planmed. null si no cumple el contrato mínimo (slug, título y tema). */
export function fromPublicSubtopic(data: unknown): TreeSubtopic | null {
  const d = obj(data)
  const base = summary(d)
  const topic = obj(d?.topic)
  if (!d || !base || !topic || !isRecommendationSlug(topic.slug)) return null
  const topicTitle = label(topic.title) || label(topic.menu_label)
  if (!topicTitle) return null
  const intro = obj(d.intro)
  return {
    ...base,
    topic: { slug: topic.slug, title: topicTitle, menuLabel: label(topic.menu_label) || topicTitle },
    intro: { content: str(intro?.content), image: image(intro?.image), video: safeVideo(intro?.video) },
    sections: (Array.isArray(d.sections) ? d.sections : []).map(section).filter((s): s is TreeSection => !!s)
  }
}

// ── Rutas y utilidades del árbol ───────────────────────────────────────────────────────────────────────────────────────────────

/** Rutas de Planmed: siempre construidas con los slugs (el campo `path` del Hub no se usa). */
export const topicPath = (topicSlug: string) => `/recomendaciones/${topicSlug}`
export const subtopicPath = (topicSlug: string, subtopicSlug: string) => `/recomendaciones/${topicSlug}/${subtopicSlug}`

/** Tema al que pertenece un subtema (por su slug), o null. */
export function findSubtopicOwner(topics: TreeTopic[], subtopicSlug: string): TreeTopic | null {
  return topics.find(t => t.subtopics.some(s => s.slug === subtopicSlug)) ?? null
}
export const findTopic = (topics: TreeTopic[], topicSlug: string): TreeTopic | null => topics.find(t => t.slug === topicSlug) ?? null
export const treeSubtopicSlugs = (topics: TreeTopic[]): Set<string> => new Set(topics.flatMap(t => t.subtopics.map(s => s.slug)))

/** Qué debe mostrar una sección según sus datos reales (los tipos no comparten campos). */
export function sectionParts(s: TreeSection) {
  const hasContent = hasText(s.content)
  return {
    hasContent,
    hasItems: s.items.length > 0,
    hasMedia: !!s.image || !!s.video,
    hasCta: !!s.cta,
    // Nada que mostrar salvo, a lo sumo, el título: se omite la sección entera si ni siquiera tiene título.
    isEmpty: !hasContent && !s.items.length && !s.image && !s.video && !s.cta
  }
}

// ── SEO ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface SubtopicSeo { title: string, description: string, image: string | null, canonicalPath: string }

/** Metadatos del subtema: título, descripción (introducción o, si no hay, su primera sección con texto), imagen y ruta canónica. */
export function subtopicSeo(sub: TreeSubtopic): SubtopicSeo {
  const firstText = hasText(sub.intro.content) ? sub.intro.content : sub.sections.find(s => hasText(s.content))?.content ?? ''
  let description = plainText(firstText)
  if (description.length > 160) description = description.slice(0, 157).replace(/\s+\S*$/, '') + '...'
  if (!description) description = `Recomendaciones de Planmed: ${sub.title}.`
  const image = sub.intro.image?.url ?? sub.sections.find(s => s.image)?.image?.url ?? null
  return { title: `${sub.title} | Planmed`, description, image, canonicalPath: subtopicPath(sub.topic.slug, sub.slug) }
}

// ── Compatibilidad de rutas antiguas ───────────────────────────────────────────────────────────────────────────────────────────

export type LegacySlugResolution =
  | { kind: 'redirect', to: string }
  | { kind: 'topic', topic: TreeTopic }
  | { kind: 'legacy' }

/**
 * Qué hacer con /recomendaciones/{slug} (la ruta antigua de una página):
 *  · si {slug} es un SUBTEMA del árbol → redirección permanente a su URL jerárquica (las URLs indexadas o compartidas no se rompen);
 *  · si es un TEMA principal → su portada;
 *  · en cualquier otro caso (páginas anteriores a la jerarquía, sin tema) → el contrato histórico, como siempre.
 * El destino de la redirección siempre tiene dos segmentos, así que jamás vuelve a esta resolución (sin redirecciones circulares).
 */
export function resolveLegacySlug(topics: TreeTopic[], slug: string): LegacySlugResolution {
  const owner = findSubtopicOwner(topics, slug)
  if (owner) return { kind: 'redirect', to: subtopicPath(owner.slug, slug) }
  const topic = findTopic(topics, slug)
  return topic ? { kind: 'topic', topic } : { kind: 'legacy' }
}

import type { H3Event } from 'h3'

// Páginas independientes de recomendaciones de Planmed: la fuente de verdad es Wellezy Hub (tabla `recommendation_pages`).
//  - Público: GET /api/v1/web/recommendation-pages[/{slug}] (tenant por X-Tenant-Linea, sale de la configuración del servidor).
//  - Admin:   /api/cms/recommendation-pages con el Bearer de la sesión (nunca llega al navegador).
// Este módulo traduce entre el modelo de Planmed (RecommendationPage) y el contrato del Hub, y NUNCA reenvía company_id,
// linea_id ni is_custom: Hub deriva la empresa/línea del token y decide qué páginas son base.

const MSG_NOT_FOUND = 'La página no existe.'
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const RECOMMENDATION_GROUPS = ['general', 'cuidados', 'revision'] as const
export type RecommendationGroupDto = typeof RECOMMENDATION_GROUPS[number]

export interface RecommendationPageDto {
  slug: string
  group: RecommendationGroupDto
  /** true = creada desde un panel (se puede eliminar); false = página base sembrada. Solo en el admin (el público no lo expone). */
  custom: boolean
  menuLabel: string
  title: string
  videoUrl: string
  image: string
  content: string
  published: boolean
  /** Slug del procedimiento al que sustituye (null = independiente). */
  procedureSlug: string | null
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')
const orNull = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)
const group = (v: unknown): RecommendationGroupDto => (RECOMMENDATION_GROUPS as readonly string[]).includes(v as string) ? v as RecommendationGroupDto : 'general'

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Texto de recomendaciones de un procedimiento listo para mostrar. Hub devuelve HTML (string); los datos históricos de
 * `recomendaciones_post` pueden ser una lista de textos: se muestran como lista, escapada. SOLO ES PARA MOSTRAR: la lectura nunca
 * modifica ni reescribe el valor almacenado en Hub.
 */
export function recommendationHtml(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim() === '' ? undefined : value
  if (Array.isArray(value)) {
    const items = value.filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    return items.length ? `<ul>${items.map(i => `<li>${escapeHtml(i.trim())}</li>`).join('')}</ul>` : undefined
  }
  return undefined
}

/** Recurso CMS de Hub (/cms/recommendation-pages) → página del administrador. */
export function fromCmsPage(d: any): RecommendationPageDto {
  return {
    slug: str(d.slug),
    group: group(d.grupo),
    custom: d.is_custom === true,
    menuLabel: str(d.menu_label),
    title: str(d.title),
    videoUrl: str(d.video_url),
    image: str(d.image_url),
    content: str(d.content),
    published: d.published === true,
    procedureSlug: orNull(d.cirugia_slug)
  }
}

/**
 * Página/elemento de la API pública (/v1/web/recommendation-pages). Hub solo entrega páginas publicadas; la lista no trae contenido
 * y el detalle sí. `custom` no se expone públicamente y no se necesita para mostrar.
 */
export function fromPublicPage(d: any): RecommendationPageDto {
  return {
    slug: str(d.slug),
    group: group(d.grupo),
    custom: false,
    menuLabel: str(d.menu_label),
    title: str(d.title),
    videoUrl: str(d.video_url),
    image: str(d.image_url),
    content: str(d.content),
    published: true,
    procedureSlug: orNull(d.cirugia_slug)
  }
}

/** Solo los campos que Hub acepta al EDITAR, solo si vienen en la petición (PUT parcial: publicar, despublicar…). */
export function pickPageBody(body: any): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (!body || typeof body !== 'object') return out
  if ('title' in body) out.title = body.title
  if ('menuLabel' in body && orNull(body.menuLabel)) out.menu_label = orNull(body.menuLabel)
  if ('videoUrl' in body) out.video_url = orNull(body.videoUrl)
  if ('content' in body) out.content = body.content ?? ''
  if ('published' in body) out.published = body.published === true
  return out
}

/** Alta: Hub genera el slug a partir del título; la página nace oculta (published=false por defecto en Hub). */
export function pickCreateBody(body: any): Record<string, unknown> {
  const out: Record<string, unknown> = { title: typeof body?.title === 'string' ? body.title.trim() : '' }
  if (RECOMMENDATION_GROUPS.includes(body?.group)) out.grupo = body.group
  return out
}

export function parsePageSlug(event: H3Event): string {
  const slug = String(getRouterParam(event, 'slug') ?? '')
  if (!SLUG_RE.test(slug)) throw authError(404, MSG_NOT_FOUND)
  return slug
}

/** El admin identifica por slug; Hub por id. */
export function findPageBySlug(rows: any[], slug: string): any | null {
  return rows.find(r => r && r.slug === slug && Number.isSafeInteger(Number(r.id))) ?? null
}

/** Llamada administrativa a /cms/recommendation-pages de Hub con la sesión del servidor. Devuelve el cuerpo JSON de Hub. */
export async function hubRecommendations(
  event: H3Event,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  options: { body?: Record<string, unknown>, query?: Record<string, unknown> } = {}
): Promise<any> {
  const { session, token } = await adminSession(event)
  const res = await wellezyRequest<any>(event, token, method, `/cms/recommendation-pages${path}`, options)
  if (res.status === 401) await session.clear()
  translate(res.status, res.data, session, MSG_NOT_FOUND)
  return res.data
}

/** Página del admin por slug (lee la lista completa de la línea y resuelve el id). 404 si no existe en la línea. */
export async function hubPageBySlug(event: H3Event, slug: string): Promise<any> {
  const list = await hubRecommendations(event, 'GET', '')
  const row = findPageBySlug(list?.data ?? [], slug)
  if (!row) throw authError(404, MSG_NOT_FOUND)
  return row
}

/** Imagen de la página (data URL del formulario) → POST /cms/recommendation-pages/{id}/image. Devuelve el recurso actualizado. */
export async function hubPageImage(event: H3Event, id: number, dataUrl: string): Promise<any> {
  const { session, token } = await adminSession(event)
  const blob = dataUrlToBlob(dataUrl)
  if (!blob) throw createError({ statusCode: 422, message: 'La imagen debe ser JPG, PNG o WebP de máximo 5 MB.' })

  const form = new FormData()
  form.append('image', blob, `recomendacion.${blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'}`)
  const res = await wellezyUpload<any>(event, token, `/cms/recommendation-pages/${id}/image`, form)
  if (res.status === 401) await session.clear()
  translate(res.status, res.data, session, MSG_NOT_FOUND)
  return res.data
}

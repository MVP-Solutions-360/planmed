import type { H3Event } from 'h3'
// @ts-expect-error TS5097: la extensión .ts solo se permite con allowImportingTsExtensions (las pruebas de Node no usan los alias de Nuxt).
import { countBlocks, fromPublicBlock, publicBlocksOf, type ColumnLayout, type PublicBlock, type PublicBlocks } from '../../shared/utils/contentBlocks.ts'

// Noticias de Planmed: la fuente de verdad es Wellezy Hub.
//  - Público: GET /api/v1/web/posts (tenant por X-Tenant-Linea, sale de la configuración del servidor).
//  - Admin:   /api/cms/posts con el Bearer de la sesión (nunca llega al navegador).
// Este módulo traduce entre el modelo de Planmed (NewsArticle) y el contrato del Hub, y NUNCA reenvía
// company_id, linea_id, author_name ni status: Hub los deriva del token / usuario autenticado.

const MSG_UNAVAILABLE = 'No fue posible conectar con Wellezy Hub. Intenta nuevamente.'
const MSG_FORBIDDEN = 'No tienes permiso para realizar esta acción.'

export interface NewsArticleDto {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  coverImage: string
  publishedAt: string | null
  author?: string
  seo: { metaTitle?: string, metaDescription?: string }
  youtubeUrl?: string
  instagramUrl?: string
  sections?: NewsSectionDto[]
}

export interface NewsSectionDto {
  orden: number
  title: string | null
  layout: ColumnLayout
  blocks: PublicBlocks
}

/**
 * `secciones` del detalle público de Hub → lista normalizada, con los bloques de cada columna (re-validados: ver contentBlocks). Defensivo: ignora lo que
 * no es objeto y las secciones sin nada que mostrar en su distribución; una distribución desconocida cae a una columna. Un Hub anterior (sin `blocks`)
 * se adapta desde sus campos de texto antiguos.
 */
export function fromPublicNewsSections(raw: unknown): NewsSectionDto[] {
  if (!Array.isArray(raw)) return []
  const out: NewsSectionDto[] = []
  const legacy = (html: unknown): PublicBlock[] => { const b = fromPublicBlock({ type: 'text', html }); return b ? [b] : [] }
  for (const s of raw) {
    if (!s || typeof s !== 'object') continue
    const layout: ColumnLayout = s.layout === 'two_columns' ? 'two_columns' : 'one_column'
    const title = orNull(s.title)
    const blocks = publicBlocksOf(s.blocks, layout, () => (layout === 'two_columns'
      ? { main: [], left: legacy(s.content_left), right: legacy(s.content_right) }
      : { main: legacy(s.content), left: [], right: [] }))
    if (!title && countBlocks(blocks, layout) === 0) continue
    out.push({ orden: Number.isFinite(Number(s.orden)) ? Number(s.orden) : 0, title, layout, blocks })
  }
  return out
}

/** Detalle/lista pública de Hub (/v1/web/posts) → NewsArticle. Hub solo entrega noticias publicadas y vigentes. */
export function fromPublicPost(post: any): NewsArticleDto {
  return {
    id: String(post.slug),
    slug: String(post.slug),
    title: String(post.title ?? ''),
    excerpt: String(post.excerpt ?? ''),
    content: String(post.content ?? ''),
    coverImage: typeof post.cover_url === 'string' ? post.cover_url : '',
    publishedAt: typeof post.published_at === 'string' ? post.published_at : null,
    author: typeof post.author_name === 'string' ? post.author_name : undefined,
    seo: { metaTitle: post.seo?.meta_title ?? undefined, metaDescription: post.seo?.meta_description ?? undefined },
    youtubeUrl: post.youtube_url ?? undefined,
    instagramUrl: post.instagram_url ?? undefined,
    sections: fromPublicNewsSections(post.secciones)
  }
}

/** Recurso CMS de Hub (/cms/posts) → NewsArticle. Un borrador no tiene fecha de publicación efectiva. */
export function fromCmsPost(post: any): NewsArticleDto {
  return {
    id: String(post.id),
    slug: String(post.slug),
    title: String(post.title ?? ''),
    excerpt: String(post.excerpt ?? ''),
    content: String(post.content ?? ''),
    coverImage: typeof post.cover_url === 'string' ? post.cover_url : '',
    publishedAt: post.status === 'published' && typeof post.published_at === 'string' ? post.published_at : null,
    author: typeof post.author_name === 'string' ? post.author_name : undefined,
    seo: { metaTitle: post.meta_title ?? undefined, metaDescription: post.meta_description ?? undefined },
    youtubeUrl: post.youtube_url ?? undefined,
    instagramUrl: post.instagram_url ?? undefined
  }
}

const orNull = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)

/** Solo los campos que Hub acepta, solo si vienen en la petición (PUT parcial, p. ej. publicar/despublicar). */
export function pickNewsBody(body: any): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (!body || typeof body !== 'object') return out
  if ('title' in body) out.title = body.title
  if ('slug' in body && orNull(body.slug)) out.slug = orNull(body.slug)
  if ('excerpt' in body) out.excerpt = body.excerpt ?? ''
  if ('content' in body) out.content = body.content ?? ''
  if ('publishedAt' in body) out.published_at = body.publishedAt ? body.publishedAt : null
  if (body.seo && typeof body.seo === 'object') {
    out.meta_title = orNull(body.seo.metaTitle)
    out.meta_description = orNull(body.seo.metaDescription)
  }
  if ('youtubeUrl' in body) out.youtube_url = orNull(body.youtubeUrl)
  if ('instagramUrl' in body) out.instagram_url = orNull(body.instagramUrl)
  return out
}

export function pickNewsQuery(query: Record<string, any>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of ['search', 'status', 'page', 'per_page']) {
    if (query[key] !== undefined && query[key] !== '') out[key] = query[key]
  }
  return out
}

export function parseNewsId(event: H3Event): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(id) || id <= 0) throw authError(404, 'La noticia no existe.')
  return id
}

/** Data URL de imagen (la que genera el formulario) → Blob listo para multipart. */
export function dataUrlToBlob(dataUrl: string): Blob | null {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (!m) return null
  let binary: string
  try { binary = atob(m[2]!) } catch { return null }
  if (binary.length === 0 || binary.length > 5 * 1024 * 1024) return null
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: m[1] })
}

export function translate(status: number, data: any, session: { clear: () => Promise<unknown> }, notFoundMessage = 'La noticia no existe.'): never | void {
  switch (status) {
    case 200:
    case 201:
      return
    case 401:
      throw authError(401, 'No autenticado')
    case 403:
      throw authError(403, MSG_FORBIDDEN)
    case 404:
      throw authError(404, notFoundMessage)
    case 422: {
      const message = typeof data?.message === 'string' ? data.message : 'Revisa los datos ingresados.'
      throw createError({ statusCode: 422, message, data: { message, errors: data?.errors ?? {} } })
    }
    case 429:
      throw authError(429, 'Demasiadas solicitudes. Espera unos segundos e intenta nuevamente.')
    default:
      throw authError(503, MSG_UNAVAILABLE)
  }
}

export async function adminSession(event: H3Event) {
  assertSameOrigin(event)
  setHeader(event, 'Cache-Control', 'no-store')
  const session = await useAdminSession(event)
  const token = session.data.token
  if (!token || !session.data.user) throw authError(401, 'No autenticado')
  return { session, token }
}

/** Llamada administrativa a /cms/posts de Hub con la sesión del servidor. Devuelve el cuerpo JSON de Hub. */
export async function hubNews(
  event: H3Event,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  options: { body?: Record<string, unknown>, query?: Record<string, unknown> } = {}
): Promise<any> {
  const { session, token } = await adminSession(event)
  const res = await wellezyRequest<any>(event, token, method, `/cms/posts${path}`, options)
  if (res.status === 401) await session.clear()
  translate(res.status, res.data, session)
  return res.data
}

/** Sube la portada (data URL del formulario) a /cms/posts/{id}/cover; devuelve el post actualizado. */
export async function hubNewsCover(event: H3Event, id: number, dataUrl: string): Promise<any> {
  const { session, token } = await adminSession(event)
  const blob = dataUrlToBlob(dataUrl)
  if (!blob) throw createError({ statusCode: 422, message: 'La portada debe ser una imagen JPG, PNG o WebP de máximo 5 MB.' })

  const form = new FormData()
  form.append('image', blob, `portada.${blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'}`)
  const res = await wellezyUpload<any>(event, token, `/cms/posts/${id}/cover`, form)
  if (res.status === 401) await session.clear()
  translate(res.status, res.data, session)
  return res.data
}

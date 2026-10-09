import type { H3Event } from 'h3'

// «Nuestros Pacientes» de Planmed: la fuente de verdad es Wellezy Hub.
//  - Público: GET /api/v1/web/patient-section (tenant por X-Tenant-Linea, sale de la configuración del servidor).
//  - Admin:   /api/cms/{patient-section,testimonial-embeds,before-after-cases} con el Bearer de la sesión (nunca llega al navegador).
// Este módulo traduce entre el modelo de Planmed (TestimonialsContent) y el contrato del Hub, y NUNCA reenvía company_id ni
// linea_id: Hub los deriva del token del usuario autenticado.

const MSG_NOT_FOUND = 'El contenido no existe.'
const MAX_ITEMS = 100
const YOUTUBE_RE = /^https?:\/\/(www\.|m\.|music\.)?(youtube\.com|youtube-nocookie\.com|youtu\.be)\//i
const INSTAGRAM_RE = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv)\//i

export interface PatientVideoDto { id: string, title: string, url: string, active: boolean }
export interface PatientInstagramDto { id: string, url: string, title: string, active: boolean }
export interface PatientCaseDto { id: string, title: string, description: string, beforeImage: string, afterImage: string, published: boolean }
export interface PatientContentDto {
  visibility: { videos: boolean, beforeAfter: boolean }
  videos: PatientVideoDto[]
  beforeAfter: PatientCaseDto[]
  instagram: PatientInstagramDto[]
  referral: { title: string, content: string }
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')
const orNull = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)
/** Id de Hub (entero positivo) o null si el id es temporal del formulario. */
export const hubId = (v: unknown): number | null => {
  const n = Number(v)
  return typeof v !== 'object' && /^\d+$/.test(String(v)) && Number.isSafeInteger(n) && n > 0 ? n : null
}

/** Respuesta pública de Hub (/v1/web/patient-section) → contenido. Hub solo entrega lo visible; no trae ids ni activo/publicado. */
export function fromPublicSection(d: any): PatientContentDto {
  const embed = (e: any, i: number) => ({ id: str(e?.external_id) || String(i), title: str(e?.title), url: str(e?.url), active: true })
  return {
    visibility: { videos: d?.visibility?.videos !== false, beforeAfter: d?.visibility?.before_after !== false },
    videos: (Array.isArray(d?.videos) ? d.videos : []).map(embed),
    instagram: (Array.isArray(d?.instagram) ? d.instagram : []).map((e: any, i: number) => ({ ...embed(e, i), title: str(e?.title) })),
    beforeAfter: (Array.isArray(d?.before_after) ? d.before_after : []).map((c: any, i: number) => ({
      id: String(i), title: str(c?.title), description: str(c?.description), beforeImage: str(c?.before_url), afterImage: str(c?.after_url), published: true
    })),
    referral: { title: str(d?.referral?.title), content: str(d?.referral?.content) }
  }
}

/** Recursos CMS de Hub (configuración + embeds + casos) → contenido del administrador, con ids de Hub y todo el contenido (incluido el oculto). */
export function fromCmsPatients(settings: any, embeds: any[], cases: any[]): PatientContentDto {
  const rows = embeds.filter(e => e && hubId(e.id) !== null)
  return {
    visibility: { videos: settings?.show_videos !== false, beforeAfter: settings?.show_before_after !== false },
    videos: rows.filter(e => e.platform === 'youtube').map(e => ({ id: String(e.id), title: str(e.title), url: str(e.url), active: e.activo === true })),
    instagram: rows.filter(e => e.platform === 'instagram').map(e => ({ id: String(e.id), url: str(e.url), title: str(e.title), active: e.activo === true })),
    beforeAfter: cases.filter(c => c && hubId(c.id) !== null).map(c => ({
      id: String(c.id), title: str(c.title), description: str(c.description), beforeImage: str(c.before_url), afterImage: str(c.after_url), published: c.published === true
    })),
    referral: { title: str(settings?.referral_title), content: str(settings?.referral_content) }
  }
}

/** Valida y normaliza el cuerpo del formulario del administrador. Lanza 422 si la forma es inválida. */
export function parseContentBody(body: any): PatientContentDto {
  const bad = () => createError({ statusCode: 422, message: 'Revisa los datos ingresados.' })
  if (!body || typeof body !== 'object') throw bad()
  const list = (v: unknown) => (Array.isArray(v) ? v : (() => { throw bad() })())
  const videos = list(body.videos), instagram = list(body.instagram), cases = list(body.beforeAfter)
  if (videos.length + instagram.length > MAX_ITEMS || cases.length > MAX_ITEMS) throw bad()
  const parsed = {
    visibility: { videos: body.visibility?.videos !== false, beforeAfter: body.visibility?.beforeAfter !== false },
    videos: videos.map((v: any) => ({ id: str(v?.id), title: str(v?.title).trim(), url: str(v?.url).trim(), active: v?.active !== false })),
    instagram: instagram.map((v: any) => ({ id: str(v?.id), title: str(v?.title).trim(), url: str(v?.url).trim(), active: v?.active !== false })),
    beforeAfter: cases.map((c: any) => ({
      id: str(c?.id), title: str(c?.title).trim(), description: str(c?.description), beforeImage: str(c?.beforeImage), afterImage: str(c?.afterImage), published: c?.published !== false
    })),
    referral: { title: str(body.referral?.title), content: str(body.referral?.content) }
  }

  // Validación previa de lo que Hub rechazaría: applyContent no es transaccional (elimina antes de crear), así que un valor
  // inválido debe detectarse ANTES de escribir nada. Hub sigue siendo la autoridad (revalida todo al guardar).
  const invalid = (message: string) => createError({ statusCode: 422, message, data: { message, errors: {} } })
  if (parsed.videos.some(v => !YOUTUBE_RE.test(v.url))) throw invalid('Solo se admiten enlaces de YouTube.')
  if (parsed.instagram.some(v => !INSTAGRAM_RE.test(v.url))) throw invalid('Usa enlaces de publicaciones o reels de Instagram.')
  if (parsed.beforeAfter.some(c => !c.title)) throw invalid('Cada caso necesita un título.')
  if (parsed.beforeAfter.some(c => c.published && (!c.beforeImage || !c.afterImage))) throw invalid('Cada caso publicado necesita la foto del antes y la del después.')
  // Una imagen nueva (data URL) inválida o demasiado pesada fallaría DESPUÉS de crear el caso: se detecta antes de escribir.
  const badImage = (v: string) => v.startsWith('data:') && !dataUrlToBlob(v)
  if (parsed.beforeAfter.some(c => badImage(c.beforeImage) || badImage(c.afterImage))) throw invalid('Las imágenes deben ser JPG, PNG o WebP de máximo 5 MB.')
  return parsed
}

/** Llamada administrativa a la API CMS de Hub con la sesión del servidor. Devuelve el cuerpo JSON de Hub. */
export async function hubPatients(
  event: H3Event,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  options: { body?: Record<string, unknown>, query?: Record<string, unknown> } = {}
): Promise<any> {
  const { session, token } = await adminSession(event)
  const res = await wellezyRequest<any>(event, token, method, `/cms/${path}`, options)
  if (res.status === 401) await session.clear()
  translate(res.status, res.data, session, MSG_NOT_FOUND)
  return res.data
}

/** Sube las imágenes antes/después (data URL del formulario) a /cms/before-after-cases/{id}/images como multipart. */
export async function hubCaseImages(event: H3Event, id: number, images: { before?: string, after?: string }): Promise<boolean> {
  const form = new FormData()
  for (const side of ['before', 'after'] as const) {
    const dataUrl = images[side]
    if (!dataUrl) continue
    const blob = dataUrlToBlob(dataUrl)
    if (!blob) throw createError({ statusCode: 422, message: 'Las imágenes deben ser JPG, PNG o WebP de máximo 5 MB.' })
    form.append(side, blob, `${side}.${blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'}`)
  }
  if ([...form.keys()].length === 0) return false
  const { session, token } = await adminSession(event)
  const res = await wellezyUpload<any>(event, token, `/cms/before-after-cases/${id}/images`, form)
  if (res.status === 401) await session.clear()
  translate(res.status, res.data, session, MSG_NOT_FOUND)
  return true
}

/** Lee configuración, embeds y casos completos de la línea del usuario autenticado. */
export async function readCmsContent(event: H3Event): Promise<{ content: PatientContentDto, embeds: any[], cases: any[] }> {
  const [settings, embeds, cases] = await Promise.all([
    hubPatients(event, 'GET', 'patient-section'),
    hubPatients(event, 'GET', 'testimonial-embeds'),
    hubPatients(event, 'GET', 'before-after-cases')
  ])
  const embedRows = embeds?.data ?? []
  const caseRows = cases?.data ?? []
  return { content: fromCmsPatients(settings?.data, embedRows, caseRows), embeds: embedRows, cases: caseRows }
}

/**
 * Aplica el contenido del formulario sobre Hub: solo envía lo que cambió. Orden: eliminar → actualizar → crear → reordenar,
 * de modo que quitar y volver a pegar el mismo enlace no choque con la unicidad de Hub. No es transaccional: si Hub rechaza un
 * elemento, lo ya aplicado se conserva. `progress.writes` cuenta las escrituras ya aplicadas para que quien llama pueda informar
 * una operación PARCIAL (ver withPartialState). El guardado es declarativo (el formulario es el estado deseado), así que reintentar
 * converge sin duplicar; lo que se evita es que el usuario crea que NO se guardó nada.
 */
export async function applyContent(event: H3Event, next: PatientContentDto, progress: { writes: number } = { writes: 0 }): Promise<void> {
  const { embeds: currentEmbeds, cases: currentCases } = await readCmsContent(event)
  const write = async (method: 'POST' | 'PUT' | 'DELETE', path: string, body?: Record<string, unknown>) => {
    const res = await hubPatients(event, method, path, body ? { body } : {})
    progress.writes++
    return res
  }

  await write('PUT', 'patient-section', {
    show_videos: next.visibility.videos,
    show_before_after: next.visibility.beforeAfter,
    referral_title: orNull(next.referral.title),
    referral_content: next.referral.content.trim() === '' ? null : next.referral.content
  })

  // ── Videos de YouTube e Instagram (una sola colección en Hub) ──
  const items = [
    ...next.videos.map(v => ({ ...v, platform: 'youtube' as const })),
    ...next.instagram.map(v => ({ ...v, platform: 'instagram' as const }))
  ]
  const keptEmbedIds = new Set(items.map(i => hubId(i.id)).filter((n): n is number => n !== null))
  for (const row of currentEmbeds) {
    if (!keptEmbedIds.has(Number(row.id))) await write('DELETE', `testimonial-embeds/${Number(row.id)}`)
  }
  const embedOrder: number[] = []
  const toCreate: typeof items = []
  for (const item of items) {
    const id = hubId(item.id)
    const row = id !== null ? currentEmbeds.find(r => Number(r.id) === id) : null
    if (!row) { toCreate.push(item); embedOrder.push(-toCreate.length); continue }
    const body: Record<string, unknown> = {}
    if (item.url !== row.url) body.url = item.url
    if (item.title !== str(row.title)) body.title = orNull(item.title)
    if (item.active !== (row.activo === true)) body.activo = item.active
    if (Object.keys(body).length) await write('PUT', `testimonial-embeds/${id}`, body)
    embedOrder.push(Number(row.id))
  }
  const createdIds: number[] = []
  for (const item of toCreate) {
    const res = await write('POST', 'testimonial-embeds', { url: item.url, platform: item.platform, title: orNull(item.title), activo: item.active })
    createdIds.push(Number(res.data.id))
  }
  const finalEmbedOrder = embedOrder.map(n => (n < 0 ? createdIds[-n - 1]! : n))
  if (finalEmbedOrder.length) await write('POST', 'testimonial-embeds/reorder', { ids: finalEmbedOrder })

  // ── Casos antes y después ──
  const keptCaseIds = new Set(next.beforeAfter.map(c => hubId(c.id)).filter((n): n is number => n !== null))
  for (const row of currentCases) {
    if (!keptCaseIds.has(Number(row.id))) await write('DELETE', `before-after-cases/${Number(row.id)}`)
  }
  const caseOrder: number[] = []
  for (const c of next.beforeAfter) {
    let id = hubId(c.id)
    const row = id !== null ? currentCases.find(r => Number(r.id) === id) : null
    if (!row) {
      const res = await write('POST', 'before-after-cases', { title: c.title, description: orNull(c.description), published: c.published })
      id = Number(res.data.id)
    } else {
      const body: Record<string, unknown> = {}
      if (c.title !== str(row.title)) body.title = c.title
      if (c.description !== str(row.description)) body.description = orNull(c.description)
      if (c.published !== (row.published === true)) body.published = c.published
      if (Object.keys(body).length) await write('PUT', `before-after-cases/${id}`, body)
    }
    // Solo se suben las imágenes nuevas (data URL); una URL ya publicada no se reenvía.
    const uploaded = await hubCaseImages(event, id!, {
      before: c.beforeImage.startsWith('data:') ? c.beforeImage : undefined,
      after: c.afterImage.startsWith('data:') ? c.afterImage : undefined
    })
    if (uploaded) progress.writes++
    caseOrder.push(id!)
  }
  if (caseOrder.length) await write('POST', 'before-after-cases/reorder', { ids: caseOrder })
}

/**
 * Operación PARCIAL: si falla una escritura cuando otras ya se aplicaron en Hub, el error lleva `data.partial = true` y el contenido
 * realmente guardado (`data.content`): el formulario se sincroniza con ello. Sin esto el usuario vería solo un error aunque parte de los
 * cambios ya estén publicados, y un reintento con ids temporales eliminaría y volvería a crear lo ya creado.
 * Un fallo antes de la primera escritura, o un 401 (sesión vencida), se devuelve tal cual.
 */
export async function withPartialState(event: H3Event, error: any, progress: { writes: number }) {
  if (progress.writes === 0 || error?.statusCode === 401) return error
  let content: PatientContentDto | null = null
  try { content = (await readCmsContent(event)).content } catch { /* sin estado fresco: el formulario pide recargar */ }
  const reason = error?.data?.message || error?.message || 'No se pudo guardar todo.'
  const message = `${reason} Algunos cambios sí se guardaron antes del error${content ? ': el formulario muestra lo que quedó guardado. Revisa y vuelve a intentar.' : '. Recarga la página para ver el estado actual.'}`
  return createError({ statusCode: error?.statusCode ?? 503, message, data: { message, errors: error?.data?.errors ?? {}, partial: true, content } })
}

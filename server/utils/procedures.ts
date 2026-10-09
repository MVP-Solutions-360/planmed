import type { H3Event } from 'h3'

// Procedimientos de Planmed: la fuente de verdad es Wellezy Hub (tabla `cirugias` + `cirugia_linea`).
//  - Público: GET /api/v1/web/cirugias[/{slug}] (tenant por X-Tenant-Linea, sale de la configuración del servidor).
//  - Admin:   /api/cms/procedures con el Bearer de la sesión (nunca llega al navegador).
// Este módulo traduce entre el modelo de Planmed (Procedure) y el contrato del Hub, y NUNCA reenvía company_id ni
// linea_id: Hub los deriva del token del usuario autenticado.

const MSG_NOT_FOUND = 'El procedimiento no existe.'

export interface ProcedureDto {
  id: string
  slug: string
  name: string
  category: string
  shortDescription: string
  whatIsIt: string
  image: string
  galeria: string[]
  destacado: boolean
  activo?: boolean
  isMaster?: boolean
  editable?: boolean
  galeriaAssets?: Array<{ id: number, url: string }>
  recomendaciones_post?: string
  ficha_tecnica: { tipo_anestesia?: string, tiempo_quirurgico?: string, tiempo_recuperacion?: string, cicatrizacion_minima?: boolean }
  perfil_paciente: { edad_minima?: number | null, edad_maxima?: number | null, imc_maximo?: number | null, condiciones_medicas_compatibles?: string }
  seo: { meta_title?: string, meta_description?: string }
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')
const orUndef = (v: unknown) => (typeof v === 'string' && v !== '' ? v : undefined)
const numOrNull = (v: unknown) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v))
const orNull = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)

/** Elemento de /v1/web/cirugias (lista pública): solo lo necesario para tarjetas, menús y selectores. */
export function fromPublicListItem(item: any): ProcedureDto {
  return {
    id: String(item.slug),
    slug: String(item.slug),
    name: str(item.nombre),
    category: str(item.categoria_slug),
    shortDescription: str(item.descripcion_corta),
    whatIsIt: '',
    image: str(item.imagen_destacada),
    galeria: [],
    destacado: item.destacado === true,
    ficha_tecnica: {},
    perfil_paciente: {},
    seo: {}
  }
}

/** Detalle de /v1/web/cirugias/{slug}. El id público es el slug (Hub no expone ids en la API pública). */
export function fromPublicDetail(d: any): ProcedureDto {
  const datos = d.datos_paciente ?? {}
  return {
    id: String(d.slug),
    slug: String(d.slug),
    name: str(d.nombre),
    category: str(d.categoria?.slug),
    shortDescription: str(d.descripcion_corta),
    whatIsIt: str(d.procedimiento),
    image: str(d.imagen_destacada),
    galeria: Array.isArray(d.galeria) ? d.galeria.filter((u: unknown) => typeof u === 'string') : [],
    destacado: d.destacado === true,
    recomendaciones_post: typeof d.recomendaciones_post === 'string' ? d.recomendaciones_post : undefined,
    ficha_tecnica: {
      tipo_anestesia: orUndef(d.ficha_tecnica?.tipo_anestesia),
      tiempo_quirurgico: orUndef(d.ficha_tecnica?.tiempo_quirurgico),
      tiempo_recuperacion: orUndef(d.ficha_tecnica?.tiempo_recuperacion),
      cicatrizacion_minima: datos.cicatrizacion_minima === true ? true : undefined
    },
    perfil_paciente: {
      edad_minima: numOrNull(datos.edad_minima),
      edad_maxima: numOrNull(datos.edad_maxima),
      imc_maximo: numOrNull(datos.imc_maximo),
      condiciones_medicas_compatibles: orUndef(d.perfil_paciente)
    },
    seo: { meta_title: orUndef(d.seo?.meta_title), meta_description: orUndef(d.seo?.meta_description) }
  }
}

/** Recurso CMS de Hub (/cms/procedures) → Procedure del administrador. */
export function fromCms(d: any): ProcedureDto {
  const gallery: Array<{ id: number, url: string }> = Array.isArray(d.galeria)
    ? d.galeria.filter((g: any) => g && Number.isSafeInteger(Number(g.id)) && typeof g.url === 'string').map((g: any) => ({ id: Number(g.id), url: g.url }))
    : []
  return {
    id: String(d.id),
    slug: String(d.slug),
    name: str(d.nombre),
    category: str(d.categoria_slug),
    shortDescription: str(d.descripcion_corta),
    whatIsIt: str(d.procedimiento),
    image: str(d.imagen_destacada),
    galeria: gallery.map(g => g.url),
    galeriaAssets: gallery,
    destacado: d.destacado === true,
    activo: d.activo === true,
    isMaster: d.es_maestro === true,
    editable: d.editable !== false,
    ficha_tecnica: {
      tipo_anestesia: orUndef(d.ficha_tecnica?.tipo_anestesia),
      tiempo_quirurgico: orUndef(d.ficha_tecnica?.tiempo_quirurgico),
      tiempo_recuperacion: orUndef(d.ficha_tecnica?.tiempo_recuperacion),
      cicatrizacion_minima: d.cicatrizacion_minima === true
    },
    perfil_paciente: {
      edad_minima: numOrNull(d.edad_minima),
      edad_maxima: numOrNull(d.edad_maxima),
      imc_maximo: numOrNull(d.imc_maximo),
      condiciones_medicas_compatibles: orUndef(d.perfil_paciente)
    },
    seo: { meta_title: orUndef(d.meta_title), meta_description: orUndef(d.meta_description) }
  }
}

/** Solo los campos que Hub acepta, solo si vienen en la petición (PUT parcial: activar, destacar, etc.). */
export function pickProcedureBody(body: any): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (!body || typeof body !== 'object') return out
  if ('name' in body) out.nombre = body.name
  if ('slug' in body && orNull(body.slug)) out.slug = orNull(body.slug)
  if ('category' in body) out.categoria_slug = orNull(body.category)
  if ('shortDescription' in body) out.descripcion_corta = orNull(body.shortDescription)
  if ('whatIsIt' in body) out.procedimiento = body.whatIsIt ?? ''
  const ficha = body.ficha_tecnica
  if (ficha && typeof ficha === 'object') {
    out.ficha_tecnica = {
      tipo_anestesia: orNull(ficha.tipo_anestesia),
      tiempo_quirurgico: orNull(ficha.tiempo_quirurgico),
      tiempo_recuperacion: orNull(ficha.tiempo_recuperacion)
    }
    if ('cicatrizacion_minima' in ficha) out.cicatrizacion_minima = ficha.cicatrizacion_minima === true
  }
  const perfil = body.perfil_paciente
  if (perfil && typeof perfil === 'object') {
    if ('edad_minima' in perfil) out.edad_minima = numOrNull(perfil.edad_minima)
    if ('edad_maxima' in perfil) out.edad_maxima = numOrNull(perfil.edad_maxima)
    if ('imc_maximo' in perfil) out.imc_maximo = numOrNull(perfil.imc_maximo)
    if ('condiciones_medicas_compatibles' in perfil) out.perfil_paciente = perfil.condiciones_medicas_compatibles ?? ''
  }
  if (body.seo && typeof body.seo === 'object') {
    out.meta_title = orNull(body.seo.meta_title)
    out.meta_description = orNull(body.seo.meta_description)
  }
  if ('activo' in body) out.activo = body.activo === true
  if ('destacado' in body) out.destacado = body.destacado === true
  return out
}

export function pickProcedureQuery(query: Record<string, any>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of ['search', 'activo', 'tipo']) {
    if (query[key] !== undefined && query[key] !== '') out[key] = query[key]
  }
  return out
}

export function parseProcedureId(event: H3Event): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(id) || id <= 0) throw authError(404, MSG_NOT_FOUND)
  return id
}

/** Llamada administrativa a /cms/procedures de Hub con la sesión del servidor. Devuelve el cuerpo JSON de Hub. */
export async function hubProcedures(
  event: H3Event,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  options: { body?: Record<string, unknown>, query?: Record<string, unknown> } = {}
): Promise<any> {
  const { session, token } = await adminSession(event)
  const res = await wellezyRequest<any>(event, token, method, `/cms/procedures${path}`, options)
  if (res.status === 401) await session.clear()
  translate(res.status, res.data, session, MSG_NOT_FOUND)
  return res.data
}

/** Lista completa (todas las páginas) para el administrador. */
export async function hubProceduresAll(event: H3Event, query: Record<string, unknown>): Promise<any[]> {
  const rows: any[] = []
  for (let page = 1; page <= 20; page++) {
    const res = await hubProcedures(event, 'GET', '', { query: { ...query, per_page: 100, page } })
    rows.push(...(res?.data ?? []))
    if (!res?.meta || page >= Number(res.meta.last_page ?? 1)) break
  }
  return rows
}

async function hubProcedureUpload(event: H3Event, path: string, form: FormData): Promise<any> {
  const { session, token } = await adminSession(event)
  const res = await wellezyUpload<any>(event, token, `/cms/procedures${path}`, form)
  if (res.status === 401) await session.clear()
  translate(res.status, res.data, session, MSG_NOT_FOUND)
  return res.data
}

function extension(blob: Blob) {
  return blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'
}

/**
 * Imagen principal, nuevas imágenes de galería y galería a eliminar, enviadas por el formulario del admin.
 * Las imágenes llegan como data URL y se suben a Hub como multipart; las URL ya publicadas no se reenvían.
 * Devuelve el procedimiento actualizado (recurso CMS) o `current` si no hubo cambios de multimedia.
 */
export async function applyProcedureMedia(event: H3Event, id: number, body: any, current: any): Promise<any> {
  let last = current

  if (typeof body?.image === 'string' && body.image.startsWith('data:')) {
    const blob = dataUrlToBlob(body.image)
    if (!blob) throw createError({ statusCode: 422, message: 'La imagen debe ser JPG, PNG o WebP de máximo 5 MB.' })
    const form = new FormData()
    form.append('image', blob, `procedimiento.${extension(blob)}`)
    last = (await hubProcedureUpload(event, `/${id}/image`, form)).data
  }

  const uploads: string[] = Array.isArray(body?.galleryUploads) ? body.galleryUploads.filter((u: unknown) => typeof u === 'string') : []
  if (uploads.length) {
    const form = new FormData()
    for (const [i, dataUrl] of uploads.slice(0, 10).entries()) {
      const blob = dataUrlToBlob(dataUrl)
      if (!blob) throw createError({ statusCode: 422, message: 'Las imágenes de la galería deben ser JPG, PNG o WebP de máximo 5 MB.' })
      form.append('images[]', blob, `galeria-${i + 1}.${extension(blob)}`)
    }
    last = (await hubProcedureUpload(event, `/${id}/gallery`, form)).data
  }

  const removals: number[] = Array.isArray(body?.galleryRemovals) ? body.galleryRemovals.map(Number).filter((n: number) => Number.isSafeInteger(n) && n > 0) : []
  for (const assetId of removals) {
    last = (await hubProcedures(event, 'DELETE', `/${id}/gallery/${assetId}`)).data
  }

  return last
}

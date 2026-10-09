// Detalle público de una noticia (GET /api/v1/web/posts/{slug}). Un slug inexistente, no publicado, programado a futuro,
// de otra línea o legado responde 404: esa decisión la toma Hub, no Planmed.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const slug = String(getRouterParam(event, 'slug') ?? '')
  if (!slug || slug.length > 255 || !SLUG_RE.test(slug)) {
    throw createError({ statusCode: 404, message: 'No encontrado' })
  }

  const res = await wellezyPublicGet<any>(event, `/v1/web/posts/${slug}`)

  // Tenant sin resolver = configuración rota (no "la noticia no existe"): 503, igual que procedimientos y recomendaciones.
  if (res.status === 404 && !isTenantNotResolved(res)) throw createError({ statusCode: 404, message: 'No encontrado' })
  assertHubOk('news', res, !!res.data?.data?.slug, 'No fue posible cargar esta noticia. Intenta nuevamente.')

  return fromPublicPost(res.data.data)
})

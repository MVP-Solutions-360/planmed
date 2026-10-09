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

  if (res.status === 404) {
    if (String(res.data?.message ?? '').includes('Tenant')) {
      console.error('[news] Hub no resolvió el tenant (revisa NUXT_WELLEZY_LINE_SLUG).')
    }
    throw createError({ statusCode: 404, message: 'No encontrado' })
  }
  if (res.status !== 200 || !res.data?.data?.slug) {
    throw createError({ statusCode: 503, message: 'No fue posible cargar esta noticia. Intenta nuevamente.' })
  }

  return fromPublicPost(res.data.data)
})

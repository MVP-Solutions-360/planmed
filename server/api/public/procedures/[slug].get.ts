// Detalle público de un procedimiento desde Wellezy Hub (GET /api/v1/web/cirugias/{slug}).
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const slug = String(getRouterParam(event, 'slug') ?? '')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw createError({ statusCode: 404, message: 'El procedimiento no existe.' })

  const res = await wellezyPublicGet<any>(event, `/v1/web/cirugias/${slug}`)
  if (res.status === 404 && String(res.data?.message ?? '').includes('Tenant')) {
    console.error('[procedures] Hub no resolvió el tenant (revisa NUXT_WELLEZY_LINE_SLUG).')
    throw createError({ statusCode: 503, message: 'No fue posible cargar el procedimiento. Intenta nuevamente.' })
  }
  if (res.status === 404) throw createError({ statusCode: 404, message: 'El procedimiento no existe.' })
  if (res.status !== 200 || !res.data?.data) {
    throw createError({ statusCode: 503, message: 'No fue posible cargar el procedimiento. Intenta nuevamente.' })
  }

  return fromPublicDetail(res.data.data)
})

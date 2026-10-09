// Detalle público (GET /api/v1/web/recommendation-pages/{slug}). Inexistente, no publicada o de otra línea => 404 real.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const slug = String(getRouterParam(event, 'slug') ?? '')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw createError({ statusCode: 404, message: 'La página no existe.' })

  const res = await wellezyPublicGet<any>(event, `/v1/web/recommendation-pages/${slug}`)
  if (res.status === 404 && !isTenantNotResolved(res)) throw createError({ statusCode: 404, message: 'La página no existe.' })
  assertHubOk('recommendations', res, !!res.data?.data, 'No fue posible cargar la página. Intenta nuevamente.')
  return fromPublicPage(res.data.data)
})

// Detalle público de un procedimiento desde Wellezy Hub (GET /api/v1/web/cirugias/{slug}).
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const slug = String(getRouterParam(event, 'slug') ?? '')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw createError({ statusCode: 404, message: 'El procedimiento no existe.' })

  const res = await wellezyPublicGet<any>(event, `/v1/web/cirugias/${slug}`)
  if (res.status === 404 && !isTenantNotResolved(res)) throw createError({ statusCode: 404, message: 'El procedimiento no existe.' })
  assertHubOk('procedures', res, !!res.data?.data, 'No fue posible cargar el procedimiento. Intenta nuevamente.')

  return fromPublicDetail(res.data.data)
})

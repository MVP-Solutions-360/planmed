// Listado público de noticias desde Wellezy Hub (GET /api/v1/web/posts).
// Hub resuelve empresa/línea con X-Tenant-Linea (configuración de Planmed) y solo entrega noticias de esa línea,
// publicadas y con fecha vigente. Nada de company_id/linea_id viaja desde el navegador.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const res = await wellezyPublicGet<any>(event, '/v1/web/posts?per_page=50')

  assertHubOk('news', res, Array.isArray(res.data?.data), 'No fue posible cargar las noticias. Intenta nuevamente.')

  return res.data.data.map(fromPublicPost)
})

// Menú público de páginas de recomendaciones (GET /api/v1/web/recommendation-pages): solo publicadas de la línea de Planmed,
// sin contenido. Hub resuelve la línea con X-Tenant-Linea (configuración del servidor); nada del tenant viaja desde el navegador.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const res = await wellezyPublicGet<any>(event, '/v1/web/recommendation-pages')
  assertHubOk('recommendations', res, Array.isArray(res.data?.data), 'No fue posible cargar las recomendaciones. Intenta nuevamente.')
  return res.data.data.map(fromPublicPage)
})

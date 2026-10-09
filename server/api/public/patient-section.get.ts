// «Nuestros Pacientes» público (GET /api/v1/web/patient-section). Hub solo entrega lo visible de la línea de Planmed: videos si están
// habilitados, casos publicados con ambas imágenes, publicaciones de Instagram activas y el programa de referidos.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const res = await wellezyPublicGet<any>(event, '/v1/web/patient-section')
  assertHubOk('patients', res, !!res.data?.data && typeof res.data.data === 'object', 'No fue posible cargar el contenido. Intenta nuevamente.')
  return fromPublicSection(res.data.data)
})

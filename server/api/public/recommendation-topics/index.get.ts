import { fromPublicTopics } from '#shared/utils/recommendationTree'

// Árbol del menú de Recomendaciones (GET /api/v1/web/recommendation-topics): temas principales PUBLICADOS de la línea de Planmed, cada
// uno con sus subtemas publicados y en el orden del Hub. Un tema sin subtemas publicados no llega (Hub no lo entrega y aquí tampoco
// se conserva). Hub resuelve la línea con X-Tenant-Linea (configuración del servidor); nada del tenant viaja desde el navegador.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const res = await wellezyPublicGet<any>(event, '/v1/web/recommendation-topics')
  assertHubOk('recommendation-topics', res, Array.isArray(res.data?.data), 'No fue posible cargar las recomendaciones. Intenta nuevamente.')
  return fromPublicTopics(res.data.data)
})

import { fromPublicSubtopic, isRecommendationSlug } from '#shared/utils/recommendationTree'

// Página de un subtema (GET /api/v1/web/recommendation-topics/{topic}/{subtopic}): introducción, secciones visibles y recomendaciones
// publicadas. Inexistente, no publicado, de otra línea o que no pertenece a ese tema => 404 real. Un fallo del Hub (caído, tenant mal
// configurado, respuesta fuera de contrato) NO es un 404: responde 503 con su causa, para no presentar «no existe» por un error.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const topic = String(getRouterParam(event, 'topic') ?? '')
  const subtopic = String(getRouterParam(event, 'subtopic') ?? '')
  if (!isRecommendationSlug(topic) || !isRecommendationSlug(subtopic)) throw createError({ statusCode: 404, message: 'La página no existe.' })

  const res = await wellezyPublicGet<any>(event, `/v1/web/recommendation-topics/${topic}/${subtopic}`)
  if (res.status === 404 && !isTenantNotResolved(res)) throw createError({ statusCode: 404, message: 'La página no existe.' })
  const parsed = res.status === 200 ? fromPublicSubtopic(res.data?.data) : null
  // La respuesta debe corresponder a lo pedido: si el Hub entregara otra página, no se muestra bajo esta URL.
  const page = parsed && parsed.slug === subtopic && parsed.topic.slug === topic ? parsed : null
  assertHubOk('recommendation-topics', res, !!page, 'No fue posible cargar la página. Intenta nuevamente.')
  return page
})

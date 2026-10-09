// Páginas de recomendaciones de la línea del usuario autenticado (Hub filtra por el token). Lista completa, sin paginar.
export default defineEventHandler(async (event) => {
  const res = await hubRecommendations(event, 'GET', '')
  return { data: (res?.data ?? []).map(fromCmsPage) }
})

// Crea una página: Hub genera el slug desde el título y la deja oculta (published=false) hasta que se publique.
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null)
  const res = await hubRecommendations(event, 'POST', '', { body: pickCreateBody(body) })
  return fromCmsPage(res.data)
})

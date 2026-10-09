// En Hub "eliminar" despublica (status = draft): la noticia se conserva y deja de ser pública.
export default defineEventHandler(async (event) => {
  const res = await hubNews(event, 'DELETE', `/${parseNewsId(event)}`)
  return fromCmsPost(res.data)
})

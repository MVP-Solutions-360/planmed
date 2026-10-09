export default defineEventHandler(async (event) => {
  const res = await hubNews(event, 'GET', `/${parseNewsId(event)}`)
  return fromCmsPost(res.data)
})

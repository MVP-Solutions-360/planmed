export default defineEventHandler(async (event) => {
  const id = parseNewsId(event)
  const body = await readBody(event).catch(() => null)
  let res = await hubNews(event, 'PUT', `/${id}`, { body: pickNewsBody(body) })

  if (typeof body?.coverImage === 'string' && body.coverImage.startsWith('data:')) {
    res = await hubNewsCover(event, id, body.coverImage)
  }
  return fromCmsPost(res.data)
})

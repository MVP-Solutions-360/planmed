export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null)
  let res = await hubNews(event, 'POST', '', { body: pickNewsBody(body) })

  // La portada llega como data URL desde el formulario: se sube a Hub como archivo (multipart).
  if (typeof body?.coverImage === 'string' && body.coverImage.startsWith('data:')) {
    res = await hubNewsCover(event, Number(res.data.id), body.coverImage)
  }
  return fromCmsPost(res.data)
})

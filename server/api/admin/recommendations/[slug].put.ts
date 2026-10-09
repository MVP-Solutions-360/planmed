// Edita una página (parcial): título, etiqueta del menú, video, contenido, publicación e imagen.
// La imagen llega como data URL y se sube a Hub como multipart; una URL ya publicada no se reenvía; '' la elimina.
export default defineEventHandler(async (event) => {
  const slug = parsePageSlug(event)
  const body = await readBody(event).catch(() => null)
  const row = await hubPageBySlug(event, slug)
  const id = Number(row.id)

  const fields = pickPageBody(body)
  let last = Object.keys(fields).length ? (await hubRecommendations(event, 'PUT', `/${id}`, { body: fields })).data : row

  if (typeof body?.image === 'string') {
    if (body.image.startsWith('data:')) last = (await hubPageImage(event, id, body.image)).data
    else if (body.image === '' && last.image_url) last = (await hubRecommendations(event, 'DELETE', `/${id}/image`)).data
  }
  return fromCmsPage(last)
})

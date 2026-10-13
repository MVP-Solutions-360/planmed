// Guarda una página informativa simple (no en Hub). Orden: origen + sesión + rol vigente ANTES de leer el cuerpo o validar el slug,
// luego validación, conflicto de edición concurrente y escritura atómica.
export default defineEventHandler(async (event) => {
  await requireAboutEditor(event)
  const slug = resolveSitePageSlug(getRouterParam(event, 'slug'))
  const body = await readBody(event).catch(() => null)
  const current = await readSitePage(event, slug)
  if (body && typeof body === 'object' && typeof body.updatedAt === 'string' && body.updatedAt !== current.updatedAt) {
    const message = 'Otra persona guardó cambios mientras editabas. Recarga la página para ver la versión actual antes de guardar.'
    throw createError({ statusCode: 409, message, data: { message, errors: {} } })
  }
  const next = parseSitePageBody(body, current)
  next.updatedAt = new Date().toISOString()
  await writeSitePage(event, slug, next)
  return next
})

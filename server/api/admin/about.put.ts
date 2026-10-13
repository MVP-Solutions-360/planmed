// Guarda «Nosotros» en la persistencia local de la web (no en Hub). Orden: origen + sesión + rol vigente ANTES de leer el cuerpo
// (sin sesión => 401, nunca un 422), luego validación completa, conflicto de edición concurrente, imagen nueva y escritura atómica.
export default defineEventHandler(async (event) => {
  await requireAboutEditor(event)
  const body = await readBody(event).catch(() => null)
  const current = await readAboutContent(event)

  // Si otro administrador guardó después de que este formulario se cargó, no se pisan sus cambios.
  if (body && typeof body === 'object' && typeof body.updatedAt === 'string' && body.updatedAt !== current.updatedAt) {
    const message = 'Otra persona guardó cambios mientras editabas. Recarga la página para ver la versión actual antes de guardar.'
    throw createError({ statusCode: 409, message, data: { message, errors: {} } })
  }

  const next = parseAboutBody(body, current)
  const previousImage = current.hero.image
  if (next.hero.image.startsWith('data:')) next.hero.image = await saveAboutImage(event, next.hero.image)
  next.updatedAt = new Date().toISOString()
  await writeAboutContent(event, next)
  if (previousImage !== next.hero.image) await removeAboutImage(event, previousImage)
  return next
})

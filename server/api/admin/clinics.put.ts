// Guarda «Clínicas aliadas» (no en Hub). Orden: origen + sesión + rol vigente ANTES de leer el cuerpo, luego conflicto de edición
// concurrente, validación completa, escritura atómica y limpieza de los archivos que dejaron de usarse.
export default defineEventHandler(async (event) => {
  await requireAboutEditor(event)
  const body = await readBody(event).catch(() => null)
  const current = await readClinics(event)
  if (body && typeof body === 'object' && typeof body.updatedAt === 'string' && body.updatedAt !== current.updatedAt) {
    const message = 'Otra persona guardó cambios mientras editabas. Recarga la página para ver la versión actual antes de guardar.'
    throw createError({ statusCode: 409, message, data: { message, errors: {} } })
  }
  const next = parseClinicsBody(body, current)
  next.updatedAt = new Date().toISOString()
  await writeClinics(event, next)
  await removeUnusedClinicMedia(event, current, next)
  return next
})

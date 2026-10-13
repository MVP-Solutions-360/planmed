// Archivo subido desde el administrador de «Clínicas aliadas». Solo nombres generados por el servidor (sin rutas arbitrarias).
export default defineEventHandler(async (event) => {
  const name = String(getRouterParam(event, 'name') ?? '')
  const file = await readClinicFile(event, name)
  if (!file) throw createError({ statusCode: 404, message: 'Archivo no encontrado.' })
  setHeader(event, 'Content-Type', CLINIC_MEDIA_TYPES[name.split('.').pop()!]!)
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'Content-Disposition', 'inline')
  // El nombre es único por subida (nunca se reutiliza), así que puede cachearse de forma indefinida.
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  return file
})

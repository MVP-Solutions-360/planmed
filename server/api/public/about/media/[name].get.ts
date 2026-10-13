// Imagen de portada subida desde el administrador de «Nosotros». Solo nombres generados por el servidor (sin rutas arbitrarias).
export default defineEventHandler(async (event) => {
  const name = String(getRouterParam(event, 'name') ?? '')
  const file = await readAboutImage(event, name)
  if (!file) throw createError({ statusCode: 404, message: 'Imagen no encontrada.' })
  setHeader(event, 'Content-Type', ABOUT_MEDIA_TYPES[name.split('.').pop()!]!)
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  // El nombre es único por subida (nunca se reutiliza), así que puede cachearse de forma indefinida.
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  return file
})

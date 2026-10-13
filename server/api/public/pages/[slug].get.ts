// Página informativa simple pública. Si el archivo no se puede leer, devuelve el contenido inicial (vacío) en lugar de fallar.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const slug = resolveSitePageSlug(getRouterParam(event, 'slug'))
  try {
    return await readSitePage(event, slug)
  } catch {
    return sitePageDefault(slug)
  }
})

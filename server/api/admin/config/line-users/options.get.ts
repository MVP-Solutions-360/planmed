// Catálogos del formulario de alta (empresa, línea y roles asignables), tal como los devuelve Hub. Solo líder de la línea.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  return await fetchLineUserOptions(event)
})

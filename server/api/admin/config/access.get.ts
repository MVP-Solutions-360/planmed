// Comprobación de acceso a Configuración. 200 para el líder de la línea (colaboradores y tasa) o para un rol con permiso sobre la tasa
// (solo la pestaña de tasa); 403 para cualquier otro. Devuelve qué secciones puede usar; cada ruta las vuelve a comprobar en el servidor.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  return await resolveConfigAccess(event)
})

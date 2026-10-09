// Contenido completo (incluido el oculto) de «Nuestros Pacientes» para la línea del usuario autenticado. Hub filtra por el token.
export default defineEventHandler(async (event) => {
  return (await readCmsContent(event)).content
})

// Contenido completo (incluidas las preguntas inactivas) de «Nosotros» para el administrador. Persistencia local: server/utils/aboutStore.ts.
export default defineEventHandler(async (event) => {
  await adminSession(event)
  return await readAboutContent(event)
})

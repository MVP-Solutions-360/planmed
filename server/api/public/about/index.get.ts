// «Nosotros» público: contenido guardado localmente (o el inicial si aún no se ha guardado), solo con las preguntas activas.
// Si el archivo no se puede leer, la página muestra el contenido inicial validado en lugar de fallar.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  try {
    return aboutPublicView(await readAboutContent(event))
  } catch {
    return aboutPublicView(aboutDefaultContent())
  }
})

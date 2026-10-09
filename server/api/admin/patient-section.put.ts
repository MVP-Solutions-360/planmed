// Guarda «Nuestros Pacientes»: aplica en Hub solo lo que cambió (configuración, videos/Instagram, casos e imágenes) y devuelve
// el contenido ya persistido. Las imágenes nuevas llegan como data URL y se suben a Hub como multipart.
export default defineEventHandler(async (event) => {
  // Autenticación y origen ANTES de procesar el cuerpo: una petición sin sesión recibe 401 (no un 422 de validación).
  await adminSession(event)
  const next = parseContentBody(await readBody(event).catch(() => null))
  const progress = { writes: 0 }
  try {
    await applyContent(event, next, progress)
  } catch (error) {
    // Si ya se aplicaron cambios, el error informa la operación parcial y el estado guardado (ver withPartialState).
    throw await withPartialState(event, error, progress)
  }
  return (await readCmsContent(event)).content
})

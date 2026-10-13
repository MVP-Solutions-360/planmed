// Clínicas aliadas públicas. Si el archivo no se puede leer, la página muestra la lista vacía en lugar de fallar.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  try {
    return await readClinics(event)
  } catch {
    return clinicsDefault()
  }
})

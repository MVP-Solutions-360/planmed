// Sube un archivo de «Clínicas aliadas» (imagen o documento) y devuelve su URL pública. La URL solo queda en uso al guardar la clínica.
export default defineEventHandler(async (event) => {
  await requireAboutEditor(event)
  const body = await readBody(event).catch(() => null)
  const url = await saveClinicFile(event, body?.dataUrl, body?.kind)
  return { url }
})

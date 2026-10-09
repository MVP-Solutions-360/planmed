export default defineEventHandler(async (event) => {
  const id = parseProcedureId(event)
  const body = await readBody(event).catch(() => null)
  const fields = pickProcedureBody(body)

  // Sin campos de contenido (solo multimedia) no se llama al PUT: Hub lo aceptaría vacío, pero no hay nada que guardar.
  const res = Object.keys(fields).length
    ? await hubProcedures(event, 'PUT', `/${id}`, { body: fields })
    : await hubProcedures(event, 'GET', `/${id}`)
  const last = await applyProcedureMedia(event, id, body, res.data)
  return fromCms(last)
})

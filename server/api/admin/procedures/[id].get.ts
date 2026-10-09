export default defineEventHandler(async (event) => {
  const res = await hubProcedures(event, 'GET', `/${parseProcedureId(event)}`)
  return fromCms(res.data)
})

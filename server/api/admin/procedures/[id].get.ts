export default defineEventHandler(async (event) => {
  const res = await hubProcedures(event, 'GET', `/${parseProcedureId(event)}`)
  return (await withOrientation(event, [fromCms(res.data)]))[0]
})

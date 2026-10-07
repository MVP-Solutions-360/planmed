export default defineEventHandler(async (event) => {
  const id = parsePrpId(event)
  const body = await readBody(event).catch(() => null)
  return hubPrp(event, 'PUT', `/${id}`, { body: pickPrpBody(body) })
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null)
  return hubPrp(event, 'POST', '', { body: pickPrpBody(body) })
})

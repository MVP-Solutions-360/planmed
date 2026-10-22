export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null)
  const res = await hubProcedures(event, 'POST', '', { body: pickProcedureBody(body) })
  const last = await applyProcedureMedia(event, Number(res.data.id), body, res.data)
  const dto = fromCms(last)
  await saveOrientation(event, dto.slug, body?.imageOrientation)
  return (await withOrientation(event, [dto]))[0]
})

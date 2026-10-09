export default defineEventHandler(async (event) => {
  const res = await hubNews(event, 'GET', '', { query: pickNewsQuery(getQuery(event)) })
  return { data: (res?.data ?? []).map(fromCmsPost), meta: res?.meta ?? null }
})

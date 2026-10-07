export default defineEventHandler(event => hubPrp(event, 'GET', '', { query: pickPrpQuery(getQuery(event)) }))

export default defineEventHandler(event => hubPrp(event, 'GET', `/${parsePrpId(event)}`))

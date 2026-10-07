// En Hub, "eliminar" un PRP lo desactiva (is_active = false); no se borra el registro.
export default defineEventHandler(event => hubPrp(event, 'DELETE', `/${parsePrpId(event)}`))

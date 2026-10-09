// Lista completa (propios + maestros) de la línea del usuario autenticado: Hub filtra por el token.
export default defineEventHandler(async (event) => {
  const rows = await hubProceduresAll(event, pickProcedureQuery(getQuery(event)))
  return { data: rows.map(fromCms) }
})

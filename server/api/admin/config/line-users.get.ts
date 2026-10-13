// Colaboradores de la línea (solo lectura), solo para el líder de la línea. Lógica: server/utils/lineUsers.ts.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  return await fetchLineUsers(event, getQuery(event))
})

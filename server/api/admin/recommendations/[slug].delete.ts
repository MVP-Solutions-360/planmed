// Elimina una página creada desde un panel. Las páginas base no se eliminan (Hub responde 403): solo se ocultan.
export default defineEventHandler(async (event) => {
  const row = await hubPageBySlug(event, parsePageSlug(event))
  if (row.is_custom === false) throw authError(403, 'Las páginas base no se pueden eliminar; puedes ocultarlas.')
  await hubRecommendations(event, 'DELETE', `/${Number(row.id)}`)
  return { ok: true }
})

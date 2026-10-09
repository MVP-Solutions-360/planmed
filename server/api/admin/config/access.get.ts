// Comprobación de acceso a Configuración: 200 solo para el líder de la línea; 403 para cualquier otro.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  await requireAreaLeader(event)
  return { ok: true }
})

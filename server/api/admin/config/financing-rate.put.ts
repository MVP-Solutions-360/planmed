// Guarda la tasa de interés mensual del simulador. Orden: origen + sesión + permiso vigente ANTES de leer el cuerpo (sin sesión => 401,
// nunca un 422), luego validación estricta del formato (sin corregir la entrada), conflicto de edición concurrente y escritura atómica.
export default defineEventHandler(async (event) => {
  const user = await requireRateEditor(event)
  const { rate, expectedUpdatedAt } = parseFinancingRateBody(await readBody(event).catch(() => null))
  const saved = await saveFinancingRate(event, rate, expectedUpdatedAt, { id: Number(user.id), name: user.name })
  return financingRateAdminView(saved)
})

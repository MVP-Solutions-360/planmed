// Tasa de interés mensual vigente para el simulador público. Sin caché del navegador/CDN: un cambio hecho en el panel se refleja en la
// siguiente cotización. Si la configuración no se puede leer responde 503 (`rate_unavailable`) y el simulador muestra «no disponible»:
// nunca se devuelve una tasa de respaldo.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  return financingRatePublicView(await readFinancingRate(event))
})

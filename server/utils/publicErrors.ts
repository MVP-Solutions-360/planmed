// Fallos de las rutas públicas de Nitro que consultan a Wellezy Hub, clasificados para no confundirlos con «no hay contenido».
// Una lista con CERO registros es una respuesta válida (HTTP 200, `[]`). Todo lo demás es un fallo de servicio y responde 503
// con `data.reason`, que el navegador usa para mostrar un aviso con reintento en lugar de un estado vacío:
//   hub_unavailable  → sin conexión, timeout, 5xx u otro estado inesperado del Hub.
//   tenant           → el Hub no resolvió la línea (X-Tenant-Linea / NUXT_WELLEZY_LINE_SLUG mal configurado).
//   rejected         → el Hub respondió 401/403 a una lectura pública (configuración o ruta protegida por error).
//   invalid_response → 200 pero con un cuerpo que no cumple el contrato (p. ej. `data` no es una lista).
// El 404 de «el recurso no existe» NO pasa por aquí: lo decide cada ruta de detalle.

export type PublicFailureReason = 'hub_unavailable' | 'tenant' | 'rejected' | 'invalid_response'

export const isTenantNotResolved = (res: { status: number, data?: any }) => res.status === 404 && String(res.data?.message ?? '').includes('Tenant')

export function classifyHubFailure(res: { status: number, data?: any }, bodyIsValid: boolean): PublicFailureReason | null {
  if (isTenantNotResolved(res)) return 'tenant'
  if (res.status === 200) return bodyIsValid ? null : 'invalid_response'
  if (res.status === 401 || res.status === 403) return 'rejected'
  return 'hub_unavailable'
}

/** Si la respuesta del Hub no es utilizable lanza un 503 con la causa; si lo es, no hace nada. Sin datos sensibles en el log. */
export function assertHubOk(scope: string, res: { status: number, data?: any }, bodyIsValid: boolean, message: string): void {
  const reason = classifyHubFailure(res, bodyIsValid)
  if (!reason) return
  if (reason === 'tenant') console.error(`[${scope}] Hub no resolvió el tenant (revisa NUXT_WELLEZY_LINE_SLUG).`)
  else if (reason !== 'hub_unavailable') console.error(`[${scope}] Respuesta del Hub no utilizable: ${reason} (estado ${res.status}).`)
  throw createError({ statusCode: 503, message, data: { reason } })
}

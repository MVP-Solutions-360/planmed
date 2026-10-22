import type { H3Event } from 'h3'
import { resolveProcedureSectionRoute } from '#shared/utils/procedureSectionsApi'
// Importación explícita (no auto-import): el auto-import de Nitro no siempre registra las exportaciones añadidas a un util existente y el fallo solo aparece en ejecución
// («forwardAdminRoute is not defined»). Ruta relativa con extensión: las pruebas de Node (sin alias de Nuxt) la resuelven; el bundler también.
// @ts-expect-error TS5097: la extensión .ts solo se permite con allowImportingTsExtensions.
import { forwardAdminRoute, treeSegments } from './recommendationAdmin.ts'

// Proxy ADMINISTRATIVO de las secciones de procedimientos (Wellezy Hub: /cms/procedures/{id}/sections y /cms/procedure-sections/*). Reutiliza el
// reenvío de Recomendaciones (control de origen, sesión, traducción de errores y subida de imágenes) con su propia tabla de rutas permitidas.
// Hub decide por línea (token) y por permiso `cirugia_secciones.*`; un maestro nunca se modifica.
export async function handleProcedureSectionsRequest(event: H3Event) {
  // Primero el origen y la sesión (PM-SEC-01 y 401), después la ruta: una petición sin sesión nunca llega a resolver nada.
  const { session, token } = await adminSession(event)
  const route = resolveProcedureSectionRoute(String(event.method), treeSegments(event))
  if (!route) throw createError({ statusCode: 404, message: 'Ruta no disponible.' })
  return forwardAdminRoute(event, session, token, route)
}

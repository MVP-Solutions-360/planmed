import type { H3Event } from 'h3'
import { resolveNewsSectionRoute } from '#shared/utils/newsSectionsApi'
// Importación explícita (no auto-import) por la misma razón que procedureSections.ts; ruta relativa con extensión para las pruebas de Node.
// @ts-expect-error TS5097: la extensión .ts solo se permite con allowImportingTsExtensions.
import { forwardAdminRoute, treeSegments } from './recommendationAdmin.ts'

// Proxy ADMINISTRATIVO de las secciones de noticias (Wellezy Hub: /cms/posts/{id}/sections y /cms/post-sections/*). Reutiliza el reenvío de
// Recomendaciones (control de origen, sesión y traducción de errores) con su propia tabla de rutas permitidas.
// Hub decide por línea (token) y con los permisos existentes de noticias (blog.*).
export async function handleNewsSectionsRequest(event: H3Event) {
  // Primero el origen y la sesión (PM-SEC-01 y 401), después la ruta: una petición sin sesión nunca llega a resolver nada.
  const { session, token } = await adminSession(event)
  const route = resolveNewsSectionRoute(String(event.method), treeSegments(event))
  if (!route) throw createError({ statusCode: 404, message: 'Ruta no disponible.' })
  return forwardAdminRoute(event, session, token, route)
}

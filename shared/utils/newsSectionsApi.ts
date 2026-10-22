// Rutas permitidas del panel de SECCIONES DE NOTICIAS hacia la API administrativa de Wellezy Hub (/cms/posts/{id}/sections y
// /cms/post-sections/*). Módulo PURO: lo usan la ruta de Nitro y las pruebas. Mismo esquema que procedureSectionsApi: solo se reenvía lo
// que está en la tabla (método + ruta + campos). Nunca company_id, linea_id ni created_by: Hub los deriva del token de la línea.
// Ruta relativa con extensión: las pruebas de Node (sin alias de Nuxt) la resuelven; el bundler también.
// @ts-expect-error TS5097: la extensión .ts solo se permite con allowImportingTsExtensions.
import { matchAdminRoute, type AdminRoute, type Def } from './recommendationAdminApi.ts'

// `blocks[]:…` = lista de bloques apilables por columna; de cada bloque solo viajan estos campos (nunca company_id ni linea_id).
const SECTION = ['title', 'layout', 'content', 'content_left', 'content_right', 'orden', 'visible', 'blocks[]:id,slot,type,content,url,alt'] as const
const REORDER = ['ids'] as const

const DEFS: readonly Def[] = [
  { method: 'GET', pattern: 'posts/:id', hub: '/posts/:id/sections' },
  { method: 'POST', pattern: 'posts/:id', hub: '/posts/:id/sections', body: SECTION },
  { method: 'POST', pattern: 'posts/:id/reorder', hub: '/posts/:id/sections/reorder', body: REORDER },

  { method: 'GET', pattern: 'sections/:id', hub: '/post-sections/:id' },
  { method: 'PUT', pattern: 'sections/:id', hub: '/post-sections/:id', body: SECTION },
  { method: 'DELETE', pattern: 'sections/:id', hub: '/post-sections/:id' },

  // Imagen de un bloque de tipo imagen (el bloque se crea antes con la lista de bloques de la sección).
  { method: 'POST', pattern: 'blocks/:id/image', hub: '/post-section-blocks/:id/image', body: ['image'], upload: true },
  { method: 'DELETE', pattern: 'blocks/:id/image', hub: '/post-section-blocks/:id/image' }
]

export function resolveNewsSectionRoute(method: string, segments: string[]): AdminRoute | null {
  return matchAdminRoute(DEFS, method, segments)
}

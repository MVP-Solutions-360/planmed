// Rutas permitidas del panel de SECCIONES DE PROCEDIMIENTOS hacia la API administrativa de Wellezy Hub (/cms/procedures/{id}/sections y
// /cms/procedure-sections/*). Módulo PURO: lo usan la ruta de Nitro y las pruebas. Mismo esquema que recommendationAdminApi: solo se reenvía
// lo que está en la tabla (método + ruta + campos). Nunca company_id, linea_id ni created_by: Hub los deriva del token de la línea.
// Ruta relativa con extensión: las pruebas de Node (sin alias de Nuxt) la resuelven; el bundler también.
// @ts-expect-error TS5097: la extensión .ts solo se permite con allowImportingTsExtensions.
import { matchAdminRoute, type AdminRoute, type Def } from './recommendationAdminApi.ts'

// `blocks[]:…` = lista de bloques apilables por columna; de cada bloque solo viajan estos campos (nunca company_id ni linea_id).
const SECTION = ['title', 'content', 'layout', 'column_layout', 'orden', 'visible', 'blocks[]:id,slot,type,content,url,alt,from_section_image'] as const
const REORDER = ['ids'] as const

const DEFS: readonly Def[] = [
  { method: 'GET', pattern: 'procedures/:id', hub: '/procedures/:id/sections' },
  { method: 'POST', pattern: 'procedures/:id', hub: '/procedures/:id/sections', body: SECTION },
  { method: 'POST', pattern: 'procedures/:id/reorder', hub: '/procedures/:id/sections/reorder', body: REORDER },

  { method: 'GET', pattern: 'sections/:id', hub: '/procedure-sections/:id' },
  { method: 'PUT', pattern: 'sections/:id', hub: '/procedure-sections/:id', body: SECTION },
  { method: 'DELETE', pattern: 'sections/:id', hub: '/procedure-sections/:id' },
  { method: 'POST', pattern: 'sections/:id/image', hub: '/procedure-sections/:id/image', body: ['image'], upload: true },
  { method: 'DELETE', pattern: 'sections/:id/image', hub: '/procedure-sections/:id/image' },

  // Imagen de un bloque de tipo imagen (el bloque se crea antes con la lista de bloques de la sección).
  { method: 'POST', pattern: 'blocks/:id/image', hub: '/procedure-section-blocks/:id/image', body: ['image'], upload: true },
  { method: 'DELETE', pattern: 'blocks/:id/image', hub: '/procedure-section-blocks/:id/image' }
]

export function resolveProcedureSectionRoute(method: string, segments: string[]): AdminRoute | null {
  return matchAdminRoute(DEFS, method, segments)
}

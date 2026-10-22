// Secciones de contenido de una noticia: qué se muestra. Módulo PURO (lo usan el componente público y las pruebas).
// Ruta relativa con extensión: las pruebas de Node (sin alias de Nuxt) la resuelven; el bundler también.
// @ts-expect-error TS5097: la extensión .ts solo se permite con allowImportingTsExtensions.
import { hasText } from './recommendationTree.ts'

export interface NewsSectionView {
  title: string | null
  layout: 'one_column' | 'two_columns'
  content: string
  contentLeft: string
  contentRight: string
}

/** Hub ya entrega las secciones visibles y ordenadas; aquí solo se descarta lo que no tiene nada que mostrar en su distribución activa. */
export function visibleNewsSections<T extends NewsSectionView>(sections: readonly T[] | null | undefined): T[] {
  return (sections ?? []).filter(s => !!s.title || (s.layout === 'two_columns' ? hasText(s.contentLeft) || hasText(s.contentRight) : hasText(s.content)))
}

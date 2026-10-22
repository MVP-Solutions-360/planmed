// Secciones de contenido de una noticia: qué se muestra. Módulo PURO (lo usan el componente público y las pruebas).
// @ts-expect-error TS5097: la extensión .ts solo se permite con allowImportingTsExtensions.
import { activeSlots, type ColumnLayout } from './contentBlocks.ts'

export { activeSlots }

export interface NewsSectionView {
  title: string | null
  layout: ColumnLayout
  blocks: { main: readonly unknown[], left: readonly unknown[], right: readonly unknown[] }
}

/** Hub ya entrega las secciones visibles y ordenadas; aquí solo se descarta lo que no tiene nada que mostrar en su distribución activa. */
export function visibleNewsSections<T extends NewsSectionView>(sections: readonly T[] | null | undefined): T[] {
  return (sections ?? []).filter(s => !!s.title || activeSlots(s.layout).some(slot => (s.blocks?.[slot]?.length ?? 0) > 0))
}

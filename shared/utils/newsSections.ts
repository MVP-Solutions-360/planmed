// Secciones de contenido de una noticia: qué se muestra. Módulo PURO (lo usan el componente público y las pruebas).

export interface NewsSectionView {
  title: string | null
  layout: 'one_column' | 'two_columns'
  blocks: { main: readonly unknown[], left: readonly unknown[], right: readonly unknown[] }
}

/** Columnas de la distribución activa, en orden de lectura (izquierda → derecha). */
export function activeSlots(layout: 'one_column' | 'two_columns'): Array<'main' | 'left' | 'right'> {
  return layout === 'two_columns' ? ['left', 'right'] : ['main']
}

/** Hub ya entrega las secciones visibles y ordenadas; aquí solo se descarta lo que no tiene nada que mostrar en su distribución activa. */
export function visibleNewsSections<T extends NewsSectionView>(sections: readonly T[] | null | undefined): T[] {
  return (sections ?? []).filter(s => !!s.title || activeSlots(s.layout).some(slot => (s.blocks?.[slot]?.length ?? 0) > 0))
}

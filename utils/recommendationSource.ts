// Qué mostrar para el texto de recomendaciones de un procedimiento (cuidados o revisión). La regla la decide el Hub (campo
// `recomendaciones.<tipo>.fuente` del procedimiento); aquí solo se aplica, sin escribir nada:
//   pagina        → una página independiente VINCULADA y publicada sustituye el texto histórico: se muestra esa página.
//   pagina_oculta → existe una página vinculada pero no está publicada: NO hay contenido y NO se usa el texto histórico.
//   historico     → no hay página vinculada: se muestra el texto histórico del procedimiento (si tiene).
//   ninguna       → no hay página ni texto histórico.
// Con un Hub anterior (sin el campo) se conserva el comportamiento previo: texto histórico si existe.

export type RecommendationResolution =
  | { type: 'page', slug: string }
  | { type: 'historic', html: string }
  | { type: 'none', reason: 'hidden' | 'empty' }

interface ProcedureLike {
  recomendaciones?: Partial<Record<string, { fuente: string, paginaSlug: string | null }>>
  [field: string]: unknown
}

/** `isEmpty` = utils/richText.isRichHtmlEmpty (se inyecta para poder probar esta función con Node sin resolver imports de Nuxt). */
export function resolveRecommendation(procedure: ProcedureLike, kind: string, field: string, isEmpty: (html: string) => boolean): RecommendationResolution {
  const historic = () => {
    const value = procedure[field]
    return typeof value === 'string' && value && !isEmpty(value) ? { type: 'historic', html: value } as const : { type: 'none', reason: 'empty' } as const
  }

  const source = procedure.recomendaciones?.[kind]
  if (!source) return historic()
  switch (source.fuente) {
    case 'pagina': return source.paginaSlug ? { type: 'page', slug: source.paginaSlug } : { type: 'none', reason: 'empty' }
    case 'pagina_oculta': return { type: 'none', reason: 'hidden' }
    case 'historico': return historic()
    default: return { type: 'none', reason: 'empty' }
  }
}

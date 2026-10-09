// Tipos de recomendaciones que salen de los procedimientos (un texto por procedimiento).
export type RecommendationKind = 'cuidados' | 'revision'

export const RECOMMENDATION_KINDS = {
  cuidados: {
    field: 'recomendaciones_post',
    /** Indicador de la lista pública: el procedimiento tiene este texto. */
    flag: 'tiene_recomendaciones_post',
    eyebrow: 'Cuidados de cirugía',
    indexTitle: 'Cuidados de tu cirugía',
    subtitle: 'Sigue estas indicaciones después de tu procedimiento para una recuperación segura y los mejores resultados.',
    menuLabel: 'Recomendaciones cuidados de cirugías',
    title: (name: string) => `Cuidados de ${name}`,
    itemLabel: (name: string) => `Cuidado de ${name}`
  },
  revision: {
    field: 'recomendaciones_revision',
    flag: 'tiene_recomendaciones_revision',
    eyebrow: 'Cita de revisión',
    indexTitle: 'Recomendaciones para tu cita de revisión',
    subtitle: 'Prepárate para tu control posoperatorio: esto es lo que debes tener en cuenta antes y durante tu cita.',
    menuLabel: 'Recomendaciones para cita de revisión',
    title: (name: string) => `Recomendaciones para revisión de ${name}`,
    itemLabel: (name: string) => `Revisión ${name}`
  }
} as const

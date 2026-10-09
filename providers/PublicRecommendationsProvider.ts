import type { RecommendationPage } from '~/types/recommendations'

// Lectura pública de las páginas de recomendaciones (solo las publicadas de la línea). Sin escritura.
// getPages() es el menú (sin contenido); getPage() trae el contenido completo, o null si no existe / no está publicada.
export interface PublicRecommendationsProvider {
  getPages(): Promise<RecommendationPage[]>
  getPage(slug: string): Promise<RecommendationPage | null>
}

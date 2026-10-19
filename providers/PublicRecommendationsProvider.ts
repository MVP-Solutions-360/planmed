import type { RecommendationPage } from '~/types/recommendations'
import type { TreeSubtopic, TreeTopic } from '#shared/utils/recommendationTree'

// Lectura pública de las recomendaciones (solo lo publicado de la línea). Sin escritura.
//  · getTopics():  árbol del menú (temas principales con sus subtemas publicados), en el orden del Hub.
//  · getSubtopic(): la página de un subtema (introducción, secciones, recomendaciones), o null si no existe / no está publicada.
//  · getPages()/getPage(): contrato HISTÓRICO por página (`recommendation-pages`), que se conserva para las rutas antiguas
//    /recomendaciones/{slug} y para los listados de cuidados/revisión por procedimiento.
export interface PublicRecommendationsProvider {
  getTopics(): Promise<TreeTopic[]>
  getSubtopic(topic: string, subtopic: string): Promise<TreeSubtopic | null>
  getPages(): Promise<RecommendationPage[]>
  getPage(slug: string): Promise<RecommendationPage | null>
}

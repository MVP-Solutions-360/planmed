<template>
  <RecommendationsRecommendationTopicIndex v-if="topic" :topic="topic" />
  <RecommendationsRecommendationShell
    v-else-if="page"
    :eyebrow="isBase ? eyebrows.general : eyebrows[page.group]"
    :title="page.title"
    :html="page.content"
    :video-url="page.videoUrl"
    :image="page.image"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSeoMeta, useRoute, createError, useAsyncData, navigateTo } from '#imports'
import { publicRecommendationsService } from '~/services/PublicRecommendationsService'
import { RECOMMENDATION_SLUGS, type RecommendationPage } from '~/types/recommendations'
import { resolveLegacySlug, type TreeTopic } from '#shared/utils/recommendationTree'

const eyebrows = { general: 'Recomendaciones', cuidados: 'Cuidados de cirugía', revision: 'Cita de revisión' }
const slug = useRoute().params.slug as string

// /recomendaciones/{slug} sigue siendo una ruta válida por tres motivos, en este orden (Hub garantiza que un slug de tema nunca
// coincide con el de un subtema ni de una página):
//  1. {slug} es un SUBTEMA del árbol → redirección permanente (301) a su URL jerárquica /recomendaciones/{tema}/{slug}. Así las URLs
//     antiguas, ya indexadas o compartidas (y los enlaces cortos que apuntan a ellas) no se rompen. Nunca es circular: el destino
//     tiene dos segmentos y esta página solo atiende uno.
//  2. {slug} es un TEMA principal → su portada (lista de subtemas publicados).
//  3. Página del contrato histórico sin tema (anteriores a la jerarquía): se muestra como siempre.
const { data: tree, error: treeError } = await useAsyncData('recommendation-tree', () => publicRecommendationsService.getTopics(), { default: () => [] as TreeTopic[] })

const resolution = resolveLegacySlug(tree.value, slug)
const topic = ref<TreeTopic | null>(resolution.kind === 'topic' ? resolution.topic : null)
const page = ref<RecommendationPage | null>(null)

if (resolution.kind === 'redirect') {
  await navigateTo(resolution.to, { redirectCode: 301, replace: true })
} else if (resolution.kind === 'legacy') {
  // Wellezy Hub es la fuente de verdad. Se resuelve en el servidor (SSR): una URL directa devuelve el contenido sin depender del
  // navegador. Inexistente, no publicada o de otra línea => 404 real.
  const { data, error } = await useAsyncData(`recommendation-${slug}`, () => publicRecommendationsService.getPage(slug))

  // Hub caído o con error NO es "página inexistente": se responde 503 (reintentable), no un 404 engañoso.
  if (error.value) {
    throw createError({ statusCode: 503, statusMessage: 'No fue posible cargar la página. Intenta nuevamente.', fatal: true })
  }
  if (!data.value) {
    // Sin el árbol no se puede asegurar que no sea un tema o un subtema: un fallo del Hub no se presenta como «no existe».
    if (treeError.value) throw createError({ statusCode: 503, statusMessage: 'No fue posible cargar la página. Intenta nuevamente.', fatal: true })
    throw createError({ statusCode: 404, statusMessage: 'Página no encontrada', fatal: true })
  }
  page.value = data.value
}

// Las páginas base (cita de preanestesia, prequirúrgicas) conservan el rótulo general aunque cuelguen de otro submenú del menú.
const isBase = RECOMMENDATION_SLUGS.some(s => s.slug === slug)

if (topic.value) {
  useSeoMeta({ title: `${topic.value.title} | Planmed`, description: `Recomendaciones de Planmed: ${topic.value.title}.` })
} else if (page.value) {
  useSeoMeta({ title: `${page.value.title} | Planmed`, description: 'Recomendaciones de Planmed para antes, durante y después de tu cirugía plástica.' })
}
</script>

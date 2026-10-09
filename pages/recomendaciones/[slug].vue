<template>
  <RecommendationsRecommendationShell
    v-if="page"
    :eyebrow="isBase ? eyebrows.general : eyebrows[page.group]"
    :title="page.title"
    :html="page.content"
    :video-url="page.videoUrl"
    :image="page.image"
  />
</template>

<script setup lang="ts">
import { useSeoMeta, useRoute, createError, useAsyncData } from '#imports'
import { publicRecommendationsService } from '~/services/PublicRecommendationsService'
import { RECOMMENDATION_SLUGS } from '~/types/recommendations'

const eyebrows = { general: 'Recomendaciones', cuidados: 'Cuidados de cirugía', revision: 'Cita de revisión' }
const slug = useRoute().params.slug as string

// Wellezy Hub es la fuente de verdad. Se resuelve en el servidor (SSR): una URL directa devuelve el contenido sin depender del
// navegador. Inexistente, no publicada o de otra línea => 404 real.
const { data: page, error } = await useAsyncData(`recommendation-${slug}`, () => publicRecommendationsService.getPage(slug))

// Hub caído o con error NO es "página inexistente": se responde 503 (reintentable), no un 404 engañoso.
if (error.value) {
  throw createError({ statusCode: 503, statusMessage: 'No fue posible cargar la página. Intenta nuevamente.', fatal: true })
}
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Página no encontrada', fatal: true })
}

// Las páginas base (cita de preanestesia, prequirúrgicas) conservan el rótulo general aunque cuelguen de otro submenú del menú.
const isBase = RECOMMENDATION_SLUGS.some(s => s.slug === slug)

useSeoMeta({ title: `${page.value.title} | Planmed`, description: 'Recomendaciones de Planmed para antes, durante y después de tu cirugía plástica.' })
</script>

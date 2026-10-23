<template>
  <RecommendationsRecommendationShell
    v-if="subtopic"
    :eyebrow="subtopic.topic.title"
    :back-to="`/recomendaciones/${topic}`"
    :back-label="`Volver a ${subtopic.topic.title}`"
    :title="subtopic.title"
    :html="subtopic.intro.content"
    :video-url="subtopic.intro.video?.embedUrl"
    :image="subtopic.intro.image?.url"
    :share-path="`/recomendaciones/${topic}/${slug}`"
    :short-url="subtopic.shortUrl"
  >
    <RecommendationsRecommendationSections :sections="subtopic.sections" />
  </RecommendationsRecommendationShell>
</template>

<script setup lang="ts">
import { useSeoMeta, useHead, useRoute, createError, useAsyncData, useSiteConfig } from '#imports'
import { publicRecommendationsService } from '~/services/PublicRecommendationsService'
import { isRecommendationSlug, subtopicSeo } from '#shared/utils/recommendationTree'

// Página de un SUBTEMA de recomendaciones: /recomendaciones/{tema}/{subtema}. Wellezy Hub es la fuente de verdad y se resuelve en el
// servidor (SSR): una URL directa devuelve el contenido sin depender del navegador. Inexistente, no publicada, de otra línea o que no
// pertenece a ese tema => 404 real. Un fallo del Hub NO es «no existe»: se responde 503 (reintentable).
const route = useRoute()
const topic = String(route.params.topic ?? '')
const slug = String(route.params.subtopic ?? '')

if (!isRecommendationSlug(topic) || !isRecommendationSlug(slug)) {
  throw createError({ statusCode: 404, statusMessage: 'Página no encontrada', fatal: true })
}

const { data: subtopic, error } = await useAsyncData(`recommendation-subtopic-${topic}-${slug}`, () => publicRecommendationsService.getSubtopic(topic, slug))

if (error.value) {
  throw createError({ statusCode: 503, statusMessage: 'No fue posible cargar la página. Intenta nuevamente.', fatal: true })
}
if (!subtopic.value) {
  throw createError({ statusCode: 404, statusMessage: 'Página no encontrada', fatal: true })
}

// SEO del subtema: título, descripción (introducción o primera sección con texto), imagen y URL canónica jerárquica.
const seo = subtopicSeo(subtopic.value)
const origin = String(useSiteConfig().url ?? '').replace(/\/+$/, '')
useSeoMeta({
  title: seo.title,
  description: seo.description,
  ogTitle: seo.title,
  ogDescription: seo.description,
  ogType: 'article',
  ...(seo.image ? { ogImage: seo.image } : {})
})
useHead({ link: [{ rel: 'canonical', href: `${origin}${seo.canonicalPath}` }] })
</script>

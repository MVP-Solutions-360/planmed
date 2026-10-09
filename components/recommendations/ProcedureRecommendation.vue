<template>
  <RecommendationsRecommendationShell
    v-if="view"
    :eyebrow="meta.eyebrow"
    :title="view.title"
    :subtitle="view.page ? undefined : meta.subtitle"
    :html="view.html"
    :video-url="view.page?.videoUrl"
    :image="view.page?.image"
  />
</template>

<script setup lang="ts">
import { useSeoMeta, useRoute, createError, useAsyncData } from '#imports'
import { publicProcedureService } from '~/services/PublicProcedureService'
import { publicRecommendationsService } from '~/services/PublicRecommendationsService'
import { isRichHtmlEmpty } from '~/utils/richText'
import { resolveRecommendation } from '~/utils/recommendationSource'
import { RECOMMENDATION_KINDS, type RecommendationKind } from '~/utils/recommendationKinds'

const props = defineProps<{ kind: RecommendationKind }>()
const meta = RECOMMENDATION_KINDS[props.kind]

const slug = useRoute().params.slug as string

// Procedimiento del Hub (SSR) y, si el Hub informa que una página vinculada y publicada sustituye el texto histórico, esa página.
// Regla (docs/maestra/04 §2.1): pagina → la página; pagina_oculta → 404 SIN usar el histórico; historico → el texto del
// procedimiento; ninguna → 404. Solo lectura: nada se escribe ni se migra.
const { data, error } = await useAsyncData(`procedure-${props.kind}-${slug}`, async () => {
  const procedure = await publicProcedureService.getProcedureBySlug(slug)
  if (!procedure) return null
  const source = resolveRecommendation(procedure as any, props.kind, meta.field, isRichHtmlEmpty)
  const page = source.type === 'page' ? await publicRecommendationsService.getPage(source.slug) : null
  return { procedure, source, page }
})

// Hub caído o con error NO es "página inexistente": se responde 503 (reintentable), no un 404 engañoso.
if (error.value) {
  throw createError({ statusCode: 503, statusMessage: 'No fue posible cargar la página. Intenta nuevamente.', fatal: true })
}

const view = computed(() => {
  const d = data.value
  if (!d) return null
  if (d.source.type === 'page' && d.page) return { title: d.page.title, html: d.page.content, page: d.page }
  if (d.source.type === 'historic') return { title: meta.title(d.procedure.name), html: d.source.html, page: null }
  return null
})

if (!view.value) {
  throw createError({ statusCode: 404, statusMessage: 'Página no encontrada', fatal: true })
}

useSeoMeta({ title: `${view.value.title} | Planmed`, description: meta.subtitle })
</script>

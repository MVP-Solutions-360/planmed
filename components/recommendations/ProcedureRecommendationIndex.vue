<template>
  <div class="bg-[#fcf9f8] min-h-screen font-sans">
    <header class="relative overflow-hidden bg-gradient-to-br from-[#0C2619] via-[#12392a] to-[#1b5a3f] text-white pt-32 md:pt-40 pb-20 md:pb-28">
      <div class="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-[#D3A76A]/15 blur-3xl"></div>
      <div class="relative max-w-[900px] mx-auto px-6 text-center">
        <p class="inline-block px-4 py-1.5 rounded-full bg-[#D3A76A]/20 text-[#D3A76A] text-[11px] font-bold tracking-[0.2em] uppercase mb-6">Recomendaciones</p>
        <h1 class="font-serif text-[34px] md:text-[54px] font-medium leading-[1.08] tracking-[-0.02em]">{{ meta.indexTitle }}</h1>
        <p class="mt-6 text-white/70 font-light text-lg max-w-2xl mx-auto leading-relaxed">{{ meta.subtitle }}</p>
      </div>
    </header>

    <main class="max-w-[1100px] mx-auto px-6 py-16 md:py-20">
      <CommonHubUnavailable v-if="error" :retrying="status === 'pending'" @retry="refresh()" />
      <div v-else-if="items.length || extras.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink
          v-for="p in items" :key="p.slug" :to="`/recomendaciones/${kind}/${p.slug}`"
          class="group bg-white border border-[#e5e2e1] rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          <div class="aspect-[16/9] bg-gray-100 overflow-hidden">
            <img v-if="p.image" :src="p.image" :alt="p.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          </div>
          <div class="p-6">
            <h2 class="font-serif text-xl text-black mb-3">{{ meta.itemLabel(p.name) }}</h2>
            <span class="inline-flex items-center text-[11px] font-bold tracking-[0.15em] uppercase text-[#0C2619]">
              Ver recomendaciones
              <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </span>
          </div>
        </NuxtLink>
        <NuxtLink
          v-for="x in extras" :key="x.slug" :to="`/recomendaciones/${x.slug}`"
          class="group bg-white border border-[#e5e2e1] rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          <div class="aspect-[16/9] bg-gradient-to-br from-[#0C2619] to-[#1b5a3f] overflow-hidden">
            <img v-if="x.image" :src="x.image" :alt="x.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          </div>
          <div class="p-6">
            <h2 class="font-serif text-xl text-black mb-3">{{ x.menuLabel }}</h2>
            <span class="inline-flex items-center text-[11px] font-bold tracking-[0.15em] uppercase text-[#0C2619]">
              Ver recomendaciones
              <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </span>
          </div>
        </NuxtLink>
      </div>
      <p v-else-if="loaded" class="text-center text-gray-500 font-light py-16 border border-dashed border-gray-300">
        Pronto publicaremos estas recomendaciones.
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useSeoMeta, useAsyncData } from '#imports'
import { publicProcedureService } from '~/services/PublicProcedureService'
import { publicRecommendationsService } from '~/services/PublicRecommendationsService'
import { RECOMMENDATION_KINDS, type RecommendationKind } from '~/utils/recommendationKinds'
import type { Procedure } from '~/types/procedure'
import type { RecommendationPage } from '~/types/recommendations'
import { treeSubtopicSlugs } from '#shared/utils/recommendationTree'

const props = defineProps<{ kind: RecommendationKind }>()
const meta = RECOMMENDATION_KINDS[props.kind]

// Wellezy Hub, resuelto en el servidor (SSR): procedimientos con este texto (indicador de la lista pública, sin pedir cada
// detalle) y páginas publicadas de este grupo.
const { data, error, refresh, status } = await useAsyncData(`recommendation-index-${props.kind}`, async () => {
  const [all, pages, topics] = await Promise.all([
    publicProcedureService.getProcedures(),
    publicRecommendationsService.getPages(),
    // El árbol solo sirve para no repetir aquí lo que ya vive dentro de su tema: si falla no se pierde este listado.
    publicRecommendationsService.getTopics().catch(() => [])
  ])
  const inTree = treeSubtopicSlugs(topics)
  return {
    items: all.filter(p => p[meta.flag] === true),
    // Las páginas vinculadas a un procedimiento ya salen como la tarjeta de ese procedimiento; los subtemas del árbol, dentro de su tema.
    extras: pages.filter(p => p.group === props.kind && !p.procedureSlug && !inTree.has(p.slug))
  }
}, { default: () => ({ items: [] as Procedure[], extras: [] as RecommendationPage[] }) })

useServiceUnavailable(error)

const items = computed(() => data.value.items)
const extras = computed(() => data.value.extras)
const loaded = true

useSeoMeta({ title: `${meta.indexTitle} | Planmed`, description: meta.subtitle })
</script>

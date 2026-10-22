<template>
  <!-- Secciones de contenido de la noticia, debajo del cuerpo, como tarjetas del mismo estilo que Recomendaciones. Sin secciones no se pinta nada (noticias antiguas). -->
  <div v-if="visibleSections.length" class="space-y-8" data-testid="news-sections">
    <section
      v-for="(s, i) in visibleSections" :key="`${s.orden}-${i}`"
      class="bg-white border border-[#e5e2e1] shadow-xl shadow-black/5 rounded-2xl p-6 md:p-12"
      data-testid="news-section" :data-layout="s.layout"
    >
      <h2 v-if="s.title" class="reco-title font-serif text-2xl md:text-[1.75rem] font-medium leading-tight text-[#0C2619] mb-6 break-words">{{ s.title }}</h2>

      <!-- Dos columnas desde md (izquierda → derecha); en móvil se apilan en el mismo orden de lectura. Cada columna apila sus bloques. -->
      <div v-if="s.layout === 'two_columns'" class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 md:items-start">
        <NewsBlocks :blocks="s.blocks.left" data-testid="news-section-left" />
        <NewsBlocks :blocks="s.blocks.right" data-testid="news-section-right" />
      </div>
      <NewsBlocks v-else :blocks="s.blocks.main" data-testid="news-section-single" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { visibleNewsSections } from '#shared/utils/newsSections'
import type { NewsSection } from '~/types/news'

const props = defineProps<{ sections?: NewsSection[] | null }>()

// Hub ya entrega las secciones visibles y ordenadas; aquí solo se descarta lo que no tiene nada que mostrar en su distribución.
const visibleSections = computed(() => visibleNewsSections(props.sections))
</script>

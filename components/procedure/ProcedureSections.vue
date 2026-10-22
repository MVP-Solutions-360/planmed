<template>
  <!-- Secciones de contenido de la línea, debajo del contenido del procedimiento, como tarjetas del mismo estilo que Recomendaciones. Sin secciones no se pinta nada (procedimientos históricos). -->
  <div v-if="visibleSections.length" class="space-y-8" data-testid="procedure-sections">
    <section
      v-for="(s, i) in visibleSections" :key="`${s.orden}-${i}`"
      class="bg-white border border-[#e5e2e1] shadow-xl shadow-black/5 rounded-2xl p-6 md:p-12"
      data-testid="procedure-section" :data-layout="s.image ? s.layout : 'stacked'"
    >
      <h2 v-if="s.title" class="reco-title font-serif text-2xl md:text-[1.75rem] font-medium leading-tight text-[#0C2619] mb-6 break-words">{{ s.title }}</h2>

      <!-- Con imagen y texto: dos columnas desde md (la imagen a la izquierda o a la derecha); en móvil, la imagen va primero y apilada. -->
      <div v-if="s.image && hasText(s.content)" class="md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-10 md:items-start">
        <img
          :src="s.image.url"
          :alt="s.title || procedureName"
          loading="lazy"
          class="w-full h-auto rounded-xl object-contain shadow-lg mb-6 md:mb-0"
          :class="s.layout === 'media_right' ? 'md:order-2' : ''"
        />
        <CommonRichContent :html="s.content" class="reco-body" />
      </div>

      <!-- Solo imagen -->
      <img v-else-if="s.image" :src="s.image.url" :alt="s.title || procedureName" loading="lazy" class="w-full max-w-3xl h-auto rounded-xl object-contain shadow-lg" />

      <!-- Solo texto: una columna, sin hueco reservado para la imagen -->
      <CommonRichContent v-else-if="hasText(s.content)" :html="s.content" class="reco-body" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { hasText } from '#shared/utils/recommendationTree'
import type { ProcedureSectionPublic } from '~/types/procedureSection'

const props = defineProps<{ sections?: ProcedureSectionPublic[] | null, procedureName: string }>()

// Hub ya entrega las secciones de la línea, activas y ordenadas; aquí solo se descarta lo que no tiene nada que mostrar.
const visibleSections = computed(() => (props.sections ?? []).filter(s => !!s.title || hasText(s.content) || !!s.image))
</script>

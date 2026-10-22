<template>
  <!-- Secciones de contenido de la línea, debajo del contenido del procedimiento, como tarjetas del mismo estilo que Recomendaciones. Sin secciones no se pinta nada (procedimientos históricos). -->
  <div v-if="visibleSections.length" class="space-y-8" data-testid="procedure-sections">
    <section
      v-for="(s, i) in visibleSections" :key="`${s.orden}-${i}`"
      class="bg-white border border-[#e5e2e1] shadow-xl shadow-black/5 rounded-2xl p-6 md:p-12"
      data-testid="procedure-section" :data-layout="s.columnLayout"
    >
      <h2 v-if="s.title" class="reco-title font-serif text-2xl md:text-[1.75rem] font-medium leading-tight text-[#0C2619] mb-6 break-words">{{ s.title }}</h2>

      <!-- Dos columnas desde md (izquierda → derecha); en móvil se apilan en el mismo orden de lectura. Cada columna apila sus bloques
           (texto, imagen, YouTube o Instagram). Las secciones del formato anterior llegan ya como bloques (imagen + texto en el orden de su posición). -->
      <div v-if="s.columnLayout === 'two_columns'" class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 md:items-start">
        <ContentBlocks :blocks="s.blocks.left" data-testid="procedure-section-left" />
        <ContentBlocks :blocks="s.blocks.right" data-testid="procedure-section-right" />
      </div>
      <ContentBlocks v-else :blocks="s.blocks.main" data-testid="procedure-section-single" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { countBlocks } from '#shared/utils/contentBlocks'
import type { ProcedureSectionPublic } from '~/types/procedureSection'

const props = defineProps<{ sections?: ProcedureSectionPublic[] | null, procedureName: string }>()

// Hub ya entrega las secciones de la línea, activas y ordenadas; aquí solo se descarta lo que no tiene nada que mostrar en su distribución activa.
const visibleSections = computed(() => (props.sections ?? []).filter(s => !!s.title || countBlocks(s.blocks, s.columnLayout) > 0))
</script>

<template>
  <!--
    Secciones de un subtema de recomendaciones. Cada tipo tiene su presentación y NO se asume que comparta campos con los demás:
      description / custom → tarjeta con título, texto, imagen o vídeo y botón opcional
      recommendations      → tarjeta con texto introductorio (si lo hay) y recomendaciones individuales (si las hay)
      callout              → bloque destacado con texto y botón opcional (p. ej. financiación)
      contact              → bloque de contacto con texto y botón opcional
    Todo el HTML pasa por CommonRichContent (lista blanca). Los botones solo existen con texto y un destino válido (ya filtrado al
    mapear el contrato): sin botón no se reserva espacio.
  -->
  <section
    v-for="(section, i) in visible" :key="i"
    :data-section-type="section.type"
    :class="shellClass(section.type)"
  >
    <!-- Callout: bloque oscuro de la identidad de Planmed -->
    <template v-if="section.type === 'callout'">
      <div class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#D3A76A]/20 blur-3xl pointer-events-none"></div>
      <div class="relative">
        <h2 v-if="section.title" class="font-serif text-2xl md:text-3xl mb-4 break-words">{{ section.title }}</h2>
        <p v-if="section.subtitle" class="text-white/70 font-light mb-4">{{ section.subtitle }}</p>
        <!-- Con bloques: una o dos columnas, cada una apila texto, imágenes, YouTube e Instagram (texto claro sobre el fondo oscuro). -->
        <template v-if="section.blocksMode">
          <div v-if="section.columnLayout === 'two_columns'" class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 md:items-start" data-testid="section-columns">
            <ContentBlocks :blocks="section.blocks.left" tone="light" />
            <ContentBlocks :blocks="section.blocks.right" tone="light" />
          </div>
          <ContentBlocks v-else :blocks="section.blocks.main" tone="light" />
        </template>
        <template v-else>
          <CommonRichContent v-if="has(section.content)" :html="section.content" class="reco-callout-body" />
          <RecommendationsSectionMedia v-if="section.image || section.video" :section="section" class="mt-6" />
        </template>
        <div v-if="section.cta" class="mt-8">
          <RecommendationsSectionCta :cta="section.cta" variant="light" />
        </div>
      </div>
    </template>

    <!-- Resto de tipos: tarjeta blanca -->
    <template v-else>
      <header v-if="section.title || section.subtitle" class="mb-6">
        <h2 v-if="section.title" class="reco-section-title font-serif text-2xl md:text-[1.75rem] font-medium leading-tight text-[#0C2619] break-words">{{ section.title }}</h2>
        <p v-if="section.subtitle" class="mt-3 text-[#4c4546] font-light">{{ section.subtitle }}</p>
      </header>

      <!-- Con bloques: una o dos columnas desde md (izquierda → derecha; apiladas en móvil); cada una apila texto, imágenes, YouTube e Instagram. -->
      <template v-if="section.blocksMode">
        <div v-if="section.columnLayout === 'two_columns'" class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 md:items-start" data-testid="section-columns">
          <ContentBlocks :blocks="section.blocks.left" />
          <ContentBlocks :blocks="section.blocks.right" />
        </div>
        <ContentBlocks v-else :blocks="section.blocks.main" />
      </template>

      <!-- Formato anterior: texto con imagen/vídeo; la distribución la define el Hub (columna única, imagen a la izquierda o a la derecha). -->
      <div
        v-else-if="section.image || section.video"
        :class="section.layout !== 'stacked' && has(section.content) ? 'md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-10 md:items-start' : ''"
      >
        <RecommendationsSectionMedia
          :section="section"
          :class="[section.layout === 'media_right' ? 'md:order-2' : '', has(section.content) || section.items.length ? 'mb-6 md:mb-0' : '']"
        />
        <CommonRichContent v-if="has(section.content)" :html="section.content" class="reco-body" />
      </div>
      <CommonRichContent v-else-if="has(section.content)" :html="section.content" class="reco-body" />

      <!-- Recomendaciones individuales: solo si el Hub entrega registros (si la lista vive en `content`, ya se mostró arriba) -->
      <ul v-if="section.items.length" class="reco-items" :class="has(section.content) || section.image || section.video || section.blocksMode ? 'mt-8' : ''">
        <li v-for="(item, j) in section.items" :key="item.slug || j">
          <strong v-if="item.title" class="reco-item-title">{{ item.title }}</strong>
          <CommonRichContent v-if="has(item.content)" :html="item.content" class="reco-item-body" />
        </li>
      </ul>

      <div v-if="section.cta" class="mt-8">
        <RecommendationsSectionCta :cta="section.cta" :variant="section.type === 'contact' ? 'gold' : 'dark'" />
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { hasText, sectionParts, type TreeSection } from '#shared/utils/recommendationTree'

const props = defineProps<{ sections: TreeSection[] }>()

const has = hasText
// Una sección sin nada que mostrar (sin texto, recomendaciones, imagen, vídeo ni botón) no genera una tarjeta vacía.
const visible = computed(() => props.sections.filter(s => !sectionParts(s).isEmpty))

function shellClass(type: TreeSection['type']) {
  if (type === 'callout') return 'relative overflow-hidden rounded-2xl bg-[#0C2619] text-white p-8 md:p-12'
  if (type === 'contact') return 'bg-white border border-[#D3A76A]/50 shadow-xl shadow-black/5 rounded-2xl p-6 md:p-12'
  return 'bg-white border border-[#e5e2e1] shadow-xl shadow-black/5 rounded-2xl p-6 md:p-12'
}
</script>

<style>
.reco-section-title { padding-left: 1rem; border-left: 4px solid #D3A76A; }

.reco-callout-body { color: rgba(255, 255, 255, .8); font-weight: 300; font-size: 1.0625rem; line-height: 1.75; }
.reco-callout-body p { margin: 0 0 1em; }
.reco-callout-body a { color: #D3A76A; text-decoration: underline; text-underline-offset: 3px; }
.reco-callout-body strong { color: #fff; font-weight: 600; }
.reco-callout-body > :last-child { margin-bottom: 0; }

.reco-items { list-style: none; padding: 0; margin: 0; display: grid; gap: .6rem; counter-reset: recoitem; }
.reco-items > li {
  position: relative; padding: .85rem 1rem .85rem 3.25rem; background: #f7faf8; border: 1px solid #e3ede7; border-radius: .75rem; color: #4c4546;
  font-weight: 300; line-height: 1.7; overflow-wrap: anywhere;
}
.reco-items > li::before {
  content: ''; position: absolute; left: 1rem; top: 1.05rem; width: 1.5rem; height: 1.5rem; border-radius: 9999px; background: #0C2619 center / .9rem no-repeat;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23D3A76A' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 13l4 4L19 7'/%3E%3C/svg%3E");
}
.reco-item-title { display: block; font-weight: 600; color: #0C2619; }
.reco-item-body p { margin: 0; }
.reco-item-body p + p { margin-top: .5em; }
</style>

<template>
  <!-- Bloques apilados de una columna: texto, imagen, video de YouTube o post de Instagram. El HTML pasa por CommonRichContent (lista blanca); los
       videos/posts solo llegan con la URL canónica ya validada (host en lista blanca + identificador), nunca con HTML libre. -->
  <div class="space-y-6 min-w-0" data-testid="news-blocks">
    <template v-for="(b, i) in blocks" :key="i">
      <CommonRichContent v-if="b.type === 'text'" :html="b.html" :class="tone === 'light' ? 'reco-callout-body' : 'reco-body'" data-block="text" />
      <img v-else-if="b.type === 'image'" :src="b.url" :alt="b.alt" loading="lazy" class="w-full h-auto rounded-xl object-contain shadow-lg" data-block="image" />
      <NewsYouTubeEmbed v-else-if="b.type === 'youtube'" :url="b.url" class="!my-0" data-block="youtube" />
      <NewsInstagramEmbed v-else-if="b.type === 'instagram'" :url="b.url" class="!my-0" data-block="instagram" />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { NewsBlock } from '~/types/news'

// `tone="light"`: texto claro sobre fondo oscuro (bloque destacado de Recomendaciones).
withDefaults(defineProps<{ blocks: NewsBlock[], tone?: 'default' | 'light' }>(), { tone: 'default' })
</script>

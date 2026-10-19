<template>
  <!-- Imagen y/o vídeo de una sección. Las URLs ya fueron validadas al mapear el contrato (imagen http/https; vídeo solo YouTube). -->
  <div class="space-y-4 min-w-0">
    <img v-if="section.image" :src="section.image.url" :alt="section.image.alt || section.title" loading="lazy" class="w-full rounded-xl object-cover shadow-lg" />
    <div v-if="section.video" class="rounded-xl overflow-hidden [&>div]:my-0">
      <NewsYouTubeEmbed :url="section.video.embedUrl" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TreeSection } from '#shared/utils/recommendationTree'

defineProps<{ section: TreeSection }>()
</script>

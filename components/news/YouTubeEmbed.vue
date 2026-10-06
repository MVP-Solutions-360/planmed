<template>
  <div class="my-8">
    <div class="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
      <iframe
        :src="embedUrl"
        class="absolute inset-0 w-full h-full"
        title="YouTube video player"
        frameborder="0"
        referrerpolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  url: string
}>()

const embedUrl = computed(() => {
  if (props.url.includes('/embed/')) return props.url;
  try {
    const urlObj = new URL(props.url)
    if (urlObj.hostname.includes('youtube.com')) {
      const v = urlObj.searchParams.get('v')
      if (v) return 'https://www.youtube.com/embed/' + v
    } else if (urlObj.hostname.includes('youtu.be')) {
      const v = urlObj.pathname.slice(1)
      if (v) return 'https://www.youtube.com/embed/' + v
    }
    if (urlObj.hostname.includes('youtube.com')) {
      const m = urlObj.pathname.match(/^\/(?:shorts|live)\/([\w-]+)/)
      if (m) return 'https://www.youtube.com/embed/' + m[1]
    }
  } catch (e) {}
  return props.url;
})
</script>

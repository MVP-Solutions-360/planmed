<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTracking } from '~/composables/useTracking'

const route = useRoute()
const { trackPageView } = useTracking()

useHead({
  htmlAttrs: {
    lang: 'es'
  },
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..700;1,400..700&family=Inter:wght@400;500;600;700&display=swap' }
  ]
})

watch(() => route.fullPath, (newPath) => {
  if (import.meta.client) {
    setTimeout(() => {
      trackPageView(newPath, document.title || 'Planmed')
    }, 50)
  }
}, { immediate: true })
</script>

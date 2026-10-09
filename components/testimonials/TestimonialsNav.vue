<template>
  <div class="flex flex-wrap justify-center gap-3 mb-12">
    <NuxtLink
      v-for="item in visibleItems"
      :key="item.to"
      :to="item.to"
      class="px-5 py-2.5 text-[11px] font-bold tracking-[0.15em] uppercase border border-[#0C2619] transition-colors"
      :class="$route.path === item.to ? 'bg-[#0C2619] text-white' : 'text-[#0C2619] hover:bg-[#0C2619]/5'"
    >
      {{ item.label }}
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { publicTestimonialsService } from '~/services/PublicTestimonialsService'

// Misma clave que las páginas: una sola petición a Hub por navegación y el menú ya sale correcto en el servidor.
const { data } = await useAsyncData('patient-section', () => publicTestimonialsService.getContent())
const visibility = computed(() => data.value?.visibility ?? { videos: true, beforeAfter: true })

const items = [
  { to: '/testimonios', label: 'Videos', key: 'videos' },
  { to: '/testimonios/antes-y-despues', label: 'Antes y después', key: 'beforeAfter' },
  { to: '/testimonios/programa-de-referidos', label: 'Programa de referidos', key: null }
]
const visibleItems = computed(() => items.filter(i => !i.key || visibility.value[i.key as 'videos' | 'beforeAfter']))
</script>

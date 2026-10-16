<template>
  <!-- Redes de Planmed + acceso al simulador. Se usa al final de «Videos» y de «Antes y después». -->
  <section class="mt-14 text-center">
    <p class="text-[11px] font-bold tracking-[0.15em] text-[#848484] uppercase mb-5">Conoce más testimonios en nuestras redes sociales</p>
    <div class="flex flex-wrap justify-center gap-3">
      <a v-for="s in socials" :key="s.label" :href="s.href" target="_blank" rel="noopener noreferrer"
        class="px-6 py-3 text-[11px] font-bold tracking-[0.15em] uppercase border border-[#0C2619] text-[#0C2619] hover:bg-[#0C2619] hover:text-white transition-colors">
        {{ s.label }}
      </a>
      <NuxtLink to="/financiacion#calculadora" class="px-6 py-3 text-[11px] font-bold tracking-[0.15em] uppercase bg-[#0C2619] text-white border border-[#0C2619] hover:bg-black transition-colors">
        Simular financiación
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFetch } from '#imports'
import { ABOUT_SOCIAL_NETWORKS, aboutDefaultContent, aboutPublicView, type AboutContent } from '#shared/utils/aboutContent'

// Redes de Planmed: las mismas de «Nosotros» (editables en el panel). Si el contenido no se puede leer, se usan las oficiales por defecto.
const SOCIAL_LABELS = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok' } as const
const { data: about } = await useFetch<AboutContent>('/api/public/about', { key: 'about-page', default: () => aboutPublicView(aboutDefaultContent()) })
const socials = computed(() => ABOUT_SOCIAL_NETWORKS
  .map(n => ({ label: SOCIAL_LABELS[n], href: (about.value ?? aboutPublicView(aboutDefaultContent())).contact.socials[n] }))
  .filter(s => !!s.href))
</script>

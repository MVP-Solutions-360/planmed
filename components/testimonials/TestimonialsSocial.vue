<template>
  <!-- Redes de Planmed + acceso al simulador. Se usa al final de «Videos» y de «Antes y después». -->
  <section class="mt-20 bg-[#0C2619] text-white px-6 py-12 md:px-14 md:py-16 text-center">
    <p class="text-[11px] font-bold tracking-[0.15em] text-[#D3A76A] uppercase mb-4">Redes sociales</p>
    <h2 class="font-serif text-2xl md:text-4xl font-medium leading-tight max-w-2xl mx-auto mb-8">Conoce más testimonios en nuestras redes</h2>
    <div class="flex flex-wrap justify-center gap-3">
      <a v-for="s in socials" :key="s.label" :href="s.href" target="_blank" rel="noopener noreferrer"
        class="px-6 py-3 text-[11px] font-bold tracking-[0.15em] uppercase border border-white/40 text-white hover:bg-white hover:text-[#0C2619] transition-colors">
        {{ s.label }}
      </a>
      <NuxtLink to="/financiacion#calculadora" class="px-6 py-3 text-[11px] font-bold tracking-[0.15em] uppercase bg-[#D3A76A] text-[#0C2619] border border-[#D3A76A] hover:bg-white hover:border-white transition-colors">
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

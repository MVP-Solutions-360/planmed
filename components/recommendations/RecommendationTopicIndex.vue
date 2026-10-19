<template>
  <!-- Portada de un tema principal de recomendaciones: lista de sus subtemas publicados. Mismo diseño que los índices de cuidados/revisión. -->
  <div class="bg-[#fcf9f8] min-h-screen font-sans">
    <header class="relative overflow-hidden bg-gradient-to-br from-[#0C2619] via-[#12392a] to-[#1b5a3f] text-white pt-32 md:pt-40 pb-20 md:pb-28">
      <div class="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-[#D3A76A]/15 blur-3xl"></div>
      <div class="relative max-w-[900px] mx-auto px-6 text-center">
        <p class="inline-block px-4 py-1.5 rounded-full bg-[#D3A76A]/20 text-[#D3A76A] text-[11px] font-bold tracking-[0.2em] uppercase mb-6">Recomendaciones</p>
        <h1 class="font-serif text-[34px] md:text-[54px] font-medium leading-[1.08] tracking-[-0.02em] break-words">{{ topic.title }}</h1>
      </div>
    </header>

    <main class="max-w-[1100px] mx-auto px-6 py-16 md:py-20">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink
          v-for="sub in topic.subtopics" :key="sub.slug" :to="subtopicPath(topic.slug, sub.slug)"
          class="group bg-white border border-[#e5e2e1] rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          <div class="aspect-[16/9] bg-gradient-to-br from-[#0C2619] to-[#1b5a3f]"></div>
          <div class="p-6">
            <h2 class="font-serif text-xl text-black mb-3 break-words">{{ sub.menuLabel }}</h2>
            <span class="inline-flex items-center text-[11px] font-bold tracking-[0.15em] uppercase text-[#0C2619]">
              Ver recomendaciones
              <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </span>
          </div>
        </NuxtLink>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { subtopicPath, type TreeTopic } from '#shared/utils/recommendationTree'

defineProps<{ topic: TreeTopic }>()
</script>

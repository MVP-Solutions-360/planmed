<template>
  <div class="bg-[#fcf9f8] min-h-screen font-sans selection:bg-[#0C2619] selection:text-white pt-24 md:pt-32 pb-24">
    <div class="max-w-[1000px] mx-auto px-6">
      
      <!-- HERO EDITORIAL -->
      <div class="mb-24 text-center md:text-left border-t border-black pt-8">
        <p class="text-[11px] font-bold tracking-[0.15em] text-[#848484] uppercase mb-4 flex items-center justify-center md:justify-start gap-3">
          <span class="w-2 h-2 rounded-full bg-[#0C2619]"></span>
          RECURSOS PLANMED
        </p>
        <h1 class="font-serif text-[40px] md:text-[56px] lg:text-[72px] font-medium leading-[1.05] tracking-[-0.02em] text-black uppercase max-w-4xl">
          INFORMACIÓN Y DOCUMENTOS<br/>
          IMPORTANTES PARA TU PROCESO.
        </h1>
      </div>

      <!-- DOCUMENTOS PENDIENTES -->
      <div class="mb-24">
        <div v-if="documents.length === 0" class="border border-[#e5e2e1] p-12 text-center bg-white">
          <p class="text-[14px] text-[#4c4546]">Próximamente encontrarás aquí los documentos y requisitos oficiales para tu proceso.</p>
        </div>
        <div v-else class="flex flex-col gap-4">
          <!-- Estructura para cuando existan documentos -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useSeoMeta } from '#imports'
import { documents } from '~/data/resources'

useSeoMeta({
  title: 'Recursos | Planmed',
  description: 'Documentos e información importante para tu proceso en Planmed.'
})
</script>

<template>
  <div class="bg-[#fcf9f8] min-h-screen font-sans selection:bg-[#0C2619] selection:text-white pt-6 md:pt-10 pb-24">
    <div class="max-w-[1200px] mx-auto px-6">
      <CommonPageHero
        eyebrow="RECURSOS PLANMED"
        :lines="['DOCUMENTOS', 'Y RECURSOS.']"
        lead="Información y documentos importantes para tu proceso."
        :facts="[]"
      />

      <ul class="flex flex-col gap-4" data-testid="resource-documents" aria-label="Documentos legales">
        <li
          v-for="doc in documents"
          :key="doc.slug"
          class="bg-white border border-[#e5e2e1] border-l-[3px] border-l-[#D3A76A] p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:shadow-md transition-shadow"
          :data-testid="`resource-${doc.slug}`"
        >
          <div class="min-w-0">
            <p class="text-[10px] font-bold tracking-[0.2em] text-[#8a6a35] uppercase mb-1">Documento PDF</p>
            <h2 class="font-serif text-lg md:text-xl font-medium text-[#0C2619] leading-snug break-words">{{ doc.title }}</h2>
            <p class="mt-1 text-sm text-gray-600 font-light break-words">{{ doc.description }}</p>
          </div>
          <div class="flex flex-col sm:flex-row gap-3 shrink-0">
            <NuxtLink
              :to="`/recursos/${doc.slug}`"
              class="inline-flex items-center justify-center min-h-[48px] bg-[#0C2619] text-white border-2 border-[#0C2619] px-6 py-3 text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-transparent hover:text-[#0C2619] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D3A76A]"
              :aria-label="`Leer ${doc.title}`"
            >Leer documento</NuxtLink>
            <a
              :href="doc.file"
              :download="`${doc.slug}.pdf`"
              class="inline-flex items-center justify-center min-h-[48px] border-2 border-[#0C2619] text-[#0C2619] px-6 py-3 text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-[#0C2619] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D3A76A]"
              :aria-label="`Descargar ${doc.title} (PDF)`"
            >Descargar PDF</a>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSeoMeta } from '#imports'
import { resourceDocuments as documents } from '~/data/resourceDocuments'

useSeoMeta({
  title: 'Recursos | Planmed',
  description: 'Documentos e información importante para tu proceso en Planmed.'
})
</script>

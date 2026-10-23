<template>
  <div class="bg-[#fcf9f8] min-h-screen font-sans selection:bg-[#0C2619] selection:text-white pt-6 md:pt-10 pb-24">
    <div class="max-w-[1200px] mx-auto px-6">
      
      <CommonPageHero
        eyebrow="RECURSOS PLANMED"
        :lines="['DOCUMENTOS', 'Y RECURSOS.']"
        lead="Información y documentos importantes para tu proceso."
        :facts="[]"
      />

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

<template>
  <div class="bg-white min-h-screen text-black font-sans selection:bg-[#0C2619] selection:text-white pt-24 md:pt-32 pb-24">
    
    <div class="max-w-[1200px] mx-auto px-6">
      
      <!-- Navegación de regreso -->
      <NuxtLink to="/procedimientos" class="inline-flex items-center gap-3 text-[11px] font-bold tracking-[0.15em] text-[#848484] hover:text-black transition-colors uppercase mb-12">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        VOLVER AL PORTAFOLIO
      </NuxtLink>

      <div v-if="procedure" class="flex flex-col lg:flex-row gap-16 lg:gap-24">
        
        <!-- Columna Izquierda: Información Editorial -->
        <div class="w-full lg:w-1/2 flex flex-col items-start pt-4">
          <p class="text-[11px] font-bold tracking-[0.15em] text-[#0C2619] uppercase mb-4">
            {{ procedure.category || 'PROCEDIMIENTO' }}
          </p>
          <h1 class="font-serif text-[40px] md:text-[56px] lg:text-[72px] font-medium leading-[1.05] tracking-[-0.02em] text-black mb-8 uppercase">
            {{ procedure.name }}
          </h1>
          
          <div class="space-y-6 text-[#4c4546] font-light leading-relaxed text-lg md:text-xl">
            <p>{{ procedure.shortDescription }}</p>
            <CommonRichContent v-if="procedure.whatIsIt" :html="procedure.whatIsIt" class="text-base text-gray-500" />
          </div>

          <div v-if="procedure.perfil_paciente?.condiciones_medicas_compatibles" class="mt-10 w-full">
            <h2 class="text-[11px] font-bold tracking-[0.15em] text-[#0C2619] uppercase mb-3">Condiciones médicas compatibles</h2>
            <CommonRichContent :html="procedure.perfil_paciente.condiciones_medicas_compatibles" class="text-base text-gray-500" />
          </div>
          
          <!-- Separador -->
          <hr class="w-12 border-black my-12" />
          
          <!-- Información sobre Financiación -->
          <div class="bg-[#fcf9f8] p-8 md:p-10 border border-[#e5e2e1] w-full">
            <h3 class="font-serif text-2xl font-medium mb-4 text-black">Inicia tu plan.</h3>
            <p class="text-sm text-[#4c4546] mb-8 leading-relaxed">
              La viabilidad de esta intervención médica será determinada por un profesional certificado. Nuestro rol es brindarte la tranquilidad financiera para que puedas enfocarte en tu bienestar.
            </p>
            <NuxtLink 
              :to="{ path: '/financiacion', query: { procedureId: procedure.id }, hash: '#calculadora' }" 
              class="w-full sm:w-auto inline-flex justify-center bg-[#0C2619] text-white px-8 py-4 font-bold text-[11px] tracking-[0.15em] uppercase hover:bg-black transition-colors"
            >
              SIMULAR FINANCIACIÓN
            </NuxtLink>
          </div>
        </div>
        
        <!-- Columna Derecha: Imagen Principal -->
        <div class="w-full lg:w-1/2">
          <div class="relative w-full aspect-[3/4] overflow-hidden bg-gray-100 sticky top-32">
            <img 
              v-if="procedure.image" 
              :src="procedure.image" 
              :alt="procedure.name" 
              class="w-full h-full object-cover grayscale-[10%]"
            />
            <div v-else class="absolute inset-0 flex items-center justify-center text-[#848484] text-sm tracking-widest uppercase">
              IMAGEN EN PRODUCCIÓN
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSeoMeta, createError } from '#imports'
import { useAsyncData } from '#imports'
import { publicProcedureService } from '~/services/PublicProcedureService'

const route = useRoute()
const router = useRouter()

const { data: procedure, error } = await useAsyncData('procedure-' + route.params.slug, () => publicProcedureService.getProcedureBySlug(route.params.slug))

// Hub caído, timeout o error de servicio NO es "no existe": 503 reintentable. Solo un 404 de Hub (null) es 404.
if (error.value) {
  throw createError({
    statusCode: 503,
    statusMessage: 'No fue posible cargar la página. Intenta nuevamente.',
    fatal: true
  })
}

if (!procedure.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Procedimiento no encontrado',
    fatal: true
  })
}

// SEO
useSeoMeta({
  title: procedure.value.seo?.meta_title || `${procedure.value.name} | Planmed`,
  description: procedure.value.seo?.meta_description || procedure.value.shortDescription
})
</script>

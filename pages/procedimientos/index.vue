<template>
  <div class="bg-[#fcf9f8] min-h-screen font-sans selection:bg-[#0C2619] selection:text-white pt-24 md:pt-32 pb-24">
    <div class="max-w-[1200px] mx-auto px-6">
      
      <!-- HEADER EDITORIAL -->
      <div class="mb-16 md:mb-24 text-center md:text-left border-t border-black pt-8">
        <p class="text-[11px] font-bold tracking-[0.15em] text-[#848484] uppercase mb-4 flex items-center justify-center md:justify-start gap-3">
          <span class="w-2 h-2 rounded-full bg-[#0C2619]"></span>
          PORTAFOLIO MÉDICO
        </p>
        <h1 class="font-serif text-[40px] md:text-[56px] lg:text-[72px] font-medium leading-[1.05] tracking-[-0.02em] text-black uppercase max-w-4xl">
          NUESTROS<br/>
          PROCEDIMIENTOS.
        </h1>
        <p class="mt-8 text-lg text-gray-600 font-light max-w-2xl leading-relaxed mx-auto md:mx-0">
          Explora los tratamientos estéticos disponibles y descubre cómo podemos ayudarte a financiarlos sin comprometer tu estilo de vida.
        </p>
      </div>

      <!-- CATÁLOGO GRID -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 mb-24">
        
        <NuxtLink 
          v-for="proc in cirugias" 
          :key="proc.slug" 
          :to="`/procedimientos/${proc.slug}`" 
          class="group cursor-pointer flex flex-col h-full"
        >
          <!-- Contenedor Imagen -->
          <div class="relative w-full aspect-[4/5] overflow-hidden bg-gray-200 mb-6">
            <img 
              v-if="proc.image"
              :src="proc.image" 
              :alt="proc.name" 
              class="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 ease-out group-hover:scale-105"
            />
            <div v-else class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-sm">
              Sin imagen
            </div>
          </div>
          
          <!-- Contenido -->
          <div class="flex-grow flex flex-col">
            <div class="text-[10px] font-bold tracking-widest text-[#848484] uppercase mb-2">
              {{ proc.category || 'Procedimiento' }}
            </div>
            <h3 class="font-serif text-2xl lg:text-3xl font-medium text-black mb-3 group-hover:text-[#0C2619] transition-colors">
              {{ proc.name }}
            </h3>
            <p class="text-gray-600 text-sm leading-relaxed font-light mb-6 flex-grow">
              {{ proc.shortDescription }}
            </p>
            <div class="inline-flex items-center text-xs font-bold tracking-widest uppercase text-black group-hover:text-[#0C2619] transition-colors border-b border-transparent group-hover:border-[#0C2619] pb-1 self-start">
              Conocer más
            </div>
          </div>
        </NuxtLink>

      </div>

      <!-- CTA FINAL FINANCIACIÓN -->
      <div class="bg-[#0C2619] text-white rounded-none p-12 md:p-24 flex flex-col md:flex-row items-center justify-between gap-12">
        <div class="max-w-xl text-center md:text-left">
          <p class="text-[11px] font-bold tracking-[0.15em] text-white/60 uppercase mb-4">
            TU PRÓXIMA ETAPA
          </p>
          <h2 class="font-serif text-3xl md:text-5xl font-medium leading-[1.1] tracking-[-0.02em] mb-6">
            DISEÑA TU PLAN DE PAGO
          </h2>
          <p class="text-white/80 font-light leading-relaxed">
            ¿Ya sabes qué procedimiento deseas? Utiliza nuestro simulador para estructurar cuotas que se adapten a tu capacidad financiera.
          </p>
        </div>
        <NuxtLink to="/simulador" class="flex-shrink-0 bg-white text-[#0C2619] px-10 py-5 font-bold text-xs tracking-widest uppercase hover:bg-gray-100 transition-colors active:scale-95 text-center w-full md:w-auto">
          Ir al Simulador
        </NuxtLink>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSeoMeta, useHead } from '#imports'
import { useAsyncData } from '#imports'
import { publicProcedureService } from '~/services/PublicProcedureService'

const { data: cirugias } = await useAsyncData('procedures', () => publicProcedureService.getProcedures(), {
  default: () => []
})

useSeoMeta({
  title: 'Procedimientos | Planmed',
  description: 'Explora nuestro portafolio de procedimientos estéticos y descubre cómo financiarlos con Planmed.',
  ogTitle: 'Procedimientos | Planmed',
  ogDescription: 'Explora nuestro portafolio de procedimientos estéticos y descubre cómo financiarlos con Planmed.',
  ogImage: '/images/branding/logo_fondo_transparente.png',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterImage: '/images/branding/logo_fondo_transparente.png'
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://planmed.com/procedimientos' }
  ]
})
</script>

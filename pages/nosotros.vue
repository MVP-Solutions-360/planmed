<template>
  <div class="bg-white min-h-screen font-sans selection:bg-[#0C2619] selection:text-white pt-24 md:pt-32 pb-24">
    <div class="max-w-[1000px] mx-auto px-6">
      
      <!-- HERO INSTITUCIONAL (Tipográfico puro) -->
      <div class="mb-24 text-center md:text-left border-t border-black pt-8">
        <p class="text-[11px] font-bold tracking-[0.15em] text-[#848484] uppercase mb-4 flex items-center justify-center md:justify-start gap-3">
          <span class="w-2 h-2 rounded-full bg-[#0C2619]"></span>
          SOBRE PLANMED
        </p>
        <h1 class="font-serif text-[40px] md:text-[56px] lg:text-[72px] font-medium leading-[1.05] tracking-[-0.02em] text-black uppercase max-w-4xl mt-12 mb-8">
          EL ACCESO A TU<br/>
          BIENESTAR,<br/>
          SIMPLIFICADO.
        </h1>
      </div>

      <!-- SECCIONES DE CONTENIDO -->
      <div class="flex flex-col gap-20 md:gap-32 mb-32">
        <section 
          v-for="section in aboutData" 
          :key="section.id"
          class="flex flex-col md:flex-row items-start gap-8 md:gap-16 border-t border-gray-100 pt-12 md:pt-16"
        >
          <!-- Título de Sección -->
          <div class="w-full md:w-1/3 flex-shrink-0">
            <h2 class="font-serif text-2xl md:text-3xl font-medium text-black tracking-tight leading-snug">
              {{ section.title }}
            </h2>
          </div>
          
          <!-- Contenido de Sección -->
          <div class="w-full md:w-2/3 flex flex-col gap-6">
            <p 
              v-for="(paragraph, index) in section.content" 
              :key="index"
              class="text-gray-600 font-light text-lg md:text-xl leading-relaxed"
            >
              {{ paragraph }}
            </p>
          </div>
        </section>
      </div>

      <!-- CTA FINAL FINANCIACIÓN -->
      <div class="bg-[#0C2619] text-white rounded-none p-12 md:p-24 flex flex-col items-center text-center">
        <p class="text-[11px] font-bold tracking-[0.15em] text-white/60 uppercase mb-4">
          DA EL PRIMER PASO
        </p>
        <h2 class="font-serif text-3xl md:text-5xl font-medium leading-[1.1] tracking-[-0.02em] mb-6 max-w-2xl mx-auto">
          PLANIFICA TU PROCEDIMIENTO HOY.
        </h2>
        <p class="text-white/80 font-light leading-relaxed mb-12 max-w-xl mx-auto">
          Conoce tus opciones de cuotas y descubre cómo Planmed puede facilitar tu acceso.
        </p>
        <NuxtLink to="/simulador" class="bg-white text-[#0C2619] px-10 py-5 font-bold text-xs tracking-widest uppercase hover:bg-gray-100 transition-colors active:scale-95 w-full sm:w-auto">
          Ir al Simulador
        </NuxtLink>
      </div>

    </div>
  </div>
</template>

<script setup>
import { useSeoMeta, useHead } from '#imports'
import { aboutData } from '~/data/about'

useSeoMeta({
  title: 'Nosotros | Planmed',
  description: 'Conoce la filosofía de Planmed y cómo facilitamos el acceso a procedimientos estéticos a través de soluciones claras.',
  ogTitle: 'Nosotros | Planmed',
  ogDescription: 'Conoce la filosofía de Planmed y cómo facilitamos el acceso a procedimientos estéticos a través de soluciones claras.',
  ogImage: '/images/branding/logo_fondo_transparente.png',
  ogType: 'website'
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://planmed.com/nosotros' }
  ]
})
</script>

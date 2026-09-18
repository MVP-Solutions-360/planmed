<template>
  <div class="bg-[#fcf9f8] min-h-screen font-sans selection:bg-[#0C2619] selection:text-white pt-24 md:pt-32 pb-24">
    <div class="max-w-[1200px] mx-auto px-6">
      
      <!-- HEADER EDITORIAL -->
      <div class="mb-16 md:mb-24 text-center md:text-left border-t border-black pt-8">
        <p class="text-[11px] font-bold tracking-[0.15em] text-[#848484] uppercase mb-4 flex items-center justify-center md:justify-start gap-3">
          <span class="w-2 h-2 rounded-full bg-[#0C2619]"></span>
          ACTUALIDAD Y RECURSOS
        </p>
        <h1 class="font-serif text-[40px] md:text-[56px] lg:text-[72px] font-medium leading-[1.05] tracking-[-0.02em] text-black uppercase max-w-4xl">
          NOTICIAS<br/>
          PLANMED.
        </h1>
        <p class="mt-8 text-lg text-gray-600 font-light max-w-2xl leading-relaxed mx-auto md:mx-0">
          Descubre las últimas novedades, casos de éxito y requisitos para financiar tu cirugía plástica en Colombia.
        </p>
      </div>

      <!-- GRID DE NOTICIAS -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 mb-24">
        
        <NuxtLink 
          v-for="article in news" 
          :key="article.id" 
          :to="/noticias/ + article.slug" 
          class="group cursor-pointer flex flex-col h-full bg-white border border-[#e5e2e1] hover:shadow-xl transition-all duration-300"
        >
          <!-- Contenedor Imagen -->
          <div class="relative w-full aspect-[16/9] overflow-hidden bg-gray-100">
            <img 
              v-if="article.coverImage"
              :src="article.coverImage" 
              :alt="article.title" 
              class="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-700 ease-out group-hover:scale-105"
            />
          </div>
          
          <!-- Contenido -->
          <div class="flex-grow flex flex-col p-8">
            <div class="text-[10px] font-bold tracking-widest text-[#848484] uppercase mb-3">
              {{ new Date(article.publishedAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) }}
            </div>
            <h3 class="font-serif text-2xl font-medium text-black mb-4 group-hover:text-[#0C2619] transition-colors leading-snug">
              {{ article.title }}
            </h3>
            <p class="text-gray-600 text-sm leading-relaxed font-light mb-6 flex-grow">
              {{ article.excerpt }}
            </p>
            <div class="inline-flex items-center text-xs font-bold tracking-widest uppercase text-black group-hover:text-[#0C2619] transition-colors self-start">
              Leer más
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
          </div>
        </NuxtLink>

      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useSeoMeta, useAsyncData } from '#imports'
import { newsService } from '~/services/NewsService'

const { data: news } = await useAsyncData('news-list', async () => { const all = await newsService.getNews(); return all.filter(n => n.publishedAt !== null && n.publishedAt !== undefined) }, {
  default: () => []
})

useSeoMeta({
  title: 'Noticias | Planmed',
  description: 'Descubre las últimas novedades, casos de éxito y requisitos para financiar tu cirugía plástica en Colombia.',
  ogTitle: 'Noticias | Planmed',
  ogDescription: 'Descubre las últimas novedades, casos de éxito y requisitos para financiar tu cirugía plástica en Colombia.',
})
</script>

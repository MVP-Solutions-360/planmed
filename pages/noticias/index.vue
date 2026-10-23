<template>
  <div class="bg-[#fcf9f8] min-h-screen font-sans selection:bg-[#0C2619] selection:text-white pt-6 md:pt-10 pb-24">
    <div class="max-w-[1200px] mx-auto px-6">

      <CommonPageHero
        eyebrow="ACTUALIDAD Y RECURSOS"
        :lines="['NOTICIAS', 'PLANMED.']"
        lead="Descubre las últimas novedades, casos de éxito y requisitos para financiar tu cirugía plástica en Colombia."
        :facts="heroFacts"
      />

      <!-- Hub caído: aviso con reintento (no «sin noticias»). Lista vacía válida => cuadrícula vacía. -->
      <CommonHubUnavailable v-if="error" :retrying="status === 'pending'" @retry="refresh()" />

      <template v-else>
        <!-- DESTACADA: la noticia más reciente -->
        <NuxtLink
          v-if="featured"
          :to="/noticias/ + featured.slug"
          class="group grid lg:grid-cols-2 bg-white border border-[#e5e2e1] hover:shadow-xl transition-all duration-300 mb-12"
        >
          <div class="relative w-full aspect-[16/10] lg:aspect-auto lg:min-h-[380px] overflow-hidden bg-gray-100">
            <img
              v-if="featured.coverImage"
              :src="featured.coverImage"
              :alt="featured.title"
              class="absolute inset-0 w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-700 ease-out group-hover:scale-105"
            />
          </div>
          <div class="flex flex-col justify-center p-8 md:p-12">
            <p class="text-[10px] font-bold tracking-[0.2em] text-[#D3A76A] uppercase mb-4 flex items-center gap-3">
              <span class="w-8 h-px bg-[#D3A76A]"></span>
              Lo más reciente · {{ formatDate(featured.publishedAt) }}
            </p>
            <h2 class="font-serif text-3xl md:text-4xl font-medium text-black mb-5 group-hover:text-[#0C2619] transition-colors leading-tight">
              {{ featured.title }}
            </h2>
            <p class="text-gray-600 leading-relaxed font-light mb-8">
              {{ richHtmlToText(featured.excerpt) }}
            </p>
            <div class="inline-flex items-center text-xs font-bold tracking-widest uppercase text-black group-hover:text-[#0C2619] transition-colors self-start">
              Leer más
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
          </div>
        </NuxtLink>

        <!-- GRID DE NOTICIAS -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 mb-24">
          <NuxtLink
            v-for="article in rest"
            :key="article.id"
            :to="/noticias/ + article.slug"
            class="group cursor-pointer flex flex-col h-full bg-white border border-[#e5e2e1] border-t-4 border-t-[#D3A76A] hover:shadow-xl transition-all duration-300"
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
                {{ formatDate(article.publishedAt) }}
              </div>
              <h3 class="font-serif text-2xl font-medium text-black mb-4 group-hover:text-[#0C2619] transition-colors leading-snug">
                {{ article.title }}
              </h3>
              <p class="text-gray-600 text-sm leading-relaxed font-light mb-6 flex-grow">
                {{ richHtmlToText(article.excerpt) }}
              </p>
              <div class="inline-flex items-center text-xs font-bold tracking-widest uppercase text-black group-hover:text-[#0C2619] transition-colors self-start">
                Leer más
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>
            </div>
          </NuxtLink>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useSeoMeta, useAsyncData } from '#imports'
import { publicNewsService } from '~/services/PublicNewsService'
import { richHtmlToText } from '~/utils/richText'

// Fuente de verdad: Wellezy Hub (vía Nitro). Mismo resultado en SSR, navegación interna, recarga e incógnito.
const { data: news, error, refresh, status } = await useAsyncData('news-list', () => publicNewsService.getNews(), {
  default: () => []
})
useServiceUnavailable(error)

const formatDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : ''
const featured = computed(() => news.value[0])
const rest = computed(() => news.value.slice(1))
const heroFacts = computed(() => {
  const last = news.value[0]?.publishedAt
  return [
    { value: String(news.value.length), label: news.value.length === 1 ? 'Artículo publicado' : 'Artículos publicados' },
    ...(last ? [{ value: new Date(last).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' }).replace('.', ''), label: 'Última publicación' }] : [])
  ]
})

useSeoMeta({
  title: 'Noticias | Planmed',
  description: 'Descubre las últimas novedades, casos de éxito y requisitos para financiar tu cirugía plástica en Colombia.',
  ogTitle: 'Noticias | Planmed',
  ogDescription: 'Descubre las últimas novedades, casos de éxito y requisitos para financiar tu cirugía plástica en Colombia.',
})
</script>

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
        <!-- Página fuera de rango (p. ej. ?pagina=999): hay noticias pero no en esta página. -->
        <p v-if="total && !news.length" data-testid="news-out-of-range" class="text-center text-gray-500 font-light py-16 mb-12 border border-dashed border-[#e5e2e1] bg-white">
          Esta página no existe.
          <NuxtLink :to="pageTo(1)" class="font-bold text-black underline underline-offset-4">Ver las noticias más recientes</NuxtLink>
        </p>

        <!-- PAGINACIÓN -->
        <nav v-if="lastPage > 1" data-testid="news-pagination" aria-label="Paginación de noticias" class="-mt-12 mb-24 flex flex-col items-center gap-4">
          <ul class="flex flex-wrap items-center justify-center gap-2 text-sm font-bold">
            <li>
              <NuxtLink
                v-if="page > 1"
                :to="pageTo(page - 1)"
                rel="prev"
                class="inline-flex min-h-[44px] items-center px-4 border border-[#e5e2e1] bg-white text-black hover:bg-[#0C2619] hover:text-white transition-colors"
              >Anterior</NuxtLink>
            </li>
            <li v-for="(p, i) in pages" :key="`${p}-${i}`">
              <span v-if="p === 'gap'" class="inline-flex min-h-[44px] items-center px-2 text-gray-400" aria-hidden="true">…</span>
              <span
                v-else-if="p === page"
                aria-current="page"
                class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center border border-[#0C2619] bg-[#0C2619] text-white"
              >{{ p }}</span>
              <NuxtLink
                v-else
                :to="pageTo(p)"
                :aria-label="`Ir a la página ${p}`"
                class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center border border-[#e5e2e1] bg-white text-black hover:border-[#D3A76A] hover:text-[#0C2619] transition-colors"
              >{{ p }}</NuxtLink>
            </li>
            <li>
              <NuxtLink
                v-if="page < lastPage"
                :to="pageTo(page + 1)"
                rel="next"
                class="inline-flex min-h-[44px] items-center px-4 border border-[#e5e2e1] bg-white text-black hover:bg-[#0C2619] hover:text-white transition-colors"
              >Siguiente</NuxtLink>
            </li>
          </ul>
          <p class="text-xs text-gray-500 font-light">Página {{ page }} de {{ lastPage }} · {{ total }} artículos</p>
        </nav>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useSeoMeta, useAsyncData } from '#imports'
import { publicNewsService } from '~/services/PublicNewsService'
import { richHtmlToText } from '~/utils/richText'
import { pageWindow, parsePage } from '#shared/utils/pagination'
import type { NewsPage } from '~/types/news'

// Fuente de verdad: Wellezy Hub (vía Nitro). Mismo resultado en SSR, navegación interna, recarga e incógnito.
// Paginado (?pagina=N): Hub entrega como máximo 50 por página, así que se pide una página a la vez en lugar de «solo las primeras 50».
const route = useRoute()
const page = computed(() => parsePage(route.query.pagina))
const emptyPage: NewsPage = { items: [], page: 1, perPage: 12, total: 0, lastPage: 1 }
const { data, error, refresh, status } = await useAsyncData(
  () => `news-list-${page.value}`,
  () => publicNewsService.getNewsPage(page.value),
  { default: () => emptyPage, watch: [page] }
)
useServiceUnavailable(error)

const news = computed(() => data.value.items)
const total = computed(() => data.value.total)
const lastPage = computed(() => data.value.lastPage)
const pages = computed(() => pageWindow(page.value, lastPage.value))
const pageTo = (n: number) => ({ path: '/noticias', query: n > 1 ? { pagina: String(n) } : {} })

const formatDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : ''
// La destacada solo aparece en la primera página; en las demás todo va a la cuadrícula.
const featured = computed(() => (page.value === 1 ? news.value[0] : undefined))
const rest = computed(() => (page.value === 1 ? news.value.slice(1) : news.value))
const heroFacts = computed(() => {
  const last = page.value === 1 ? news.value[0]?.publishedAt : undefined
  return [
    { value: String(total.value), label: total.value === 1 ? 'Artículo publicado' : 'Artículos publicados' },
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

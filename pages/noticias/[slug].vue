<template>
  <div class="bg-white min-h-screen text-black font-sans selection:bg-[#0C2619] selection:text-white pt-24 md:pt-32 pb-24">
    
    <div class="max-w-[800px] mx-auto px-6">
      
      <!-- Navegación de regreso -->
      <NuxtLink to="/noticias" class="inline-flex items-center gap-3 text-[11px] font-bold tracking-[0.15em] text-[#848484] hover:text-black transition-colors uppercase mb-12">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        VOLVER A NOTICIAS
      </NuxtLink>

      <div v-if="article">
        <!-- HEADER -->
        <header class="mb-12">
          <div class="flex items-center gap-4 text-[11px] font-bold tracking-[0.15em] text-[#0C2619] uppercase mb-6">
            <time :datetime="article.publishedAt!">
              {{ new Date(article.publishedAt!).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) }}
            </time>
          </div>
          <h1 class="font-serif text-[40px] md:text-[56px] font-medium leading-[1.1] tracking-[-0.02em] text-black uppercase">
            {{ article.title }}
          </h1>
        </header>
        
        <!-- IMAGEN DESTACADA -->
        <div v-if="article.coverImage" class="relative w-full aspect-video bg-gray-100 mb-12">
          <img 
            :src="article.coverImage" 
            :alt="article.title" 
            class="w-full h-full object-cover"
          />
        </div>

        <!-- CONTENIDO EDITORIAL HTML -->
        <CommonRichContent
          :html="article.content"
          class="text-[#4c4546] font-light leading-relaxed text-lg"
        />
        <!-- El HTML se sanitiza (lista blanca) dentro de CommonRichContent antes de renderizarse. -->

        <!-- EMBEDS CONDICIONALES -->
        <!-- Temporalmente renderizamos componentes dedicados si el JSON trae las URLs -->
        <NewsYouTubeEmbed v-if="article.youtubeUrl" :url="article.youtubeUrl" />
        <NewsInstagramEmbed v-if="article.instagramUrl" :url="article.instagramUrl" />

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useSeoMeta, createError, useAsyncData } from '#imports'
import { publicNewsService } from '~/services/PublicNewsService'
import { richHtmlToText } from '~/utils/richText'

const route = useRoute()
const slug = route.params.slug as string

// Wellezy Hub decide qué es público (publicada, vigente, de esta línea). Si no existe → 404 real también en SSR.
const { data: article, error } = await useAsyncData('news-' + slug, () => publicNewsService.getNewsBySlug(slug))

// Hub caído, timeout o error de servicio NO es "no existe": 503 reintentable. Solo un 404 de Hub (null) es 404.
if (error.value) {
  throw createError({
    statusCode: 503,
    statusMessage: 'No fue posible cargar la página. Intenta nuevamente.',
    fatal: true
  })
}

if (!article.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Noticia no encontrada',
    fatal: true
  })
}

// SEO
useSeoMeta({
  title: article.value.seo?.metaTitle || (article.value.title + ' | Planmed Noticias'),
  description: article.value.seo?.metaDescription || richHtmlToText(article.value.excerpt),
  ogTitle: article.value.title,
  ogDescription: article.value.seo?.metaDescription || richHtmlToText(article.value.excerpt),
  ogImage: article.value.coverImage,
  ogType: 'article',
  articlePublishedTime: article.value.publishedAt,
  articleAuthor: article.value.author ? [article.value.author] : undefined
})
</script>

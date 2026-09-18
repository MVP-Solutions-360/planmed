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
            <time :datetime="article.publishedAt">
              {{ new Date(article.publishedAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) }}
            </time>
            <span v-if="article.author" class="w-1 h-1 rounded-full bg-[#D3A76A]"></span>
            <span v-if="article.author" class="text-[#848484]">{{ article.author }}</span>
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
        <div 
          class="prose prose-lg prose-headings:font-serif prose-headings:font-medium prose-headings:uppercase prose-headings:tracking-[-0.01em] prose-a:text-[#0C2619] prose-a:font-bold prose-img:rounded-lg max-w-none text-[#4c4546] font-light leading-relaxed"
          v-html="article.content"
        ></div>
        <!-- NOTA DE SEGURIDAD: En esta fase usamos v-html directo porque los datos provienen de MockNewsProvider local. 
             Cuando se conecte a Wellezy Hub, este contenido deberá ser sanitizado con DOMPurify o similar para prevenir XSS. -->

        <!-- EMBEDS CONDICIONALES -->
        <!-- Temporalmente renderizamos componentes dedicados si el JSON trae las URLs -->
        <NewsYouTubeEmbed v-if="article.youtubeUrl" :url="article.youtubeUrl" />
        <NewsInstagramEmbed v-if="article.instagramUrl" :url="article.instagramUrl" />

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter, useSeoMeta, createError, useAsyncData } from '#imports'
import { newsService } from '~/services/NewsService'

const route = useRoute()
const router = useRouter()
const slug = route.params.slug as string

const { data: article } = await useAsyncData('news-' + slug, () => newsService.getNewsBySlug(slug))

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
  description: article.value.seo?.metaDescription || article.value.excerpt,
  ogTitle: article.value.title,
  ogDescription: article.value.excerpt,
  ogImage: article.value.coverImage,
  ogType: 'article',
  articlePublishedTime: article.value.publishedAt,
  articleAuthor: article.value.author
})
</script>

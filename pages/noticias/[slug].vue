<template>
  <!-- Detalle de la noticia con el mismo lenguaje visual que Recomendaciones y Procedimientos: cabecera oscura, tarjetas blancas superpuestas y cierre oscuro. -->
  <div v-if="article" class="bg-[#fcf9f8] min-h-screen font-sans selection:bg-[#0C2619] selection:text-white">

    <!-- CABECERA -->
    <header class="relative overflow-hidden bg-gradient-to-br from-[#0C2619] via-[#12392a] to-[#1b5a3f] text-white pt-28 md:pt-36 pb-28 md:pb-36">
      <div class="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-[#D3A76A]/15 blur-3xl"></div>
      <div class="absolute -bottom-32 -left-20 w-[360px] h-[360px] rounded-full bg-white/5 blur-2xl"></div>
      <svg class="absolute inset-0 w-full h-full opacity-[0.05]" aria-hidden="true"><defs><pattern id="news-dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#fff" /></pattern></defs><rect width="100%" height="100%" fill="url(#news-dots)" /></svg>

      <div class="relative max-w-[900px] mx-auto px-6">
        <!-- Navegación de regreso -->
        <NuxtLink to="/noticias" class="inline-flex items-center gap-3 text-[11px] font-bold tracking-[0.15em] text-white/60 hover:text-white transition-colors uppercase mb-10 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          VOLVER A NOTICIAS
        </NuxtLink>

        <div class="text-center">
          <p v-if="article.publishedAt" class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D3A76A]/20 text-[#D3A76A] text-[11px] font-bold tracking-[0.2em] uppercase mb-6">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3M5 11h14M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <time :datetime="article.publishedAt">{{ publishedLabel }}</time>
          </p>
          <h1 class="font-serif text-[34px] md:text-[54px] font-medium leading-[1.08] tracking-[-0.02em]">{{ article.title }}</h1>
          <p v-if="subtitle" class="mt-6 text-white/70 font-light text-lg max-w-2xl mx-auto leading-relaxed">{{ subtitle }}</p>
          <p v-if="article.author" class="mt-4 text-[11px] font-bold tracking-[0.2em] text-white/50 uppercase">Por {{ article.author }}</p>
          <!-- Compartir: las noticias no tienen enlace corto en Hub, por lo que se comparte la URL pública de la noticia. -->
          <CommonShareActions :title="article.title" :path="`/noticias/${slug}`" tone="dark" class="mt-8" />
        </div>
      </div>
    </header>

    <!-- CONTENIDO -->
    <main class="relative max-w-[900px] mx-auto px-4 md:px-6 -mt-16 md:-mt-20 pb-24 space-y-8">

      <!-- Imagen destacada + contenido editorial -->
      <article class="bg-white border border-[#e5e2e1] shadow-xl shadow-black/5 rounded-2xl p-6 md:p-12">
        <div v-if="article.coverImage" class="relative w-full aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-lg mb-8 md:mb-10">
          <img :src="article.coverImage" :alt="article.title" class="w-full h-full object-cover" />
        </div>

        <!-- CONTENIDO EDITORIAL HTML -->
        <CommonRichContent :html="article.content" class="reco-body" />
        <!-- El HTML se sanitiza (lista blanca) dentro de CommonRichContent antes de renderizarse. -->
      </article>

      <!-- SECCIONES DE CONTENIDO (una o dos columnas), debajo del cuerpo; las noticias antiguas no tienen y no pintan nada -->
      <NewsSections :sections="article.sections" />

      <!-- EMBEDS CONDICIONALES -->
      <!-- Temporalmente renderizamos componentes dedicados si el JSON trae las URLs -->
      <section v-if="article.youtubeUrl" class="bg-white border border-[#e5e2e1] shadow-xl shadow-black/5 rounded-2xl p-6 md:p-12">
        <NewsYouTubeEmbed :url="article.youtubeUrl" class="!my-0" />
      </section>
      <section v-if="article.instagramUrl" class="bg-white border border-[#e5e2e1] shadow-xl shadow-black/5 rounded-2xl p-6 md:p-12">
        <NewsInstagramEmbed :url="article.instagramUrl" class="!my-0" />
      </section>

      <!-- LLAMADO A LA ACCIÓN -->
      <aside class="relative overflow-hidden rounded-2xl bg-[#0C2619] text-white p-8 md:p-12 text-center">
        <div class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#D3A76A]/20 blur-3xl"></div>
        <p class="relative text-[11px] font-bold tracking-[0.2em] text-[#D3A76A] uppercase mb-3">En Planmed te acompañamos</p>
        <h2 class="relative font-serif text-2xl md:text-3xl mb-4">Tu seguridad es lo más importante en cada etapa</h2>
        <p class="relative text-white/70 font-light max-w-xl mx-auto mb-8">Operarte con confianza es posible. Conoce cómo financiar tu cirugía con el respaldo de la entidad especializada en cirugía plástica.</p>
        <div class="relative flex flex-wrap justify-center gap-3">
          <NuxtLink to="/financiacion#calculadora" class="px-7 py-3 text-[11px] font-bold tracking-[0.15em] uppercase bg-[#D3A76A] text-[#0C2619] hover:bg-white transition-colors cursor-pointer">Simular financiación</NuxtLink>
          <NuxtLink to="/noticias" class="px-7 py-3 text-[11px] font-bold tracking-[0.15em] uppercase border border-white/40 hover:bg-white/10 transition-colors cursor-pointer">Más noticias</NuxtLink>
        </div>
      </aside>
    </main>
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

// Fecha de publicación y bajada (extracto como texto plano) para la cabecera.
const publishedLabel = article.value.publishedAt
  ? new Date(article.value.publishedAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
  : ''
const subtitle = richHtmlToText(article.value.excerpt)

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

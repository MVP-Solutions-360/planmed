<template>
  <div class="bg-white font-sans selection:bg-[#0C2619] selection:text-white">

    <!-- 1. PORTADA: vista principal; misma caja contenida con barra dorada que CommonPageHero, con la foto de fondo. -->
    <div class="bg-[#fcf9f8] pt-6 md:pt-10 px-6">
    <section class="relative isolate overflow-hidden bg-[#0C2619] max-w-[1200px] mx-auto" aria-labelledby="about-hero-title">
      <span aria-hidden="true" class="absolute left-0 top-0 z-10 h-full w-1.5 bg-[#D3A76A]"></span>
      <img
        :src="content.hero.image"
        :alt="content.hero.imageAlt"
        width="1915"
        height="821"
        fetchpriority="high"
        class="absolute inset-0 -z-10 w-full h-full object-cover object-[72%_center] md:object-center"
      />
      <div class="absolute inset-0 -z-10 bg-gradient-to-t from-[#0C2619]/95 via-[#0C2619]/55 to-[#0C2619]/10 md:bg-gradient-to-r md:from-[#0C2619]/90 md:via-[#0C2619]/45 md:to-transparent" aria-hidden="true"></div>
      <div class="max-w-[1200px] mx-auto px-6 md:px-12 min-h-[360px] md:min-h-[440px] lg:min-h-[500px] flex items-end md:items-center pb-12 md:pb-0">
        <div class="max-w-xl">
          <p class="text-[11px] font-bold tracking-[0.2em] text-[#D3A76A] uppercase mb-5 flex items-center gap-3"><span class="w-8 h-px bg-[#D3A76A]"></span>Planmed</p>
          <h1 id="about-hero-title" class="font-serif text-[44px] sm:text-[56px] lg:text-[76px] font-medium leading-[1.02] tracking-[-0.02em] text-white uppercase break-words">
            {{ content.hero.title }}
          </h1>
        </div>
      </div>
    </section>
    </div>

    <!-- 2. INFORMACIÓN INSTITUCIONAL -->
    <section class="bg-[#fcf9f8]" aria-labelledby="about-institutional-title">
      <div class="max-w-[1200px] mx-auto px-6 md:px-12 py-16 md:py-24 grid lg:grid-cols-12 gap-10 lg:gap-16">
        <div class="lg:col-span-5">
          <h2 id="about-institutional-title" class="font-serif text-3xl md:text-4xl font-medium leading-[1.15] tracking-[-0.01em] text-[#0C2619] uppercase mb-8">
            {{ content.institutional.title }}
          </h2>
          <div class="bg-white border border-[#e5e2e1] border-l-[3px] border-l-[#D3A76A] p-6 md:p-8">
            <CommonRichContent :html="content.institutional.legal" class="text-[15px] text-gray-700 leading-relaxed" />
          </div>
        </div>
        <div class="lg:col-span-7 flex flex-col gap-6 lg:pt-2">
          <CommonRichContent
            v-for="(paragraph, i) in paragraphs"
            :key="i"
            :html="paragraph"
            class="text-gray-600 font-light text-lg leading-relaxed"
          />
        </div>
      </div>
    </section>

    <!-- 3. VIDEO INSTITUCIONAL -->
    <section v-if="videoId" class="bg-[#0C2619]" aria-labelledby="about-video-title">
      <div class="max-w-[1000px] mx-auto px-6 md:px-12 py-16 md:py-24">
        <h2 id="about-video-title" class="font-serif text-3xl md:text-4xl font-medium text-white uppercase text-center mb-10">
          Video institucional
        </h2>
        <div class="relative w-full aspect-video bg-black/40 overflow-hidden shadow-2xl ring-1 ring-[#D3A76A]/30">
          <iframe
            :src="aboutYoutubeEmbedUrl(videoId)"
            class="absolute inset-0 w-full h-full"
            title="Video institucional de Planmed"
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    </section>

    <!-- 4. PREGUNTAS FRECUENTES -->
    <section v-if="content.faqs.length" class="bg-white" aria-labelledby="about-faq-title">
      <div class="max-w-[900px] mx-auto px-6 md:px-12 py-16 md:py-24">
        <h2 id="about-faq-title" class="font-serif text-3xl md:text-4xl font-medium text-[#0C2619] uppercase text-center mb-10 md:mb-14">
          Preguntas frecuentes
        </h2>
        <AboutFaqAccordion :faqs="content.faqs" id-prefix="about-faq" />
      </div>
    </section>

    <!-- 5. CONTACTO INSTITUCIONAL -->
    <AboutContactSection :contact="content.contact" />

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFetch, useSeoMeta, useHead, useSiteConfig } from '#imports'
import { aboutDefaultContent, aboutPublicView, aboutYoutubeId, aboutYoutubeEmbedUrl, type AboutContent } from '#shared/utils/aboutContent'

// Contenido administrado desde /admin/nosotros y persistido en el servidor de la web (GET /api/public/about).
// Si la lectura falla se muestra el contenido inicial validado (nunca un estado vacío).
const { data } = await useFetch<AboutContent>('/api/public/about', { key: 'about-page', default: () => aboutPublicView(aboutDefaultContent()) })
const content = computed<AboutContent>(() => data.value ?? aboutPublicView(aboutDefaultContent()))

const paragraphs = computed(() => content.value.institutional.paragraphs.filter(Boolean))
const videoId = computed(() => aboutYoutubeId(content.value.video.url))

const description = 'Plan Médico y Quirúrgico S.A.S. (PLANMED): entidad especializada en la suscripción y otorgamiento de préstamos de carácter privado, bajo la inspección y vigilancia de la Superintendencia de Industria y Comercio.'
useSeoMeta({
  title: 'Nosotros | Planmed',
  description,
  ogTitle: 'Nosotros | Planmed',
  ogDescription: description,
  ogImage: () => (content.value.hero.image.startsWith('/') ? content.value.hero.image : '/images/branding/logo_fondo_transparente.png'),
  ogType: 'website'
})

useHead({
  link: [
    { rel: 'canonical', href: `${String(useSiteConfig().url ?? '').replace(/\/+$/, '')}/nosotros` }
  ]
})
</script>


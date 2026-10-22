<template>
  <!-- Detalle del procedimiento con el mismo lenguaje visual que las recomendaciones: cabecera oscura, tarjetas blancas que se superponen y cierre oscuro. -->
  <div v-if="procedure" class="bg-[#fcf9f8] min-h-screen font-sans selection:bg-[#0C2619] selection:text-white">

    <!-- CABECERA -->
    <header class="relative overflow-hidden bg-gradient-to-br from-[#0C2619] via-[#12392a] to-[#1b5a3f] text-white pt-28 md:pt-36 pb-28 md:pb-36">
      <div class="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-[#D3A76A]/15 blur-3xl"></div>
      <div class="absolute -bottom-32 -left-20 w-[360px] h-[360px] rounded-full bg-white/5 blur-2xl"></div>
      <svg class="absolute inset-0 w-full h-full opacity-[0.05]" aria-hidden="true"><defs><pattern id="proc-dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#fff" /></pattern></defs><rect width="100%" height="100%" fill="url(#proc-dots)" /></svg>

      <div class="relative max-w-[900px] mx-auto px-6">
        <!-- Navegación de regreso -->
        <NuxtLink to="/procedimientos" class="inline-flex items-center gap-3 text-[11px] font-bold tracking-[0.15em] text-white/60 hover:text-white transition-colors uppercase mb-10 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          VOLVER AL PORTAFOLIO
        </NuxtLink>

        <div class="text-center">
          <p class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D3A76A]/20 text-[#D3A76A] text-[11px] font-bold tracking-[0.2em] uppercase mb-6">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            {{ procedure.category || 'PROCEDIMIENTO' }}
          </p>
          <h1 class="font-serif text-[34px] md:text-[54px] font-medium leading-[1.08] tracking-[-0.02em]">{{ procedure.name }}</h1>
          <p v-if="procedure.shortDescription" class="mt-6 text-white/70 font-light text-lg max-w-2xl mx-auto leading-relaxed">{{ procedure.shortDescription }}</p>
        </div>
      </div>
    </header>

    <!-- CONTENIDO -->
    <main class="relative max-w-[900px] mx-auto px-4 md:px-6 -mt-16 md:-mt-20 pb-24 space-y-8">

      <!-- Imagen principal + descripción detallada -->
      <article class="bg-white border border-[#e5e2e1] shadow-xl shadow-black/5 rounded-2xl p-6 md:p-12">
        <div
          class="relative overflow-hidden bg-gray-100 rounded-xl shadow-lg mb-8 md:ml-10 md:float-right"
          :class="procedure.imageOrientation === 'horizontal' ? 'aspect-video w-full md:w-[46%]' : 'aspect-[9/16] w-[60%] max-w-[260px] mx-auto md:mx-0 md:w-[34%] md:max-w-none'"
        >
          <img
            v-if="procedure.image"
            :src="procedure.image"
            :alt="procedure.name"
            class="w-full h-full object-contain"
          />
          <div v-else class="absolute inset-0 flex items-center justify-center text-[#848484] text-xs tracking-widest uppercase text-center px-4">
            IMAGEN EN PRODUCCIÓN
          </div>
        </div>

        <h2 class="reco-title font-serif text-2xl md:text-[1.75rem] font-medium leading-tight text-[#0C2619] mb-6">¿Qué es?</h2>
        <CommonRichContent v-if="procedure.whatIsIt" :html="procedure.whatIsIt" class="reco-body" />
        <p v-else-if="procedure.shortDescription" class="reco-body">{{ procedure.shortDescription }}</p>
        <div class="clear-both"></div>
      </article>

      <!-- Condiciones médicas compatibles -->
      <section v-if="procedure.perfil_paciente?.condiciones_medicas_compatibles" class="bg-white border border-[#e5e2e1] shadow-xl shadow-black/5 rounded-2xl p-6 md:p-12">
        <h2 class="reco-title font-serif text-2xl md:text-[1.75rem] font-medium leading-tight text-[#0C2619] mb-6">Condiciones médicas compatibles</h2>
        <CommonRichContent :html="procedure.perfil_paciente.condiciones_medicas_compatibles" class="reco-body" />
      </section>

      <!-- Galería de imágenes del procedimiento en carrusel (viene del detalle de Hub; sin imágenes no se muestra) -->
      <section v-if="galleryImages.length" class="bg-white border border-[#e5e2e1] shadow-xl shadow-black/5 rounded-2xl p-6 md:p-12" data-testid="procedure-gallery" role="region" aria-roledescription="carrusel" aria-label="Galería de imágenes">
        <h2 class="reco-title font-serif text-2xl md:text-[1.75rem] font-medium leading-tight text-[#0C2619] mb-6">Galería</h2>
        <div class="relative">
          <ul ref="track" class="flex overflow-x-auto snap-x snap-mandatory scroll-smooth rounded-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" @scroll.passive="onTrackScroll">
            <li v-for="(url, i) in galleryImages" :key="url + i" class="w-full shrink-0 snap-center" :aria-label="`Imagen ${i + 1} de ${galleryImages.length}`">
              <button
                type="button"
                class="block w-full h-[320px] md:h-[420px] overflow-hidden bg-gray-100 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2619]"
                :aria-label="`Ampliar imagen ${i + 1} de ${galleryImages.length}`"
                @click="activeImage = i"
              >
                <img :src="url" :alt="`${procedure.name} — imagen ${i + 1}`" loading="lazy" class="w-full h-full object-contain" />
              </button>
            </li>
          </ul>
          <template v-if="galleryImages.length > 1">
            <button type="button" class="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow text-[#0C2619] hover:bg-white cursor-pointer" aria-label="Imagen anterior" @click="slide(-1)">‹</button>
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow text-[#0C2619] hover:bg-white cursor-pointer" aria-label="Imagen siguiente" @click="slide(1)">›</button>
          </template>
        </div>
        <div v-if="galleryImages.length > 1" class="flex justify-center gap-2 mt-4">
          <button
            v-for="(url, i) in galleryImages" :key="'dot-' + i" type="button"
            class="w-2 h-2 rounded-full transition-colors cursor-pointer"
            :class="i === currentSlide ? 'bg-[#0C2619]' : 'bg-gray-300 hover:bg-gray-400'"
            :aria-label="`Ir a la imagen ${i + 1}`"
            :aria-current="i === currentSlide"
            @click="goTo(i)"
          />
        </div>
      </section>

      <!-- Secciones de la línea, debajo del contenido actual (aditivo: no sustituyen al contenido del procedimiento) -->
      <ProcedureSections :sections="procedure.secciones" :procedure-name="procedure.name" />

      <!-- LLAMADO A LA ACCIÓN: financiación -->
      <aside class="relative overflow-hidden rounded-2xl bg-[#0C2619] text-white p-8 md:p-12 text-center">
        <div class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#D3A76A]/20 blur-3xl"></div>
        <p class="relative text-[11px] font-bold tracking-[0.2em] text-[#D3A76A] uppercase mb-3">En Planmed te acompañamos</p>
        <h2 class="relative font-serif text-2xl md:text-3xl mb-4">Inicia tu plan</h2>
        <p class="relative text-white/70 font-light max-w-xl mx-auto mb-8">
          La viabilidad de esta intervención médica será determinada por un profesional certificado. Nuestro rol es brindarte la tranquilidad financiera para que puedas enfocarte en tu bienestar.
        </p>
        <NuxtLink
          :to="{ path: '/financiacion', query: { procedureId: procedure.id }, hash: '#calculadora' }"
          class="relative inline-flex px-7 py-3 text-[11px] font-bold tracking-[0.15em] uppercase bg-[#D3A76A] text-[#0C2619] hover:bg-white transition-colors cursor-pointer"
        >
          SIMULAR FINANCIACIÓN
        </NuxtLink>
      </aside>
    </main>

    <!-- Imagen ampliada de la galería -->
    <div
      v-if="activeImage !== null"
      class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Galería de imágenes"
      @click.self="activeImage = null"
    >
      <button type="button" class="absolute top-4 right-4 text-white text-3xl leading-none px-3 cursor-pointer" aria-label="Cerrar" @click="activeImage = null">×</button>
      <button v-if="galleryImages.length > 1" type="button" class="absolute left-2 md:left-6 text-white text-4xl px-3 cursor-pointer" aria-label="Imagen anterior" @click="step(-1)">‹</button>
      <img :src="galleryImages[activeImage]" :alt="`${procedure.name} — imagen ${activeImage + 1}`" class="max-h-full max-w-full object-contain" />
      <button v-if="galleryImages.length > 1" type="button" class="absolute right-2 md:right-6 text-white text-4xl px-3 cursor-pointer" aria-label="Imagen siguiente" @click="step(1)">›</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
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

// Galería: el detalle de Hub trae `galeria` como lista de URLs (se aceptan también objetos { url }); se descartan valores vacíos.
const galleryImages = computed(() => (procedure.value?.galeria ?? [])
  .map(g => (typeof g === 'string' ? g : g?.url))
  .filter(u => typeof u === 'string' && u.trim() !== ''))
const activeImage = ref(null)
const track = ref(null)
const currentSlide = ref(0)

function goTo(i) {
  const el = track.value
  if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
}
function slide(delta) {
  const n = galleryImages.value.length
  goTo((currentSlide.value + delta + n) % n)
}
function onTrackScroll() {
  const el = track.value
  if (el && el.clientWidth) currentSlide.value = Math.round(el.scrollLeft / el.clientWidth)
}

function step(delta) {
  const n = galleryImages.value.length
  activeImage.value = (activeImage.value + delta + n) % n
}
function onKey(e) {
  if (activeImage.value === null) return
  if (e.key === 'Escape') activeImage.value = null
  else if (e.key === 'ArrowLeft') step(-1)
  else if (e.key === 'ArrowRight') step(1)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

// SEO
useSeoMeta({
  title: procedure.value.seo?.meta_title || `${procedure.value.name} | Planmed`,
  description: procedure.value.seo?.meta_description || procedure.value.shortDescription
})
</script>


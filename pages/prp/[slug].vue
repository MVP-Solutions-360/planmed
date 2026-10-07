<template>
  <!-- El fondo marfil + el padding inferior son el separador entre la sección principal y el footer verde. -->
  <div class="prp-page bg-[#fcf9f8] pb-12 md:pb-16 font-sans selection:bg-[#0C2619] selection:text-white">
    <!-- Cargando -->
    <div v-if="!prp" class="min-h-[60vh] grid lg:grid-cols-[55fr_45fr]" aria-busy="true" aria-label="Cargando">
      <div class="bg-[#0C2619] px-6 py-12 lg:py-20 lg:px-14 animate-pulse">
        <div class="h-3 w-32 bg-white/20 mb-8"></div>
        <div class="h-10 w-3/4 bg-white/20 mb-4"></div>
        <div class="h-10 w-1/2 bg-white/20"></div>
      </div>
      <div class="bg-[#fcf9f8] px-6 py-12 lg:px-16 animate-pulse">
        <div class="h-12 bg-gray-200 mb-5"></div>
        <div class="h-12 bg-gray-200 mb-5"></div>
        <div class="h-12 bg-gray-200"></div>
      </div>
    </div>

    <!-- Micrositio -->
    <div v-else class="grid lg:grid-cols-[55fr_45fr]">
      <!-- Mensaje -->
      <section class="bg-[#0C2619] text-white px-6 py-10 md:py-16 lg:py-20 lg:pl-14 lg:pr-12 xl:pl-24 xl:pr-16 flex flex-col justify-center">
        <div class="max-w-xl mx-auto lg:mx-0 w-full">
          <p class="text-[11px] font-bold tracking-[0.15em] text-white/60 uppercase flex items-center gap-3 mb-6">
            <span class="w-2 h-2 rounded-full bg-[#D3A76A]"></span>
            Referido por
          </p>
          <p class="font-serif text-xl md:text-3xl text-[#D3A76A] mb-6 md:mb-8">{{ displayName }}</p>
          <h1 class="font-serif text-[34px] sm:text-[40px] md:text-[52px] xl:text-[60px] font-medium leading-[1.05] tracking-[-0.02em] uppercase mb-6 md:mb-8">
            {{ headline }}
          </h1>
          <p class="text-white/80 font-light text-base md:text-lg leading-relaxed max-w-md">
            Recibe toda la información sobre la cirugía que deseas, métodos de pago y financiación.
          </p>
        </div>
      </section>

      <!-- Formulario -->
      <section class="bg-[#fcf9f8] px-6 py-10 md:py-14 lg:py-16 lg:pl-12 lg:pr-14 xl:pl-16 xl:pr-24 flex flex-col justify-center">
        <div class="max-w-lg mx-auto lg:mx-0 w-full bg-white border border-[#e5e2e1] shadow-2xl shadow-black/5 p-6 md:p-10">
          <h2 class="font-serif text-2xl md:text-3xl font-medium text-black uppercase tracking-tight mb-2">Déjanos tus datos</h2>
          <p class="text-gray-500 font-light mb-8">Déjanos tus datos y nos pondremos en contacto contigo.</p>
          <PrpLeadForm :code-prp="prp.externalCode" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { createError, showError, useLazyAsyncData, useSeoMeta } from '#imports'
import { publicPrpService } from '~/services/PublicPrpService'

const DEFAULT_TITLE = 'Agenda tu valoración'

const route = useRoute()
const slug = String(route.params.slug)

// Carga con estado "pending" (esqueleto) en navegación del lado cliente; en SSR se resuelve antes de renderizar.
const { data: prp, status, error } = await useLazyAsyncData(`prp-${slug}`, () => publicPrpService.getBySlug(slug))

// 404 si no existe, está inactivo o es de otro tenant; error genérico (sin detalles técnicos) si Hub falla.
function guard() {
  const notFound = status.value === 'success' && !prp.value
  const failed = status.value === 'error' || !!error.value
  if (!notFound && !failed) return
  const err = notFound
    ? { statusCode: 404, statusMessage: 'Página no encontrada' }
    : { statusCode: 503, statusMessage: 'No pudimos cargar esta página. Intenta nuevamente en unos minutos.' }
  if (import.meta.server) throw createError({ ...err, fatal: true })
  showError(createError({ ...err, fatal: true }))
}
guard()
watch(status, guard)

const headline = computed(() => prp.value?.title || DEFAULT_TITLE)

// Los nombres de personas se muestran con mayúscula inicial. Solo se normaliza si llegan todo en minúsculas o todo
// en mayúsculas (si ya traen mayúsculas y minúsculas mezcladas, se respetan). El dato en Hub no se modifica.
const NAME_PARTICLES = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e'])
function formatPersonName(raw: string): string {
  const name = raw.trim().replace(/\s+/g, ' ')
  if (name !== name.toLowerCase() && name !== name.toUpperCase()) return name
  return name
    .toLowerCase()
    .split(' ')
    .map((word, i) => (i > 0 && NAME_PARTICLES.has(word) ? word : word.replace(/(^|[-'])(\p{L})/gu, (_, sep, letter) => sep + letter.toUpperCase())))
    .join(' ')
}
const displayName = computed(() => formatPersonName(prp.value?.name ?? ''))

// El título del PRP (nunca el external_code) define el SEO. Estas páginas no se indexan.
useSeoMeta({
  title: () => `${headline.value} | Planmed`,
  ogTitle: () => `${headline.value} | Planmed`,
  description: 'Agenda tu valoración con Planmed. Déjanos tus datos y nos pondremos en contacto contigo para resolver tus dudas sobre la cirugía, los métodos de pago y la financiación.',
  ogDescription: 'Agenda tu valoración con Planmed. Déjanos tus datos y nos pondremos en contacto contigo.',
  robots: 'noindex, nofollow'
})
</script>

<style>
/* El <main> del layout se estira hasta el footer pero su fondo es blanco. Cuando contiene este micrositio,
   se pinta en marfil para que, en pantallas muy altas, nunca quede una franja blanca antes del footer.
   Solo aplica mientras la página está montada (no afecta a las demás páginas). */
main:has(> .prp-page) {
  background-color: #fcf9f8;
}
</style>

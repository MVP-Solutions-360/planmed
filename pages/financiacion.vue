<template>
  <div>
    <SitePageShell :title="FINANCING_TITLE" :subtitle="FINANCING_SUBTITLE" wide bare>
      <!-- Botón directo al simulador (ancla de esta misma página) -->
      <template #actions>
        <a href="#calculadora" data-testid="go-to-simulator" class="inline-flex items-center gap-3 bg-[#D3A76A] hover:bg-[#e0b97f] text-[#0C2619] px-8 py-4 text-xs font-bold tracking-[0.15em] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          Simula tu financiación
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        </a>
      </template>

      <!-- Secciones de ancho completo que alternan fondo (blanco / verde corporativo) para marcar el paso de una a otra -->

      <!-- 1 · Cómo lo hacemos — blanco -->
      <section aria-labelledby="fin-como" class="band bg-white">
        <div class="inner">
          <h2 id="fin-como" class="h2 text-center uppercase">Cómo lo hacemos</h2>
          <ol class="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            <li v-for="(s, i) in steps" :key="s.title" class="text-center flex flex-col items-center">
              <span class="step-n" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
              <h3 class="h3 uppercase">{{ s.title }}</h3>
              <span class="icon" aria-hidden="true"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" :d="s.icon" /></svg></span>
              <p class="prose-p mt-4">{{ s.text }}</p>
            </li>
          </ol>
        </div>
      </section>

      <!-- 2 · Qué necesitas — verde -->
      <section aria-labelledby="fin-necesitas" class="band band-dark bg-[#0C2619]">
        <div class="inner">
          <h2 id="fin-necesitas" class="h2 text-center uppercase">Qué necesitas</h2>
          <ul class="mt-10 grid md:grid-cols-3 gap-8 lg:gap-10">
            <li v-for="n in needs" :key="n.title" class="text-center flex flex-col items-center">
              <h3 class="h3 uppercase">{{ n.title }}</h3>
              <span class="icon" aria-hidden="true"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" :d="n.icon" /></svg></span>
              <p class="prose-p mt-4">{{ n.text }}</p>
              <ul v-if="n.notes" class="prose-p mt-4 list-disc list-inside text-left">
                <li v-for="note in n.notes" :key="note">{{ note }}</li>
              </ul>
            </li>
          </ul>
        </div>
      </section>

      <!-- 3 · ¿Cómo financiamos? (video) — blanco -->
      <section aria-labelledby="fin-video" class="band bg-white">
        <div class="inner">
          <h2 id="fin-video" class="h2 text-center uppercase">¿Cómo financiamos?</h2>
          <div class="video mt-8">
            <iframe :src="aboutYoutubeEmbedUrl('NnAkWAmmK4A')" title="Planmed: requisitos de financiación" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>
          </div>
        </div>
      </section>

      <!-- 4 · Simula tu financiación — verde (título y ventajas). El ancla #calculadora está en este contenedor, que se dibuja en el servidor:
           así /financiacion#calculadora funciona aunque el simulador (solo navegador) cargue después. -->
      <section id="calculadora" aria-labelledby="fin-simulador" class="band band-dark bg-[#0C2619] scroll-mt-20 !pb-12 md:!pb-16" data-testid="financing-simulator">
        <div class="inner">
          <h2 id="fin-simulador" class="h2 text-center uppercase">Simula tu financiación</h2>
          <p class="prose-p text-center mt-3">Explora opciones de financiación flexibles y encuentra el plan que se adapta a ti.</p>
          <ul class="mt-8 grid sm:grid-cols-3 gap-6 text-center">
            <li v-for="b in benefits" :key="b.title">
              <h3 class="h3 uppercase">{{ b.title }}</h3>
              <p class="prose-p text-sm mt-1">{{ b.text }}</p>
            </li>
          </ul>
        </div>
      </section>

      <!-- El simulador, tal como estaba — blanco -->
      <section aria-label="Simulador de cuota" class="band bg-white">
        <div class="inner">
          <ClientOnly>
            <SimulatorPanel />
            <template #fallback>
              <div class="h-96 bg-white border border-[#e5e2e1] animate-pulse" aria-hidden="true"></div>
            </template>
          </ClientOnly>
        </div>
      </section>

      <!-- 5 · Preguntas frecuentes (las mismas de /nosotros, administradas en /admin/nosotros) — verde, con el acordeón sobre tarjeta blanca -->
      <section v-if="faqs.length" aria-labelledby="fin-faq" class="band band-dark bg-[#0C2619]">
        <div class="inner max-w-3xl">
          <h2 id="fin-faq" class="h2 text-center mb-8 md:mb-10 uppercase">Preguntas frecuentes</h2>
          <div class="bg-white px-5 md:px-8 py-2">
            <AboutFaqAccordion :faqs="faqs" id-prefix="fin-faq" />
          </div>
        </div>
      </section>
    </SitePageShell>

    <!-- Contacto: los mismos datos de /nosotros -->
    <AboutContactSection :contact="content.contact" />
  </div>
</template>

<script setup lang="ts">
// Página «Financiación»: texto y video entregados por Planmed (estático) + el simulador de cuota (antes /simulador). Preguntas frecuentes y contacto se comparten con /nosotros.
import { computed } from 'vue'
import { useFetch, useSeoMeta, useHead, useSiteConfig } from '#imports'
import { aboutDefaultContent, aboutPublicView, aboutYoutubeEmbedUrl, type AboutContent } from '#shared/utils/aboutContent'
import { FINANCING_DESCRIPTION, FINANCING_PATH, FINANCING_SEO_TITLE, FINANCING_SUBTITLE, FINANCING_TITLE, financingStructuredData } from '#shared/utils/financingSeo'

const steps = [
  { title: 'Asesoría', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', text: 'Una vez diligencies nuestro formulario, uno de nuestros asesores se comunicará contigo a la mayor brevedad y te brindará toda la información y la documentación que se requiere para iniciar el proceso de valoración con especialista y estudio de crédito.' },
  { title: 'Estudio', icon: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13', text: 'Posteriormente a la entrega de la documentación completa, se pasa la información a estudio crediticio, evaluación en centrales de riesgo y capacidad crediticia.' },
  { title: 'Pre aprobación', icon: 'M5 13l4 4L19 7', text: 'Una vez evaluada y estudiada la documentación en la etapa de preaprobado, se fijará las fechas de las valoraciones con especialista requeridas para tu proceso.' },
  { title: 'Desembolso', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', text: 'Cumplidas las etapas anteriores; se realizará el desembolso a la IPS encargada de realizar tu procedimiento y podrás realizarte esta cirugía que tanto esperabas.' }
]

const benefits = [
  { title: 'Planes flexibles', text: 'Elige el plazo que mejor se ajuste a ti.' },
  { title: 'Seguro y confiable', text: 'Tus datos están protegidos.' },
  { title: 'Asesor personal', text: 'Un asesor te acompaña en cada paso.' }
]

const needs = [
  { title: 'Cédula de ciudadanía', icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2', text: 'Cédula de ciudadanía para los trámites de estudio de viabilidad y consulta en centrales de riesgo, agenda de citas y procedimientos.' },
  { title: 'Carta laboral', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', text: 'Carta laboral donde se evidencie el salario y el tiempo de labor (Mínimo 1 año de antigüedad de labor)', notes: ['No expedida con más de 1 mes'] },
  { title: 'Colillas de pago', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', text: '3 últimas colillas de pago, donde se evidencie efectivamente el pago del monto por concepto de salario de la carta laboral.' }
]

const { data } = await useFetch<AboutContent>('/api/public/about', { key: 'about-page', default: () => aboutPublicView(aboutDefaultContent()) })
const content = computed<AboutContent>(() => data.value ?? aboutPublicView(aboutDefaultContent()))
const faqs = computed(() => content.value.faqs)

// SEO: frase objetivo «Financiación de cirugías plásticas» en título, H1 y descripción; canonical/og:url con el origen del sitio configurado
// (mismo criterio que el resto de páginas) y datos estructurados solo con lo que la página muestra (ver shared/utils/financingSeo.ts).
const origin = String(useSiteConfig().url ?? '').replace(/\/+$/, '')
const canonical = `${origin}${FINANCING_PATH}`
useSeoMeta({ title: FINANCING_SEO_TITLE, ogTitle: FINANCING_SEO_TITLE, description: FINANCING_DESCRIPTION, ogDescription: FINANCING_DESCRIPTION, ogType: 'website', ogUrl: canonical, ogLocale: 'es_CO' })
useHead({
  link: [{ rel: 'canonical', href: canonical }],
  script: [{ type: 'application/ld+json', innerHTML: computed(() => financingStructuredData(origin, faqs.value)) }]
})
</script>

<style scoped>
/* Secciones de ancho completo con fondo alterno */
.band { padding: 4rem 1.5rem; }
@media (min-width: 768px) { .band { padding: 6rem 3rem; } }
.inner { max-width: 1200px; margin: 0 auto; }
.h2 { font-family: var(--font-serif, serif); font-size: 1.75rem; line-height: 1.2; font-weight: 500; color: #0C2619; }
.h3 { font-size: .875rem; font-weight: 700; letter-spacing: .12em; color: #4c4546; margin-top: .25rem; }
.step-n { font-size: 10px; font-weight: 700; letter-spacing: .2em; color: #D3A76A; margin-bottom: .5rem; }
.icon { display: inline-flex; align-items: center; justify-content: center; width: 3rem; height: 3rem; margin-top: 1rem; border: 1.5px solid #D3A76A; border-radius: 9999px; color: #0C2619; }
.prose-p { color: #4b5563; font-weight: 300; font-size: 1rem; line-height: 1.7; }
.video { position: relative; width: 100%; aspect-ratio: 16 / 9; background: #000; overflow: hidden; box-shadow: 0 0 0 1px rgb(211 167 106 / .3); }
.video iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }

/* Variante sobre verde corporativo */
.band-dark .h2, .band-dark .h3 { color: #fff; }
.band-dark .prose-p { color: rgb(255 255 255 / .8); }
.band-dark .icon { color: #D3A76A; }
</style>

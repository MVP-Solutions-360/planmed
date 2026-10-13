<template>
  <SitePageShell title="Servicios" wide>
    <div class="space-y-16 md:space-y-24">

      <!-- Asesoría y financiación -->
      <section class="grid md:grid-cols-2 gap-10 md:gap-16 items-center" aria-labelledby="srv-asesoria">
        <div>
          <h2 id="srv-asesoria" class="h2">Asesoría y financiación de cirugía plástica estética</h2>
          <div class="prose-p mt-5">
            <p>Disponemos de un equipo altamente calificado de asesores que te acompañarán en todo el proceso de financiación y valoraciones; durante la operación y el post operatorio, quienes tendrán en todo momento, sus intereses como prioridad.</p>
            <p>Nuestro principal compromiso es con su salud y satisfacción, por tanto, ponemos a su disposición espacios óptimos y adecuados de acuerdo a sus necesidades.</p>
          </div>
        </div>
        <img src="/images/team/equipo-planmed.png" alt="Equipo de asesores de Planmed" loading="lazy" class="w-full aspect-[4/3] object-cover border border-[#e5e2e1]" />
      </section>

      <div class="video">
        <iframe :src="aboutYoutubeEmbedUrl('rH1wWM51SGM')" title="Planmed: nosotros" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>
      </div>

      <!-- Casa de recuperación -->
      <section aria-labelledby="srv-casa">
        <h2 id="srv-casa" class="h2">Casa de recuperación post quirúrgica</h2>
        <div class="prose-p mt-5 max-w-4xl">
          <p>Contamos con alojamiento especializado en recuperación de nuestros pacientes, los cuales están equipados con la mejor tecnología para tu recuperación, enfermera 24 horas y chef personalizado para que tu estadía en nuestras casas de recuperación sea confortable y de la mejor calidad.</p>
          <p>También tenemos a disposición de los pacientes transporte especializado para llevarlos a valoraciones, procedimientos, revisiones y citas de post operatorios, y así evitar eventuales lesiones derivadas del desplazamiento.</p>
        </div>
        <div class="video mt-10">
          <iframe :src="aboutYoutubeEmbedUrl('x9ZPOewX4vk')" title="Planmed: ¿Qué es Planmed?" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>
        </div>
      </section>

      <!-- Preguntas frecuentes: las mismas de /nosotros (administradas en /admin/nosotros) -->
      <section v-if="faqs.length" aria-labelledby="srv-faq" class="max-w-3xl mx-auto">
        <h2 id="srv-faq" class="h2 text-center mb-8 md:mb-10 uppercase">Preguntas frecuentes</h2>
        <AboutFaqAccordion :faqs="faqs" id-prefix="srv-faq" />
      </section>
    </div>
  </SitePageShell>
</template>

<script setup lang="ts">
// Página «Servicios»: texto y videos entregados por Planmed (contenido estático); las preguntas frecuentes se comparten con /nosotros.
import { computed } from 'vue'
import { useFetch, useSeoMeta, useHead } from '#imports'
import { aboutDefaultContent, aboutPublicView, aboutYoutubeEmbedUrl, type AboutContent } from '#shared/utils/aboutContent'

const { data } = await useFetch<AboutContent>('/api/public/about', { key: 'about-page', default: () => aboutPublicView(aboutDefaultContent()) })
const faqs = computed(() => (data.value ?? aboutPublicView(aboutDefaultContent())).faqs)

const description = 'Asesoría y financiación de cirugía plástica estética con Planmed: acompañamiento en la financiación, las valoraciones y el post operatorio, y casa de recuperación.'
useSeoMeta({ title: 'Servicios | Planmed', ogTitle: 'Servicios | Planmed', description, ogDescription: description, ogType: 'website' })
useHead({ link: [{ rel: 'canonical', href: 'https://planmed.com/servicios' }] })
</script>

<style scoped>
.h2 { font-family: var(--font-serif, serif); font-size: 1.75rem; line-height: 1.2; font-weight: 500; color: #0C2619; }
.prose-p { color: #4b5563; font-weight: 300; font-size: 1.0625rem; line-height: 1.75; }
.prose-p > * + * { margin-top: 1rem; }
.video { position: relative; width: 100%; aspect-ratio: 16 / 9; background: #000; overflow: hidden; box-shadow: 0 0 0 1px rgb(211 167 106 / .3); }
.video iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
</style>

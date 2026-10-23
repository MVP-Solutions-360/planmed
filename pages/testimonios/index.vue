<template>
  <div class="bg-[#fcf9f8] min-h-screen font-sans selection:bg-[#0C2619] selection:text-white pt-6 md:pt-10 pb-24">
    <div class="max-w-[1200px] mx-auto px-6">

      <CommonPageHero
        eyebrow="HISTORIAS REALES"
        :lines="['PACIENTES', 'FELICES.']"
        lead="Conoce cómo otros pacientes superaron el miedo, la falta de dinero o una mala experiencia previa para transformar su cuerpo con el respaldo de Planmed."
      />
      <TestimonialsNav />

      <CommonHubUnavailable v-if="error" :retrying="status === 'pending'" @retry="refresh()" />

      <!-- Videos -->
      <section v-if="content.visibility.videos" class="mb-20">
        <div v-if="content.videos.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          <div v-for="video in content.videos" :key="video.id" class="bg-white border border-[#e5e2e1] p-3 pb-6 hover:shadow-xl transition-shadow duration-300 [&>div]:my-0">
            <NewsYouTubeEmbed :url="video.url" />
            <p v-if="video.title" class="mt-4 px-3 font-serif text-xl font-medium text-black leading-snug">{{ video.title }}</p>
          </div>
        </div>
        <p v-else-if="loaded && !error" class="text-center text-gray-500 font-light py-16 border border-dashed border-gray-300 bg-white">
          Pronto compartiremos aquí los videos de nuestros pacientes.
        </p>
      </section>

      <!-- Introducción -->
      <section class="grid lg:grid-cols-12 gap-10 lg:gap-16 mb-20 border-t border-black pt-10">
        <div class="lg:col-span-5">
          <p class="text-[11px] font-bold tracking-[0.15em] text-[#848484] uppercase mb-4">Por qué importan</p>
          <h2 class="font-serif text-3xl md:text-4xl font-medium leading-tight text-black">¿Por qué un testimonio vale más que mil palabras?</h2>
        </div>
        <div class="lg:col-span-7 text-gray-600 font-light leading-relaxed text-lg space-y-4">
          <p>Los <strong class="font-semibold text-[#0C2619]">testimonios de pacientes Planmed</strong> te muestran que transformar tu cuerpo con cirugía plástica no es solo un sueño: es una meta alcanzable. A través de estas historias reales, puedes conocer cómo otros superaron barreras como el miedo, la falta de dinero o incluso experiencias negativas previas.</p>
          <p>Además, los relatos sinceros generan confianza. Cuando ves que alguien como tú lo logró, entiendes que tú también puedes hacerlo.</p>
        </div>
      </section>

      <section class="grid md:grid-cols-2 gap-8 mb-20">
        <div class="bg-white border border-[#e5e2e1] p-8 md:p-10">
          <h2 class="font-serif text-2xl font-medium text-[#0C2619] mb-4">¿Qué encontrarás en esta sección?</h2>
          <p class="text-gray-600 font-light leading-relaxed mb-4">Aquí reunimos testimonios en video, fotos del antes y después, y relatos escritos de quienes decidieron dar el paso con el respaldo de Planmed. Todos tienen algo en común: financiaron su cirugía de forma segura, con cuotas ajustadas a su realidad y sin poner en riesgo su estabilidad económica.</p>
          <p class="text-[11px] font-bold tracking-[0.15em] text-[#848484] uppercase mb-3">Algunos de ellos</p>
          <ul class="space-y-3">
            <li v-for="item in highlights" :key="item" class="flex items-start gap-3 text-gray-700 font-light">
              <span aria-hidden="true" class="mt-2 w-1.5 h-1.5 rounded-full bg-[#D3A76A] shrink-0"></span><span>{{ item }}</span>
            </li>
          </ul>
        </div>
        <div class="bg-white border border-[#e5e2e1] p-8 md:p-10">
          <h2 class="font-serif text-2xl font-medium text-[#0C2619] mb-4">Lo que cuentan nuestros pacientes</h2>
          <p class="text-gray-600 font-light leading-relaxed mb-4">Estas historias son el reflejo de nuestra misión: que nadie se quede sin la oportunidad de transformar su cuerpo y su vida por no tener el dinero completo de inmediato.</p>
          <p class="text-gray-600 font-light leading-relaxed">Los testimonios que verás a continuación te mostrarán lo que significa contar con una entidad especializada en cirugía plástica, que no solo financia, sino que entiende lo que estás por hacer con tu cuerpo.</p>
        </div>
      </section>

      <!-- Qué dicen -->
      <section class="mb-20">
        <p class="text-[11px] font-bold tracking-[0.15em] text-[#848484] uppercase mb-4">En sus palabras</p>
        <h2 class="font-serif text-3xl md:text-4xl font-medium leading-tight text-black mb-10 max-w-3xl">¿Qué dicen nuestros pacientes?</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <blockquote v-for="q in quotes" :key="q" class="relative bg-white border border-[#e5e2e1] border-t-4 border-t-[#D3A76A] p-8 pt-12">
            <span aria-hidden="true" class="absolute top-2 left-6 font-serif text-6xl leading-none text-[#D3A76A]">“</span>
            <p class="font-serif text-xl leading-snug text-[#0C2619]">{{ q }}</p>
          </blockquote>
        </div>
      </section>

      <!-- Especialistas -->
      <section class="bg-[#0C2619] text-white px-6 py-12 md:px-14 md:py-16">
        <p class="text-[11px] font-bold tracking-[0.15em] text-[#D3A76A] uppercase mb-4">Planmed</p>
        <h2 class="font-serif text-2xl md:text-4xl font-medium leading-tight max-w-3xl mb-5">Especialistas en crédito para cirugía plástica</h2>
        <p class="text-white/80 font-light leading-relaxed max-w-3xl mb-8">Lo que nos diferencia es que no somos una clínica ni un banco: somos la entidad especializada en préstamos para cirugía plástica en Colombia. Financiamos más del 50% del valor total y ofrecemos planes de pago de hasta 72 meses.</p>
        <div class="flex flex-wrap gap-3">
          <NuxtLink to="/recursos" class="px-6 py-3 text-[11px] font-bold tracking-[0.15em] uppercase border border-white/40 text-white hover:bg-white hover:text-[#0C2619] transition-colors">Cómo funciona el crédito quirúrgico</NuxtLink>
          <NuxtLink to="/financiacion#calculadora" class="px-6 py-3 text-[11px] font-bold tracking-[0.15em] uppercase bg-[#D3A76A] text-[#0C2619] border border-[#D3A76A] hover:bg-white hover:border-white transition-colors">Agenda tu valoración gratuita</NuxtLink>
        </div>
      </section>

      <!-- Cierre -->
      <section class="mt-20 text-center max-w-3xl mx-auto">
        <h2 class="font-serif text-3xl md:text-4xl font-medium leading-tight text-black mb-5">¿Y tú, qué historia quieres contar?</h2>
        <p class="text-gray-600 font-light leading-relaxed text-lg mb-6">Si estás pensando en operarte pero aún tienes dudas, estos testimonios pueden ayudarte a ver que sí es posible. Porque con la orientación correcta, cuotas flexibles y respaldo real, tomar una decisión informada se vuelve mucho más fácil.</p>
        <p class="font-semibold text-[#0C2619]">Escríbenos hoy mismo. En Planmed, miles ya lo hicieron. Tú también puedes.</p>
      </section>

      <!-- Redes -->
      <TestimonialsSocial />

    </div>
  </div>
</template>

<script setup lang="ts">
import { useSeoMeta } from '#imports'
import { publicTestimonialsService } from '~/services/PublicTestimonialsService'
import type { TestimonialsContent } from '~/types/testimonials'

const highlights = [
  'Tenían reportes en centrales de riesgo',
  'Eran trabajadores independientes o extranjeros',
  'Necesitaban reconstruir su cuerpo tras una mala experiencia quirúrgica',
  'Querían cumplir un sueño postergado por años'
]
const quotes = [
  'Planmed fue mi solución cuando nadie más me daba la oportunidad.',
  'Gracias a la financiación pude hacerme la cirugía sin esperar años.',
  'Después de una mala experiencia, ellos me guiaron con los mejores médicos y el apoyo que necesitaba.'
]

const empty: TestimonialsContent = { visibility: { videos: true, beforeAfter: true }, videos: [], beforeAfter: [], instagram: [], referral: { title: '', content: '' } }

// Se lee de Wellezy Hub (vía Nitro) también en el servidor, para que el HTML inicial ya traiga el contenido publicado.
const { data, status, error, refresh } = await useAsyncData('patient-section', () => publicTestimonialsService.getContent(), { default: () => empty })
useServiceUnavailable(error)
const content = computed(() => data.value ?? empty)
const loaded = computed(() => status.value === 'success' || status.value === 'error')

const description = 'Conoce las historias reales de pacientes que financiaron su cirugía plástica con Planmed.'
useSeoMeta({ title: 'Pacientes felices | Planmed', description, ogTitle: 'Pacientes felices | Planmed', ogDescription: description })
</script>

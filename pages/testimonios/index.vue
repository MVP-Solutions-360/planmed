<template>
  <div class="bg-[#fcf9f8] min-h-screen font-sans pt-24 md:pt-32 pb-24">
    <div class="max-w-[1100px] mx-auto px-6">

      <h1 class="font-serif text-[36px] md:text-[52px] font-medium leading-[1.05] tracking-[-0.02em] text-[#0C2619] uppercase text-center mb-10">
        Pacientes felices
      </h1>
      <TestimonialsNav />

      <CommonHubUnavailable v-if="error" :retrying="status === 'pending'" @retry="refresh()" />

      <!-- Introducción -->
      <section class="space-y-10 text-gray-700 font-light leading-relaxed">
        <div class="max-w-4xl">
          <h2 class="font-bold text-black text-lg mb-3">¿Por qué un testimonio vale más que mil palabras?</h2>
          <p class="mb-4">Los <strong class="font-semibold">testimonios de pacientes Planmed</strong> te muestran que transformar tu cuerpo con cirugía plástica no es solo un sueño: es una meta alcanzable. A través de estas historias reales, puedes conocer cómo otros superaron barreras como el miedo, la falta de dinero o incluso experiencias negativas previas.</p>
          <p>Además, los relatos sinceros generan confianza. Cuando ves que alguien como tú lo logró, entiendes que tú también puedes hacerlo.</p>
        </div>

        <div class="grid md:grid-cols-2 gap-10">
          <div>
            <h2 class="font-bold text-black text-lg mb-3">¿Qué encontrarás en esta sección?</h2>
            <p class="mb-4">Aquí reunimos testimonios en video, fotos del antes y después, y relatos escritos de quienes decidieron dar el paso con el respaldo de Planmed. Todos tienen algo en común: financiaron su cirugía de forma segura, con cuotas ajustadas a su realidad y sin poner en riesgo su estabilidad económica.</p>
            <p class="mb-3">Algunos de ellos:</p>
            <ul class="space-y-1">
              <li v-for="item in highlights" :key="item" class="flex items-start gap-2">
                <span aria-hidden="true">✅</span><span>{{ item }}</span>
              </li>
            </ul>
          </div>
          <div>
            <h2 class="font-bold text-black text-lg mb-3">Lo que cuentan nuestros pacientes</h2>
            <p class="mb-4">Estas historias son el reflejo de nuestra misión: que nadie se quede sin la oportunidad de transformar su cuerpo y su vida por no tener el dinero completo de inmediato.</p>
            <p>Los testimonios que verás a continuación te mostrarán lo que significa contar con una entidad especializada en cirugía plástica, que no solo financia, sino que entiende lo que estás por hacer con tu cuerpo.</p>
          </div>
        </div>
      </section>

      <!-- Videos -->
      <section v-if="content.visibility.videos" class="mt-14">
        <div v-if="content.videos.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="video in content.videos" :key="video.id" class="[&>div]:my-0">
            <NewsYouTubeEmbed :url="video.url" />
            <p v-if="video.title" class="mt-3 text-sm font-semibold text-black">{{ video.title }}</p>
          </div>
        </div>
        <p v-else-if="loaded && !error" class="text-center text-gray-500 font-light py-10 border border-dashed border-gray-300">
          Pronto compartiremos aquí los videos de nuestros pacientes.
        </p>
      </section>

      <!-- Especialistas -->
      <section class="mt-20 bg-white border border-[#e5e2e1] p-8 md:p-12">
        <h2 class="font-serif text-2xl md:text-3xl text-[#0C2619] uppercase mb-5">Planmed: Especialistas en crédito para cirugía plástica</h2>
        <p class="text-gray-700 font-light leading-relaxed mb-6">Lo que nos diferencia es que no somos una clínica ni un banco: somos la entidad especializada en préstamos para cirugía plástica en Colombia. Financiamos más del 50% del valor total y ofrecemos planes de pago de hasta 72 meses.</p>
        <ul class="space-y-2 text-gray-700 font-light">
          <li>📌 <NuxtLink to="/recursos" class="underline hover:text-[#0C2619]">Conoce cómo funciona nuestro crédito quirúrgico</NuxtLink></li>
          <li>📌 <NuxtLink to="/financiacion#calculadora" class="underline hover:text-[#0C2619]">Agenda tu valoración inicial gratuita</NuxtLink></li>
        </ul>
      </section>

      <!-- Qué dicen -->
      <section class="mt-16 max-w-4xl text-gray-700 font-light leading-relaxed">
        <h2 class="font-bold text-black text-lg mb-3">¿Qué dicen nuestros pacientes?</h2>
        <p class="mb-5">Sus palabras reflejan lo que realmente ocurre cuando alguien toma la decisión de operarse con respaldo. Algunos han dicho:</p>
        <div class="space-y-3 mb-12">
          <blockquote v-for="q in quotes" :key="q" class="border-l-4 border-[#0C2619] pl-4 italic">“{{ q }}”</blockquote>
        </div>

        <h2 class="font-bold text-black text-lg mb-3">¿Y tú, qué historia quieres contar?</h2>
        <p class="mb-6">Si estás pensando en operarte pero aún tienes dudas, estos testimonios pueden ayudarte a ver que sí es posible. Porque con la orientación correcta, cuotas flexibles y respaldo real, tomar una decisión informada se vuelve mucho más fácil.</p>
        <p class="mb-2">📲 Escríbenos hoy mismo.</p>
        <p>💚 En Planmed, miles ya lo hicieron. Tú también puedes.</p>
      </section>

      <!-- Redes -->
      <section class="mt-14 text-center">
        <p class="text-[11px] font-bold tracking-[0.15em] text-[#848484] uppercase mb-5">Conoce más testimonios en nuestras redes sociales</p>
        <div class="flex flex-wrap justify-center gap-3">
          <a v-for="s in socials" :key="s.label" :href="s.href" target="_blank" rel="noopener noreferrer"
            class="px-6 py-3 text-[11px] font-bold tracking-[0.15em] uppercase border border-[#0C2619] text-[#0C2619] hover:bg-[#0C2619] hover:text-white transition-colors">
            {{ s.label }}
          </a>
          <NuxtLink to="/financiacion#calculadora" class="px-6 py-3 text-[11px] font-bold tracking-[0.15em] uppercase bg-[#0C2619] text-white border border-[#0C2619] hover:bg-black transition-colors">
            Simular financiación
          </NuxtLink>
        </div>
      </section>

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
// TODO: reemplazar por las URLs oficiales de las redes de Planmed (hoy el Footer también usa "#").
const socials = [
  { label: 'Instagram', href: '#' },
  { label: 'Facebook', href: '#' },
  { label: 'TikTok', href: '#' }
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

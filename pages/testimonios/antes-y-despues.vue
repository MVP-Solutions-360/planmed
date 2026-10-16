<template>
  <div class="bg-[#fcf9f8] min-h-screen font-sans pt-24 md:pt-32 pb-24">
    <div class="max-w-[1100px] mx-auto px-6">
      <h1 class="font-serif text-[36px] md:text-[52px] font-medium leading-[1.05] tracking-[-0.02em] text-[#0C2619] uppercase text-center mb-10">
        Antes y después
      </h1>
      <TestimonialsNav />

      <CommonHubUnavailable v-if="error" :retrying="status === 'pending'" @retry="refresh()" />

      <p v-else-if="loaded && !visibility" class="text-center text-gray-500 font-light py-16 border border-dashed border-gray-300">
        Esta sección no está disponible por el momento.
      </p>

      <template v-else-if="visibility">
        <section class="max-w-4xl mx-auto text-center mb-14">
          <h2 class="font-serif text-2xl md:text-3xl text-[#0C2619] mb-5">Resultados reales, transformaciones increíbles: tu camino a la cirugía plástica con financiación asequible</h2>
          <p class="text-gray-700 font-light leading-relaxed">En nuestra galería de «Antes y después» te mostramos cómo la cirugía plástica puede cambiar vidas. Cada imagen cuenta una historia de transformación personal, respaldada por la confianza y experiencia de los mejores cirujanos. Sin embargo, sabemos que alcanzar estos resultados no es solo una cuestión de deseo, sino también de acceso.</p>
        </section>

        <div v-if="cases.length" class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <article v-for="c in cases" :key="c.id" class="bg-white border border-[#e5e2e1]">
            <div class="grid grid-cols-2">
              <figure class="relative aspect-[3/4] bg-gray-100">
                <img :src="c.beforeImage" :alt="`Antes: ${c.title}`" class="w-full h-full object-cover" />
                <figcaption class="absolute bottom-0 left-0 bg-black/70 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1">Antes</figcaption>
              </figure>
              <figure class="relative aspect-[3/4] bg-gray-100">
                <img :src="c.afterImage" :alt="`Después: ${c.title}`" class="w-full h-full object-cover" />
                <figcaption class="absolute bottom-0 left-0 bg-[#0C2619] text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1">Después</figcaption>
              </figure>
            </div>
            <div v-if="c.title || c.description" class="p-6">
              <h3 v-if="c.title" class="font-serif text-xl text-black mb-2">{{ c.title }}</h3>
              <p v-if="c.description" class="text-sm text-gray-600 font-light leading-relaxed">{{ c.description }}</p>
            </div>
          </article>
        </div>
        <p v-else-if="loaded" class="text-center text-gray-500 font-light py-16 border border-dashed border-gray-300">
          Pronto compartiremos aquí los resultados de nuestros pacientes.
        </p>


        <section v-if="instagram.length" class="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          <NewsInstagramEmbed v-for="post in instagram" :key="post.id" :url="post.url" class="!my-0" />
        </section>

        <section class="mt-20 space-y-10 text-gray-700 font-light leading-relaxed max-w-4xl mx-auto">
          <div>
            <h2 class="font-bold text-black text-lg mb-3">Financiación flexible para lograr el cambio que deseas</h2>
            <p>Entendemos que el costo de una cirugía plástica puede ser un obstáculo para muchos. Por eso, en Planmed ofrecemos opciones de financiación que se adaptan a tus necesidades, permitiéndote cubrir más del 50% del valor total del procedimiento. Además, puedes elegir pagar en cuotas de hasta 72 meses, facilitando el acceso a la transformación que siempre has querido sin comprometer tu estabilidad financiera.</p>
          </div>
          <div>
            <h2 class="font-bold text-black text-lg mb-3">Por qué elegirnos</h2>
            <p>Con más de 15 años de experiencia y más de 7,000 pacientes satisfechos en todo el país, Planmed no solo te ofrece resultados excepcionales, sino también el respaldo financiero que necesitas para hacer realidad tus sueños. Nuestras soluciones están diseñadas para adaptarse a diferentes perfiles, incluyendo empleados, independientes, pensionados y extranjeros, asegurando que todos tengan la oportunidad de cambiar su vida.</p>
          </div>
          <div>
            <h2 class="font-bold text-black text-lg mb-3">Da el primer paso hoy</h2>
            <p class="mb-6">Explora nuestra galería de «Antes y después» y visualiza cómo podría ser tu transformación. Contáctanos para una consulta y descubre cómo nuestra financiación flexible puede ayudarte a alcanzar tus objetivos estéticos.</p>
            <NuxtLink to="/financiacion#calculadora" class="inline-block px-6 py-3 text-[11px] font-bold tracking-[0.15em] uppercase bg-[#0C2619] text-white border border-[#0C2619] hover:bg-black transition-colors">
              Simular financiación
            </NuxtLink>
          </div>
        </section>

        <p class="mt-10 text-xs text-gray-500 font-light text-center max-w-2xl mx-auto">
          Los resultados varían según cada paciente. Toda cirugía requiere valoración médica previa.
        </p>

        <TestimonialsSocial />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSeoMeta } from '#imports'
import { publicTestimonialsService } from '~/services/PublicTestimonialsService'

// Se lee de Wellezy Hub (vía Nitro) también en el servidor. Hub solo entrega casos publicados con ambas imágenes.
const { data, status, error, refresh } = await useAsyncData('patient-section', () => publicTestimonialsService.getContent())
useServiceUnavailable(error)
const cases = computed(() => data.value?.beforeAfter ?? [])
const instagram = computed(() => data.value?.instagram ?? [])
const visibility = computed(() => data.value?.visibility.beforeAfter ?? true)
const loaded = computed(() => status.value === 'success' || status.value === 'error')

const description = 'Mira el antes y después de pacientes que financiaron su cirugía plástica con Planmed.'
useSeoMeta({ title: 'Antes y después | Planmed', description, ogTitle: 'Antes y después | Planmed', ogDescription: description })
</script>

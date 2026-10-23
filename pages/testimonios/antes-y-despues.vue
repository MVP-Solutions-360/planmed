<template>
  <div class="bg-[#fcf9f8] min-h-screen font-sans selection:bg-[#0C2619] selection:text-white pt-6 md:pt-10 pb-24">
    <div class="max-w-[1200px] mx-auto px-6">
      <CommonPageHero
        eyebrow="RESULTADOS REALES"
        :lines="['ANTES', 'Y DESPUÉS.']"
        lead="Cada imagen cuenta una historia de transformación personal, respaldada por la experiencia de los mejores cirujanos y por una financiación a tu medida."
      />
      <TestimonialsNav />

      <CommonHubUnavailable v-if="error" :retrying="status === 'pending'" @retry="refresh()" />

      <p v-else-if="loaded && !visibility" class="text-center text-gray-500 font-light py-16 border border-dashed border-gray-300 bg-white">
        Esta sección no está disponible por el momento.
      </p>

      <template v-else-if="visibility">
        <div v-if="cases.length" class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
          <article v-for="c in cases" :key="c.id" class="group bg-white border border-[#e5e2e1] hover:shadow-xl transition-shadow duration-300">
            <div class="grid grid-cols-2 gap-px bg-[#e5e2e1]">
              <figure class="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                <img :src="c.beforeImage" :alt="`Antes: ${c.title}`" class="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-700" />
                <figcaption class="absolute bottom-0 left-0 bg-black/75 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.5">Antes</figcaption>
              </figure>
              <figure class="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                <img :src="c.afterImage" :alt="`Después: ${c.title}`" class="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-700" />
                <figcaption class="absolute bottom-0 left-0 bg-[#0C2619] text-[#D3A76A] text-[10px] font-bold tracking-widest uppercase px-3 py-1.5">Después</figcaption>
              </figure>
            </div>
            <div v-if="c.title || c.description" class="p-8">
              <h3 v-if="c.title" class="font-serif text-2xl font-medium text-black mb-3 leading-snug">{{ c.title }}</h3>
              <p v-if="c.description" class="text-sm text-gray-600 font-light leading-relaxed">{{ c.description }}</p>
            </div>
          </article>
        </div>
        <p v-else-if="loaded && !instagram.length" class="text-center text-gray-500 font-light py-16 border border-dashed border-gray-300 bg-white">
          Pronto compartiremos aquí los resultados de nuestros pacientes.
        </p>

        <!-- Todas las tarjetas miden lo mismo (la fila toma la más alta), se renderice o no el post de Instagram. -->
        <section v-if="instagram.length" class="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="post in instagram" :key="post.id" class="flex items-start justify-center min-h-[620px] bg-white shadow-[0_0_1px_0_rgba(0,0,0,0.5),0_1px_10px_0_rgba(0,0,0,0.08)]">
            <NewsInstagramEmbed :url="post.url" class="!my-0" />
          </div>
        </section>

        <section class="mt-20 border-t border-black pt-10">
          <p class="text-[11px] font-bold tracking-[0.15em] text-[#848484] uppercase mb-4">Tu camino a la cirugía plástica</p>
          <h2 class="font-serif text-3xl md:text-4xl font-medium leading-tight text-black mb-5 max-w-4xl">Resultados reales, transformaciones increíbles, con financiación asequible</h2>
          <p class="text-gray-600 font-light leading-relaxed text-lg max-w-3xl mb-12">En nuestra galería de «Antes y después» te mostramos cómo la cirugía plástica puede cambiar vidas. Sabemos que alcanzar estos resultados no es solo una cuestión de deseo, sino también de acceso.</p>

          <div class="grid md:grid-cols-2 gap-8">
            <div class="bg-white border border-[#e5e2e1] border-t-4 border-t-[#D3A76A] p-8 md:p-10">
              <h3 class="font-serif text-2xl font-medium text-[#0C2619] mb-4">Financiación flexible para lograr el cambio que deseas</h3>
              <p class="text-gray-600 font-light leading-relaxed">Entendemos que el costo de una cirugía plástica puede ser un obstáculo para muchos. Por eso, en Planmed ofrecemos opciones de financiación que se adaptan a tus necesidades, permitiéndote cubrir más del 50% del valor total del procedimiento. Además, puedes elegir pagar en cuotas de hasta 72 meses, facilitando el acceso a la transformación que siempre has querido sin comprometer tu estabilidad financiera.</p>
            </div>
            <div class="bg-white border border-[#e5e2e1] border-t-4 border-t-[#D3A76A] p-8 md:p-10">
              <h3 class="font-serif text-2xl font-medium text-[#0C2619] mb-4">Por qué elegirnos</h3>
              <p class="text-gray-600 font-light leading-relaxed">Con más de 15 años de experiencia y más de 7,000 pacientes satisfechos en todo el país, Planmed no solo te ofrece resultados excepcionales, sino también el respaldo financiero que necesitas para hacer realidad tus sueños. Nuestras soluciones están diseñadas para adaptarse a diferentes perfiles, incluyendo empleados, independientes, pensionados y extranjeros, asegurando que todos tengan la oportunidad de cambiar su vida.</p>
            </div>
          </div>
        </section>

        <section class="mt-8 bg-[#0C2619] text-white px-6 py-12 md:px-14 md:py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div class="max-w-2xl">
            <h2 class="font-serif text-2xl md:text-3xl font-medium leading-tight mb-3">Da el primer paso hoy</h2>
            <p class="text-white/80 font-light leading-relaxed">Explora nuestra galería y visualiza cómo podría ser tu transformación. Contáctanos para una consulta y descubre cómo nuestra financiación flexible puede ayudarte a alcanzar tus objetivos estéticos.</p>
          </div>
          <NuxtLink to="/financiacion#calculadora" class="shrink-0 self-start md:self-center px-8 py-4 text-[11px] font-bold tracking-[0.15em] uppercase bg-[#D3A76A] text-[#0C2619] border border-[#D3A76A] hover:bg-white hover:border-white transition-colors">
            Simular financiación
          </NuxtLink>
        </section>

        <p class="mt-8 text-xs text-gray-500 font-light text-center max-w-2xl mx-auto">
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

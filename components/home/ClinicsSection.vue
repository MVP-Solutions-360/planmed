<template>
  <section class="py-24 md:py-32 px-6 bg-[#fcf9f8] border-t border-[#e5e2e1]">
    <div class="max-w-[1200px] mx-auto">
      
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-16 md:mb-24">
        <div class="max-w-2xl">
          <p class="text-[11px] font-bold tracking-[0.15em] text-[#848484] uppercase mb-6">INSTITUCIONES Y PROFESIONALES</p>
          <h2 class="font-serif text-[40px] md:text-[56px] font-medium leading-[1.05] tracking-[-0.02em] text-black uppercase">
            RED MÉDICA ALIADA
          </h2>
          <div class="w-12 h-[1px] bg-[#0C2619] mt-8"></div>
        </div>
        <div class="lg:w-1/3 lg:pb-4">
          <p class="text-[14px] text-[#4c4546] font-normal leading-[1.6]">
            Puedes financiar tu procedimiento con Planmed a través de nuestra red de instituciones médicas aliadas en Medellín, Cali y Barranquilla. Atendemos pacientes de cualquier parte del mundo.
          </p>
        </div>
      </div>

      <!-- Clínicas administradas (/admin/paginas/clinicas-aliadas): imagen principal + nombre, con enlace a su tarjeta -->
      <ul v-if="managed.length" class="grid grid-cols-2 lg:grid-cols-5 border-t border-l border-[#e5e2e1]" data-testid="home-clinics">
        <li v-for="(clinic, index) in managed" :key="clinic.id" class="border-b border-r border-[#e5e2e1]">
          <NuxtLink
            :to="`/clinicas-aliadas#${clinic.id}`"
            class="group relative h-full min-h-[14rem] flex flex-col items-center justify-center gap-4 p-6 hover:bg-white transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0C2619]"
          >
            <span class="absolute top-4 left-5 text-[10px] font-bold tracking-widest text-[#cfc4c5] group-hover:text-[#0C2619] transition-colors" aria-hidden="true">
              {{ String(index + 1).padStart(2, '0') }}
            </span>
            <img :src="clinic.image" :alt="`Imagen de ${clinic.name}`" loading="lazy" class="w-full max-w-[160px] h-24 object-contain group-hover:scale-105 transition-transform duration-500 ease-out" />
            <span class="text-[11px] font-bold tracking-[0.1em] uppercase text-[#4c4546] group-hover:text-[#0C2619] text-center leading-snug break-words">{{ clinic.name }}</span>
          </NuxtLink>
        </li>
      </ul>

      <!-- Respaldo mientras no haya clínicas administradas: logos históricos (sin enlace), como antes -->
      <div v-else class="grid grid-cols-2 lg:grid-cols-5 border-t border-l border-[#e5e2e1]">
        <div
          v-for="(clinic, index) in clinics"
          :key="clinic.id"
          class="group relative aspect-square lg:aspect-auto lg:h-56 border-b border-r border-[#e5e2e1] flex flex-col items-center justify-center p-8 hover:bg-white transition-colors"
        >
          <span class="absolute top-4 left-5 text-[10px] font-bold tracking-widest text-[#e5e2e1] group-hover:text-[#0C2619] transition-colors">
            0{{ index + 1 }}
          </span>
          <img
            :src="clinic.logo"
            :alt="clinic.name"
            class="max-w-[70%] max-h-[50%] object-contain grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 ease-out"
          />
        </div>
      </div>

    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useFetch } from '#imports'
import { clinics } from '~/data/clinics'

// Clínicas administradas desde /admin/paginas/clinicas-aliadas (misma clave de caché que la página /clinicas-aliadas).
const { data } = await useFetch('/api/public/clinics', { key: 'clinics-public', default: () => ({ clinics: [], updatedAt: '' }) })
const managed = computed(() => data.value?.clinics ?? [])
</script>

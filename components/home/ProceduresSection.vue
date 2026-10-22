<template>
  <section class="bg-white py-24 md:py-32 px-6">
    <div class="max-w-[1200px] mx-auto">
      
      <!-- Encabezado de la sección -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 md:mb-24 border-t border-[#0C2619] pt-8">
        <div class="max-w-xl">
          <p class="text-[11px] font-bold tracking-[0.15em] text-[#848484] uppercase mb-6 flex items-center gap-3">
             <span class="w-2 h-2 rounded-full bg-[#0C2619]"></span>
             PORTAFOLIO MÉDICO
          </p>
          <h2 class="font-serif text-[40px] md:text-[56px] lg:text-[64px] font-medium leading-[1.05] tracking-[-0.02em] text-[#0C2619] uppercase mb-4">
            PROCEDIMIENTOS<br/>
            DESTACADOS.
          </h2>
          <p class="text-[14px] text-[#4c4546] font-medium">Estamos ampliando progresivamente nuestra oferta de procedimientos financiables.</p>
        </div>
        <div class="hidden md:block">
          <NuxtLink :to="'/procedimientos'" class="text-[11px] font-bold tracking-[0.15em] text-[#0C2619] border-b border-[#0C2619] pb-2 uppercase hover:text-[#848484] hover:border-[#848484] transition-colors">
            VER TODOS LOS PROCEDIMIENTOS
          </NuxtLink>
        </div>
      </div>

      <!-- Cuadrícula editorial (staggered grid en desktop) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-24 gap-y-16">
        <HomeProcedureCard 
          v-for="(proc, index) in featured" 
          :key="proc.id" 
          :procedure="proc"
          :class="{ 'md:mt-24': index % 2 !== 0 }"
        />
      </div>

      <div class="mt-16 text-center border-t border-[#e5e2e1] pt-12">
        <NuxtLink
          :to="'/procedimientos'"
          class="inline-flex bg-[#0C2619] text-white px-10 py-5 text-xs font-bold tracking-[0.15em] uppercase hover:bg-black transition-colors"
          data-testid="home-all-procedures"
        >
          Ver todos los procedimientos
        </NuxtLink>
      </div>

    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useAsyncData } from '#imports'
import { publicProcedureService } from '~/services/PublicProcedureService'

const { data: procedures } = await useAsyncData('home-procedures', () => publicProcedureService.getProcedures(), {
  default: () => []
})

// Solo 4 en la home: primero los destacados y, si faltan, se completan con los demás en el orden de la API.
const HOME_LIMIT = 4
const featured = computed(() => {
  const all = procedures.value ?? []
  return [...all.filter(p => p.destacado), ...all.filter(p => !p.destacado)].slice(0, HOME_LIMIT)
})
</script>

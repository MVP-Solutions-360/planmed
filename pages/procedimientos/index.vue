<template>
  <div class="bg-[#fcf9f8] min-h-screen font-sans selection:bg-[#0C2619] selection:text-white pt-24 md:pt-32 pb-24">
    <div class="max-w-[1200px] mx-auto px-6">
      
      <!-- HEADER EDITORIAL -->
      <div class="mb-16 md:mb-24 text-center md:text-left border-t border-black pt-8">
        <p class="text-[11px] font-bold tracking-[0.15em] text-[#848484] uppercase mb-4 flex items-center justify-center md:justify-start gap-3">
          <span class="w-2 h-2 rounded-full bg-[#0C2619]"></span>
          PORTAFOLIO MÉDICO
        </p>
        <h1 class="font-serif text-[40px] md:text-[56px] lg:text-[72px] font-medium leading-[1.05] tracking-[-0.02em] text-black uppercase max-w-4xl">
          NUESTROS<br/>
          PROCEDIMIENTOS.
        </h1>
        <p class="mt-8 text-lg text-gray-600 font-light max-w-2xl leading-relaxed mx-auto md:mx-0">
          Explora los tratamientos estéticos disponibles y descubre cómo podemos ayudarte a financiarlos sin comprometer tu estilo de vida.
        </p>
      </div>

      <!-- Hub caído: aviso con reintento (no un catálogo vacío). Lista vacía válida => cuadrícula vacía. -->
      <CommonHubUnavailable v-if="error" :retrying="status === 'pending'" @retry="refresh()" />

      <!-- Buscador y filtros por tipo de procedimiento -->
      <template v-else>
      <div class="mb-12 flex flex-col gap-6" data-testid="procedure-filters">
        <div class="relative max-w-xl">
          <label for="procedure-search" class="sr-only">Buscar procedimientos</label>
          <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#848484]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" /></svg>
          <input
            id="procedure-search"
            v-model="query"
            type="search"
            autocomplete="off"
            placeholder="Buscar por palabra clave (p. ej. abdomen, busto, grasa)"
            class="w-full pl-11 pr-4 py-3 bg-white border border-[#e5e2e1] focus:outline-none focus:border-[#0C2619] text-sm"
          />
        </div>
        <div v-if="categories.length > 1" class="flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo de procedimiento">
          <button
            v-for="c in [{ value: '', label: 'Todos' }, ...categories]"
            :key="c.value || 'todos'"
            type="button"
            class="px-5 py-2 text-[11px] font-bold tracking-[0.15em] uppercase border transition-colors"
            :class="category === c.value ? 'bg-[#0C2619] text-white border-[#0C2619]' : 'bg-white text-[#0C2619] border-[#e5e2e1] hover:border-[#0C2619]'"
            :aria-pressed="category === c.value"
            @click="category = c.value"
          >
            {{ c.label }}
          </button>
        </div>
        <p class="text-xs text-[#848484]" aria-live="polite">
          {{ filtered.length }} {{ filtered.length === 1 ? 'procedimiento' : 'procedimientos' }}
        </p>
      </div>

      <div v-if="cirugias.length && !filtered.length" class="mb-24 py-16 text-center border border-[#e5e2e1]" data-testid="procedure-empty">
        <p class="font-serif text-2xl text-black mb-2">No encontramos procedimientos con esa búsqueda.</p>
        <button type="button" class="text-[11px] font-bold tracking-[0.15em] uppercase text-[#0C2619] border-b border-[#0C2619] pb-1" @click="query = ''; category = ''">Limpiar filtros</button>
      </div>

      <!-- CATÁLOGO GRID -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 mb-24">
        
        <NuxtLink 
          v-for="proc in filtered" 
          :key="proc.slug" 
          :to="`/procedimientos/${proc.slug}`" 
          class="group cursor-pointer flex flex-col h-full"
        >
          <!-- Contenedor Imagen -->
          <div class="relative w-full overflow-hidden bg-gray-200 mb-6" :class="proc.imageOrientation === 'horizontal' ? 'aspect-video' : 'aspect-[9/16]'">
            <img 
              v-if="proc.image"
              :src="proc.image" 
              :alt="proc.name" 
              class="w-full h-full object-contain transition-all duration-700 ease-out group-hover:scale-105"
            />
            <div v-else class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-sm">
              Sin imagen
            </div>
          </div>
          
          <!-- Contenido -->
          <div class="flex-grow flex flex-col">
            <div class="text-[10px] font-bold tracking-widest text-[#848484] uppercase mb-2">
              {{ proc.category || 'Procedimiento' }}
            </div>
            <h3 class="font-serif text-2xl lg:text-3xl font-medium text-black mb-3 group-hover:text-[#0C2619] transition-colors">
              {{ proc.name }}
            </h3>
            <p class="text-gray-600 text-sm leading-relaxed font-light mb-6 flex-grow">
              {{ proc.shortDescription }}
            </p>
            <div class="inline-flex items-center text-xs font-bold tracking-widest uppercase text-black group-hover:text-[#0C2619] transition-colors border-b border-transparent group-hover:border-[#0C2619] pb-1 self-start">
              Conocer más
            </div>
          </div>
        </NuxtLink>

      </div>
      </template>

      <!-- CTA FINAL FINANCIACIÓN -->
      <div class="bg-[#0C2619] text-white rounded-none p-12 md:p-24 flex flex-col md:flex-row items-center justify-between gap-12">
        <div class="max-w-xl text-center md:text-left">
          <p class="text-[11px] font-bold tracking-[0.15em] text-white/60 uppercase mb-4">
            TU PRÓXIMA ETAPA
          </p>
          <h2 class="font-serif text-3xl md:text-5xl font-medium leading-[1.1] tracking-[-0.02em] mb-6">
            DISEÑA TU PLAN DE PAGO
          </h2>
          <p class="text-white/80 font-light leading-relaxed">
            ¿Ya sabes qué procedimiento deseas? Utiliza nuestro simulador para estructurar cuotas que se adapten a tu capacidad financiera.
          </p>
        </div>
        <NuxtLink to="/financiacion#calculadora" class="flex-shrink-0 bg-white text-[#0C2619] px-10 py-5 font-bold text-xs tracking-widest uppercase hover:bg-gray-100 transition-colors active:scale-95 text-center w-full md:w-auto">
          Ir al Simulador
        </NuxtLink>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useSeoMeta, useHead, useSiteConfig } from '#imports'
import { useAsyncData } from '#imports'
import { publicProcedureService } from '~/services/PublicProcedureService'

const { data: cirugias, error, refresh, status } = await useAsyncData('procedures', () => publicProcedureService.getProcedures(), {
  default: () => []
})
useServiceUnavailable(error)

// Buscador y filtro por tipo: todo en el cliente sobre la lista que ya llega de Hub (no se duplica ni se guarda información).
const query = ref('')
const category = ref('')
const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const categoryLabel = (slug) => { const t = String(slug).replace(/[-_]+/g, ' ').trim(); return t ? t.charAt(0).toUpperCase() + t.slice(1) : '' }

// Tipos disponibles = los que traen los procedimientos cargados (corporal, facial, …); sin categoría no genera filtro.
const categories = computed(() => [...new Set((cirugias.value ?? []).map(p => p.category).filter(Boolean))]
  .sort((a, b) => a.localeCompare(b, 'es'))
  .map(value => ({ value, label: categoryLabel(value) })))

const filtered = computed(() => {
  const words = fold(query.value).split(/\s+/).filter(Boolean)
  return (cirugias.value ?? []).filter((p) => {
    if (category.value && p.category !== category.value) return false
    const hay = fold(`${p.name} ${p.shortDescription} ${p.category}`)
    return words.every(w => hay.includes(w))
  })
})

useSeoMeta({
  title: 'Procedimientos | Planmed',
  description: 'Explora nuestro portafolio de procedimientos estéticos y descubre cómo financiarlos con Planmed.',
  ogTitle: 'Procedimientos | Planmed',
  ogDescription: 'Explora nuestro portafolio de procedimientos estéticos y descubre cómo financiarlos con Planmed.',
  ogImage: '/images/branding/logo_fondo_transparente.png',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterImage: '/images/branding/logo_fondo_transparente.png'
})

useHead({
  link: [
    { rel: 'canonical', href: `${String(useSiteConfig().url ?? '').replace(/\/+$/, '')}/procedimientos` }
  ]
})
</script>

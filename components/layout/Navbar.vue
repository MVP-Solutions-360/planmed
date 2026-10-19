<template>
  <nav class="w-full bg-[#fcf9f8] border-b border-[#e5e2e1] sticky top-0 z-50" aria-label="Menú principal" @keydown.esc="closeMenu(true)">
    <div class="max-w-[1440px] mx-auto px-6 h-[88px] flex justify-between items-center">
      
      <!-- Logo -->
      <NuxtLink :to="'/'" class="block">
        <img src="/images/branding/logo.jpg" alt="Planmed" class="h-10 md:h-14 lg:h-16 w-auto object-contain" />
      </NuxtLink>

      <!-- Men Desktop -->
      <div class="hidden min-[1360px]:flex items-center gap-4 min-[1440px]:gap-8">
        <NuxtLink :to="'/'" class="text-[11px] font-bold tracking-[0.1em] text-black border-b-2 border-black pb-1 uppercase">INICIO</NuxtLink>
        <div v-if="procedureItems.length" class="relative group" data-testid="procedures-menu" @focusin="openMenu = 'PROCEDIMIENTOS'" @focusout="openMenu = null">
          <NuxtLink to="/procedimientos" aria-haspopup="true" :aria-expanded="openMenu === 'PROCEDIMIENTOS' ? 'true' : 'false'" class="text-[11px] font-bold tracking-[0.1em] text-[#4c4546] group-hover:text-black transition-colors uppercase flex items-center gap-1 whitespace-nowrap">
            PROCEDIMIENTOS
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
          </NuxtLink>
          <div class="absolute left-0 top-full pt-4 hidden group-hover:block" :class="{ '!block': openMenu === 'PROCEDIMIENTOS' }">
            <div class="bg-white shadow-lg border border-[#e5e2e1] py-2 w-[280px] max-h-[min(70vh,calc(100dvh-120px))] overflow-y-auto overscroll-contain" data-testid="procedures-list">
              <NuxtLink to="/procedimientos" class="block px-6 py-3 text-[11px] font-bold tracking-[0.1em] text-[#0C2619] hover:bg-[#fcf9f8] uppercase transition-colors border-b border-[#e5e2e1]">Ver todos</NuxtLink>
              <NuxtLink v-for="item in procedureItems" :key="item.to" :to="item.to" class="block px-6 py-3 text-[11px] font-bold tracking-[0.1em] text-[#4c4546] hover:text-black hover:bg-[#fcf9f8] uppercase transition-colors">{{ item.label }}</NuxtLink>
            </div>
          </div>
        </div>
        <NuxtLink v-else to="/procedimientos" class="text-[11px] font-bold tracking-[0.1em] text-[#4c4546] hover:text-black transition-colors uppercase">PROCEDIMIENTOS</NuxtLink>
        <NuxtLink to="/noticias" class="text-[11px] font-bold tracking-[0.1em] text-[#4c4546] hover:text-black transition-colors uppercase">NOTICIAS</NuxtLink>

        <!-- PLANMED: Nosotros, páginas institucionales y Recursos en un solo desplegable -->
        <div class="relative group" data-testid="planmed-menu" @focusin="openMenu = 'PLANMED'" @focusout="openMenu = null">
          <button type="button" aria-haspopup="true" :aria-expanded="openMenu === 'PLANMED' ? 'true' : 'false'" class="text-[11px] font-bold tracking-[0.1em] text-[#4c4546] group-hover:text-black transition-colors uppercase flex items-center gap-1 whitespace-nowrap">
            PLANMED
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div class="absolute left-0 top-full pt-4 hidden group-hover:block" :class="{ '!block': openMenu === 'PLANMED' }">
            <div class="bg-white shadow-lg border border-[#e5e2e1] py-2 w-[280px]" data-testid="planmed-list">
              <NuxtLink v-for="item in planmedItems" :key="item.to" :to="item.to" class="block px-6 py-3 text-[11px] font-bold tracking-[0.1em] text-[#4c4546] hover:text-black hover:bg-[#fcf9f8] uppercase transition-colors leading-snug">{{ item.label }}</NuxtLink>
            </div>
          </div>
        </div>


        <div v-for="menu in menus" :key="menu.label" class="relative group" @focusin="openMenu = menu.label" @focusout="openMenu = null">
          <NuxtLink :to="menu.items[0]?.to || menu.to" class="text-[11px] font-bold tracking-[0.1em] text-[#4c4546] group-hover:text-black transition-colors uppercase flex items-center gap-1 whitespace-nowrap">
            {{ menu.label }}
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
          </NuxtLink>
          <div v-if="menu.items.length" class="absolute left-0 top-full pt-4 hidden group-hover:block" :class="{ '!block': openMenu === menu.label }">
            <div class="bg-white shadow-lg border border-[#e5e2e1] py-2 min-w-[240px] max-w-[300px]">
              <template v-for="item in menu.items" :key="item.to">
                <div v-if="item.children" class="relative group/sub">
                  <NuxtLink :to="item.to" class="block px-6 py-3 text-[11px] font-bold tracking-[0.1em] text-[#4c4546] hover:text-black hover:bg-[#fcf9f8] uppercase transition-colors flex items-center justify-between gap-3">
                    {{ item.label }}
                    <svg class="w-3 h-3 shrink-0" :class="menu.flip ? 'rotate-90' : '-rotate-90'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
                  </NuxtLink>
                  <div class="absolute top-0 hidden group-hover/sub:block group-focus-within/sub:block" :class="menu.flip ? 'right-full' : 'left-full'">
                    <div class="bg-white shadow-lg border border-[#e5e2e1] py-2 w-[280px] max-h-[70vh] overflow-y-auto">
                      <NuxtLink v-for="child in item.children" :key="child.to" :to="child.to" class="block px-6 py-3 text-[11px] font-bold tracking-[0.1em] text-[#4c4546] hover:text-black hover:bg-[#fcf9f8] uppercase transition-colors">{{ child.label }}</NuxtLink>
                    </div>
                  </div>
                </div>
                <NuxtLink v-else :to="item.to" class="block px-6 py-3 text-[11px] font-bold tracking-[0.1em] text-[#4c4546] hover:text-black hover:bg-[#fcf9f8] uppercase transition-colors">{{ item.label }}</NuxtLink>
              </template>
            </div>
          </div>
        </div>
        
        <NuxtLink to="/financiacion#calculadora" class="bg-[#0C2619] text-white px-4 py-2.5 font-bold text-[10px] tracking-[0.15em] uppercase hover:bg-black transition-colors rounded-[2px] shadow-sm ml-4 border border-[#0C2619]">
          SIMULAR FINANCIACIÓN
        </NuxtLink>
        
        <NuxtLink to="/admin/login" class="text-[11px] font-bold tracking-[0.1em] text-[#0C2619] hover:text-black transition-colors uppercase ml-4 flex items-center gap-1 border border-[#0C2619] px-3 py-2 rounded-[2px]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
          INICIAR SESIÓN
        </NuxtLink>
      </div>

      <!-- Botón hamburguesa (tablet y móvil) -->
      <button
        ref="menuButton"
        type="button"
        class="min-[1360px]:hidden p-2 -mr-2 text-[#1c1b1b]"
        :aria-expanded="isMobileMenuOpen ? 'true' : 'false'"
        aria-controls="mobile-menu"
        :aria-label="isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
      >
        <svg v-if="!isMobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>

    <!-- Menú móvil/tablet: scroll interno, sin desbordes; los desplegables son <details> accesibles -->
    <div
      v-if="isMobileMenuOpen"
      id="mobile-menu"
      class="min-[1360px]:hidden absolute top-[88px] left-0 w-full max-h-[calc(100dvh-88px)] overflow-y-auto overflow-x-hidden overscroll-contain bg-[#fcf9f8] border-b border-[#cfc4c5] shadow-lg z-[100]"
    >
      <div class="mx-auto w-full max-w-[520px] px-6 py-6 flex flex-col text-center">
        <template v-for="link in mainLinks" :key="link.to">
          <details v-if="link.to === '/procedimientos' && procedureItems.length" class="group border-t border-[#e5e2e1]">
            <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer py-3.5 flex items-center justify-center gap-2 text-[#4c4546] font-bold text-sm tracking-widest uppercase select-none">
              <span class="break-words">{{ link.label }}</span>
              <svg class="w-3 h-3 shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
            </summary>
            <div class="flex flex-col pb-2 max-h-[50dvh] overflow-y-auto overscroll-contain" data-testid="procedures-list-mobile">
              <NuxtLink to="/procedimientos" @click="closeMenu" class="py-2.5 text-[#0C2619] font-bold text-[11px] tracking-widest uppercase underline underline-offset-4 break-words">Ver todos</NuxtLink>
              <NuxtLink v-for="item in procedureItems" :key="item.to" :to="item.to" @click="closeMenu" class="py-2.5 text-[#4c4546] font-medium text-xs tracking-widest uppercase break-words">{{ item.label }}</NuxtLink>
            </div>
          </details>
          <NuxtLink v-else :to="link.to" @click="closeMenu" class="py-3.5 text-[#4c4546] font-bold text-sm tracking-widest uppercase break-words">{{ link.label }}</NuxtLink>
        </template>

        <!-- Planmed -->
        <details class="group border-t border-[#e5e2e1]" data-testid="planmed-menu-mobile">
          <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer py-3.5 flex items-center justify-center gap-2 text-[#4c4546] font-bold text-sm tracking-widest uppercase select-none">
            <span>Planmed</span>
            <svg class="w-3 h-3 shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
          </summary>
          <div class="flex flex-col pb-2">
            <NuxtLink v-for="item in planmedItems" :key="item.to" :to="item.to" @click="closeMenu" class="py-2.5 text-[#4c4546] font-medium text-xs tracking-widest uppercase break-words">{{ item.label }}</NuxtLink>
          </div>
        </details>

        <!-- Nuestros pacientes / Recomendaciones -->
        <details v-for="menu in menus" :key="menu.label" class="group border-t border-[#e5e2e1] first-of-type:mt-2">
          <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer py-3.5 flex items-center justify-center gap-2 text-[#4c4546] font-bold text-sm tracking-widest uppercase select-none">
            <span class="break-words">{{ menu.label }}</span>
            <svg class="w-3 h-3 shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
          </summary>
          <div class="flex flex-col pb-2">
            <template v-for="item in menu.items" :key="item.to">
              <details v-if="item.children" class="group/sub">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer py-3 flex items-center justify-center gap-2 text-[#4c4546] font-bold text-xs tracking-widest uppercase select-none">
                  <span class="break-words">{{ item.label }}</span>
                  <svg class="w-3 h-3 shrink-0 transition-transform group-open/sub:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div class="flex flex-col pb-2">
                  <NuxtLink :to="item.to" @click="closeMenu" class="py-2.5 text-[#0C2619] font-bold text-[11px] tracking-widest uppercase underline underline-offset-4 break-words">Ver todo</NuxtLink>
                  <NuxtLink v-for="child in item.children" :key="child.to" :to="child.to" @click="closeMenu" class="py-2.5 text-[#4c4546] font-medium text-xs tracking-widest uppercase break-words">{{ child.label }}</NuxtLink>
                </div>
              </details>
              <NuxtLink v-else :to="item.to" @click="closeMenu" class="py-3 text-[#4c4546] font-bold text-xs tracking-widest uppercase break-words">{{ item.label }}</NuxtLink>
            </template>
          </div>
        </details>

        <NuxtLink to="/financiacion#calculadora" @click="closeMenu" class="bg-[#0C2619] text-white px-8 py-3.5 mt-6 font-bold text-xs tracking-widest uppercase shadow-md border border-[#0C2619]">
          SIMULAR FINANCIACIÓN
        </NuxtLink>
        <NuxtLink to="/admin/login" @click="closeMenu" class="mt-4 text-[#0C2619] font-bold text-xs tracking-widest uppercase border border-[#0C2619] px-8 py-3.5 flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
          INICIAR SESIÓN
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useAsyncData } from '#imports'
import { publicTestimonialsService } from '~/services/PublicTestimonialsService'
import { publicRecommendationsService } from '~/services/PublicRecommendationsService'
import { publicProcedureService } from '~/services/PublicProcedureService'
import { buildMenus, buildProcedureMenu } from '~/utils/navMenus'

const isMobileMenuOpen = ref(false)
const openMenu = ref(null)
const menuButton = ref(null)

const mainLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/procedimientos', label: 'Procedimientos' },
  { to: '/noticias', label: 'Noticias' }
]

// Desplegable «Planmed» (escritorio y móvil). Las páginas informativas viven en pages/*.vue; Recursos se movió aquí desde el menú principal.
const planmedItems = [
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/quienes-somos', label: '¿Quiénes somos?' },
  { to: '/servicios', label: 'Servicios' },
  { to: '/clinicas-aliadas', label: 'Clínicas aliadas' },
  { to: '/estudio-de-creditos', label: 'Estudio de créditos' },
  { to: '/informacion-precontractual', label: 'Información precontractual y advertencias al consumidor' },
  { to: '/politica-datos-personales', label: 'Políticas y protección de datos personales' },
  { to: '/recursos', label: 'Recursos' }
]

// Cierra el menú móvil (al navegar, con Escape o al volver a escritorio) y, con Escape, devuelve el foco al botón.
function closeMenu(restoreFocus = false) {
  isMobileMenuOpen.value = false
  if (restoreFocus === true) menuButton.value?.focus()
}

// Visibilidad de "Nuestros Pacientes" desde Wellezy Hub (SSR). Misma clave que las páginas /testimonios*: una sola petición por
// navegación y el menú ya sale correcto en el servidor. Si Hub falla, se muestran todas las entradas (comportamiento por defecto).
const { data: patientSection, refresh: refreshPatientSection } = useAsyncData('patient-section', () => publicTestimonialsService.getContent())

// Menú de recomendaciones desde Wellezy Hub (SSR): SOLO el árbol vigente de temas con sus subtemas publicados (API pública
// `recommendation-topics`). La lista de procedimientos se pide aparte únicamente para el desplegable de Procedimientos. Si Hub no
// responde, el menú queda sin esa sección (nunca se rellena con una fuente heredada).
const { data: hubMenu, refresh: refreshHubMenu } = useAsyncData('nav-recommendations', async () => {
  // Independientes: si falla una de las listas no se pierde la otra.
  const [procedures, topics] = await Promise.allSettled([publicProcedureService.getProcedures(), publicRecommendationsService.getTopics()])
  return {
    procedures: procedures.status === 'fulfilled' ? procedures.value : [],
    topics: topics.status === 'fulfilled' ? topics.value : []
  }
}, { default: () => ({ procedures: [], topics: [] }) })

// La construcción de los menús vive en utils/navMenus.ts (función pura, con pruebas).
const menus = computed(() => buildMenus({
  visibility: patientSection.value?.visibility ?? { videos: true, beforeAfter: true },
  topics: hubMenu.value?.topics ?? []
}))

// Desplegable de Procedimientos: misma lista pública (activos y habilitados para la línea), sin pedir el detalle de cada uno.
const procedureItems = computed(() => buildProcedureMenu(hubMenu.value?.procedures ?? []))

const route = useRoute()
// Al navegar se refrescan los menús (recomendaciones y pacientes) para reflejar publicaciones o cambios hechos desde cualquier panel o el CRM.
watch(() => route.path, () => { closeMenu(); refreshHubMenu(); refreshPatientSection() })

// Si la ventana pasa a escritorio con el menú abierto, se cierra para no dejarlo "colgado".
function onResize() {
  if (window.innerWidth >= 1360 && isMobileMenuOpen.value) closeMenu()
}
onMounted(() => window.addEventListener('resize', onResize))
onBeforeUnmount(() => window.removeEventListener('resize', onResize))
</script>
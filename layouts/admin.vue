<template>
  <div class="h-screen overflow-hidden bg-gray-50 flex font-sans text-gray-900">
    
    <!-- SIDEBAR -->
    <aside class="w-64 bg-[#0C2619] text-white flex-col hidden md:flex shrink-0 shadow-xl z-20 relative h-full overflow-y-auto">
      <div class="p-8 border-b border-white/10">
        <h1 class="font-serif text-3xl font-medium tracking-tight text-white uppercase">Planmed</h1>
        <p class="text-[10px] text-[#D3A76A] tracking-[0.2em] font-bold uppercase mt-2">Panel Administrativo</p>
      </div>

      <nav class="flex-grow p-4 space-y-8 mt-4">
        
        <div>
          <NuxtLink to="/admin" class="block px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/10" exact-active-class="bg-[#D3A76A] text-[#0C2619] hover:bg-[#D3A76A]">
            Dashboard
          </NuxtLink>
        </div>

        <div>
          <p class="px-4 text-[10px] tracking-[0.15em] text-white/50 uppercase font-bold mb-2">Contenido</p>
          <NuxtLink to="/admin/procedimientos" class="block px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/10" exact-active-class="bg-[#D3A76A] text-[#0C2619] hover:bg-[#D3A76A]">
            Procedimientos
          </NuxtLink>
          <NuxtLink to="/admin/noticias" class="block px-4 py-2 mt-1 rounded-lg text-sm font-medium transition-colors hover:bg-white/10" exact-active-class="bg-[#D3A76A] text-[#0C2619] hover:bg-[#D3A76A]">
            Noticias
          </NuxtLink>
          <NuxtLink to="/admin/testimonios" class="block px-4 py-2 mt-1 rounded-lg text-sm font-medium transition-colors hover:bg-white/10" active-class="bg-[#D3A76A] text-[#0C2619] hover:bg-[#D3A76A]">
            Nuestros Pacientes
          </NuxtLink>
          <NuxtLink to="/admin/recomendaciones" class="block px-4 py-2 mt-1 rounded-lg text-sm font-medium transition-colors hover:bg-white/10" active-class="bg-[#D3A76A] text-[#0C2619] hover:bg-[#D3A76A]">
            Recomendaciones
          </NuxtLink>
          <!-- Submenú «Nosotros»: solo las páginas administrables -->
          <button type="button" class="w-full flex items-center justify-between px-4 py-2 mt-1 rounded-lg text-sm font-medium transition-colors hover:bg-white/10" :class="isPagesRoute ? 'text-[#D3A76A]' : ''" :aria-expanded="pagesOpen ? 'true' : 'false'" aria-controls="admin-pages-submenu" @click="pagesOpen = !pagesOpen">
            <span>Nosotros</span>
            <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': pagesOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div v-show="pagesOpen" id="admin-pages-submenu" class="ml-3 pl-3 border-l border-white/10 space-y-1 mt-1">
            <NuxtLink v-for="l in pageLinks" :key="l.to" :to="l.to" class="block px-4 py-2 rounded-lg text-sm transition-colors hover:bg-white/10" exact-active-class="bg-[#D3A76A] text-[#0C2619] hover:bg-[#D3A76A]">{{ l.label }}</NuxtLink>
          </div>
          <NuxtLink to="/admin/micrositios" class="block px-4 py-2 mt-1 rounded-lg text-sm font-medium transition-colors hover:bg-white/10" exact-active-class="bg-[#D3A76A] text-[#0C2619] hover:bg-[#D3A76A]">
            Micrositios
          </NuxtLink>
        </div>

        <div v-if="user?.isAreaLeader || user?.canEditRate">
          <p class="px-4 text-[10px] tracking-[0.15em] text-white/50 uppercase font-bold mb-2">Administración</p>
          <NuxtLink to="/admin/configuracion" class="block px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/10" active-class="bg-[#D3A76A] text-[#0C2619] hover:bg-[#D3A76A]">
            Configuración
          </NuxtLink>
        </div>

      </nav>
    </aside>

    <!-- MOBILE OVERLAY (Solo estructural para futuro) -->
    <!-- En esta fase priorizamos Desktop pero dejamos estructura base -->

    <div class="flex-grow flex flex-col min-w-0 min-h-0">
      
      <!-- TOPBAR -->
      <header class="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 z-10 shadow-sm">
        <div class="flex items-center gap-4">
          <!-- Mobile menu button placeholder -->
          <button class="md:hidden p-2 -ml-2 text-gray-500 hover:text-black">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>

        <div class="flex items-center gap-6" v-if="user">
          <div class="text-right hidden sm:block">
            <p class="text-sm font-bold text-gray-900">{{ user.name }}</p>
            <p class="text-[11px] font-medium text-[#D3A76A] uppercase tracking-wider">{{ user.role.name }}</p>
          </div>
          
          <div class="h-8 w-px bg-gray-200 hidden sm:block"></div>

          <button 
            @click="handleLogout" 
            class="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors flex items-center gap-2"
          >
            <span>Cerrar sesión</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </header>

      <!-- MAIN CONTENT -->
      <!-- relative: los elementos sr-only (position:absolute) quedan contenidos y recortados por este contenedor; sin esto alargan el documento y aparece un segundo scroll -->
      <main class="relative flex-grow min-h-0 p-8 overflow-y-auto">
        <div class="max-w-6xl mx-auto">
          <slot />
        </div>
      </main>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from '#imports'
import { authService } from '~/services/AuthService'

const router = useRouter()
const user = authService.getUser()
const route = useRoute()

// Submenú «Nosotros»: solo páginas con pantalla de edición en este panel.
const pageLinks = [
  { label: 'Nosotros', to: '/admin/nosotros' },
  { label: 'Clínicas aliadas', to: '/admin/paginas/clinicas-aliadas' }
]
const isPagesRoute = computed(() => route.path.startsWith('/admin/nosotros') || route.path.startsWith('/admin/paginas'))
const pagesOpen = ref(isPagesRoute.value)

async function handleLogout() {
  await authService.logout()
  router.push('/admin/login')
}
</script>
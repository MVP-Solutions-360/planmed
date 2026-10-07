<template>
  <div class="min-h-screen bg-gray-50 flex font-sans text-gray-900">
    
    <!-- SIDEBAR -->
    <aside class="w-64 bg-[#0C2619] text-white flex flex-col hidden md:flex shrink-0 shadow-xl z-20 relative">
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
          <NuxtLink to="/admin/micrositios" class="block px-4 py-2 mt-1 rounded-lg text-sm font-medium transition-colors hover:bg-white/10" exact-active-class="bg-[#D3A76A] text-[#0C2619] hover:bg-[#D3A76A]">
            Micrositios
          </NuxtLink>
        </div>

        <div>
          <p class="px-4 text-[10px] tracking-[0.15em] text-white/50 uppercase font-bold mb-2">Configuración</p>
          <!-- Placeholder, sin href real funcional aún pero visualmente presente -->
          <div class="block px-4 py-2 rounded-lg text-sm font-medium text-white/40 cursor-not-allowed">
            Usuarios (Próximamente)
          </div>
        </div>

      </nav>
    </aside>

    <!-- MOBILE OVERLAY (Solo estructural para futuro) -->
    <!-- En esta fase priorizamos Desktop pero dejamos estructura base -->

    <div class="flex-grow flex flex-col min-w-0">
      
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
      <main class="flex-grow p-8 overflow-y-auto">
        <div class="max-w-6xl mx-auto">
          <slot />
        </div>
      </main>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from '#imports'
import { authService } from '~/services/AuthService'

const router = useRouter()
const user = authService.getUser()

async function handleLogout() {
  await authService.logout()
  router.push('/admin/login')
}
</script>
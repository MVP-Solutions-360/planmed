<template>
  <nav class="w-full bg-[#fcf9f8] border-b border-[#e5e2e1] sticky top-0 z-50">
    <div class="max-w-[1440px] mx-auto px-6 h-[88px] flex justify-between items-center">
      
      <!-- Logo -->
      <NuxtLink :to="'/'" class="block">
        <img src="/images/branding/logo.jpg" alt="Planmed" class="h-10 md:h-14 lg:h-16 w-auto object-contain" />
      </NuxtLink>

      <!-- Men Desktop -->
      <div class="hidden lg:flex items-center gap-4 xl:gap-8">
        <NuxtLink :to="'/'" class="text-[11px] font-bold tracking-[0.1em] text-black border-b-2 border-black pb-1 uppercase">INICIO</NuxtLink>
        <NuxtLink to="/procedimientos" class="text-[11px] font-bold tracking-[0.1em] text-[#4c4546] hover:text-black transition-colors uppercase">PROCEDIMIENTOS</NuxtLink>
        <NuxtLink to="/noticias" class="text-[11px] font-bold tracking-[0.1em] text-[#4c4546] hover:text-black transition-colors uppercase">NOTICIAS</NuxtLink>
        <NuxtLink to="/recursos" class="text-[11px] font-bold tracking-[0.1em] text-[#4c4546] hover:text-black transition-colors uppercase">RECURSOS</NuxtLink>
        <NuxtLink to="/nosotros" class="text-[11px] font-bold tracking-[0.1em] text-[#4c4546] hover:text-black transition-colors uppercase">NOSOTROS</NuxtLink>
        
        <NuxtLink to="/simulador" class="bg-[#0C2619] text-white px-4 py-2.5 font-bold text-[10px] tracking-[0.15em] uppercase hover:bg-black transition-colors rounded-[2px] shadow-sm ml-4 border border-[#0C2619]">
          SIMULAR FINANCIACIÓN
        </NuxtLink>
        
        <NuxtLink to="/admin/login" class="text-[11px] font-bold tracking-[0.1em] text-[#0C2619] hover:text-black transition-colors uppercase ml-4 flex items-center gap-1 border border-[#0C2619] px-3 py-2 rounded-[2px]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
          INICIAR SESIÓN
        </NuxtLink>
      </div>

      <!-- Mobile Hamburger Button -->
      <button 
        class="lg:hidden p-2 text-[#1c1b1b]" 
        @click="isMobileMenuOpen = !isMobileMenuOpen"
        aria-label="Toggle menu"
      >
        <svg v-if="!isMobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>

    <!-- Mobile Menu Overlay -->
    <div 
      v-if="isMobileMenuOpen" 
      class="lg:hidden absolute top-[88px] left-0 w-full bg-[#fcf9f8] border-b border-[#cfc4c5] shadow-lg flex flex-col items-center py-10 gap-8 z-[100]"
    >
      <NuxtLink to="/procedimientos" @click="isMobileMenuOpen = false" class="text-[#4c4546] font-bold text-sm tracking-widest uppercase">PROCEDIMIENTOS</NuxtLink>
      <NuxtLink to="/noticias" @click="isMobileMenuOpen = false" class="text-[#4c4546] font-bold text-sm tracking-widest uppercase">NOTICIAS</NuxtLink>
      <NuxtLink to="/recursos" @click="isMobileMenuOpen = false" class="text-[#4c4546] font-bold text-sm tracking-widest uppercase">RECURSOS</NuxtLink>
      <NuxtLink to="/nosotros" @click="isMobileMenuOpen = false" class="text-[#4c4546] font-bold text-sm tracking-widest uppercase">NOSOTROS</NuxtLink>
      
      <NuxtLink to="/simulador" @click="isMobileMenuOpen = false" class="bg-[#0C2619] text-white px-8 py-3 mt-4 font-bold text-xs tracking-widest uppercase shadow-md border border-[#0C2619]">
        SIMULAR FINANCIACIÓN
      </NuxtLink>
      <NuxtLink to="/admin/login" @click="isMobileMenuOpen = false" class="text-[#0C2619] font-bold text-sm tracking-widest uppercase">
        INICIAR SESIÓN
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'

const isMobileMenuOpen = ref(false)
</script>
<template>
  <div>
    <div class="mb-10">
      <h2 class="text-3xl font-serif text-[#0C2619] mb-2 uppercase">Bienvenido a Planmed</h2>
      <p class="text-gray-500 font-light">Panel de control administrativo</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      <!-- Card Procedimientos -->
      <NuxtLink to="/admin/procedimientos" class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
        <div class="w-12 h-12 bg-[#0C2619]/5 rounded-lg flex items-center justify-center mb-6 text-[#0C2619] group-hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">Procedimientos</h3>
        <p class="text-sm text-gray-500 leading-relaxed">
          Gestiona el contenido del catálogo de procedimientos de Planmed.
        </p>
      </NuxtLink>

      <!-- Card Noticias -->
      <NuxtLink to="/admin/noticias" class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
        <div class="w-12 h-12 bg-[#0C2619]/5 rounded-lg flex items-center justify-center mb-6 text-[#0C2619] group-hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15M9 11l3 3L22 4" /></svg>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">Noticias</h3>
        <p class="text-sm text-gray-500 leading-relaxed">
          Gestiona artículos, casos de éxito y contenido editorial.
        </p>
      </NuxtLink>

      <!-- Card Nuestros Pacientes -->
      <NuxtLink to="/admin/testimonios" class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
        <div class="w-12 h-12 bg-[#0C2619]/5 rounded-lg flex items-center justify-center mb-6 text-[#0C2619] group-hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">Nuestros Pacientes</h3>
        <p class="text-sm text-gray-500 leading-relaxed">
          Gestiona videos, antes y después y el programa de referidos.
        </p>
      </NuxtLink>

      <!-- Card Recomendaciones -->
      <NuxtLink to="/admin/recomendaciones" class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
        <div class="w-12 h-12 bg-[#0C2619]/5 rounded-lg flex items-center justify-center mb-6 text-[#0C2619] group-hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">Recomendaciones</h3>
        <p class="text-sm text-gray-500 leading-relaxed">
          Edita las recomendaciones para citas y cuidados de cirugías.
        </p>
      </NuxtLink>

      <!-- Card Micrositios -->
      <NuxtLink to="/admin/micrositios" class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
        <div class="w-12 h-12 bg-[#0C2619]/5 rounded-lg flex items-center justify-center mb-6 text-[#0C2619] group-hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">Micrositios</h3>
        <p class="text-sm text-gray-500 leading-relaxed">
          Administra los micrositios de referidores (PRP) y sus enlaces públicos.
        </p>
      </NuxtLink>

      <!-- Card Configuración (líder de línea; el rol de diseño solo ve la tasa) -->
      <NuxtLink v-if="user?.isAreaLeader || user?.canEditRate" to="/admin/configuracion" class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
        <div class="w-12 h-12 bg-[#0C2619]/5 rounded-lg flex items-center justify-center mb-6 text-[#0C2619] group-hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">Configuración</h3>
        <p class="text-sm text-gray-500 leading-relaxed">
          Usuarios de la línea Planmed (solo líder de línea) y tasa de usura mensual del simulador.
        </p>
      </NuxtLink>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useHead } from '#imports'
import { authService } from '~/services/AuthService'

const user = authService.getUser()

useHead({
  title: 'Dashboard | Admin Planmed'
})

definePageMeta({
  layout: 'admin'
})
</script>
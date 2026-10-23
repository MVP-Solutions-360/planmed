<template>
  <!-- Identificador visual de VISTA DE DETALLE: enlace «Volver a …» sobre la cabecera con degradado (las vistas principales usan CommonPageHero). -->
  <NuxtLink :to="to" class="inline-flex items-center gap-3 text-[11px] font-bold tracking-[0.15em] text-white/60 hover:text-white transition-colors uppercase mb-10 cursor-pointer">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
    {{ label }}
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{ to: string, label: string }>()
</script>

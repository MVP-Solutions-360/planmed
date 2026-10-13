<template>
  <div class="bg-white font-sans selection:bg-[#0C2619] selection:text-white">
    <header class="bg-[#0C2619]" :aria-labelledby="titleId">
      <div class="mx-auto px-6 md:px-12 py-16 md:py-24" :class="wide ? 'max-w-[1200px]' : 'max-w-[1000px]'">
        <span class="block w-12 h-[2px] bg-[#D3A76A] mb-6" aria-hidden="true"></span>
        <h1 :id="titleId" class="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.05] tracking-[-0.02em] text-white uppercase break-words">{{ title }}</h1>
        <p v-if="subtitle" class="mt-6 max-w-2xl text-lg font-light text-white/80 leading-relaxed">{{ subtitle }}</p>
        <div v-if="$slots.actions" class="mt-8"><slot name="actions" /></div>
      </div>
    </header>
    <main v-if="bare">
      <slot />
    </main>
    <main v-else class="bg-[#fcf9f8]">
      <div class="mx-auto px-6 md:px-12 py-14 md:py-20 text-gray-700 leading-relaxed" :class="wide ? 'max-w-[1200px]' : 'max-w-[1000px]'">
        <slot>
          <p class="text-gray-500 font-light text-lg">Contenido próximamente.</p>
        </slot>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string, subtitle?: string, wide?: boolean, /** Sin contenedor: la página arma sus propias secciones de ancho completo. */ bare?: boolean }>()
const titleId = 'site-page-title'
</script>

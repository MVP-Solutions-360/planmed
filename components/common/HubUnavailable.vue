<template>
  <div role="alert" class="text-center border border-[#e5e2e1] bg-white py-14 px-6" data-testid="hub-unavailable">
    <p class="font-serif text-xl md:text-2xl text-[#0C2619] mb-3">{{ title }}</p>
    <p class="text-gray-600 font-light max-w-lg mx-auto leading-relaxed">No pudimos cargar esta información en este momento. No significa que no haya contenido: intenta nuevamente en unos minutos.</p>
    <button
      type="button"
      :disabled="retrying"
      class="mt-8 inline-flex items-center justify-center bg-[#0C2619] text-white px-8 py-3.5 text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-black transition-colors disabled:opacity-60"
      @click="$emit('retry')"
    >
      {{ retrying ? 'Reintentando…' : 'Reintentar' }}
    </button>
  </div>
</template>

<script setup lang="ts">
// Aviso de indisponibilidad de un listado público (Hub caído, línea mal configurada o respuesta inválida). Se muestra en lugar de
// un estado vacío para no presentar el fallo como «aún no hay contenido». El padre decide cómo reintentar (refresh del useAsyncData).
withDefaults(defineProps<{ title?: string, retrying?: boolean }>(), { title: 'Esta sección no está disponible por ahora', retrying: false })
defineEmits<{ (e: 'retry'): void }>()
</script>

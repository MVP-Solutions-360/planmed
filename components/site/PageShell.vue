<template>
  <div class="bg-white font-sans selection:bg-[#0C2619] selection:text-white">
    <!-- Vista principal: mismo encabezado que las listas (CommonPageHero). -->
    <div class="bg-[#fcf9f8] pt-6 md:pt-10 px-6" :class="bare ? 'pb-10 md:pb-14' : ''">
      <div class="mx-auto" :class="wide ? 'max-w-[1200px]' : 'max-w-[1000px]'">
        <CommonPageHero :eyebrow="eyebrow || 'Planmed'" :lines="[title]" :lead="subtitle" :facts="[]" class="!mb-0">
          <template v-if="$slots.actions" #actions><slot name="actions" /></template>
        </CommonPageHero>
      </div>
    </div>
    <main v-if="bare">
      <slot />
    </main>
    <main v-else class="bg-[#fcf9f8]">
      <div class="mx-auto px-6 md:px-12 pt-10 pb-14 md:pt-14 md:pb-20 text-gray-700 leading-relaxed" :class="wide ? 'max-w-[1200px]' : 'max-w-[1000px]'">
        <slot>
          <p class="text-gray-500 font-light text-lg">Contenido próximamente.</p>
        </slot>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string, eyebrow?: string, subtitle?: string, wide?: boolean, /** Sin contenedor: la página arma sus propias secciones de ancho completo. */ bare?: boolean }>()
</script>

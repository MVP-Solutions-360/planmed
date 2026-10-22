<template>
  <!-- Toda la tarjeta (imagen, nombre y flecha) lleva al detalle del procedimiento; sin slug no hay ruta válida y queda como bloque informativo. -->
  <component
    :is="detailPath ? NuxtLink : 'div'"
    v-bind="detailPath ? { to: detailPath } : {}"
    class="group flex flex-col gap-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0C2619]"
    :class="{ 'cursor-pointer': detailPath }"
    data-testid="home-procedure-card"
  >
    <!-- Contenedor según la orientación elegida en el admin: vertical 9:16 (1080 × 1920, por defecto) u horizontal 16:9 (1920 × 1080): la imagen se muestra completa (contain), a color y sin deformarse. El ancho se limita para que la tarjeta no ocupe más de una pantalla. -->
    <div class="relative w-full overflow-hidden bg-[#e5e2e1]" :class="procedure.imageOrientation === 'horizontal' ? 'aspect-video' : 'aspect-[9/16] max-w-[420px]'">
      <img 
        v-if="procedure.image"
        :src="procedure.image" 
        :alt="procedure.name" 
        loading="lazy"
        class="w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.02]"
      />
    </div>
    <div class="flex flex-col gap-3">
      <div class="flex justify-between items-center">
        <h3 class="font-serif text-[24px] md:text-[28px] text-black transition-colors duration-300">{{ procedure.name }}</h3>
        <span class="w-8 h-8 rounded-full border border-[#e5e2e1] flex items-center justify-center text-[#848484] group-hover:border-black group-hover:bg-black group-hover:text-white transition-all duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </span>
      </div>
      <p class="text-[14px] text-[#4c4546] font-normal leading-[1.6] max-w-[95%]">
        {{ procedure.shortDescription }}
      </p>
    </div>
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { NuxtLink } from '#components'

const props = defineProps({
  procedure: {
    type: Object,
    required: true
  }
})

const detailPath = computed(() => (props.procedure.slug ? `/procedimientos/${encodeURIComponent(props.procedure.slug)}` : ''))
</script>

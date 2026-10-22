<template>
  <section class="py-24 bg-[#F7F3EE]">
    <div class="max-w-[1200px] mx-auto px-4 md:px-12 text-center">
      <div class="bg-[#E7DDD1] rounded-3xl p-6 md:p-12 lg:p-24 overflow-hidden relative border border-[#BBB2AA]/40">
        <div class="relative z-10 space-y-6">
          <h2 class="font-serif text-4xl font-extrabold text-[#111111]">{{ title || '¿Listo para el siguiente paso?' }}</h2>
          <p class="font-sans font-light text-lg text-[#111111]/80 max-w-xl mx-auto">{{ description || 'Únete a los miles de colombianos que han transformado sus vidas con nuestra financiación responsable.' }}</p>
          <div class="flex flex-col md:flex-row gap-4 justify-center pt-8">
            <NuxtLink :to="primaryLink" class="w-full md:w-auto bg-[#111111] text-[#CBA36B] px-10 py-4 rounded-full font-bold hover:bg-[#F7F3EE] hover:text-[#111111] transition-all active:scale-95 text-center">
              {{ primaryText || 'Simular financiación' }}
            </NuxtLink>
            <a v-if="secondaryText || 'Hablar con un asesor'" :href="secondaryLink" target="_blank" class="w-full md:w-auto border-2 border-[#111111] text-[#111111] px-10 py-4 rounded-full font-bold hover:bg-[#111111] hover:text-[#F7F3EE] transition-all text-center">
              {{ secondaryText || 'Hablar con un asesor' }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, default: null },
  description: { type: String, default: null },
  primaryText: { type: String, default: null },
  primaryLink: { type: String, default: '/financiacion#calculadora' },
  secondaryText: { type: String, default: null },
  secondaryLink: { type: String, default: 'https://wa.me/573188043382' }
})
</script>

<!-- components/common/ProcessSection.vue -->
<template>
  <section class="py-16 md:py-24 bg-[#F7F3EE] border-b border-[#BBB2AA]/30">
    <div class="max-w-[1200px] mx-auto px-4 md:px-12">
      <div class="text-center mb-16">
        <h2 class="font-serif text-3xl md:text-[40px] font-extrabold text-[#111111] mb-4 leading-tight">{{ 'Tu proceso hacia la cirugía' }}</h2>
        <p class="text-base md:text-lg text-[#111111]/80 max-w-2xl mx-auto font-light">{{ 'Claro, rápido y diseñado para tu tranquilidad.' }}</p>
      </div>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 md:gap-4 lg:gap-8 relative">
        <!-- Horizontal Line for Desktop -->
        <div class="hidden md:block absolute top-8 left-[12%] right-[12%] h-0.5 bg-[#BBB2AA]/30 z-0"></div>

        <!-- Paso 1: Simulación -->
        <div class="relative z-10 text-center flex flex-col items-center group">
          <div class="w-14 h-14 md:w-16 md:h-16 bg-[#111111] rounded-full flex items-center justify-center mx-auto text-[#CBA36B] transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h4 class="font-serif text-lg md:text-xl font-bold text-[#111111] pt-4">{{ 'Simulación' }}</h4>
          <p class="text-[#111111]/80 text-sm md:text-base mt-2 px-2 font-light">Calcula una cuota estimada para tu procedimiento.</p>
        </div>

        <!-- Paso 2: Estudio de Perfil -->
        <div class="relative z-10 text-center flex flex-col items-center group">
          <div class="w-14 h-14 md:w-16 md:h-16 bg-[#F7F3EE] border-2 border-[#111111] rounded-full flex items-center justify-center mx-auto text-[#111111] transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h4 class="font-serif text-lg md:text-xl font-bold text-[#111111] pt-4">{{ 'Estudio de Perfil' }}</h4>
          <p class="text-[#111111]/80 text-sm md:text-base mt-2 px-2 font-light">Analizamos tu solicitud y documentación.</p>
        </div>

        <!-- Paso 3: Aprobación -->
        <div class="relative z-10 text-center flex flex-col items-center group">
          <div class="w-14 h-14 md:w-16 md:h-16 bg-[#F7F3EE] border-2 border-[#BBB2AA]/60 rounded-full flex items-center justify-center mx-auto text-[#111111] transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h4 class="font-serif text-lg md:text-xl font-bold text-[#111111] pt-4">{{ 'Aprobación' }}</h4>
          <p class="text-[#111111]/80 text-sm md:text-base mt-2 px-2 font-light">Recibes respuesta sobre tu alternativa de financiación.</p>
        </div>

        <!-- Paso 4: Procedimiento -->
        <div class="relative z-10 text-center flex flex-col items-center group">
          <div class="w-14 h-14 md:w-16 md:h-16 bg-[#F7F3EE] border-2 border-[#BBB2AA]/60 rounded-full flex items-center justify-center mx-auto text-[#111111] transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h4 class="font-serif text-lg md:text-xl font-bold text-[#111111] pt-4">{{ 'Procedimiento' }}</h4>
          <p class="text-[#111111]/80 text-sm md:text-base mt-2 px-2 font-light">Accede al tratamiento con nuestra red médica aliada.</p>
        </div>
      </div>

      <!-- Ajuste 4: CTA al final del proceso -->
      <div class="mt-16 text-center">
        <NuxtLink :to="'/financiacion#calculadora'" class="inline-block bg-[#111111] text-white px-10 py-4 rounded-full font-bold text-base hover:bg-[#F7F3EE] hover:text-[#111111] border-2 border-transparent hover:border-[#111111] transition-all active:scale-95">
          Simular financiación
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>



</script>

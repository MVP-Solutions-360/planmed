<!-- components/simulator/NextStepsSection.vue -->
<template>
  <section class="py-16 md:py-24 bg-[#f7f9fb] border-b border-gray-100">
    <div class="max-w-[1200px] mx-auto px-4 md:px-12">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-[40px] font-extrabold text-[#000000] mb-4 leading-tight">{{ '¿Qué sucede después de tu solicitud?' }}</h2>
        <p class="text-base md:text-lg text-[#43474d] max-w-2xl mx-auto">{{ 'Una vez envíes tu solicitud, nuestro equipo te acompañará en los siguientes pasos.' }}</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
        <!-- Horizontal Line for Desktop -->
        <div class="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-gray-200 z-0"></div>

        <!-- Paso 1: Estudio de Perfil -->
        <div class="relative z-10 text-center flex flex-col items-center group">
          <div class="w-14 h-14 md:w-16 md:h-16 bg-[#755a26] rounded-full flex items-center justify-center mx-auto text-white shadow-lg transition-transform group-hover:scale-110 duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h4 class="text-lg md:text-xl font-bold text-[#000000] pt-4">{{ 'Estudio de Perfil' }}</h4>
          <p class="text-[#43474d] text-sm md:text-base mt-2 px-2">{{ 'Analizamos tu solicitud y la información suministrada para validar la alternativa de financiación más adecuada para tu procedimiento.' }}</p>
        </div>

        <!-- Paso 2: Respuesta de Aprobación -->
        <div class="relative z-10 text-center flex flex-col items-center group">
          <div class="w-14 h-14 md:w-16 md:h-16 bg-white border-2 border-[#755a26] rounded-full flex items-center justify-center mx-auto text-[#755a26] shadow-sm transition-transform group-hover:scale-110 duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h4 class="text-lg md:text-xl font-bold text-[#000000] pt-4">{{ 'Respuesta de Aprobación' }}</h4>
          <p class="text-[#43474d] text-sm md:text-base mt-2 px-2">{{ 'Nuestro equipo te contactará para continuar con el proceso.' }}</p>
        </div>

        <!-- Paso 3: Procedimiento -->
        <div class="relative z-10 text-center flex flex-col items-center group">
          <div class="w-14 h-14 md:w-16 md:h-16 bg-white border-2 border-[#755a26] rounded-full flex items-center justify-center mx-auto text-[#755a26] shadow-sm transition-transform group-hover:scale-110 duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h4 class="text-lg md:text-xl font-bold text-[#000000] pt-4">{{ 'Procedimiento' }}</h4>
          <p class="text-[#43474d] text-sm md:text-base mt-2 px-2">{{ 'Con la aprobación obtenida, podrás avanzar con tu procedimiento junto a nuestra red médica aliada.' }}</p>
        </div>
      </div>

      <!-- Refuerzo Cuota Inicial y CTA -->
      <div class="mt-20 max-w-2xl mx-auto text-center bg-white p-8 md:p-10 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
        <!-- Abstract gradient blob behind text -->
        <div class="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div class="relative z-10">
          <h3 class="text-xl md:text-2xl font-bold text-[#000000] mb-4">{{ '¿Te preocupa la cuota inicial?' }}</h3>
          <p class="text-[#43474d] text-base leading-relaxed mb-4">
            {{ 'Entendemos que algunas personas cuentan con capacidad para asumir una cuota mensual, pero no disponen del valor completo de la cuota inicial.' }}
          </p>
          <p class="text-[#43474d] text-base leading-relaxed mb-8">
            {{ 'Por eso, durante tu proceso de asesoría podremos orientarte sobre alternativas complementarias que podrían ayudarte a hacer realidad tu procedimiento.' }}
          </p>
          <a 
            href="https://wa.me/573188043382?text=Estuve revisando la página y me gustaría más información acerca de las opciones de financiación." 
            target="_blank" 
            class="inline-block bg-black text-white px-10 py-4 rounded-full font-bold text-base hover:bg-white hover:text-black border-2 border-transparent hover:border-black transition-all shadow-md active:scale-95"
          >
            {{ 'Contactar a un asesor' }}
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

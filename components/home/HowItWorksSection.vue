<template>
  <section class="py-24 md:py-32 px-6 bg-white border-t border-[#e5e2e1]" id="como-funciona">
    <div class="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">
      
      <!-- Left Column: Title -->
      <div class="w-full lg:w-1/3 flex flex-col items-start lg:sticky lg:top-32 h-fit">
        <p class="text-[11px] font-bold tracking-[0.15em] text-[#848484] uppercase mb-6">EL PROCESO</p>
        <h2 class="font-serif text-[40px] md:text-[56px] font-medium leading-[1.05] tracking-[-0.02em] text-black mb-8 uppercase">
          DISEÑADO PARA TU TRANQUILIDAD.
        </h2>
        <div class="w-12 h-[1px] bg-[#0C2619]"></div>
      </div>

      <!-- Right Column: Steps -->
      <div class="w-full lg:w-2/3 flex flex-col">
        <div class="border-t border-[#e5e2e1]">
          <!-- Step 1 -->
          <div class="group flex flex-col md:flex-row gap-6 md:gap-12 py-10 md:py-16 border-b border-[#e5e2e1] hover:bg-[#fcf9f8] transition-colors -mx-6 px-6 md:mx-0 md:px-0">
            <div class="md:w-1/4">
              <span class="font-serif text-[48px] md:text-[64px] font-normal leading-none text-[#e5e2e1] group-hover:text-[#0C2619] transition-colors">01.</span>
            </div>
            <div class="md:w-3/4 flex flex-col gap-4">
              <h3 class="text-[20px] md:text-[24px] font-medium text-black tracking-[-0.01em]">Simulación y Solicitud</h3>
              <p class="text-[14px] text-[#4c4546] font-normal leading-[1.6] max-w-lg">
                El proceso es 100% virtual. Utiliza nuestro simulador para estructurar un plan a tu medida. Elige el procedimiento, monto y plazo estimado, y envía tu solicitud en minutos.
              </p>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="group flex flex-col md:flex-row gap-6 md:gap-12 py-10 md:py-16 border-b border-[#e5e2e1] hover:bg-[#fcf9f8] transition-colors -mx-6 px-6 md:mx-0 md:px-0">
            <div class="md:w-1/4">
              <span class="font-serif text-[48px] md:text-[64px] font-normal leading-none text-[#e5e2e1] group-hover:text-[#0C2619] transition-colors">02.</span>
            </div>
            <div class="md:w-3/4 flex flex-col gap-4">
              <h3 class="text-[20px] md:text-[24px] font-medium text-black tracking-[-0.01em]">Estudio de Perfil</h3>
              <p class="text-[14px] text-[#4c4546] font-normal leading-[1.6] max-w-lg">
                Nuestro equipo analiza cuidadosamente cada solicitud de manera individual. ¿Tienes reportes en centrales de riesgo? Tu caso también puede ser estudiado.
              </p>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="group flex flex-col md:flex-row gap-6 md:gap-12 py-10 md:py-16 border-b border-[#e5e2e1] hover:bg-[#fcf9f8] transition-colors -mx-6 px-6 md:mx-0 md:px-0">
            <div class="md:w-1/4">
              <span class="font-serif text-[48px] md:text-[64px] font-normal leading-none text-[#e5e2e1] group-hover:text-[#0C2619] transition-colors">03.</span>
            </div>
            <div class="md:w-3/4 flex flex-col gap-4">
              <h3 class="text-[20px] md:text-[24px] font-medium text-black tracking-[-0.01em]">Aprobación y Procedimiento</h3>
              <p class="text-[14px] text-[#4c4546] font-normal leading-[1.6] max-w-lg">
                Al recibir respuesta favorable, podrás avanzar con tu procedimiento en nuestra red médica aliada. Nosotros nos encargamos del respaldo financiero.
              </p>
            </div>
          </div>
        </div>
        
        <div class="mt-16">
          <NuxtLink :to="'/financiacion#calculadora'" class="inline-flex items-center gap-4 text-[11px] font-bold tracking-[0.15em] text-[#0C2619] uppercase hover:text-black transition-colors group">
            INICIAR TU PLAN
            <span class="w-8 h-8 rounded-full border border-[#0C2619] group-hover:border-black flex items-center justify-center transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </span>
          </NuxtLink>
        </div>
      </div>

    </div>
  </section>
</template>

<script setup>



</script>

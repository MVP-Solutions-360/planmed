<template>
  <div class="bg-[#fcf9f8] text-[#1c1b1b] font-sans selection:bg-[#0C2619] selection:text-white">
    
    <!-- Hero Section -->
    <div class="relative">
      <!-- Background for the left block -->
      <div class="absolute inset-y-0 left-0 w-full lg:w-[55%] bg-[#0C2619] z-0"></div>
      
      <section class="relative z-10 max-w-[1440px] mx-auto px-6 pt-12 pb-24 md:pt-20 lg:flex lg:items-center lg:justify-between gap-12 min-h-[calc(100vh-88px)]">
        <!-- Left: Text -->
        <div class="lg:w-1/2 max-w-[650px] flex flex-col items-start z-10 relative py-12">
          <h1 class="font-serif text-[44px] md:text-[64px] lg:text-[84px] font-semibold leading-[1.05] tracking-[-0.02em] text-white mb-8 uppercase break-words drop-shadow-sm">
            TU<br />
            PROXIMA<br />
            ETAPA<br />
            EMPIEZA<br />
            CON UN<br />
            <span class="text-[#D3A76A] font-black">PLAN.</span>
          </h1>
          
          <div class="pl-6 md:pl-8 border-l-2 border-white mb-12">
            <p class="text-[16px] md:text-[18px] text-white/90 font-normal leading-[1.6]">
              Financia tu procedimiento estético con opciones pensadas para adaptarse a tus posibilidades, sin comprometer tu estilo de vida.
            </p>
          </div>

          <NuxtLink :to="'/financiacion#calculadora'" class="bg-white text-[#0C2619] px-8 py-4 font-bold text-[12px] tracking-[0.1em] uppercase hover:bg-[#D3A76A] transition-colors rounded-[4px] flex items-center gap-3 shadow-md">
            SIMULAR FINANCIACIÓN
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </NuxtLink>
        </div>

      <!-- Right: Image + Card -->
      <div class="lg:w-1/2 mt-16 lg:mt-0 relative w-full">
        <div class="relative w-full aspect-[4/5] overflow-hidden bg-[#e5e2e1]">
           <img src="/images/web/home.png" alt="Aesthetic Planmed" class="w-full h-full object-cover grayscale contrast-125 brightness-95 transition-all duration-500 hover:grayscale-0" />
        </div>

        <!-- Card overlapping -->
        <div class="absolute -left-4 bottom-12 md:-left-16 md:bottom-24 bg-[#fcf9f8] p-8 md:p-10 border border-[#e5e2e1] shadow-2xl max-w-[320px]">
          <p class="text-[11px] font-bold tracking-[0.1em] text-[#4c4546] uppercase mb-4">EJEMPLO DE PLAN</p>
          <p class="text-[28px] md:text-[32px] font-medium text-black tracking-[-0.01em] mb-6">$10.000.000</p>
          <hr class="border-[#e5e2e1] mb-6" />
          <p class="text-[13px] md:text-[14px] font-normal text-[#4c4546] mb-4">
            Plazo estimado <span class="font-semibold text-black">48 MESES</span>
          </p>
          <p class="text-[#0C2619] font-semibold text-[13px] md:text-[14px] flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
            Sujeto a estudio
          </p>
        </div>
      </div>
    </section>
    </div>

    <!-- Lower Section: "NO NECESITAS TENERLO TODO HOY" -->
    <section class="bg-white text-[#0C2619] py-24 md:py-32 px-6">
      <div class="max-w-[1200px] mx-auto">
        <h2 class="font-serif text-[40px] md:text-[56px] lg:text-[64px] font-medium leading-[1.1] text-center mb-24 max-w-[900px] mx-auto uppercase text-[#0C2619]">
          NO NECESITAS TENERLO TODO HOY.
        </h2>
        
        <hr class="border-[#cfc4c5] mb-12" />
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 items-center text-left">
          
          <div class="flex flex-col gap-3">
            <p class="text-[11px] font-bold tracking-[0.1em] text-[#848484] uppercase">VALOR PROCEDIMIENTO</p>
            <p class="text-[24px] font-medium text-[#0C2619]">$10M</p>
          </div>
          
          <div class="flex flex-col md:flex-row md:items-center gap-8 md:gap-12 relative md:-ml-8">
            <div class="hidden md:flex text-[#4c4546]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
            
            <div class="flex flex-col gap-3">
              <p class="text-[11px] font-bold tracking-[0.1em] text-[#848484] uppercase">MONTO A FINANCIAR</p>
              <p class="text-[24px] font-medium text-[#0C2619]">$8M</p>
              <p class="text-[14px] text-[#848484]">Con 48 meses de plazo</p>
            </div>
          </div>
          
          <div class="flex flex-col gap-3 md:border-l md:border-[#cfc4c5] md:pl-12">
            <p class="text-[11px] font-bold tracking-[0.1em] text-[#848484] uppercase">CUOTA MENSUAL ESTIMADA</p>
            <p class="text-[24px] font-medium text-[#0C2619]">$235,123</p>
          </div>

        </div>
<div class="mt-8 text-center text-[12px] text-[#848484] max-w-[800px] mx-auto">
*El ejemplo utiliza una tasa referencial que puede variar de acuerdo con la tasa de usura vigente, fijada mensualmente.
</div>
<div class="mt-12 flex justify-center">
          <NuxtLink to="/financiacion#calculadora" class="bg-[#0C2619] text-white px-8 py-4 font-bold text-[12px] tracking-[0.1em] uppercase hover:bg-black transition-colors rounded-[4px] flex items-center justify-center gap-3 shadow-md w-full md:w-auto">
            SIMULAR FINANCIACIÓN
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </NuxtLink>
        </div>
      </div>
    </section>

    <HomeValueProposition />
    <HomeProceduresSection />
    <HomeHowItWorksSection />
    <HomeClinicsSection />

  </div>
</template>

<script setup>
import HomeValueProposition from '~/components/home/ValueProposition.vue'
import HomeProceduresSection from '~/components/home/ProceduresSection.vue'
import HomeHowItWorksSection from '~/components/home/HowItWorksSection.vue'
import HomeClinicsSection from '~/components/home/ClinicsSection.vue'

useSeoMeta({
  title: 'FINANCIACIÓN DE CIRUGÍAS PLÁSTICAS',
  ogTitle: 'FINANCIACIÓN DE CIRUGÍAS PLÁSTICAS',
  description: 'Financiamos desde el 50% hasta el 100% de tu procedimiento médico o estético directamente.',
})
</script>

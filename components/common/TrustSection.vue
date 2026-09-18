<!-- components/common/TrustSection.vue -->
<template>
  <section class="py-16 md:py-24 bg-[#F7F3EE] border-b border-[#BBB2AA]/30">
    <div class="max-w-[1200px] mx-auto px-4 md:px-12">
      <div class="text-center mb-12 md:mb-16 max-w-3xl mx-auto space-y-4">
        <span class="inline-block bg-[#E7DDD1] text-[#111111] border border-[#BBB2AA]/30 px-4 py-1.5 rounded-full text-xs md:text-sm font-sans font-bold tracking-wider uppercase">
          {{ 'Respaldo y Seguridad' }}
        </span>
        <h2 class="font-serif text-3xl md:text-4xl lg:text-[40px] font-extrabold text-[#111111] leading-tight">
          {{ 'Respaldo médico y financiero' }}
        </h2>
        <p class="font-sans font-light text-base md:text-lg text-[#111111]/80 max-w-2xl mx-auto">
          {{ 'Tu bienestar es el centro de nuestro modelo. Promovemos las buenas prácticas y la transparencia en cada etapa de tu proceso.' }}
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
        <!-- RETHUS -->
        <div class="bg-[#E7DDD1] p-6 md:p-8 rounded-md border border-[#BBB2AA]/40 flex flex-col">
          <div class="w-10 h-10 md:w-12 md:h-12 bg-transparent border border-[#CBA36B] text-[#CBA36B] rounded-full flex items-center justify-center mb-5 md:mb-6 text-lg md:text-xl font-serif font-light">
            ✓
          </div>
          <h3 class="font-sans font-extrabold uppercase tracking-wide text-sm md:text-base text-[#111111] mb-2 md:mb-3">{{ 'Verificación RETHUS' }}</h3>
          <p class="font-sans font-light text-sm md:text-base text-[#111111]/80 leading-relaxed mb-4">
            {{ 'Profesionales con registro verificable en RETHUS. Trabajamos con profesionales que pueden ser verificados a través de los registros oficiales correspondientes.' }}
          </p>
          <span class="text-[10px] md:text-xs text-[#BBB2AA] font-bold uppercase tracking-wider mt-auto pt-4">{{ 'Profesionales de confianza' }}</span>
        </div>

        <!-- REPS -->
        <div class="bg-[#E7DDD1] p-6 md:p-8 rounded-md border border-[#BBB2AA]/40 flex flex-col">
          <div class="w-10 h-10 md:w-12 md:h-12 bg-transparent border border-[#CBA36B] text-[#CBA36B] rounded-full flex items-center justify-center mb-5 md:mb-6 text-lg md:text-xl font-serif font-light">
            ✓
          </div>
          <h3 class="font-sans font-extrabold uppercase tracking-wide text-sm md:text-base text-[#111111] mb-2 md:mb-3">{{ 'Habilitación REPS' }}</h3>
          <p class="font-sans font-light text-sm md:text-base text-[#111111]/80 leading-relaxed mb-4">
            {{ 'Instituciones habilitadas y verificables en REPS. Promovemos la realización de procedimientos en instituciones habilitadas y verificables en los registros oficiales correspondientes.' }}
          </p>
          <span class="text-[10px] md:text-xs text-[#BBB2AA] font-bold uppercase tracking-wider mt-auto pt-4">{{ 'Infraestructura idónea' }}</span>
        </div>

        <!-- Acompañamiento -->
        <div class="bg-[#E7DDD1] p-6 md:p-8 rounded-md border border-[#BBB2AA]/40 flex flex-col sm:col-span-2 md:col-span-1">
          <div class="w-10 h-10 md:w-12 md:h-12 bg-transparent border border-[#CBA36B] text-[#CBA36B] rounded-full flex items-center justify-center mb-5 md:mb-6 text-lg md:text-xl font-serif font-light">
            ✓
          </div>
          <h3 class="font-sans font-extrabold uppercase tracking-wide text-sm md:text-base text-[#111111] mb-2 md:mb-3">{{ 'Acompañamiento integral' }}</h3>
          <p class="font-sans font-light text-sm md:text-base text-[#111111]/80 leading-relaxed mb-4">
            {{ 'Acompañamiento durante todo el proceso. Ofrecemos orientación y acompañamiento personalizado durante la planeación financiera y el desarrollo de tu proceso.' }}
          </p>
          <span class="text-[10px] md:text-xs text-[#BBB2AA] font-bold uppercase tracking-wider mt-auto pt-4">{{ 'Soporte continuo' }}</span>
        </div>
      </div>

      <!-- Nota Legal Discreta -->
      <div class="mt-12 md:mt-16 text-center max-w-4xl mx-auto">
        <p class="font-sans text-[10px] md:text-xs text-[#BBB2AA] leading-relaxed italic">
          {{ 'Nota Legal: Planmed promueve la realización de procedimientos con profesionales que puedan ser verificados en RETHUS y en instituciones habilitadas y verificables en los registros oficiales correspondientes.' }}
        </p>
      </div>
    </div>
  </section>
</template>

<!-- components/common/MedicalLeadershipSection.vue -->
<script setup>
defineProps({
  yearsExperience: {
    type: Number,
    default: 20
  },
  peopleFinanced: {
    type: Number,
    default: 5000
  }
})


</script>

<template>
  <section class="py-16 md:py-24 bg-[#000000] border-b border-white/10">
    <div class="max-w-[1200px] mx-auto px-4 md:px-12">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-12 items-center">
        <!-- Columna Visual: Foto e Hitos de Configuración Dinámica -->
        <div class="lg:col-span-5 relative order-2 lg:order-1">
          <div class="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10">
            <img 
              src="/images/team/equipo-planmed.png" 
              alt="Dirección Médica Planmed" 
              class="w-full h-[320px] sm:h-[400px] md:h-[450px] object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
            
            <!-- Badges con Datos Dinámicos (Props) -->
            <div class="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 flex flex-col gap-3">
              <div class="bg-[#755a26] text-white font-extrabold px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm inline-flex items-center gap-2 w-fit">
                <span>⭐</span> Más de {{ yearsExperience }} {{ 'años de experiencia médica en la red aliada' }}
              </div>
              <div class="bg-white text-black font-extrabold px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm inline-flex items-center gap-2 w-fit">
                <span>💳</span> Más de {{ peopleFinanced.toLocaleString('es-CO') }} {{ 'personas con alternativas de financiación' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Columna de Contenido Institucional -->
        <div class="lg:col-span-7 space-y-6 order-1 lg:order-2">
          <span class="inline-block bg-[#755a26]/20 text-[#fdd798] px-4 py-1.5 rounded-full text-xs md:text-sm font-bold tracking-wider uppercase">
            {{ 'Respaldo Institucional' }}
          </span>
          <h2 class="text-3xl md:text-4xl lg:text-[40px] font-bold text-white leading-tight">
            {{ 'Seleccionamos cuidadosamente nuestra red médica.' }}
          </h2>
          <p class="text-base md:text-lg text-gray-300 leading-relaxed">
            {{ 'Trabajamos únicamente con profesionales verificables en RETHUS e instituciones habilitadas en REPS para garantizar estándares consistentes de calidad y seguridad.' }}
          </p>
          
          <div class="space-y-5 py-2">
            <div class="flex items-start gap-4">
              <span class="text-[#fdd798] text-xl md:text-2xl mt-0.5">✓</span>
              <div>
                <p class="font-bold text-white text-base md:text-lg">{{ 'Profesionales verificables en RETHUS' }}</p>
                <p class="text-gray-400 text-sm md:text-base mt-1">{{ 'Trabajamos con profesionales que pueden ser verificados a través del registro oficial de talento humano en salud correspondiente.' }}</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <span class="text-[#fdd798] text-xl md:text-2xl mt-0.5">✓</span>
              <div>
                <p class="font-bold text-white text-base md:text-lg">{{ 'Instituciones habilitadas en REPS' }}</p>
                <p class="text-gray-400 text-sm md:text-base mt-1">{{ 'Fomentamos la realización de procedimientos en instituciones habilitadas y verificables en los registros oficiales correspondientes.' }}</p>
              </div>
            </div>
          </div>
          
          <div class="pt-6 flex flex-col sm:flex-row flex-wrap gap-4">
            <NuxtLink :to="'/financiacion#calculadora'" class="w-full sm:w-auto bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-[#fdd798] transition-all shadow-md active:scale-95 text-center">
              {{ 'Simular financiación' }}
            </NuxtLink>
            <NuxtLink :to="'/#aliados'" class="w-full sm:w-auto border-2 border-white/30 text-white px-8 py-4 rounded-full font-bold hover:bg-white hover:text-black transition-all active:scale-95 text-center">
              {{ 'Ver respaldo clínico' }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

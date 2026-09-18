<template>
  <div class="bg-[#F7F3EE] min-h-screen flex flex-col">
    <!-- Hero Section -->
    <section class="relative w-full flex flex-col md:flex-row min-h-[calc(100vh-88px)] bg-[#fcf9f8]">
      <!-- Left Content -->
      <div class="w-full md:w-[55%] lg:w-1/2 flex flex-col justify-center px-6 md:pl-12 lg:pl-24 xl:pl-32 py-16 md:py-24 z-10 relative">
        <p class="text-[11px] font-bold tracking-[0.15em] text-[#0C2619] uppercase mb-4 flex items-center gap-3">
          <span class="w-2 h-2 rounded-full bg-[#0C2619]"></span>
          SIMULADOR FINANCIERO
        </p>
        <h1 class="font-serif text-[40px] md:text-[56px] lg:text-[72px] font-medium leading-[1.05] tracking-[-0.02em] text-[#0C2619] uppercase mb-6 max-w-lg drop-shadow-sm">
          DISEÑA TU<br/>
          PLAN DE PAGO.
        </h1>
        <div class="w-12 border-t-2 border-[#D3A76A] mb-8"></div>
        <p class="text-[15px] md:text-[16px] text-[#4c4546] font-normal leading-[1.6] max-w-[360px] mb-12">
          Explora opciones de financiación flexibles y encuentra el plan que se adapta a ti.
        </p>
        
        <!-- Beneficios -->
        <div class="flex gap-4 md:gap-6 mb-12 max-w-2xl text-left">
          <div class="flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#1c1b1b] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            <h4 class="text-[9px] md:text-[10px] font-bold text-[#1c1b1b] uppercase tracking-widest mb-1">PLANES FLEXIBLES</h4>
            <p class="text-[11px] text-[#4c4546] leading-relaxed">Elige el plazo que<br/>mejor se ajuste a ti.</p>
          </div>
          <div class="flex-1 border-l border-[#cfc4c5] pl-4 md:pl-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#1c1b1b] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <h4 class="text-[9px] md:text-[10px] font-bold text-[#1c1b1b] uppercase tracking-widest mb-1">SEGURO Y CONFIABLE</h4>
            <p class="text-[11px] text-[#4c4546] leading-relaxed">Tus datos están<br/>protegidos.</p>
          </div>
          <div class="flex-1 border-l border-[#cfc4c5] pl-4 md:pl-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#1c1b1b] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <h4 class="text-[9px] md:text-[10px] font-bold text-[#1c1b1b] uppercase tracking-widest mb-1">ASESOR PERSONAL</h4>
            <p class="text-[11px] text-[#4c4546] leading-relaxed">Un asesor te acompaña<br/>en cada paso.</p>
          </div>
        </div>
      </div>
    
      <!-- Right Image -->
      <div class="w-full md:w-[45%] lg:w-1/2 md:absolute md:top-0 md:right-0 md:bottom-0 h-[400px] md:h-auto overflow-hidden relative">
        <img src="/images/web/portada_simulador.png" alt="Diseña tu plan de pago" class="w-full h-full object-cover object-[center_20%]" />
        
        <!-- Gradient Overlay for smooth transition on desktop -->
        <div class="hidden md:block absolute inset-y-0 left-0 w-32 lg:w-48 bg-gradient-to-r from-[#fcf9f8] to-transparent"></div>
        <!-- Gradient Overlay for bottom transition on mobile -->
        <div class="md:hidden absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#fcf9f8] to-transparent"></div>
      </div>
    </section>
    
    <!-- Premium Dark Section -->
    <div class="bg-white py-20 md:py-24 w-full flex-grow">
      <div class="max-w-[1200px] mx-auto px-4 md:px-12">
        <!-- Simulator Container -->
        <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Controls -->
        <div class="lg:col-span-2 bg-[#E7DDD1] p-8 md:p-12 rounded-[2rem] shadow-sm border border-[#BBB2AA]/30">
          <h2 class="font-serif text-3xl font-bold text-[#111111] mb-10">Calcula tu plan de pago</h2>
          
          <div class="space-y-12">
            <!-- Selectors -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="flex flex-col gap-4">
                <label class="font-bold text-sm text-[#111111]">Procedimiento</label>
                <select v-model="procedure" class="w-full bg-white border border-[#BBB2AA]/30 p-4 rounded-xl text-lg focus:outline-none focus:border-[#D3A76A] transition-colors">
                  <option v-for="proc in availableProcedures" :key="proc.id" :value="proc.id">
                    {{ proc.name }}
                  </option>
                </select>
              </div>

              <div class="flex flex-col gap-4">
                <label class="font-bold text-sm text-[#111111]">Ciudad de Operación</label>
                <select v-model="city" class="w-full bg-white border border-[#BBB2AA]/30 p-4 rounded-xl text-lg focus:outline-none focus:border-[#D3A76A] transition-colors">
                  <option value="Medellín">Medellín</option>
                  <option value="Cali">Cali</option>
                  <option value="Barranquilla">Barranquilla</option>
                  <option value="Por Definir">Por Definir</option>
                </select>
              </div>
            </div>

            <!-- Financing Amount Slider -->
            <div class="space-y-4">
              <div class="flex justify-between items-end">
                <label class="font-bold text-sm text-[#111111]">Monto a financiar</label>
                <div class="relative">
                  <span class="absolute left-2 top-1/2 -translate-y-1/2 text-2xl font-bold text-[#111111]">$</span>
                  <input 
                    type="text" 
                    v-model="displayAmount"
                    @blur="handleAmountBlur"
                    class="bg-transparent pl-8 text-2xl md:text-3xl font-bold text-[#111111] w-[180px] md:w-[220px] text-right focus:outline-none border-b border-transparent focus:border-[#0C2619] transition-colors"
                  />
                </div>
              </div>
              <input 
                type="range" 
                v-model.number="amount" 
                :min="MIN_AMOUNT" 
                :max="MAX_AMOUNT" 
                :step="STEP_AMOUNT" 
                class="w-full h-2 bg-[#BBB2AA]/30 rounded-lg appearance-none cursor-pointer accent-[#D3A76A]"
              />
              <div class="flex justify-between text-xs text-[#111111]/60 font-bold mt-2">
                <span>${{ MIN_AMOUNT / 1000000 }}M</span>
                <span>${{ MAX_AMOUNT / 1000000 }}M</span>
              </div>
              
            </div>

            <!-- Installments -->
            <div class="space-y-4">
              <label class="font-bold text-sm text-[#111111]">Plazo estimado (Meses)</label>
              <div class="grid grid-cols-3 md:grid-cols-7 gap-3 md:gap-4">
                <button 
                  v-for="term in [12, 18, 24, 36, 48, 60, 72]" :key="term"
                  @click="months = term"
                  :class="[
                    'p-4 rounded-xl font-bold text-lg transition-all',
                    months === term 
                      ? 'border-2 border-[#D3A76A] bg-[#D3A76A]/20 text-[#D3A76A]' 
                      : 'border border-[#BBB2AA]/30 text-[#111111]/80 hover:bg-white hover:border-[#BBB2AA]'
                  ]"
                >
                  {{ term }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Result Card Component -->
        <div class="w-full">
          <div class="bg-[#0C2619] text-white p-8 md:p-10 rounded-[2rem] shadow-2xl sticky top-32">
            <h3 class="text-xs font-bold tracking-widest text-[#848484] uppercase mb-8">CUOTA ESTIMADA</h3>
            
            <div v-if="isLoading && !currentQuote" class="flex flex-col gap-4 animate-pulse">
              <div class="h-12 bg-[#313030] rounded w-3/4 mb-4"></div>
              <div class="h-6 bg-[#313030] rounded w-1/2"></div>
            </div>

            <div v-else-if="currentQuote" :class="{'opacity-50 transition-opacity': isLoading}">
              <div class="flex flex-col gap-2 mb-10">
                <span class="text-sm text-[#848484]">Cuota mensual aproximada</span>
                <span class="text-4xl md:text-5xl font-medium text-white tracking-tight leading-none">
                  {{ formatCurrency(currentQuote.monthlyPayment) }}
                </span>
              </div>
              
              <hr class="border-[#313030] mb-8" />
              
              <div class="flex flex-col gap-4 mb-8">
                <div class="flex justify-between items-center text-sm">
                  <span class="text-[#848484]">Total a financiar</span>
                  <span class="font-medium text-white">{{ formatCurrency(amount) }}</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                  <span class="text-[#848484]">Plazo seleccionado</span>
                  <span class="font-medium text-white">{{ months }} meses</span>
                </div>
                
                <div class="flex items-start gap-3 mt-4 p-4 rounded-xl bg-black/40 border border-[#313030]">
                  <p class="text-xs text-[#848484] leading-relaxed">
                    {{ currentQuote.disclaimer }}
                  </p>
                </div>
              </div>
              
              <div class="flex flex-col gap-4">
                <button @click="isLeadFormOpen = true" class="w-full bg-white text-[#0C2619] py-4 rounded-xl font-bold text-xs tracking-widest uppercase hover:bg-white transition-colors flex justify-center items-center gap-3">
                  SOLICITAR FINANCIACIÓN
                </button>
                <p class="text-[11px] text-[#848484] text-center leading-relaxed">
                  ¿Tienes alguna situación en centrales de riesgo? Puedes realizar tu solicitud. La viabilidad será determinada durante el estudio de crédito con un asesor.
                </p>
              </div>
            </div>
            
            <div v-else class="text-[#848484] text-sm">
              Modifica los valores para generar tu estimación.
            </div>
            
          </div>
        </div>

        </section>
      </div>
    </div>
    
    <!-- Lead Form Modal -->
    <FormsLeadForm 
      v-model:isOpen="isLeadFormOpen"
      :procedure="procedure"
      :amount="amount"
      :installments="months"
      :city="city"
    />
  </div>
</template>

<script setup>
import { useSimulator } from '~/composables/useSimulator'
import { watch, ref, onMounted } from 'vue'

useSeoMeta({
  title: 'Simulador | Planmed',
  description: 'Estima tu plan de pago con el simulador financiero de Planmed.',
})

const isLeadFormOpen = ref(false)

const {
  amount,
  months,
  procedure,
  city,
  currentQuote,
  isLoading,
  formatCurrency,
  displayAmount,
  handleAmountBlur,
  submitSimulation,
  availableProcedures,
  MIN_AMOUNT,
  MAX_AMOUNT,
  STEP_AMOUNT
} = useSimulator()

// Calculate immediately on mount
onMounted(() => {
  submitSimulation()
})

let simulatorDebounceTimer = null
watch([amount, months, procedure, city], () => {
  if (simulatorDebounceTimer) clearTimeout(simulatorDebounceTimer)
  
  // Calculate new quote after a short delay
  simulatorDebounceTimer = setTimeout(() => {
    submitSimulation()
  }, 400)
}, { deep: true })
</script>

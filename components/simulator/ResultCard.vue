<template>
  <div class="bg-black text-white rounded-[2rem] p-6 md:p-10 flex flex-col justify-between shadow-xl">
    <div>
      <h3 class="text-2xl font-bold mb-8">{{ 'Resumen de Cuota' }}</h3>
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <span class="text-white/80">{{ 'Cuota Mensual Estimada' }}</span>
          <span class="text-3xl font-bold text-primary">{{ formatCurrency(monthlyPayment) }}*</span>
        </div>
      </div>
      <div class="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10">
        <div class="flex gap-4 items-start">
          <span class="text-primary text-xl">ℹ️</span>
          <p class="text-sm text-white/90 leading-relaxed">
            {{ 'Esta es una simulación informativa y no constituye una oferta vinculante. Los valores definitivos se entregan tras el estudio de perfil y no representan aprobación crediticia automática.' }}
          </p>
        </div>
      </div>
    </div>
    <button @click="$emit('submit')" class="w-full mt-10 bg-primary text-black py-5 rounded-2xl font-bold hover:scale-95 transition-all shadow-lg text-lg">
      {{ 'Solicitar Aprobación' }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  monthlyPayment: Number,
  formatCurrency: Function
})
defineEmits(['submit'])
</script>

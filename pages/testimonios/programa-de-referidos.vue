<template>
  <div class="bg-[#fcf9f8] min-h-screen font-sans pt-24 md:pt-32 pb-24">
    <div class="max-w-[900px] mx-auto px-6">
      <h1 class="font-serif text-[36px] md:text-[52px] font-medium leading-[1.05] tracking-[-0.02em] text-[#0C2619] uppercase text-center mb-10">
        {{ referral.title || 'Programa de referidos' }}
      </h1>
      <TestimonialsNav />

      <CommonHubUnavailable v-if="error" :retrying="status === 'pending'" @retry="refresh()" />
      <CommonRichContent v-else-if="referral.content" :html="referral.content" class="text-gray-700 font-light leading-relaxed" />
      <!-- Sin texto administrado en Hub: se muestra el contenido del programa entregado por Planmed (estático). -->
      <ReferralProgramContent v-else-if="loaded" />

      <!-- Formulario (maqueta, aún no funcional; destino futuro: CRM médico). Se muestra con el texto de Hub o con el estático, no en error. -->
      <ReferralForm v-if="loaded && !error" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSeoMeta } from '#imports'
import { publicTestimonialsService } from '~/services/PublicTestimonialsService'

// Se lee de Wellezy Hub (vía Nitro) también en el servidor.
const { data, status, error, refresh } = await useAsyncData('patient-section', () => publicTestimonialsService.getContent())
useServiceUnavailable(error)
const referral = computed(() => data.value?.referral ?? { title: '', content: '' })
const loaded = computed(() => status.value === 'success' || status.value === 'error')

const description = 'Conoce el programa de referidos de Planmed.'
useSeoMeta({ title: 'Programa de referidos | Planmed', description, ogTitle: 'Programa de referidos | Planmed', ogDescription: description })
</script>

<template>
  <div class="bg-[#fcf9f8] min-h-screen font-sans selection:bg-[#0C2619] selection:text-white pt-6 md:pt-10 pb-24">
    <div class="max-w-[1200px] mx-auto px-6">
      <CommonPageHero
        eyebrow="PROGRAMA DE REMISIÓN"
        :lines="referral.title ? [referral.title] : ['PROGRAMA DE', 'REFERIDOS.']"
        lead="Recomienda a Planmed con tus familiares y amig@s y recibe una bonificación cuando se operen con nosotros."
      />
      <TestimonialsNav />

      <div class="max-w-[900px] mx-auto">
        <CommonHubUnavailable v-if="error" :retrying="status === 'pending'" @retry="refresh()" />
        <CommonRichContent v-else-if="referral.content" :html="referral.content" class="bg-white border border-[#e5e2e1] p-6 md:p-12 text-gray-700 font-light leading-relaxed" />
        <!-- Sin texto administrado en Hub: se muestra el contenido del programa entregado por Planmed (estático). -->
        <ReferralProgramContent v-else-if="loaded" />

        <!-- Formulario (maqueta, aún no funcional; destino futuro: CRM médico). Se muestra con el texto de Hub o con el estático, no en error. -->
        <ReferralForm v-if="loaded && !error" />
      </div>
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

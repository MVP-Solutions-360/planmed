<template>
  <div>
    <!-- Éxito -->
    <div v-if="status === 'success'" class="text-center py-10 md:py-14" role="status">
      <div class="w-16 h-16 mx-auto mb-6 rounded-full bg-[#0C2619] text-[#D3A76A] flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
      </div>
      <h3 class="font-serif text-2xl md:text-3xl font-medium text-black uppercase tracking-tight mb-3">¡Gracias, {{ firstName }}!</h3>
      <p class="text-gray-600 font-light leading-relaxed max-w-sm mx-auto mb-8">
        Recibimos tus datos. Una asesora de Planmed se pondrá en contacto contigo muy pronto para agendar tu valoración.
      </p>
      <NuxtLink to="/" class="inline-block text-[11px] font-bold tracking-[0.15em] text-[#0C2619] uppercase border-b-2 border-[#0C2619] pb-1 hover:text-black hover:border-black transition-colors">
        Volver al inicio
      </NuxtLink>
    </div>

    <!-- Formulario (idle / submitting / error) -->
    <form v-else @submit.prevent="onSubmit" novalidate class="space-y-5">
      <div v-if="status === 'error'" class="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 text-sm" role="alert">
        {{ errorMessage }}
      </div>

      <div>
        <label for="prp-nombres" class="block text-[11px] font-bold tracking-[0.12em] text-gray-700 uppercase mb-2">Nombres y apellidos *</label>
        <input id="prp-nombres" v-model="form.fullName" type="text" autocomplete="name" maxlength="150"
          :aria-invalid="!!errors.fullName" :class="inputClass(errors.fullName)" />
        <p v-if="errors.fullName" class="text-red-600 text-xs mt-1">{{ errors.fullName }}</p>
      </div>

      <div>
        <label for="prp-telefono" class="block text-[11px] font-bold tracking-[0.12em] text-gray-700 uppercase mb-2">Teléfono *</label>
        <input id="prp-telefono" v-model="form.phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20"
          :aria-invalid="!!errors.phone" :class="inputClass(errors.phone)" />
        <p v-if="errors.phone" class="text-red-600 text-xs mt-1">{{ errors.phone }}</p>
      </div>

      <div>
        <label for="prp-ciudad" class="block text-[11px] font-bold tracking-[0.12em] text-gray-700 uppercase mb-2">Ciudad *</label>
        <input id="prp-ciudad" v-model="form.city" type="text" autocomplete="address-level2" maxlength="100"
          :aria-invalid="!!errors.city" :class="inputClass(errors.city)" />
        <p v-if="errors.city" class="text-red-600 text-xs mt-1">{{ errors.city }}</p>
      </div>

      <div>
        <label for="prp-cirugia" class="block text-[11px] font-bold tracking-[0.12em] text-gray-700 uppercase mb-2">¿Qué cirugía te quieres realizar? *</label>
        <input id="prp-cirugia" v-model="form.surgery" type="text" list="prp-cirugias" maxlength="150"
          :aria-invalid="!!errors.surgery" :class="inputClass(errors.surgery)" />
        <datalist id="prp-cirugias">
          <option v-for="name in surgeryOptions" :key="name" :value="name" />
        </datalist>
        <p v-if="errors.surgery" class="text-red-600 text-xs mt-1">{{ errors.surgery }}</p>
      </div>

      <div>
        <label class="flex items-start gap-3 cursor-pointer p-4 bg-[#fcf9f8] border border-[#e5e2e1]">
          <input v-model="form.accepted" type="checkbox" class="mt-0.5 w-5 h-5 shrink-0 accent-[#0C2619] border-gray-300 cursor-pointer" :aria-invalid="!!errors.accepted" />
          <span class="text-xs text-gray-600 leading-relaxed select-none">
            Acepto la
            <NuxtLink to="/recursos" target="_blank" class="text-[#0C2619] font-bold underline underline-offset-2" @click.stop>política de tratamiento de datos personales</NuxtLink>
            y autorizo ser contactado para recibir información. *
          </span>
        </label>
        <p v-if="errors.accepted" class="text-red-600 text-xs mt-1 font-bold">{{ errors.accepted }}</p>
      </div>

      <button type="submit" :disabled="status === 'submitting'"
        class="w-full bg-[#0C2619] text-white font-bold text-xs tracking-[0.15em] uppercase py-4 px-6 rounded-[2px] hover:bg-black transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3">
        <span v-if="status === 'submitting'" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        {{ status === 'submitting' ? 'Enviando...' : status === 'error' ? 'Intentar nuevamente' : 'Agendar mi valoración' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { prpLeadService } from '~/services/PrpLeadService'
import { procedureService } from '~/services/ProcedureService'
import { PrpLeadError } from '~/types/prpPublic'

// `codePrp` es el código externo del PRP recuperado desde Hub; la persona nunca lo ve ni lo escribe.
const props = defineProps<{ codePrp: string }>()

type Status = 'idle' | 'submitting' | 'success' | 'error'
const status = ref<Status>('idle')
const errorMessage = ref('')

const form = reactive({ fullName: '', phone: '', city: '', surgery: '', accepted: false })
const errors = reactive<Record<string, string>>({})

const surgeryOptions = ref<string[]>([])
onMounted(async () => {
  try {
    surgeryOptions.value = (await procedureService.getProcedures()).map(p => p.name)
  } catch {
    // Las sugerencias son opcionales: el campo sigue siendo de texto libre.
  }
})

const firstName = computed(() => form.fullName.trim().split(/\s+/)[0] || '')

function inputClass(error?: string) {
  return [
    'w-full px-4 py-3 bg-white border rounded-[2px] focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent transition-all',
    error ? 'border-red-500' : 'border-[#e5e2e1]'
  ]
}

function validate(): boolean {
  for (const key of Object.keys(errors)) delete errors[key]

  if (!form.fullName.trim()) errors.fullName = 'Ingresa tus nombres y apellidos.'
  else if (form.fullName.trim().length < 3) errors.fullName = 'Ingresa tu nombre completo.'

  const digits = form.phone.replace(/\D/g, '')
  if (!form.phone.trim()) errors.phone = 'Ingresa tu número de teléfono.'
  else if (digits.length < 7 || digits.length > 15 || !/^[+\d\s()-]+$/.test(form.phone.trim())) errors.phone = 'Ingresa un número de teléfono válido.'

  if (!form.city.trim()) errors.city = 'Ingresa tu ciudad.'
  if (!form.surgery.trim()) errors.surgery = 'Cuéntanos qué cirugía te quieres realizar.'
  if (!form.accepted) errors.accepted = 'Debes aceptar la política de tratamiento de datos para continuar.'

  return Object.keys(errors).length === 0
}

async function onSubmit() {
  if (status.value === 'submitting') return
  if (!validate()) return

  status.value = 'submitting'
  errorMessage.value = ''
  try {
    await prpLeadService.submitLead({
      fullName: form.fullName,
      phone: form.phone,
      city: form.city,
      surgery: form.surgery,
      codePrp: props.codePrp
    })
    status.value = 'success'
  } catch (e) {
    errorMessage.value = e instanceof PrpLeadError && e.kind === 'validation'
      ? 'Revisa que tus datos estén completos y correctos e intenta nuevamente.'
      : 'No pudimos enviar tus datos en este momento. Por favor intenta nuevamente en unos minutos.'
    status.value = 'error'
  }
}
</script>

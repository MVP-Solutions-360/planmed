<template>
  <section aria-labelledby="ref-form-title" class="mt-14 border-t border-black pt-10">
    <!-- Resultado: «completed» solo cuando el CRM médico confirmó; «received» = guardada, pendiente de procesar. -->
    <div v-if="status === 'completed' || status === 'received'" role="status" :data-testid="`referral-${status}`" class="bg-white border border-[#e5e2e1] p-8 md:p-12 text-center">
      <div class="w-14 h-14 mx-auto mb-5 rounded-full bg-[#0C2619] text-[#D3A76A] flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
      </div>
      <h2 class="font-serif text-2xl md:text-3xl font-medium text-[#0C2619] mb-3">{{ status === 'completed' ? '¡Gracias! Quedaste inscrita en el programa' : 'Recibimos tu inscripción' }}</h2>
      <p class="text-gray-600 leading-relaxed max-w-md mx-auto">
        <template v-if="status === 'completed'">Tu inscripción quedó registrada. Una asesora de Planmed se pondrá en contacto contigo.</template>
        <template v-else>La estamos procesando y aún no está confirmada del todo. No necesitas enviarla de nuevo; una asesora de Planmed se pondrá en contacto contigo.</template>
      </p>
    </div>

    <form v-else novalidate class="bg-white border border-[#e5e2e1] border-t-4 border-t-[#0C2619] p-5 sm:p-8 md:p-12 space-y-6" data-testid="referral-form" @submit.prevent="onSubmit">
      <div>
        <p class="text-[11px] font-bold tracking-[0.15em] text-[#848484] uppercase mb-3">Inscripción</p>
        <h2 id="ref-form-title" class="font-serif text-3xl md:text-4xl font-medium text-[#0C2619]">Regístrate en el programa</h2>
      </div>

      <div v-if="status === 'error'" role="alert" data-testid="referral-error" class="border border-red-300 border-l-4 border-l-red-600 bg-red-50 text-red-800 px-4 py-3 text-sm leading-relaxed">
        {{ errorMessage }}
      </div>

      <div v-for="f in fields" :key="f.id">
        <label :for="`rf-${f.id}`" class="lbl">{{ f.label }}</label>
        <input :id="`rf-${f.id}`" v-model="values[f.key]" class="field" :type="f.type ?? 'text'" :inputmode="f.inputmode" :autocomplete="f.autocomplete" :maxlength="f.maxlength" :aria-invalid="!!errors[f.key]" />
        <p v-if="errors[f.key]" class="err" :data-testid="`rf-error-${f.key}`">{{ errors[f.key] }}</p>
      </div>

      <div>
        <label for="rf-tipo-doc" class="lbl">Tipo de documento</label>
        <select id="rf-tipo-doc" v-model="values.document_type" class="field" :aria-invalid="!!errors.document_type">
          <option value="">Seleccione</option>
          <option v-for="t in DOCUMENT_TYPES" :key="t.value" :value="t.label">{{ t.label }}</option>
        </select>
        <p v-if="errors.document_type" class="err" data-testid="rf-error-document_type">{{ errors.document_type }}</p>
      </div>
      <div>
        <label for="rf-num-doc" class="lbl">Número de documento</label>
        <input id="rf-num-doc" v-model="values.document_number" class="field" type="text" autocomplete="off" maxlength="25" :aria-invalid="!!errors.document_number" />
        <p v-if="errors.document_number" class="err" data-testid="rf-error-document_number">{{ errors.document_number }}</p>
      </div>

      <fieldset>
        <legend class="lbl">¿Deseas que te programemos una cita de control?</legend>
        <div class="flex gap-6 mt-1">
          <label v-for="o in ['Sí', 'No']" :key="o" class="radio"><input v-model="control" type="radio" name="rf-control" :value="o" /> {{ o }}</label>
        </div>
        <p class="mt-2 text-sm italic text-gray-600">*La cita de revisión será asignada de acuerdo a disponibilidad en agenda*</p>
      </fieldset>

      <fieldset>
        <legend class="lbl">El pago de la bonificación prefieres que sea:</legend>
        <div class="flex flex-wrap gap-x-8 gap-y-2 mt-1">
          <label v-for="o in PAYMENT_METHODS" :key="o" class="radio"><input v-model="values.payment_method" type="radio" name="rf-pago" :value="o" /> {{ o }}</label>
        </div>
        <p v-if="errors.payment_method" class="err">{{ errors.payment_method }}</p>
      </fieldset>

      <!-- Datos bancarios: SOLO con transferencia. Al cambiar a efectivo se vacían y no se envían. -->
      <fieldset v-if="transfer" class="space-y-4 border border-[#e5e2e1] bg-[#fcf9f8] p-5" data-testid="referral-bank">
        <legend class="lbl px-2">Si elegiste pago por transferencia ingresa</legend>
        <div v-for="f in bankFields" :key="f.id">
          <label :for="`rf-${f.id}`" class="block text-sm text-[#4c4546] mb-1.5">{{ f.label }}</label>
          <input :id="`rf-${f.id}`" v-model="values[f.key]" class="field" :inputmode="f.inputmode" autocomplete="off" :aria-invalid="!!errors[f.key]" />
          <p v-if="errors[f.key]" class="err" :data-testid="`rf-error-${f.key}`">{{ errors[f.key] }}</p>
        </div>
      </fieldset>

      <div>
        <label for="rf-sugerencia" class="lbl">¿Tienes alguna sugerencia para nuestro grupo?</label>
        <textarea id="rf-sugerencia" v-model="values.suggestion" rows="5" maxlength="1000" class="field !h-auto py-3"></textarea>
        <p v-if="errors.suggestion" class="err">{{ errors.suggestion }}</p>
      </div>

      <div>
        <div class="flex items-start gap-3">
          <input id="rf-acepto" v-model="values.accepted_contract" type="checkbox" class="mt-1 w-4 h-4 accent-[#0C2619]" :aria-invalid="!!errors.accepted_contract" />
          <label for="rf-acepto" class="text-sm text-[#4c4546] uppercase leading-snug">Entiendo y acepto las condiciones del contrato de remisión de pacientes</label>
        </div>
        <p v-if="errors.accepted_contract" class="err font-bold" data-testid="rf-error-accepted_contract">{{ errors.accepted_contract }}</p>
      </div>

      <div>
        <button type="submit" :disabled="status === 'submitting'" data-testid="referral-submit" class="w-full bg-[#0C2619] hover:bg-[#153a28] text-white py-4 text-xs font-bold tracking-widest uppercase transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3">
          <span v-if="status === 'submitting'" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          {{ status === 'submitting' ? 'Enviando...' : 'Enviar' }}
        </button>
      </div>
    </form>

    <ul class="mt-8 space-y-1 text-sm italic text-gray-600">
      <li>*El cobro de bonos no aplica a paquetes quirúrgicos y valores de jornadas publicadas en nuestras redes sociales.</li>
      <li>*La paciente adscrita al programa podrá decidir también si el valor de su bono se aplica como «descuento» en la cotización de la paciente referida.</li>
      <li>*El pago de bonos por pacientes operadas en nuestra línea de crédito dependerá del pago oportuno de las cuotas por parte de la paciente referida.</li>
    </ul>
  </section>
</template>

<script setup lang="ts">
// Inscripción al Programa de referidos (PRP). Envía a POST /api/forms/prp-enrollment (servidor de Planmed → Hub). Los datos
// (incluidos los bancarios) solo viven en memoria: no se guardan en el almacenamiento del navegador ni se registran.
import { ref, reactive, computed, watch } from 'vue'
import { DOCUMENT_TYPES, PAYMENT_METHODS, isTransfer, normalizeEnrollment, validateEnrollment, type EnrollmentErrors, type EnrollmentInput } from '#shared/utils/prpEnrollment'
import { referralService, ReferralError } from '~/services/ReferralService'

type TextKey = 'full_name' | 'phone' | 'email' | 'surgery_date' | 'surgery_name' | 'bank_holder_name' | 'bank_holder_document' | 'bank_account_number'
interface F { id: string, key: TextKey, label: string, type?: string, inputmode?: 'text' | 'numeric' | 'tel' | 'email', autocomplete?: string, maxlength?: number }
const fields: F[] = [
  { id: 'nombre', key: 'full_name', label: 'Ingresa tu nombre completo', autocomplete: 'name', maxlength: 150 },
  { id: 'celular', key: 'phone', label: 'Actualiza tu número de WhatsApp o celular', type: 'tel', inputmode: 'tel', autocomplete: 'tel', maxlength: 20 },
  { id: 'correo', key: 'email', label: 'Actualiza tu correo electrónico', type: 'email', inputmode: 'email', autocomplete: 'email', maxlength: 150 },
  { id: 'fecha-cirugia', key: 'surgery_date', label: 'Ingresa la fecha en la que te operaste con nosotros', type: 'date' },
  { id: 'cirugia', key: 'surgery_name', label: '¿Qué cirugía te practicaste?', maxlength: 150 }
]
const bankFields: F[] = [
  { id: 'titular', key: 'bank_holder_name', label: 'Nombre del titular' },
  { id: 'cedula', key: 'bank_holder_document', label: 'Número de cédula', inputmode: 'numeric' },
  { id: 'cuenta', key: 'bank_account_number', label: 'Número de cuenta', inputmode: 'numeric' }
]

const empty = (): EnrollmentInput => ({
  full_name: '', phone: '', email: '', document_type: '', document_number: '', surgery_date: '', surgery_name: '', wants_control: true,
  payment_method: 'Efectivo', suggestion: '', bank_holder_name: '', bank_holder_document: '', bank_account_number: '', accepted_contract: false
})
const values = reactive<EnrollmentInput>(empty())
const errors = reactive<EnrollmentErrors>({})

const control = ref('Sí')
watch(control, (v) => { values.wants_control = v === 'Sí' })

type Status = 'idle' | 'submitting' | 'received' | 'completed' | 'error'
const status = ref<Status>('idle')
const errorMessage = ref('')

const transfer = computed(() => isTransfer(values.payment_method))
// Al cambiar a efectivo, los datos bancarios se vacían (no se conservan en el estado ni se envían).
watch(transfer, (on) => {
  if (on) return
  values.bank_holder_name = ''
  values.bank_holder_document = ''
  values.bank_account_number = ''
  delete errors.bank_holder_name
  delete errors.bank_holder_document
  delete errors.bank_account_number
})

function clearErrors() {
  for (const k of Object.keys(errors)) delete (errors as Record<string, unknown>)[k]
}

async function onSubmit() {
  // Anti doble envío.
  if (status.value === 'submitting') return
  clearErrors()
  const payload = normalizeEnrollment({ ...values })
  const found = validateEnrollment(payload)
  if (Object.keys(found).length) {
    Object.assign(errors, found)
    status.value = 'idle'
    return
  }

  status.value = 'submitting'
  errorMessage.value = ''
  try {
    const result = await referralService.submit(payload)
    // Solo tras la respuesta del servidor se descartan los datos (incluidos los bancarios).
    Object.assign(values, empty())
    control.value = 'Sí'
    status.value = result
  } catch (e) {
    // Los datos se conservan para corregir o reintentar (la clave de idempotencia evita duplicados).
    const err = e instanceof ReferralError ? e : null
    if (err?.kind === 'validation') Object.assign(errors, err.fields)
    errorMessage.value = err?.message ?? 'No pudimos registrar tu inscripción. Inténtalo de nuevo en unos minutos.'
    status.value = 'error'
  }
}
</script>

<style scoped>
.lbl { display: block; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #9a7a45; margin-bottom: .5rem; }
.field { width: 100%; height: 2.75rem; padding: 0 .75rem; background: #fff; border: 1px solid #cfc4c5; border-radius: 2px; font-size: .9375rem; color: #1c1b1b; }
.field:focus { outline: 2px solid #0C2619; outline-offset: 0; border-color: #0C2619; }
.field[aria-invalid="true"] { border-color: #dc2626; }
.err { margin-top: .35rem; font-size: .75rem; color: #b91c1c; }
.radio { display: inline-flex; align-items: center; gap: .5rem; font-size: .9375rem; color: #4c4546; cursor: pointer; }
.radio input { accent-color: #0C2619; width: 1rem; height: 1rem; }
</style>

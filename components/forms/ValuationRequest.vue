<template>
  <div>
    <!-- Botón flotante (sobre el de WhatsApp) -->
    <button
      ref="trigger"
      type="button"
      data-testid="valuation-fab"
      class="fixed bottom-[5.25rem] right-4 md:bottom-28 md:right-8 z-40 bg-[#0C2619] text-white pl-4 pr-5 py-3 rounded-full shadow-2xl border border-[#D3A76A]/60 flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-[#153a28] hover:scale-105 active:scale-95 transition-all"
      aria-haspopup="dialog"
      @click="open"
    >
      <svg class="w-4 h-4 text-[#D3A76A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      Pide tu cita
    </button>

    <div v-if="isOpen" class="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4" @click.self="close" @keydown.esc="close">
      <div ref="dialog" role="dialog" aria-modal="true" aria-labelledby="valuation-title" tabindex="-1" class="relative bg-white w-full max-w-md max-h-[92dvh] flex flex-col shadow-2xl border border-[#e5e2e1] focus:outline-none">
        <button type="button" class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600" aria-label="Cerrar formulario" @click="close">✕</button>

        <div class="px-6 pt-6 pb-4 border-b border-[#e5e2e1] shrink-0">
          <h2 id="valuation-title" class="font-serif text-2xl text-[#0C2619] pr-8">Pide tu cita de valoración</h2>
        </div>

        <!-- Éxito: solo cuando el CRM confirma el registro -->
        <div v-if="status === 'success'" role="status" data-testid="valuation-success" class="px-6 py-10 text-center">
          <div class="w-14 h-14 mx-auto mb-5 rounded-full bg-[#0C2619] text-[#D3A76A] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          </div>
          <p class="font-serif text-xl text-[#0C2619] mb-2">¡Gracias! Recibimos tu solicitud.</p>
          <p class="text-sm text-gray-600 leading-relaxed mb-6">Una asesora de Planmed se pondrá en contacto contigo muy pronto para agendar tu valoración.</p>
          <button type="button" class="bg-[#0C2619] hover:bg-[#153a28] text-white px-10 py-3 text-xs font-bold tracking-widest uppercase transition-colors" @click="close">Cerrar</button>
        </div>

        <form v-else novalidate class="flex flex-col min-h-0" data-testid="valuation-form" @submit.prevent="onSubmit">
          <div class="overflow-y-auto overscroll-contain px-6 py-5 space-y-4">
            <div v-if="status === 'error'" role="alert" data-testid="valuation-error" class="border border-red-300 border-l-4 border-l-red-600 bg-red-50 text-red-800 px-4 py-3 text-xs leading-relaxed">
              {{ errorMessage }}
            </div>

            <div v-for="fd in fields" :key="fd.id">
              <label :for="`vr-${fd.id}`" class="block text-sm font-semibold text-[#4c4546] mb-1.5">{{ fd.label }}<span aria-hidden="true"> *</span><span class="sr-only"> (obligatorio)</span></label>
              <select v-if="fd.id === 'cirugia'" :id="`vr-${fd.id}`" v-model="values.name_surgery" class="field" required :aria-invalid="!!errors.name_surgery" :disabled="procLoading || !procedures.length">
                <option value="">{{ procLoading ? 'Cargando procedimientos...' : 'Seleccione' }}</option>
                <option v-for="name in procedures" :key="name" :value="name">{{ name }}</option>
              </select>
              <select v-else-if="fd.options" :id="`vr-${fd.id}`" v-model="values[fd.key]" class="field" required :aria-invalid="!!errors[fd.key]">
                <option value="">Seleccione</option>
                <option v-for="o in fd.options" :key="o" :value="o">{{ o }}</option>
              </select>
              <input v-else :id="`vr-${fd.id}`" v-model="values[fd.key]" class="field" :type="fd.type ?? 'text'" :inputmode="fd.inputmode" :autocomplete="fd.autocomplete" :maxlength="fd.maxlength" required :aria-invalid="!!errors[fd.key]" />
              <p v-if="errors[fd.key]" class="text-red-600 text-xs mt-1" :data-testid="`vr-error-${fd.key}`">{{ errors[fd.key] }}</p>
              <p v-if="fd.id === 'cirugia' && procError" class="text-xs text-red-700 mt-1">No pudimos cargar los procedimientos. <button type="button" class="underline font-semibold" @click="loadProcedures">Reintentar</button></p>
            </div>

            <div class="pt-1">
              <div class="flex items-start gap-3">
                <input id="vr-habeas" v-model="values.accept" type="checkbox" class="mt-1 w-4 h-4 accent-[#0C2619]" :aria-invalid="!!errors.accept" />
                <label for="vr-habeas" class="text-sm text-gray-600 leading-relaxed">He leído y acepto <a :href="PRIVACY_POLICY_URL" target="_blank" rel="noopener noreferrer" class="text-[#0C2619] font-semibold underline underline-offset-2">las Políticas de Tratamiento de Datos Personales</a></label>
              </div>
              <p v-if="errors.accept" class="text-red-600 text-xs mt-1 font-bold" data-testid="vr-error-accept">{{ errors.accept }}</p>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-[#e5e2e1] bg-[#fcf9f8] shrink-0 flex justify-center">
            <button type="submit" :disabled="status === 'submitting'" data-testid="valuation-submit" class="bg-[#0C2619] hover:bg-[#153a28] text-white px-10 py-3 text-xs font-bold tracking-widest uppercase transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3">
              <span v-if="status === 'submitting'" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {{ status === 'submitting' ? 'Enviando...' : 'Enviar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// «Pide tu cita de valoración»: botón flotante + ventana emergente. Envía a POST /api/forms/valuation (servidor de Planmed → CRM médico).
// Los datos personales solo viven en memoria mientras el formulario está abierto: no se guardan en el almacenamiento del navegador ni se registran.
import { ref, reactive, nextTick, watch, onBeforeUnmount } from 'vue'
import { normalizeValuation, validateValuation, PAYMENT_OPTIONS, type ValuationErrors, type ValuationInput } from '#shared/utils/valuation'
import { valuationService, ValuationError } from '~/services/ValuationService'
import { publicProcedureService } from '~/services/PublicProcedureService'

// Política de tratamiento de datos personales (PDF del CRM), en una pestaña nueva.
const PRIVACY_POLICY_URL = 'https://pdtclientsolutions.com/crm-public/Politica_Tratamiento_Personal.pdf'

type FieldKey = Exclude<keyof ValuationInput, 'accept'>
interface F { id: string, key: FieldKey, label: string, type?: string, inputmode?: 'text' | 'numeric' | 'tel' | 'email', autocomplete?: string, maxlength?: number, options?: string[] }
const fields: F[] = [
  { id: 'nombres', key: 'nombres', label: 'Nombres', autocomplete: 'given-name', maxlength: 100 },
  { id: 'apellidos', key: 'apellidos', label: 'Apellidos', autocomplete: 'family-name', maxlength: 100 },
  { id: 'cedula', key: 'identificacion', label: 'Número de cédula', inputmode: 'numeric', maxlength: 20 },
  { id: 'nacimiento', key: 'fecha_nacimiento', label: 'Fecha de nacimiento', type: 'date', autocomplete: 'bday' },
  { id: 'ciudad', key: 'direccion', label: 'Ciudad', autocomplete: 'address-level2', maxlength: 100 },
  { id: 'telefono', key: 'telefono', label: 'Teléfono', type: 'tel', inputmode: 'tel', autocomplete: 'tel', maxlength: 20 },
  { id: 'email', key: 'email', label: 'Email', type: 'email', inputmode: 'email', autocomplete: 'email', maxlength: 150 },
  { id: 'cirugia', key: 'name_surgery', label: '¿Qué cirugía se quiere realizar?' },
  { id: 'forma-pago', key: 'forma_pago', label: 'Forma de pago (contado/financiación)', options: PAYMENT_OPTIONS.map(o => o.label) }
]

const empty = (): ValuationInput => ({ nombres: '', apellidos: '', identificacion: '', fecha_nacimiento: '', direccion: '', telefono: '', email: '', name_surgery: '', forma_pago: '', accept: false })
const values = reactive<ValuationInput>(empty())
const errors = reactive<ValuationErrors>({})

type Status = 'idle' | 'submitting' | 'success' | 'error'
const status = ref<Status>('idle')
const errorMessage = ref('')
const isOpen = ref(false)
const trigger = ref<HTMLButtonElement | null>(null)
const dialog = ref<HTMLElement | null>(null)

// Procedimientos de la línea Planmed desde Hub (activos y habilitados); sin lista estática.
const procedures = ref<string[]>([])
const procLoading = ref(false)
const procError = ref(false)
async function loadProcedures() {
  procLoading.value = true
  procError.value = false
  try {
    const names = (await publicProcedureService.getProcedures()).map(p => String(p.name ?? '').trim()).filter(Boolean)
    procedures.value = [...new Set(names)]
  } catch {
    procError.value = true
  } finally {
    procLoading.value = false
  }
}

function clearErrors() {
  for (const k of Object.keys(errors)) delete (errors as Record<string, unknown>)[k]
}

async function onSubmit() {
  // Anti doble envío: mientras se procesa, otra pulsación (o Enter) se ignora.
  if (status.value === 'submitting') return
  clearErrors()
  const payload = normalizeValuation({ ...values })
  const found = validateValuation(payload)
  if (Object.keys(found).length) {
    Object.assign(errors, found)
    status.value = 'idle'
    return
  }

  status.value = 'submitting'
  errorMessage.value = ''
  try {
    await valuationService.submit(payload)
    // Éxito confirmado por el CRM: recién ahora se descartan los datos.
    Object.assign(values, empty())
    status.value = 'success'
  } catch (e) {
    // Los datos se conservan para corregir o reintentar.
    const err = e instanceof ValuationError ? e : null
    if (err?.kind === 'validation') Object.assign(errors, err.fields)
    errorMessage.value = err?.message ?? 'No pudimos registrar tus datos. Inténtalo de nuevo en unos minutos.'
    status.value = 'error'
  }
}

async function open() {
  isOpen.value = true
  if (status.value === 'success') status.value = 'idle'
  if (!procedures.value.length && !procLoading.value) void loadProcedures()
  await nextTick()
  dialog.value?.focus()
}
function close() {
  isOpen.value = false
  trigger.value?.focus()
}

// Bloquea el scroll de la página mientras la ventana está abierta y mantiene el foco dentro (Tab / Shift+Tab).
function trap(e: KeyboardEvent) {
  if (e.key !== 'Tab' || !dialog.value) return
  const items = Array.from(dialog.value.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea')).filter(el => !el.hasAttribute('disabled'))
  if (!items.length) return
  const first = items[0]!, last = items[items.length - 1]!
  if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.value)) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}
watch(isOpen, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
  if (v) document.addEventListener('keydown', trap)
  else document.removeEventListener('keydown', trap)
})
onBeforeUnmount(() => { document.body.style.overflow = ''; document.removeEventListener('keydown', trap) })
</script>

<style scoped>
.field { width: 100%; min-height: 2.5rem; padding: 0 .75rem; background: #fff; border: 1px solid #cfc4c5; border-radius: 3px; font-size: .875rem; color: #1c1b1b; }
.field:focus { outline: 2px solid #0C2619; outline-offset: 0; border-color: #0C2619; }
.field[aria-invalid="true"] { border-color: #dc2626; }
</style>

<template>
  <section aria-labelledby="credit-form-title" class="mt-12 md:mt-16">
    <!-- Éxito: solo cuando el servidor confirma que el proveedor de correo aceptó el mensaje (no implica lectura ni entrega final). -->
    <div v-if="status === 'success'" role="status" data-testid="credit-study-success" class="bg-white border border-[#e5e2e1] shadow-sm p-8 md:p-12 text-center">
      <div class="w-14 h-14 mx-auto mb-5 rounded-full bg-[#0C2619] text-[#D3A76A] flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
      </div>
      <h2 class="font-serif text-2xl md:text-3xl font-medium text-[#0C2619] mb-3">Enviamos tu solicitud de estudio de crédito</h2>
      <p class="text-gray-600 leading-relaxed max-w-md mx-auto mb-6">Tu información y tus documentos fueron enviados a nuestro equipo. Revisaremos tu solicitud y nos pondremos en contacto contigo.</p>
      <button type="button" class="px-8 py-3 border border-[#0C2619] text-[#0C2619] text-xs font-bold tracking-widest uppercase hover:bg-[#0C2619]/5" @click="status = 'idle'">Enviar otra solicitud</button>
    </div>

    <div v-else class="bg-white border border-[#e5e2e1] shadow-sm">
      <h2 id="credit-form-title" class="font-serif text-2xl md:text-3xl font-medium text-[#0C2619] text-center py-6 md:py-8 px-4">Formulario de crédito paciente</h2>

      <!-- Indicador de paso (móvil) -->
      <p class="sm:hidden px-5 pb-3 text-center text-[11px] font-bold uppercase tracking-widest text-[#9a7a45]" aria-live="polite">Paso {{ current + 1 }} de {{ CREDIT_STEPS.length }}</p>

      <!-- Pasos -->
      <div role="tablist" aria-label="Pasos del formulario" class="flex overflow-x-auto bg-[#0C2619] text-white [scrollbar-width:thin]" @keydown="onTabKey">
        <button
          v-for="(s, i) in CREDIT_STEPS"
          :id="`credit-tab-${s.key}`"
          :key="s.key"
          ref="tabs"
          type="button"
          role="tab"
          :aria-selected="current === i ? 'true' : 'false'"
          :aria-controls="`credit-panel-${s.key}`"
          :tabindex="current === i ? 0 : -1"
          :data-has-error="stepHasError(s.key) ? 'true' : undefined"
          class="flex-1 min-w-[140px] px-3 py-3 text-[11px] font-bold tracking-[0.08em] uppercase text-center leading-tight transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#D3A76A]"
          :class="current === i ? 'bg-[#D3A76A] text-[#0C2619]' : 'text-white/80 hover:bg-white/10'"
          @click="go(i)"
        >{{ s.label }}<template v-if="stepHasError(s.key)"> <span aria-hidden="true" class="text-red-400">●</span><span class="sr-only"> (tiene campos por corregir)</span></template></button>
      </div>

      <form novalidate class="p-4 sm:p-6 lg:p-8" data-testid="credit-study-form" @submit.prevent="onSubmit">
        <!-- Aviso de error del envío: no se afirma que la solicitud fue recibida y los datos se conservan. -->
        <div v-if="status === 'error'" ref="errorBox" role="alert" tabindex="-1" data-testid="credit-study-error" class="mb-6 border border-red-300 border-l-4 border-l-red-600 bg-red-50 text-red-800 px-4 py-3 text-sm leading-relaxed">
          {{ errorMessage }}
        </div>

        <div
          v-for="(s, i) in CREDIT_STEPS"
          v-show="current === i"
          :id="`credit-panel-${s.key}`"
          :key="s.key"
          role="tabpanel"
          :aria-labelledby="`credit-tab-${s.key}`"
          tabindex="0"
          class="focus:outline-none"
        >
          <div :class="s.split ? 'grid gap-x-12 gap-y-10 lg:grid-cols-2' : 'space-y-10'">
            <div v-for="(b, bi) in s.blocks" :key="bi" :class="b.full ? 'lg:col-span-2' : ''">
              <h3 v-if="b.title" class="font-serif text-lg md:text-xl uppercase tracking-wide text-[#0C2619] mb-1">{{ b.title }}</h3>
              <p v-if="b.note" class="text-xs text-gray-500 mb-4">{{ b.note }}</p>
              <div v-else-if="b.title" class="mb-4"></div>

              <div :class="gridClass(b)">
                <template v-for="fd in b.fields" :key="fd.id">
                  <div v-if="visible(fd)" :class="[fieldClass(b, fd), fd.type === 'checkbox' ? 'self-end' : '']">
                    <!-- Casilla -->
                    <label v-if="fd.type === 'checkbox'" class="flex items-center gap-3 text-sm text-[#4c4546] cursor-pointer min-h-[2.75rem]">
                      <input v-model="values[fd.id]" type="checkbox" class="w-4 h-4 accent-[#0C2619]" />
                      <span>{{ fd.label }}</span>
                    </label>

                    <template v-else>
                      <label :for="`cf-${fd.id}`" class="block text-[11px] font-bold uppercase tracking-wider text-[#4c4546] mb-2 leading-snug">
                        {{ fd.label }}<span v-if="fd.hint" class="ml-1 normal-case font-normal tracking-normal text-gray-500">({{ fd.hint }})</span><span v-if="req(fd)" aria-hidden="true"> *</span><span v-if="req(fd)" class="sr-only"> (obligatorio)</span>
                      </label>

                      <select v-if="fd.type === 'select'" :id="`cf-${fd.id}`" v-model="values[fd.id]" class="field" :required="req(fd)" :disabled="disabled(fd)" :aria-invalid="!!errors[fd.id]">
                        <option value="">{{ disabled(fd) ? 'n/a' : 'Seleccione' }}</option>
                        <option v-for="o in fd.options" :key="o" :value="o">{{ o }}</option>
                      </select>
                      <template v-else-if="fd.type === 'file'">
                        <input :id="`cf-${fd.id}`" :name="fd.id" type="file" class="field file-field" :required="req(fd)" :accept="CREDIT_ACCEPT" :aria-invalid="!!errors[fd.id]" @change="onFile(fd.id, $event)" />
                        <p v-if="files[fd.id]" class="mt-1 text-xs text-gray-600 break-all" :data-testid="`credit-file-${fd.id}`">{{ files[fd.id]!.name }} ({{ sizeLabel(files[fd.id]!.size) }})</p>
                      </template>
                      <input v-else-if="fd.sum" :id="`cf-${fd.id}`" class="field bg-[#fcf9f8] font-semibold" type="text" readonly :value="total(fd.sum)" />
                      <input v-else :id="`cf-${fd.id}`" v-model="values[fd.id]" class="field" :type="fd.type ?? 'text'" :inputmode="fd.inputmode" :required="req(fd)" :disabled="disabled(fd)" :placeholder="disabled(fd) ? 'n/a' : undefined" :maxlength="fd.type === 'date' || fd.type === 'number' ? undefined : CREDIT_LIMITS.maxTextLength" :aria-invalid="!!errors[fd.id]" autocomplete="off" />
                      <p v-if="errors[fd.id]" class="mt-1 text-xs text-red-600" :data-testid="`credit-error-${fd.id}`">{{ errors[fd.id] }}</p>
                    </template>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <p v-if="s.key === 'conyuge'" class="mt-6 text-xs text-gray-500">Los datos del cónyuge se habilitan cuando el estado civil (paso 1) es casado(a) o unión libre. Regla provisional, por confirmar.</p>
          <p v-if="s.key === 'actividad'" class="mt-6 text-xs text-gray-500">Documentos: PDF, PNG o JPG; máximo {{ CREDIT_LIMITS.maxFileBytes / 1024 / 1024 }} MB cada uno y {{ CREDIT_LIMITS.maxTotalFileBytes / 1024 / 1024 }} MB en total. Se envían por correo a nuestro equipo.</p>
          <p v-if="errors.archivos && s.key === 'actividad'" class="mt-2 text-xs text-red-600" data-testid="credit-error-archivos">{{ errors.archivos }}</p>

          <div class="mt-8 flex items-center justify-between gap-3">
            <button type="button" class="px-6 py-3 border border-[#0C2619] text-[#0C2619] text-xs font-bold tracking-widest uppercase hover:bg-[#0C2619]/5 disabled:opacity-40" :disabled="i === 0 || status === 'submitting'" @click="go(i - 1)">Atrás</button>
            <button v-if="i < CREDIT_STEPS.length - 1" type="submit" class="px-8 py-3 bg-[#0C2619] text-white text-xs font-bold tracking-widest uppercase hover:bg-[#153a28]">Siguiente</button>
            <button v-else type="submit" :disabled="status === 'submitting'" data-testid="credit-study-submit" class="px-8 py-3 bg-[#0C2619] text-white text-xs font-bold tracking-widest uppercase hover:bg-[#153a28] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3">
              <span v-if="status === 'submitting'" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {{ status === 'submitting' ? 'Enviando...' : 'Enviar solicitud' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
// «Formulario de crédito paciente» (Estudio de créditos). Pasos, campos y reglas viven en #shared/utils/creditStudy (los usa también el servidor).
// Envía a POST /api/forms/credit-study (servidor → correo electrónico). Los datos y los documentos solo viven en memoria: no se guardan en el
// almacenamiento del navegador ni se registran. Las opciones de las listas son PROVISIONALES y deben confirmarse con la marca.
import { reactive, ref, nextTick } from 'vue'
import {
  CREDIT_ACCEPT, CREDIT_FIELDS, CREDIT_LIMITS, CREDIT_STEPS, isEnabled, isRequired, isVisible, normalizeCreditValues, sumFields, validateCreditStudy,
  type CreditBlock, type CreditField, type CreditValues
} from '#shared/utils/creditStudy'
import { creditStudyService, CreditStudyError } from '~/services/CreditStudyService'

const emptyValues = (): CreditValues => Object.fromEntries(CREDIT_FIELDS.filter(x => x.type !== 'file' && !x.sum).map(x => [x.id, x.type === 'checkbox' ? false : '']))

const values = reactive<CreditValues>(emptyValues())
const files = reactive<Record<string, File | null>>({})
const errors = reactive<Record<string, string>>({})

type Status = 'idle' | 'submitting' | 'success' | 'error'
const status = ref<Status>('idle')
const errorMessage = ref('')
const errorBox = ref<HTMLElement | null>(null)
const current = ref(0)
const tabs = ref<HTMLButtonElement[]>([])

// Clases estáticas (Tailwind no detecta nombres armados dinámicamente).
const LG: Record<number, string> = { 1: 'lg:col-span-1', 2: 'lg:col-span-2', 3: 'lg:col-span-3', 4: 'lg:col-span-4', 5: 'lg:col-span-5', 6: 'lg:col-span-6', 7: 'lg:col-span-7', 8: 'lg:col-span-8', 12: 'lg:col-span-12' }
const SM: Record<number, string> = { 1: 'sm:col-span-1', 2: 'sm:col-span-2', 3: 'sm:col-span-3', 4: 'sm:col-span-4', 5: 'sm:col-span-5', 6: 'sm:col-span-6', 7: 'sm:col-span-7', 8: 'sm:col-span-8', 12: 'sm:col-span-12' }

// 'lg': 1 columna en móvil, 2 en tablet y rejilla de 12 en escritorio (bloques de ancho completo).
// 'sm': 1 columna en móvil y rejilla de 12 desde tablet (bloques angostos, p. ej. mitad de la pantalla).
const gridClass = (b: CreditBlock) => (b.grid === 'lg'
  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-4 gap-y-5'
  : 'grid grid-cols-1 sm:grid-cols-12 gap-x-4 gap-y-5')

function fieldClass(b: CreditBlock, fd: CreditField) {
  const span = fd.span ?? 3
  if (b.grid === 'sm') return SM[span]
  return [span >= 6 ? 'sm:col-span-2' : '', LG[span], fd.start4 ? 'lg:col-start-10' : ''].join(' ')
}

const visible = (fd: CreditField) => isVisible(fd, values)
const disabled = (fd: CreditField) => !isEnabled(fd, values)
const req = (fd: CreditField) => isRequired(fd, values)
const total = (ids: string[]) => sumFields(values, ids).toLocaleString('es-CO')
const sizeLabel = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

const stepOfField = (id: string) => CREDIT_STEPS.findIndex(s => s.blocks.some(b => b.fields.some(x => x.id === id)))
const stepHasError = (key: string) => CREDIT_STEPS.find(s => s.key === key)!.blocks.some(b => b.fields.some(x => !!errors[x.id]))

function clearErrors() {
  for (const k of Object.keys(errors)) delete errors[k]
}

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg']
function onFile(id: string, e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  delete errors[id]
  if (!file) { files[id] = null; return }
  // Revisión rápida en el navegador; la autoridad es el servidor (que comprueba el tipo real del archivo).
  if (file.size === 0) errors[id] = 'El archivo está vacío.'
  else if (file.size > CREDIT_LIMITS.maxFileBytes) errors[id] = `El archivo supera ${CREDIT_LIMITS.maxFileBytes / 1024 / 1024} MB.`
  else if (file.type && !ALLOWED_TYPES.includes(file.type)) errors[id] = 'Formato no permitido. Usa PDF, PNG o JPG.'
  if (errors[id]) { files[id] = null; input.value = ''; return }
  files[id] = file
}

function go(i: number) {
  current.value = Math.min(Math.max(i, 0), CREDIT_STEPS.length - 1)
  tabs.value[current.value]?.scrollIntoView?.({ block: 'nearest', inline: 'center' })
}

async function showErrors(found: Record<string, string>, message: string) {
  Object.assign(errors, found)
  errorMessage.value = message
  status.value = 'error'
  const first = Object.keys(found).map(k => (k === 'archivos' ? stepOfField('archivo-extractos') : stepOfField(k))).filter(i => i >= 0).sort((a, b) => a - b)[0]
  if (first !== undefined) go(first)
  await nextTick()
  errorBox.value?.focus?.()
}

async function onSubmit() {
  // Anti doble envío: mientras se procesa, otra pulsación (o Enter) se ignora.
  if (status.value === 'submitting') return
  if (current.value < CREDIT_STEPS.length - 1) { go(current.value + 1); return }

  clearErrors()
  const payload = normalizeCreditValues({ ...values })
  const metas = Object.fromEntries(Object.entries(files).map(([id, f]) => [id, f ? { size: f.size } : null]))
  const found = validateCreditStudy(payload, metas)
  if (Object.keys(found).length) { await showErrors(found, 'Revisa los campos marcados en rojo antes de enviar.'); return }

  status.value = 'submitting'
  errorMessage.value = ''
  try {
    await creditStudyService.submit(payload, files)
    // Éxito confirmado por el servidor: recién ahora se descartan los datos y los documentos.
    Object.assign(values, emptyValues())
    for (const k of Object.keys(files)) delete files[k]
    current.value = 0
    status.value = 'success'
  } catch (e) {
    // Los datos y los documentos se conservan para corregir o reintentar.
    const err = e instanceof CreditStudyError ? e : null
    await showErrors(err?.kind === 'validation' ? err.fields : {}, err?.message ?? 'No pudimos enviar tu solicitud. Inténtalo de nuevo en unos minutos.')
  }
}

// Teclado del patrón WAI-ARIA tabs: flechas, Inicio y Fin.
function onTabKey(e: KeyboardEvent) {
  const last = CREDIT_STEPS.length - 1
  const target = ({ ArrowRight: Math.min(current.value + 1, last), ArrowLeft: Math.max(current.value - 1, 0), Home: 0, End: last } as Record<string, number>)[e.key]
  if (target === undefined) return
  e.preventDefault()
  go(target)
  tabs.value[target]?.focus()
}
</script>

<style scoped>
.field { width: 100%; min-height: 2.75rem; padding: 0 .75rem; background: #fff; border: 1px solid #cfc4c5; border-radius: 2px; font-size: .875rem; color: #1c1b1b; }
.field:focus { outline: 2px solid #0C2619; outline-offset: 0; border-color: #0C2619; }
.field:disabled { background: #f0eeed; color: #8a8284; cursor: not-allowed; }
.field[aria-invalid="true"] { border-color: #dc2626; }
.file-field { padding: .5rem .75rem; }
</style>

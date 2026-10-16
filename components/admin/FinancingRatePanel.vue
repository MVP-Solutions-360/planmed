<template>
  <section class="space-y-6" aria-labelledby="rate-title">
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-8">
      <div class="border-b border-gray-100 pb-4 mb-6">
        <h3 id="rate-title" class="text-xs font-bold tracking-widest text-[#0C2619] uppercase">Tasa de usura mensual</h3>
        <p class="text-sm text-gray-500 mt-1">Tasa de interés mensual que usa el simulador de financiación y el formulario de solicitud para calcular la cuota. Se aplica tal como la escribas, con hasta cuatro decimales.</p>
      </div>

      <div v-if="loadError" role="alert" class="rounded-lg border px-4 py-3 text-sm text-red-700 bg-red-50 border-red-200">
        <p class="font-semibold">No se pudo cargar la tasa</p>
        <p class="mt-1">{{ loadError }}</p>
        <button type="button" class="mt-2 underline" @click="load">Reintentar</button>
      </div>

      <p v-else-if="loading && !current" class="text-sm text-gray-500 py-6">Cargando la tasa vigente…</p>

      <template v-else-if="current">
        <div class="grid gap-6 md:grid-cols-2">
          <div data-testid="rate-current">
            <p class="text-[11px] font-bold uppercase tracking-wider text-gray-500">Tasa vigente</p>
            <p class="mt-1 text-4xl font-serif text-[#0C2619]">{{ current.rate }} <span class="text-base font-sans text-gray-500">% mensual</span></p>
            <p class="mt-2 text-xs text-gray-500">
              Última actualización: <strong class="text-gray-700">{{ formatDate(current.updatedAt) }}</strong>
              · <strong class="text-gray-700">{{ current.updatedBy.name }}</strong>
            </p>
          </div>

          <form novalidate class="space-y-3" @submit.prevent="requestSave">
            <label for="rate-input" class="block text-[11px] font-bold uppercase tracking-wider text-gray-600">Nueva tasa mensual (%)</label>
            <div class="flex gap-3">
              <input
                id="rate-input"
                v-model="draft"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                :placeholder="FINANCING_RATE_PLACEHOLDER"
                :aria-invalid="fieldError ? 'true' : 'false'"
                aria-describedby="rate-help rate-error"
                :disabled="saving"
                class="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#0C2619]"
                :class="fieldError ? 'border-red-400' : 'border-gray-200'"
                @input="fieldError = ''"
              />
              <button type="submit" :disabled="saving || !canSubmit" class="px-5 py-2 bg-[#0C2619] text-white text-xs font-bold tracking-widest uppercase rounded-md hover:bg-[#153a28] disabled:opacity-50 disabled:cursor-not-allowed">
                {{ saving ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
            <p id="rate-help" class="text-xs text-gray-500">Porcentaje mensual con punto decimal y hasta cuatro decimales (2, 2.12 o 2.0126). Debe ser mayor que 0 y no superar {{ FINANCING_RATE_MAX_PERCENT }} %.</p>
            <p id="rate-error" role="alert" class="text-xs text-red-600 min-h-[1rem]">{{ fieldError }}</p>
            <p v-if="status" role="status" class="text-sm font-semibold" :class="statusIsError ? 'text-red-700' : 'text-emerald-700'">{{ status }}</p>
          </form>
        </div>

        <div class="mt-8">
          <h4 class="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">Historial de cambios</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <caption class="sr-only">Historial de la tasa de usura mensual</caption>
              <thead>
                <tr class="text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <th scope="col" class="py-2 pr-4">Tasa (% mensual)</th>
                  <th scope="col" class="py-2 pr-4">Fecha</th>
                  <th scope="col" class="py-2">Responsable</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="h in current.history" :key="h.updatedAt" class="border-b border-gray-100">
                  <td class="py-2 pr-4 font-semibold text-gray-900">{{ h.rate }}</td>
                  <td class="py-2 pr-4 text-gray-600">{{ formatDate(h.updatedAt) }}</td>
                  <td class="py-2 text-gray-600">{{ h.updatedBy.name }}<span v-if="h.source === 'initial'" class="ml-2 text-[10px] font-bold uppercase tracking-wider text-amber-700">Arranque</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { createAdminFinancingRateService, type AdminFinancingRate } from '~/services/FinancingRateService'
import { FINANCING_RATE_MAX_PERCENT, FINANCING_RATE_PLACEHOLDER, parseFinancingRate } from '#shared/utils/financing'

// La validación de aquí solo evita viajes inútiles: el servidor valida de nuevo y es la autoridad.
const notify = useNotify()
// En el setup (contexto de Nuxt válido): la función de petición se resuelve aquí y se reutiliza en onMounted y en los eventos.
const rateService = createAdminFinancingRateService()
const current = ref<AdminFinancingRate | null>(null)
const loading = ref(false)
const loadError = ref('')
const draft = ref('')
const fieldError = ref('')
const saving = ref(false)
const status = ref('')
const statusIsError = ref(false)

const canSubmit = computed(() => draft.value.trim() !== '')

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }).format(new Date(iso))

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    current.value = await rateService.getAdminRate()
  } catch (e: any) {
    loadError.value = e?.message || 'Intenta nuevamente.'
  } finally {
    loading.value = false
  }
}

async function requestSave() {
  if (saving.value || !current.value) return
  status.value = ''
  const parsed = parseFinancingRate(draft.value)
  if (!parsed.ok) {
    fieldError.value = parsed.message
    return
  }
  if (parsed.text === current.value.rate) {
    fieldError.value = `La tasa vigente ya es ${current.value.rate} %.`
    return
  }
  const ok = await notify.confirm('¿Cambiar la tasa de usura mensual?', `El simulador pasará de ${current.value.rate} % a ${parsed.text} % mensual para las nuevas cotizaciones.`, 'Sí, guardar')
  if (!ok) return

  saving.value = true
  try {
    current.value = await rateService.saveRate(draft.value, current.value.updatedAt)
    draft.value = ''
    fieldError.value = ''
    status.value = `Tasa actualizada a ${current.value.rate} % mensual.`
    statusIsError.value = false
    void notify.success('Tasa actualizada')
  } catch (e: any) {
    statusIsError.value = true
    if (e?.field) fieldError.value = e.field
    status.value = e?.message || 'No fue posible guardar la tasa. Intenta nuevamente.'
    if (e?.statusCode === 409) await load()
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

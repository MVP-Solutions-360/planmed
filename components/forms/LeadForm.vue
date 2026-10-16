<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" @click.self="closeModal">
    <div class="bg-white text-black w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 relative">
      
      <!-- Botón de cerrar -->
      <button @click="closeModal" class="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
        ✕
      </button>

      <div v-if="!isSuccess" class="flex flex-col h-full overflow-hidden">
        <!-- Encabezado -->
        <div class="px-8 py-6 border-b border-gray-100 flex-shrink-0">
          <h2 class="text-2xl font-extrabold text-black">
            {{ 'Inicia tu proceso ahora' }}
          </h2>
          <p class="text-sm text-gray-600 mt-1">
            {{ 'Déjanos tus datos para enviarte los requisitos completos y conectarte con un asesor experto.' }}
          </p>
        </div>

        <!-- Formulario (Scroll Interno) -->
        <div class="p-4 md:p-8 overflow-y-auto space-y-5">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-1">{{ 'Nombre Completo *' }}</label>
            <input v-model="form.full_name" type="text" :class="['w-full p-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all', errors.full_name ? 'border-red-500' : 'border-gray-200']" />
            <p v-if="errors.full_name" class="text-red-500 text-xs mt-1">{{ errors.full_name }}</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">{{ 'Teléfono Celular *' }}</label>
              <input v-model="form.phone" type="tel" :class="['w-full p-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all', errors.phone ? 'border-red-500' : 'border-gray-200']" />
              <p v-if="errors.phone" class="text-red-500 text-xs mt-1">{{ errors.phone }}</p>
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">{{ 'Ciudad *' }}</label>
              <select v-model="form.city" :class="['w-full p-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all', errors.city ? 'border-red-500' : 'border-gray-200']">
                <option value="" disabled>{{ 'Selecciona tu ciudad' }}</option>
                <option :value="'Medellín'">{{ 'Medellín' }}</option>
                <option :value="'Cali'">{{ 'Cali' }}</option>
                <option :value="'Barranquilla'">{{ 'Barranquilla' }}</option>
                <option :value="'Por Definir'">{{ 'Por Definir' }}</option>
              </select>
              <p v-if="errors.city" class="text-red-500 text-xs mt-1">{{ errors.city }}</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-gray-700 mb-1">{{ 'Procedimiento de Interés *' }}</label>
            <input v-model="form.procedure" type="text" :class="['w-full p-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all', errors.procedure ? 'border-red-500' : 'border-gray-200']" />
            <p v-if="errors.procedure" class="text-red-500 text-xs mt-1">{{ errors.procedure }}</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">{{ 'Monto Solicitado (COP) *' }}</label>
              <input v-model.number="form.requested_amount" type="number" :class="['w-full p-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all', errors.requested_amount ? 'border-red-500' : 'border-gray-200']" />
              <p v-if="errors.requested_amount" class="text-red-500 text-xs mt-1">{{ errors.requested_amount }}</p>
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Plazo (Cuotas)</label>
              <select v-model.number="form.installments" :class="['w-full p-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all', errors.installments ? 'border-red-500' : 'border-gray-200']">
                <option :value="null" disabled>Selecciona el plazo</option>
                <option :value="12">12 Meses</option>
                <option :value="18">18 Meses</option>
                <option :value="24">24 Meses</option>
                <option :value="36">36 Meses</option>
                <option :value="48">48 Meses</option>
                <option :value="60">60 Meses</option>
                <option :value="72">72 Meses</option>
              </select>
              <p v-if="errors.installments" class="text-red-500 text-xs mt-1">{{ errors.installments }}</p>
            </div>
          </div>

          <div v-if="currentQuote" class="bg-gray-100 border border-gray-200 p-4 rounded-xl flex justify-between items-center">
            <span class="text-sm font-bold text-gray-900">Cuota Mensual Estimada:</span>
            <span class="text-xl font-extrabold text-black">
              {{ formatPesos(currentQuote.monthlyPayment) }}*
            </span>
          </div>
          <p v-else-if="quoteError" role="alert" data-testid="leadform-quote-unavailable" class="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 rounded-xl">
            {{ quoteError }} Puedes enviar tu solicitud igualmente; un asesor te compartirá la cuota.
          </p>

          <div>
            <label class="block text-sm font-bold text-gray-700 mb-1" v-html="'Correo Electrónico (Opcional)'"></label>
            <input v-model="form.email" type="email" class="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>

          <!-- Preaprobado: información del tomador del crédito (desplegable) -->
          <section class="border-t border-gray-100 pt-5">
            <button type="button" class="w-full flex items-center justify-between text-left" :aria-expanded="open.tomador" aria-controls="lead-tomador" @click="open.tomador = !open.tomador">
              <h3 class="text-base font-extrabold text-black">Información del tomador del crédito</h3>
              <span class="text-xs text-gray-500 transition-transform" :class="open.tomador ? 'rotate-180' : ''" aria-hidden="true">▼</span>
            </button>
            <div v-show="open.tomador" id="lead-tomador" class="grid grid-cols-1 md:grid-cols-6 gap-x-4 gap-y-4 mt-4">
              <div class="md:col-span-3">
                <label class="block text-sm font-bold text-gray-700 mb-1" for="lf-tipodoc">Tipo documento</label>
                <select id="lf-tipodoc" v-model="form.doc_type" :class="inputCls()"><option v-for="o in TIPOS_DOC" :key="o" :value="o">{{ o }}</option></select>
              </div>
              <div class="md:col-span-3">
                <label class="block text-sm font-bold text-gray-700 mb-1" for="lf-numdoc">Número documento</label>
                <input id="lf-numdoc" v-model="form.doc_number" type="text" inputmode="numeric" placeholder="Ingresa número de documento" :class="inputCls()" />
              </div>
              <div class="md:col-span-4">
                <label class="block text-sm font-bold text-gray-700 mb-1" for="lf-lugarexp">Lugar expedición documento</label>
                <input id="lf-lugarexp" v-model="form.doc_issue_place" type="text" placeholder="Ingresa la ciudad" :class="inputCls()" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-bold text-gray-700 mb-1" for="lf-fechaexp">Fecha expedición</label>
                <input id="lf-fechaexp" v-model="form.doc_issue_date" type="date" :class="inputCls()" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-bold text-gray-700 mb-1" for="lf-fechanac">Fecha nacimiento</label>
                <input id="lf-fechanac" v-model="form.birth_date" type="date" :class="inputCls()" />
              </div>
              <div class="md:col-span-4">
                <label class="block text-sm font-bold text-gray-700 mb-1" for="lf-lugarnac">Lugar nacimiento</label>
                <input id="lf-lugarnac" v-model="form.birth_place" type="text" placeholder="Ingresa tu ciudad" :class="inputCls()" />
              </div>
              <div class="md:col-span-3">
                <label class="block text-sm font-bold text-gray-700 mb-1" for="lf-profesion">Profesión / Ocupación</label>
                <input id="lf-profesion" v-model="form.occupation" type="text" placeholder="Ingresa tu ocupación" :class="inputCls()" />
              </div>
              <div class="md:col-span-1">
                <label class="block text-sm font-bold text-gray-700 mb-1" for="lf-cargo">Personas a cargo</label>
                <input id="lf-cargo" v-model.number="form.dependents" type="number" min="0" inputmode="numeric" placeholder="0" :class="inputCls()" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-bold text-gray-700 mb-1" for="lf-vivienda">Tipo vivienda</label>
                <select id="lf-vivienda" v-model="form.housing_type" :class="inputCls()"><option v-for="o in TIPOS_VIVIENDA" :key="o" :value="o">{{ o }}</option></select>
              </div>
              <div class="md:col-span-3">
                <label class="block text-sm font-bold text-gray-700 mb-1" for="lf-ciudadres">Ciudad residencia</label>
                <input id="lf-ciudadres" v-model="form.residence_city" type="text" placeholder="Ingresa tu ciudad" :class="inputCls()" />
              </div>
              <div class="md:col-span-3">
                <label class="block text-sm font-bold text-gray-700 mb-1" for="lf-ciudadcir">Ciudad cirugía</label>
                <input id="lf-ciudadcir" v-model="form.surgery_city" type="text" placeholder="Ingresa la ciudad" :class="inputCls()" />
              </div>
            </div>
          </section>

          <!-- Preaprobado: actividad económica (desplegable) -->
          <section class="border-t border-gray-100 pt-5">
            <button type="button" class="w-full flex items-center justify-between text-left" :aria-expanded="open.actividad" aria-controls="lead-actividad" @click="open.actividad = !open.actividad">
              <h3 class="text-base font-extrabold text-black">Actividad económica</h3>
              <span class="text-xs text-gray-500 transition-transform" :class="open.actividad ? 'rotate-180' : ''" aria-hidden="true">▼</span>
            </button>
            <div v-show="open.actividad" id="lead-actividad" class="grid grid-cols-1 md:grid-cols-6 gap-x-4 gap-y-4 mt-4">
              <div class="md:col-span-3">
                <label class="block text-sm font-bold text-gray-700 mb-1" for="lf-tipoact">Tipo actividad</label>
                <select id="lf-tipoact" v-model="form.activity_type" :class="inputCls()"><option v-for="o in TIPOS_ACTIVIDAD" :key="o" :value="o">{{ o }}</option></select>
              </div>
              <div class="md:col-span-3">
                <label class="block text-sm font-bold text-gray-700 mb-1" for="lf-ss">¿Aporta seguridad social?</label>
                <select id="lf-ss" v-model="form.social_security" :disabled="isEmployee" :class="[inputCls(), isEmployee ? 'opacity-50 cursor-not-allowed' : '']"><option>Si</option><option>No</option></select>
              </div>
              <div class="md:col-span-3">
                <label class="block text-sm font-bold text-gray-700 mb-1" for="lf-ing">Ingresos mensuales</label>
                <input id="lf-ing" v-model.number="form.monthly_income" type="number" min="0" inputmode="numeric" placeholder="Ingresa tus ingresos" :class="inputCls()" />
              </div>
              <div class="md:col-span-3">
                <label class="block text-sm font-bold text-gray-700 mb-1" for="lf-egr">Egresos mensuales</label>
                <input id="lf-egr" v-model.number="form.monthly_expenses" type="number" min="0" inputmode="numeric" placeholder="Ingresa tus egresos" :class="inputCls()" />
              </div>
              <template v-if="isEmployee">
                <div class="md:col-span-3">
                  <label class="block text-sm font-bold text-gray-700 mb-1" for="lf-contrato">Tipo de contrato</label>
                  <select id="lf-contrato" v-model="form.contract_type" :class="inputCls()"><option v-for="o in TIPOS_CONTRATO" :key="o" :value="o">{{ o }}</option></select>
                </div>
                <div class="md:col-span-3">
                  <label class="block text-sm font-bold text-gray-700 mb-1" for="lf-duracion">Duración del contrato</label>
                  <select id="lf-duracion" v-model="form.contract_duration" :class="inputCls()"><option v-for="o in DURACIONES_CONTRATO" :key="o" :value="o">{{ o }}</option></select>
                </div>
              </template>
              <div class="md:col-span-2">
                <label class="block text-sm font-bold text-gray-700 mb-1" for="lf-prop">¿Tienes propiedad?</label>
                <select id="lf-prop" v-model="form.has_property" :class="inputCls()"><option>No</option><option>Si</option></select>
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-bold text-gray-700 mb-1" for="lf-veh">¿Tiene vehículo?</label>
                <select id="lf-veh" v-model="form.has_vehicle" :class="inputCls()"><option>No</option><option>Si</option></select>
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-bold text-gray-700 mb-1" for="lf-rep">¿Estás reportado?</label>
                <select id="lf-rep" v-model="form.is_reported" :class="inputCls()"><option>No</option><option>Si</option></select>
              </div>
            </div>
          </section>

          <div>
            <label class="block text-sm font-bold text-gray-700 mb-1" v-html="'Comentarios (Opcional)'"></label>
            <textarea v-model="form.comments" rows="2" class="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"></textarea>
          </div>

          <div class="flex items-start gap-3 mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div class="pt-0.5">
              <input v-model="form.accepted_habeas_data" type="checkbox" id="habeas" class="w-5 h-5 accent-primary border-gray-300 rounded cursor-pointer" />
            </div>
            <div class="flex-1">
              <label for="habeas" class="text-xs text-gray-600 cursor-pointer select-none" v-html="'Acepto la <a href=&quot;/recursos&quot; target=&quot;_blank&quot; class=&quot;text-primary font-bold hover:underline&quot;>política de tratamiento de datos personales</a> y autorizo ser contactado para recibir información sobre opciones de financiación. *'" @click="handleHabeasClick"></label>
              <p v-if="errors.accepted_habeas_data" class="text-red-500 text-xs mt-1 font-bold">{{ errors.accepted_habeas_data }}</p>
            </div>
          </div>
        </div>

        <!-- Pie / CTA -->
        <div class="px-4 md:px-8 py-6 bg-gray-50 border-t border-gray-100 flex-shrink-0">
          <div v-if="errors.api" class="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-200 flex items-center gap-2">
            <span>⚠</span> {{ errors.api }}
          </div>
          <button 
            @click="submitLead" 
            :disabled="isSubmitting"
            class="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            <span v-if="isSubmitting" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ isSubmitting ? 'Enviando...' : 'Solicitar Financiación' }}
          </button>
        </div>
      </div>

      <!-- Estado de Éxito -->
      <div v-else class="flex flex-col items-center justify-center p-12 text-center h-[500px]">
        <div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm border border-green-200">
          ✓
        </div>
        <h2 class="text-2xl font-bold text-black mb-2">{{ '¡Solicitud recibida!' }}</h2>
        <p class="text-gray-600 mb-8 max-w-sm">
          {{ 'Hemos procesado tu información. Para darte una respuesta prioritaria, continúa tu proceso directamente en WhatsApp con un asesor experto.' }}
        </p>
        <button 
          @click="openWhatsApp" 
          class="w-full py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#128C7E] transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-3"
        >
          <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          {{ 'Continuar en WhatsApp' }}
        </button>
        <button @click="closeModal" class="mt-4 text-sm font-bold text-gray-500 hover:text-black transition-colors">
          {{ 'Cerrar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTracking } from '~/composables/useTracking'
import { leadService } from '~/services/LeadService'
import { quotationService } from '~/services/QuotationService'
import { FinancingRateUnavailableError } from '~/services/FinancingRateService'
import { formatPesos } from '#shared/utils/financing'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  procedure: { type: String, default: '' },
  amount: { type: Number, default: null },
  installments: { type: Number, default: null },
  city: { type: String, default: '' }
})

const emit = defineEmits(['update:isOpen'])
const route = useRoute()

// Configuración Constants
// (En producción estos datos deberían venir del entorno o tenant base)
const WHATSAPP_NUMBER = 'TBD_WHATSAPP_NUMBER' 

const { getVisitorUuid, trackFormStart, trackFormSubmit, trackWhatsAppClick, trackPolicyView } = useTracking()

// Estado del Formulario
const isSubmitting = ref(false)
const isSuccess = ref(false)
const currentQuote = ref(null)
// Si no hay tasa vigente no se muestra ninguna cuota (ni una anterior): solo este aviso.
const quoteError = ref(null)

async function refreshQuote() {
  if (!(form.requested_amount && form.installments)) return
  try {
    currentQuote.value = await quotationService.calculateQuotation(form.requested_amount, form.installments, form.procedure)
    quoteError.value = null
  } catch (e) {
    currentQuote.value = null
    quoteError.value = e instanceof FinancingRateUnavailableError ? e.message : 'No fue posible calcular la cuota estimada en este momento.'
  }
}

// Opciones PROVISIONALES de las listas del preaprobado (por confirmar con Planmed).
const TIPOS_DOC = ['Cedula ciudadania', 'Tarjeta identidad', 'Numero identificacion personal', 'Pasaporte', 'Permiso permanencia temporal', 'Cedula extranjeria']
const TIPOS_VIVIENDA = ['Propia', 'Arrendada', 'Familiar']
const TIPOS_ACTIVIDAD = ['Empleado', 'Independiente']
const TIPOS_CONTRATO = ['Fijo', 'Indefinido', 'Prestacion de servicio']
const DURACIONES_CONTRATO = ['2 años o mas', 'Menos de 1 año', '1 año o mas']

const form = reactive({
  full_name: '',
  phone: '',
  city: '',
  procedure: '',
  requested_amount: null,
  installments: null,
  email: '',
  comments: '',
  accepted_habeas_data: false,
  // Preaprobado: tomador del crédito
  doc_type: TIPOS_DOC[0],
  doc_number: '',
  doc_issue_place: '',
  doc_issue_date: '',
  birth_date: '',
  birth_place: '',
  occupation: '',
  dependents: null,
  housing_type: TIPOS_VIVIENDA[0],
  residence_city: '',
  surgery_city: '',
  // Preaprobado: actividad económica
  activity_type: TIPOS_ACTIVIDAD[0],
  social_security: 'Si',
  monthly_income: null,
  monthly_expenses: null,
  contract_type: TIPOS_CONTRATO[0],
  contract_duration: DURACIONES_CONTRATO[0],
  has_property: 'No',
  has_vehicle: 'No',
  is_reported: 'No'
})

const open = reactive({ tomador: false, actividad: false })
const isEmployee = computed(() => form.activity_type === 'Empleado')
// Empleado: la seguridad social queda fija en «Si» (campo deshabilitado) y aparecen tipo y duración del contrato.
watch(isEmployee, (v) => { if (v) form.social_security = 'Si' }, { immediate: true })
const inputCls = () => 'w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all'

const errors = reactive({})

// Inicializar form cuando se abre el modal
watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
    // Pre-llenar campos
    form.procedure = props.procedure || ''
    form.requested_amount = props.amount || null
    form.installments = props.installments || null
    form.city = props.city || ''
    if (!form.residence_city) form.residence_city = props.city || ''

    // Cotización con la tasa mensual configurada en el panel (QuotationService), sin conocer la fórmula en la UI
    await refreshQuote()
      
    trackFormStart(route.fullPath, form.procedure, form.requested_amount, form.installments, currentQuote.value?.monthlyPayment || null)
  } else {
    document.body.style.overflow = ''
    isSuccess.value = false
  }
})

// Actualizar cotización si cambia monto o cuotas dentro del modal
watch([() => form.requested_amount, () => form.installments], () => refreshQuote())

onUnmounted(() => {
  document.body.style.overflow = ''
})

const closeModal = () => {
  emit('update:isOpen', false)
}

const handleHabeasClick = (e) => {
  if (e.target && e.target.tagName === 'A') {
    trackPolicyView(route.fullPath, 'habeas_data', 'v1.0')
  }
}

const validateForm = () => {
  let isValid = true
  Object.keys(errors).forEach(key => errors[key] = null)

  if (!form.full_name.trim()) {
    errors.full_name = 'El nombre es obligatorio.'
    isValid = false
  }
  if (!form.phone.trim()) {
    errors.phone = 'El teléfono es obligatorio.'
    isValid = false
  }
  if (!form.city) {
    errors.city = 'La ciudad es obligatoria.'
    isValid = false
  }
  if (!form.procedure.trim()) {
    errors.procedure = 'El procedimiento es obligatorio.'
    isValid = false
  }
  if (!form.requested_amount || form.requested_amount <= 0) {
    errors.requested_amount = 'Ingresa un monto válido.'
    isValid = false
  }
  if (!form.installments) {
    errors.installments = 'Por favor selecciona el plazo en cuotas'
    isValid = false
  }
  if (!form.accepted_habeas_data) {
    errors.accepted_habeas_data = 'Debes aceptar los términos y condiciones.'
    isValid = false
  }

  return isValid
}

const submitLead = async () => {
  if (!validateForm()) return

  isSubmitting.value = true

  const payload = {
    first_name: form.full_name,
    phone: form.phone,
    email: form.email,
    city: form.city,
    procedure_name: form.procedure,
    requested_amount: form.requested_amount,
    installments: form.installments,
    comments: form.comments,
    metadata: {
      // Condiciones con las que se cotizó: una solicitud conserva su tasa aunque la tasa vigente cambie después.
      quote_rate_percent: currentQuote.value?.ratePercent ?? null,
      quote_rate_version: currentQuote.value?.rateUpdatedAt ?? null,
      quote_monthly_payment: currentQuote.value ? Math.round(currentQuote.value.monthlyPayment) : null,
      doc_type: form.doc_type,
      doc_number: form.doc_number,
      doc_issue_place: form.doc_issue_place,
      doc_issue_date: form.doc_issue_date,
      birth_date: form.birth_date,
      birth_place: form.birth_place,
      occupation: form.occupation,
      dependents: form.dependents,
      housing_type: form.housing_type,
      residence_city: form.residence_city,
      surgery_city: form.surgery_city,
      activity_type: form.activity_type,
      social_security: form.social_security,
      monthly_income: form.monthly_income,
      monthly_expenses: form.monthly_expenses,
      contract_type: isEmployee.value ? form.contract_type : null,
      contract_duration: isEmployee.value ? form.contract_duration : null,
      has_property: form.has_property,
      has_vehicle: form.has_vehicle,
      is_reported: form.is_reported
    }
  }

  try {
    // Usamos la capa de servicio (desacoplada de Wellezy Hub y UI)
    await leadService.submitLead(payload)
    
    trackFormSubmit(route.fullPath, form.procedure, form.requested_amount, form.installments, currentQuote.value?.monthlyPayment || null)
    isSuccess.value = true
  } catch (error) {
    console.error('Error al enviar el lead', error)
    errors.api = 'Ocurrió un error al procesar tu solicitud. Por favor intenta nuevamente.'
  } finally {
    isSubmitting.value = false
  }
}

const openWhatsApp = () => {
  trackWhatsAppClick(route.fullPath)
  const text = `Nuevo lead generado desde Planmed\n\nNombre:\n${form.full_name}\n\nTeléfono:\n${form.phone}\n\nProcedimiento:\n${form.procedure}\n\nMonto:\n$${form.requested_amount.toLocaleString('es-CO')}`
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
  window.open(url, '_blank')
  closeModal()
}
</script>

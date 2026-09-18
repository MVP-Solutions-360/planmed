<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" @click.self="closeModal">
    <div class="bg-white text-black w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 relative">
      
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
              ${{ currentQuote.monthlyPayment?.toLocaleString('es-CO') || 0 }}*
            </span>
          </div>

          <div>
            <label class="block text-sm font-bold text-gray-700 mb-1" v-html="'Correo Electrónico (Opcional)'"></label>
            <input v-model="form.email" type="email" class="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>

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
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTracking } from '~/composables/useTracking'
import { leadService } from '~/services/LeadService'
import { quotationService } from '~/services/QuotationService'

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

const form = reactive({
  full_name: '',
  phone: '',
  city: '',
  procedure: '',
  requested_amount: null,
  installments: null,
  email: '',
  comments: '',
  accepted_habeas_data: false
})

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
    
    // Obtener cotización real (mock) desde el QuotationService sin conocer la fórmula en UI
    if (form.requested_amount && form.installments) {
      currentQuote.value = await quotationService.calculateQuotation(form.requested_amount, form.installments, form.procedure);
    }
      
    trackFormStart(route.fullPath, form.procedure, form.requested_amount, form.installments, currentQuote.value?.monthlyPayment || null)
  } else {
    document.body.style.overflow = ''
    isSuccess.value = false
  }
})

// Actualizar cotización si cambia monto o cuotas dentro del modal
watch([() => form.requested_amount, () => form.installments], async () => {
  if (form.requested_amount && form.installments) {
    currentQuote.value = await quotationService.calculateQuotation(form.requested_amount, form.installments, form.procedure);
  }
})

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
    comments: form.comments
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

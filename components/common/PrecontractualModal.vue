<!-- components/common/PrecontractualModal.vue -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const STORAGE_KEY = 'planmed_precontractual_v1'
const isOpen = ref(false)

onMounted(() => {
  const status = localStorage.getItem(STORAGE_KEY)
  if (status !== 'accepted') {
    isOpen.value = true
    // Bloquear el scroll de la página de fondo
    document.body.style.overflow = 'hidden'
  }
})

onUnmounted(() => {
  document.body.style.overflow = ''
})

const handleAccept = () => {
  localStorage.setItem(STORAGE_KEY, 'accepted')
  isOpen.value = false
  // Restaurar el scroll de la página
  document.body.style.overflow = ''

  // FUTURO:
  // registrar aceptación en CRM
  // guardar timestamp
  // guardar versión del documento
  // guardar evidencia de aceptación
}

const handleReject = () => {
  window.location.href = 'https://google.com'
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div class="bg-white text-black w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
      
      <!-- Encabezado del Modal -->
      <div class="px-8 py-6 border-b border-gray-100 flex-shrink-0">
        <h2 class="text-xl font-extrabold text-black uppercase tracking-wide">
          {{ 'Información Precontractual' }}
        </h2>
      </div>

      <!-- Cuerpo del Modal (Scroll Interno) -->
      <div class="p-4 md:p-8 overflow-y-auto space-y-6 text-gray-700 leading-relaxed text-sm">


        <p v-html="'El presente documento es suministrado por <strong>PLANMED S.A.S.</strong>, sociedad identificada con <strong>NIT. 901532790</strong>, con domicilio principal en la ciudad de Medellín y cuyos canales oficiales para la atención de Peticiones, Quejas y Reclamos se encuentran disponibles en el correo electrónico institucional: <a href=&quot;mailto:pqrs.institucional{\'@\'}gmail.com&quot; class=&quot;text-primary hover:underline font-semibold&quot;>pqrs.institucional{\'@\'}gmail.com</a>.'"></p>

        <p v-html="'Al continuar con este proceso, usted reconoce y acepta que <strong>PLANMED S.A.S.</strong> es una sociedad comercial que otorga créditos exclusivamente con recursos propios y que su actividad no es la de una entidad financiera regulada, ni la de una Institución Prestadora de Servicios de Salud (IPS) o clínica.'"></p>

        <p v-html="'En consecuencia, la labor de la compañía se limita al financiamiento y no garantiza resultados médicos o quirúrgicos, los cuales son responsabilidad exclusiva del profesional que usted elija.'"></p>

        <p v-html="'Asimismo, comprende que el envío de su solicitud no implica una aprobación automática, pues el otorgamiento del crédito está sujeto a un riguroso análisis de riesgo por parte de nuestro departamento de cartera, el cual se reserva el derecho de negar la financiación según sus políticas internas.'"></p>

        <p v-html="'El consumidor tiene el derecho de realizar el pago total o parcial de su deuda en cualquier momento, abonando únicamente los intereses corrientes o de mora que se hayan causado efectivamente hasta la fecha en que se realice el abono. En ningún caso se impondrán penalidades, multas ni sanciones por concepto de pagos anticipados.'"></p>

        <p v-html="'Asimismo, mediante la aceptación de estas condiciones, usted declara entender que esta operación de crédito genera obligaciones civiles de pago y la causación de intereses corrientes y de mora a la tasa máxima legal establecida por la Superintendencia Financiera de Colombia, lo que implica que el incumplimiento en el pago de las cuotas podrá derivar en reportes negativos ante centrales de riesgo como Datacrédito o CIFIN, así como en el inicio de gestiones de cobro administrativo o judicial para la recuperación de la obligación.'"></p>

        <p v-html="'De igual forma, acepta que toda la publicidad visualizada en redes sociales o canales de mensería tiene un carácter meramente informativo y comercial, por lo que no constituye una promesa de aprobación ni una garantía sobre los resultados del procedimiento a financiar.'"></p>

        <p v-html="'Al hacer clic en el botón de aceptación o continuar con el formulario, usted confirma que ha recibido información suficiente, veraz y oportuna, y que acepta estas condiciones de manera voluntaria antes de cualquier desembolso, entendiendo que para la formalización final se requerirá su firma física o digital certificada en el documento oficial de advertencias.'"></p>

        <p class="font-semibold text-black">
          {{ 'Si acepta continuar, manifiesta que conoce y acepta los términos, condiciones y advertencias aquí descritas.' }}
        </p>
      </div>

      <!-- Pie del Modal (Botones de Acción) -->
      <div class="px-4 md:px-8 py-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-4 flex-shrink-0">
        <button 
          @click="handleReject" 
          class="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-bold hover:bg-gray-100 transition-colors text-center text-sm active:scale-95"
        >
          <span class="font-bold">{{ 'No acepto' }}</span>
        </button>
        <button 
          @click="handleAccept" 
          class="w-full sm:w-auto px-8 py-3 bg-black text-white rounded-full font-bold hover:bg-primary hover:text-black transition-all text-center text-sm active:scale-95 shadow-md flex items-center justify-center"
        >
          {{ 'Acepto y continuar' }}
          <span class="ml-2">➔</span>
        </button>
      </div>
      
    </div>
  </div>
</template>

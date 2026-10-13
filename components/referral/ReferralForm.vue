<template>
  <section aria-labelledby="ref-form-title" class="mt-14">
    <!-- AVISO TEMPORAL: retirar cuando el formulario sea funcional. Esta información debe ir al CRM MÉDICO (no a Wellezy Hub, que es el CRM administrativo). -->
    <div role="alert" data-testid="referral-form-not-functional" class="mb-6 border border-amber-300 border-l-4 border-l-amber-500 bg-amber-50 text-amber-900 px-5 py-4 text-sm leading-relaxed">
      <p class="font-bold uppercase tracking-wider text-xs">Formulario en maquetación — aún no es funcional</p>
      <p class="mt-1">Este formulario es solo el diseño: no valida, no guarda ni envía información, y lo que escribas no se registra en ninguna parte. Pendiente: definir la conexión con el CRM médico (la información no va a Wellezy Hub), las validaciones y cómo proteger los datos bancarios.</p>
    </div>

    <form novalidate class="bg-white border border-[#e5e2e1] p-5 sm:p-8 md:p-10 space-y-6" @submit.prevent="sent = true">
      <h2 id="ref-form-title" class="font-serif text-2xl md:text-3xl font-medium text-[#0C2619]">Regístrate en el programa</h2>

      <div v-for="f in fields" :key="f.id">
        <label :for="`rf-${f.id}`" class="lbl">{{ f.label }}</label>
        <input :id="`rf-${f.id}`" class="field" :type="f.type ?? 'text'" :inputmode="f.inputmode" :autocomplete="f.autocomplete" />
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
          <label v-for="o in ['Efectivo', 'Transferencia Bancaria (Bancolombia)']" :key="o" class="radio"><input v-model="pago" type="radio" name="rf-pago" :value="o" /> {{ o }}</label>
        </div>
      </fieldset>

      <fieldset v-if="pago.startsWith('Transferencia')" class="space-y-4 border border-[#e5e2e1] bg-[#fcf9f8] p-5">
        <legend class="lbl px-2">Si elegiste pago por transferencia ingresa</legend>
        <div v-for="f in bankFields" :key="f.id">
          <label :for="`rf-${f.id}`" class="block text-sm text-[#4c4546] mb-1.5">{{ f.label }}</label>
          <input :id="`rf-${f.id}`" class="field" :inputmode="f.inputmode" autocomplete="off" />
        </div>
      </fieldset>

      <div>
        <label for="rf-sugerencia" class="lbl">¿Tienes alguna sugerencia para nuestro grupo?</label>
        <textarea id="rf-sugerencia" rows="5" class="field !h-auto py-3"></textarea>
      </div>

      <div class="flex items-start gap-3">
        <input id="rf-acepto" type="checkbox" class="mt-1 w-4 h-4 accent-[#0C2619]" />
        <label for="rf-acepto" class="text-sm text-[#4c4546] uppercase leading-snug">Entiendo y acepto las condiciones del contrato de remisión de pacientes</label>
      </div>

      <div>
        <button type="submit" class="w-full bg-[#0C2619] hover:bg-[#153a28] text-white py-4 text-xs font-bold tracking-widest uppercase transition-colors">Enviar</button>
        <p v-if="sent" role="status" class="mt-3 text-sm font-semibold text-amber-800">Aún no es funcional: no se envió nada.</p>
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
// Maquetación del formulario del Programa de referidos. SIN funcionalidad: el estado local solo muestra/oculta los datos de transferencia.
// Destino futuro: CRM médico (no Wellezy Hub). Los datos bancarios deberán tratarse con cuidado cuando se conecte.
import { ref } from 'vue'

interface F { id: string, label: string, type?: string, inputmode?: 'text' | 'numeric' | 'tel' | 'email', autocomplete?: string }
const fields: F[] = [
  { id: 'nombre', label: 'Ingresa tu nombre completo', autocomplete: 'name' },
  { id: 'celular', label: 'Actualiza tu número de WhatsApp o celular', type: 'tel', inputmode: 'tel', autocomplete: 'tel' },
  { id: 'correo', label: 'Actualiza tu correo electrónico', type: 'email', inputmode: 'email', autocomplete: 'email' },
  { id: 'fecha-cirugia', label: 'Ingresa la fecha en la que te operaste con nosotros', type: 'date' },
  { id: 'cirugia', label: '¿Qué cirugía te practicaste?' }
]
const bankFields: F[] = [
  { id: 'titular', label: 'Nombre del titular' },
  { id: 'cedula', label: 'Número de cédula', inputmode: 'numeric' },
  { id: 'cuenta', label: 'Número de cuenta', inputmode: 'numeric' }
]

const control = ref('Sí')
const pago = ref('Efectivo')
const sent = ref(false)
</script>

<style scoped>
.lbl { display: block; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #9a7a45; margin-bottom: .5rem; }
.field { width: 100%; height: 2.75rem; padding: 0 .75rem; background: #fff; border: 1px solid #cfc4c5; border-radius: 2px; font-size: .9375rem; color: #1c1b1b; }
.field:focus { outline: 2px solid #0C2619; outline-offset: 0; border-color: #0C2619; }
.radio { display: inline-flex; align-items: center; gap: .5rem; font-size: .9375rem; color: #4c4546; cursor: pointer; }
.radio input { accent-color: #0C2619; width: 1rem; height: 1rem; }
</style>

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

        <form novalidate class="flex flex-col min-h-0" @submit.prevent="sent = true">
          <div class="overflow-y-auto overscroll-contain px-6 py-5 space-y-4">
            <!-- AVISO TEMPORAL: retirar cuando se defina a dónde va esta información y el formulario sea funcional. -->
            <div role="alert" data-testid="valuation-not-functional" class="border border-amber-300 border-l-4 border-l-amber-500 bg-amber-50 text-amber-900 px-4 py-3 text-xs leading-relaxed">
              <p class="font-bold uppercase tracking-wider">Solo informativo — aún no es funcional</p>
              <p class="mt-1">Este formulario no envía ni guarda datos. Pendiente definir a dónde va la información para conectarlo.</p>
            </div>

            <div v-for="fd in fields" :key="fd.id">
              <label :for="`vr-${fd.id}`" class="block text-sm font-semibold text-[#4c4546] mb-1.5">{{ fd.label }}<span aria-hidden="true"> *</span><span class="sr-only"> (obligatorio)</span></label>
              <select v-if="fd.options" :id="`vr-${fd.id}`" class="field" required>
                <option value="">Seleccione</option>
                <option v-for="o in fd.options" :key="o" :value="o">{{ o }}</option>
              </select>
              <input v-else :id="`vr-${fd.id}`" class="field" :type="fd.type ?? 'text'" :inputmode="fd.inputmode" :autocomplete="fd.autocomplete" required />
            </div>

            <div class="flex items-start gap-3 pt-1">
              <input id="vr-habeas" type="checkbox" class="mt-1 w-4 h-4 accent-[#0C2619]" />
              <label for="vr-habeas" class="text-sm text-gray-600 leading-relaxed">He leído y acepto <NuxtLink to="/politica-datos-personales" target="_blank" class="text-[#0C2619] font-semibold underline underline-offset-2">las Políticas de Tratamiento de Datos Personales</NuxtLink></label>
            </div>

            <p v-if="sent" role="status" class="text-sm font-semibold text-amber-800">Aún no es funcional: no se envió nada.</p>
          </div>

          <div class="px-6 py-4 border-t border-[#e5e2e1] bg-[#fcf9f8] shrink-0 flex justify-center">
            <button type="submit" class="bg-[#0C2619] hover:bg-[#153a28] text-white px-10 py-3 text-xs font-bold tracking-widest uppercase transition-colors">Enviar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// «Pide tu cita de valoración»: botón flotante + ventana emergente. SOLO MAQUETA: no valida ni envía (ver aviso dentro del formulario).
import { ref, nextTick, watch, onBeforeUnmount } from 'vue'

interface F { id: string, label: string, type?: string, inputmode?: 'text' | 'numeric' | 'tel' | 'email', autocomplete?: string, options?: string[] }
const fields: F[] = [
  { id: 'nombres', label: 'Nombres', autocomplete: 'given-name' },
  { id: 'apellidos', label: 'Apellidos', autocomplete: 'family-name' },
  { id: 'cedula', label: 'Número de cédula', inputmode: 'numeric' },
  { id: 'nacimiento', label: 'Fecha de nacimiento', type: 'date', autocomplete: 'bday' },
  { id: 'ciudad', label: 'Ciudad', autocomplete: 'address-level2' },
  { id: 'telefono', label: 'Teléfono', type: 'tel', inputmode: 'tel', autocomplete: 'tel' },
  { id: 'email', label: 'Email', type: 'email', inputmode: 'email', autocomplete: 'email' },
  { id: 'cirugia', label: '¿Qué cirugía se quiere realizar?' },
  { id: 'forma-pago', label: 'Forma de pago (contado/financiación)', options: ['Contado', 'Financiación'] }
]

const isOpen = ref(false)
const sent = ref(false)
const trigger = ref<HTMLButtonElement | null>(null)
const dialog = ref<HTMLElement | null>(null)

async function open() {
  isOpen.value = true
  sent.value = false
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
</style>

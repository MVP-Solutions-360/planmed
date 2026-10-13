<template>
  <div ref="root" class="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-end gap-3" data-testid="chat-launcher" @keydown.esc="close(true)">
    <!-- Canales de chat -->
    <div v-show="isOpen" id="chat-launcher-panel" role="group" aria-label="Elige un canal de chat">
      <ul class="flex flex-col items-end gap-3">
        <li>
          <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-xl hover:scale-110 active:scale-95 transition" data-testid="chat-whatsapp" aria-label="Chatear por WhatsApp" title="WhatsApp">
            <svg class="w-7 h-7 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
          </a>
        </li>
        <li>
          <a :href="messengerUrl" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center w-14 h-14 rounded-full bg-[#0084FF] text-white shadow-xl hover:scale-110 active:scale-95 transition" data-testid="chat-messenger" aria-label="Chatear por Messenger" title="Messenger">
            <svg class="w-7 h-7 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.24 0 0 4.952 0 11.64c0 3.499 1.434 6.521 3.769 8.61a.96.96 0 0 1 .323.683l.065 2.135a.96.96 0 0 0 1.347.85l2.381-1.053a.96.96 0 0 1 .641-.046A13 13 0 0 0 12 23.28c6.76 0 12-4.952 12-11.64S18.76 0 12 0m6.806 7.44c.522-.03.971.567.63 1.094l-4.178 6.457a.707.707 0 0 1-.977.208l-3.87-2.504a.44.44 0 0 0-.49.007l-4.363 3.01c-.637.438-1.415-.317-.995-.966l4.179-6.457a.706.706 0 0 1 .977-.21l3.87 2.505c.145.09.33.086.472-.011l4.361-3.01c.142-.098.296-.14.438-.151" /></svg>
          </a>
        </li>
      </ul>
    </div>

    <!-- Botón flotante -->
    <button
      type="button"
      class="flex items-center justify-center w-14 h-14 bg-black text-white rounded-full shadow-2xl hover:bg-[#0C2619] hover:scale-110 active:scale-95 transition-all"
      :aria-expanded="isOpen ? 'true' : 'false'"
      aria-controls="chat-launcher-panel"
      aria-label="Chatea con nosotros" title="Chatea con nosotros"
      @click="isOpen = !isOpen"
    >
      <span class="relative flex">
        <svg v-if="!isOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 10h8M8 14h5m-9 6l2.6-3.1A8 8 0 1112 20H4z" /></svg>
        <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M6 18L18 6M6 6l12 12" /></svg>
        <span v-if="!isOpen" class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#25D366] ring-2 ring-black" aria-hidden="true"></span>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
// Lanzador de chat global: botón flotante que despliega WhatsApp y Messenger de Planmed (reemplaza el botón único de WhatsApp anterior).
import { ref, onMounted, onBeforeUnmount } from 'vue'

const whatsappUrl = 'https://api.whatsapp.com/send/?phone=573157857783&text&type=phone_number&app_absent=0'
const messengerUrl = 'https://www.messenger.com/t/403573373152668/'

const isOpen = ref(false)
const root = ref<HTMLElement | null>(null)

function close(restoreFocus = false) {
  isOpen.value = false
  if (restoreFocus) root.value?.querySelector<HTMLButtonElement>('button')?.focus()
}
function onOutside(e: MouseEvent) {
  if (isOpen.value && root.value && !root.value.contains(e.target as Node)) close()
}
onMounted(() => document.addEventListener('click', onOutside))
onBeforeUnmount(() => document.removeEventListener('click', onOutside))
</script>

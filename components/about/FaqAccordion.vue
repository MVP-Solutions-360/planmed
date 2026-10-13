<template>
  <div ref="root" class="divide-y divide-[#e5e2e1] border-y border-[#e5e2e1]">
    <div v-for="(faq, i) in faqs" :key="faq.id">
      <h3 class="m-0">
        <button
          :id="`${idPrefix}-btn-${faq.id}`"
          type="button"
          class="w-full flex items-center justify-between gap-6 py-6 text-left group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0C2619]"
          :aria-expanded="open === faq.id ? 'true' : 'false'"
          :aria-controls="`${idPrefix}-panel-${faq.id}`"
          @click="toggle(faq.id)"
          @keydown="onKeydown($event, i)"
        >
          <span class="font-serif text-lg md:text-xl text-[#0C2619] leading-snug">{{ faq.question }}</span>
          <span
            class="shrink-0 w-9 h-9 rounded-full border flex items-center justify-center transition-colors"
            :class="open === faq.id ? 'bg-[#0C2619] border-[#0C2619] text-[#D3A76A]' : 'border-[#D3A76A] text-[#0C2619] group-hover:bg-[#0C2619]/5'"
            aria-hidden="true"
          >
            <svg class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-45': open === faq.id }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-width="2" d="M12 5v14M5 12h14" /></svg>
          </span>
        </button>
      </h3>
      <div
        :id="`${idPrefix}-panel-${faq.id}`"
        role="region"
        :aria-labelledby="`${idPrefix}-btn-${faq.id}`"
        :hidden="open !== faq.id"
        class="pb-6 pr-14"
      >
        <CommonRichContent :html="faq.answer" class="text-gray-600 font-light leading-relaxed" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Acordeón accesible (patrón WAI-ARIA): cada pregunta es un botón con aria-expanded/aria-controls; Enter y Espacio abren o cierran
// (botón nativo); Flecha arriba/abajo, Inicio y Fin mueven el foco entre preguntas. Las respuestas se renderizan con CommonRichContent (HTML saneado con lista blanca).
import { ref } from 'vue'
import type { AboutFaq } from '#shared/utils/aboutContent'

defineProps<{ faqs: AboutFaq[], idPrefix?: string }>()

const open = ref<string | null>(null)
const root = ref<HTMLElement | null>(null)

function toggle(id: string) {
  open.value = open.value === id ? null : id
}

function onKeydown(e: KeyboardEvent, i: number) {
  // El orden de los refs dentro de v-for no está garantizado: se toma el orden real del DOM.
  const list = Array.from(root.value?.querySelectorAll<HTMLButtonElement>('button[aria-controls]') ?? [])
  if (!list.length) return
  const target = { ArrowDown: (i + 1) % list.length, ArrowUp: (i - 1 + list.length) % list.length, Home: 0, End: list.length - 1 }[e.key]
  if (target === undefined) return
  e.preventDefault()
  list[target]?.focus()
}
</script>

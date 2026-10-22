<template>
  <section v-if="clinics.length" aria-label="Clínicas aliadas" class="mt-10 space-y-14 md:space-y-20">
    <article v-for="c in clinics" :id="c.id" :key="c.id" class="bg-white border border-[#e5e2e1] scroll-mt-28">
      <div class="grid md:grid-cols-5">
        <div class="md:col-span-2 bg-[#0C2619]">
          <img :src="c.image" :alt="`Imagen de ${c.name}`" loading="lazy" class="w-full h-full min-h-[240px] max-h-[420px] md:max-h-none object-cover aspect-[4/3] md:aspect-auto" />
        </div>
        <div class="md:col-span-3 p-6 md:p-10">
          <span class="block w-10 h-[2px] bg-[#D3A76A] mb-5" aria-hidden="true"></span>
          <h2 class="font-serif text-2xl md:text-3xl font-medium text-[#0C2619] break-words">{{ c.name }}</h2>
          <CommonRichContent :html="c.description" class="mt-4 text-gray-600 font-light text-base md:text-lg leading-relaxed" />
        </div>
      </div>

      <div v-if="c.gallery.length" class="border-t border-[#e5e2e1] p-6 md:p-10">
        <h3 class="text-[11px] font-bold tracking-[0.15em] uppercase text-[#9a7a45] mb-4">Galería</h3>
        <ul class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <li v-for="(g, gi) in c.gallery" :key="g">
            <button type="button" class="block w-full aspect-[4/3] overflow-hidden bg-[#fcf9f8] focus-visible:outline-2 focus-visible:outline-[#0C2619]" :aria-label="`Ampliar imagen ${gi + 1} de ${c.gallery.length} de ${c.name}`" @click="open(c.id, gi, $event)">
              <img :src="g" :alt="`${c.name}: imagen ${gi + 1}`" loading="lazy" class="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            </button>
          </li>
        </ul>
      </div>

      <div v-if="c.documents.length" class="border-t border-[#e5e2e1] p-6 md:p-10 bg-[#fcf9f8]">
        <h3 class="text-[11px] font-bold tracking-[0.15em] uppercase text-[#9a7a45] mb-4">Documentos y certificados</h3>
        <ul class="grid gap-4 md:grid-cols-2">
          <li v-for="d in c.documents" :key="d.id" class="bg-white border border-[#e5e2e1] border-l-[3px] border-l-[#D3A76A] p-4">
            <p class="font-semibold text-[#0C2619] break-words">{{ d.title }}</p>
            <ul class="mt-2 space-y-1">
              <li v-for="f in d.files" :key="f.url">
                <a :href="f.url" target="_blank" rel="noopener noreferrer" class="text-sm text-gray-600 underline underline-offset-2 hover:text-[#0C2619] break-all">{{ f.name || 'Ver archivo' }}<span class="sr-only"> (se abre en una pestaña nueva)</span></a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </article>

    <!-- Visor de la galería: imagen ampliada con anterior/siguiente (sin salir de la página ni abrir pestañas) -->
    <div
      v-if="current"
      ref="dialog"
      class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 outline-none"
      role="dialog"
      aria-modal="true"
      :aria-label="`Galería de ${current.clinic.name}`"
      tabindex="-1"
      @click.self="close"
      @keydown="onKey"
      @touchstart.passive="touchX = $event.touches[0].clientX"
      @touchend.passive="onTouchEnd"
    >
      <button type="button" class="absolute top-4 right-4 text-white text-3xl leading-none px-3" aria-label="Cerrar" @click="close">×</button>
      <button v-if="current.total > 1" type="button" class="absolute left-2 md:left-6 text-white text-4xl px-3 py-6" aria-label="Imagen anterior" @click="step(-1)">‹</button>
      <img :src="current.url" :alt="`${current.clinic.name}: imagen ${current.index + 1}`" class="max-h-full max-w-full object-contain select-none" />
      <button v-if="current.total > 1" type="button" class="absolute right-2 md:right-6 text-white text-4xl px-3 py-6" aria-label="Imagen siguiente" @click="step(1)">›</button>
      <p class="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm" aria-live="polite">{{ current.index + 1 }} / {{ current.total }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
// Clínicas aliadas administradas desde /admin/paginas/clinicas-aliadas (GET /api/public/clinics). Sin clínicas no se muestra nada.
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useFetch } from '#imports'
import { clinicsDefault, type ClinicsContent } from '#shared/utils/clinics'

const { data } = await useFetch<ClinicsContent>('/api/public/clinics', { key: 'clinics-public', default: () => clinicsDefault() })
const clinics = computed(() => data.value?.clinics ?? [])

// Visor: una sola ventana para todas las clínicas; `active` identifica la clínica y la imagen abiertas.
const active = ref<{ id: string, index: number } | null>(null)
const dialog = ref<HTMLElement | null>(null)
const touchX = ref(0)
let opener: HTMLElement | null = null

const current = computed(() => {
  if (!active.value) return null
  const clinic = clinics.value.find(c => c.id === active.value!.id)
  if (!clinic || !clinic.gallery.length) return null
  const index = Math.min(active.value.index, clinic.gallery.length - 1)
  return { clinic, index, total: clinic.gallery.length, url: clinic.gallery[index] }
})

function open(id: string, index: number, e: Event) {
  opener = e.currentTarget as HTMLElement
  active.value = { id, index }
}
function close() {
  active.value = null
}
function step(dir: 1 | -1) {
  const c = current.value
  if (!c || c.total < 2) return
  active.value = { id: c.clinic.id, index: (c.index + dir + c.total) % c.total }
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
  else if (e.key === 'ArrowLeft') step(-1)
  else if (e.key === 'ArrowRight') step(1)
}
function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchX.value
  if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1)
}

// Bloquea el scroll de fondo mientras el visor está abierto, enfoca la ventana (teclado) y devuelve el foco a la miniatura al cerrar.
watch(() => !!current.value, async (isOpen) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = isOpen ? 'hidden' : ''
  if (isOpen) { await nextTick(); dialog.value?.focus() }
  else { opener?.focus(); opener = null }
})
onBeforeUnmount(() => { if (typeof document !== 'undefined') document.body.style.overflow = '' })
</script>

<template>
  <div v-if="target" class="flex flex-col gap-2" data-testid="share-actions" :class="[tone === 'dark' ? 'text-white' : 'text-[#0C2619]', align === 'start' ? 'items-start' : 'items-center']">
    <div class="flex flex-wrap items-center gap-3" :class="align === 'start' ? 'justify-start' : 'justify-center'">
      <button
        type="button"
        class="share-btn"
        :class="tone === 'dark' ? 'share-btn--dark' : 'share-btn--light'"
        data-testid="share-copy"
        :aria-label="target.kind === 'short' ? 'Copiar enlace corto' : 'Copiar enlace de la página'"
        @click="copy"
      >
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        {{ target.kind === 'short' ? 'Copiar enlace corto' : 'Copiar enlace' }}
      </button>
      <a
        :href="whatsappHref"
        target="_blank"
        rel="noopener noreferrer"
        class="share-btn"
        :class="tone === 'dark' ? 'share-btn--dark' : 'share-btn--light'"
        data-testid="share-whatsapp"
        aria-label="Compartir por WhatsApp"
      >
        <svg class="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
        Compartir por WhatsApp
      </a>
    </div>

    <!-- Confirmación visible y accesible; si el navegador no permite copiar, el enlace queda seleccionable para copiarlo a mano. -->
    <p class="min-h-[1.25rem] text-xs font-medium" role="status" aria-live="polite" data-testid="share-status">{{ message }}</p>
    <input
      v-if="state === 'manual'"
      ref="manualInput"
      type="text"
      readonly
      :value="target.url"
      class="w-full max-w-md rounded border border-[#cfc4c5] bg-white px-3 py-2 text-xs text-[#1c1b1b]"
      aria-label="Enlace para copiar"
      data-testid="share-manual"
      @focus="($event.target as HTMLInputElement).select()"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useSiteConfig } from '#imports'
import { resolveShareTarget, whatsappShareUrl } from '#shared/utils/share'

// Acciones «Copiar enlace» y «Compartir por WhatsApp» de un contenido público. El enlace corto es el de Wellezy Hub (si el contenido lo
// tiene); sin él se comparte la URL pública de la página. Ver shared/utils/share.ts para las reglas.
const props = withDefaults(defineProps<{
  /** Título del contenido (va en el mensaje de WhatsApp). */
  title: string
  /** Enlace corto real entregado por Hub (null/undefined si no existe). */
  shortUrl?: string | null
  /** Ruta pública del contenido actual, p. ej. /noticias/mi-articulo. */
  path: string
  /** `dark` sobre fondos oscuros (hero), `light` sobre fondos claros. */
  tone?: 'dark' | 'light'
  align?: 'center' | 'start'
}>(), { shortUrl: null, tone: 'light', align: 'center' })

const origin = String(useSiteConfig().url ?? '')
const target = computed(() => resolveShareTarget({ shortUrl: props.shortUrl, origin, path: props.path }))
const whatsappHref = computed(() => (target.value ? whatsappShareUrl(props.title, target.value.url) : '#'))

const state = ref<'idle' | 'copied' | 'manual'>('idle')
const manualInput = ref<HTMLInputElement | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

const message = computed(() => {
  if (state.value === 'copied') {
    return target.value?.kind === 'short'
      ? '¡Enlace corto copiado!'
      : '¡Enlace copiado! Este contenido aún no tiene enlace corto: se copió el enlace de la página.'
  }
  if (state.value === 'manual') return 'Tu navegador no permitió copiar automáticamente. Selecciona el enlace y cópialo.'
  return ''
})

function flash(next: 'copied' | 'manual') {
  state.value = next
  if (timer) clearTimeout(timer)
  if (next === 'copied') timer = setTimeout(() => { state.value = 'idle' }, 3500)
}

/** Copia con la API moderna y, si no está disponible o se deniega, con el método clásico; si ambos fallan, deja el enlace a la vista. */
async function copy() {
  const url = target.value?.url
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    return flash('copied')
  } catch { /* se prueba el método clásico */ }
  try {
    const area = document.createElement('textarea')
    area.value = url
    area.setAttribute('readonly', '')
    area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    if (ok) return flash('copied')
  } catch { /* sin permiso */ }
  flash('manual')
  await nextTick()
  manualInput.value?.focus()
}

onBeforeUnmount(() => { if (timer) clearTimeout(timer) })
</script>

<style scoped>
.share-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0 1.25rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}
.share-btn--dark { border: 1px solid rgb(255 255 255 / 0.45); color: #fff; background: rgb(255 255 255 / 0.08); }
.share-btn--dark:hover { background: #fff; color: #0C2619; }
.share-btn--light { border: 1px solid #0C2619; color: #0C2619; background: transparent; }
.share-btn--light:hover { background: #0C2619; color: #fff; }
.share-btn:focus-visible { outline: 2px solid #D3A76A; outline-offset: 3px; }
</style>

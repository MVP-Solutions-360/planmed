<template>
  <div class="space-y-6">
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <p v-if="eyebrow" class="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">{{ eyebrow }}</p>
          <h3 class="text-xl font-serif text-[#0C2619] break-words">{{ page.title }}</h3>
          <p class="text-xs text-gray-400 mt-1">Dirección fija: <code class="bg-gray-100 rounded px-1.5 py-0.5">/recomendaciones/{{ page.slug }}</code> · el slug no cambia al editar.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <AdminRecommendationsStatusBadge :label="page.published ? 'Publicada' : 'Oculta'" :tone="page.published ? 'green' : 'gray'" />
          <AdminRecommendationsStatusBadge v-if="dirty" label="Cambios sin guardar" tone="amber" />
          <AdminRecommendationsStatusBadge v-if="error" :label="ACTION_BADGE[error.action]" tone="red" />
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <div class="text-xs text-gray-500 max-w-xl">
          <template v-if="page.published">Visible en la web. Al ocultarla deja de mostrarse y desaparece del menú; el contenido se conserva.</template>
          <template v-else>Oculta al público. Al publicarla se muestra el contenido <strong>ya guardado</strong>.</template>
          <span v-if="dirty" class="block text-amber-700 mt-1">Guarda los cambios antes de publicar u ocultar.</span>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <NuxtLink v-if="viewUrl" :to="viewUrl" target="_blank" class="text-[11px] font-bold tracking-widest uppercase text-[#0C2619] hover:text-[#D3A76A]">Ver en la web ↗</NuxtLink>
          <button
            type="button" :disabled="dirty || publishing || saving" @click="page.published ? $emit('unpublish') : $emit('publish')"
            class="px-5 py-2.5 rounded-lg border text-xs font-bold tracking-widest uppercase transition-colors disabled:opacity-50"
            :class="page.published ? 'border-gray-300 text-gray-600 hover:bg-gray-50' : 'border-[#0C2619] text-[#0C2619] hover:bg-[#0C2619] hover:text-white'"
          >
            {{ publishing ? 'Procesando...' : page.published ? 'Ocultar' : 'Publicar' }}
          </button>
          <button v-if="canDelete" type="button" :disabled="publishing || saving" @click="$emit('delete')" class="text-xs font-bold text-gray-400 hover:text-red-600 uppercase tracking-wider disabled:opacity-50">Eliminar página</button>
        </div>
      </div>

      <p v-if="!page.published && !page.content.trim()" class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
        Esta página aún no tiene contenido guardado: escríbelo abajo y pulsa «Guardar» para poder publicarla.
      </p>

      <!-- Error de PUBLICAR / OCULTAR / ELIMINAR: junto a esas acciones -->
      <AdminRecommendationsErrorNotice v-if="actionError" :error="actionError" @dismiss="$emit('dismiss-error')" />
    </div>

    <slot name="notice" />

    <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 space-y-6">
      <div>
        <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Título de la página *</label>
        <input v-model="draft.title" type="text" class="field" />
      </div>

      <div>
        <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Video de YouTube (opcional)</label>
        <input v-model="draft.videoUrl" type="url" class="field" placeholder="https://www.youtube.com/watch?v=..." />
        <p class="text-[10px] text-gray-500 mt-2">Se muestra debajo del título. Admite youtube.com, youtu.be y Shorts.</p>
      </div>

      <div>
        <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Imagen (opcional)</label>
        <div class="flex flex-wrap items-start gap-4">
          <label class="block w-40 aspect-[4/3] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-[#0C2619] bg-gray-50 relative">
            <img v-if="draft.image" :src="draft.image" alt="Imagen de la página" class="w-full h-full object-cover" />
            <span v-else class="absolute inset-0 flex items-center justify-center text-xs text-gray-400 text-center px-3">Haz clic para subir</span>
            <input type="file" accept="image/*" class="hidden" @change="onImage" />
          </label>
          <button v-if="draft.image" type="button" @click="draft.image = ''" class="text-xs font-bold text-gray-400 hover:text-red-600 uppercase tracking-wider">Quitar imagen</button>
        </div>
        <p class="text-[10px] text-gray-500 mt-2">Se muestra a un costado del texto en pantallas grandes.</p>
      </div>

      <div>
        <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Contenido</label>
        <AdminRichTextEditor :key="page.slug" v-model="draft.content" min-height="22rem" />
        <p class="text-[10px] text-gray-500 mt-2">Usa listas para que se vean con los ✓ del diseño. También puedes usar títulos, negrita, cursiva y enlaces.</p>
      </div>

      <AdminRecommendationsSaveBar :label="page.title" :dirty="dirty" :saving="saving" :error="error" :saved-at="savedAt" @save="$emit('save')" @dismiss-error="$emit('dismiss-error')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { fileToOptimizedDataUrl } from '~/utils/imageFile'
import type { RecommendationPage } from '~/types/recommendations'
import { ACTION_BADGE, type ActionError, type PageDraft } from '~/utils/recommendationsAdmin'

const props = defineProps<{
  page: RecommendationPage
  draft: PageDraft
  dirty: boolean
  saving: boolean
  publishing: boolean
  error?: ActionError | null
  savedAt?: number | null
  viewUrl?: string | null
  canDelete?: boolean
  eyebrow?: string
}>()
defineEmits<{ save: [], publish: [], unpublish: [], delete: [], 'dismiss-error': [] }>()

const notify = useNotify()

// Los errores de guardar se muestran en la barra de guardado; los demás, junto a Publicar / Ocultar / Eliminar.
const actionError = computed(() => (props.error && props.error.action !== 'save' ? props.error : null))

async function onImage(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > 10 * 1024 * 1024) return void notify.error('La imagen no puede superar los 10 MB.')
  try {
    props.draft.image = await fileToOptimizedDataUrl(file)
  } catch (err: any) {
    notify.error(err.message)
  }
}
</script>

<style scoped>
.field { width: 100%; padding: .65rem .9rem; border: 1px solid #e5e7eb; border-radius: .5rem; background: #f9fafb; font-size: .875rem; }
.field:focus { outline: none; box-shadow: 0 0 0 2px #0C2619; border-color: transparent; }
</style>

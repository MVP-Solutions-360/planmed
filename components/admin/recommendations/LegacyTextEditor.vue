<template>
  <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 space-y-5">
    <div class="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
      <div class="min-w-0">
        <p class="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">Texto del procedimiento · {{ kindLabel }}</p>
        <h3 class="text-xl font-serif text-[#0C2619] break-words">{{ label }}</h3>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <AdminRecommendationsStatusBadge label="Fuente publicada" tone="blue" />
        <AdminRecommendationsStatusBadge v-if="dirty" label="Cambios sin guardar" tone="amber" />
        <AdminRecommendationsStatusBadge v-if="error" :label="ACTION_BADGE[error.action]" tone="red" />
        <NuxtLink v-if="viewUrl" :to="viewUrl" target="_blank" class="text-[11px] font-bold tracking-widest uppercase text-[#0C2619] hover:text-[#D3A76A]">Ver en la web ↗</NuxtLink>
      </div>
    </div>

    <p v-if="readonly" class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
      Este es un procedimiento maestro del Hub: su contenido es global y no se edita desde Planmed.
    </p>

    <AdminRichTextEditor :key="editorKey" v-model="draft.text" min-height="22rem" :readonly="readonly" />
    <p class="text-[10px] text-gray-500">Si lo dejas vacío, este procedimiento no aparece en ese menú ni tiene página pública. Usa listas para que se vean con los ✓ del diseño.</p>

    <AdminRecommendationsSaveBar :label="label" :dirty="dirty" :saving="saving" :error="error" :saved-at="savedAt" :disabled="readonly" @save="$emit('save')" @dismiss-error="$emit('dismiss-error')" />
  </div>
</template>

<script setup lang="ts">
import { ACTION_BADGE, type ActionError, type LegacyDraft } from '~/utils/recommendationsAdmin'

defineProps<{
  label: string
  kindLabel: string
  draft: LegacyDraft
  editorKey: string
  readonly: boolean
  dirty: boolean
  saving: boolean
  error?: ActionError | null
  savedAt?: number | null
  viewUrl?: string | null
}>()
defineEmits<{ save: [], 'dismiss-error': [] }>()
</script>

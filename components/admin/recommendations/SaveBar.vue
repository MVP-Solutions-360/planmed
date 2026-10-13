<template>
  <div class="space-y-4 border-t border-gray-100 pt-5">
    <!-- Error de GUARDAR: junto al botón que lo originó (los de publicar/ocultar/eliminar se muestran junto a esas acciones) -->
    <AdminRecommendationsErrorNotice v-if="saveError" :error="saveError" @dismiss="$emit('dismiss-error')" />

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="text-xs min-h-[1.25rem]" aria-live="polite">
        <p v-if="saving" class="text-gray-500">Guardando «{{ label }}»…</p>
        <p v-else-if="dirty" class="text-amber-700 font-semibold">Cambios sin guardar en «{{ label }}».</p>
        <p v-else-if="savedAt && !saveError" class="text-emerald-700">Guardado a las {{ savedTime }}. Esto solo aplica a «{{ label }}».</p>
        <p v-else-if="!saveError" class="text-gray-400">Sin cambios. Se guarda únicamente este elemento: «{{ label }}».</p>
      </div>
      <button
        type="button" @click="$emit('save')" :disabled="!dirty || saving || disabled"
        class="bg-[#0C2619] hover:bg-[#153a28] text-white px-6 py-3 rounded-lg font-bold text-xs tracking-widest uppercase transition-colors disabled:opacity-50 shadow-lg w-full sm:w-auto"
      >
        {{ saving ? 'Guardando...' : `Guardar «${shortLabel}»` }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ActionError } from '~/utils/recommendationsAdmin'

const props = defineProps<{ label: string, dirty: boolean, saving: boolean, error?: ActionError | null, savedAt?: number | null, disabled?: boolean }>()
defineEmits<{ save: [], 'dismiss-error': [] }>()

const saveError = computed(() => (props.error?.action === 'save' ? props.error : null))
const shortLabel = computed(() => (props.label.length > 34 ? `${props.label.slice(0, 33)}…` : props.label))
const savedTime = computed(() => (props.savedAt ? new Date(props.savedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : ''))
</script>

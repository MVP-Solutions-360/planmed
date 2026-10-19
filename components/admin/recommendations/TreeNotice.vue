<template>
  <div v-if="error" role="alert" class="rounded-lg border px-4 py-3 text-sm" :class="soft ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-red-700 bg-red-50 border-red-200'" data-testid="tree-error">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="font-semibold">{{ title }}</p>
        <p class="mt-1 break-words">{{ error.message }}</p>
        <ul v-if="extra.length" class="mt-1 list-disc pl-5 text-xs space-y-0.5">
          <li v-for="e in extra" :key="e">{{ e }}</li>
        </ul>
        <p v-if="error.transient" class="mt-1 text-xs opacity-80">Si era una acción de guardado, revisa el contenido actual antes de repetirla: puede haberse guardado.</p>
      </div>
      <button v-if="dismissible" type="button" aria-label="Cerrar aviso" class="shrink-0 text-lg leading-none opacity-60 hover:opacity-100" @click="$emit('dismiss')">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TreeErrorInfo } from '#shared/utils/recommendationAdminApi'

const props = withDefaults(defineProps<{ error?: TreeErrorInfo | null, title?: string, dismissible?: boolean, hideFields?: string[] }>(), { title: 'No se pudo completar la acción', dismissible: true, hideFields: () => [] })
defineEmits<{ dismiss: [] }>()

// Sesión y permisos no son un fallo del contenido: se muestran con tono de aviso.
const soft = computed(() => props.error?.kind === 'auth' || props.error?.kind === 'forbidden')
// Los errores por campo que no se muestran junto a su campo se listan aquí (nada queda oculto).
const extra = computed(() => Object.entries(props.error?.fields ?? {}).filter(([k]) => !props.hideFields.includes(k)).map(([, v]) => v))
</script>

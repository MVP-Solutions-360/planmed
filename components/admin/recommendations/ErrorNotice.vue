<template>
  <div v-if="error" role="alert" class="rounded-lg border px-4 py-3 text-sm" :class="soft ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-red-700 bg-red-50 border-red-200'">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="font-semibold">{{ error.title }}</p>
        <p class="mt-1 break-words">{{ error.detail }}</p>
        <ul v-if="error.details.length" class="mt-1 list-disc pl-5 text-xs space-y-0.5">
          <li v-for="d in error.details" :key="d">{{ d }}</li>
        </ul>
        <p v-if="hint" class="mt-1 text-xs opacity-80">{{ hint }}</p>
      </div>
      <button type="button" aria-label="Cerrar aviso" class="shrink-0 text-lg leading-none opacity-60 hover:opacity-100" @click="$emit('dismiss')">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ActionError } from '~/utils/recommendationsAdmin'

const props = defineProps<{ error?: ActionError | null }>()
defineEmits<{ dismiss: [] }>()

// Sesión y permisos no son un fallo del contenido: se muestran con tono de aviso.
const soft = computed(() => props.error?.kind === 'auth' || props.error?.kind === 'forbidden')
const hint = computed(() => {
  const e = props.error
  if (!e) return ''
  if (e.kind === 'network' || e.kind === 'server') return `Inténtalo de nuevo en unos segundos.${e.action === 'save' ? ' Tus cambios siguen en pantalla.' : ''}`
  if (e.action === 'save' && e.kind !== 'local') return 'Tus cambios siguen en pantalla.'
  return ''
})
</script>

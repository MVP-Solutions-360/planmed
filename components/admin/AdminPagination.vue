<template>
  <div v-if="!hidden" class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50">
    <div class="flex items-center gap-3 text-xs text-gray-500">
      <label class="flex items-center gap-2">
        Mostrar
        <select
          :value="perPage"
          class="px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0C2619]"
          @change="$emit('update:perPage', Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="n in options" :key="n" :value="n">{{ n }}</option>
        </select>
      </label>
      <span>Página {{ page }} de {{ lastPage }} · {{ total }} {{ label }}</span>
    </div>
    <div class="flex gap-2">
      <button :disabled="page <= 1" class="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed" @click="$emit('update:page', page - 1)">Anterior</button>
      <button :disabled="page >= lastPage" class="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed" @click="$emit('update:page', page + 1)">Siguiente</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  page: number
  perPage: number
  lastPage: number
  total: number
  label?: string
}>(), { label: 'registros' })

defineEmits<{ (e: 'update:page', v: number): void, (e: 'update:perPage', v: number): void }>()

const options = [10, 50, 100, 500]
// Se oculta solo si no hay registros; con pocos registros se mantiene el selector.
const hidden = computed(() => props.total === 0)
</script>

<template>
  <aside class="bg-white border border-gray-200 rounded-xl shadow-sm p-3 lg:sticky lg:top-4 space-y-3">
    <div class="px-2 pt-1">
      <label for="procedure-search" class="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">Buscar procedimiento</label>
      <input id="procedure-search" v-model="query" type="search" placeholder="Escribe un nombre…" class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2619]" />
    </div>
    <p class="px-2 text-[10px] text-gray-400">{{ filtered.length }} de {{ rows.length }} procedimientos</p>

    <ul class="max-h-[28rem] overflow-y-auto space-y-1">
      <li v-for="row in filtered" :key="row.slug">
        <button
          type="button" @click="$emit('select', row.slug)"
          class="w-full text-left px-3 py-3 rounded-lg transition-colors"
          :class="row.slug === selected ? 'bg-[#D3A76A] text-[#0C2619]' : 'hover:bg-gray-50 text-gray-700'"
        >
          <span class="block text-sm font-semibold break-words">{{ row.name }}</span>
          <span class="mt-1.5 flex flex-wrap gap-1.5">
            <AdminRecommendationsStatusBadge v-for="b in row.badges" :key="b.kind" :label="`${b.kindLabel}: ${b.label}`" :tone="b.tone" />
          </span>
        </button>
      </li>
      <li v-if="!filtered.length" class="px-3 py-6 text-sm text-gray-400 text-center">{{ rows.length ? 'Ningún procedimiento coincide con la búsqueda.' : 'No hay procedimientos disponibles.' }}</li>
    </ul>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BadgeTone } from './StatusBadge.vue'

export interface PickerRow {
  slug: string
  name: string
  badges: Array<{ kind: string, kindLabel: string, label: string, tone: BadgeTone }>
}

const props = defineProps<{ rows: PickerRow[], selected: string | null }>()
defineEmits<{ select: [slug: string] }>()

const query = ref('')
const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const filtered = computed(() => {
  const q = normalize(query.value.trim())
  return q ? props.rows.filter(r => normalize(r.name).includes(q)) : props.rows
})
</script>

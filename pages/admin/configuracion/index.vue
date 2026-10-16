<template>
  <div>
    <div class="mb-8">
      <h2 class="text-3xl font-serif text-[#0C2619] mb-2 uppercase">Configuración</h2>
      <p class="text-gray-500 font-light">Colaboradores de la línea Planmed (solo líder), tasa de usura mensual del simulador y guía de uso del panel.</p>
    </div>

    <!-- Pestañas -->
    <div role="tablist" aria-label="Secciones de Configuración" class="flex gap-1 border-b border-gray-200 mb-8" @keydown="onTabKey">
      <button
        v-for="(t, i) in tabs"
        :id="`cfg-tab-${t.key}`"
        :key="t.key"
        ref="tabButtons"
        type="button"
        role="tab"
        :aria-selected="tab === t.key ? 'true' : 'false'"
        :aria-controls="`cfg-panel-${t.key}`"
        :tabindex="tab === t.key ? 0 : -1"
        class="px-5 py-3 text-xs font-bold tracking-widest uppercase border-b-2 -mb-px transition-colors focus-visible:outline-2 focus-visible:outline-[#0C2619]"
        :class="tab === t.key ? 'border-[#0C2619] text-[#0C2619]' : 'border-transparent text-gray-400 hover:text-gray-700'"
        @click="select(t.key)"
      >{{ t.label }}</button>
    </div>

    <section v-if="can.line" v-show="tab === 'config'" id="cfg-panel-config" role="tabpanel" aria-labelledby="cfg-tab-config" tabindex="0" class="focus:outline-none">
      <AdminLineUsersPanel />
    </section>

    <section v-if="can.rate" v-show="tab === 'tasa'" id="cfg-panel-tasa" role="tabpanel" aria-labelledby="cfg-tab-tasa" tabindex="0" class="focus:outline-none">
      <AdminFinancingRatePanel />
    </section>

    <section v-show="tab === 'guia'" id="cfg-panel-guia" role="tabpanel" aria-labelledby="cfg-tab-guia" tabindex="0" class="focus:outline-none">
      <p class="text-gray-500 font-light mb-8">Cómo usar cada opción y qué se actualiza en Wellezy Hub frente a lo que vive solo en la web.</p>
      <AdminGuide />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFetch, useHead, useRoute, useRouter } from '#imports'

useHead({ title: 'Configuración | Admin Planmed' })
definePageMeta({ layout: 'admin' })

// Qué secciones puede usar la persona (el servidor lo decide y vuelve a comprobarlo en cada ruta): colaboradores = solo líder;
// tasa = líder y rol de diseño configurado. La guía es para todas.
const { data: access } = await useFetch<{ canManageLine: boolean, canManageRate: boolean }>('/api/admin/config/access')
const can = computed(() => ({ line: access.value?.canManageLine === true, rate: access.value?.canManageRate === true }))

const ALL_TABS = [
  { key: 'config', label: 'Configuración' },
  { key: 'tasa', label: 'Tasa de usura' },
  { key: 'guia', label: 'Guía del panel' }
] as const
type TabKey = typeof ALL_TABS[number]['key']
const tabs = computed(() => ALL_TABS.filter(t => t.key === 'guia' || (t.key === 'config' ? can.value.line : can.value.rate)))

const route = useRoute()
const router = useRouter()
// Se puede enlazar una pestaña con /admin/configuracion?tab=guia.
const wanted = route.query.tab === 'guia' || route.query.tab === 'tasa' ? route.query.tab as TabKey : 'config'
const tab = ref<TabKey>(tabs.value.some(t => t.key === wanted) ? wanted : tabs.value[0]!.key)
const tabButtons = ref<HTMLButtonElement[]>([])

function select(key: TabKey) {
  tab.value = key
  router.replace({ query: key === tabs.value[0]!.key ? {} : { tab: key } })
}

// Teclado del patrón WAI-ARIA tabs: flechas, Inicio y Fin.
function onTabKey(e: KeyboardEvent) {
  const list = tabs.value
  const i = list.findIndex(t => t.key === tab.value)
  const target = ({ ArrowRight: (i + 1) % list.length, ArrowLeft: (i - 1 + list.length) % list.length, Home: 0, End: list.length - 1 } as Record<string, number>)[e.key]
  if (target === undefined) return
  e.preventDefault()
  select(list[target]!.key)
  tabButtons.value[target]?.focus()
}
</script>

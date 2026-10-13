<template>
  <div>
    <div class="mb-8">
      <h2 class="text-3xl font-serif text-[#0C2619] mb-2 uppercase">Configuración</h2>
      <p class="text-gray-500 font-light">Colaboradores de la línea Planmed y guía de uso del panel. Solo visible para el líder de la línea.</p>
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

    <section v-show="tab === 'config'" id="cfg-panel-config" role="tabpanel" aria-labelledby="cfg-tab-config" tabindex="0" class="focus:outline-none">
      <AdminLineUsersPanel />
    </section>

    <section v-show="tab === 'guia'" id="cfg-panel-guia" role="tabpanel" aria-labelledby="cfg-tab-guia" tabindex="0" class="focus:outline-none">
      <p class="text-gray-500 font-light mb-8">Cómo usar cada opción y qué se actualiza en Wellezy Hub frente a lo que vive solo en la web.</p>
      <AdminGuide />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useHead, useRoute, useRouter } from '#imports'

useHead({ title: 'Configuración | Admin Planmed' })
definePageMeta({ layout: 'admin' })

const tabs = [
  { key: 'config', label: 'Configuración' },
  { key: 'guia', label: 'Guía del panel' }
] as const
type TabKey = typeof tabs[number]['key']

const route = useRoute()
const router = useRouter()
// Se puede enlazar una pestaña con /admin/configuracion?tab=guia.
const tab = ref<TabKey>(route.query.tab === 'guia' ? 'guia' : 'config')
const tabButtons = ref<HTMLButtonElement[]>([])

function select(key: TabKey) {
  tab.value = key
  router.replace({ query: key === 'config' ? {} : { tab: key } })
}

// Teclado del patrón WAI-ARIA tabs: flechas, Inicio y Fin.
function onTabKey(e: KeyboardEvent) {
  const i = tabs.findIndex(t => t.key === tab.value)
  const target = ({ ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 } as Record<string, number>)[e.key]
  if (target === undefined) return
  e.preventDefault()
  select(tabs[target]!.key)
  tabButtons.value[target]?.focus()
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h2 class="text-3xl font-serif text-[#0C2619] mb-2 uppercase">Micrositios</h2>
        <p class="text-gray-500 font-light">Administra los micrositios de referidores (PRP) y su enlace público.</p>
      </div>
      <NuxtLink to="/admin/micrositios/nuevo" class="bg-[#D3A76A] hover:bg-[#c29659] text-white px-6 py-3 rounded-lg font-bold text-xs tracking-widest uppercase transition-colors inline-flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        Nuevo Micrositio
      </NuxtLink>
    </div>

    <!-- Filtros -->
    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
      <div class="relative flex-grow">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nombre, código PRP o slug..."
          class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent transition-all"
        />
      </div>
      <select v-model="statusFilter" class="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] text-sm text-gray-700 md:w-48">
        <option value="all">Todos los estados</option>
        <option value="active">Activos</option>
        <option value="inactive">Inactivos</option>
      </select>
    </div>

    <!-- Lista -->
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div v-if="pending" class="p-12 text-center text-gray-500">
        Cargando micrositios...
      </div>
      <div v-else-if="error" class="p-12 text-center">
        <p class="text-red-600 text-sm mb-4">{{ error.message }}</p>
        <button @click="refresh()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Reintentar</button>
      </div>
      <div v-else-if="items.length === 0" class="p-12 text-center text-gray-500">
        No se encontraron micrositios.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
              <th class="p-4 font-medium">Nombre</th>
              <th class="p-4 font-medium">Código PRP</th>
              <th class="p-4 font-medium">Enlace público</th>
              <th class="p-4 font-medium">Título</th>
              <th class="p-4 font-medium text-center">Estado</th>
              <th class="p-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50/50 transition-colors">
              <td class="p-4">
                <h3 class="font-bold text-gray-900 text-sm line-clamp-1" :title="item.name">{{ item.name }}</h3>
              </td>
              <td class="p-4">
                <span class="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{{ item.externalCode }}</span>
              </td>
              <td class="p-4">
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-500 font-mono line-clamp-1 max-w-[260px]" :title="prpService.publicPath(item.slug)">{{ prpService.publicPath(item.slug) }}</span>
                  <button @click="copyLink(item.slug)" class="p-1.5 text-gray-400 hover:text-[#0C2619] transition-colors bg-gray-50 hover:bg-gray-100 rounded-lg shrink-0" title="Copiar enlace">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                </div>
              </td>
              <td class="p-4">
                <p class="text-xs text-gray-500 line-clamp-1 max-w-[200px]" :title="item.title || ''">{{ item.title || '—' }}</p>
              </td>
              <td class="p-4 text-center">
                <button
                  @click="toggleActive(item)"
                  :disabled="togglingId === item.id"
                  :class="item.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                  class="inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors disabled:opacity-50"
                  :title="item.isActive ? 'Desactivar' : 'Activar'"
                >
                  {{ item.isActive ? 'Activo' : 'Inactivo' }}
                </button>
              </td>
              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <NuxtLink :to="`/admin/micrositios/${item.id}`" class="p-2 text-gray-400 hover:text-[#0C2619] transition-colors bg-gray-50 hover:bg-gray-100 rounded-lg" title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </NuxtLink>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div v-if="!pending && !error && lastPage > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
        <span class="text-xs text-gray-500">Página {{ page }} de {{ lastPage }} · {{ total }} micrositios</span>
        <div class="flex gap-2">
          <button @click="page--" :disabled="page <= 1" class="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Anterior</button>
          <button @click="page++" :disabled="page >= lastPage" class="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Siguiente</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useHead, useAsyncData } from '#imports'
import { prpService } from '~/services/PrpService'
import type { Prp, PrpPage } from '~/types/prp'

const notify = useNotify()

useHead({
  title: 'Micrositios | Admin Planmed'
})
definePageMeta({
  layout: 'admin'
})

const searchQuery = ref('')
const debouncedSearch = ref('')
const statusFilter = ref<'all' | 'active' | 'inactive'>('all')
const page = ref(1)
const togglingId = ref<number | null>(null)

// Búsqueda con retardo para no consultar a Hub en cada tecla.
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(searchQuery, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { debouncedSearch.value = value.trim() }, 350)
})
onBeforeUnmount(() => clearTimeout(searchTimer))

// Cualquier cambio de filtro vuelve a la primera página.
watch([debouncedSearch, statusFilter], () => { page.value = 1 })

const emptyPage: PrpPage = { items: [], currentPage: 1, lastPage: 1, total: 0 }

const { data, pending, error, refresh } = await useAsyncData(
  'admin-prp-list',
  () => prpService.getPrps({
    search: debouncedSearch.value || undefined,
    isActive: statusFilter.value === 'all' ? undefined : statusFilter.value === 'active',
    page: page.value
  }),
  { default: () => emptyPage, server: false, watch: [debouncedSearch, statusFilter, page] }
)

const items = computed<Prp[]>(() => data.value?.items ?? [])
const lastPage = computed(() => data.value?.lastPage ?? 1)
const total = computed(() => data.value?.total ?? 0)

async function copyLink(slug: string) {
  const url = `${window.location.origin}${prpService.publicPath(slug)}`
  try {
    await navigator.clipboard.writeText(url)
    notify.success('Enlace copiado')
  } catch {
    notify.error(`No se pudo copiar el enlace automáticamente. Cópialo manualmente: ${url}`)
  }
}

async function toggleActive(item: Prp) {
  if (item.isActive) {
    const ok = await notify.confirm(
      'Desactivar micrositio',
      `El enlace de ${item.name} dejará de estar disponible y no se podrán recibir nuevos leads desde esa página.`,
      'Sí, desactivar'
    )
    if (!ok) return
  }

  togglingId.value = item.id
  try {
    if (item.isActive) await prpService.deactivatePrp(item.id)
    else await prpService.activatePrp(item.id)
    notify.success(item.isActive ? 'Micrositio desactivado' : 'Micrositio activado')
    await refresh()
  } catch (e: any) {
    notify.error(e.message || 'No se pudo cambiar el estado del micrositio.')
  } finally {
    togglingId.value = null
  }
}
</script>

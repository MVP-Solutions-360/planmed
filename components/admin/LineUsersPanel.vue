<template>
  <section class="space-y-6" aria-labelledby="line-users-title">
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-8">
      <div class="flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 pb-4 mb-6">
        <div>
          <h3 id="line-users-title" class="text-xs font-bold tracking-widest text-[#0C2619] uppercase">Colaboradores de la línea Planmed</h3>
          <p class="text-sm text-gray-500 mt-1">Personas con usuario que pertenecen a la misma empresa y línea que tu usuario. Datos de solo lectura, tomados de Wellezy Hub.</p>
        </div>
        <p v-if="page" class="text-sm text-gray-600" aria-live="polite"><strong class="text-gray-900">{{ page.meta.total }}</strong> colaborador{{ page.meta.total === 1 ? '' : 'es' }}</p>
      </div>

      <!-- Filtros -->
      <form class="flex flex-col sm:flex-row gap-3 mb-6" role="search" @submit.prevent="apply">
        <label class="sr-only" for="lu-search">Buscar por nombre o correo</label>
        <input id="lu-search" v-model="search" type="search" placeholder="Buscar por nombre o correo" class="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#0C2619]" />
        <label class="sr-only" for="lu-status">Estado</label>
        <select id="lu-status" v-model="status" class="px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#0C2619]" @change="apply">
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
        <button type="submit" class="px-5 py-2 bg-[#0C2619] text-white text-xs font-bold tracking-widest uppercase rounded-md hover:bg-[#153a28]">Buscar</button>
      </form>

      <div v-if="error" role="alert" class="rounded-lg border px-4 py-3 text-sm" :class="forbidden ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-red-700 bg-red-50 border-red-200'">
        <p class="font-semibold">{{ forbidden ? 'No tienes acceso a este listado' : 'No se pudo cargar el listado' }}</p>
        <p class="mt-1">{{ error }}</p>
        <button v-if="!forbidden" type="button" class="mt-2 underline" @click="load">Reintentar</button>
      </div>

      <div v-else-if="loading && !page" class="text-sm text-gray-500 py-8">Cargando colaboradores…</div>

      <template v-else-if="page">
        <p v-if="!page.users.length" class="text-sm text-gray-500 py-10 text-center border border-dashed border-gray-300 rounded-lg">No hay colaboradores que coincidan con la búsqueda.</p>

        <div v-else class="overflow-x-auto" :class="{ 'opacity-60 transition-opacity': loading }">
          <table class="w-full text-sm text-left">
            <caption class="sr-only">Colaboradores de la línea Planmed</caption>
            <thead>
              <tr class="text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <th scope="col" class="py-3 pr-4">Colaborador</th>
                <th scope="col" class="py-3 pr-4">Correo</th>
                <th scope="col" class="py-3 pr-4">Rol</th>
                <th scope="col" class="py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in page.users" :key="u.id" class="border-b border-gray-100 align-middle">
                <th scope="row" class="py-3 pr-4 font-semibold text-gray-900">
                  {{ u.name || 'Sin nombre' }}
                  <span v-if="u.isAreaLeader" class="ml-2 inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">Líder</span>
                </th>
                <td class="py-3 pr-4 text-gray-600 break-all">{{ u.email || '—' }}</td>
                <td class="py-3 pr-4 text-gray-600">{{ u.role || '—' }}</td>
                <td class="py-3">
                  <span class="inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider" :class="u.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'">{{ u.status === 'active' ? 'Activo' : 'Inactivo' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <nav v-if="page.meta.lastPage > 1" class="flex items-center justify-between gap-3 mt-6" aria-label="Paginación de colaboradores">
          <button type="button" class="btn-sm" :disabled="page.meta.page <= 1 || loading" @click="go(page.meta.page - 1)">Anterior</button>
          <span class="text-xs text-gray-500">Página {{ page.meta.page }} de {{ page.meta.lastPage }}</span>
          <button type="button" class="btn-sm" :disabled="page.meta.page >= page.meta.lastPage || loading" @click="go(page.meta.page + 1)">Siguiente</button>
        </nav>
      </template>
    </div>

    <p class="text-xs text-gray-500 leading-relaxed">
      Solo se listan colaboradores que tienen usuario en el Hub. Activar o desactivar usuarios todavía no está disponible desde este panel.
      La empresa y la línea se toman del usuario con el que iniciaste sesión, por lo que este listado cambia solo cuando se pase a los datos de producción.
    </p>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { lineUsersService, type LineUsersPage } from '~/services/LineUsersService'

const page = ref<LineUsersPage | null>(null)
const loading = ref(true)
const error = ref('')
const forbidden = ref(false)
const search = ref('')
const status = ref<'' | 'active' | 'inactive'>('')
const current = ref(1)

async function load() {
  loading.value = true
  error.value = ''
  forbidden.value = false
  try {
    page.value = await lineUsersService.list({ search: search.value, status: status.value, page: current.value })
  } catch (e: any) {
    forbidden.value = e.statusCode === 403
    error.value = e.message
  } finally {
    loading.value = false
  }
}
function apply() { current.value = 1; load() }
function go(p: number) { current.value = p; load() }

onMounted(load)
</script>

<style scoped>
.btn-sm { padding: .375rem .875rem; border: 1px solid #e5e7eb; border-radius: .5rem; font-size: .75rem; font-weight: 600; color: #374151; background: #fff; }
.btn-sm:hover:not(:disabled) { background: #f9fafb; }
.btn-sm:disabled { opacity: .4; }
</style>

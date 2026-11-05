<template>
  <section class="space-y-6" aria-labelledby="line-users-title">
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-8">
      <div class="flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 pb-4 mb-6">
        <div>
          <h3 id="line-users-title" class="text-xs font-bold tracking-widest text-[#0C2619] uppercase">Colaboradores de la línea Planmed</h3>
          <p class="text-sm text-gray-500 mt-1">Personas con usuario que pertenecen a la misma empresa y línea que tu usuario. Datos tomados de Wellezy Hub.</p>
        </div>
        <div class="flex items-center gap-4">
          <p v-if="page" class="text-sm text-gray-600" aria-live="polite"><strong class="text-gray-900">{{ page.meta.total }}</strong> colaborador{{ page.meta.total === 1 ? '' : 'es' }}</p>
          <button v-if="!showForm && !credentials" type="button" class="px-4 py-2 rounded-lg bg-[#0C2619] text-white text-xs font-bold tracking-wider uppercase" data-testid="new-line-user" @click="showForm = true">Nuevo colaborador</button>
        </div>
      </div>

      <!-- Credenciales del colaborador recién creado. La contraseña temporal la genera Hub y se muestra UNA sola vez: vive solo en la memoria
           de este componente (sin almacenamiento del navegador, sin URL, sin logs) y se borra al cerrar el aviso o al salir de la pantalla. -->
      <div v-if="credentials" role="alert" class="rounded-lg border border-amber-300 bg-amber-50 px-4 py-4 text-sm mb-6" data-testid="credentials">
        <p class="font-semibold text-amber-900">Colaborador creado: {{ credentials.name }}</p>
        <p class="mt-1 text-amber-900">
          Entrega estos datos de acceso al colaborador. <strong>La contraseña temporal se muestra una sola vez</strong>: al cerrar este aviso no se puede volver a ver.
          En su primer ingreso al panel deberá definir su contraseña personal.
        </p>
        <dl class="mt-3 grid sm:grid-cols-2 gap-3">
          <div>
            <dt class="text-[10px] uppercase tracking-wider text-amber-800">Correo (usuario)</dt>
            <dd class="font-mono text-gray-900 break-all select-all" data-testid="cred-email">{{ credentials.email }}</dd>
          </div>
          <div>
            <dt class="text-[10px] uppercase tracking-wider text-amber-800">Contraseña temporal</dt>
            <dd class="font-mono text-gray-900 break-all select-all" data-testid="cred-password">{{ credentials.password }}</dd>
          </div>
        </dl>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" class="btn-sm" data-testid="copy-password" @click="copy(credentials.password, 'password')">Copiar contraseña</button>
          <button type="button" class="btn-sm" data-testid="copy-credentials" @click="copy(`Usuario: ${credentials.email}
Contraseña temporal: ${credentials.password}`, 'all')">Copiar usuario y contraseña</button>
          <span v-if="copied" class="text-xs text-green-800" role="status">{{ copied === 'password' ? 'Contraseña copiada' : 'Credenciales copiadas' }}</span>
          <button type="button" class="btn-sm ml-auto" data-testid="close-credentials" @click="closeCredentials">Cerrar y borrar</button>
        </div>
      </div>

      <AdminLineUserCreateForm v-if="showForm" @created="onCreated" @cancel="showForm = false" />

      <!-- Filtros -->
      <!-- Búsqueda dinámica: se consulta sola al escribir (350 ms) o al cambiar el estado; Enter la aplica de inmediato. -->
      <form class="flex flex-col sm:flex-row gap-3 mb-6" role="search" @submit.prevent="applyNow">
        <label class="sr-only" for="lu-search">Buscar por nombre o correo</label>
        <div class="relative flex-1">
          <input id="lu-search" v-model="search" type="search" placeholder="Buscar por nombre o correo" autocomplete="off" class="w-full px-3 py-2 pr-9 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#0C2619]" />
          <span v-if="loading && page" class="absolute right-3 top-1/2 -translate-y-1/2 inline-block w-4 h-4 border-2 border-gray-300 border-t-[#0C2619] rounded-full animate-spin" role="status" aria-label="Actualizando resultados"></span>
        </div>
        <label class="sr-only" for="lu-status">Estado</label>
        <select id="lu-status" v-model="status" class="px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#0C2619]">
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
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
      Solo se listan colaboradores que tienen usuario en el Hub. Desde este panel solo se pueden crear colaboradores; activar, desactivar o editar usuarios todavía no está disponible.
      La empresa y la línea se toman del usuario con el que iniciaste sesión, por lo que este listado cambia solo cuando se pase a los datos de producción.
    </p>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { lineUsersService, type LineUsersPage, type CreatedLineUser } from '~/services/LineUsersService'

const SEARCH_DEBOUNCE_MS = 350

const page = ref<LineUsersPage | null>(null)
const loading = ref(true)
const error = ref('')
const forbidden = ref(false)
const search = ref('')
const status = ref<'' | 'active' | 'inactive'>('')
const current = ref(1)

// Evita condiciones de carrera: solo la respuesta de la última consulta puede actualizar la pantalla.
let requestSeq = 0
let searchTimer: ReturnType<typeof setTimeout> | undefined

async function load() {
  const seq = ++requestSeq
  loading.value = true
  error.value = ''
  forbidden.value = false
  try {
    const result = await lineUsersService.list({ search: search.value, status: status.value, page: current.value })
    if (seq !== requestSeq) return
    page.value = result
  } catch (e: any) {
    if (seq !== requestSeq) return
    forbidden.value = e.statusCode === 403
    error.value = e.message
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}
const showForm = ref(false)
// Credenciales en memoria (nunca persistentes). Mientras estén visibles no se puede abrir otro alta, para no perderlas por accidente.
const credentials = ref<{ name: string, email: string, password: string } | null>(null)
const copied = ref<'' | 'password' | 'all'>('')
let copiedTimer: ReturnType<typeof setTimeout> | undefined

function onCreated(result: CreatedLineUser) {
  showForm.value = false
  credentials.value = { name: result.user.name, email: result.user.email, password: result.temporaryPassword }
  load() // el listado se vuelve a pedir al servidor: no se agrega la fila localmente (sin duplicados) y no incluye la contraseña
}

function closeCredentials() {
  credentials.value = null
  copied.value = ''
  clearTimeout(copiedTimer)
}

async function copy(text: string, what: 'password' | 'all') {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = what
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => { copied.value = '' }, 2500)
  } catch {
    copied.value = '' // sin permiso de portapapeles: la persona puede seleccionar el texto (select-all)
  }
}

function applyNow() { clearTimeout(searchTimer); current.value = 1; load() }
function go(p: number) { current.value = p; load() }

// Al escribir se espera una pausa; al borrar el texto se vuelve a consultar con el estado elegido (búsqueda vacía).
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(applyNow, SEARCH_DEBOUNCE_MS)
})
watch(status, applyNow)

onMounted(load)
onBeforeUnmount(() => { clearTimeout(searchTimer); clearTimeout(copiedTimer); requestSeq++; credentials.value = null })
</script>

<style scoped>
.btn-sm { padding: .375rem .875rem; border: 1px solid #e5e7eb; border-radius: .5rem; font-size: .75rem; font-weight: 600; color: #374151; background: #fff; }
.btn-sm:hover:not(:disabled) { background: #f9fafb; }
.btn-sm:disabled { opacity: .4; }
</style>

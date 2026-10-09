<template>
  <div>
    <!-- Header de la sección -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h2 class="text-3xl font-serif text-[#0C2619] mb-2 uppercase">Procedimientos</h2>
        <p class="text-gray-500 font-light">Gestiona el catálogo de procedimientos médicos. Los datos se guardan en Wellezy Hub.</p>
      </div>
      <NuxtLink to="/admin/procedimientos/nuevo" class="bg-[#D3A76A] hover:bg-[#c29659] text-white px-6 py-3 rounded-lg font-bold text-xs tracking-widest uppercase transition-colors inline-flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        Nuevo Procedimiento
      </NuxtLink>
    </div>

    <!-- Barra de búsqueda -->
    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar por nombre o categoría..." 
          class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent transition-all"
        />
      </div>
    </div>

    <!-- Lista -->
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div v-if="pending" class="p-12 text-center text-gray-500">
        Cargando procedimientos...
      </div>
      <div v-else-if="filteredProcedures.length === 0" class="p-12 text-center text-gray-500">
        No se encontraron procedimientos.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
              <th class="p-4 font-medium">Procedimiento</th>
              <th class="p-4 font-medium">Categoría</th>
              <th class="p-4 font-medium">Estado</th>
              <th class="p-4 font-medium text-center">Destacado</th>
              <th class="p-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="proc in filteredProcedures" :key="proc.slug" class="hover:bg-gray-50/50 transition-colors">
              <td class="p-4">
                <div class="flex items-center gap-4">
                  <img v-if="proc.image" :src="proc.image" :alt="proc.name" class="w-12 h-12 rounded-lg object-cover bg-gray-100 border border-gray-200" />
                  <div v-else class="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h3 class="font-bold text-gray-900 text-sm">{{ proc.name }}</h3>
                    <p class="text-xs text-gray-500 line-clamp-1 max-w-[300px]" :title="proc.shortDescription">{{ proc.shortDescription }}</p>
                  </div>
                </div>
              </td>
              <td class="p-4">
                <span class="inline-flex px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">{{ proc.category }}</span>
              </td>
              <td class="p-4">
                <div class="flex flex-col items-start gap-1">
                  <span class="inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider" :class="proc.activo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'">{{ proc.activo ? 'Visible en la web' : 'Inactivo' }}</span>
                  <span class="inline-flex px-2 py-1 rounded-md text-[10px] font-medium" :class="proc.isMaster ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'" :title="proc.isMaster ? 'Catálogo global del Hub: solo se habilita o deshabilita en tu línea' : 'Procedimiento propio de tu línea'">{{ proc.isMaster ? 'Maestro' : 'Propio' }}</span>
                </div>
              </td>
              <td class="p-4 text-center">
                <button 
                  @click="toggleDestacado(proc)"
                  :class="proc.destacado ? 'text-[#D3A76A] hover:text-[#b38b55]' : 'text-gray-300 hover:text-gray-400'"
                  class="transition-colors p-1"
                  title="Marcar/Desmarcar Destacado"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" :fill="proc.destacado ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                </button>
              </td>
              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <NuxtLink :to="`/admin/procedimientos/${proc.slug}`" class="p-2 text-gray-400 hover:text-[#0C2619] transition-colors bg-gray-50 hover:bg-gray-100 rounded-lg" :title="proc.isMaster ? 'Ver (contenido global)' : 'Editar'">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </NuxtLink>
                  <button @click="toggleActivo(proc)" :class="proc.activo ? 'hover:text-red-600 hover:bg-red-50' : 'hover:text-green-700 hover:bg-green-50'" class="p-2 text-gray-400 transition-colors bg-gray-50 rounded-lg" :title="proc.activo ? (proc.isMaster ? 'Deshabilitar en Planmed' : 'Desactivar') : (proc.isMaster ? 'Habilitar en Planmed' : 'Activar')">
                    <svg v-if="proc.activo" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
const notify = useNotify()
import { ref, computed } from 'vue'
import { useHead, useAsyncData, refreshNuxtData } from '#imports'
import { procedureService } from '~/services/ProcedureService'
import type { Procedure } from '~/types/procedure'

useHead({
  title: 'Procedimientos | Admin Planmed'
})
definePageMeta({
  layout: 'admin'
})

const searchQuery = ref('')

const { data: procedures, pending } = await useAsyncData('admin-procedures-list', () => procedureService.getProcedures(), { default: () => [] })
onMounted(async () => { procedures.value = await procedureService.getProcedures() })

const filteredProcedures = computed(() => {
  if (!procedures.value) return []
  const q = searchQuery.value.toLowerCase()
  return procedures.value.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
})

async function toggleDestacado(proc: Procedure) {
  try {
    const updated = await procedureService.updateProcedure(proc.slug, { destacado: !proc.destacado })
    const index = procedures.value!.findIndex(p => p.slug === proc.slug)
    if (index !== -1) {
      procedures.value![index] = updated
    }
  } catch (e) {
    notify.error((e as Error).message || 'No se pudo actualizar el estado destacado.')
  }
}

// Activar/desactivar: en Hub el procedimiento propio se conserva (activo = false) y un maestro solo se deshabilita en esta línea.
async function toggleActivo(proc: Procedure) {
  try {
    const updated = await procedureService.updateProcedure(proc.slug, { activo: !proc.activo })
    const index = procedures.value!.findIndex(p => p.slug === proc.slug)
    if (index !== -1) procedures.value![index] = updated
  } catch (e) {
    notify.error((e as Error).message || 'No se pudo actualizar el estado del procedimiento.')
  }
}
</script>
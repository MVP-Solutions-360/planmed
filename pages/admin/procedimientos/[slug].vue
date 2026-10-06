<template>
  <div class="pb-24">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <NuxtLink to="/admin/procedimientos" class="text-[11px] font-bold tracking-[0.15em] text-[#848484] hover:text-[#0C2619] uppercase flex items-center gap-2 mb-4 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Volver a Procedimientos
        </NuxtLink>
        <h2 class="text-3xl font-serif text-[#0C2619] mb-1 uppercase">{{ isNew ? 'Nuevo Procedimiento' : 'Editar Procedimiento' }}</h2>
        <p class="text-gray-500 font-light">{{ isNew ? 'Crea un nuevo' : 'Modifica este' }} procedimiento en el catálogo.</p>
      </div>
      <div class="flex items-center gap-3">
        <button 
          @click="submitForm" 
          :disabled="isSubmitting"
          class="bg-[#0C2619] hover:bg-[#153a28] text-white px-8 py-3 rounded-lg font-bold text-xs tracking-widest uppercase transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg"
        >
          <span v-if="isSubmitting">Guardando...</span>
          <span v-else>Guardar Cambios</span>
        </button>
      </div>
    </div>

    <form @submit.prevent="submitForm" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Columna Principal -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Información Básica -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Información Básica</h3>
          
          <div class="space-y-6">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nombre del Procedimiento *</label>
              <input v-model="form.name" required type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="Ej: Mamoplastia de Aumento" />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Categoría (Slug) *</label>
              <input v-model="form.category" required type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="Ej: cirugia-corporal" />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Descripción Corta *</label>
              <textarea v-model="form.shortDescription" required rows="3" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent resize-none" placeholder="Breve resumen para listados..."></textarea>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">¿Qué es? (Descripción detallada) *</label>
              <textarea v-model="form.whatIsIt" required rows="6" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="Descripción completa del procedimiento..."></textarea>
            </div>
          </div>
        </div>

        <!-- Ficha Técnica -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Ficha Técnica</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Tipo de Anestesia</label>
              <input v-model="form.ficha_tecnica.tipo_anestesia" type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="Ej: General" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Tiempo Quirúrgico</label>
              <input v-model="form.ficha_tecnica.tiempo_quirurgico" type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="Ej: 2 a 3 horas" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Tiempo de Recuperación</label>
              <input v-model="form.ficha_tecnica.tiempo_recuperacion" type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="Ej: 10 a 15 días" />
            </div>
            <div class="flex items-center mt-6 md:mt-8">
              <label class="flex items-center gap-3 cursor-pointer">
                <input v-model="form.ficha_tecnica.cicatrizacion_minima" type="checkbox" class="w-5 h-5 text-[#0C2619] focus:ring-[#0C2619] border-gray-300 rounded" />
                <span class="text-sm font-medium text-gray-700">Cicatrización Mínima</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Perfil del Paciente -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Perfil del Paciente</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Edad Mínima</label>
              <input v-model.number="form.perfil_paciente.edad_minima" type="number" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="18" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Edad Máxima</label>
              <input v-model.number="form.perfil_paciente.edad_maxima" type="number" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="65" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">IMC Máximo</label>
              <input v-model.number="form.perfil_paciente.imc_maximo" type="number" step="0.1" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="29.9" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Condiciones Médicas Compatibles</label>
              <textarea v-model="form.perfil_paciente.condiciones_medicas_compatibles" rows="2" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="Buen estado de salud general..."></textarea>
            </div>
          </div>
        </div>

      </div>

      <!-- Columna Secundaria -->
      <div class="space-y-6">
        
        <!-- Estado -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Visibilidad</h3>
          <label class="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#0C2619] transition-colors">
            <input v-model="form.destacado" type="checkbox" class="w-5 h-5 text-[#D3A76A] focus:ring-[#D3A76A] border-gray-300 rounded" />
            <span class="text-sm font-bold text-gray-900">Procedimiento Destacado</span>
          </label>
        </div>

        <!-- Imagen Destacada -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Imagen Principal</h3>
          
          <div v-if="form.image" class="w-full aspect-video rounded-lg overflow-hidden mb-4 border border-gray-200 relative group">
            <img :src="form.image" alt="Preview" class="w-full h-full object-cover" />
          </div>
          <div v-else class="w-full aspect-video rounded-lg mb-4 border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400">
            Sin imagen
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">URL de la Imagen *</label>
            <input v-model="form.image" required type="url" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent text-sm" placeholder="https://..." />
            <p class="text-[10px] text-gray-500 mt-2">(En esta fase usamos URLs de imágenes directamente)</p>
          </div>
        </div>

        <!-- Galería -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <div class="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
            <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase">Galería</h3>
            <button type="button" @click="addGalleryItem" class="text-xs font-bold text-[#D3A76A] hover:text-[#b38b55]">+ Agregar</button>
          </div>
          
          <div class="space-y-3">
            <div v-for="(item, index) in form.galeria" :key="index" class="flex gap-2">
              <input v-model="form.galeria[index]" type="url" class="flex-grow px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] text-sm" placeholder="URL de la imagen" />
              <button type="button" @click="removeGalleryItem(index)" class="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <p v-if="form.galeria.length === 0" class="text-xs text-gray-400 text-center italic">No hay imágenes en la galería</p>
          </div>
        </div>

        <!-- SEO -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">SEO</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Meta Title</label>
              <input v-model="form.seo.meta_title" type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent text-sm" placeholder="Título para buscadores" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Meta Description</label>
              <textarea v-model="form.seo.meta_description" rows="3" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent text-sm resize-none" placeholder="Descripción para buscadores"></textarea>
            </div>
          </div>
        </div>

      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const notify = useNotify()
import { ref, onMounted } from 'vue'
import { useRoute, useRouter, useHead } from '#imports'
import { procedureService } from '~/services/ProcedureService'
import type { Procedure } from '~/types/procedure'

useHead({
  title: 'Editar Procedimiento | Admin Planmed'
})
definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const router = useRouter()
const slugParam = route.params.slug as string
const isNew = slugParam === 'nuevo'

const isSubmitting = ref(false)

// Form state
const form = ref({
  name: '',
  category: '',
  shortDescription: '',
  whatIsIt: '',
  image: '',
  destacado: false,
  galeria: [] as string[],
  ficha_tecnica: {
    tipo_anestesia: '',
    tiempo_quirurgico: '',
    tiempo_recuperacion: '',
    cicatrizacion_minima: false
  },
  perfil_paciente: {
    edad_minima: null as number | null,
    edad_maxima: null as number | null,
    imc_maximo: null as number | null,
    condiciones_medicas_compatibles: ''
  },
  seo: {
    meta_title: '',
    meta_description: ''
  }
})

onMounted(async () => {
  if (!isNew) {
    const data = await procedureService.getProcedureBySlug(slugParam)
    if (data) {
      // Map to form
      form.value.name = data.name || ''
      form.value.category = data.category || ''
      form.value.shortDescription = data.shortDescription || ''
      form.value.whatIsIt = data.whatIsIt || ''
      form.value.image = data.image || ''
      form.value.destacado = data.destacado || false
      
      // Map galeria string[] only for this mock (we ignore ProcedureImage objects)
      if (data.galeria && Array.isArray(data.galeria)) {
        form.value.galeria = data.galeria.filter(item => typeof item === 'string') as string[]
      }

      if (data.ficha_tecnica) {
        form.value.ficha_tecnica.tipo_anestesia = data.ficha_tecnica.tipo_anestesia || ''
        form.value.ficha_tecnica.tiempo_quirurgico = data.ficha_tecnica.tiempo_quirurgico || ''
        form.value.ficha_tecnica.tiempo_recuperacion = data.ficha_tecnica.tiempo_recuperacion || ''
        form.value.ficha_tecnica.cicatrizacion_minima = data.ficha_tecnica.cicatrizacion_minima || false
      }

      if (data.perfil_paciente) {
        form.value.perfil_paciente.edad_minima = data.perfil_paciente.edad_minima || null
        form.value.perfil_paciente.edad_maxima = data.perfil_paciente.edad_maxima || null
        form.value.perfil_paciente.imc_maximo = data.perfil_paciente.imc_maximo || null
        form.value.perfil_paciente.condiciones_medicas_compatibles = data.perfil_paciente.condiciones_medicas_compatibles || ''
      }

      if (data.seo) {
        form.value.seo.meta_title = data.seo.meta_title || ''
        form.value.seo.meta_description = data.seo.meta_description || ''
      }
    } else {
      router.push('/admin/procedimientos')
    }
  }
})

function addGalleryItem() {
  form.value.galeria.push('')
}

function removeGalleryItem(index: number) {
  form.value.galeria.splice(index, 1)
}

async function submitForm() {
  isSubmitting.value = true
  try {
    const payload: Partial<Procedure> = {
      name: form.value.name,
      category: form.value.category,
      shortDescription: form.value.shortDescription,
      whatIsIt: form.value.whatIsIt,
      image: form.value.image,
      destacado: form.value.destacado,
      galeria: form.value.galeria.filter(g => g.trim() !== ''),
      ficha_tecnica: { ...form.value.ficha_tecnica },
      perfil_paciente: { 
        ...form.value.perfil_paciente,
        edad_minima: form.value.perfil_paciente.edad_minima || undefined,
        edad_maxima: form.value.perfil_paciente.edad_maxima || undefined,
        imc_maximo: form.value.perfil_paciente.imc_maximo || undefined
      },
      seo: { ...form.value.seo }
    }

    if (isNew) {
      await procedureService.createProcedure(payload as Omit<Procedure, 'id' | 'slug'>)
    } else {
      await procedureService.updateProcedure(slugParam, payload)
    }

    router.push('/admin/procedimientos')
  } catch (error) {
    console.error('Error saving procedure:', error)
    notify.error('Ocurrió un error al guardar.')
  } finally {
    isSubmitting.value = false
  }
}
</script>
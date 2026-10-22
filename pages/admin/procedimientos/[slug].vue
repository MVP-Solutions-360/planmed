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
          <span v-else>{{ readOnly ? 'Guardar estado' : 'Guardar Cambios' }}</span>
        </button>
      </div>
    </div>

    <form @submit.prevent="submitForm" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Columna Principal -->
      <fieldset :disabled="readOnly" class="lg:col-span-2 space-y-6 min-w-0 border-0 p-0 m-0">
        <div v-if="readOnly" class="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-5 text-sm">
          <strong>Procedimiento maestro.</strong> Su contenido es global (Wellezy Hub) y no se edita desde Planmed. Aquí solo puedes habilitarlo, deshabilitarlo o destacarlo en tu línea.
        </div>

        <!-- Información Básica -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Información Básica</h3>
          
          <div class="space-y-6">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nombre del Procedimiento *</label>
              <input v-model="form.name" required type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="Ej: Mamoplastia de Aumento" />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Slug (URL) *</label>
              <input :value="form.slug" @input="onSlugInput" required type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent font-mono text-sm" placeholder="mamoplastia-de-aumento" />
              <p class="text-[10px] text-gray-500 mt-1">
                {{ slugTouched ? 'Slug personalizado: ya no se regenera al cambiar el nombre.' : 'Se genera automáticamente a partir del nombre.' }}
                <button v-if="slugTouched && isNew" type="button" @click="resetSlugToAuto" class="underline font-bold text-[#0C2619]">Volver a automático</button>
              </p>
              <p v-if="!isNew && form.slug !== slugParam" class="text-[10px] text-amber-600 mt-1">Cambiar el slug modifica la URL pública del procedimiento.</p>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Categoría (Slug)</label>
              <input v-model="form.category" type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="Ej: cirugia-corporal" />
              <p class="text-[10px] text-gray-500 mt-1">Debe ser el slug de una categoría activa del Hub.</p>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Descripción Corta *</label>
              <textarea v-model="form.shortDescription" required rows="3" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent resize-none" placeholder="Breve resumen para listados..."></textarea>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">¿Qué es? (Descripción detallada) *</label>
              <AdminRichTextEditor v-model="form.whatIsIt" height="24rem" :readonly="readOnly" />
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
              <AdminRichTextEditor v-model="form.perfil_paciente.condiciones_medicas_compatibles" min-height="6rem" :readonly="readOnly" />
            </div>
          </div>
        </div>

      </fieldset>

      <!-- Columna Secundaria -->
      <div class="space-y-6">
        
        <!-- Estado -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Visibilidad</h3>
          <div class="space-y-3">
            <label class="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#0C2619] transition-colors">
              <input v-model="form.activo" type="checkbox" class="w-5 h-5 text-[#0C2619] focus:ring-[#0C2619] border-gray-300 rounded" />
              <span class="text-sm font-bold text-gray-900">{{ form.isMaster ? 'Habilitado en Planmed' : 'Visible en la web' }}</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#0C2619] transition-colors">
              <input v-model="form.destacado" type="checkbox" class="w-5 h-5 text-[#D3A76A] focus:ring-[#D3A76A] border-gray-300 rounded" />
              <span class="text-sm font-bold text-gray-900">Procedimiento Destacado</span>
            </label>
          </div>
        </div>

        <fieldset :disabled="readOnly" class="space-y-6 min-w-0 border-0 p-0 m-0">
        <!-- Imagen Destacada -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Imagen Principal</h3>
          
          <fieldset class="mb-4 min-w-0 border-0 p-0 m-0">
            <legend class="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">Orientación de la portada</legend>
            <div class="grid grid-cols-2 gap-2">
              <label class="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#0C2619] transition-colors text-sm font-bold text-gray-900 has-[:checked]:border-[#0C2619] has-[:checked]:bg-white">
                <input v-model="form.imageOrientation" type="radio" name="imageOrientation" value="vertical" class="text-[#0C2619] focus:ring-[#0C2619]" />
                Vertical <span class="text-[10px] font-normal text-gray-500">1080 × 1920</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#0C2619] transition-colors text-sm font-bold text-gray-900 has-[:checked]:border-[#0C2619] has-[:checked]:bg-white">
                <input v-model="form.imageOrientation" type="radio" name="imageOrientation" value="horizontal" class="text-[#0C2619] focus:ring-[#0C2619]" />
                Horizontal <span class="text-[10px] font-normal text-gray-500">1920 × 1080</span>
              </label>
            </div>
          </fieldset>

          <div class="w-full flex justify-center mb-4">
            <div
              v-if="form.image"
              class="rounded-lg overflow-hidden border border-gray-200 bg-gray-100 relative group"
              :class="form.imageOrientation === 'vertical' ? 'aspect-[9/16] w-[60%]' : 'aspect-video w-full'"
              data-testid="cover-preview"
            >
              <img :src="form.image" alt="Preview" class="w-full h-full object-contain" />
            </div>
            <div
              v-else
              class="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400"
              :class="form.imageOrientation === 'vertical' ? 'aspect-[9/16] w-[60%]' : 'aspect-video w-full'"
            >
              Sin imagen
            </div>
          </div>

          <div>
            <input ref="imageInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onImageSelected" />
            <div class="flex gap-2">
              <button type="button" @click="imageInput?.click()" :disabled="isUploading" class="flex-1 px-4 py-3 bg-[#0C2619] text-white text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-[#143c28] transition-colors disabled:opacity-60">
                {{ isUploading ? 'Procesando...' : (form.image ? 'Cambiar imagen' : 'Subir imagen') }}
              </button>
              <button v-if="form.image && form.image.startsWith('data:')" type="button" @click="form.image = savedImage" class="px-4 py-3 border border-gray-200 text-gray-500 text-xs font-bold uppercase rounded-lg hover:bg-gray-50">Descartar</button>
            </div>
            <p class="text-[10px] text-gray-500 mt-2">JPG, PNG o WebP (máx. 5 MB tras optimizar). Se guarda en Wellezy Hub al presionar «Guardar».</p>
          </div>
        </div>

        <!-- Galería -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <div class="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
            <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase">Galería</h3>
            <button type="button" @click="galleryInput?.click()" :disabled="isUploading" class="text-xs font-bold text-[#D3A76A] hover:text-[#b38b55]">+ Agregar</button>
            <input ref="galleryInput" type="file" multiple accept="image/png,image/jpeg,image/webp" class="hidden" @change="onGallerySelected" />
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div v-for="asset in visibleGalleryAssets" :key="asset.id" class="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
              <img :src="asset.url" alt="Galería" class="w-full h-full object-cover" />
              <button type="button" @click="removeGalleryAsset(asset.id)" class="absolute top-1 right-1 bg-white/90 hover:bg-white text-gray-600 hover:text-red-600 rounded-full w-6 h-6 text-xs font-bold" title="Quitar">×</button>
            </div>
            <div v-for="(url, index) in form.galleryUploads" :key="'new-' + index" class="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-[#D3A76A]">
              <img :src="url" alt="Nueva" class="w-full h-full object-cover" />
              <button type="button" @click="form.galleryUploads.splice(index, 1)" class="absolute top-1 right-1 bg-white/90 hover:bg-white text-gray-600 hover:text-red-600 rounded-full w-6 h-6 text-xs font-bold" title="Quitar">×</button>
            </div>
          </div>
          <p v-if="visibleGalleryAssets.length === 0 && form.galleryUploads.length === 0" class="text-xs text-gray-400 text-center italic">No hay imágenes en la galería</p>
          <p v-else-if="form.galleryUploads.length" class="text-[10px] text-gray-500 mt-3">Las imágenes con borde punteado se subirán al guardar.</p>
        </div>

        <!-- SEO -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">SEO</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Meta Title</label>
              <input :value="metaTitle" readonly type="text" class="w-full px-4 py-3 bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-sm cursor-not-allowed" placeholder="Se genera con el nombre" />
              <p class="text-[10px] text-gray-500 mt-1">Automático: «Nombre del procedimiento | Planmed».</p>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Meta Description</label>
              <textarea v-model="form.seo.meta_description" rows="3" maxlength="200" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent text-sm resize-none" placeholder="Descripción para buscadores"></textarea>
              <p class="text-[10px] mt-1" :class="form.seo.meta_description.length > 160 ? 'text-amber-600' : 'text-gray-500'">{{ form.seo.meta_description.length }}/160 recomendados (máx. 200)</p>
            </div>
          </div>
        </div>
        </fieldset>

      </div>
    </form>

    <!-- Secciones de contenido de la línea (debajo del contenido del procedimiento en la web). Fuera del formulario: tiene los suyos y también aplica a maestros. -->
    <AdminProceduresSectionsManager
      v-if="!isNew && procedureId"
      :key="procedureId"
      class="mt-8"
      :procedure-id="procedureId"
      :is-master="form.isMaster"
      :can-write="!form.isMaster || savedActivo"
    />
  </div>
</template>

<script setup lang="ts">
const notify = useNotify()
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter, useHead } from '#imports'
import { procedureService } from '~/services/ProcedureService'
import type { Procedure } from '~/types/procedure'
import { slugify, isRichHtmlEmpty } from '~/utils/richText'
import { fileToOptimizedDataUrl } from '~/utils/imageFile'

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
const isUploading = ref(false)
const imageInput = ref<HTMLInputElement | null>(null)
const galleryInput = ref<HTMLInputElement | null>(null)
// URL de la imagen ya guardada en Hub (para poder descartar una imagen nueva sin subir).
const savedImage = ref('')

// El slug se autogenera desde el nombre hasta que el administrador lo edita a mano.
// Los procedimientos existentes arrancan como "manuales": renombrar nunca cambia su URL por sorpresa.
const slugTouched = ref(!isNew)
// Id numérico de Hub y estado guardado (no el del checkbox sin guardar): las secciones de un maestro solo se editan si está habilitado en la línea.
const procedureId = ref(0)
const savedActivo = ref(false)

function onSlugInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  form.value.slug = slugify(value)
  // Vaciar el campo devuelve el control al modo automático.
  slugTouched.value = value.trim() !== ''
  if (!slugTouched.value) form.value.slug = slugify(form.value.name)
}

function resetSlugToAuto() {
  slugTouched.value = false
  form.value.slug = slugify(form.value.name)
}

// Meta Title siempre derivado del nombre.
const metaTitle = computed(() => form.value.name.trim() ? `${form.value.name.trim()} | Planmed` : '')

// Form state
const form = ref({
  name: '',
  slug: '',
  category: '',
  shortDescription: '',
  whatIsIt: '',
  image: '',
  imageOrientation: 'vertical' as 'vertical' | 'horizontal',
  activo: true,
  isMaster: false,
  destacado: false,
  galeriaAssets: [] as Array<{ id: number, url: string }>,
  galleryUploads: [] as string[],
  galleryRemovals: [] as number[],
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

watch(() => form.value.name, (name) => {
  if (!slugTouched.value) form.value.slug = slugify(name)
})

onMounted(async () => {
  if (!isNew) {
    const data = await procedureService.getProcedureBySlug(slugParam)
    if (data) {
      // Map to form
      form.value.name = data.name || ''
      form.value.slug = data.slug || ''
      form.value.category = data.category || ''
      form.value.shortDescription = data.shortDescription || ''
      form.value.whatIsIt = data.whatIsIt || ''
      form.value.image = data.image || ''
      form.value.imageOrientation = data.imageOrientation === 'horizontal' ? 'horizontal' : 'vertical'
      savedImage.value = data.image || ''
      form.value.activo = data.activo !== false
      procedureId.value = Number(data.id) || 0
      savedActivo.value = data.activo !== false
      form.value.isMaster = data.isMaster === true
      form.value.destacado = data.destacado || false
      form.value.galeriaAssets = data.galeriaAssets ?? []

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

// Maestro (contenido global del Hub): solo estado y destacado.
const readOnly = computed(() => form.value.isMaster)

const visibleGalleryAssets = computed(() => form.value.galeriaAssets.filter(a => !form.value.galleryRemovals.includes(a.id)))

function removeGalleryAsset(id: number) {
  form.value.galleryRemovals.push(id)
}

async function readImage(file: File): Promise<string | null> {
  if (file.size > 10 * 1024 * 1024) {
    notify.error('La imagen no puede superar los 10 MB.')
    return null
  }
  try {
    return await fileToOptimizedDataUrl(file, 1600, 0.82)
  } catch (err) {
    notify.error((err as Error).message)
    return null
  }
}

async function onImageSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  isUploading.value = true
  const dataUrl = await readImage(file)
  if (dataUrl) form.value.image = dataUrl
  isUploading.value = false
  input.value = ''
}

async function onGallerySelected(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (!files.length) return
  isUploading.value = true
  for (const file of files) {
    if (form.value.galleryUploads.length >= 10) break
    const dataUrl = await readImage(file)
    if (dataUrl) form.value.galleryUploads.push(dataUrl)
  }
  isUploading.value = false
  input.value = ''
}

async function submitForm() {
  if (!readOnly.value && isRichHtmlEmpty(form.value.whatIsIt)) {
    notify.error('Completa la descripción detallada (¿Qué es?).', 'Falta información')
    return
  }
  if (!readOnly.value && !form.value.slug) {
    notify.error('El slug no puede estar vacío.', 'Falta información')
    return
  }
  isSubmitting.value = true
  try {
    // Maestro: Hub solo acepta habilitar/deshabilitar y destacar (el contenido global no se envía).
    const payload: Partial<Procedure> = readOnly.value
      ? { activo: form.value.activo, destacado: form.value.destacado, imageOrientation: form.value.imageOrientation }
      : {
        name: form.value.name,
        slug: form.value.slug,
        category: form.value.category,
        shortDescription: form.value.shortDescription,
        whatIsIt: form.value.whatIsIt,
        // Solo una imagen nueva (data URL) viaja a Hub; la ya guardada se conserva.
        image: form.value.image.startsWith('data:') ? form.value.image : undefined,
        activo: form.value.activo,
        destacado: form.value.destacado,
        imageOrientation: form.value.imageOrientation,
        galleryUploads: form.value.galleryUploads,
        galleryRemovals: form.value.galleryRemovals,
        ficha_tecnica: { ...form.value.ficha_tecnica },
        perfil_paciente: {
          ...form.value.perfil_paciente,
          edad_minima: form.value.perfil_paciente.edad_minima || null,
          edad_maxima: form.value.perfil_paciente.edad_maxima || null,
          imc_maximo: form.value.perfil_paciente.imc_maximo || null
        },
        seo: { meta_title: metaTitle.value, meta_description: form.value.seo.meta_description.trim() }
      }

    if (isNew) {
      await procedureService.createProcedure(payload as Omit<Procedure, 'id' | 'slug'> & { slug?: string })
    } else {
      await procedureService.updateProcedure(slugParam, payload)
    }

    router.push('/admin/procedimientos')
  } catch (error) {
    notify.error((error as Error).message || 'Ocurrió un error al guardar.')
  } finally {
    isSubmitting.value = false
  }
}
</script>
<template>
  <div class="pb-24">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <NuxtLink to="/admin/micrositios" class="text-[11px] font-bold tracking-[0.15em] text-[#848484] hover:text-[#0C2619] uppercase flex items-center gap-2 mb-4 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Volver a Micrositios
        </NuxtLink>
        <h2 class="text-3xl font-serif text-[#0C2619] mb-1 uppercase">{{ isNew ? 'Nuevo Micrositio' : 'Editar Micrositio' }}</h2>
        <p class="text-gray-500 font-light">{{ isNew ? 'Crea el micrositio de un referidor (PRP).' : 'Modifica los datos de este micrositio.' }}</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="submitForm"
          :disabled="isSubmitting || isLoading"
          class="bg-[#0C2619] hover:bg-[#153a28] text-white px-8 py-3 rounded-lg font-bold text-xs tracking-widest uppercase transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg"
        >
          <span v-if="isSubmitting">Guardando...</span>
          <span v-else>Guardar Cambios</span>
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center text-gray-500">
      Cargando micrositio...
    </div>

    <form v-else @submit.prevent="submitForm" class="grid grid-cols-1 lg:grid-cols-3 gap-8">

      <!-- Columna Principal -->
      <div class="lg:col-span-2 space-y-6">
        <div v-if="generalError" class="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 text-sm">
          {{ generalError }}
        </div>

        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Información del PRP</h3>

          <div class="space-y-6">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nombre *</label>
              <input v-model="form.name" required maxlength="255" type="text" :class="inputClass(errors.name)" placeholder="Ej: Shirley Cristina Rendón" />
              <p v-if="errors.name" class="text-red-500 text-xs mt-1">{{ errors.name }}</p>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Código PRP *</label>
              <input v-model="form.externalCode" required maxlength="50" type="text" :class="[inputClass(errors.externalCode), 'font-mono uppercase']" placeholder="Ej: Y350" />
              <p v-if="errors.externalCode" class="text-red-500 text-xs mt-1">{{ errors.externalCode }}</p>
              <p v-else class="text-[10px] text-gray-500 mt-2">Es el código del PRP en el CRM médico. Se envía con cada formulario para atribuir el lead.</p>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Slug (URL pública)</label>
              <input v-model="form.slug" maxlength="255" type="text" :class="[inputClass(errors.slug), 'font-mono']" :placeholder="isNew ? 'Se genera a partir del nombre' : ''" @input="slugTouched = true" />
              <p v-if="errors.slug" class="text-red-500 text-xs mt-1">{{ errors.slug }}</p>
              <p v-else-if="!isNew" class="text-[10px] text-amber-700 mt-2">Si cambias el slug, el enlace que ya se haya compartido dejará de funcionar.</p>
              <p v-else class="text-[10px] text-gray-500 mt-2">Solo minúsculas, números y guiones. Si lo dejas vacío se genera automáticamente.</p>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Título</label>
              <input v-model="form.title" maxlength="150" type="text" :class="inputClass(errors.title)" placeholder="Ej: AGENDA TU VALORACION" />
              <p v-if="errors.title" class="text-red-500 text-xs mt-1">{{ errors.title }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna Secundaria -->
      <div class="space-y-6">
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Visibilidad</h3>
          <label class="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#0C2619] transition-colors">
            <input v-model="form.isActive" type="checkbox" class="w-5 h-5 text-[#D3A76A] focus:ring-[#D3A76A] border-gray-300 rounded" />
            <span class="text-sm font-bold text-gray-900">Micrositio activo</span>
          </label>
          <p class="text-[10px] text-gray-500 mt-3">Un micrositio inactivo no está disponible públicamente.</p>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Enlace público</h3>
          <div v-if="previewSlug" class="flex items-center gap-2">
            <span class="flex-grow text-xs text-gray-700 font-mono break-all bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">{{ prpService.publicPath(previewSlug) }}</span>
            <button type="button" @click="copyLink" class="p-2 text-gray-400 hover:text-[#0C2619] transition-colors bg-gray-50 hover:bg-gray-100 rounded-lg shrink-0" title="Copiar enlace">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </button>
          </div>
          <p v-else class="text-xs text-gray-400 italic">Escribe el nombre para ver el enlace.</p>
          <p v-if="isNew && !slugTouched" class="text-[10px] text-gray-500 mt-3">Vista previa: el slug definitivo lo confirma el sistema al guardar.</p>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useRoute, useRouter, useHead } from '#imports'
import { prpService } from '~/services/PrpService'
import { PrpError, type PrpFieldErrors } from '~/types/prp'

const notify = useNotify()

useHead({
  title: 'Editor de Micrositios | Admin Planmed'
})
definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const router = useRouter()
const idParam = route.params.id as string
const isNew = idParam === 'nuevo'

const isLoading = ref(!isNew)
const isSubmitting = ref(false)
const generalError = ref('')
const errors = reactive<PrpFieldErrors>({})
const slugTouched = ref(false)

const form = ref({
  name: '',
  externalCode: '',
  slug: '',
  title: '',
  isActive: true
})

function inputClass(error?: string) {
  return [
    'w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent',
    error ? 'border-red-500' : 'border-gray-200'
  ]
}

// Misma regla que el backend: minúsculas, números y guiones.
function slugify(value: string): string {
  return value
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Al crear, el slug sigue al nombre mientras la persona no lo edite manualmente.
watch(() => form.value.name, (name) => {
  if (isNew && !slugTouched.value) form.value.slug = slugify(name)
})

const previewSlug = computed(() => form.value.slug.trim() || (isNew ? slugify(form.value.name) : ''))

onMounted(async () => {
  if (isNew) return
  const id = Number(idParam)
  try {
    const data = Number.isSafeInteger(id) ? await prpService.getPrpById(id) : null
    if (!data) {
      notify.error('El micrositio no existe.')
      router.push('/admin/micrositios')
      return
    }
    form.value = {
      name: data.name,
      externalCode: data.externalCode,
      slug: data.slug,
      title: data.title || '',
      isActive: data.isActive
    }
  } catch (e: any) {
    generalError.value = e.message
  } finally {
    isLoading.value = false
  }
})

async function copyLink() {
  const url = `${window.location.origin}${prpService.publicPath(previewSlug.value)}`
  try {
    await navigator.clipboard.writeText(url)
    notify.success('Enlace copiado')
  } catch {
    notify.error(`No se pudo copiar el enlace automáticamente. Cópialo manualmente: ${url}`)
  }
}

async function submitForm() {
  generalError.value = ''
  for (const key of Object.keys(errors)) delete errors[key as keyof PrpFieldErrors]

  if (!form.value.name.trim() || !form.value.externalCode.trim()) {
    generalError.value = 'El nombre y el código PRP son obligatorios.'
    return
  }

  isSubmitting.value = true
  try {
    const payload = {
      name: form.value.name,
      externalCode: form.value.externalCode,
      title: form.value.title,
      isActive: form.value.isActive
    }

    if (isNew) {
      // Slug vacío o sin editar: lo genera el backend (y resuelve colisiones).
      await prpService.createPrp({ ...payload, slug: slugTouched.value && form.value.slug.trim() ? form.value.slug : undefined })
    } else {
      await prpService.updatePrp(Number(idParam), { ...payload, slug: form.value.slug })
    }

    notify.success(isNew ? 'Micrositio creado' : 'Micrositio actualizado')
    router.push('/admin/micrositios')
  } catch (e: any) {
    if (e instanceof PrpError && Object.keys(e.fieldErrors).length) Object.assign(errors, e.fieldErrors)
    generalError.value = e.message || 'Ocurrió un error al guardar.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

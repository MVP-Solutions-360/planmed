<template>
  <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8" data-testid="procedure-sections">
    <div class="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4 mb-6">
      <div>
        <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase">Secciones de contenido</h3>
        <p class="text-xs text-gray-500 mt-1 max-w-2xl">
          Se muestran en la web de tu línea <strong>debajo</strong> del contenido del procedimiento, en el orden de esta lista.
          <template v-if="isMaster"> Son solo de Planmed: no modifican el procedimiento maestro ni las secciones de otras líneas.</template>
        </p>
      </div>
      <button v-if="!editing && canWrite" type="button" class="bg-[#0C2619] hover:bg-[#153a28] text-white px-5 py-2.5 rounded-lg font-bold text-[11px] tracking-widest uppercase" data-testid="add-section" @click="startCreate">
        + Agregar sección
      </button>
    </div>

    <p v-if="!canWrite" class="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3" data-testid="sections-readonly">
      Habilita este procedimiento en tu línea (activo) para editar sus secciones. Mientras esté deshabilitado se conservan, pero no se publican.
    </p>

    <div v-if="loadError" class="mb-4">
      <AdminRecommendationsTreeNotice :error="loadError" :dismissible="false" title="No se pudieron cargar las secciones" />
      <button type="button" class="mt-2 text-xs font-bold tracking-widest uppercase underline" @click="load">Reintentar</button>
    </div>
    <p v-else-if="loading" class="text-sm text-gray-400">Cargando...</p>

    <template v-else>
      <p v-if="!sections.length && !editing" class="text-sm text-gray-500 italic" data-testid="sections-empty">Este procedimiento aún no tiene secciones en tu línea.</p>

      <ul v-if="sections.length" class="space-y-3 mb-6">
        <li v-for="(s, i) in sections" :key="s.id" class="flex items-center gap-4 border border-gray-200 rounded-lg p-3" :class="{ 'opacity-60': !s.visible }" data-testid="section-row">
          <div class="w-16 h-12 rounded bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-[10px] text-gray-400">
            <img v-if="s.image_url" :src="s.image_url" alt="" class="w-full h-full object-cover">
            <span v-else>Sin imagen</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-gray-900 truncate">{{ s.title || 'Sin título' }}</p>
            <p class="text-[11px] text-gray-500">
              {{ s.image_url ? (s.layout === 'media_right' ? 'Imagen a la derecha' : 'Imagen a la izquierda') : 'Solo texto' }}
              <span v-if="!s.visible" class="ml-2 font-bold uppercase text-amber-700">Oculta</span>
            </p>
          </div>
          <div v-if="canWrite" class="flex items-center gap-1 shrink-0">
            <button type="button" class="icon-btn" :disabled="i === 0 || action.busy.value" aria-label="Subir sección" @click="move(i, -1)">↑</button>
            <button type="button" class="icon-btn" :disabled="i === sections.length - 1 || action.busy.value" aria-label="Bajar sección" @click="move(i, 1)">↓</button>
            <button type="button" class="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest border border-gray-200 rounded hover:border-[#0C2619]" @click="startEdit(s)">Editar</button>
            <button type="button" class="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-red-700 border border-red-100 rounded hover:bg-red-50" :disabled="action.busy.value" @click="remove(s)">Eliminar</button>
          </div>
        </li>
      </ul>

      <form v-if="editing" class="space-y-5 border border-gray-200 rounded-xl p-5 bg-gray-50/50" data-testid="section-form" @submit.prevent="submit">
        <p class="text-xs font-bold tracking-widest uppercase text-[#0C2619]">{{ editing === 'new' ? 'Nueva sección' : 'Editar sección' }}</p>

        <div>
          <label class="label" for="ps-title">Título (opcional)</label>
          <input id="ps-title" v-model="draft.title" type="text" class="field" maxlength="255" placeholder="Ej. ¿Cómo es la recuperación?">
          <p v-if="fieldError('title')" class="err">{{ fieldError('title') }}</p>
        </div>

        <div>
          <label class="label">Contenido</label>
          <AdminRichTextEditor :key="`content-${editorKey}`" v-model="draft.content" min-height="12rem" placeholder="Escribe aquí el contenido de la sección..." />
          <p v-if="fieldError('content')" class="err">{{ fieldError('content') }}</p>
        </div>

        <div>
          <label class="label">Imagen (opcional)</label>
          <div class="flex flex-wrap items-start gap-4">
            <label class="block w-44 aspect-[4/3] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-[#0C2619] bg-white relative">
              <img v-if="imageSrc" :src="imageSrc" alt="Imagen de la sección" class="w-full h-full object-contain">
              <span v-else class="absolute inset-0 flex items-center justify-center text-xs text-gray-400 text-center px-3">Haz clic para subir</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onImage">
            </label>
            <button v-if="imageSrc" type="button" class="text-xs font-bold text-gray-400 hover:text-red-600 uppercase tracking-wider" @click="clearImage">Quitar imagen</button>
          </div>
          <p v-if="fieldError('image')" class="err">{{ fieldError('image') }}</p>
        </div>

        <fieldset v-if="imageSrc" class="border-0 p-0 m-0" data-testid="layout-choice">
          <legend class="label">Posición de la imagen</legend>
          <div class="flex flex-wrap gap-3">
            <label class="radio"><input v-model="draft.layout" type="radio" name="ps-layout" value="media_left"> A la izquierda</label>
            <label class="radio"><input v-model="draft.layout" type="radio" name="ps-layout" value="media_right"> A la derecha</label>
          </div>
          <p v-if="fieldError('layout')" class="err">{{ fieldError('layout') }}</p>
        </fieldset>

        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input v-model="draft.visible" type="checkbox" class="h-4 w-4 accent-[#0C2619]"> Publicar esta sección en la web
        </label>

        <AdminRecommendationsTreeNotice :error="action.error.value" :hide-fields="['title', 'content', 'image', 'layout']" title="No se pudo guardar la sección" @dismiss="action.clear" />

        <div class="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <button type="button" class="text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-gray-800" @click="cancel">Cancelar</button>
          <button type="submit" :disabled="action.busy.value" class="bg-[#0C2619] hover:bg-[#153a28] text-white px-6 py-2.5 rounded-lg font-bold text-xs tracking-widest uppercase disabled:opacity-50" data-testid="save-section">
            {{ action.busy.value ? 'Guardando...' : 'Guardar sección' }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { describeTreeError, type TreeErrorInfo } from '#shared/utils/recommendationAdminApi'
import { procedureSectionsAdmin as api } from '~/providers/HubProcedureSectionsProvider'
import { fileToOptimizedDataUrl } from '~/utils/imageFile'
import { isRichHtmlEmpty } from '~/utils/richText'
import type { ProcedureSectionAdmin, ProcedureSectionInput } from '~/types/procedureSection'

// Administra las secciones de UN procedimiento para la línea del usuario. Hub aplica el permiso `cirugia_secciones.*` y el aislamiento por
// línea; aquí solo se ocultan acciones que Hub rechazaría (maestro deshabilitado). Una sección sin título, contenido ni imagen la rechaza Hub.
const props = defineProps<{ procedureId: number, isMaster: boolean, canWrite: boolean }>()

const notify = useNotify()
const action = useTreeAction()

const sections = ref<ProcedureSectionAdmin[]>([])
const loading = ref(true)
const loadError = ref<TreeErrorInfo | null>(null)
const editing = ref<null | 'new' | number>(null)
const editorKey = ref(0)
const clientErrors = reactive<Record<string, string>>({})

const draft = reactive({
  title: '', content: '', layout: 'media_left' as 'media_left' | 'media_right', visible: true,
  /** Imagen elegida y aún no enviada (data URL). */
  newImage: '',
  /** Imagen guardada que se quitará al guardar. */
  removeImage: false
})
const current = computed(() => (typeof editing.value === 'number' ? sections.value.find(s => s.id === editing.value) ?? null : null))
const imageSrc = computed(() => draft.newImage || (!draft.removeImage ? current.value?.image_url ?? '' : ''))
const fieldError = (name: string) => clientErrors[name] ?? action.error.value?.fields[name] ?? null

async function load() {
  loading.value = true
  loadError.value = null
  try {
    sections.value = await api.list(props.procedureId)
  } catch (e) {
    const info = describeTreeError(e)
    // Un maestro que la línea aún no tiene habilitado no tiene secciones que listar (Hub responde 404): no es un fallo.
    if (info.kind === 'notfound' && !props.canWrite) sections.value = []
    else loadError.value = info
  } finally {
    loading.value = false
  }
}

function fill(s: ProcedureSectionAdmin | null) {
  draft.title = s?.title ?? ''
  draft.content = s?.content ?? ''
  draft.layout = s?.layout ?? 'media_left'
  draft.visible = s?.visible ?? true
  draft.newImage = ''
  draft.removeImage = false
  editorKey.value++
  action.clear()
  for (const key of Object.keys(clientErrors)) delete clientErrors[key]
}

function startCreate() { fill(null); editing.value = 'new' }
function startEdit(s: ProcedureSectionAdmin) { fill(s); editing.value = s.id }
function cancel() { editing.value = null; fill(null) }

async function onImage(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > 10 * 1024 * 1024) return void notify.error('La imagen no puede superar los 10 MB.')
  try {
    draft.newImage = await fileToOptimizedDataUrl(file)
    draft.removeImage = false
  } catch (err: any) {
    void notify.error(err.message)
  }
}

function clearImage() {
  draft.newImage = ''
  draft.removeImage = !!current.value?.image_url
}

function buildInput(): ProcedureSectionInput {
  return {
    title: draft.title.trim() === '' ? null : draft.title.trim(),
    content: isRichHtmlEmpty(draft.content) ? null : draft.content,
    layout: draft.layout,
    visible: draft.visible
  }
}

async function submit() {
  for (const key of Object.keys(clientErrors)) delete clientErrors[key]
  const input = buildInput()
  if (!input.title && !input.content && !imageSrc.value) {
    clientErrors.content = 'Escribe un título, un contenido o agrega una imagen.'
    return
  }

  const target = editing.value
  const res = await action.run(async () => {
    if (typeof target === 'number') {
      if (draft.removeImage && current.value?.image_url) await api.removeImage(target)
      // Sin título ni contenido, la imagen es lo único que queda: se sube primero para que Hub acepte el guardado.
      if (draft.newImage && !input.title && !input.content) await api.setImage(target, draft.newImage)
      let saved = await api.update(target, input)
      if (draft.newImage && (input.title || input.content)) saved = await api.setImage(target, draft.newImage)
      return saved
    }
    const created = await api.create(props.procedureId, input)
    if (draft.newImage) {
      try { return await api.setImage(created.id, draft.newImage) } catch { void notify.warning('La sección se creó, pero la imagen no se pudo subir. Vuelve a intentarlo al editarla.') }
    }
    return created
  })
  if (!res.ok) return

  void notify.success(typeof target === 'number' ? 'Sección guardada.' : 'Sección creada.')
  editing.value = null
  await load()
}

async function remove(s: ProcedureSectionAdmin) {
  if (!window.confirm(`¿Eliminar la sección «${s.title || 'Sin título'}»? Esta acción no se puede deshacer.`)) return
  const res = await action.run(() => api.remove(s.id))
  if (!res.ok) return void notify.error(action.error.value?.message ?? 'No se pudo eliminar la sección.')
  void notify.success('Sección eliminada.')
  await load()
}

async function move(index: number, delta: -1 | 1) {
  const next = [...sections.value]
  const target = index + delta
  if (target < 0 || target >= next.length) return
  ;[next[index], next[target]] = [next[target]!, next[index]!]
  const res = await action.run(() => api.reorder(props.procedureId, next.map(s => s.id)))
  if (!res.ok) return void notify.error(action.error.value?.message ?? 'No se pudo cambiar el orden.')
  sections.value = next
}

onMounted(load)
</script>

<style scoped>
.label { display: block; font-size: .7rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: #374151; margin-bottom: .4rem; }
.field { width: 100%; padding: .65rem .9rem; border: 1px solid #e5e7eb; border-radius: .5rem; background: #fff; font-size: .875rem; }
.field:focus { outline: none; box-shadow: 0 0 0 2px #0C2619; border-color: transparent; }
.err { margin-top: .35rem; font-size: .75rem; color: #b91c1c; }
.icon-btn { width: 2rem; height: 2rem; border: 1px solid #e5e7eb; border-radius: .375rem; font-weight: 700; }
.icon-btn:hover:not(:disabled) { border-color: #0C2619; }
.icon-btn:disabled { opacity: .35; }
.radio { display: inline-flex; align-items: center; gap: .5rem; padding: .6rem .9rem; border: 1px solid #e5e7eb; border-radius: .5rem; background: #fff; font-size: .875rem; font-weight: 600; cursor: pointer; }
</style>

<template>
  <div>
    <div v-if="!ready" class="text-gray-400 text-sm" data-testid="loading">Cargando...</div>

    <div v-else-if="loadError" class="mb-6">
      <AdminRecommendationsTreeNotice :error="loadError" :dismissible="false" :title="loadError.kind === 'notfound' ? 'La sección no existe' : 'No se pudo cargar la sección'" />
      <button v-if="loadError.kind !== 'notfound'" type="button" class="mt-3 text-xs font-bold tracking-widest uppercase underline" @click="init">Reintentar</button>
    </div>

    <form v-else class="space-y-6" data-testid="section-form" @submit.prevent="submit">
      <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <label class="label" for="sec-type">Tipo de sección *</label>
          <select id="sec-type" v-model="draft.type" class="field" :aria-invalid="!!fieldError('type')">
            <option v-for="t in catalog.types" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
          <p v-if="fieldError('type')" class="err">{{ fieldError('type') }}</p>
        </div>

        <div>
          <label class="label" for="sec-title">Título de la sección *</label>
          <input id="sec-title" v-model="draft.title" type="text" class="field" maxlength="255" placeholder="Ej. Recomendaciones" :aria-invalid="!!fieldError('title')">
          <p v-if="fieldError('title')" class="err">{{ fieldError('title') }}</p>
        </div>

        <div v-if="allows('subtitle')">
          <label class="label" for="sec-subtitle">Subtítulo (opcional)</label>
          <input id="sec-subtitle" v-model="draft.subtitle" type="text" class="field" maxlength="255" placeholder="Ej. Cuidados antes de tu procedimiento" :aria-invalid="!!fieldError('subtitle')">
          <p v-if="fieldError('subtitle')" class="err">{{ fieldError('subtitle') }}</p>
        </div>

        <div v-if="allows('content')">
          <label class="label">{{ draft.type === 'recommendations' ? 'Texto de la sección (opcional)' : 'Texto' }}</label>
          <AdminRichTextEditor :key="`content-${editorKey}`" v-model="draft.content" min-height="14rem" placeholder="Escribe aquí la descripción o el contenido de la sección..." />
          <p v-if="fieldError('content')" class="err">{{ fieldError('content') }}</p>
          <p v-if="draft.type === 'recommendations'" class="hint">Este texto es independiente de las recomendaciones individuales de abajo: no se convierten entre sí ni se duplican.</p>
        </div>

        <div v-if="allows('video')">
          <label class="label" for="sec-video">Vídeo de YouTube (opcional)</label>
          <input id="sec-video" v-model="draft.video_url" type="url" class="field" placeholder="https://www.youtube.com/watch?v=..." :aria-invalid="!!fieldError('video_url')">
          <p v-if="fieldError('video_url')" class="err">{{ fieldError('video_url') }}</p>
        </div>

        <div v-if="allows('image')">
          <label class="label">Imagen (opcional)</label>
          <div class="flex flex-wrap items-start gap-4">
            <label class="block w-40 aspect-[4/3] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-[#0C2619] bg-gray-50 relative">
              <img v-if="imageSrc" :src="imageSrc" alt="Imagen de la sección" class="w-full h-full object-cover">
              <span v-else class="absolute inset-0 flex items-center justify-center text-xs text-gray-400 text-center px-3">Haz clic para subir</span>
              <input type="file" accept="image/*" class="hidden" @change="onImage">
            </label>
            <button v-if="imageSrc" type="button" class="text-xs font-bold text-gray-400 hover:text-red-600 uppercase tracking-wider" @click="clearImage">Quitar imagen</button>
          </div>
          <p v-if="fieldError('image')" class="err">{{ fieldError('image') }}</p>
          <div v-if="imageSrc" class="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label class="label" for="sec-alt">Texto alternativo</label>
              <input id="sec-alt" v-model="draft.image_alt" type="text" class="field" maxlength="255">
              <p v-if="fieldError('image_alt')" class="err">{{ fieldError('image_alt') }}</p>
            </div>
          </div>
        </div>

        <div v-if="allows('layout')">
          <label class="label" for="sec-layout">Distribución</label>
          <select id="sec-layout" v-model="draft.layout" class="field">
            <option v-for="l in catalog.layouts" :key="l.value" :value="l.value">{{ l.label }}</option>
          </select>
          <p v-if="fieldError('layout')" class="err">{{ fieldError('layout') }}</p>
        </div>

        <fieldset v-if="allows('cta')" class="rounded-lg border border-gray-200 p-4 space-y-4" data-testid="cta">
          <legend class="px-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Botón de acción (opcional)</legend>
          <p class="hint">Déjalo vacío si la sección no lleva botón. Si lo usas, completa el texto y el destino.</p>
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="label" for="sec-cta-label">Texto del botón</label>
              <input id="sec-cta-label" v-model="draft.cta_label" type="text" class="field" maxlength="120" :aria-invalid="!!ctaError('cta_label')">
              <p v-if="ctaError('cta_label')" class="err" data-testid="cta-label-error">{{ ctaError('cta_label') }}</p>
            </div>
            <div>
              <label class="label" for="sec-cta-url">Destino del botón</label>
              <input id="sec-cta-url" v-model="draft.cta_url" type="text" class="field" maxlength="2048" placeholder="https://..." :aria-invalid="!!ctaError('cta_url')">
              <p v-if="ctaError('cta_url')" class="err" data-testid="cta-url-error">{{ ctaError('cta_url') }}</p>
            </div>
          </div>
        </fieldset>

        <!-- Contenido que el tipo elegido no admite: nunca se descarta en silencio -->
        <div v-if="incompatible.length" class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-3" data-testid="incompatible">
          <p class="font-semibold">Este contenido no es compatible con el tipo «{{ currentTypeLabel }}».</p>
          <p class="text-xs">No se borra por sí solo: vacíalo aquí o vuelve a elegir un tipo que lo admita.</p>
          <ul class="space-y-2">
            <li v-for="f in incompatible" :key="f.key" class="flex flex-wrap items-start justify-between gap-2 rounded border border-amber-200 bg-white px-3 py-2">
              <span class="min-w-0 text-xs"><strong>{{ f.label }}</strong><span v-if="fieldError(f.key)" class="block text-red-700">{{ fieldError(f.key) }}</span></span>
              <button type="button" class="text-[11px] font-bold uppercase tracking-widest underline" @click="f.clear()">Vaciar</button>
            </li>
          </ul>
        </div>

        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input v-model="draft.visible" type="checkbox" class="h-4 w-4 accent-[#0C2619]"> Sección visible en la página
        </label>

        <AdminRecommendationsTreeNotice :error="action.error.value" :hide-fields="shownFields" :title="action.error.value?.kind === 'conflict' ? 'No se puede completar la acción' : 'No se pudo guardar la sección'" @dismiss="action.clear" />

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-100 pt-5">
          <NuxtLink :to="backUrl" class="text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-gray-800">← Volver al subtema</NuxtLink>
          <button type="submit" :disabled="action.busy.value" class="bg-[#0C2619] hover:bg-[#153a28] text-white px-6 py-3 rounded-lg font-bold text-xs tracking-widest uppercase transition-colors disabled:opacity-50 shadow-lg w-full sm:w-auto" data-testid="save-section">
            {{ action.busy.value ? 'Guardando...' : sectionId ? 'Guardar sección' : 'Crear sección' }}
          </button>
        </div>
      </div>

    </form>

    <!-- Fuera del formulario de la sección: tiene sus propios formularios (no se anidan). -->
    <div v-if="ready && !loadError && sectionId" class="mt-6">
      <AdminRecommendationsTreeItems v-if="section && section.type === 'recommendations'" :section-id="sectionId" @changed="$emit('changed')" />
      <p v-else-if="draft.type === 'recommendations'" class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">Guarda el cambio de tipo para poder administrar las recomendaciones individuales de esta sección.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { describeTreeError, type TreeErrorInfo } from '#shared/utils/recommendationAdminApi'
import { recommendationTreeAdmin as api } from '~/providers/HubRecommendationTreeAdminProvider'
import { fileToOptimizedDataUrl } from '~/utils/imageFile'
import { isRichHtmlEmpty } from '~/utils/richText'
import type { SectionField, SectionInput, SectionTypesCatalog, TreeSection } from '~/types/recommendationTree'

const props = defineProps<{ subtopicId: number, topicId: number, sectionId?: number }>()
defineEmits<{ changed: [] }>()

const notify = useNotify()
const action = useTreeAction()

const catalog = ref<SectionTypesCatalog>({ types: [], layouts: [] })
const section = ref<TreeSection | null>(null)
const ready = ref(false)
const loadError = ref<TreeErrorInfo | null>(null)
const editorKey = ref(0)
const clientErrors = reactive<Record<string, string>>({})

const draft = reactive({
  type: 'description', title: '', subtitle: '', content: '', layout: 'stacked', image_alt: '', video_url: '',
  cta_label: '', cta_url: '', visible: true,
  /** Imagen elegida y aún no enviada (data URL). */
  newImage: '' as string,
  /** Imagen guardada en Hub que se quitará al guardar. */
  removeImage: false
})

const backUrl = computed(() => `/admin/recomendaciones/temas/${props.topicId}/subtemas/${props.subtopicId}`)
const allows = (field: SectionField) => catalog.value.types.find(t => t.value === draft.type)?.fields.includes(field) ?? false
const currentTypeLabel = computed(() => catalog.value.types.find(t => t.value === draft.type)?.label ?? draft.type)
const fieldError = (name: string) => clientErrors[name] ?? action.error.value?.fields[name] ?? null
const ctaError = (name: string) => fieldError(name)

const imageSrc = computed(() => draft.newImage || (!draft.removeImage ? section.value?.image_url ?? '' : ''))

const hasText = (v: string) => v.trim() !== ''

// Campos con contenido que el tipo elegido NO admite (se muestran para poder vaciarlos de forma explícita).
const incompatible = computed(() => {
  const list: { key: string, label: string, clear: () => void }[] = []
  if (!allows('subtitle') && hasText(draft.subtitle)) list.push({ key: 'subtitle', label: 'Subtítulo', clear: () => { draft.subtitle = '' } })
  if (!allows('content') && !isRichHtmlEmpty(draft.content)) list.push({ key: 'content', label: 'Texto', clear: () => { draft.content = ''; editorKey.value++ } })
  if (!allows('video') && hasText(draft.video_url)) list.push({ key: 'video_url', label: 'Vídeo de YouTube', clear: () => { draft.video_url = '' } })
  if (!allows('layout') && draft.layout !== 'stacked') list.push({ key: 'layout', label: 'Distribución de la imagen', clear: () => { draft.layout = 'stacked' } })
  if (!allows('image') && hasText(draft.image_alt)) list.push({ key: 'image_alt', label: 'Texto alternativo de la imagen', clear: () => { draft.image_alt = '' } })
  if (!allows('image') && imageSrc.value) list.push({ key: 'image', label: 'Imagen', clear: () => clearImage() })
  if (!allows('cta') && (hasText(draft.cta_label) || hasText(draft.cta_url))) {
    list.push({ key: 'cta_label', label: 'Botón de acción', clear: () => { draft.cta_label = ''; draft.cta_url = '' } })
  }
  return list
})

// Campos que ya se muestran junto a su control (el resto de errores de Hub se lista en el aviso general).
const shownFields = computed(() => {
  const shown = ['type', 'title', 'subtitle', 'content', 'video_url', 'image', 'image_alt', 'layout', 'cta_label', 'cta_url']
  return shown
})

function fill(s: TreeSection | null) {
  draft.type = s?.type ?? 'description'
  draft.title = s?.title ?? ''
  draft.subtitle = s?.subtitle ?? ''
  draft.content = s?.content ?? ''
  draft.layout = s?.layout ?? 'stacked'
  draft.image_alt = s?.image_alt ?? ''
  draft.video_url = s?.video_url ?? ''
  draft.cta_label = s?.cta?.label ?? ''
  draft.cta_url = s?.cta?.url ?? ''
  draft.visible = s?.visible ?? true
  draft.newImage = ''
  draft.removeImage = false
  editorKey.value++
}

async function init() {
  loadError.value = null
  ready.value = false
  try {
    catalog.value = await api.sectionTypes()
    if (props.sectionId) {
      const s = await api.getSection(props.sectionId)
      // Una sección abierta bajo otro subtema no se muestra como si perteneciera a él.
      if (s.recommendation_page_id !== props.subtopicId) throw Object.assign(new Error('La sección no pertenece a este subtema.'), { statusCode: 404 })
      section.value = s
      fill(s)
    } else {
      fill(null)
    }
  } catch (e) {
    loadError.value = describeTreeError(e)
  } finally {
    ready.value = true
  }
}

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
  draft.removeImage = !!section.value?.image_url
}

const orNull = (v: string) => (v.trim() === '' ? null : v.trim())

/** El botón es opcional: texto y destino juntos o ninguno, con el dato faltante identificado. */
function validateCta(): boolean {
  delete clientErrors.cta_label
  delete clientErrors.cta_url
  const label = hasText(draft.cta_label)
  const url = hasText(draft.cta_url)
  if (label && !url) clientErrors.cta_url = 'Falta el destino del botón.'
  if (url && !label) clientErrors.cta_label = 'Falta el texto del botón.'
  return !clientErrors.cta_label && !clientErrors.cta_url
}

function buildInput(): SectionInput {
  // Cada campo se envía con su valor (o null si está vacío): lo que el tipo no admite lo decide Hub (422 por campo), no se descarta aquí.
  return {
    type: draft.type as SectionInput['type'],
    title: draft.title.trim(),
    subtitle: orNull(draft.subtitle),
    content: isRichHtmlEmpty(draft.content) ? null : draft.content,
    layout: draft.layout,
    image_alt: orNull(draft.image_alt),
    video_url: orNull(draft.video_url),
    cta_label: orNull(draft.cta_label),
    cta_url: orNull(draft.cta_url),
    visible: draft.visible
  }
}

async function submit() {
  for (const key of Object.keys(clientErrors)) delete clientErrors[key]
  const titleOk = hasText(draft.title)
  if (!titleOk) clientErrors.title = 'Escribe un título para la sección.'
  const ctaOk = validateCta()
  if (!titleOk || !ctaOk) return

  const editing = props.sectionId
  const res = await action.run(async () => {
    if (editing) {
      // Quitar la imagen es una orden explícita del usuario y va antes de cambiar el tipo (Hub no deja un tipo sin imagen con imagen).
      if (draft.removeImage && section.value?.image_url) await api.removeSectionImage(editing)
      let saved = await api.updateSection(editing, buildInput())
      if (draft.newImage) saved = await api.setSectionImage(editing, draft.newImage)
      return saved
    }
    const created = await api.createSection(props.subtopicId, buildInput())
    if (draft.newImage) {
      try { await api.setSectionImage(created.id, draft.newImage) } catch { void notify.warning('La sección se creó, pero la imagen no se pudo subir. Vuelve a intentarlo al editarla.') }
    }
    return created
  })
  if (!res.ok) return

  if (editing) {
    section.value = res.value
    fill(res.value)
    void notify.success('Sección guardada.')
  } else {
    void notify.success('Sección creada.')
    await navigateTo(`${backUrl.value}/secciones/${res.value.id}`)
  }
}

onMounted(init)
</script>

<style scoped>
.label { display: block; font-size: .7rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: #374151; margin-bottom: .4rem; }
.field { width: 100%; padding: .65rem .9rem; border: 1px solid #e5e7eb; border-radius: .5rem; background: #f9fafb; font-size: .875rem; }
.field:focus { outline: none; box-shadow: 0 0 0 2px #0C2619; border-color: transparent; }
.field[aria-invalid="true"] { border-color: #dc2626; }
.err { margin-top: .35rem; font-size: .75rem; color: #b91c1c; }
.hint { margin-top: .35rem; font-size: .65rem; color: #6b7280; }
</style>

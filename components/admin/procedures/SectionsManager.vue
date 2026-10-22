<template>
  <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8" data-testid="procedure-sections">
    <div class="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4 mb-6">
      <div>
        <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase">Secciones de contenido</h3>
        <p class="text-xs text-gray-500 mt-1 max-w-2xl">
          Se muestran en la web de tu línea <strong>debajo</strong> del contenido del procedimiento, en el orden de esta lista. Cada sección tiene una o dos columnas y cada columna puede apilar
          texto, imágenes, videos de YouTube y publicaciones de Instagram.
          <template v-if="isMaster"> Son solo de Planmed: no modifican el procedimiento maestro ni las secciones de otras líneas.</template>
        </p>
      </div>
      <button v-if="!editing && canWrite" type="button" class="bg-[#0C2619] hover:bg-[#153a28] text-white px-5 py-2.5 rounded-lg font-bold text-[11px] tracking-widest uppercase cursor-pointer" data-testid="add-section" @click="startCreate">
        + Agregar sección
      </button>
    </div>

    <p v-if="!canWrite" class="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3" data-testid="sections-readonly">
      Habilita este procedimiento en tu línea (activo) para editar sus secciones. Mientras esté deshabilitado se conservan, pero no se publican.
    </p>

    <div v-if="loadError" class="mb-4">
      <AdminRecommendationsTreeNotice :error="loadError" :dismissible="false" title="No se pudieron cargar las secciones" />
      <button type="button" class="mt-2 text-xs font-bold tracking-widest uppercase underline cursor-pointer" @click="load">Reintentar</button>
    </div>
    <p v-else-if="loading" class="text-sm text-gray-400">Cargando...</p>

    <template v-else>
      <p v-if="!sections.length && !editing" class="text-sm text-gray-500 italic" data-testid="sections-empty">Este procedimiento aún no tiene secciones en tu línea.</p>

      <ul v-if="sections.length" class="space-y-3 mb-6">
        <li v-for="(s, i) in sections" :key="s.id" class="flex items-center gap-4 border border-gray-200 rounded-lg p-3" :class="{ 'opacity-60': !s.visible }" data-testid="section-row">
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-gray-900 truncate">{{ s.title || 'Sin título' }}</p>
            <p class="text-[11px] text-gray-500">
              <template v-if="s.blocks_mode">{{ s.column_layout === 'two_columns' ? 'Dos columnas' : 'Una columna' }} · {{ s.blocks.length }} {{ s.blocks.length === 1 ? 'bloque' : 'bloques' }}</template>
              <template v-else>{{ s.image_url ? (s.layout === 'media_right' ? 'Imagen a la derecha' : 'Imagen a la izquierda') : 'Solo texto' }}</template>
              <span v-if="!s.visible" class="ml-2 font-bold uppercase text-amber-700">Oculta</span>
            </p>
          </div>
          <div v-if="canWrite" class="flex items-center gap-1 shrink-0">
            <button type="button" class="icon-btn" :disabled="i === 0 || action.busy.value" aria-label="Subir sección" @click="move(i, -1)">↑</button>
            <button type="button" class="icon-btn" :disabled="i === sections.length - 1 || action.busy.value" aria-label="Bajar sección" @click="move(i, 1)">↓</button>
            <button type="button" class="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest border border-gray-200 rounded hover:border-[#0C2619] cursor-pointer" @click="startEdit(s)">Editar</button>
            <button type="button" class="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-red-700 border border-red-100 rounded hover:bg-red-50 cursor-pointer" :disabled="action.busy.value" @click="remove(s)">Eliminar</button>
          </div>
        </li>
      </ul>

      <form v-if="editing" class="space-y-5 border border-gray-200 rounded-xl p-5 bg-gray-50/50" data-testid="section-form" @submit.prevent="submit">
        <p class="text-xs font-bold tracking-widest uppercase text-[#0C2619]">{{ editing === 'new' ? 'Nueva sección' : 'Editar sección' }}</p>

        <p v-if="legacy" class="text-xs text-sky-900 bg-sky-50 border border-sky-200 rounded px-3 py-2" data-testid="section-legacy-notice">
          Esta sección usa el formato anterior (título, texto e imagen). Al guardar pasará a bloques: el texto y la imagen se convierten en bloques y el contenido anterior se conserva en el sistema.
        </p>

        <div>
          <label class="label" for="ps-title">Título (opcional)</label>
          <input id="ps-title" v-model="draft.title" type="text" class="field" maxlength="255" placeholder="Ej. ¿Cómo es la recuperación?">
          <p v-if="fieldError('title')" class="err">{{ fieldError('title') }}</p>
        </div>

        <AdminContentBlocksEditor v-model:layout="draft.layout" :blocks="draft.blocks" />
        <p v-if="fieldError('content')" class="err">{{ fieldError('content') }}</p>

        <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input v-model="draft.visible" type="checkbox" class="h-4 w-4 accent-[#0C2619]"> Publicar esta sección en la web
        </label>

        <AdminRecommendationsTreeNotice :error="action.error.value" :hide-fields="['title', 'content', 'layout', 'column_layout']" title="No se pudo guardar la sección" @dismiss="action.clear" />

        <div class="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <button type="button" class="text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-gray-800 cursor-pointer" @click="cancel">Cancelar</button>
          <button type="submit" :disabled="action.busy.value" class="bg-[#0C2619] hover:bg-[#153a28] text-white px-6 py-2.5 rounded-lg font-bold text-xs tracking-widest uppercase disabled:opacity-50 cursor-pointer" data-testid="save-section">
            {{ action.busy.value ? 'Guardando...' : 'Guardar sección' }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { describeTreeError, type TreeErrorInfo } from '#shared/utils/recommendationAdminApi'
import { hasText } from '#shared/utils/recommendationTree'
import { activeSlots, buildBlockInputs, draftFromAdmin, newDraftBlock, type ColumnLayout, type DraftBlock } from '#shared/utils/contentBlocks'
import { procedureSectionsAdmin as api } from '~/providers/HubProcedureSectionsProvider'
import type { ProcedureSectionAdmin, ProcedureSectionInput } from '~/types/procedureSection'

// Administra las secciones de UN procedimiento para la línea del usuario. Hub aplica el permiso `cirugia_secciones.*` y el aislamiento por línea; aquí solo
// se ocultan acciones que Hub rechazaría (maestro deshabilitado). Cada columna apila bloques (texto, imagen, YouTube, Instagram; ver
// AdminContentBlocksEditor). Se envía SIEMPRE la lista completa de bloques (también la columna inactiva). Las imágenes de los bloques se suben aparte, cuando
// el bloque ya tiene id. Una sección del formato anterior se edita como bloques: su imagen se COPIA al bloque (Hub) y la original se conserva.
const props = defineProps<{ procedureId: number, isMaster: boolean, canWrite: boolean }>()

const notify = useNotify()
const action = useTreeAction()

const sections = ref<ProcedureSectionAdmin[]>([])
const loading = ref(true)
const loadError = ref<TreeErrorInfo | null>(null)
const editing = ref<null | 'new' | number>(null)
const legacy = ref(false)
const clientErrors = reactive<Record<string, string>>({})

const draft = reactive({ title: '', layout: 'one_column' as ColumnLayout, visible: true, blocks: [] as DraftBlock[] })
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

/** Distribución y bloques iniciales: los guardados, o (formato anterior) el texto y la imagen de la sección según la posición de la imagen. */
function initial(s: ProcedureSectionAdmin | null): { layout: ColumnLayout, blocks: DraftBlock[] } {
  if (!s) return { layout: 'one_column', blocks: [] }
  if (s.blocks_mode) return { layout: s.column_layout, blocks: draftFromAdmin(s.blocks) }

  const text = hasText(s.content) ? newDraftBlock('main', 'text', { content: s.content! }) : null
  const image = s.image_url ? newDraftBlock('main', 'image', { imageUrl: s.image_url, alt: s.title ?? '', fromSectionImage: true }) : null
  if (text && image) {
    const imageFirst = s.layout !== 'media_right'
    text.slot = imageFirst ? 'right' : 'left'
    image.slot = imageFirst ? 'left' : 'right'
    return { layout: 'two_columns', blocks: imageFirst ? [image, text] : [text, image] }
  }
  return { layout: 'one_column', blocks: [text ?? image].filter((b): b is DraftBlock => b !== null) }
}

function fill(s: ProcedureSectionAdmin | null) {
  const start = initial(s)
  draft.title = s?.title ?? ''
  draft.layout = start.layout
  draft.visible = s?.visible ?? true
  draft.blocks = start.blocks
  legacy.value = !!s && !s.blocks_mode && start.blocks.length > 0
  action.clear()
  for (const key of Object.keys(clientErrors)) delete clientErrors[key]
}

function startCreate() { fill(null); editing.value = 'new' }
function startEdit(s: ProcedureSectionAdmin) { fill(s); editing.value = s.id }
function cancel() { editing.value = null; fill(null) }

async function submit() {
  for (const key of Object.keys(clientErrors)) delete clientErrors[key]
  const active = activeSlots(draft.layout)
  const built = buildBlockInputs(draft.blocks, active)
  if (built.error) { clientErrors.content = built.error; return }
  const title = draft.title.trim() === '' ? null : draft.title.trim()
  if (!title && !built.ordered.some(b => active.includes(b.slot))) {
    clientErrors.content = 'Escribe un título o agrega al menos un bloque.'
    return
  }

  const input: ProcedureSectionInput = { title, column_layout: draft.layout, visible: draft.visible, blocks: built.inputs }
  const target = editing.value
  let uploadFailed = false
  const res = await action.run(async () => {
    const saved = typeof target === 'number' ? await api.update(target, input) : await api.create(props.procedureId, input)
    // Hub devuelve los bloques por columna y orden, igual que se enviaron: se suben las imágenes nuevas con el id de su bloque.
    for (const [i, b] of built.ordered.entries()) {
      if (b.type !== 'image' || !b.newImage) continue
      const id = saved.blocks?.[i]?.id
      if (!id) { uploadFailed = true; continue }
      try { await api.setBlockImage(id, b.newImage) } catch { uploadFailed = true }
    }
    return saved
  })
  if (!res.ok) return

  void notify.success(typeof target === 'number' ? 'Sección guardada.' : 'Sección creada.')
  if (uploadFailed) void notify.warning('La sección se guardó, pero alguna imagen no se pudo subir. Vuelve a abrirla para subirla de nuevo.')
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
.icon-btn { width: 2rem; height: 2rem; border: 1px solid #e5e7eb; border-radius: .375rem; font-weight: 700; cursor: pointer; }
.icon-btn:hover:not(:disabled) { border-color: #0C2619; }
.icon-btn:disabled { opacity: .35; cursor: default; }
</style>

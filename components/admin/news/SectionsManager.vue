<template>
  <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8" data-testid="news-sections-manager">
    <div class="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4 mb-6">
      <div>
        <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase">Secciones de contenido</h3>
        <p class="text-xs text-gray-500 mt-1 max-w-2xl">
          Se muestran en la web <strong>debajo</strong> del cuerpo de la noticia, en el orden de esta lista. Cada sección tiene una o dos columnas y cada columna puede apilar
          texto, imágenes, videos de YouTube y publicaciones de Instagram.
        </p>
      </div>
      <button v-if="!editing" type="button" class="bg-[#0C2619] hover:bg-[#153a28] text-white px-5 py-2.5 rounded-lg font-bold text-[11px] tracking-widest uppercase cursor-pointer" data-testid="add-news-section" @click="startCreate">
        + Agregar sección
      </button>
    </div>

    <div v-if="loadError" class="mb-4">
      <AdminRecommendationsTreeNotice :error="loadError" :dismissible="false" title="No se pudieron cargar las secciones" />
      <button type="button" class="mt-2 text-xs font-bold tracking-widest uppercase underline cursor-pointer" @click="load">Reintentar</button>
    </div>
    <p v-else-if="loading" class="text-sm text-gray-400">Cargando...</p>

    <template v-else>
      <p v-if="!sections.length && !editing" class="text-sm text-gray-500 italic" data-testid="news-sections-empty">Esta noticia aún no tiene secciones.</p>

      <ul v-if="sections.length" class="space-y-3 mb-6">
        <li v-for="(s, i) in sections" :key="s.id" class="flex items-center gap-4 border border-gray-200 rounded-lg p-3" :class="{ 'opacity-60': !s.visible }" data-testid="news-section-row">
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-gray-900 truncate">{{ s.title || 'Sin título' }}</p>
            <p class="text-[11px] text-gray-500">
              {{ s.layout === 'two_columns' ? 'Dos columnas' : 'Una columna' }}
              <span v-if="s.blocks_mode"> · {{ s.blocks.length }} {{ s.blocks.length === 1 ? 'bloque' : 'bloques' }}</span>
              <span v-if="!s.visible" class="ml-2 font-bold uppercase text-amber-700">Oculta</span>
            </p>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button type="button" class="icon-btn" :disabled="i === 0 || action.busy.value" aria-label="Subir sección" @click="move(i, -1)">↑</button>
            <button type="button" class="icon-btn" :disabled="i === sections.length - 1 || action.busy.value" aria-label="Bajar sección" @click="move(i, 1)">↓</button>
            <button type="button" class="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest border border-gray-200 rounded hover:border-[#0C2619] cursor-pointer" @click="startEdit(s)">Editar</button>
            <button type="button" class="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-red-700 border border-red-100 rounded hover:bg-red-50 cursor-pointer" :disabled="action.busy.value" @click="remove(s)">Eliminar</button>
          </div>
        </li>
      </ul>

      <form v-if="editing" class="space-y-5 border border-gray-200 rounded-xl p-5 bg-gray-50/50" data-testid="news-section-form" @submit.prevent="submit">
        <p class="text-xs font-bold tracking-widest uppercase text-[#0C2619]">{{ editing === 'new' ? 'Nueva sección' : 'Editar sección' }}</p>

        <p v-if="legacy" class="text-xs text-sky-900 bg-sky-50 border border-sky-200 rounded px-3 py-2" data-testid="news-legacy-notice">
          Esta sección usa el formato anterior (un texto por columna). Al guardar pasará a bloques; el contenido anterior se conserva en el sistema.
        </p>

        <div>
          <label class="label" for="ns-title">Título (opcional)</label>
          <input id="ns-title" v-model="draft.title" type="text" class="field" maxlength="255" placeholder="Ej. ¿Qué cambia para los afiliados?">
          <p v-if="fieldError('title')" class="err">{{ fieldError('title') }}</p>
        </div>

        <AdminContentBlocksEditor v-model:layout="draft.layout" :blocks="draft.blocks" />
        <p v-if="fieldError('content')" class="err">{{ fieldError('content') }}</p>

        <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input v-model="draft.visible" type="checkbox" class="h-4 w-4 accent-[#0C2619]"> Publicar esta sección en la web
        </label>

        <AdminRecommendationsTreeNotice :error="action.error.value" :hide-fields="['title', 'content', 'layout']" title="No se pudo guardar la sección" @dismiss="action.clear" />

        <div class="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <button type="button" class="text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-gray-800 cursor-pointer" @click="cancel">Cancelar</button>
          <button type="submit" :disabled="action.busy.value" class="bg-[#0C2619] hover:bg-[#153a28] text-white px-6 py-2.5 rounded-lg font-bold text-xs tracking-widest uppercase disabled:opacity-50 cursor-pointer" data-testid="save-news-section">
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
import { newsSectionsAdmin as api } from '~/providers/HubNewsSectionsProvider'
import type { NewsSectionAdmin, NewsSectionInput } from '~/types/news'

// Administra las secciones de UNA noticia de la línea del usuario. Hub aplica los permisos de noticias (blog.*) y el aislamiento por línea.
// Cada columna apila bloques (texto, imagen, YouTube, Instagram; ver AdminContentBlocksEditor). Se envía SIEMPRE la lista completa de bloques de la sección
// (los de la columna inactiva también: cambiar de distribución nunca borra contenido). Las imágenes se suben aparte, cuando el bloque ya tiene id.
const props = defineProps<{ postId: number }>()

const notify = useNotify()
const action = useTreeAction()

const sections = ref<NewsSectionAdmin[]>([])
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
    sections.value = await api.list(props.postId)
  } catch (e) {
    loadError.value = describeTreeError(e)
  } finally {
    loading.value = false
  }
}

/** Bloques iniciales: los guardados, o (formato anterior) un bloque de texto por cada contenido antiguo con texto. */
function initialBlocks(s: NewsSectionAdmin | null): DraftBlock[] {
  if (!s) return []
  if (s.blocks_mode) return draftFromAdmin(s.blocks)
  const out: DraftBlock[] = []
  if (hasText(s.content)) out.push(newDraftBlock('main', 'text', { content: s.content! }))
  if (hasText(s.content_left)) out.push(newDraftBlock('left', 'text', { content: s.content_left! }))
  if (hasText(s.content_right)) out.push(newDraftBlock('right', 'text', { content: s.content_right! }))
  return out
}

function fill(s: NewsSectionAdmin | null) {
  draft.title = s?.title ?? ''
  draft.layout = s?.layout ?? 'one_column'
  draft.visible = s?.visible ?? true
  draft.blocks = initialBlocks(s)
  legacy.value = !!s && !s.blocks_mode && draft.blocks.length > 0
  action.clear()
  for (const key of Object.keys(clientErrors)) delete clientErrors[key]
}

function startCreate() { fill(null); editing.value = 'new' }
function startEdit(s: NewsSectionAdmin) { fill(s); editing.value = s.id }
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

  const input: NewsSectionInput = { title, layout: draft.layout, visible: draft.visible, blocks: built.inputs }
  const target = editing.value
  let uploadFailed = false
  const res = await action.run(async () => {
    const saved = typeof target === 'number' ? await api.update(target, input) : await api.create(props.postId, input)
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

async function remove(s: NewsSectionAdmin) {
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
  const res = await action.run(() => api.reorder(props.postId, next.map(s => s.id)))
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

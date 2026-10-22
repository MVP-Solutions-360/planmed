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

        <fieldset :key="radioKey" class="border-0 p-0 m-0" data-testid="news-layout-choice">
          <legend class="label">Distribución</legend>
          <div class="flex flex-wrap gap-3">
            <label class="radio"><input type="radio" name="ns-layout" value="one_column" :checked="draft.layout === 'one_column'" @change="setLayout('one_column')"> Una columna</label>
            <label class="radio"><input type="radio" name="ns-layout" value="two_columns" :checked="draft.layout === 'two_columns'" @change="setLayout('two_columns')"> Dos columnas</label>
          </div>
        </fieldset>

        <!-- Columnas de la distribución activa: cada una apila sus bloques -->
        <div class="grid grid-cols-1 gap-5" :class="draft.layout === 'two_columns' ? 'lg:grid-cols-2' : ''" data-testid="news-columns">
          <section v-for="slot in slots" :key="slot" class="min-w-0 border border-gray-200 rounded-lg bg-white p-4" :data-slot="slot">
            <h4 class="label">{{ SLOT_LABEL[slot] }}</h4>

            <p v-if="!slotBlocks(slot).length" class="text-xs text-gray-400 italic mb-3">Sin contenido. Agrega un bloque.</p>

            <div v-for="(b, i) in slotBlocks(slot)" :key="b.key" class="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50/60" data-testid="news-block" :data-type="b.type">
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="text-[11px] font-bold uppercase tracking-widest text-[#0C2619]">{{ TYPE_LABEL[b.type] }}</span>
                <div class="flex items-center gap-1">
                  <button type="button" class="icon-btn" :disabled="i === 0" aria-label="Subir bloque" @click="moveBlock(b, -1)">↑</button>
                  <button type="button" class="icon-btn" :disabled="i === slotBlocks(slot).length - 1" aria-label="Bajar bloque" @click="moveBlock(b, 1)">↓</button>
                  <button v-if="draft.layout === 'two_columns'" type="button" class="icon-btn" :aria-label="slot === 'left' ? 'Mover a la columna derecha' : 'Mover a la columna izquierda'" :title="slot === 'left' ? 'Mover a la derecha' : 'Mover a la izquierda'" @click="moveToOtherSlot(b)">{{ slot === 'left' ? '→' : '←' }}</button>
                  <button type="button" class="icon-btn text-red-700" aria-label="Quitar bloque" @click="removeBlock(b)">✕</button>
                </div>
              </div>

              <AdminRichTextEditor v-if="b.type === 'text'" :key="`t-${b.key}`" v-model="b.content" min-height="8rem" placeholder="Escribe aquí el texto..." />

              <div v-else-if="b.type === 'image'" class="space-y-2">
                <label class="block w-full max-w-xs aspect-[4/3] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-[#0C2619] bg-white relative">
                  <img v-if="blockImage(b)" :src="blockImage(b)" alt="Imagen del bloque" class="w-full h-full object-contain">
                  <span v-else class="absolute inset-0 flex items-center justify-center text-xs text-gray-400 text-center px-3">Haz clic para subir (JPG, PNG o WebP)</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onBlockImage(b, $event)">
                </label>
                <input v-model="b.alt" type="text" class="field" maxlength="255" placeholder="Texto alternativo (describe la imagen)" aria-label="Texto alternativo">
              </div>

              <div v-else>
                <input v-model="b.url" type="url" class="field" maxlength="2048" :placeholder="b.type === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://www.instagram.com/p/...'" :aria-label="TYPE_LABEL[b.type]">
                <p v-if="b.url.trim() !== ''" class="mt-1 text-xs" :class="urlOk(b) ? 'text-green-700' : 'text-red-700'">{{ urlOk(b) ? 'Enlace válido.' : (b.type === 'youtube' ? 'No es un enlace válido de YouTube.' : 'No es un enlace válido de una publicación de Instagram.') }}</p>
              </div>
            </div>

            <div class="flex flex-wrap gap-2" data-testid="news-add-block">
              <button v-for="t in TYPES" :key="t" type="button" class="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest border border-gray-200 rounded hover:border-[#0C2619] cursor-pointer" :data-add="t" @click="addBlock(slot, t)">+ {{ TYPE_LABEL[t] }}</button>
            </div>
          </section>
        </div>
        <p v-if="fieldError('content')" class="err">{{ fieldError('content') }}</p>
        <p v-if="hiddenCount" class="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2" data-testid="news-kept-columns">
          Hay {{ hiddenCount }} {{ hiddenCount === 1 ? 'bloque guardado' : 'bloques guardados' }} en {{ draft.layout === 'two_columns' ? 'la columna única' : 'las dos columnas' }} que no se publican con esta distribución. Se conservan y se recuperan al volver a ella.
        </p>

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
import { computed, onMounted, reactive, ref } from 'vue'
import { describeTreeError, type TreeErrorInfo } from '#shared/utils/recommendationAdminApi'
import { hasText } from '#shared/utils/recommendationTree'
import { parseEmbedUrl } from '#shared/utils/embedUrl'
import { newsSectionsAdmin as api } from '~/providers/HubNewsSectionsProvider'
import { fileToOptimizedDataUrl } from '~/utils/imageFile'
import type { NewsBlockInput, NewsBlockSlot, NewsBlockType, NewsSectionAdmin, NewsSectionInput } from '~/types/news'

// Administra las secciones de UNA noticia de la línea del usuario. Hub aplica los permisos de noticias (blog.*) y el aislamiento por línea.
// Cada columna apila bloques (texto, imagen, YouTube, Instagram). Se envía SIEMPRE la lista completa de bloques de la sección (los de la columna
// inactiva también: cambiar de distribución nunca borra contenido). Las imágenes se suben aparte, cuando el bloque ya tiene id.
const props = defineProps<{ postId: number }>()

const TYPES: NewsBlockType[] = ['text', 'image', 'youtube', 'instagram']
const TYPE_LABEL: Record<NewsBlockType, string> = { text: 'Texto', image: 'Imagen', youtube: 'Video de YouTube', instagram: 'Post de Instagram' }
const SLOT_LABEL: Record<NewsBlockSlot, string> = { main: 'Contenido', left: 'Columna izquierda', right: 'Columna derecha' }
const SLOT_ORDER: NewsBlockSlot[] = ['left', 'main', 'right'] // el orden en que Hub devuelve los bloques (por columna)

interface DraftBlock { key: number, id?: number, slot: NewsBlockSlot, type: NewsBlockType, content: string, url: string, alt: string, imageUrl: string, newImage: string }

const notify = useNotify()
const action = useTreeAction()

const sections = ref<NewsSectionAdmin[]>([])
const loading = ref(true)
const loadError = ref<TreeErrorInfo | null>(null)
const editing = ref<null | 'new' | number>(null)
const legacy = ref(false)
const radioKey = ref(0)
const clientErrors = reactive<Record<string, string>>({})
let uid = 0

const draft = reactive({ title: '', layout: 'one_column' as 'one_column' | 'two_columns', visible: true, blocks: [] as DraftBlock[] })
const fieldError = (name: string) => clientErrors[name] ?? action.error.value?.fields[name] ?? null

const slots = computed<NewsBlockSlot[]>(() => (draft.layout === 'two_columns' ? ['left', 'right'] : ['main']))
const slotBlocks = (slot: NewsBlockSlot) => draft.blocks.filter(b => b.slot === slot)
/** Bloques guardados en columnas que la distribución actual no publica. */
const hiddenCount = computed(() => draft.blocks.filter(b => !slots.value.includes(b.slot) && blockHasData(b)).length)

function urlOk(b: DraftBlock) { return parseEmbedUrl(b.url)?.platform === b.type }
function blockImage(b: DraftBlock) { return b.newImage || b.imageUrl }
function blockHasData(b: DraftBlock) {
  if (b.type === 'text') return hasText(b.content)
  if (b.type === 'image') return !!blockImage(b)
  return urlOk(b)
}

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

function newBlock(slot: NewsBlockSlot, type: NewsBlockType, init: Partial<DraftBlock> = {}): DraftBlock {
  return { key: ++uid, slot, type, content: '', url: '', alt: '', imageUrl: '', newImage: '', ...init }
}

/** Bloques iniciales: los guardados, o (formato anterior) un bloque de texto por cada contenido antiguo con texto. */
function initialBlocks(s: NewsSectionAdmin | null): DraftBlock[] {
  if (!s) return []
  if (s.blocks_mode) {
    return s.blocks.map(b => newBlock(b.slot, b.type, { id: b.id, content: b.content ?? '', url: b.url ?? '', alt: b.alt ?? '', imageUrl: b.image_url ?? '' }))
  }
  const out: DraftBlock[] = []
  if (hasText(s.content)) out.push(newBlock('main', 'text', { content: s.content! }))
  if (hasText(s.content_left)) out.push(newBlock('left', 'text', { content: s.content_left! }))
  if (hasText(s.content_right)) out.push(newBlock('right', 'text', { content: s.content_right! }))
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

/** Cambia la distribución SIN descartar nada; al pasar a una columna con bloques en las columnas pide confirmación (se conservan, pero no se publican). */
function setLayout(next: 'one_column' | 'two_columns') {
  if (next === draft.layout) return
  if (next === 'one_column' && draft.blocks.some(b => b.slot !== 'main' && blockHasData(b))
    && !window.confirm('Los bloques de las dos columnas no se mostrarán mientras la sección sea de una columna, pero se conservan y se recuperan al volver a «Dos columnas». ¿Cambiar a una columna?')) {
    radioKey.value++ // restablece el radio al valor vigente (la distribución no cambia)
    return
  }
  draft.layout = next
}

function addBlock(slot: NewsBlockSlot, type: NewsBlockType) { draft.blocks.push(newBlock(slot, type)) }
function removeBlock(b: DraftBlock) { draft.blocks.splice(draft.blocks.indexOf(b), 1) }

function moveBlock(b: DraftBlock, delta: -1 | 1) {
  const same = slotBlocks(b.slot)
  const neighbor = same[same.indexOf(b) + delta]
  if (!neighbor) return
  const a = draft.blocks.indexOf(b)
  const c = draft.blocks.indexOf(neighbor)
  ;[draft.blocks[a], draft.blocks[c]] = [draft.blocks[c]!, draft.blocks[a]!]
}

function moveToOtherSlot(b: DraftBlock) {
  draft.blocks.splice(draft.blocks.indexOf(b), 1)
  draft.blocks.push({ ...b, slot: b.slot === 'left' ? 'right' : 'left' })
}

async function onBlockImage(b: DraftBlock, e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > 10 * 1024 * 1024) return void notify.error('La imagen no puede superar los 10 MB.')
  try {
    b.newImage = await fileToOptimizedDataUrl(file)
  } catch (err: any) {
    void notify.error(err.message)
  }
}

/** Bloques a guardar en el orden de Hub (por columna). Un bloque vacío o inválido de una columna activa es un error; en una inactiva se descarta. */
function buildBlocks(): { ordered: DraftBlock[], inputs: NewsBlockInput[] } | null {
  const ordered: DraftBlock[] = []
  let ok = true
  for (const slot of SLOT_ORDER) {
    for (const b of slotBlocks(slot)) {
      if (blockHasData(b)) { ordered.push(b); continue }
      if (!slots.value.includes(slot)) continue
      ok = false
      clientErrors.content = b.type === 'text' ? 'Hay un bloque de texto vacío: escríbelo o quítalo.'
        : b.type === 'image' ? 'Hay un bloque de imagen sin imagen: súbela o quita el bloque.'
          : `Hay un bloque de ${TYPE_LABEL[b.type]} con un enlace no válido: corrígelo o quítalo.`
    }
  }
  if (!ok) return null
  const inputs = ordered.map<NewsBlockInput>(b => ({
    ...(b.id ? { id: b.id } : {}),
    slot: b.slot,
    type: b.type,
    content: b.type === 'text' ? b.content : null,
    url: b.type === 'youtube' || b.type === 'instagram' ? b.url.trim() : null,
    alt: b.type === 'image' ? (b.alt.trim() || null) : null
  }))
  return { ordered, inputs }
}

async function submit() {
  for (const key of Object.keys(clientErrors)) delete clientErrors[key]
  const built = buildBlocks()
  if (!built) return
  const title = draft.title.trim() === '' ? null : draft.title.trim()
  const activeHas = built.ordered.some(b => slots.value.includes(b.slot))
  if (!title && !activeHas) {
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
.icon-btn { width: 2rem; height: 2rem; border: 1px solid #e5e7eb; border-radius: .375rem; font-weight: 700; background: #fff; cursor: pointer; }
.icon-btn:hover:not(:disabled) { border-color: #0C2619; }
.icon-btn:disabled { opacity: .35; cursor: default; }
.radio { display: inline-flex; align-items: center; gap: .5rem; padding: .6rem .9rem; border: 1px solid #e5e7eb; border-radius: .5rem; background: #fff; font-size: .875rem; font-weight: 600; cursor: pointer; }
</style>

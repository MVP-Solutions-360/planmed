<template>
  <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8" data-testid="news-sections-manager">
    <div class="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4 mb-6">
      <div>
        <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase">Secciones de contenido</h3>
        <p class="text-xs text-gray-500 mt-1 max-w-2xl">
          Se muestran en la web <strong>debajo</strong> del cuerpo de la noticia, en el orden de esta lista. Cada sección puede tener una o dos columnas.
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

        <div>
          <label class="label" for="ns-title">Título (opcional)</label>
          <input id="ns-title" v-model="draft.title" type="text" class="field" maxlength="255" placeholder="Ej. ¿Qué cambia para los afiliados?">
          <p v-if="fieldError('title')" class="err">{{ fieldError('title') }}</p>
        </div>

        <fieldset class="border-0 p-0 m-0" data-testid="news-layout-choice">
          <legend class="label">Distribución</legend>
          <div class="flex flex-wrap gap-3">
            <label class="radio"><input type="radio" name="ns-layout" value="one_column" :checked="draft.layout === 'one_column'" @change="setLayout('one_column')"> Una columna</label>
            <label class="radio"><input type="radio" name="ns-layout" value="two_columns" :checked="draft.layout === 'two_columns'" @change="setLayout('two_columns')"> Dos columnas</label>
          </div>
        </fieldset>

        <div v-if="draft.layout === 'one_column'" data-testid="news-single-editor">
          <label class="label">Contenido</label>
          <AdminRichTextEditor :key="`single-${editorKey}`" v-model="draft.content" min-height="12rem" placeholder="Escribe aquí el contenido de la sección..." />
          <p v-if="fieldError('content')" class="err">{{ fieldError('content') }}</p>
          <p v-if="hasText(draft.contentLeft) || hasText(draft.contentRight)" class="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2" data-testid="news-kept-columns">
            El contenido de las dos columnas se conserva, pero no se publica mientras la sección sea de una columna. Vuelve a «Dos columnas» para recuperarlo.
          </p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-5" data-testid="news-double-editor">
          <div class="min-w-0">
            <label class="label">Columna izquierda</label>
            <AdminRichTextEditor :key="`left-${editorKey}`" v-model="draft.contentLeft" min-height="12rem" placeholder="Contenido de la columna izquierda..." />
          </div>
          <div class="min-w-0">
            <label class="label">Columna derecha</label>
            <AdminRichTextEditor :key="`right-${editorKey}`" v-model="draft.contentRight" min-height="12rem" placeholder="Contenido de la columna derecha..." />
          </div>
          <p v-if="fieldError('content')" class="err md:col-span-2">{{ fieldError('content') }}</p>
        </div>

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
import { newsSectionsAdmin as api } from '~/providers/HubNewsSectionsProvider'
import { isRichHtmlEmpty } from '~/utils/richText'
import type { NewsSectionAdmin, NewsSectionInput } from '~/types/news'

// Administra las secciones de UNA noticia de la línea del usuario. Hub aplica los permisos de noticias (blog.*) y el aislamiento por línea.
// Los tres contenidos (una columna, izquierda y derecha) se envían y guardan siempre: cambiar de distribución nunca borra el de la otra.
const props = defineProps<{ postId: number }>()

const notify = useNotify()
const action = useTreeAction()

const sections = ref<NewsSectionAdmin[]>([])
const loading = ref(true)
const loadError = ref<TreeErrorInfo | null>(null)
const editing = ref<null | 'new' | number>(null)
const editorKey = ref(0)
const clientErrors = reactive<Record<string, string>>({})

const draft = reactive({ title: '', layout: 'one_column' as 'one_column' | 'two_columns', content: '', contentLeft: '', contentRight: '', visible: true })
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

function fill(s: NewsSectionAdmin | null) {
  draft.title = s?.title ?? ''
  draft.layout = s?.layout ?? 'one_column'
  draft.content = s?.content ?? ''
  draft.contentLeft = s?.content_left ?? ''
  draft.contentRight = s?.content_right ?? ''
  draft.visible = s?.visible ?? true
  editorKey.value++
  action.clear()
  for (const key of Object.keys(clientErrors)) delete clientErrors[key]
}

function startCreate() { fill(null); editing.value = 'new' }
function startEdit(s: NewsSectionAdmin) { fill(s); editing.value = s.id }
function cancel() { editing.value = null; fill(null) }

/** Cambia la distribución SIN descartar nada; al pasar a una columna con texto en las columnas, pide confirmación (se conserva, pero no se publica). */
function setLayout(next: 'one_column' | 'two_columns') {
  if (next === draft.layout) return
  if (next === 'one_column' && (hasText(draft.contentLeft) || hasText(draft.contentRight))
    && !window.confirm('El contenido de las dos columnas no se mostrará mientras la sección sea de una columna, pero se conserva y se recupera al volver a «Dos columnas». ¿Cambiar a una columna?')) {
    editorKey.value++ // restablece el radio al valor vigente
    return
  }
  draft.layout = next
  editorKey.value++
}

function buildInput(): NewsSectionInput {
  const clean = (html: string) => (isRichHtmlEmpty(html) ? null : html)
  return {
    title: draft.title.trim() === '' ? null : draft.title.trim(),
    layout: draft.layout,
    content: clean(draft.content),
    content_left: clean(draft.contentLeft),
    content_right: clean(draft.contentRight),
    visible: draft.visible
  }
}

async function submit() {
  for (const key of Object.keys(clientErrors)) delete clientErrors[key]
  const input = buildInput()
  const body = input.layout === 'two_columns' ? (input.content_left || input.content_right) : input.content
  if (!input.title && !body) {
    clientErrors.content = 'Escribe un título o un contenido para la sección.'
    return
  }

  const target = editing.value
  const res = await action.run(() => (typeof target === 'number' ? api.update(target, input) : api.create(props.postId, input)))
  if (!res.ok) return

  void notify.success(typeof target === 'number' ? 'Sección guardada.' : 'Sección creada.')
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
.radio { display: inline-flex; align-items: center; gap: .5rem; padding: .6rem .9rem; border: 1px solid #e5e7eb; border-radius: .5rem; background: #fff; font-size: .875rem; font-weight: 600; cursor: pointer; }
</style>

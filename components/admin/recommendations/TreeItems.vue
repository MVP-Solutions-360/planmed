<template>
  <section class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 space-y-5" data-testid="items">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="min-w-0">
        <h3 class="text-sm font-bold tracking-widest uppercase text-[#0C2619]">Recomendaciones individuales</h3>
        <p class="mt-1 text-xs text-gray-500">Cada una se muestra como un elemento de la lista de esta sección. Son independientes del texto de la sección.</p>
      </div>
      <button type="button" class="bg-[#0C2619] hover:bg-[#153a28] text-white px-5 py-2.5 rounded-lg font-bold text-xs tracking-widest uppercase disabled:opacity-50" data-testid="add-item" :disabled="action.busy.value" @click="openCreate">Añadir recomendación</button>
    </div>

    <div v-if="!loaded" class="text-gray-400 text-sm">Cargando recomendaciones...</div>
    <div v-else-if="loadError">
      <AdminRecommendationsTreeNotice :error="loadError" :dismissible="false" title="No se pudieron cargar las recomendaciones" />
      <button type="button" class="mt-2 text-xs font-bold tracking-widest uppercase underline" @click="load">Reintentar</button>
    </div>

    <template v-else>
      <div v-if="form" class="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4" data-testid="item-form">
        <h4 class="text-xs font-bold tracking-widest uppercase text-[#0C2619]">{{ form.id ? 'Editar recomendación' : 'Nueva recomendación' }}</h4>
        <div>
          <label class="label" for="item-title">Título *</label>
          <input id="item-title" v-model="form.title" type="text" class="field" maxlength="255" placeholder="Ej. Duerme de lado las primeras semanas" :aria-invalid="!!fieldError('title')">
          <p v-if="fieldError('title')" class="err">{{ fieldError('title') }}</p>
        </div>
        <div>
          <label class="label">Contenido</label>
          <AdminRichTextEditor :key="`item-${form.id ?? 'nuevo'}-${editorKey}`" v-model="form.content" min-height="9rem" placeholder="Escribe aquí la descripción o el contenido de la sección..." />
          <p v-if="fieldError('content')" class="err">{{ fieldError('content') }}</p>
        </div>
        <div v-if="!form.id">
          <label class="label" for="item-slug">Dirección (slug, opcional)</label>
          <input id="item-slug" v-model="form.slug" type="text" class="field font-mono" maxlength="120" placeholder="Se genera desde el título" :aria-invalid="!!fieldError('slug')">
          <p v-if="fieldError('slug')" class="err">{{ fieldError('slug') }}</p>
        </div>
        <label v-if="!form.id" class="flex items-center gap-2 text-sm text-gray-700"><input v-model="form.published" type="checkbox" class="h-4 w-4 accent-[#0C2619]"> Publicar al crear</label>
        <AdminRecommendationsTreeNotice :error="action.error.value" :hide-fields="['title', 'content', 'slug']" @dismiss="action.clear" />
        <div class="flex flex-wrap items-center gap-3">
          <button type="button" class="bg-[#0C2619] hover:bg-[#153a28] text-white px-5 py-2.5 rounded-lg font-bold text-xs tracking-widest uppercase disabled:opacity-50" :disabled="action.busy.value" data-testid="save-item" @click="save">{{ action.busy.value ? 'Guardando...' : form.id ? 'Guardar recomendación' : 'Crear recomendación' }}</button>
          <button type="button" class="text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-gray-800" :disabled="action.busy.value" @click="form = null">Cancelar</button>
        </div>
      </div>

      <AdminRecommendationsTreeNotice v-if="!form" :error="rowError" @dismiss="rowError = null" />

      <p v-if="!items.length" class="rounded-lg border border-dashed border-gray-300 px-6 py-8 text-center text-sm text-gray-500" data-testid="no-items">Esta sección todavía no tiene recomendaciones individuales.</p>

      <ul v-else class="divide-y divide-gray-100 rounded-lg border border-gray-200" data-testid="item-list">
        <li v-for="(it, i) in items" :key="it.id" class="grid gap-2 px-4 py-3 md:grid-cols-[4.5rem_minmax(0,1fr)_6rem_minmax(0,auto)] md:items-center md:gap-3" :data-testid="`item-${it.id}`">
          <div class="flex items-center gap-1">
            <span class="w-6 text-sm text-gray-500">{{ i + 1 }}</span>
            <button type="button" class="icon-btn" aria-label="Subir" :disabled="i === 0 || action.busy.value" @click="move(i, -1)">↑</button>
            <button type="button" class="icon-btn" aria-label="Bajar" :disabled="i === items.length - 1 || action.busy.value" @click="move(i, 1)">↓</button>
          </div>
          <span class="min-w-0 break-words text-sm font-semibold text-[#0C2619]">{{ it.title }}</span>
          <span><AdminRecommendationsStatusBadge :label="it.published ? 'Publicada' : 'Oculta'" :tone="it.published ? 'green' : 'gray'" /></span>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 md:justify-end">
            <button type="button" class="link" :disabled="action.busy.value" @click="openEdit(it)">Editar</button>
            <button type="button" class="link" :disabled="action.busy.value" @click="togglePublished(it)">{{ it.published ? 'Ocultar' : 'Publicar' }}</button>
            <button type="button" class="link text-gray-400 hover:text-red-600" :disabled="action.busy.value" @click="remove(it)">Eliminar</button>
          </div>
        </li>
      </ul>
    </template>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { describeTreeError, moveId, type TreeErrorInfo } from '#shared/utils/recommendationAdminApi'
import { recommendationTreeAdmin as api } from '~/providers/HubRecommendationTreeAdminProvider'
import { isRichHtmlEmpty } from '~/utils/richText'
import type { TreeItem } from '~/types/recommendationTree'

const props = defineProps<{ sectionId: number }>()
const emit = defineEmits<{ changed: [] }>()

const notify = useNotify()
const action = useTreeAction()

const items = ref<TreeItem[]>([])
const loaded = ref(false)
const loadError = ref<TreeErrorInfo | null>(null)
const rowError = ref<TreeErrorInfo | null>(null)
const editorKey = ref(0)

interface ItemForm { id: number | null, title: string, content: string, slug: string, published: boolean }
const form = ref<ItemForm | null>(null)
const fieldError = (name: string) => action.error.value?.fields[name] ?? null

async function load() {
  loadError.value = null
  try {
    items.value = await api.listItems(props.sectionId)
  } catch (e) {
    loadError.value = describeTreeError(e)
  } finally {
    loaded.value = true
  }
}

function openCreate() {
  action.clear()
  editorKey.value++
  form.value = reactive({ id: null, title: '', content: '', slug: '', published: false })
}

function openEdit(it: TreeItem) {
  action.clear()
  editorKey.value++
  form.value = reactive({ id: it.id, title: it.title, content: it.content ?? '', slug: it.slug, published: it.published })
}

async function save() {
  const f = form.value
  if (!f) return
  const title = f.title.trim()
  const content = isRichHtmlEmpty(f.content) ? null : f.content
  const res = await action.run(async () => {
    if (!title) throw Object.assign(new Error('Escribe un título para la recomendación.'), { statusCode: 422, fieldErrors: { title: ['Escribe un título para la recomendación.'] } })
    if (f.id) return api.updateItem(f.id, { title, content })
    return api.createItem(props.sectionId, { title, content, ...(f.slug.trim() ? { slug: f.slug.trim() } : {}), published: f.published })
  })
  if (!res.ok) return
  form.value = null
  void notify.success(f.id ? 'Recomendación guardada.' : 'Recomendación creada.')
  await load()
  emit('changed')
}

async function togglePublished(it: TreeItem) {
  rowError.value = null
  const res = await action.run(() => api.updateItem(it.id, { published: !it.published }))
  if (!res.ok) { rowError.value = action.error.value; return }
  void notify.success(res.value.published ? 'Recomendación publicada.' : 'Recomendación oculta.')
  await load()
  emit('changed')
}

async function move(index: number, direction: -1 | 1) {
  rowError.value = null
  const ids = moveId(items.value.map(i => i.id), index, direction)
  if (!ids) return
  const res = await action.run(() => api.reorderItems(props.sectionId, ids))
  if (!res.ok) { rowError.value = action.error.value; return }
  await load()
}

async function remove(it: TreeItem) {
  rowError.value = null
  const ok = await notify.confirm(`¿Eliminar la recomendación «${it.title}»?`, 'Esta acción no se puede deshacer.', 'Sí, eliminar')
  if (!ok) return
  const res = await action.run(() => api.deleteItem(it.id))
  if (!res.ok) { rowError.value = action.error.value; return }
  void notify.success('Recomendación eliminada.')
  await load()
  emit('changed')
}

onMounted(load)
</script>

<style scoped>
.label { display: block; font-size: .7rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: #374151; margin-bottom: .4rem; }
.field { width: 100%; padding: .65rem .9rem; border: 1px solid #e5e7eb; border-radius: .5rem; background: #fff; font-size: .875rem; }
.field:focus { outline: none; box-shadow: 0 0 0 2px #0C2619; border-color: transparent; }
.field[aria-invalid="true"] { border-color: #dc2626; }
.err { margin-top: .35rem; font-size: .75rem; color: #b91c1c; }
.link { font-size: .7rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #0C2619; }
.link:hover:not(:disabled) { color: #D3A76A; }
.link:disabled { opacity: .5; }
.icon-btn { width: 1.6rem; height: 1.6rem; border: 1px solid #e5e7eb; border-radius: .4rem; font-size: .8rem; color: #374151; }
.icon-btn:hover:not(:disabled) { background: #f3f4f6; }
.icon-btn:disabled { opacity: .35; }
</style>

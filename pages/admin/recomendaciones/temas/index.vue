<template>
  <div class="pb-24">
    <AdminRecommendationsTreeBreadcrumb :crumbs="[{ label: 'Recomendaciones' }]" />

    <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h2 class="text-3xl font-serif text-[#0C2619] mb-1 uppercase">Temas de recomendaciones</h2>
        <p class="text-gray-500 font-light max-w-2xl">Cada tema es una opción del menú público de Recomendaciones. Dentro de un tema se crean los subtemas (las páginas), sus secciones y las recomendaciones individuales.</p>
      </div>
      <button type="button" class="bg-[#0C2619] hover:bg-[#153a28] text-white px-6 py-3 rounded-lg font-bold text-xs tracking-widest uppercase transition-colors shadow-lg" data-testid="create-topic" @click="openCreate">
        Crear tema
      </button>
    </div>

    <div v-if="!loaded" class="text-gray-400 text-sm" data-testid="loading">Cargando...</div>

    <div v-else-if="loadError" class="mb-6">
      <AdminRecommendationsTreeNotice :error="loadError" :dismissible="false" title="No se pudieron cargar los temas" />
      <p class="mt-2 text-xs text-gray-500">Esto no significa que no existan: no se pudo consultar la lista.</p>
      <button type="button" class="mt-3 text-xs font-bold tracking-widest uppercase underline" @click="load">Reintentar</button>
    </div>

    <template v-else>
      <!-- Crear / editar tema -->
      <form v-if="form" class="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4" data-testid="topic-form" @submit.prevent="save">
        <h3 class="text-sm font-bold tracking-widest uppercase text-[#0C2619]">{{ form.id ? 'Editar tema' : 'Nuevo tema' }}</h3>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="label" for="t-title">Título del tema *</label>
            <input id="t-title" v-model="form.title" type="text" class="field" maxlength="255" placeholder="Ej. Cuidados de cirugías" :aria-invalid="!!fieldError('title')">
            <p v-if="fieldError('title')" class="err">{{ fieldError('title') }}</p>
          </div>
          <div>
            <label class="label" for="t-menu">Texto del menú</label>
            <input id="t-menu" v-model="form.menu_label" type="text" class="field" maxlength="255" placeholder="Si lo dejas vacío se usa el título">
            <p v-if="fieldError('menu_label')" class="err">{{ fieldError('menu_label') }}</p>
          </div>
          <div v-if="!form.id">
            <label class="label" for="t-slug">Dirección (slug, opcional)</label>
            <input id="t-slug" v-model="form.slug" type="text" class="field font-mono" maxlength="120" placeholder="Se genera desde el título">
            <p v-if="fieldError('slug')" class="err">{{ fieldError('slug') }}</p>
            <p class="hint">Solo minúsculas, números y guiones. No se puede cambiar después: la web enlaza a él.</p>
          </div>
          <label v-if="!form.id" class="flex items-center gap-2 text-sm text-gray-700 md:self-end">
            <input v-model="form.published" type="checkbox" class="h-4 w-4 accent-[#0C2619]"> Publicar al crear
          </label>
        </div>
        <AdminRecommendationsTreeNotice :error="action.error.value" :hide-fields="['title', 'menu_label', 'slug']" @dismiss="action.clear" />
        <div class="flex flex-wrap items-center gap-3">
          <button type="submit" :disabled="action.busy.value" class="bg-[#0C2619] hover:bg-[#153a28] text-white px-6 py-3 rounded-lg font-bold text-xs tracking-widest uppercase transition-colors disabled:opacity-50">
            {{ action.busy.value ? 'Guardando...' : form.id ? 'Guardar tema' : 'Crear tema' }}
          </button>
          <button type="button" class="text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-gray-800" :disabled="action.busy.value" @click="form = null">Cancelar</button>
        </div>
      </form>

      <AdminRecommendationsTreeNotice v-if="!form" :error="rowError" title="No se pudo completar la acción" @dismiss="rowError = null" />

      <p v-if="!topics.length" class="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-500" data-testid="empty">
        Aún no hay temas. Usa «Crear tema» para añadir el primero.
      </p>

      <div v-else class="mt-4 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden" data-testid="topic-list">
        <div class="hidden md:grid grid-cols-[4.5rem_minmax(0,2fr)_minmax(0,1.4fr)_6rem_7rem_minmax(0,auto)] gap-3 bg-gray-50 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <span>Orden</span><span>Tema</span><span>Texto del menú</span><span>Subtemas</span><span>Estado</span><span class="text-right">Acciones</span>
        </div>
        <ul class="divide-y divide-gray-100">
          <li v-for="(t, i) in topics" :key="t.id" class="grid gap-2 px-5 py-4 md:grid-cols-[4.5rem_minmax(0,2fr)_minmax(0,1.4fr)_6rem_7rem_minmax(0,auto)] md:items-center md:gap-3" :data-testid="`topic-${t.id}`">
            <div class="flex items-center gap-1">
              <span class="w-6 text-sm text-gray-500">{{ i + 1 }}</span>
              <button type="button" class="icon-btn" aria-label="Subir" :disabled="i === 0 || action.busy.value" @click="move(i, -1)">↑</button>
              <button type="button" class="icon-btn" aria-label="Bajar" :disabled="i === topics.length - 1 || action.busy.value" @click="move(i, 1)">↓</button>
            </div>
            <NuxtLink :to="`/admin/recomendaciones/temas/${t.id}`" class="min-w-0 break-words font-semibold text-[#0C2619] hover:text-[#D3A76A]">{{ t.title }}</NuxtLink>
            <span class="min-w-0 break-words text-sm text-gray-600"><span class="md:hidden text-[10px] font-bold uppercase tracking-widest text-gray-400">Menú: </span>{{ t.menu_label }}</span>
            <span class="text-sm text-gray-600"><span class="md:hidden text-[10px] font-bold uppercase tracking-widest text-gray-400">Subtemas: </span>{{ t.subtopics_count }}<span v-if="t.subtopics_count" class="text-xs text-gray-400"> ({{ t.published_subtopics_count }} publ.)</span></span>
            <span><AdminRecommendationsStatusBadge :label="t.published ? 'Publicado' : 'Oculto'" :tone="t.published ? 'green' : 'gray'" /></span>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 md:justify-end">
              <NuxtLink :to="`/admin/recomendaciones/temas/${t.id}`" class="link">Abrir</NuxtLink>
              <button type="button" class="link" :disabled="action.busy.value" @click="openEdit(t)">Editar</button>
              <button type="button" class="link" :disabled="action.busy.value" @click="togglePublished(t)">{{ t.published ? 'Ocultar' : 'Publicar' }}</button>
              <button type="button" class="link text-gray-400 hover:text-red-600" :disabled="action.busy.value" @click="remove(t)">Eliminar</button>
            </div>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useHead } from '#imports'
import { describeTreeError, moveId, type TreeErrorInfo } from '#shared/utils/recommendationAdminApi'
import { recommendationTreeAdmin as api } from '~/providers/HubRecommendationTreeAdminProvider'
import type { TreeTopic } from '~/types/recommendationTree'

useHead({ title: 'Temas de recomendaciones | Admin Planmed' })
definePageMeta({ layout: 'admin' })

const notify = useNotify()
const action = useTreeAction()

const topics = ref<TreeTopic[]>([])
const loaded = ref(false)
const loadError = ref<TreeErrorInfo | null>(null)
// Error de las acciones de fila (ocultar, ordenar, eliminar): se muestra sobre la lista, no se pierde.
const rowError = ref<TreeErrorInfo | null>(null)

interface TopicForm { id: number | null, title: string, menu_label: string, slug: string, published: boolean }
const form = ref<TopicForm | null>(null)
const fieldError = (name: string) => action.error.value?.fields[name] ?? null

async function load() {
  loadError.value = null
  try {
    topics.value = await api.listTopics()
  } catch (e) {
    loadError.value = describeTreeError(e)
  } finally {
    loaded.value = true
  }
}

function openCreate() {
  action.clear()
  form.value = reactive({ id: null, title: '', menu_label: '', slug: '', published: false })
}

function openEdit(t: TreeTopic) {
  action.clear()
  form.value = reactive({ id: t.id, title: t.title, menu_label: t.menu_label, slug: t.slug, published: t.published })
}

async function save() {
  const f = form.value
  if (!f) return
  const title = f.title.trim()
  const res = await action.run(async () => {
    if (!title) throw Object.assign(new Error('Escribe un título para el tema.'), { statusCode: 422, fieldErrors: { title: ['Escribe un título para el tema.'] } })
    if (f.id) return api.updateTopic(f.id, { title, menu_label: f.menu_label.trim() || title })
    return api.createTopic({ title, ...(f.menu_label.trim() ? { menu_label: f.menu_label.trim() } : {}), ...(f.slug.trim() ? { slug: f.slug.trim() } : {}), published: f.published })
  })
  if (!res.ok) return
  form.value = null
  void notify.success(f.id ? 'Tema guardado.' : 'Tema creado.')
  await load()
}

async function togglePublished(t: TreeTopic) {
  rowError.value = null
  const res = await action.run(() => api.updateTopic(t.id, { published: !t.published }))
  if (!res.ok) { rowError.value = action.error.value; return }
  void notify.success(res.value.published ? 'Tema publicado.' : 'Tema oculto.')
  await load()
}

async function move(index: number, direction: -1 | 1) {
  rowError.value = null
  const ids = moveId(topics.value.map(t => t.id), index, direction)
  if (!ids) return
  const res = await action.run(() => api.reorderTopics(ids))
  if (!res.ok) { rowError.value = action.error.value; return }
  await load()
}

async function remove(t: TreeTopic) {
  rowError.value = null
  const ok = await notify.confirm(`¿Eliminar el tema «${t.title}»?`, 'Solo se puede eliminar si no tiene subtemas. Esta acción no se puede deshacer.', 'Sí, eliminar')
  if (!ok) return
  const res = await action.run(() => api.deleteTopic(t.id))
  if (!res.ok) { rowError.value = action.error.value; return }
  void notify.success('Tema eliminado.')
  await load()
}

onMounted(load)
</script>

<style scoped>
.label { display: block; font-size: .7rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: #374151; margin-bottom: .4rem; }
.field { width: 100%; padding: .65rem .9rem; border: 1px solid #e5e7eb; border-radius: .5rem; background: #f9fafb; font-size: .875rem; }
.field:focus { outline: none; box-shadow: 0 0 0 2px #0C2619; border-color: transparent; }
.field[aria-invalid="true"] { border-color: #dc2626; }
.err { margin-top: .35rem; font-size: .75rem; color: #b91c1c; }
.hint { margin-top: .35rem; font-size: .65rem; color: #6b7280; }
.link { font-size: .7rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #0C2619; }
.link:hover:not(:disabled) { color: #D3A76A; }
.link:disabled { opacity: .5; }
.icon-btn { width: 1.6rem; height: 1.6rem; border: 1px solid #e5e7eb; border-radius: .4rem; font-size: .8rem; color: #374151; }
.icon-btn:hover:not(:disabled) { background: #f3f4f6; }
.icon-btn:disabled { opacity: .35; }
</style>

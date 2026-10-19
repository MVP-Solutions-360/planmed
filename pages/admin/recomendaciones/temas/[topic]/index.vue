<template>
  <div class="pb-24">
    <AdminRecommendationsTreeBreadcrumb :crumbs="[{ label: 'Recomendaciones', to: '/admin/recomendaciones/temas' }, { label: topic?.title ?? 'Tema' }]" />

    <div v-if="!loaded" class="text-gray-400 text-sm" data-testid="loading">Cargando...</div>

    <div v-else-if="loadError" class="mb-6">
      <AdminRecommendationsTreeNotice :error="loadError" :dismissible="false" :title="loadError.kind === 'notfound' ? 'El tema no existe' : 'No se pudo cargar el tema'" />
      <NuxtLink to="/admin/recomendaciones/temas" class="mt-3 inline-block text-xs font-bold tracking-widest uppercase underline">Volver a los temas</NuxtLink>
      <button v-if="loadError.kind !== 'notfound'" type="button" class="mt-3 ml-4 text-xs font-bold tracking-widest uppercase underline" @click="load">Reintentar</button>
    </div>

    <template v-else-if="topic">
      <!-- Información del tema -->
      <div class="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4" data-testid="topic-info">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">Tema principal</p>
            <h2 class="text-2xl font-serif text-[#0C2619] break-words">{{ topic.title }}</h2>
            <p class="mt-1 text-xs text-gray-500">Texto del menú: <strong class="break-words">{{ topic.menu_label }}</strong> · Dirección <code class="bg-gray-100 rounded px-1.5 py-0.5">/recomendaciones/{{ topic.slug }}</code></p>
            <p class="mt-1 text-xs text-gray-500">{{ topic.subtopics_count }} subtema{{ topic.subtopics_count === 1 ? '' : 's' }} ({{ topic.published_subtopics_count }} publicado{{ topic.published_subtopics_count === 1 ? '' : 's' }})</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <AdminRecommendationsStatusBadge :label="topic.published ? 'Publicado' : 'Oculto'" :tone="topic.published ? 'green' : 'gray'" />
            <button type="button" class="link" :disabled="topicAction.busy.value" @click="editingTopic = !editingTopic">{{ editingTopic ? 'Cerrar' : 'Editar tema' }}</button>
            <button type="button" class="link" :disabled="topicAction.busy.value" @click="toggleTopicPublished">{{ topic.published ? 'Ocultar tema' : 'Publicar tema' }}</button>
          </div>
        </div>
        <p v-if="!topic.published" class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">Mientras el tema esté oculto, ninguno de sus subtemas es público.</p>

        <form v-if="editingTopic" class="grid gap-4 border-t border-gray-100 pt-4 md:grid-cols-2" @submit.prevent="saveTopic">
          <div>
            <label class="label" for="e-title">Título del tema *</label>
            <input id="e-title" v-model="topicDraft.title" type="text" class="field" maxlength="255" placeholder="Ej. Cuidados de cirugías" :aria-invalid="!!topicField('title')">
            <p v-if="topicField('title')" class="err">{{ topicField('title') }}</p>
          </div>
          <div>
            <label class="label" for="e-menu">Texto del menú</label>
            <input id="e-menu" v-model="topicDraft.menu_label" type="text" class="field" maxlength="255">
            <p v-if="topicField('menu_label')" class="err">{{ topicField('menu_label') }}</p>
          </div>
          <div class="md:col-span-2 space-y-3">
            <AdminRecommendationsTreeNotice :error="topicAction.error.value" :hide-fields="['title', 'menu_label']" @dismiss="topicAction.clear" />
            <button type="submit" :disabled="topicAction.busy.value" class="btn">{{ topicAction.busy.value ? 'Guardando...' : 'Guardar tema' }}</button>
          </div>
        </form>
        <AdminRecommendationsTreeNotice v-else :error="topicAction.error.value" @dismiss="topicAction.clear" />
      </div>

      <!-- Subtemas -->
      <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 class="text-sm font-bold tracking-widest uppercase text-gray-500">Subtemas del tema</h3>
        <button type="button" class="btn" data-testid="create-subtopic" @click="openCreate">Crear subtema</button>
      </div>

      <form v-if="creating" class="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4" data-testid="subtopic-form" @submit.prevent="createSubtopic">
        <h4 class="text-sm font-bold tracking-widest uppercase text-[#0C2619]">Nuevo subtema en «{{ topic.title }}»</h4>
        <p class="hint">El subtema queda asociado automáticamente a este tema, a tu empresa y a tu línea.</p>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="label" for="s-title">Título del subtema *</label>
            <input id="s-title" v-model="draft.title" type="text" class="field" maxlength="255" placeholder="Ej. La importancia de la cita de preanestesia" :aria-invalid="!!subField('title')">
            <p v-if="subField('title')" class="err">{{ subField('title') }}</p>
          </div>
          <div>
            <label class="label" for="s-menu">Texto del menú</label>
            <input id="s-menu" v-model="draft.menu_label" type="text" class="field" maxlength="255" placeholder="Si lo dejas vacío se usa el título">
            <p v-if="subField('menu_label')" class="err">{{ subField('menu_label') }}</p>
          </div>
          <div>
            <label class="label" for="s-group">Categoría</label>
            <select id="s-group" v-model="draft.grupo" class="field">
              <option v-for="(label, value) in GROUPS" :key="value" :value="value">{{ label }}</option>
            </select>
            <p v-if="subField('grupo')" class="err">{{ subField('grupo') }}</p>
          </div>
          <div>
            <label class="label" for="s-slug">Dirección (slug, opcional)</label>
            <input id="s-slug" v-model="draft.slug" type="text" class="field font-mono" maxlength="120" placeholder="Se genera desde el título">
            <p v-if="subField('slug')" class="err">{{ subField('slug') }}</p>
          </div>
        </div>
        <AdminRecommendationsTreeNotice :error="subAction.error.value" :hide-fields="['title', 'menu_label', 'grupo', 'slug']" @dismiss="subAction.clear" />
        <div class="flex flex-wrap items-center gap-3">
          <button type="submit" :disabled="subAction.busy.value" class="btn">{{ subAction.busy.value ? 'Creando...' : 'Crear subtema' }}</button>
          <button type="button" class="text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-gray-800" :disabled="subAction.busy.value" @click="creating = false">Cancelar</button>
        </div>
      </form>

      <AdminRecommendationsTreeNotice :error="rowError" @dismiss="rowError = null" />

      <p v-if="!subtopics.length" class="mt-3 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-500" data-testid="empty">
        Este tema todavía no tiene subtemas. Usa «Crear subtema» para añadir el primero.
      </p>

      <div v-else class="mt-3 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden" data-testid="subtopic-list">
        <div class="hidden md:grid grid-cols-[4.5rem_minmax(0,2fr)_minmax(0,1.4fr)_5.5rem_7rem_minmax(0,auto)] gap-3 bg-gray-50 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <span>Orden</span><span>Subtema</span><span>Texto del menú</span><span>Secciones</span><span>Estado</span><span class="text-right">Acciones</span>
        </div>
        <ul class="divide-y divide-gray-100">
          <li v-for="(s, i) in subtopics" :key="s.id" class="grid gap-2 px-5 py-4 md:grid-cols-[4.5rem_minmax(0,2fr)_minmax(0,1.4fr)_5.5rem_7rem_minmax(0,auto)] md:items-center md:gap-3" :data-testid="`subtopic-${s.id}`">
            <div class="flex items-center gap-1">
              <span class="w-6 text-sm text-gray-500">{{ i + 1 }}</span>
              <button type="button" class="icon-btn" aria-label="Subir" :disabled="i === 0 || subAction.busy.value" @click="move(i, -1)">↑</button>
              <button type="button" class="icon-btn" aria-label="Bajar" :disabled="i === subtopics.length - 1 || subAction.busy.value" @click="move(i, 1)">↓</button>
            </div>
            <NuxtLink :to="subtopicUrl(s.id)" class="min-w-0 break-words font-semibold text-[#0C2619] hover:text-[#D3A76A]">{{ s.title }}</NuxtLink>
            <span class="min-w-0 break-words text-sm text-gray-600"><span class="md:hidden text-[10px] font-bold uppercase tracking-widest text-gray-400">Menú: </span>{{ s.menu_label }}</span>
            <span class="text-sm text-gray-600"><span class="md:hidden text-[10px] font-bold uppercase tracking-widest text-gray-400">Secciones: </span>{{ s.sections_count }}</span>
            <span><AdminRecommendationsStatusBadge :label="s.published ? 'Publicado' : 'Oculto'" :tone="s.published ? 'green' : 'gray'" /></span>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 md:justify-end">
              <NuxtLink :to="subtopicUrl(s.id)" class="link">Abrir</NuxtLink>
              <button type="button" class="link" :disabled="subAction.busy.value" @click="togglePublished(s)">{{ s.published ? 'Ocultar' : 'Publicar' }}</button>
              <button type="button" class="link text-gray-400 hover:text-red-600" :disabled="subAction.busy.value" @click="remove(s)">Eliminar</button>
            </div>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useHead, useRoute } from '#imports'
import { describeTreeError, moveId, type TreeErrorInfo } from '#shared/utils/recommendationAdminApi'
import { recommendationTreeAdmin as api } from '~/providers/HubRecommendationTreeAdminProvider'
import type { TreeSubtopic, TreeTopic } from '~/types/recommendationTree'

useHead({ title: 'Tema de recomendaciones | Admin Planmed' })
definePageMeta({ layout: 'admin' })

const GROUPS = { general: 'General', cuidados: 'Cuidados', revision: 'Revisión' } as const

const route = useRoute()
const notify = useNotify()
const topicAction = useTreeAction()
const subAction = useTreeAction()

const topicId = computed(() => Number(route.params.topic))
const topic = ref<TreeTopic | null>(null)
const subtopics = ref<TreeSubtopic[]>([])
const loaded = ref(false)
const loadError = ref<TreeErrorInfo | null>(null)
const rowError = ref<TreeErrorInfo | null>(null)

const editingTopic = ref(false)
const topicDraft = reactive({ title: '', menu_label: '' })
const creating = ref(false)
const draft = reactive({ title: '', menu_label: '', grupo: 'general', slug: '' })

const topicField = (name: string) => topicAction.error.value?.fields[name] ?? null
const subField = (name: string) => subAction.error.value?.fields[name] ?? null
const subtopicUrl = (id: number) => `/admin/recomendaciones/temas/${topicId.value}/subtemas/${id}`

async function load() {
  loadError.value = null
  if (!Number.isSafeInteger(topicId.value) || topicId.value <= 0) {
    loadError.value = describeTreeError({ statusCode: 404 })
    loaded.value = true
    return
  }
  try {
    // El tema y sus subtemas se piden juntos; si uno falla no se muestra una lista vacía como si fuera real.
    const [t, subs] = await Promise.all([api.getTopic(topicId.value), api.listSubtopics(topicId.value)])
    topic.value = t
    subtopics.value = subs
    topicDraft.title = t.title
    topicDraft.menu_label = t.menu_label
  } catch (e) {
    loadError.value = describeTreeError(e)
  } finally {
    loaded.value = true
  }
}

async function saveTopic() {
  const title = topicDraft.title.trim()
  const res = await topicAction.run(async () => {
    if (!title) throw Object.assign(new Error('Escribe un título para el tema.'), { statusCode: 422, fieldErrors: { title: ['Escribe un título para el tema.'] } })
    return api.updateTopic(topicId.value, { title, menu_label: topicDraft.menu_label.trim() || title })
  })
  if (!res.ok) return
  editingTopic.value = false
  void notify.success('Tema guardado.')
  await load()
}

async function toggleTopicPublished() {
  if (!topic.value) return
  const publish = !topic.value.published
  const res = await topicAction.run(() => api.updateTopic(topicId.value, { published: publish }))
  if (!res.ok) return
  void notify.success(publish ? 'Tema publicado.' : 'Tema oculto.')
  await load()
}

function openCreate() {
  subAction.clear()
  Object.assign(draft, { title: '', menu_label: '', grupo: 'general', slug: '' })
  creating.value = true
}

async function createSubtopic() {
  const title = draft.title.trim()
  const res = await subAction.run(async () => {
    if (!title) throw Object.assign(new Error('Escribe un título para el subtema.'), { statusCode: 422, fieldErrors: { title: ['Escribe un título para el subtema.'] } })
    // El tema se indica SOLO en la ruta; el cuerpo nunca lleva tema, empresa ni línea.
    return api.createSubtopic(topicId.value, {
      title,
      grupo: draft.grupo,
      ...(draft.menu_label.trim() ? { menu_label: draft.menu_label.trim() } : {}),
      ...(draft.slug.trim() ? { slug: draft.slug.trim() } : {})
    })
  })
  if (!res.ok) return
  creating.value = false
  void notify.success('Subtema creado.')
  await navigateTo(subtopicUrl(res.value.id))
}

async function togglePublished(s: TreeSubtopic) {
  rowError.value = null
  const res = await subAction.run(() => api.updateSubtopic(s.id, { published: !s.published }))
  if (!res.ok) { rowError.value = subAction.error.value; return }
  void notify.success(res.value.published ? 'Subtema publicado.' : 'Subtema oculto.')
  await load()
}

async function move(index: number, direction: -1 | 1) {
  rowError.value = null
  const ids = moveId(subtopics.value.map(s => s.id), index, direction)
  if (!ids) return
  const res = await subAction.run(() => api.reorderSubtopics(topicId.value, ids))
  if (!res.ok) { rowError.value = subAction.error.value; return }
  await load()
}

async function remove(s: TreeSubtopic) {
  rowError.value = null
  const ok = await notify.confirm(`¿Eliminar el subtema «${s.title}»?`, 'Solo se puede eliminar si no tiene secciones. Esta acción no se puede deshacer.', 'Sí, eliminar')
  if (!ok) return
  const res = await subAction.run(() => api.deleteSubtopic(s.id))
  if (!res.ok) { rowError.value = subAction.error.value; return }
  void notify.success('Subtema eliminado.')
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
.hint { font-size: .7rem; color: #6b7280; }
.btn { background: #0C2619; color: #fff; padding: .75rem 1.5rem; border-radius: .5rem; font-weight: 700; font-size: .7rem; letter-spacing: .1em; text-transform: uppercase; }
.btn:hover:not(:disabled) { background: #153a28; }
.btn:disabled { opacity: .5; }
.link { font-size: .7rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #0C2619; }
.link:hover:not(:disabled) { color: #D3A76A; }
.link:disabled { opacity: .5; }
.icon-btn { width: 1.6rem; height: 1.6rem; border: 1px solid #e5e7eb; border-radius: .4rem; font-size: .8rem; color: #374151; }
.icon-btn:hover:not(:disabled) { background: #f3f4f6; }
.icon-btn:disabled { opacity: .35; }
</style>

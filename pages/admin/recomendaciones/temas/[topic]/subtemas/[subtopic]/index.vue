<template>
  <div class="pb-24">
    <AdminRecommendationsTreeBreadcrumb :crumbs="crumbs" />

    <div v-if="!loaded" class="text-gray-400 text-sm" data-testid="loading">Cargando...</div>

    <div v-else-if="loadError" class="mb-6">
      <AdminRecommendationsTreeNotice :error="loadError" :dismissible="false" :title="loadError.kind === 'notfound' ? 'El subtema no existe' : 'No se pudo cargar el subtema'" />
      <NuxtLink :to="topicUrl" class="mt-3 inline-block text-xs font-bold tracking-widest uppercase underline">Volver al tema</NuxtLink>
      <button v-if="loadError.kind !== 'notfound'" type="button" class="mt-3 ml-4 text-xs font-bold tracking-widest uppercase underline" @click="load">Reintentar</button>
    </div>

    <template v-else-if="sub">
      <!-- Datos del subtema -->
      <div class="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4" data-testid="subtopic-info">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">Subtema · Tema: {{ sub.topic?.title }}</p>
            <h2 class="text-2xl font-serif text-[#0C2619] break-words">{{ sub.title }}</h2>
            <p class="mt-1 text-xs text-gray-500">Texto del menú: <strong class="break-words">{{ sub.menu_label }}</strong> · Dirección <code class="bg-gray-100 rounded px-1.5 py-0.5 break-all">/recomendaciones/{{ sub.topic?.slug }}/{{ sub.slug }}</code></p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <AdminRecommendationsStatusBadge :label="sub.published ? 'Publicado' : 'Oculto'" :tone="sub.published ? 'green' : 'gray'" />
            <button type="button" class="link" :disabled="infoAction.busy.value" @click="editingInfo = !editingInfo">{{ editingInfo ? 'Cerrar' : 'Editar datos' }}</button>
            <button type="button" class="link" :disabled="infoAction.busy.value" @click="togglePublished">{{ sub.published ? 'Ocultar subtema' : 'Publicar subtema' }}</button>
          </div>
        </div>
        <p v-if="sub.topic && !sub.topic.published" class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">El tema «{{ sub.topic.title }}» está oculto: este subtema no es público hasta que se publique el tema.</p>

        <form v-if="editingInfo" class="grid gap-4 border-t border-gray-100 pt-4 md:grid-cols-2" @submit.prevent="saveInfo">
          <div>
            <label class="label" for="i-title">Título *</label>
            <input id="i-title" v-model="info.title" type="text" class="field" maxlength="255" :aria-invalid="!!infoField('title')">
            <p v-if="infoField('title')" class="err">{{ infoField('title') }}</p>
          </div>
          <div>
            <label class="label" for="i-menu">Texto del menú</label>
            <input id="i-menu" v-model="info.menu_label" type="text" class="field" maxlength="255">
            <p v-if="infoField('menu_label')" class="err">{{ infoField('menu_label') }}</p>
          </div>
          <div>
            <label class="label" for="i-group">Categoría</label>
            <select id="i-group" v-model="info.grupo" class="field">
              <option v-for="(label, value) in GROUPS" :key="value" :value="value">{{ label }}</option>
            </select>
            <p v-if="infoField('grupo')" class="err">{{ infoField('grupo') }}</p>
          </div>
          <div class="md:col-span-2 space-y-3">
            <AdminRecommendationsTreeNotice :error="infoAction.error.value" :hide-fields="['title', 'menu_label', 'grupo']" @dismiss="infoAction.clear" />
            <button type="submit" :disabled="infoAction.busy.value" class="btn">{{ infoAction.busy.value ? 'Guardando...' : 'Guardar datos' }}</button>
          </div>
        </form>
        <AdminRecommendationsTreeNotice v-else :error="infoAction.error.value" @dismiss="infoAction.clear" />
      </div>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] items-start">
        <div class="min-w-0 space-y-6">
          <!-- Introducción: se guarda de forma independiente de las secciones -->
          <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5" data-testid="intro">
            <div>
              <h3 class="text-sm font-bold tracking-widest uppercase text-[#0C2619]">Introducción</h3>
              <p class="mt-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3" data-testid="intro-note">Puedes agregar contenido directamente en la introducción. Sin embargo, para facilitar la edición, el ordenamiento y el mantenimiento, te recomendamos organizar la información en secciones independientes.</p>
            </div>

            <div>
              <label class="label">Texto de la introducción</label>
              <AdminRichTextEditor :key="`intro-${sub.id}-${introVersion}`" v-model="intro.content" min-height="14rem" />
              <p v-if="introField('content')" class="err">{{ introField('content') }}</p>
            </div>
            <div>
              <label class="label" for="intro-video">Vídeo de YouTube (opcional)</label>
              <input id="intro-video" v-model="intro.video_url" type="url" class="field" placeholder="https://www.youtube.com/watch?v=..." :aria-invalid="!!introField('video_url')">
              <p v-if="introField('video_url')" class="err">{{ introField('video_url') }}</p>
              <p class="hint">Admite youtube.com, youtu.be y Shorts.</p>
            </div>
            <AdminRecommendationsTreeNotice :error="introAction.error.value" :hide-fields="['content', 'video_url']" title="No se pudo guardar la introducción" @dismiss="introAction.clear" />
            <div class="flex flex-wrap items-center justify-between gap-3">
              <p class="text-xs" :class="introDirty ? 'text-amber-700 font-semibold' : 'text-gray-400'" aria-live="polite">{{ introDirty ? 'Cambios sin guardar en la introducción.' : 'Introducción sin cambios.' }}</p>
              <button type="button" class="btn" :disabled="!introDirty || introAction.busy.value" data-testid="save-intro" @click="saveIntro">{{ introAction.busy.value ? 'Guardando...' : 'Guardar introducción' }}</button>
            </div>

            <div class="border-t border-gray-100 pt-5">
              <label class="label">Imagen de la introducción (opcional)</label>
              <div class="flex flex-wrap items-start gap-4">
                <label class="block w-40 aspect-[4/3] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-[#0C2619] bg-gray-50 relative">
                  <img v-if="sub.intro.image_url" :src="sub.intro.image_url" alt="Imagen de la introducción" class="w-full h-full object-cover">
                  <span v-else class="absolute inset-0 flex items-center justify-center text-xs text-gray-400 text-center px-3">Haz clic para subir</span>
                  <input type="file" accept="image/*" class="hidden" :disabled="imageAction.busy.value" @change="onIntroImage">
                </label>
                <button v-if="sub.intro.image_url" type="button" class="text-xs font-bold text-gray-400 hover:text-red-600 uppercase tracking-wider" :disabled="imageAction.busy.value" @click="removeIntroImage">Quitar imagen</button>
              </div>
              <p class="hint mt-2">{{ imageAction.busy.value ? 'Procesando imagen...' : 'JPG, PNG o WebP. La imagen se guarda al elegirla.' }}</p>
              <div class="mt-2"><AdminRecommendationsTreeNotice :error="imageAction.error.value" title="No se pudo actualizar la imagen" @dismiss="imageAction.clear" /></div>
            </div>
          </div>
        </div>

        <!-- Enlace corto (de Hub; nunca se construye aquí) -->
        <aside class="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-3 lg:sticky lg:top-4" data-testid="short-link">
          <h3 class="text-sm font-bold tracking-widest uppercase text-[#0C2619]">Enlace corto del subtema</h3>
          <template v-if="shortLink && shortLink.active && shortLink.url">
            <code class="block break-all rounded bg-gray-100 px-2 py-1.5 text-xs" data-testid="short-url">{{ shortLink.url }}</code>
            <button type="button" class="btn w-full" data-testid="copy-short-link" @click="copyShortLink">{{ copied ? 'Copiado' : 'Copiar enlace' }}</button>
          </template>
          <p v-else-if="shortLink" class="text-xs text-gray-600" data-testid="short-link-state">{{ shortLink.message || 'Este subtema aún no tiene un enlace corto activo.' }}</p>
          <p v-else class="text-xs text-gray-500" data-testid="short-link-state">{{ shortLinkError || 'No se pudo consultar el enlace corto.' }}</p>
          <p class="hint">Lo genera Wellezy Hub al publicar el subtema y el tema.</p>
        </aside>
      </div>

      <!-- Secciones -->
      <div class="mt-8 mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 class="text-sm font-bold tracking-widest uppercase text-gray-500">Secciones de la página</h3>
        <NuxtLink :to="`${subtopicUrl}/secciones/nueva`" class="btn inline-block" data-testid="add-section">Añadir sección</NuxtLink>
      </div>
      <AdminRecommendationsTreeNotice :error="rowError" @dismiss="rowError = null" />

      <p v-if="!sections.length" class="mt-3 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-500" data-testid="no-sections">
        Este subtema todavía no tiene secciones. Usa «Añadir sección» para crear la descripción, las listas de recomendaciones y los demás bloques de la página.
      </p>
      <div v-else class="mt-3 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden" data-testid="section-list">
        <div class="hidden md:grid grid-cols-[4.5rem_minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_6rem_minmax(0,auto)] gap-3 bg-gray-50 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <span>Orden</span><span>Sección</span><span>Tipo</span><span>Contenido</span><span>Visibilidad</span><span class="text-right">Acciones</span>
        </div>
        <ul class="divide-y divide-gray-100">
          <li v-for="(s, i) in sections" :key="s.id" class="grid gap-2 px-5 py-4 md:grid-cols-[4.5rem_minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_6rem_minmax(0,auto)] md:items-center md:gap-3" :data-testid="`section-${s.id}`">
            <div class="flex items-center gap-1">
              <span class="w-6 text-sm text-gray-500">{{ i + 1 }}</span>
              <button type="button" class="icon-btn" aria-label="Subir sección" :disabled="i === 0 || sectionAction.busy.value" @click="move(i, -1)">↑</button>
              <button type="button" class="icon-btn" aria-label="Bajar sección" :disabled="i === sections.length - 1 || sectionAction.busy.value" @click="move(i, 1)">↓</button>
            </div>
            <NuxtLink :to="`${subtopicUrl}/secciones/${s.id}`" class="min-w-0 break-words font-semibold text-[#0C2619] hover:text-[#D3A76A]">{{ s.title }}</NuxtLink>
            <span class="min-w-0 break-words text-sm text-gray-600">{{ s.type_label }}</span>
            <span class="text-xs text-gray-500">{{ summary(s) }}</span>
            <span><AdminRecommendationsStatusBadge :label="s.visible ? 'Visible' : 'Oculta'" :tone="s.visible ? 'green' : 'gray'" /></span>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 md:justify-end">
              <NuxtLink :to="`${subtopicUrl}/secciones/${s.id}`" class="link">Editar</NuxtLink>
              <button type="button" class="link" :disabled="sectionAction.busy.value" @click="toggleVisible(s)">{{ s.visible ? 'Ocultar' : 'Mostrar' }}</button>
              <button type="button" class="link text-gray-400 hover:text-red-600" :disabled="sectionAction.busy.value" @click="removeSection(s)">Eliminar</button>
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
import { fileToOptimizedDataUrl } from '~/utils/imageFile'
import type { TreeSection, TreeShortLink, TreeSubtopic } from '~/types/recommendationTree'

useHead({ title: 'Subtema de recomendaciones | Admin Planmed' })
definePageMeta({ layout: 'admin' })

const GROUPS = { general: 'General', cuidados: 'Cuidados', revision: 'Revisión' } as const

const route = useRoute()
const notify = useNotify()
const infoAction = useTreeAction()
const introAction = useTreeAction()
const imageAction = useTreeAction()
const sectionAction = useTreeAction()

const topicId = computed(() => Number(route.params.topic))
const subId = computed(() => Number(route.params.subtopic))
const topicUrl = computed(() => `/admin/recomendaciones/temas/${topicId.value}`)
const subtopicUrl = computed(() => `${topicUrl.value}/subtemas/${subId.value}`)

const sub = ref<TreeSubtopic | null>(null)
const sections = ref<TreeSection[]>([])
const shortLink = ref<TreeShortLink | null>(null)
const shortLinkError = ref('')
const loaded = ref(false)
const loadError = ref<TreeErrorInfo | null>(null)
const rowError = ref<TreeErrorInfo | null>(null)

const editingInfo = ref(false)
const info = reactive({ title: '', menu_label: '', grupo: 'general' })
const intro = reactive({ content: '', video_url: '' })
const saved = reactive({ content: '', video_url: '' })
// Cambia al recargar la introducción para reiniciar el editor con el valor guardado.
const introVersion = ref(0)
const copied = ref(false)

const crumbs = computed(() => [
  { label: 'Recomendaciones', to: '/admin/recomendaciones/temas' },
  { label: sub.value?.topic?.title ?? 'Tema', to: topicUrl.value },
  { label: sub.value?.title ?? 'Subtema' }
])

const infoField = (name: string) => infoAction.error.value?.fields[name] ?? null
const introField = (name: string) => introAction.error.value?.fields[name] ?? null
const introDirty = computed(() => intro.content !== saved.content || intro.video_url !== saved.video_url)

const summary = (s: TreeSection) => s.type === 'recommendations'
  ? `${s.items_count} ${s.items_count === 1 ? 'recomendación' : 'recomendaciones'}${s.items_count ? ` (${s.published_items_count} publicadas)` : ''}`
  : ([s.content ? 'Texto' : null, s.image_url ? 'Imagen' : null, s.video_url ? 'Vídeo' : null, s.cta ? 'Botón' : null].filter(Boolean).join(' · ') || 'Sin contenido')

function syncIntro() {
  intro.content = sub.value?.intro.content ?? ''
  intro.video_url = sub.value?.intro.video_url ?? ''
  saved.content = intro.content
  saved.video_url = intro.video_url
  introVersion.value++
}

async function load() {
  loadError.value = null
  if (![topicId.value, subId.value].every(n => Number.isSafeInteger(n) && n > 0)) {
    loadError.value = describeTreeError({ statusCode: 404 })
    loaded.value = true
    return
  }
  try {
    const [s, list] = await Promise.all([api.getSubtopic(subId.value), api.listSections(subId.value)])
    // Un subtema abierto bajo el tema equivocado no se muestra como si perteneciera a él.
    if (s.topic_id !== topicId.value) throw Object.assign(new Error('El subtema no pertenece a este tema.'), { statusCode: 404 })
    sub.value = s
    sections.value = list
    info.title = s.title
    info.menu_label = s.menu_label
    info.grupo = s.grupo
    syncIntro()
  } catch (e) {
    loadError.value = describeTreeError(e)
    loaded.value = true
    return
  }
  await loadShortLink()
  loaded.value = true
}

// El enlace corto sale de Hub; si no se puede consultar se dice, nunca se inventa una URL.
async function loadShortLink() {
  shortLink.value = null
  shortLinkError.value = ''
  try {
    shortLink.value = await api.getShortLink(subId.value)
  } catch (e) {
    shortLinkError.value = describeTreeError(e).message
  }
}

async function copyShortLink() {
  try {
    await navigator.clipboard.writeText(shortLink.value?.url ?? '')
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    void notify.error('No se pudo copiar el enlace. Cópialo manualmente.')
  }
}

async function saveInfo() {
  const title = info.title.trim()
  const res = await infoAction.run(async () => {
    if (!title) throw Object.assign(new Error('Escribe un título para el subtema.'), { statusCode: 422, fieldErrors: { title: ['Escribe un título para el subtema.'] } })
    return api.updateSubtopic(subId.value, { title, menu_label: info.menu_label.trim() || title, grupo: info.grupo })
  })
  if (!res.ok) return
  editingInfo.value = false
  void notify.success('Datos guardados.')
  await refreshSub()
}

async function togglePublished() {
  if (!sub.value) return
  const publish = !sub.value.published
  const res = await infoAction.run(() => api.updateSubtopic(subId.value, { published: publish }))
  if (!res.ok) return
  void notify.success(publish ? 'Subtema publicado.' : 'Subtema oculto.')
  await refreshSub()
  await loadShortLink()
}

/** Recarga solo los datos del subtema sin pisar lo que se está escribiendo en la introducción. */
async function refreshSub() {
  try {
    const s = await api.getSubtopic(subId.value)
    sub.value = s
    info.title = s.title
    info.menu_label = s.menu_label
    info.grupo = s.grupo
  } catch (e) {
    infoAction.error.value = describeTreeError(e)
  }
}

async function saveIntro() {
  const res = await introAction.run(() => api.updateIntro(subId.value, { content: intro.content, video_url: intro.video_url.trim() === '' ? null : intro.video_url.trim() }))
  if (!res.ok) return
  if (sub.value) sub.value.intro = res.value
  saved.content = res.value.content ?? ''
  saved.video_url = res.value.video_url ?? ''
  intro.video_url = saved.video_url
  void notify.success('Introducción guardada.')
}

async function onIntroImage(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > 10 * 1024 * 1024) return void notify.error('La imagen no puede superar los 10 MB.')
  const res = await imageAction.run(async () => api.setIntroImage(subId.value, await fileToOptimizedDataUrl(file)))
  if (!res.ok) return
  if (sub.value) sub.value.intro = { ...sub.value.intro, image_url: res.value.image_url }
  void notify.success('Imagen guardada.')
}

async function removeIntroImage() {
  const ok = await notify.confirm('¿Quitar la imagen de la introducción?', 'La imagen se elimina de Wellezy Hub.', 'Sí, quitar')
  if (!ok) return
  const res = await imageAction.run(() => api.removeIntroImage(subId.value))
  if (!res.ok) return
  if (sub.value) sub.value.intro = { ...sub.value.intro, image_url: null }
  void notify.success('Imagen eliminada.')
}

async function reloadSections() {
  const [s, list] = await Promise.all([api.getSubtopic(subId.value), api.listSections(subId.value)])
  sub.value = s
  sections.value = list
}

async function toggleVisible(s: TreeSection) {
  rowError.value = null
  const res = await sectionAction.run(() => api.updateSection(s.id, { visible: !s.visible }))
  if (!res.ok) { rowError.value = sectionAction.error.value; return }
  void notify.success(res.value.visible ? 'Sección visible.' : 'Sección oculta.')
  await reloadSections().catch(() => {})
}

async function move(index: number, direction: -1 | 1) {
  rowError.value = null
  const ids = moveId(sections.value.map(s => s.id), index, direction)
  if (!ids) return
  const res = await sectionAction.run(() => api.reorderSections(subId.value, ids))
  if (!res.ok) { rowError.value = sectionAction.error.value; return }
  await reloadSections().catch(() => {})
}

async function removeSection(s: TreeSection) {
  rowError.value = null
  const ok = await notify.confirm(`¿Eliminar la sección «${s.title}»?`, 'Solo se puede eliminar si no tiene recomendaciones. Esta acción no se puede deshacer.', 'Sí, eliminar')
  if (!ok) return
  const res = await sectionAction.run(() => api.deleteSection(s.id))
  if (!res.ok) { rowError.value = sectionAction.error.value; return }
  void notify.success('Sección eliminada.')
  await reloadSections().catch(() => {})
}

onMounted(load)
</script>

<style scoped>
.label { display: block; font-size: .7rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: #374151; margin-bottom: .4rem; }
.field { width: 100%; padding: .65rem .9rem; border: 1px solid #e5e7eb; border-radius: .5rem; background: #f9fafb; font-size: .875rem; }
.field:focus { outline: none; box-shadow: 0 0 0 2px #0C2619; border-color: transparent; }
.field[aria-invalid="true"] { border-color: #dc2626; }
.err { margin-top: .35rem; font-size: .75rem; color: #b91c1c; }
.hint { font-size: .65rem; color: #6b7280; }
.btn { background: #0C2619; color: #fff; padding: .75rem 1.5rem; border-radius: .5rem; font-weight: 700; font-size: .7rem; letter-spacing: .1em; text-transform: uppercase; text-align: center; }
.btn:hover:not(:disabled) { background: #153a28; }
.btn:disabled { opacity: .5; }
.link { font-size: .7rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #0C2619; }
.link:hover:not(:disabled) { color: #D3A76A; }
.link:disabled { opacity: .5; }
.icon-btn { width: 1.6rem; height: 1.6rem; border: 1px solid #e5e7eb; border-radius: .4rem; font-size: .8rem; color: #374151; }
.icon-btn:hover:not(:disabled) { background: #f3f4f6; }
.icon-btn:disabled { opacity: .35; }
</style>

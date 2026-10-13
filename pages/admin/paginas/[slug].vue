<template>
  <div>
    <div class="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h2 class="text-3xl font-serif text-[#0C2619] mb-2 uppercase">{{ meta.title }}</h2>
        <p class="text-gray-500 font-light">Contenido de la página pública «{{ meta.title }}». Se guarda en el servidor de la web de Planmed.</p>
      </div>
      <NuxtLink :to="meta.route" target="_blank" class="text-xs font-bold tracking-widest uppercase text-[#0C2619] underline underline-offset-4">Ver página pública</NuxtLink>
    </div>

    <div v-if="loading" class="bg-white border border-gray-200 rounded-xl p-8 text-gray-500">Cargando contenido…</div>

    <div v-else-if="loadError" role="alert" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
      <p class="font-semibold">No se pudo cargar el contenido.</p>
      <p class="mt-1">{{ loadError }}</p>
      <button type="button" class="mt-3 underline" @click="load">Reintentar</button>
    </div>

    <form v-else-if="form" class="space-y-8" novalidate @submit.prevent="save">
      <div v-if="saveError" role="alert" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
        <p class="font-semibold">No se guardaron los cambios.</p>
        <p class="mt-1">{{ saveError }}</p>
        <p class="mt-1 text-xs opacity-80">Tus cambios siguen en pantalla.</p>
      </div>

      <section class="bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-5">
        <div>
          <label class="lbl" for="page-title">Título</label>
          <input id="page-title" v-model="form.title" class="inp" maxlength="200" :aria-invalid="!!errors.title" />
          <p v-if="errors.title" class="msg">{{ errors.title }}</p>
        </div>
        <div>
          <label class="lbl" for="page-subtitle">Subtítulo (opcional)</label>
          <input id="page-subtitle" v-model="form.subtitle" class="inp" maxlength="300" :aria-invalid="!!errors.subtitle" />
          <p v-if="errors.subtitle" class="msg">{{ errors.subtitle }}</p>
        </div>
        <div>
          <label class="lbl">Contenido</label>
          <AdminRichTextEditor v-model="form.body" min-height="20rem" />
          <p class="hint">Si lo dejas vacío, la página muestra «Contenido próximamente».</p>
          <p v-if="errors.body" class="msg">{{ errors.body }}</p>
        </div>
      </section>

      <div class="fixed bottom-0 inset-x-0 md:left-64 bg-white/95 backdrop-blur border-t border-gray-200 px-6 py-4 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p class="text-xs min-h-[1.25rem]" aria-live="polite">
          <span v-if="saving" class="text-gray-500">Guardando…</span>
          <span v-else-if="Object.keys(errors).length" class="text-red-700 font-semibold">Hay campos por corregir.</span>
          <span v-else-if="dirty" class="text-amber-700 font-semibold">Textos con cambios sin guardar.</span>
          <span v-else-if="savedAt" class="text-emerald-700">Textos guardados a las {{ savedAt }}. Ya son visibles en la página pública.</span>
          <span v-else class="text-gray-400">Sin cambios.</span>
        </p>
        <button type="submit" :disabled="!dirty || saving" class="bg-[#0C2619] hover:bg-[#153a28] text-white px-8 py-3 rounded-lg font-bold text-xs tracking-widest uppercase disabled:opacity-50 shadow-lg">
          {{ saving ? 'Guardando…' : 'Guardar textos' }}
        </button>
      </div>
    </form>

    <div v-if="form" class="pb-28" :class="slug === 'clinicas-aliadas' ? 'mt-12' : ''">
      <AdminClinicsManager v-if="slug === 'clinicas-aliadas'" @dirty="clinicsDirty = $event" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useHead, useRoute, createError } from '#imports'
import { sitePagesService } from '~/services/SitePagesService'
import { SITE_PAGES, isSitePageSlug, normalizeSitePage, validateSitePage, type SitePageContent, type SitePageErrors } from '#shared/utils/sitePages'

definePageMeta({ layout: 'admin' })

const rawSlug = useRoute().params.slug
if (!isSitePageSlug(rawSlug)) throw createError({ statusCode: 404, statusMessage: 'Página no encontrada', fatal: true })
const slug = rawSlug
const meta = SITE_PAGES[slug]
useHead({ title: `${meta.title} | Admin Planmed` })

const notify = useNotify()
const form = ref<SitePageContent | null>(null)
const snapshot = ref('')
const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const saveError = ref('')
const savedAt = ref('')
const errors = ref<SitePageErrors>({})

const clinicsDirty = ref(false)
const textDirty = computed(() => JSON.stringify(form.value) !== snapshot.value)
const dirty = textDirty

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await sitePagesService.getPage(slug)
    form.value = data
    snapshot.value = JSON.stringify(data)
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!form.value || saving.value || !dirty.value) return
  saveError.value = ''
  const normalized = normalizeSitePage(form.value, form.value)
  errors.value = validateSitePage(normalized)
  if (Object.keys(errors.value).length) {
    saveError.value = 'Corrige los campos marcados antes de guardar.'
    return
  }
  saving.value = true
  try {
    const saved = await sitePagesService.savePage(slug, normalized)
    form.value = saved
    snapshot.value = JSON.stringify(saved)
    savedAt.value = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    notify.success(`«${meta.title}» guardada`)
  } catch (e: any) {
    errors.value = e.errors ?? {}
    saveError.value = e.message
  } finally {
    saving.value = false
  }
}

function beforeUnload(e: BeforeUnloadEvent) {
  if (textDirty.value || clinicsDirty.value) { e.preventDefault(); e.returnValue = '' }
}

onMounted(() => { load(); window.addEventListener('beforeunload', beforeUnload) })
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
</script>

<style scoped>
.lbl { display: block; font-size: 10px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: #6b7280; margin-bottom: .5rem; }
.inp { width: 100%; padding: .5rem .75rem; background: #fff; border: 1px solid #e5e7eb; border-radius: .375rem; font-size: .875rem; }
.inp:focus { outline: none; box-shadow: 0 0 0 1px #0C2619; }
.inp[aria-invalid='true'] { border-color: #dc2626; }
.msg { margin-top: .375rem; font-size: .75rem; color: #b91c1c; }
.hint { margin-top: .5rem; font-size: 10px; color: #6b7280; }
</style>

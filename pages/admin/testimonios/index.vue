<template>
  <div class="pb-24">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h2 class="text-3xl font-serif text-[#0C2619] mb-1 uppercase">Nuestros Pacientes</h2>
        <p class="text-gray-500 font-light">Administra el contenido de la sección de testimonios.</p>
      </div>
      <button
        @click="save"
        :disabled="isSaving || !loaded"
        class="bg-[#0C2619] hover:bg-[#153a28] text-white px-8 py-3 rounded-lg font-bold text-xs tracking-widest uppercase transition-colors disabled:opacity-50 shadow-lg"
      >
        {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
      </button>
    </div>

    <!-- Selector de sección -->
    <div class="flex flex-wrap gap-2 mb-8 border-b border-gray-200">
      <button
        v-for="t in tabs" :key="t.key" type="button" @click="tab = t.key"
        class="px-5 py-3 text-xs font-bold tracking-widest uppercase border-b-2 -mb-px transition-colors"
        :class="tab === t.key ? 'border-[#0C2619] text-[#0C2619]' : 'border-transparent text-gray-400 hover:text-gray-700'"
      >
        {{ t.label }}
      </button>
    </div>

    <div v-if="!loaded" class="text-gray-400 text-sm">Cargando...</div>

    <template v-else>
      <!-- Publicación de la vista (solo Videos y Antes y después) -->
      <div v-if="tab !== 'referral'" class="mb-6">
        <label class="flex items-center gap-3 cursor-pointer w-fit">
          <input type="checkbox" v-model="content.visibility[tab]" class="sr-only peer" />
          <span class="w-11 h-6 rounded-full bg-gray-300 peer-checked:bg-[#0C2619] relative transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5"></span>
          <span class="text-sm font-bold text-gray-700">{{ content.visibility[tab] ? 'Publicado' : 'Oculto al público' }}</span>
        </label>
        <p class="text-xs text-gray-400 mt-1">Al ocultarlo, esta vista deja de mostrarse en el sitio y desaparece del menú. El contenido se conserva. Recuerda guardar los cambios.</p>
      </div>

      <!-- VIDEOS -->
      <section v-if="tab === 'videos'" class="space-y-4">
        <p class="text-sm text-gray-500">Pega el enlace del video de YouTube (youtube.com, youtu.be o Shorts). Se mostrarán en la página "Pacientes felices".</p>

        <div v-for="(v, i) in content.videos" :key="v.id" class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 grid md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Título (opcional)</label>
            <input v-model="v.title" type="text" class="field" placeholder="Ej: Entrevista con Jessica" />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Enlace de YouTube *</label>
            <input v-model="v.url" type="url" class="field" placeholder="https://www.youtube.com/watch?v=..." />
          </div>
          <div class="flex gap-1 items-center">
            <label class="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer select-none mr-2"><input type="checkbox" v-model="v.active" class="accent-[#0C2619]" /> Visible</label>
            <button type="button" @click="move(content.videos, i, -1)" :disabled="i === 0" class="icon-btn" title="Subir">↑</button>
            <button type="button" @click="move(content.videos, i, 1)" :disabled="i === content.videos.length - 1" class="icon-btn" title="Bajar">↓</button>
            <button type="button" @click="remove(content.videos, i, 'este video')" class="icon-btn hover:!text-red-600 hover:!bg-red-50" title="Eliminar">✕</button>
          </div>
        </div>

        <button type="button" @click="content.videos.push({ id: uid(), title: '', url: '', active: true })" class="add-btn">+ Agregar video</button>
      </section>

      <!-- ANTES Y DESPUÉS -->
      <section v-else-if="tab === 'beforeAfter'" class="space-y-4">
        <p class="text-sm text-gray-500">Cada caso lleva un título y una foto del antes y otra del después. Las imágenes se optimizan automáticamente.</p>

        <div v-for="(c, i) in content.beforeAfter" :key="c.id" class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div class="grid md:grid-cols-2 gap-6 mb-6">
            <div v-for="side in sides" :key="side.key">
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">{{ side.label }} *</label>
              <label class="block aspect-[3/4] max-w-[220px] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-[#0C2619] bg-gray-50 relative">
                <img v-if="c[side.key]" :src="c[side.key]" :alt="side.label" class="w-full h-full object-cover" />
                <span v-else class="absolute inset-0 flex items-center justify-center text-xs text-gray-400 text-center px-3">Haz clic para subir la foto</span>
                <input type="file" accept="image/*" class="hidden" @change="onImage($event, c, side.key)" />
              </label>
            </div>
          </div>
          <div class="grid md:grid-cols-[1fr_2fr_auto] gap-4 items-end">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Título *</label>
              <input v-model="c.title" type="text" maxlength="255" class="field" placeholder="Ej: Lipoescultura" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Descripción (opcional)</label>
              <input v-model="c.description" type="text" class="field" />
            </div>
            <div class="flex gap-1 items-center">
              <label class="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer select-none mr-2"><input type="checkbox" v-model="c.published" class="accent-[#0C2619]" /> Publicado</label>
              <button type="button" @click="move(content.beforeAfter, i, -1)" :disabled="i === 0" class="icon-btn" title="Subir">↑</button>
              <button type="button" @click="move(content.beforeAfter, i, 1)" :disabled="i === content.beforeAfter.length - 1" class="icon-btn" title="Bajar">↓</button>
              <button type="button" @click="remove(content.beforeAfter, i, 'este caso')" class="icon-btn hover:!text-red-600 hover:!bg-red-50" title="Eliminar">✕</button>
            </div>
          </div>
        </div>

        <button type="button" @click="content.beforeAfter.push({ id: uid(), title: '', description: '', beforeImage: '', afterImage: '', published: true })" class="add-btn">+ Agregar caso</button>

        <!-- Videos de Instagram -->
        <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase pt-8 border-t border-gray-200">Videos de Instagram</h3>
        <p class="text-sm text-gray-500">Pega el enlace de cada publicación o reel de Instagram (instagram.com/reel/... o instagram.com/p/...). Aparecen debajo de la galería.</p>

        <div v-for="(p, i) in content.instagram" :key="p.id" class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 grid md:grid-cols-[1fr_auto] gap-4 items-end">
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Enlace de Instagram *</label>
            <input v-model="p.url" type="url" class="field" placeholder="https://www.instagram.com/reel/..." />
          </div>
          <div class="flex gap-1 items-center">
            <label class="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer select-none mr-2"><input type="checkbox" v-model="p.active" class="accent-[#0C2619]" /> Visible</label>
            <button type="button" @click="move(content.instagram, i, -1)" :disabled="i === 0" class="icon-btn" title="Subir">↑</button>
            <button type="button" @click="move(content.instagram, i, 1)" :disabled="i === content.instagram.length - 1" class="icon-btn" title="Bajar">↓</button>
            <button type="button" @click="remove(content.instagram, i, 'este video de Instagram')" class="icon-btn hover:!text-red-600 hover:!bg-red-50" title="Eliminar">✕</button>
          </div>
        </div>

        <button type="button" @click="content.instagram.push({ id: uid(), url: '', active: true })" class="add-btn">+ Agregar video de Instagram</button>
      </section>

      <!-- PROGRAMA DE REFERIDOS -->
      <section v-else class="bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-6">
        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Título de la página</label>
          <input v-model="content.referral.title" type="text" class="field" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Contenido</label>
          <AdminRichTextEditor v-model="content.referral.content" min-height="20rem" />
          <p class="text-[10px] text-gray-500 mt-2">Usa la barra de herramientas para dar formato: títulos, listas, negrita, cursiva y enlaces.</p>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useHead } from '#imports'
import { testimonialsService } from '~/services/TestimonialsService'
import { fileToOptimizedDataUrl } from '~/utils/imageFile'
import type { BeforeAfterCase, TestimonialsContent } from '~/types/testimonials'

useHead({ title: 'Nuestros Pacientes | Admin Planmed' })
definePageMeta({ layout: 'admin' })

const notify = useNotify()

const tabs = [
  { key: 'videos', label: 'Videos' },
  { key: 'beforeAfter', label: 'Antes y después' },
  { key: 'referral', label: 'Programa de referidos' }
] as const
const sides = [
  { key: 'beforeImage', label: 'Foto antes' },
  { key: 'afterImage', label: 'Foto después' }
] as const

const tab = ref<(typeof tabs)[number]['key']>('videos')
const content = ref<TestimonialsContent>({
  visibility: { videos: true, beforeAfter: true },
  videos: [],
  beforeAfter: [],
  instagram: [],
  referral: { title: '', content: '' }
})
const loaded = ref(false)
const isSaving = ref(false)

// Id temporal de un elemento nuevo del formulario. El prefijo impide confundirlo con un id numérico de Hub (el servidor crea el registro).
const uid = () => `new-${Math.random().toString(36).slice(2, 10)}`

onMounted(async () => {
  try {
    content.value = await testimonialsService.getContent()
    loaded.value = true
  } catch (err: any) {
    notify.error(err.message || 'No fue posible cargar el contenido.')
  }
})

function move<T>(list: T[], i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= list.length) return
  ;[list[i], list[j]] = [list[j]!, list[i]!]
}

async function remove<T>(list: T[], i: number, what: string) {
  if (await notify.confirm(`¿Eliminar ${what}?`, 'Se aplicará al guardar los cambios.', 'Sí, eliminar')) list.splice(i, 1)
}

async function onImage(e: Event, c: BeforeAfterCase, key: 'beforeImage' | 'afterImage') {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > 10 * 1024 * 1024) return notify.error('La imagen no puede superar los 10 MB.')
  try {
    c[key] = await fileToOptimizedDataUrl(file)
  } catch (err: any) {
    notify.error(err.message)
  }
}

const YOUTUBE_RE = /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i
const INSTAGRAM_RE = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv)\//i

async function save() {
  const c = content.value
  if (c.videos.some(v => !v.url.trim())) return notify.error('Completa el enlace de todos los videos o elimina los vacíos.', 'Falta información')
  if (c.videos.some(v => !YOUTUBE_RE.test(v.url.trim()))) return notify.error('Solo se admiten enlaces de YouTube.', 'Enlace no válido')
  if (c.beforeAfter.some(x => !x.title.trim())) return notify.error('Cada caso necesita un título.', 'Falta información')
  if (c.beforeAfter.some(x => x.published !== false && (!x.beforeImage || !x.afterImage))) return notify.error('Cada caso publicado necesita la foto del antes y la del después.', 'Falta información')
  if (c.instagram.some(p => !p.url.trim())) return notify.error('Completa el enlace de todos los videos de Instagram o elimina los vacíos.', 'Falta información')
  if (c.instagram.some(p => !INSTAGRAM_RE.test(p.url.trim()))) return notify.error('Usa enlaces de publicaciones o reels de Instagram.', 'Enlace no válido')

  isSaving.value = true
  try {
    c.videos.forEach(v => { v.url = v.url.trim() })
    c.instagram.forEach(p => { p.url = p.url.trim() })
    content.value = await testimonialsService.saveContent(c)
    notify.success('Cambios guardados correctamente')
  } catch (err: any) {
    // Guardado parcial: Hub conservó parte de los cambios. El formulario se sincroniza con lo guardado (ids reales; un reintento
    // no elimina y recrea lo ya creado) y el aviso deja claro que NO todo falló.
    if (err.partial) {
      if (err.content) content.value = err.content
      notify.warning(err.message)
    } else {
      notify.error(err.message || 'Ocurrió un error al guardar.')
    }
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.field { width: 100%; padding: .65rem .9rem; border: 1px solid #e5e7eb; border-radius: .5rem; background: #f9fafb; font-size: .875rem; }
.field:focus { outline: none; box-shadow: 0 0 0 2px #0C2619; border-color: transparent; }
.icon-btn { padding: .5rem .75rem; border-radius: .5rem; background: #f9fafb; color: #9ca3af; font-size: .875rem; transition: all .15s; }
.icon-btn:hover:not(:disabled) { color: #0C2619; background: #f3f4f6; }
.icon-btn:disabled { opacity: .3; cursor: default; }
.add-btn { padding: .75rem 1.5rem; border: 2px dashed #d1d5db; border-radius: .75rem; font-size: .75rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #0C2619; width: 100%; transition: all .15s; }
.add-btn:hover { border-color: #0C2619; background: #0C26190d; }
</style>

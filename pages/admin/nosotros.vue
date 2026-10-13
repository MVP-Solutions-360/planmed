<template>
  <div>
    <div class="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h2 class="text-3xl font-serif text-[#0C2619] mb-2 uppercase">Página Nosotros</h2>
        <p class="text-gray-500 font-light">Contenido de la página pública «Nosotros». Se guarda en el servidor de la web de Planmed.</p>
      </div>
      <NuxtLink to="/nosotros" target="_blank" class="text-xs font-bold tracking-widest uppercase text-[#0C2619] underline underline-offset-4">Ver página pública</NuxtLink>
    </div>

    <div v-if="loading" class="bg-white border border-gray-200 rounded-xl p-8 text-gray-500">Cargando contenido…</div>

    <div v-else-if="loadError" role="alert" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
      <p class="font-semibold">No se pudo cargar el contenido.</p>
      <p class="mt-1">{{ loadError }}</p>
      <button type="button" class="mt-3 underline" @click="load">Reintentar</button>
    </div>

    <form v-else-if="form" class="space-y-8 pb-28" novalidate @submit.prevent="save">
      <div v-if="saveError" role="alert" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
        <p class="font-semibold">No se guardaron los cambios.</p>
        <p class="mt-1">{{ saveError }}</p>
        <p class="mt-1 text-xs opacity-80">Tus cambios siguen en pantalla.</p>
      </div>

      <!-- Portada -->
      <section class="card">
        <h3 class="card-title">Portada</h3>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="space-y-5">
            <div>
              <label class="lbl" for="hero-title">Título</label>
              <input id="hero-title" v-model="form.hero.title" class="inp" maxlength="200" :aria-invalid="!!err('hero.title')" />
              <p v-if="err('hero.title')" class="msg">{{ err('hero.title') }}</p>
            </div>
            <div>
              <label class="lbl" for="hero-alt">Descripción de la imagen (accesibilidad)</label>
              <input id="hero-alt" v-model="form.hero.imageAlt" class="inp" maxlength="200" :aria-invalid="!!err('hero.imageAlt')" />
              <p v-if="err('hero.imageAlt')" class="msg">{{ err('hero.imageAlt') }}</p>
            </div>
          </div>
          <div>
            <p class="lbl">Imagen</p>
            <div class="w-full aspect-[16/7] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <img v-if="form.hero.image" :src="form.hero.image" :alt="form.hero.imageAlt" class="w-full h-full object-cover" />
            </div>
            <input ref="imageInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onImage" />
            <button type="button" class="mt-3 px-4 py-3 bg-[#0C2619] text-white text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-[#143c28] disabled:opacity-60" :disabled="processingImage" @click="imageInput?.click()">
              {{ processingImage ? 'Procesando…' : 'Cambiar imagen' }}
            </button>
            <p class="hint">JPG, PNG o WebP, máximo 5 MB. Se optimiza automáticamente. Recomendado: formato horizontal.</p>
            <p v-if="err('hero.image')" class="msg">{{ err('hero.image') }}</p>
          </div>
        </div>
      </section>

      <!-- Institucional -->
      <section class="card">
        <h3 class="card-title">Información institucional</h3>
        <div class="space-y-5">
          <div>
            <label class="lbl" for="inst-title">Título institucional</label>
            <input id="inst-title" v-model="form.institutional.title" class="inp" maxlength="200" :aria-invalid="!!err('institutional.title')" />
            <p v-if="err('institutional.title')" class="msg">{{ err('institutional.title') }}</p>
          </div>
          <div>
            <label class="lbl">Descripción legal e institucional</label>
            <AdminRichTextEditor id="inst-legal" v-model="form.institutional.legal" min-height="6rem" />
            <p v-if="err('institutional.legal')" class="msg">{{ err('institutional.legal') }}</p>
          </div>
          <div v-for="(_, i) in form.institutional.paragraphs" :key="i">
            <label class="lbl">Párrafo {{ i + 1 }}</label>
            <AdminRichTextEditor v-model="form.institutional.paragraphs[i]" min-height="8rem" />
            <p v-if="err(`institutional.paragraphs.${i}`)" class="msg">{{ err(`institutional.paragraphs.${i}`) }}</p>
          </div>
        </div>
      </section>

      <!-- Video -->
      <section class="card">
        <h3 class="card-title">Video institucional</h3>
        <label class="lbl" for="video-url">Enlace de YouTube</label>
        <input id="video-url" v-model="form.video.url" class="inp" inputmode="url" placeholder="https://www.youtube.com/watch?v=…" :aria-invalid="!!err('video.url')" />
        <p v-if="err('video.url')" class="msg">{{ err('video.url') }}</p>
        <p v-else-if="!videoId" class="msg">El enlace no es un video de YouTube válido.</p>
        <div v-if="videoId" class="mt-4 max-w-md aspect-video relative overflow-hidden rounded-lg border border-gray-200 bg-black">
          <iframe :src="aboutYoutubeEmbedUrl(videoId)" class="absolute inset-0 w-full h-full" title="Vista previa del video" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        </div>
      </section>

      <!-- FAQs -->
      <section class="card">
        <div class="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
          <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase">Preguntas frecuentes</h3>
          <button type="button" class="px-4 py-2 border border-[#0C2619] text-[#0C2619] text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-[#0C2619]/5 disabled:opacity-50" :disabled="form.faqs.length >= ABOUT_LIMITS.faqs" @click="addFaq">Agregar pregunta</button>
        </div>
        <p v-if="!form.faqs.length" class="text-sm text-gray-500">No hay preguntas. La sección no se mostrará en la página pública.</p>
        <ol class="space-y-5">
          <li v-for="(faq, i) in form.faqs" :key="faq.id" class="border border-gray-200 rounded-lg p-5" :class="faq.active ? '' : 'bg-gray-50'">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p class="text-xs font-bold tracking-widest uppercase text-gray-500">Pregunta {{ i + 1 }} <span v-if="!faq.active" class="ml-2 text-amber-700">(oculta)</span></p>
              <div class="flex flex-wrap items-center gap-2">
                <button type="button" class="btn-sm" :disabled="i === 0" :aria-label="`Subir pregunta ${i + 1}`" @click="move(i, -1)">Subir</button>
                <button type="button" class="btn-sm" :disabled="i === form.faqs.length - 1" :aria-label="`Bajar pregunta ${i + 1}`" @click="move(i, 1)">Bajar</button>
                <label class="btn-sm cursor-pointer flex items-center gap-2"><input v-model="faq.active" type="checkbox" /> Activa</label>
                <button type="button" class="btn-sm text-red-700" @click="removeFaq(i)">Eliminar</button>
              </div>
            </div>
            <label class="lbl" :for="`faq-q-${faq.id}`">Pregunta</label>
            <input :id="`faq-q-${faq.id}`" v-model="faq.question" class="inp" maxlength="300" :aria-invalid="!!err(`faqs.${i}.question`)" />
            <p v-if="err(`faqs.${i}.question`)" class="msg">{{ err(`faqs.${i}.question`) }}</p>
            <label class="lbl mt-4">Respuesta</label>
            <AdminRichTextEditor v-model="faq.answer" min-height="5rem" />
            <p v-if="err(`faqs.${i}.answer`)" class="msg">{{ err(`faqs.${i}.answer`) }}</p>
          </li>
        </ol>
        <p v-if="err('faqs')" class="msg">{{ err('faqs') }}</p>
      </section>

      <!-- Contacto -->
      <section class="card">
        <h3 class="card-title">Contacto</h3>
        <div class="grid md:grid-cols-2 gap-5">
          <div v-for="f in contactFields" :key="f.key" :class="f.wide ? 'md:col-span-2' : ''">
            <label class="lbl" :for="f.multiline ? undefined : `c-${f.key}`">{{ f.label }}</label>
            <template v-if="f.multiline"><AdminRichTextEditor v-model="(form.contact as any)[f.key]" min-height="5rem" /><p class="hint">{{ f.placeholder }}</p></template>
            <input v-else :id="`c-${f.key}`" v-model="(form.contact as any)[f.key]" class="inp" :type="f.type ?? 'text'" :aria-invalid="!!err(`contact.${f.key}`)" />
            <p v-if="err(`contact.${f.key}`)" class="msg">{{ err(`contact.${f.key}`) }}</p>
          </div>
          <div v-for="n in ABOUT_SOCIAL_NETWORKS" :key="n">
            <label class="lbl" :for="`c-social-${n}`">{{ socialLabel[n] }} (enlace https del perfil)</label>
            <input :id="`c-social-${n}`" v-model="form.contact.socials[n]" class="inp" inputmode="url" :aria-invalid="!!err(`contact.socials.${n}`)" />
            <p v-if="err(`contact.socials.${n}`)" class="msg">{{ err(`contact.socials.${n}`) }}</p>
          </div>
          <div class="md:col-span-2">
            <label class="flex items-start gap-3 cursor-pointer">
              <input v-model="form.contact.map.enabled" type="checkbox" class="mt-1" />
              <span>
                <span class="text-sm font-bold text-gray-900">Mostrar mapa</span>
                <span class="block hint">Se genera únicamente a partir de la dirección y la ciudad guardadas arriba.</span>
              </span>
            </label>
            <p v-if="err('contact.map')" class="msg">{{ err('contact.map') }}</p>
          </div>
        </div>
      </section>

      <!-- Barra de guardado -->
      <div class="fixed bottom-0 inset-x-0 md:left-64 bg-white/95 backdrop-blur border-t border-gray-200 px-6 py-4 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p class="text-xs min-h-[1.25rem]" aria-live="polite">
          <span v-if="saving" class="text-gray-500">Guardando…</span>
          <span v-else-if="errorCount" class="text-red-700 font-semibold">Hay {{ errorCount }} campo(s) por corregir.</span>
          <span v-else-if="dirty" class="text-amber-700 font-semibold">Cambios sin guardar.</span>
          <span v-else-if="savedAt" class="text-emerald-700">Guardado a las {{ savedAt }}. Ya es visible en la página pública.</span>
          <span v-else class="text-gray-400">Sin cambios.</span>
        </p>
        <button type="submit" :disabled="!dirty || saving" class="bg-[#0C2619] hover:bg-[#153a28] text-white px-8 py-3 rounded-lg font-bold text-xs tracking-widest uppercase disabled:opacity-50 shadow-lg">
          {{ saving ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useHead } from '#imports'
import { aboutService } from '~/services/AboutService'
import {
  ABOUT_LIMITS, ABOUT_SOCIAL_NETWORKS, aboutYoutubeId, aboutYoutubeEmbedUrl, normalizeAboutContent, validateAboutContent,
  type AboutContent, type AboutErrors, type AboutSocialNetwork
} from '#shared/utils/aboutContent'

useHead({ title: 'Nosotros | Admin Planmed' })
definePageMeta({ layout: 'admin' })

const notify = useNotify()

const form = ref<AboutContent | null>(null)
const snapshot = ref('')
const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const saveError = ref('')
const savedAt = ref('')
const errors = ref<AboutErrors>({})
const processingImage = ref(false)
const imageInput = ref<HTMLInputElement | null>(null)

const socialLabel: Record<AboutSocialNetwork, string> = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok' }
const contactFields: { key: string, label: string, type?: string, placeholder?: string, wide?: boolean, multiline?: boolean }[] = [
  { key: 'address', label: 'Dirección' },
  { key: 'building', label: 'Edificio' },
  { key: 'city', label: 'Ciudad' },
  { key: 'region', label: 'Departamento y país' },
  { key: 'phone', label: 'Teléfono', type: 'tel' },
  { key: 'email', label: 'Correo electrónico', type: 'email' },
  { key: 'schedule', label: 'Horario de atención', multiline: true, wide: true, placeholder: 'Déjalo vacío si no hay un horario validado: no se mostrará.' }
]

const serialize = (c: AboutContent | null) => JSON.stringify(c)
const dirty = computed(() => serialize(form.value) !== snapshot.value)
const errorCount = computed(() => Object.keys(errors.value).length)
const videoId = computed(() => (form.value ? aboutYoutubeId(form.value.video.url) : null))
const err = (key: string) => errors.value[key]

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await aboutService.getContent()
    form.value = data
    snapshot.value = serialize(data)
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
}

function addFaq() {
  if (!form.value) return
  const used = new Set(form.value.faqs.map(f => f.id))
  let n = form.value.faqs.length + 1
  while (used.has(`faq-${n}`)) n++
  form.value.faqs.push({ id: `faq-${n}`, question: '', answer: '', active: true })
}

function removeFaq(i: number) {
  form.value?.faqs.splice(i, 1)
}

function move(i: number, delta: number) {
  const list = form.value?.faqs
  if (!list) return
  const j = i + delta
  if (j < 0 || j >= list.length) return
  const [item] = list.splice(i, 1)
  list.splice(j, 0, item!)
}

function fileToOptimizedDataUrl(file: File, maxSize = 2000, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('El archivo no es una imagen válida.'))
      img.onload = () => {
        const ratio = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

async function onImage(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !form.value) return
  if (file.size > 10 * 1024 * 1024) {
    notify.error('La imagen no puede superar los 10 MB.')
    input.value = ''
    return
  }
  processingImage.value = true
  try {
    form.value.hero.image = await fileToOptimizedDataUrl(file)
    delete errors.value['hero.image']
  } catch (err: any) {
    notify.error(err.message)
  } finally {
    processingImage.value = false
    input.value = ''
  }
}

async function save() {
  if (!form.value || saving.value || !dirty.value) return
  saveError.value = ''
  const normalized = normalizeAboutContent(form.value, form.value)
  errors.value = validateAboutContent(normalized)
  if (Object.keys(errors.value).length) {
    saveError.value = 'Corrige los campos marcados antes de guardar.'
    return
  }
  saving.value = true
  try {
    const saved = await aboutService.saveContent(normalized)
    form.value = saved
    snapshot.value = serialize(saved)
    savedAt.value = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    notify.success('Página «Nosotros» guardada')
  } catch (e: any) {
    errors.value = e.errors ?? {}
    saveError.value = e.message
  } finally {
    saving.value = false
  }
}

function beforeUnload(e: BeforeUnloadEvent) {
  if (dirty.value) { e.preventDefault(); e.returnValue = '' }
}

onMounted(() => { load(); window.addEventListener('beforeunload', beforeUnload) })
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
</script>

<style scoped>
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: .75rem; box-shadow: 0 1px 2px rgb(0 0 0 / .05); padding: 2rem; }
.card-title { font-size: .75rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #0C2619; border-bottom: 1px solid #f3f4f6; padding-bottom: 1rem; margin-bottom: 1.5rem; }
.lbl { display: block; font-size: 10px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: #6b7280; margin-bottom: .5rem; }
.inp { width: 100%; padding: .5rem .75rem; background: #fff; border: 1px solid #e5e7eb; border-radius: .375rem; font-size: .875rem; }
.inp:focus { outline: none; box-shadow: 0 0 0 1px #0C2619; }
.inp[aria-invalid='true'] { border-color: #dc2626; }
.msg { margin-top: .375rem; font-size: .75rem; color: #b91c1c; }
.hint { margin-top: .5rem; font-size: 10px; color: #6b7280; }
.btn-sm { padding: .375rem .75rem; border: 1px solid #e5e7eb; border-radius: .5rem; font-size: .75rem; font-weight: 600; color: #374151; background: #fff; }
.btn-sm:hover:not(:disabled) { background: #f9fafb; }
.btn-sm:disabled { opacity: .4; }
</style>

<template>
  <section class="space-y-6" aria-labelledby="clinics-title">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 id="clinics-title" class="text-xl font-serif text-[#0C2619] uppercase">Clínicas</h3>
        <p class="text-sm text-gray-500 font-light">Cada clínica se muestra como una tarjeta en la página pública. Las nuevas se agregan arriba. Se guardan con su propio botón.</p>
      </div>
      <button type="button" class="px-4 py-2 border border-[#0C2619] text-[#0C2619] text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-[#0C2619]/5 disabled:opacity-50" :disabled="!form || form.clinics.length >= CLINIC_LIMITS.clinics" @click="addClinic">Agregar clínica</button>
    </div>

    <div v-if="loading" class="bg-white border border-gray-200 rounded-xl p-8 text-gray-500">Cargando clínicas…</div>
    <div v-else-if="loadError" role="alert" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
      <p class="font-semibold">No se pudieron cargar las clínicas.</p>
      <p class="mt-1">{{ loadError }}</p>
      <button type="button" class="mt-3 underline" @click="load">Reintentar</button>
    </div>

    <template v-else-if="form">
      <div v-if="saveError" role="alert" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
        <p class="font-semibold">No se guardaron las clínicas.</p>
        <p class="mt-1">{{ saveError }}</p>
        <p class="mt-1 text-xs opacity-80">Tus cambios siguen en pantalla.</p>
      </div>

      <p v-if="!form.clinics.length" class="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-sm text-gray-500">Aún no hay clínicas. Usa «Agregar clínica». Mientras no haya ninguna, la página pública no muestra la sección.</p>

      <article v-for="(c, i) in form.clinics" :key="c.id" class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-8 space-y-6" :aria-label="`Clínica ${i + 1}`">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <h4 class="text-xs font-bold tracking-widest uppercase text-[#0C2619]">Clínica {{ i + 1 }}<span v-if="c.name" class="text-gray-400 normal-case tracking-normal font-normal"> — {{ c.name }}</span></h4>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn-sm" :disabled="i === 0" :aria-label="`Subir clínica ${i + 1}`" @click="move(i, -1)">Subir</button>
            <button type="button" class="btn-sm" :disabled="i === form.clinics.length - 1" :aria-label="`Bajar clínica ${i + 1}`" @click="move(i, 1)">Bajar</button>
            <button type="button" class="btn-sm text-red-700" @click="removeClinic(i)">Eliminar</button>
          </div>
        </div>

        <div>
          <label class="lbl" :for="`cl-name-${c.id}`">Nombre de la clínica *</label>
          <input :id="`cl-name-${c.id}`" v-model="c.name" class="inp" maxlength="200" :aria-invalid="!!err(i, 'name')" />
          <p v-if="err(i, 'name')" class="msg">{{ err(i, 'name') }}</p>
        </div>

        <div>
          <label class="lbl">Descripción *</label>
          <AdminRichTextEditor v-model="c.description" min-height="8rem" />
          <p v-if="err(i, 'description')" class="msg">{{ err(i, 'description') }}</p>
        </div>

        <!-- Imagen principal -->
        <div>
          <p class="lbl">Imagen principal *</p>
          <div class="flex flex-wrap items-start gap-4">
            <div class="w-48 aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-400">
              <img v-if="c.image" :src="c.image" :alt="`Imagen principal de ${c.name || 'la clínica'}`" class="w-full h-full object-cover" />
              <span v-else>Sin imagen</span>
            </div>
            <div>
              <span class="inline-block"><button type="button" class="btn-primary" :class="{ 'opacity-60 pointer-events-none': busy[`${c.id}:image`] }" @click="pick($event)">{{ busy[`${c.id}:image`] ? 'Subiendo…' : (c.image ? 'Cambiar imagen' : 'Subir imagen') }}</button><input type="file" accept="image/png,image/jpeg,image/webp" class="hidden" tabindex="-1" @change="onMainImage($event, c)" /></span>
              <p class="hint">JPG, PNG o WebP. Se optimiza automáticamente. Medidas recomendadas: 1080 × 1080 px (cuadrada) o 1920 × 1080 px (horizontal).</p>
            </div>
          </div>
          <p v-if="err(i, 'image')" class="msg">{{ err(i, 'image') }}</p>
        </div>

        <!-- Galería (opcional) -->
        <div>
          <p class="lbl">Galería de imágenes (opcional)</p>
          <ul v-if="c.gallery.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
            <li v-for="(g, gi) in c.gallery" :key="g" class="relative aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <img :src="g" :alt="`Imagen ${gi + 1} de la galería`" class="w-full h-full object-cover" />
              <button type="button" class="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/70 text-white text-sm leading-none hover:bg-red-700" :aria-label="`Quitar imagen ${gi + 1} de la galería`" @click="c.gallery.splice(gi, 1)">✕</button>
            </li>
          </ul>
          <span class="inline-block"><button type="button" class="btn-sm" :class="{ 'opacity-60 pointer-events-none': busy[`${c.id}:gallery`] || c.gallery.length >= CLINIC_LIMITS.gallery }" @click="pick($event)">{{ busy[`${c.id}:gallery`] ? 'Subiendo…' : 'Agregar imágenes' }}</button><input type="file" multiple accept="image/png,image/jpeg,image/webp" class="hidden" tabindex="-1" @change="onGallery($event, c)" /></span>
          <p class="hint">Hasta {{ CLINIC_LIMITS.gallery }} imágenes. Medidas recomendadas: 1080 × 1080 px (cuadrada) o 1920 × 1080 px (horizontal).</p>
          <p v-if="err(i, 'gallery')" class="msg">{{ err(i, 'gallery') }}</p>
        </div>

        <!-- Documentos o certificados -->
        <div class="border-t border-gray-100 pt-6">
          <p class="lbl">Documentos o certificados</p>
          <template v-if="!docsOpen[c.id]">
            <button type="button" class="btn-primary" @click="openDocs(c)">¿Agregar documentos?</button>
            <p class="hint">Si no hay documentos que mostrar, no hace falta completar nada aquí.</p>
          </template>
          <template v-else>
            <ul class="space-y-4">
              <li v-for="(d, di) in c.documents" :key="d.id" class="border border-gray-200 rounded-lg p-4 space-y-3 bg-[#fcf9f8]">
                <div class="flex items-center justify-between gap-3">
                  <p class="text-xs font-bold uppercase tracking-widest text-gray-500">Documento {{ di + 1 }}</p>
                  <button type="button" class="btn-sm text-red-700" @click="removeDoc(c, di)">Eliminar documento</button>
                </div>
                <div>
                  <label class="lbl" :for="`cl-doc-title-${d.id}`">Título *</label>
                  <input :id="`cl-doc-title-${d.id}`" v-model="d.title" class="inp" maxlength="200" :aria-invalid="!!err(i, `documents.${di}.title`)" />
                  <p v-if="err(i, `documents.${di}.title`)" class="msg">{{ err(i, `documents.${di}.title`) }}</p>
                </div>
                <div>
                  <p class="lbl">Documentos o imágenes *</p>
                  <ul v-if="d.files.length" class="space-y-1 mb-2">
                    <li v-for="(f, fi) in d.files" :key="f.url" class="flex items-center justify-between gap-3 text-sm bg-white border border-gray-200 rounded px-3 py-2">
                      <a :href="f.url" target="_blank" rel="noopener noreferrer" class="truncate text-[#0C2619] underline underline-offset-2">{{ f.name || 'Archivo' }}</a>
                      <button type="button" class="text-red-700 text-xs font-bold shrink-0" :aria-label="`Quitar ${f.name || 'archivo'}`" @click="d.files.splice(fi, 1)">Quitar</button>
                    </li>
                  </ul>
                  <span class="inline-block"><button type="button" class="btn-sm" :class="{ 'opacity-60 pointer-events-none': busy[`${c.id}:${d.id}`] || d.files.length >= CLINIC_LIMITS.filesPerDocument }" @click="pick($event)">{{ busy[`${c.id}:${d.id}`] ? 'Subiendo…' : 'Cargar archivos' }}</button><input type="file" multiple accept="application/pdf,image/png,image/jpeg,image/webp" class="hidden" tabindex="-1" @change="onDocFiles($event, c, d)" /></span>
                  <p class="hint">PDF, JPG, PNG o WebP (PDF hasta 10 MB). Hasta {{ CLINIC_LIMITS.filesPerDocument }} archivos.</p>
                  <p v-if="err(i, `documents.${di}.files`)" class="msg">{{ err(i, `documents.${di}.files`) }}</p>
                </div>
              </li>
            </ul>
            <div class="flex flex-wrap gap-2 mt-4">
              <button type="button" class="btn-sm" :disabled="c.documents.length >= CLINIC_LIMITS.documents" @click="addDoc(c)">Agregar otro documento</button>
              <button type="button" class="btn-sm text-red-700" @click="closeDocs(c)">Quitar todos los documentos</button>
            </div>
            <p v-if="err(i, 'documents')" class="msg">{{ err(i, 'documents') }}</p>
          </template>
        </div>
      </article>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl p-4">
        <p class="text-xs min-h-[1.25rem]" aria-live="polite">
          <span v-if="saving" class="text-gray-500">Guardando…</span>
          <span v-else-if="Object.keys(errors).length" class="text-red-700 font-semibold">Hay campos por corregir.</span>
          <span v-else-if="dirty" class="text-amber-700 font-semibold">Clínicas con cambios sin guardar.</span>
          <span v-else-if="savedAt" class="text-emerald-700">Clínicas guardadas a las {{ savedAt }}. Ya son visibles en la página pública.</span>
          <span v-else class="text-gray-400">Sin cambios en las clínicas.</span>
        </p>
        <button type="button" :disabled="!dirty || saving || uploading" class="bg-[#0C2619] hover:bg-[#153a28] text-white px-8 py-3 rounded-lg font-bold text-xs tracking-widest uppercase disabled:opacity-50 shadow" @click="save">
          {{ saving ? 'Guardando…' : 'Guardar clínicas' }}
        </button>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { clinicsService } from '~/services/ClinicsService'
import { CLINIC_LIMITS, normalizeClinics, validateClinics, type Clinic, type ClinicDocument, type ClinicErrors, type ClinicsContent } from '#shared/utils/clinics'

const emit = defineEmits<{ dirty: [value: boolean] }>()
const notify = useNotify()

const form = ref<ClinicsContent | null>(null)
const snapshot = ref('')
const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const saveError = ref('')
const savedAt = ref('')
const errors = ref<ClinicErrors>({})
const busy = reactive<Record<string, boolean>>({})
const docsOpen = reactive<Record<string, boolean>>({})

const dirty = computed(() => JSON.stringify(form.value) !== snapshot.value)
const uploading = computed(() => Object.values(busy).some(Boolean))
const err = (i: number, field: string) => errors.value[`clinics.${i}.${field}`]

watch(dirty, v => emit('dirty', v))

function sync(data: ClinicsContent) {
  form.value = data
  snapshot.value = JSON.stringify(data)
  for (const c of data.clinics) docsOpen[c.id] = c.documents.length > 0
}

async function load() {
  loading.value = true
  loadError.value = ''
  try { sync(await clinicsService.getContent()) } catch (e: any) { loadError.value = e.message } finally { loading.value = false }
}

const newId = (prefix: string, used: string[]) => {
  let n = used.length + 1
  while (used.includes(`${prefix}-${n}`)) n++
  return `${prefix}-${n}`
}

// La clínica nueva se inserta ARRIBA de las existentes, se desplaza a la vista y recibe el foco para que sea evidente que el formulario se creó.
async function addClinic() {
  if (!form.value) return
  const id = newId('clinica', form.value.clinics.map(c => c.id))
  form.value.clinics.unshift({ id, name: '', description: '', image: '', gallery: [], documents: [] })
  docsOpen[id] = false
  await nextTick()
  const input = document.getElementById(`cl-name-${id}`)
  input?.closest('article')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  input?.focus({ preventScroll: true })
}

async function removeClinic(i: number) {
  if (!form.value) return
  const c = form.value.clinics[i]!
  if (!(await notify.confirm(`¿Eliminar la clínica${c.name ? ` «${c.name}»` : ''}?`, 'Se quitará de la página al guardar.', 'Sí, eliminar'))) return
  form.value.clinics.splice(i, 1)
}

function move(i: number, delta: number) {
  const list = form.value?.clinics
  if (!list) return
  const j = i + delta
  if (j < 0 || j >= list.length) return
  const [item] = list.splice(i, 1)
  list.splice(j, 0, item!)
}

// ── Documentos: los campos obligatorios existen solo si el administrador decide agregar documentos.
function openDocs(c: Clinic) { docsOpen[c.id] = true; if (!c.documents.length) addDoc(c) }
function addDoc(c: Clinic) {
  c.documents.push({ id: newId('doc', c.documents.map(d => d.id)), title: '', files: [] })
}
function removeDoc(c: Clinic, di: number) {
  c.documents.splice(di, 1)
  if (!c.documents.length) docsOpen[c.id] = false
}
async function closeDocs(c: Clinic) {
  if (c.documents.length && !(await notify.confirm('¿Quitar todos los documentos?', 'Se eliminarán de esta clínica al guardar.', 'Sí, quitar'))) return
  c.documents = []
  docsOpen[c.id] = false
}

// ── Archivos
// El input de archivo va oculto (display:none) y se abre desde un botón, como en las demás pantallas del admin: un input visualmente
// oculto pero enfocable puede hacer que el navegador desplace el contenedor al recibir el foco.
function pick(e: Event) {
  (e.currentTarget as HTMLElement).parentElement?.querySelector<HTMLInputElement>('input[type=file]')?.click()
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

// Redimensiona (máx. 1800 px) y comprime a JPEG; PNG/WebP con transparencia se aplanan sobre blanco.
async function optimizeImage(file: File, maxSize = 1800, quality = 0.85): Promise<string> {
  const src = await readAsDataUrl(file)
  return await new Promise((resolve, reject) => {
    const img = new Image()
    img.onerror = () => reject(new Error(`«${file.name}» no es una imagen válida.`))
    img.onload = () => {
      const ratio = Math.min(1, maxSize / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = src
  })
}

const TYPES = ['image/jpeg', 'image/png', 'image/webp']
async function uploadImage(file: File): Promise<string> {
  if (!TYPES.includes(file.type)) throw new Error(`«${file.name}» debe ser JPG, PNG o WebP.`)
  if (file.size > 15 * 1024 * 1024) throw new Error(`«${file.name}» supera los 15 MB.`)
  return await clinicsService.uploadFile(await optimizeImage(file), 'image')
}

async function onMainImage(e: Event, c: Clinic) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  busy[`${c.id}:image`] = true
  try { c.image = await uploadImage(file); delete errors.value[`clinics.${form.value!.clinics.indexOf(c)}.image`] } catch (x: any) { notify.error(x.message) } finally { busy[`${c.id}:image`] = false }
}

async function onGallery(e: Event, c: Clinic) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return
  busy[`${c.id}:gallery`] = true
  const failed: string[] = []
  for (const f of files) {
    if (c.gallery.length >= CLINIC_LIMITS.gallery) { failed.push(`«${f.name}»: se alcanzó el máximo de ${CLINIC_LIMITS.gallery} imágenes.`); continue }
    try { c.gallery.push(await uploadImage(f)) } catch (x: any) { failed.push(x.message) }
  }
  busy[`${c.id}:gallery`] = false
  if (failed.length) notify.error(failed.join('\n'), 'Algunas imágenes no se cargaron')
}

async function onDocFiles(e: Event, c: Clinic, d: ClinicDocument) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return
  busy[`${c.id}:${d.id}`] = true
  const failed: string[] = []
  for (const f of files) {
    if (d.files.length >= CLINIC_LIMITS.filesPerDocument) { failed.push(`«${f.name}»: se alcanzó el máximo de ${CLINIC_LIMITS.filesPerDocument} archivos.`); continue }
    try {
      let url: string
      if (f.type === 'application/pdf') {
        if (f.size > 10 * 1024 * 1024) throw new Error(`«${f.name}» supera los 10 MB.`)
        url = await clinicsService.uploadFile(await readAsDataUrl(f), 'document')
      } else {
        if (!TYPES.includes(f.type)) throw new Error(`«${f.name}» debe ser PDF, JPG, PNG o WebP.`)
        url = await clinicsService.uploadFile(await optimizeImage(f), 'document')
      }
      d.files.push({ url, name: f.name.slice(0, CLINIC_LIMITS.fileName) })
    } catch (x: any) { failed.push(x.message) }
  }
  busy[`${c.id}:${d.id}`] = false
  if (failed.length) notify.error(failed.join('\n'), 'Algunos archivos no se cargaron')
}

async function save() {
  if (!form.value || saving.value || !dirty.value) return
  saveError.value = ''
  errors.value = validateClinics(normalizeClinics(form.value, form.value))
  if (Object.keys(errors.value).length) {
    saveError.value = Object.values(errors.value)[0]!
    return
  }
  saving.value = true
  try {
    sync(await clinicsService.saveContent(normalizeClinics(form.value, form.value)))
    savedAt.value = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    notify.success('Clínicas guardadas')
  } catch (e: any) {
    errors.value = e.errors ?? {}
    saveError.value = e.message
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.lbl { display: block; font-size: 10px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: #6b7280; margin-bottom: .5rem; }
.inp { width: 100%; padding: .5rem .75rem; background: #fff; border: 1px solid #e5e7eb; border-radius: .375rem; font-size: .875rem; }
.inp:focus { outline: none; box-shadow: 0 0 0 1px #0C2619; }
.inp[aria-invalid='true'] { border-color: #dc2626; }
.msg { margin-top: .375rem; font-size: .75rem; color: #b91c1c; }
.hint { margin-top: .5rem; font-size: 10px; color: #6b7280; }
.btn-sm { padding: .375rem .75rem; border: 1px solid #e5e7eb; border-radius: .5rem; font-size: .75rem; font-weight: 600; color: #374151; background: #fff; }
.btn-sm:hover:not(:disabled) { background: #f9fafb; }
.btn-sm:disabled { opacity: .4; }
.btn-primary { display: inline-block; padding: .625rem 1.25rem; background: #0C2619; color: #fff; font-size: .75rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; border-radius: .5rem; }
.btn-primary:hover { background: #153a28; }
</style>

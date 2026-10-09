<template>
  <div class="pb-24">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h2 class="text-3xl font-serif text-[#0C2619] mb-1 uppercase">Recomendaciones</h2>
        <p class="text-gray-500 font-light">Edita, agrega o elimina las páginas de recomendaciones del sitio.</p>
      </div>
      <button
        @click="save"
        :disabled="isSaving || !loaded || !selection || !canSave"
        class="bg-[#0C2619] hover:bg-[#153a28] text-white px-8 py-3 rounded-lg font-bold text-xs tracking-widest uppercase transition-colors disabled:opacity-50 shadow-lg"
      >
        {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
      </button>
    </div>

    <div v-if="!loaded" class="text-gray-400 text-sm">Cargando...</div>

    <div v-else class="grid lg:grid-cols-[300px_1fr] gap-6 items-start">

      <!-- Navegación por grupos -->
      <aside class="bg-white border border-gray-200 rounded-xl shadow-sm p-3 lg:sticky lg:top-4 space-y-5">
        <section v-for="g in groups" :key="g.key">
          <div class="flex items-center justify-between px-3 pt-2 pb-2">
            <p class="text-[10px] font-bold tracking-widest text-gray-400 uppercase">{{ g.label }}</p>
            <button type="button" @click="addPage(g.key)" class="text-[10px] font-bold tracking-widest uppercase text-[#0C2619] hover:text-[#D3A76A]" :title="`Agregar a ${g.label}`">+ Agregar</button>
          </div>

          <!-- Procedimientos (solo cuidados y revisión): el texto vive en cada procedimiento -->
          <template v-if="g.key !== 'general'">
            <button
              v-for="p in procedures" :key="`proc-${g.key}-${p.slug}`" type="button" @click="select({ type: 'procedure', group: g.key, slug: p.slug })"
              class="item" :class="isSelected('procedure', g.key, p.slug) ? 'item-active' : 'item-idle'"
            >
              <span>{{ RECOMMENDATION_KINDS[g.key].itemLabel(p.name) }}</span>
              <span class="w-2 h-2 rounded-full shrink-0" :class="hasText(p, g.key) ? 'bg-emerald-400' : 'bg-gray-300'" :title="hasText(p, g.key) ? 'Con texto (aparece en el menú)' : 'Sin texto (no aparece en el menú)'"></span>
            </button>
          </template>

          <button
            v-for="p in pagesOf(g.key)" :key="p.slug" type="button" @click="select({ type: 'page', group: g.key, slug: p.slug })"
            class="item" :class="isSelected('page', g.key, p.slug) ? 'item-active' : 'item-idle'"
          >
            <span>{{ p.menuLabel }}</span>
            <span class="w-2 h-2 rounded-full shrink-0" :class="p.published ? 'bg-emerald-400' : 'bg-gray-300'" :title="p.published ? 'Publicada' : 'Oculta'"></span>
          </button>
        </section>
        <p class="px-3 pb-1 text-[10px] text-gray-400 leading-relaxed">● verde: visible en el menú. Gris: oculta o sin texto.</p>
      </aside>

      <!-- Editor de página (fija o creada desde el panel) -->
      <div v-if="currentPage" class="space-y-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <label class="flex items-center gap-3 cursor-pointer w-fit">
              <input type="checkbox" v-model="currentPage.published" class="sr-only peer" />
              <span class="w-11 h-6 rounded-full bg-gray-300 peer-checked:bg-[#0C2619] relative transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5"></span>
              <span class="text-sm font-bold text-gray-700">{{ currentPage.published ? 'Publicada' : 'Oculta al público' }}</span>
            </label>
            <p class="text-xs text-gray-400 mt-1">Al ocultarla, la página deja de mostrarse en el sitio y desaparece del menú. El contenido se conserva. Recuerda guardar los cambios.</p>
          </div>
          <button v-if="currentPage.custom" type="button" @click="removePage(currentPage)" class="text-xs font-bold text-gray-400 hover:text-red-600 uppercase tracking-wider">Eliminar página</button>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-6">
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Título de la página *</label>
            <input v-model="currentPage.title" type="text" class="field" />
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Video de YouTube (opcional)</label>
            <input v-model="currentPage.videoUrl" type="url" class="field" placeholder="https://www.youtube.com/watch?v=..." />
            <p class="text-[10px] text-gray-500 mt-2">Se muestra debajo del título. Admite youtube.com, youtu.be y Shorts.</p>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Imagen (opcional)</label>
            <div class="flex items-start gap-4">
              <label class="block w-40 aspect-[4/3] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-[#0C2619] bg-gray-50 relative">
                <img v-if="currentPage.image" :src="currentPage.image" alt="Imagen" class="w-full h-full object-cover" />
                <span v-else class="absolute inset-0 flex items-center justify-center text-xs text-gray-400 text-center px-3">Haz clic para subir</span>
                <input type="file" accept="image/*" class="hidden" @change="onImage" />
              </label>
              <button v-if="currentPage.image" type="button" @click="currentPage.image = ''" class="text-xs font-bold text-gray-400 hover:text-red-600 uppercase tracking-wider">Quitar imagen</button>
            </div>
            <p class="text-[10px] text-gray-500 mt-2">Se muestra a un costado del texto en pantallas grandes.</p>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Contenido</label>
            <AdminRichTextEditor :key="currentPage.slug" v-model="currentPage.content" min-height="22rem" />
            <p class="text-[10px] text-gray-500 mt-2">Usa listas para que se vean con los ✓ del diseño. También puedes usar títulos, negrita, cursiva y enlaces.</p>
          </div>
        </div>
      </div>

      <!-- Editor de texto de un procedimiento -->
      <section v-else-if="currentProcedure" class="bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-4">
        <div class="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase">{{ RECOMMENDATION_KINDS[selection!.group as RecommendationKind].title(currentProcedure.name) }}</h3>
          <NuxtLink :to="`/admin/procedimientos/${currentProcedure.slug}`" class="text-[10px] font-bold tracking-widest uppercase text-gray-400 hover:text-[#0C2619]">Editar procedimiento →</NuxtLink>
        </div>
        <p v-if="currentProcedure.editable === false" class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          Este es un procedimiento maestro del Hub: su contenido es global y no se edita desde Planmed.
        </p>
        <AdminRichTextEditor :key="`${selection!.group}-${currentProcedure.slug}`" v-model="currentProcedure[procedureField]" min-height="22rem" :readonly="currentProcedure.editable === false" />
        <p class="text-[10px] text-gray-500">Si lo dejas vacío, este procedimiento no aparece en el submenú ni tiene página pública. Usa listas para que se vean con los ✓ del diseño.</p>
      </section>

      <p v-else class="text-gray-400 text-sm">Selecciona una página de la lista.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Swal from 'sweetalert2'
import { useHead } from '#imports'
import { recommendationsService } from '~/services/RecommendationsService'
import { procedureService } from '~/services/ProcedureService'
import { fileToOptimizedDataUrl } from '~/utils/imageFile'
import { isRichHtmlEmpty } from '~/utils/richText'
import { RECOMMENDATION_KINDS, type RecommendationKind } from '~/utils/recommendationKinds'
import type { RecommendationGroup, RecommendationPage } from '~/types/recommendations'
import type { Procedure } from '~/types/procedure'

useHead({ title: 'Recomendaciones | Admin Planmed' })
definePageMeta({ layout: 'admin' })

const notify = useNotify()

const groups: { key: RecommendationGroup; label: string }[] = [
  { key: 'general', label: 'Recomendaciones generales' },
  { key: 'cuidados', label: 'Cuidados de cirugías' },
  { key: 'revision', label: 'Cita de revisión' }
]

type Selection = { type: 'page' | 'procedure'; group: RecommendationGroup; slug: string }

const pages = ref<RecommendationPage[]>([])
const procedures = ref<Procedure[]>([])
const selection = ref<Selection | null>(null)
const loaded = ref(false)
const isSaving = ref(false)

const pagesOf = (group: RecommendationGroup) => pages.value.filter(p => p.group === group)
const hasText = (p: Procedure, group: RecommendationGroup) => group !== 'general' && !isRichHtmlEmpty(p[RECOMMENDATION_KINDS[group].field])
const isSelected = (type: Selection['type'], group: RecommendationGroup, slug: string) =>
  selection.value?.type === type && selection.value.group === group && selection.value.slug === slug

const currentPage = computed(() => (selection.value?.type === 'page' ? pages.value.find(p => p.slug === selection.value!.slug) ?? null : null))
const currentProcedure = computed(() => (selection.value?.type === 'procedure' ? procedures.value.find(p => p.slug === selection.value!.slug) ?? null : null))
// Los procedimientos maestros del Hub no se editan desde una línea (Hub responde 403): se bloquea el guardado.
const canSave = computed(() => !currentProcedure.value || currentProcedure.value.editable !== false)
const procedureField = computed(() => RECOMMENDATION_KINDS[(selection.value?.group === 'revision' ? 'revision' : 'cuidados')].field)

onMounted(async () => {
  ;[pages.value, procedures.value] = await Promise.all([recommendationsService.getPages(), procedureService.getProcedures()])
  const first = pages.value[0]
  if (first) selection.value = { type: 'page', group: first.group, slug: first.slug }
  loaded.value = true
})

function select(next: Selection) {
  selection.value = next
}

async function addPage(group: RecommendationGroup) {
  const label = groups.find(g => g.key === group)!.label
  const { value } = await Swal.fire({
    title: 'Nueva página',
    text: `Se agregará a "${label}". Nace oculta hasta que la publiques.`,
    input: 'text',
    inputPlaceholder: 'Título de la página',
    showCancelButton: true,
    confirmButtonText: 'Crear',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#0C2619',
    inputValidator: v => (v.trim() ? null : 'Escribe un título')
  })
  if (!value) return
  try {
    const page = await recommendationsService.createPage({ title: value, group })
    pages.value = [...pages.value, page]
    select({ type: 'page', group, slug: page.slug })
    notify.success('Página creada. Redacta su contenido y publícala.')
  } catch (err: any) {
    notify.error(err.message || 'No se pudo crear la página.')
  }
}

async function removePage(page: RecommendationPage) {
  if (!(await notify.confirm(`¿Eliminar "${page.title}"?`, 'Esta acción no se puede deshacer.', 'Sí, eliminar'))) return
  try {
    await recommendationsService.deletePage(page.slug)
    pages.value = pages.value.filter(p => p.slug !== page.slug)
    const first = pages.value[0]
    selection.value = first ? { type: 'page', group: first.group, slug: first.slug } : null
    notify.success('Página eliminada')
  } catch (err: any) {
    notify.error(err.message || 'No se pudo eliminar la página.')
  }
}

async function onImage(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !currentPage.value) return
  if (file.size > 10 * 1024 * 1024) return notify.error('La imagen no puede superar los 10 MB.')
  try {
    currentPage.value.image = await fileToOptimizedDataUrl(file)
  } catch (err: any) {
    notify.error(err.message)
  }
}

const YOUTUBE_RE = /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i

async function save() {
  isSaving.value = true
  try {
    if (currentPage.value) await saveFixedPage(currentPage.value)
    else if (currentProcedure.value) await saveProcedureText(currentProcedure.value)
  } catch (err: any) {
    notify.error(err.message || 'Ocurrió un error al guardar.')
  } finally {
    isSaving.value = false
  }
}

async function saveFixedPage(page: RecommendationPage) {
  if (!page.title.trim()) return notify.error('Escribe el título de la página.', 'Falta información')
  if (page.videoUrl.trim() && !YOUTUBE_RE.test(page.videoUrl.trim())) return notify.error('Solo se admiten enlaces de YouTube.', 'Enlace no válido')
  if (page.published && isRichHtmlEmpty(page.content)) return notify.error('Para publicar la página, redacta primero su contenido.', 'Falta información')

  page.title = page.title.trim()
  page.videoUrl = page.videoUrl.trim()
  // Las páginas creadas desde el panel usan su título como etiqueta del menú.
  if (page.custom) page.menuLabel = page.title
  const saved = await recommendationsService.savePage(page)
  pages.value = pages.value.map(p => (p.slug === saved.slug ? saved : p))
  if (saved.published) notify.success('Cambios guardados correctamente')
  else notify.warning('Guardado, pero la página sigue oculta: actívala para que aparezca en el menú.')
}

async function saveProcedureText(procedure: Procedure) {
  const field = procedureField.value
  // Un editor vacío ("<p></p>") se guarda como vacío: el procedimiento deja de aparecer en el menú.
  const value = isRichHtmlEmpty(procedure[field]) ? '' : procedure[field]
  const saved = await procedureService.updateProcedure(procedure.slug, { [field]: value })
  procedures.value = procedures.value.map(p => (p.slug === procedure.slug ? { ...p, [field]: saved[field] } : p))
  notify.success(`Guardado: ${procedure.name}`)
}
</script>

<style scoped>
.field { width: 100%; padding: .65rem .9rem; border: 1px solid #e5e7eb; border-radius: .5rem; background: #f9fafb; font-size: .875rem; }
.field:focus { outline: none; box-shadow: 0 0 0 2px #0C2619; border-color: transparent; }
.item { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: .5rem; padding: .6rem .75rem; border-radius: .5rem; font-size: .875rem; text-align: left; transition: background .15s; }
.item-idle { color: #374151; }
.item-idle:hover { background: #f9fafb; }
.item-active { background: #0C2619; color: #fff; }
</style>

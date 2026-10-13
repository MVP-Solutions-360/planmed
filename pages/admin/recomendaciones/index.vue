<template>
  <div class="pb-24">
    <div class="mb-8">
      <h2 class="text-3xl font-serif text-[#0C2619] mb-1 uppercase">Recomendaciones</h2>
      <p class="text-gray-500 font-light">Administra las recomendaciones generales y el contenido de cada procedimiento. Cada elemento se guarda por separado.</p>
    </div>

    <!-- Selector de sección (mismo estilo que «Nuestros Pacientes») -->
    <div class="flex flex-wrap gap-2 mb-8 border-b border-gray-200" role="tablist">
      <button
        v-for="t in tabs" :key="t.key" type="button" role="tab" :aria-selected="state.tab === t.key" @click="ctl.selectTab(t.key)"
        class="px-5 py-3 text-xs font-bold tracking-widest uppercase border-b-2 -mb-px transition-colors"
        :class="state.tab === t.key ? 'border-[#0C2619] text-[#0C2619]' : 'border-transparent text-gray-400 hover:text-gray-700'"
      >
        {{ t.label }}
      </button>
    </div>

    <div v-if="!state.loaded" class="text-gray-400 text-sm">Cargando...</div>

    <template v-else>
      <!-- ───────────── Pestaña A: Recomendaciones generales ───────────── -->
      <section v-if="state.tab === 'general'">
        <div v-if="state.pagesError" class="mb-6 text-sm rounded-lg border px-4 py-3" :class="state.pagesError.forbidden ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-red-700 bg-red-50 border-red-200'" role="alert">
          <p class="font-semibold">{{ state.pagesError.forbidden ? 'No tienes acceso a las recomendaciones generales.' : 'No se pudieron cargar las recomendaciones generales.' }}</p>
          <p class="mt-1">{{ state.pagesError.message }}</p>
          <p class="mt-1 text-xs opacity-80">Esto no significa que no existan: no se pudo consultar la lista.</p>
          <button type="button" @click="ctl.reload()" class="mt-3 text-xs font-bold tracking-widest uppercase underline">Reintentar</button>
        </div>

        <div v-else class="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
          <aside class="bg-white border border-gray-200 rounded-xl shadow-sm p-3 lg:sticky lg:top-4 space-y-3">
            <div class="flex items-center justify-between px-3 pt-2">
              <p class="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Páginas generales</p>
              <button type="button" @click="ctl.createGeneralPage()" class="text-[10px] font-bold tracking-widest uppercase text-[#0C2619] hover:text-[#D3A76A]">+ Agregar</button>
            </div>
            <div v-if="state.errors['create']" class="mx-3"><AdminRecommendationsErrorNotice :error="state.errors['create']" @dismiss="ctl.clearError('create')" /></div>
            <ul class="space-y-1">
              <li v-for="p in classification.general" :key="p.slug">
                <button
                  type="button" @click="ctl.selectGeneralPage(p.slug)" class="w-full text-left px-3 py-3 rounded-lg transition-colors"
                  :class="state.generalSlug === p.slug ? 'bg-[#D3A76A] text-[#0C2619]' : 'hover:bg-gray-50 text-gray-700'"
                >
                  <span class="block text-sm font-semibold break-words">{{ p.menuLabel || p.title }}</span>
                  <span class="mt-1.5 flex flex-wrap gap-1.5">
                    <AdminRecommendationsStatusBadge :label="p.published ? 'Publicada' : 'Oculta'" :tone="p.published ? 'green' : 'gray'" />
                    <AdminRecommendationsStatusBadge v-if="ctl.isDirty(`page:${p.slug}`)" label="Sin guardar" tone="amber" />
                  </span>
                </button>
              </li>
              <li v-if="!classification.general.length" class="px-3 py-6 text-sm text-gray-400 text-center">Aún no hay recomendaciones generales. Usa «+ Agregar».</li>
            </ul>
            <p class="px-3 pb-1 text-[10px] text-gray-400 leading-relaxed">Aquí solo están las páginas que no dependen de un procedimiento. Las de cada cirugía están en «Contenido por procedimiento».</p>
          </aside>

          <div>
            <AdminRecommendationsPageEditor
              v-if="generalElement && generalElement.type === 'page' && draftOf(generalElement.key)"
              :key="generalElement.key"
              :page="generalElement.page" :draft="(draftOf(generalElement.key) as PageDraft)" :dirty="ctl.isDirty(generalElement.key)"
              :saving="!!state.saving[generalElement.key]" :publishing="!!state.publishing[generalElement.key]"
              :error="state.errors[generalElement.key]" :saved-at="state.savedAt[generalElement.key]"
              :view-url="pagePublicUrl(generalElement.page)" :can-delete="generalElement.page.custom" eyebrow="Recomendación general"
              @save="ctl.save(generalElement.key)" @dismiss-error="ctl.clearError(generalElement.key)" @publish="ctl.setPublished(generalElement.page.slug, true)"
              @unpublish="ctl.setPublished(generalElement.page.slug, false)" @delete="ctl.deletePage(generalElement.page.slug)"
            />
            <p v-else class="text-gray-400 text-sm">Selecciona una recomendación de la lista.</p>
          </div>
        </div>
      </section>

      <!-- ───────────── Pestaña B: Contenido por procedimiento ───────────── -->
      <section v-else>
        <div v-if="state.proceduresError" class="mb-6 text-sm rounded-lg border px-4 py-3" :class="state.proceduresError.forbidden ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-red-700 bg-red-50 border-red-200'" role="alert">
          <p class="font-semibold">No se pudieron cargar los procedimientos.</p>
          <p class="mt-1">{{ state.proceduresError.message }}</p>
          <button type="button" @click="ctl.reload()" class="mt-3 text-xs font-bold tracking-widest uppercase underline">Reintentar</button>
        </div>
        <div v-if="state.pagesError" class="mb-6 text-sm rounded-lg border px-4 py-3 text-amber-800 bg-amber-50 border-amber-200" role="alert">
          <p class="font-semibold">No se pudieron cargar las páginas del CMS.</p>
          <p class="mt-1">{{ state.pagesError.message }}</p>
          <p class="mt-1 text-xs">Sin ellas no se puede saber qué contenido se publica de cada procedimiento, por eso la edición está bloqueada.</p>
          <button type="button" @click="ctl.reload()" class="mt-3 text-xs font-bold tracking-widest uppercase underline">Reintentar</button>
        </div>

        <div class="grid lg:grid-cols-[340px_1fr] gap-6 items-start">
          <div class="space-y-6">
            <AdminRecommendationsProcedurePicker :rows="pickerRows" :selected="state.unassociatedSlug ? null : state.procedureSlug" @select="ctl.selectProcedure" />

            <!-- Solo existe si realmente hay páginas sin procedimiento asociado -->
            <aside v-if="hasUnassociated(classification)" class="bg-white border border-gray-200 rounded-xl shadow-sm p-3 space-y-2">
              <p class="px-2 pt-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">Sin asociación ({{ classification.unassociated.length }})</p>
              <p class="px-2 text-[10px] text-gray-400 leading-relaxed">Páginas de cuidados o revisión que no están vinculadas a ningún procedimiento visible. No sustituyen el texto de ninguna cirugía.</p>
              <ul class="space-y-1">
                <li v-for="p in classification.unassociated" :key="p.slug">
                  <button
                    type="button" @click="ctl.selectUnassociated(p.slug)" class="w-full text-left px-3 py-3 rounded-lg transition-colors"
                    :class="state.unassociatedSlug === p.slug ? 'bg-[#D3A76A] text-[#0C2619]' : 'hover:bg-gray-50 text-gray-700'"
                  >
                    <span class="block text-sm font-semibold break-words">{{ p.title }}</span>
                    <span class="mt-1.5 flex flex-wrap gap-1.5">
                      <AdminRecommendationsStatusBadge :label="KIND_LABEL[p.group as RecommendationKindKey] ?? 'General'" tone="gray" />
                      <AdminRecommendationsStatusBadge :label="p.published ? 'Publicada' : 'Oculta'" :tone="p.published ? 'green' : 'gray'" />
                      <AdminRecommendationsStatusBadge v-if="ctl.isDirty(`page:${p.slug}`)" label="Sin guardar" tone="amber" />
                    </span>
                  </button>
                </li>
              </ul>
            </aside>
          </div>

          <div class="space-y-6">
            <!-- Página sin asociación seleccionada -->
            <template v-if="state.unassociatedSlug && procElement && procElement.type === 'page'">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm text-gray-500">Página sin procedimiento asociado.</p>
                <button type="button" @click="ctl.clearUnassociated()" class="text-[11px] font-bold tracking-widest uppercase text-[#0C2619] hover:text-[#D3A76A]">← Volver a procedimientos</button>
              </div>
              <AdminRecommendationsPageEditor
                v-if="draftOf(procElement.key)" :key="procElement.key"
                :page="procElement.page" :draft="(draftOf(procElement.key) as PageDraft)" :dirty="ctl.isDirty(procElement.key)"
                :saving="!!state.saving[procElement.key]" :publishing="!!state.publishing[procElement.key]"
                :error="state.errors[procElement.key]" :saved-at="state.savedAt[procElement.key]"
                :view-url="pagePublicUrl(procElement.page)" :can-delete="procElement.page.custom" eyebrow="Sin asociación"
                @save="ctl.save(procElement.key)" @dismiss-error="ctl.clearError(procElement.key)" @publish="ctl.setPublished(procElement.page.slug, true)"
                @unpublish="ctl.setPublished(procElement.page.slug, false)" @delete="ctl.deletePage(procElement.page.slug)"
              />
            </template>

            <!-- Procedimiento seleccionado -->
            <template v-else-if="procedure">
              <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <p class="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">Procedimiento</p>
                <h3 class="text-2xl font-serif text-[#0C2619] break-words">{{ procedure.name }}</h3>
                <div class="mt-5 flex flex-wrap gap-2 border-b border-gray-200" role="tablist">
                  <button
                    v-for="k in kinds" :key="k" type="button" role="tab" :aria-selected="state.kind === k" @click="ctl.selectKind(k)"
                    class="px-4 py-2.5 text-xs font-bold tracking-widest uppercase border-b-2 -mb-px transition-colors"
                    :class="state.kind === k ? 'border-[#0C2619] text-[#0C2619]' : 'border-transparent text-gray-400 hover:text-gray-700'"
                  >
                    {{ KIND_LABEL[k] }}
                  </button>
                </div>
              </div>

              <div v-if="procElement && procElement.type === 'blocked'" class="text-sm rounded-lg border px-4 py-3 text-amber-800 bg-amber-50 border-amber-200" role="alert">{{ procElement.reason }}</div>

              <template v-else-if="procSource">
                <div class="rounded-xl border px-5 py-4 text-sm" :class="sourceBox[procSource.fuente]">
                  <p class="font-bold tracking-wide uppercase text-[11px]">Fuente publicada hoy: {{ SOURCE_LABEL[procSource.fuente] }}</p>
                  <p class="mt-1 leading-relaxed">{{ SOURCE_HELP[procSource.fuente] }}</p>
                </div>

                <!-- La página del CMS es la fuente (publicada u oculta): se edita la página -->
                <template v-if="procElement && procElement.type === 'page'">
                  <AdminRecommendationsPageEditor
                    v-if="draftOf(procElement.key)" :key="procElement.key"
                    :page="procElement.page" :draft="(draftOf(procElement.key) as PageDraft)" :dirty="ctl.isDirty(procElement.key)"
                    :saving="!!state.saving[procElement.key]" :publishing="!!state.publishing[procElement.key]"
                    :error="state.errors[procElement.key]" :saved-at="state.savedAt[procElement.key]"
                    :view-url="procedureUrl" :can-delete="procElement.page.custom" :eyebrow="`${KIND_LABEL[state.kind]} · Página vinculada`"
                    @save="ctl.save(procElement.key)" @dismiss-error="ctl.clearError(procElement.key)" @publish="ctl.setPublished(procElement.page.slug, true)"
                    @unpublish="ctl.setPublished(procElement.page.slug, false)" @delete="ctl.deletePage(procElement.page.slug)"
                  >
                    <template #notice>
                      <details v-if="procSource.historicText" class="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
                        <summary class="cursor-pointer text-xs font-bold tracking-widest uppercase text-gray-500">Texto histórico del procedimiento (solo lectura)</summary>
                        <p class="text-xs text-gray-500 mt-2 mb-3">No se publica mientras exista la página vinculada y no se puede editar desde esta vista. Se conserva sin cambios.</p>
                        <AdminRichTextEditor :key="`hist-${procElement.key}`" :model-value="procSource.historicText" min-height="6rem" readonly />
                      </details>
                    </template>
                  </AdminRecommendationsPageEditor>
                </template>

                <!-- Sin página vinculada: la fuente es el texto histórico del procedimiento -->
                <AdminRecommendationsLegacyTextEditor
                  v-else-if="procElement && procElement.type === 'legacy' && draftOf(procElement.key)" :key="procElement.key"
                  :label="procElement.label" :kind-label="KIND_LABEL[state.kind]" :draft="(draftOf(procElement.key) as LegacyDraft)" :editor-key="procElement.key"
                  :readonly="procElement.readonly" :dirty="ctl.isDirty(procElement.key)" :saving="!!state.saving[procElement.key]"
                  :error="state.errors[procElement.key]" :saved-at="state.savedAt[procElement.key]" :view-url="procedureUrl"
                  @save="ctl.save(procElement.key)" @dismiss-error="ctl.clearError(procElement.key)"
                />
              </template>
            </template>

            <p v-else class="text-gray-400 text-sm">Elige un procedimiento de la lista para ver y editar sus recomendaciones de cuidados y de citas de revisión.</p>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, watchEffect } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import Swal from 'sweetalert2'
import { useHead } from '#imports'
import { recommendationsService } from '~/services/RecommendationsService'
import { procedureService } from '~/services/ProcedureService'
import { isRichHtmlEmpty } from '~/utils/richText'
import { resolveRecommendation } from '~/utils/recommendationSource'
import {
  KIND_KEYS, KIND_LABEL, SOURCE_HELP, SOURCE_LABEL, createAdminController, createAdminState, deriveSource, hasUnassociated, pagePublicUrl, procedurePublicUrl,
  type LegacyDraft, type PageDraft, type RecommendationKindKey, type SourceKind
} from '~/utils/recommendationsAdmin'
import type { BadgeTone } from '~/components/admin/recommendations/StatusBadge.vue'

useHead({ title: 'Recomendaciones | Admin Planmed' })
definePageMeta({ layout: 'admin' })

const notify = useNotify()

const tabs = [
  { key: 'general', label: 'Recomendaciones generales' },
  { key: 'procedure', label: 'Contenido por procedimiento' }
] as const
const kinds = KIND_KEYS

const state = reactive(createAdminState())
const ctl = createAdminController(state, {
  pages: recommendationsService as any,
  procedures: procedureService as any,
  resolve: resolveRecommendation as any,
  isEmpty: isRichHtmlEmpty,
  confirm: ({ title, text, confirmText }) => notify.confirm(title, text, confirmText),
  askTitle: async () => {
    const { value } = await Swal.fire({
      title: 'Nueva recomendación general',
      text: 'Nace oculta hasta que la publiques. No está asociada a ningún procedimiento.',
      input: 'text',
      inputPlaceholder: 'Título de la página',
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0C2619',
      inputValidator: v => (v.trim() ? null : 'Escribe un título')
    })
    return typeof value === 'string' && value.trim() ? value.trim() : null
  },
  notify: { success: m => void notify.success(m), warning: m => void notify.warning(m) }
})

const classification = computed(() => ctl.classification())
const element = computed(() => ctl.current())
const generalElement = computed(() => (state.tab === 'general' ? element.value : null))
const procElement = computed(() => (state.tab === 'procedure' ? element.value : null))
const procedure = computed(() => ctl.findProcedure(state.procedureSlug))
const draftOf = (key: string) => state.drafts[key] ?? null

// El borrador se crea fuera del render, al seleccionar el elemento.
watchEffect(() => {
  const el = element.value
  if (el?.key) ctl.draft(el.key)
})

// Fuente efectiva del procedimiento y tipo elegidos (la regla vive en resolveRecommendation; ver utils/recommendationsAdmin.ts).
const sourceDeps = { resolve: resolveRecommendation as any, isEmpty: isRichHtmlEmpty }
const procSource = computed(() => (procedure.value && !state.pagesError ? deriveSource(procedure.value, state.kind, classification.value.linked, sourceDeps) : null))
const procedureUrl = computed(() => (procedure.value && procSource.value ? procedurePublicUrl(procedure.value, state.kind, procSource.value) : null))

const SHORT: Record<SourceKind, { label: string, tone: BadgeTone }> = {
  pagina: { label: 'Página publicada', tone: 'green' },
  pagina_oculta: { label: 'Página oculta', tone: 'amber' },
  historico: { label: 'Texto', tone: 'blue' },
  ninguna: { label: 'Sin contenido', tone: 'gray' }
}
const sourceBox: Record<SourceKind, string> = {
  pagina: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  pagina_oculta: 'bg-amber-50 border-amber-200 text-amber-900',
  historico: 'bg-sky-50 border-sky-200 text-sky-900',
  ninguna: 'bg-gray-50 border-gray-200 text-gray-600'
}

const pickerRows = computed(() => state.procedures.map(p => ({
  slug: p.slug,
  name: p.name,
  // Sin las páginas del CMS no se puede afirmar qué se publica: no se muestran indicadores en lugar de mostrar unos falsos.
  badges: state.pagesError
    ? []
    : kinds.map((k: RecommendationKindKey) => {
        const s = SHORT[deriveSource(p, k, classification.value.linked, sourceDeps).fuente]
        return { kind: k, kindLabel: KIND_LABEL[k], label: s.label, tone: s.tone }
      })
})))

// Protección contra pérdida de cambios al salir de la pantalla o cerrar la pestaña del navegador.
onBeforeRouteLeave(async () => {
  if (!ctl.anyDirty()) return true
  return notify.confirm('Hay cambios sin guardar', 'Si sales de esta pantalla se perderán los cambios no guardados.', 'Salir sin guardar')
})
const beforeUnload = (e: BeforeUnloadEvent) => {
  if (!ctl.anyDirty()) return
  e.preventDefault()
  e.returnValue = ''
}
onMounted(() => {
  window.addEventListener('beforeunload', beforeUnload)
  ctl.load()
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
</script>

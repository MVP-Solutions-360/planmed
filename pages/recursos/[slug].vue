<template>
  <div v-if="doc" class="bg-[#fcf9f8] min-h-screen font-sans selection:bg-[#0C2619] selection:text-white">
    <!-- Cabecera de detalle -->
    <header class="bg-gradient-to-br from-[#0C2619] to-[#153a28] text-white px-6 pt-10 pb-14 md:pt-14 md:pb-20 text-center" aria-labelledby="doc-title">
      <div class="max-w-[900px] mx-auto">
        <CommonDetailBack to="/recursos" label="Volver a documentos y recursos" />
        <p class="mx-auto w-fit bg-[#D3A76A] text-[#0C2619] px-4 py-1.5 rounded-full font-bold text-xs mb-5">Documento oficial</p>
        <h1 id="doc-title" class="font-serif text-[26px] sm:text-[32px] md:text-[44px] font-medium leading-[1.15] break-words text-balance">{{ doc.title }}</h1>
        <p class="mt-4 text-white/80 font-light text-base md:text-lg max-w-2xl mx-auto">{{ doc.description }}</p>
        <div class="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <a :href="doc.file" :download="`${doc.slug}.pdf`" class="btn btn-gold" :aria-label="`Descargar ${doc.title} (PDF)`">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" /></svg>
            Descargar PDF
          </a>
          <NuxtLink to="/recursos" class="btn btn-outline">Ver todos los documentos</NuxtLink>
        </div>
      </div>
    </header>

    <!-- Identificación del responsable (tal como figura en el PDF) -->
    <section v-if="doc.facts.length" class="max-w-[1000px] mx-auto px-6 md:px-12 py-10 md:py-14" aria-label="Identificación del responsable">
      <dl class="bg-white border border-[#e5e2e1] rounded-2xl shadow-sm p-6 md:p-8 grid sm:grid-cols-2 gap-x-10 gap-y-4">
        <div v-for="[k, v] in doc.facts" :key="k" class="min-w-0">
          <dt class="label">{{ k }}</dt>
          <dd class="text-[15px] text-[#0C2619] break-words">{{ v }}</dd>
        </div>
      </dl>
    </section>

    <!-- Contenido -->
    <section class="bg-white border-y border-[#e5e2e1]" aria-label="Contenido del documento">
      <div class="max-w-[1000px] mx-auto px-6 md:px-12 py-12 md:py-16 grid lg:grid-cols-12 gap-10">
        <!-- Índice (solo documentos con varias secciones) -->
        <nav v-if="toc.length > 3" class="lg:col-span-4 lg:order-2" aria-label="Contenido">
          <div class="lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto bg-[#fcf9f8] border border-[#e5e2e1] rounded-2xl p-5">
            <p class="label mb-3">Contenido</p>
            <ol class="space-y-2 text-sm">
              <li v-for="t in toc" :key="t.id">
                <a :href="`#${t.id}`" class="text-gray-700 hover:text-[#8a6a35] hover:underline underline-offset-2" @click.prevent="goTo(t.id)">{{ t.text }}</a>
              </li>
            </ol>
          </div>
        </nav>

        <article class="min-w-0" :class="toc.length > 3 ? 'lg:col-span-8 lg:order-1' : 'lg:col-span-12 w-full max-w-[800px] mx-auto'">
          <p class="font-serif text-xl text-[#8a6a35] mb-6 break-words">{{ doc.documentTitle }}</p>

          <template v-for="(b, i) in doc.intro" :key="`i${i}`">
            <p v-if="'p' in b" class="prose-p mb-5">{{ b.p }}</p>
          </template>

          <section v-for="(s, si) in doc.sections" :id="s.heading ? `s-${si}` : undefined" :key="si" class="scroll-mt-28 mb-10 last:mb-0">
            <h2 v-if="s.heading" class="font-serif text-xl md:text-2xl text-[#0C2619] leading-snug mb-4 break-words">
              <span v-if="s.label" class="block font-sans text-[11px] font-bold tracking-[0.18em] uppercase text-[#8a6a35] mb-1">{{ s.label }}</span>
              {{ s.heading }}
            </h2>
            <template v-for="(b, bi) in s.blocks" :key="bi">
              <p v-if="'p' in b" class="prose-p mb-4">{{ b.p }}</p>
              <ul v-else class="doc-list mb-4">
                <li v-for="(it, li) in b.list" :key="li" class="prose-p">{{ it }}</li>
              </ul>
            </template>
          </section>

          <!-- Campos del formato -->
          <div v-if="doc.fields.length" class="mt-8 border border-[#e5e2e1] rounded-2xl p-6 bg-[#fcf9f8]" role="group" aria-label="Campos del formato">
            <p class="label mb-4">Datos del titular</p>
            <div v-for="(row, ri) in doc.fields" :key="ri" class="grid gap-x-8 gap-y-5 mb-5 last:mb-0" :class="row.length > 1 ? 'sm:grid-cols-2' : ''">
              <div v-for="f in row" :key="f" class="border-b border-gray-300 pb-1 pt-5 text-sm text-gray-600">{{ f }}</div>
            </div>
            <p class="mt-5 text-sm text-gray-600 font-light">Descarga el PDF para diligenciarlo y firmarlo.</p>
          </div>

          <p v-if="doc.closing" class="mt-10 text-gray-600 font-light italic">{{ doc.closing }}</p>
        </article>
      </div>
    </section>

    <!-- Cierre: descarga destacada (tarjeta oscura sobre marfil, no se funde con el pie de página) -->
    <section aria-labelledby="doc-download">
      <div class="max-w-[1000px] mx-auto px-6 md:px-12 py-14 md:py-20">
        <div class="bg-[#0C2619] rounded-2xl shadow-xl border border-[#D3A76A]/30 px-6 py-10 md:px-14 text-center">
          <h2 id="doc-download" class="font-serif text-2xl md:text-3xl font-medium text-white leading-tight">¿Prefieres guardar una copia?</h2>
          <p class="mt-3 max-w-xl mx-auto text-white/70 font-light">Descarga el documento original en PDF.</p>
          <div class="mt-7 flex flex-col sm:flex-row justify-center gap-3">
            <a :href="doc.file" :download="`${doc.slug}.pdf`" class="btn btn-gold" :aria-label="`Descargar ${doc.title} (PDF)`">Descargar PDF</a>
            <a :href="doc.driveUrl" target="_blank" rel="noopener noreferrer" class="btn btn-outline" :aria-label="`Ver documento: ${doc.title} (se abre en una pestaña nueva)`">Ver documento</a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// Vista de un documento legal de /recursos: contenido estático (data/resourceDocuments.ts) y descarga del PDF original.
// Un slug inexistente responde 404.
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { createError, useSeoMeta } from '#imports'
import { resourceDocumentBySlug } from '~/data/resourceDocuments'

const route = useRoute()
const slug = String(route.params.slug ?? '')
const doc = resourceDocumentBySlug(slug)
if (!doc) throw createError({ statusCode: 404, statusMessage: 'Documento no encontrado', fatal: true })

// Índice: una entrada por sección con título.
const toc = computed(() => (doc?.sections ?? [])
  .map((s, i) => ({ id: `s-${i}`, heading: s.heading, text: [s.label, s.heading].filter(Boolean).join(': ') }))
  .filter(t => t.heading))

function goTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  history.replaceState(history.state, '', `#${id}`)
}

const title = `${doc?.title ?? 'Documento'} | Planmed`
useSeoMeta({ title, ogTitle: title, description: doc?.description, ogDescription: doc?.description, ogType: 'article' })
</script>

<style scoped>
.label { font-size: 0.6875rem; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 700; color: #8a6a35; margin-bottom: 0.15rem; }
.prose-p { color: #4b5563; font-weight: 300; font-size: 1.0625rem; line-height: 1.75; overflow-wrap: anywhere; }
.doc-list { list-style: none; padding: 0; }
.doc-list li { position: relative; padding-left: 1.4rem; margin-top: 0.6rem; }
.doc-list li::before { content: ''; position: absolute; left: 0; top: 0.8em; width: 6px; height: 6px; border-radius: 9999px; background: #D3A76A; }
.btn { display: inline-flex; align-items: center; justify-content: center; min-height: 3rem; padding: 0.8rem 1.8rem; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; border-radius: 9999px; text-align: center; transition: background-color 0.2s, color 0.2s, transform 0.15s; }
.btn:active { transform: scale(0.97); }
.btn:focus-visible { outline: 2px solid #D3A76A; outline-offset: 3px; }
.btn-gold { background: #D3A76A; color: #0C2619; }
.btn-gold:hover { background: #dfb97f; }
.btn-outline { border: 1.5px solid rgba(255, 255, 255, 0.6); color: #ffffff; }
.btn-outline:hover { background: #ffffff; color: #0C2619; }
@media (prefers-reduced-motion: reduce) { .btn { transition: none; } .btn:active { transform: none; } }
</style>

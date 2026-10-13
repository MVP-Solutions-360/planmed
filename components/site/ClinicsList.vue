<template>
  <section v-if="clinics.length" aria-label="Clínicas aliadas" class="mt-10 space-y-14 md:space-y-20">
    <article v-for="c in clinics" :id="c.id" :key="c.id" class="bg-white border border-[#e5e2e1] scroll-mt-28">
      <div class="grid md:grid-cols-5">
        <div class="md:col-span-2 bg-[#0C2619]">
          <img :src="c.image" :alt="`Imagen de ${c.name}`" loading="lazy" class="w-full h-full min-h-[240px] max-h-[420px] md:max-h-none object-cover aspect-[4/3] md:aspect-auto" />
        </div>
        <div class="md:col-span-3 p-6 md:p-10">
          <span class="block w-10 h-[2px] bg-[#D3A76A] mb-5" aria-hidden="true"></span>
          <h2 class="font-serif text-2xl md:text-3xl font-medium text-[#0C2619] break-words">{{ c.name }}</h2>
          <CommonRichContent :html="c.description" class="mt-4 text-gray-600 font-light text-base md:text-lg leading-relaxed" />
        </div>
      </div>

      <div v-if="c.gallery.length" class="border-t border-[#e5e2e1] p-6 md:p-10">
        <h3 class="text-[11px] font-bold tracking-[0.15em] uppercase text-[#9a7a45] mb-4">Galería</h3>
        <ul class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <li v-for="(g, gi) in c.gallery" :key="g">
            <a :href="g" target="_blank" rel="noopener noreferrer" class="block aspect-[4/3] overflow-hidden bg-[#fcf9f8] focus-visible:outline-2 focus-visible:outline-[#0C2619]" :aria-label="`Ver imagen ${gi + 1} de ${c.name} en tamaño completo`">
              <img :src="g" :alt="`${c.name}: imagen ${gi + 1}`" loading="lazy" class="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            </a>
          </li>
        </ul>
      </div>

      <div v-if="c.documents.length" class="border-t border-[#e5e2e1] p-6 md:p-10 bg-[#fcf9f8]">
        <h3 class="text-[11px] font-bold tracking-[0.15em] uppercase text-[#9a7a45] mb-4">Documentos y certificados</h3>
        <ul class="grid gap-4 md:grid-cols-2">
          <li v-for="d in c.documents" :key="d.id" class="bg-white border border-[#e5e2e1] border-l-[3px] border-l-[#D3A76A] p-4">
            <p class="font-semibold text-[#0C2619] break-words">{{ d.title }}</p>
            <ul class="mt-2 space-y-1">
              <li v-for="f in d.files" :key="f.url">
                <a :href="f.url" target="_blank" rel="noopener noreferrer" class="text-sm text-gray-600 underline underline-offset-2 hover:text-[#0C2619] break-all">{{ f.name || 'Ver archivo' }}<span class="sr-only"> (se abre en una pestaña nueva)</span></a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
// Clínicas aliadas administradas desde /admin/paginas/clinicas-aliadas (GET /api/public/clinics). Sin clínicas no se muestra nada.
import { computed } from 'vue'
import { useFetch } from '#imports'
import { clinicsDefault, type ClinicsContent } from '#shared/utils/clinics'

const { data } = await useFetch<ClinicsContent>('/api/public/clinics', { key: 'clinics-public', default: () => clinicsDefault() })
const clinics = computed(() => data.value?.clinics ?? [])
</script>

<template>
  <div class="pb-24">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <NuxtLink to="/admin/noticias" class="text-[11px] font-bold tracking-[0.15em] text-[#848484] hover:text-[#0C2619] uppercase flex items-center gap-2 mb-4 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Volver a Noticias
        </NuxtLink>
        <h2 class="text-3xl font-serif text-[#0C2619] mb-1 uppercase">{{ isNew ? 'Nueva Noticia' : 'Editar Noticia' }}</h2>
        <p class="text-gray-500 font-light">{{ isNew ? 'Redacta un nuevo' : 'Modifica este' }} artículo editorial.</p>
      </div>
      <div class="flex items-center gap-3">
        <button 
          @click="submitForm" 
          :disabled="isSubmitting"
          class="bg-[#0C2619] hover:bg-[#153a28] text-white px-8 py-3 rounded-lg font-bold text-xs tracking-widest uppercase transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg"
        >
          <span v-if="isSubmitting">Guardando...</span>
          <span v-else>Guardar Cambios</span>
        </button>
      </div>
    </div>

    <form @submit.prevent="submitForm" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Columna Principal -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Información Principal -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Información Principal</h3>
          
          <div class="space-y-6">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Título *</label>
              <input v-model="form.title" required type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="Título del artículo" />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Slug *</label>
              <input v-model="form.slug" :required="!isNew" type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent font-mono text-sm" placeholder="se-generara-automaticamente-si-lo-dejas-vacio" />
              <p class="text-[10px] text-gray-500 mt-1">Identificador de la URL. Si se deja vacío al crear, se generar desde el título.</p>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Autor</label>
              <input v-model="form.author" type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="Ej: Equipo Planmed" />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Extracto (Excerpt) *</label>
              <textarea v-model="form.excerpt" required rows="3" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent resize-none" placeholder="Breve resumen que aparece en las listas de noticias..."></textarea>
            </div>
          </div>
        </div>

        <!-- Contenido Editorial -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Contenido Editorial *</h3>
          <div>
            <textarea v-model="form.content" required rows="15" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent font-mono text-sm leading-relaxed" placeholder="<p>Escribe tu contenido aqu...</p>"></textarea>
            <p class="text-[10px] text-gray-500 mt-2">En esta fase, puedes usar etiquetas HTML bsicas (p, h2, ul, li) para estructurar el contenido.</p>
          </div>
        </div>

        <!-- Multimedia Embebida -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Multimedia Integrada</h3>
          
          <div class="space-y-6">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#E1306C]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                Post de Instagram (URL)
              </label>
              <input v-model="form.instagramUrl" type="url" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C] focus:border-transparent" placeholder="https://www.instagram.com/p/CL7pTzuLxg4/" />
              <p class="text-[10px] text-gray-500 mt-1">Pega el link directo al post. El componente lo embeber de forma segura.</p>
            </div>
            
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#FF0000]" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                Video de YouTube (URL de Embebido)
              </label>
              <input v-model="form.youtubeUrl" type="url" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF0000] focus:border-transparent" placeholder="https://www.youtube.com/embed/tPAVprOsJF0" />
              <p class="text-[10px] text-gray-500 mt-1">Usa la URL de 'embed', no la del reproductor normal.</p>
            </div>
          </div>
        </div>

      </div>

      <!-- Columna Secundaria -->
      <div class="space-y-6">
        
        <!-- Estado / Publicacin -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Visibilidad</h3>
          
          <label class="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#0C2619] transition-colors mb-4">
            <input v-model="isPublished" type="checkbox" class="w-5 h-5 mt-0.5 text-[#0C2619] focus:ring-[#0C2619] border-gray-300 rounded" />
            <div class="flex flex-col">
              <span class="text-sm font-bold text-gray-900">Noticia Publicada</span>
              <span class="text-[10px] text-gray-500 mt-1">Los cambios se aplican al guardar la noticia.</span>
            </div>
          </label>

          <div v-if="isPublished">
            <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Fecha de Publicacin</label>
            <input v-model="form.publishedAtStr" type="datetime-local" class="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#0C2619]" />
          </div>
        </div>

        <!-- Imagen de Portada -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Portada</h3>
          
          <div v-if="form.coverImage" class="w-full aspect-[4/3] rounded-lg overflow-hidden mb-4 border border-gray-200">
            <img :src="form.coverImage" alt="Cover" class="w-full h-full object-cover" />
          </div>
          <div v-else class="w-full aspect-[4/3] rounded-lg mb-4 border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
            Sin portada
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">URL de la Imagen *</label>
            <input v-model="form.coverImage" required type="url" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent text-sm" placeholder="/images/..." />
          </div>
        </div>

        <!-- SEO -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">SEO</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Meta Title</label>
              <input v-model="form.seo.metaTitle" type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent text-sm" placeholder="Título para Google" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Meta Description</label>
              <textarea v-model="form.seo.metaDescription" rows="4" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent text-sm resize-none" placeholder="Extracto persuasivo de mx 160 caracteres"></textarea>
            </div>
          </div>
        </div>

      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { clearNuxtData } from '#app'
import { useRoute, useRouter, useHead } from '#imports'
import { newsService } from '~/services/NewsService'
import type { NewsArticle } from '~/types/news'

useHead({
  title: 'Editor de Noticias | Admin Planmed'
})
definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const router = useRouter()
const slugParam = route.params.slug as string
const isNew = slugParam === 'nuevo'

const isSubmitting = ref(false)

const isPublished = ref(false)

const form = ref({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  author: '',
  publishedAtStr: '',
  instagramUrl: '',
  youtubeUrl: '',
  seo: {
    metaTitle: '',
    metaDescription: ''
  }
})

onMounted(async () => {
  if (!isNew) {
    const data = await newsService.getNewsBySlug(slugParam)
    if (data) {
      form.value.title = data.title || ''
      form.value.slug = data.slug || ''
      form.value.excerpt = data.excerpt || ''
      form.value.content = data.content || ''
      form.value.coverImage = data.coverImage || ''
      form.value.author = data.author || ''
      form.value.instagramUrl = data.instagramUrl || ''
      form.value.youtubeUrl = data.youtubeUrl || ''
      
      if (data.seo) {
        form.value.seo.metaTitle = data.seo.metaTitle || ''
        form.value.seo.metaDescription = data.seo.metaDescription || ''
      }

      if (data.publishedAt) {
        isPublished.value = true
        // format datetime-local expects YYYY-MM-DDThh:mm
        const d = new Date(data.publishedAt)
        const tzOffset = d.getTimezoneOffset() * 60000;
        form.value.publishedAtStr = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16)
      }
    } else {
      clearNuxtData().then(() => router.push('/admin/noticias'))
    }
  } else {
    // Si es nueva, pre-marcamos publicado pero con la fecha actual
    isPublished.value = true
    const d = new Date(); const tzOffset = d.getTimezoneOffset() * 60000; form.value.publishedAtStr = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16)
  }
})

// Auto-generar fecha si marcan publicado y estaba vacio
watch(isPublished, (val) => {
  if (val && !form.value.publishedAtStr) {
    const d = new Date(); const tzOffset = d.getTimezoneOffset() * 60000; form.value.publishedAtStr = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16)
  }
})

async function submitForm() {
  isSubmitting.value = true
  try {
    
    // Parsear fecha
    let finalPublishedAt: string | null = null
    if (isPublished.value) {
      finalPublishedAt = form.value.publishedAtStr 
        ? new Date(form.value.publishedAtStr).toISOString() 
        : new Date().toISOString()
    }

    const payload: Partial<NewsArticle> = {
      title: form.value.title,
      slug: form.value.slug,
      excerpt: form.value.excerpt,
      content: form.value.content,
      coverImage: form.value.coverImage,
      author: form.value.author,
      instagramUrl: form.value.instagramUrl || undefined,
      youtubeUrl: form.value.youtubeUrl || undefined,
      publishedAt: finalPublishedAt,
      seo: { ...form.value.seo }
    }

    if (isNew) {
      // Remover slug si esta vacio para autogeneracion en el provider
      if (!payload.slug) {
        delete payload.slug;
      }
      await newsService.createNews(payload as Omit<NewsArticle, 'id' | 'slug'>)
      alert(isPublished.value ? 'Noticia publicada correctamente.' : 'Borrador creado correctamente.')
    } else {
      await newsService.updateNews(slugParam, payload)
      alert(isPublished.value ? 'Noticia publicada correctamente.' : 'Noticia despublicada correctamente.')
    }

    clearNuxtData().then(() => router.push('/admin/noticias'))
  } catch (error: any) {
    console.error('Error saving news:', error)
    alert(error.message || 'Ocurrió un error al guardar.')
  } finally {
    isSubmitting.value = false
  }
}
</script>
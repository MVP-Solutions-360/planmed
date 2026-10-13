<template>
  <div class="min-h-screen flex flex-col bg-[#fcf9f8] text-black font-sans">
    <!-- Cabecera mínima: no depende del Hub (el menú del sitio consulta datos externos y no debe poder romper la página de error). -->
    <header class="w-full bg-[#fcf9f8] border-b border-[#e5e2e1]">
      <div class="max-w-[1440px] mx-auto px-6 h-[88px] flex items-center">
        <a href="/" class="block rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2619] focus-visible:ring-offset-4" aria-label="Planmed, ir al inicio">
          <img src="/images/branding/logo.jpg" alt="Planmed" class="h-10 md:h-14 w-auto object-contain" />
        </a>
      </div>
    </header>

    <main id="contenido" class="flex-grow flex items-center justify-center px-6 py-16 md:py-24">
      <section class="w-full max-w-2xl text-center" aria-labelledby="error-titulo">
        <p class="font-serif text-[7.5rem] sm:text-[10rem] leading-none text-[#D3A76A] select-none" aria-hidden="true">{{ view.code }}</p>
        <p class="mt-2 text-[11px] font-bold tracking-[0.2em] uppercase text-[#4c4546]">Error {{ view.code }}</p>

        <h1 id="error-titulo" class="mt-6 font-serif text-3xl sm:text-4xl md:text-5xl uppercase text-[#0C2619] leading-tight">{{ view.title }}</h1>
        <p class="mt-5 text-base md:text-lg leading-relaxed text-[#4c4546] max-w-xl mx-auto">{{ view.message }}</p>

        <div class="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <button type="button" class="btn-primary" @click="goHome">Ir al inicio</button>
          <button v-if="view.login" type="button" class="btn-secondary" @click="goLogin">Iniciar sesión</button>
          <button v-if="view.admin && !view.login" type="button" class="btn-secondary" @click="goPanel">Ir al panel</button>
          <button v-if="view.retry" type="button" class="btn-secondary" @click="retry">Reintentar</button>
          <button v-if="canGoBack" type="button" class="btn-secondary" @click="goBack">Volver atrás</button>
        </div>

        <!-- Solo en desarrollo: el detalle técnico nunca llega a producción. -->
        <details v-if="isDev && technical" class="mt-12 text-left text-xs text-[#4c4546] bg-white border border-[#e5e2e1] rounded-lg p-4">
          <summary class="cursor-pointer font-bold uppercase tracking-widest">Detalle técnico (solo desarrollo)</summary>
          <pre class="mt-3 whitespace-pre-wrap break-words">{{ technical }}</pre>
        </details>
      </section>
    </main>

    <footer class="border-t border-[#e5e2e1] py-6 px-6 text-center text-xs text-[#4c4546]">
      © Planmed. Si el problema continúa, escríbenos por <a class="font-bold underline hover:text-black" href="https://wa.me/573014746735" target="_blank" rel="noopener noreferrer">WhatsApp</a>.
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { NuxtError } from '#app'
import { clearError, reloadNuxtApp, useHead, useRoute, useSeoMeta } from '#imports'
import { describeSiteError } from '~/utils/siteError'

const props = defineProps<{ error: NuxtError }>()

const route = useRoute()
const isDev = import.meta.dev
const view = computed(() => describeSiteError({ statusCode: props.error?.statusCode, statusMessage: props.error?.statusMessage, path: route.path }))
// Detalle técnico: solo se arma en desarrollo (en producción ni siquiera se calcula).
const technical = computed(() => (isDev ? [props.error?.statusMessage, props.error?.message, props.error?.stack].filter(Boolean).join('\n\n') : ''))

useHead({
  htmlAttrs: { lang: 'es' },
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..700;1,400..700&family=Inter:wght@400;500;600;700&display=swap' }
  ]
})
useSeoMeta({ title: () => `${view.value.title} | Planmed`, robots: 'noindex, nofollow' })

// «Volver atrás» solo si hay un destino razonable: una página previa del propio sitio (no al abrir la URL directamente).
const canGoBack = ref(false)
onMounted(() => {
  try {
    canGoBack.value = window.history.length > 1 && !!document.referrer && new URL(document.referrer).origin === window.location.origin
  } catch {
    canGoBack.value = false
  }
})

const goHome = () => clearError({ redirect: '/' })
const goLogin = () => clearError({ redirect: '/admin/login' })
const goPanel = () => clearError({ redirect: '/admin' })
// Reintentar: recarga completa de la misma URL (acción del usuario, no automática: no hay bucle).
const retry = () => reloadNuxtApp({ path: route.fullPath, persistState: false })
const goBack = async () => {
  await clearError()
  window.history.back()
}
</script>

<style scoped>
.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 2rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
  cursor: pointer;
}
.btn-primary { background: #0C2619; color: #fff; border: 1px solid #0C2619; }
.btn-primary:hover { background: #153a28; }
.btn-secondary { background: transparent; color: #0C2619; border: 1px solid #0C2619; }
.btn-secondary:hover { background: #0C2619; color: #fff; }
.btn-primary:focus-visible,
.btn-secondary:focus-visible { outline: 2px solid #0C2619; outline-offset: 3px; }
</style>

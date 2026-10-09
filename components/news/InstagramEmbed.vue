<template>
  <div class="my-8 flex justify-center w-full">
    <div class="w-full max-w-[540px]">
      <blockquote 
        class="instagram-media" 
        :data-instgrm-permalink="permalink"
        data-instgrm-version="13"
        style="background: #FFF; border: 0; border-radius: 3px; box-shadow: 0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width: 540px; min-width: 326px; padding: 0; width: calc(100% - 2px);"
      >
        <div style="padding: 16px; text-align: center;">
          <a :href="permalink" target="_blank" rel="noopener" class="text-sm text-gray-500 hover:text-gray-800">
            Ver publicación en Instagram
          </a>
        </div>
      </blockquote>
    </div>
  </div>
</template>

<script lang="ts">
// embed.js se carga una sola vez para toda la página; cada embed espera a la misma promesa.
let embedScript: Promise<void> | null = null
function loadEmbedScript(): Promise<void> {
  const w = window as any
  if (w.instgrm) return Promise.resolve()
  embedScript ||= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://www.instagram.com/embed.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => { embedScript = null; reject(new Error('instagram embed.js')) }
    document.body.appendChild(script)
  })
  return embedScript
}

// Un solo process() agrupado para todos los embeds montados en el mismo tick (llamadas
// concurrentes dejan embeds sin procesar). Si alguno sigue sin procesarse, se reintenta.
let processTimer: ReturnType<typeof setTimeout> | null = null
function scheduleProcess(attempt = 0) {
  if (processTimer) return
  processTimer = setTimeout(async () => {
    processTimer = null
    try {
      await loadEmbedScript()
      ;(window as any).instgrm?.Embeds.process()
    } catch { return }
    if (attempt < 3) {
      setTimeout(() => {
        if (document.querySelector('blockquote.instagram-media')) scheduleProcess(attempt + 1)
      }, 2000)
    }
  }, 50)
}
</script>

<script setup lang="ts">
import { computed, onMounted } from 'vue'

const props = defineProps<{
  url: string
}>()

// Instagram solo procesa permalinks limpios: sin parámetros (?utm_...) y con "/" final.
const permalink = computed(() => {
  try {
    const u = new URL(props.url.trim())
    return `https://www.instagram.com${u.pathname.replace(/\/?$/, '/')}`
  } catch {
    return props.url
  }
})

onMounted(() => scheduleProcess())
</script>

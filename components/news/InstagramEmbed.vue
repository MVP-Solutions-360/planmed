<template>
  <div class="my-8 flex justify-center w-full">
    <div class="w-full max-w-[540px]">
      <blockquote 
        class="instagram-media" 
        :data-instgrm-permalink="url" 
        data-instgrm-version="13"
        style="background: #FFF; border: 0; border-radius: 3px; box-shadow: 0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width: 540px; min-width: 326px; padding: 0; width: calc(100% - 2px);"
      >
        <div style="padding: 16px; text-align: center;">
          <a :href="url" target="_blank" rel="noopener" class="text-sm text-gray-500 hover:text-gray-800">
            Ver publicación en Instagram
          </a>
        </div>
      </blockquote>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

const props = defineProps<{
  url: string
}>()

onMounted(() => {
  if (!(window as any).instgrm) {
    const script = document.createElement('script')
    script.src = '//www.instagram.com/embed.js'
    script.async = true
    document.body.appendChild(script)
    script.onload = () => {
      if ((window as any).instgrm) {
        (window as any).instgrm.Embeds.process()
      }
    }
  } else {
    (window as any).instgrm.Embeds.process()
  }
})
</script>

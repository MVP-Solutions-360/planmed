<template>
  <!-- El HTML siempre pasa por sanitizeRichHtml (lista blanca) antes de llegar a v-html. -->
  <div class="rich-content" v-html="safeHtml"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { sanitizeRichHtml } from '~/utils/richText'

const props = defineProps<{ html?: string | null }>()
const safeHtml = computed(() => sanitizeRichHtml(props.html))
</script>

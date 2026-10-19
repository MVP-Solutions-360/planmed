<template>
  <div class="pb-24">
    <AdminRecommendationsTreeBreadcrumb :crumbs="[{ label: 'Recomendaciones', to: '/admin/recomendaciones/temas' }, { label: 'Tema', to: topicUrl }, { label: 'Subtema', to: subtopicUrl }, { label: 'Nueva sección' }]" />
    <h2 class="mb-6 text-3xl font-serif text-[#0C2619] uppercase">Nueva sección</h2>
    <AdminRecommendationsTreeSectionForm v-if="valid" :subtopic-id="subId" :topic-id="topicId" />
    <p v-else class="text-sm text-red-700">La dirección no es válida.</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useHead, useRoute } from '#imports'

useHead({ title: 'Nueva sección | Admin Planmed' })
definePageMeta({ layout: 'admin' })

const route = useRoute()
const topicId = computed(() => Number(route.params.topic))
const subId = computed(() => Number(route.params.subtopic))
const valid = computed(() => [topicId.value, subId.value].every(n => Number.isSafeInteger(n) && n > 0))
const topicUrl = computed(() => `/admin/recomendaciones/temas/${topicId.value}`)
const subtopicUrl = computed(() => `${topicUrl.value}/subtemas/${subId.value}`)
</script>

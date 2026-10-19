<template>
  <nav aria-label="Ruta" class="mb-4 text-xs text-gray-500">
    <ol class="flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <li v-for="(c, i) in crumbs" :key="i" class="flex min-w-0 items-center gap-1.5">
        <NuxtLink v-if="c.to" :to="c.to" class="max-w-[16rem] truncate font-semibold hover:text-[#D3A76A] sm:max-w-xs" :title="c.label">{{ c.label }}</NuxtLink>
        <span v-else class="max-w-[16rem] truncate font-semibold text-[#0C2619] sm:max-w-xs" :title="c.label" aria-current="page">{{ c.label }}</span>
        <span v-if="i < crumbs.length - 1" aria-hidden="true">›</span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
defineProps<{ crumbs: { label: string, to?: string }[] }>()
</script>

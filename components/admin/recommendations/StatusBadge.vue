<template>
  <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase whitespace-nowrap" :class="tones[tone]">
    <span class="w-1.5 h-1.5 rounded-full" :class="dots[tone]"></span>{{ label }}
  </span>
</template>

<script setup lang="ts">
export type BadgeTone = 'green' | 'amber' | 'gray' | 'blue' | 'red'

defineProps<{ label: string, tone: BadgeTone }>()

const tones: Record<BadgeTone, string> = {
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  gray: 'bg-gray-100 text-gray-500',
  blue: 'bg-sky-50 text-sky-700',
  red: 'bg-red-50 text-red-700'
}
const dots: Record<BadgeTone, string> = {
  green: 'bg-emerald-500', amber: 'bg-amber-500', gray: 'bg-gray-400', blue: 'bg-sky-500', red: 'bg-red-500'
}
</script>

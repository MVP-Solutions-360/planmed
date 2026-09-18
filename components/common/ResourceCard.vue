<template>
  <div :class="[
    'rounded-2xl flex flex-col border transition-all overflow-hidden',
    highlight ? 'bg-primary text-[#111111] border-primary shadow-xl md:-translate-y-2' : 
    (isPlaceholder ? 'bg-white border-[#BBB2AA]/20 shadow-none opacity-70 grayscale' : 'bg-white border-[#BBB2AA]/20 shadow-sm hover:shadow-md hover:-translate-y-1')
  ]">
    <!-- Image section: no padding, flush at top, aspect-ratio for consistency -->
    <div class="w-full bg-[#F7F3EE] flex items-center justify-center overflow-hidden border-b border-[#BBB2AA]/10"
         style="aspect-ratio: 16/9;">
      <img
        v-if="imageSrc"
        :src="imageSrc"
        :alt="title"
        class="w-full h-full object-contain"
        loading="lazy"
      />
      <span v-else class="text-4xl">{{ icon }}</span>
    </div>

    <!-- Card body -->
    <div class="flex flex-col flex-grow p-6">
      <div class="flex items-start justify-between mb-3">
        <h3 :class="['text-lg font-bold leading-snug', highlight ? 'text-[#111111]' : 'text-[#111111]']">
          {{ title }}
        </h3>
        <span v-if="isPlaceholder" class="text-[10px] uppercase font-bold px-2 py-1 rounded-full bg-[#F7F3EE] text-[#BBB2AA] shrink-0 ml-2 border border-[#BBB2AA]/30 whitespace-nowrap">
          Próximamente
        </span>
      </div>

      <p :class="['text-sm mb-6 flex-grow leading-relaxed', highlight ? 'text-[#111111]/90' : 'text-[#BBB2AA]']">
        {{ description }}
      </p>

      <div class="flex items-center justify-between mt-auto pt-4 border-t" :class="highlight ? 'border-[#111111]/20' : 'border-[#BBB2AA]/20'">
        <span :class="['text-xs font-bold flex items-center gap-1', highlight ? 'text-[#111111]/70' : 'text-[#BBB2AA]']">
          {{ fileFormat }}<template v-if="fileSize && fileSize !== '-- MB'"> · {{ fileSize }}</template>
        </span>
        <a v-if="!isPlaceholder" :href="downloadUrl" download
           :class="['font-bold text-sm flex items-center gap-2 transition-opacity hover:opacity-80', highlight ? 'text-[#111111]' : 'text-primary']">
          Descargar <span aria-hidden="true">⬇</span>
        </a>
        <span v-else :class="['font-bold text-sm flex items-center gap-1 opacity-50 cursor-not-allowed select-none', highlight ? 'text-[#111111]' : 'text-[#BBB2AA]']">
          Próximamente
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  description: String,
  icon: { type: String, default: '📄' },
  fileFormat: { type: String, default: 'PDF' },
  fileSize: { type: String, default: '-- MB' },
  downloadUrl: { type: String, default: '#' },
  imageSrc: { type: String, default: '' },
  highlight: { type: Boolean, default: false },
  isPlaceholder: { type: Boolean, default: true }
})
</script>

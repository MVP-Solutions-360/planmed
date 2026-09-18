<template>
  <div class="group flex flex-col gap-6 cursor-pointer">
    <div class="relative w-full aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-[#e5e2e1]">
      <img 
        :src="procedure.image" 
        :alt="procedure.name" 
        class="w-full h-full object-cover grayscale contrast-125 brightness-95 transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
      />
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 z-10"></div>
    </div>
    <div class="flex flex-col gap-3">
      <div class="flex justify-between items-center">
        <h3 class="font-serif text-[24px] md:text-[28px] text-black transition-colors duration-300">{{ procedure.name }}</h3>
        <span class="w-8 h-8 rounded-full border border-[#e5e2e1] flex items-center justify-center text-[#848484] group-hover:border-black group-hover:bg-black group-hover:text-white transition-all duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </span>
      </div>
      <p class="text-[14px] text-[#4c4546] font-normal leading-[1.6] max-w-[95%]">
        {{ procedure.shortDescription }}
      </p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  procedure: {
    type: Object,
    required: true
  }
})
</script>

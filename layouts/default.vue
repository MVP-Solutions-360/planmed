<template>
  <div class="min-h-screen bg-white text-black flex flex-col font-sans">
    <LayoutNavbar />
    <main class="flex-grow">
      <slot />
    </main>
    <LayoutFooter />
    
    <!-- Global FAB -->
    <a href="https://wa.me/573014746735?text=Estuve revisando la página y me gustaría más información acerca de las opciones de financiación." target="_blank" class="fixed bottom-4 right-4 md:bottom-8 md:right-8 bg-black text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 hover:bg-primary active:scale-95 transition-all z-40 group">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.031 0C5.385 0 0 5.388 0 12.035c0 2.124.551 4.195 1.6 6.012L.15 23.518l5.63-1.478a11.956 11.956 0 006.25 1.761h.005c6.645 0 12.03-5.389 12.03-12.036C24.062 5.388 18.674 0 12.031 0zm0 21.8A9.97 9.97 0 016.924 20.4l-.364-.216-3.791.993.996-3.69-.236-.376C2.391 15.352 1.8 13.722 1.8 12.035 1.8 6.4 6.386 1.82 12.033 1.82c5.645 0 10.231 4.582 10.231 10.215 0 5.634-4.585 10.216-10.231 10.216v-.451zm5.61-7.66c-.308-.154-1.822-.9-2.105-1.002-.284-.102-.49-.154-.698.154-.207.308-.797 1.003-.975 1.208-.18.205-.357.23-.665.077-1.348-.675-2.45-1.428-3.39-2.784-.243-.346.242-.32.836-1.503.076-.153.037-.282-.02-.435-.056-.154-.698-1.684-.956-2.308-.25-.608-.507-.525-.698-.534-.18-.009-.387-.01-.595-.01-.207 0-.542.077-.826.385C7.26 7.42 6.4 8.243 6.4 9.914c0 1.671 1.293 3.29 1.474 3.533.18.244 2.404 3.674 5.82 5.148 2.298.989 3.226 1.05 4.354.887 1.267-.183 3.864-1.579 4.405-3.107.542-1.527.542-2.836.38-3.107-.164-.27-.595-.425-.903-.58z" />
      </svg>
      <span class="hidden md:block absolute right-16 bg-black text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {{ 'Hablar con un asesor' }}
      </span>
    </a>

    <!-- Modal Precontractual Global (no se monta en los micrositios PRP: /prp/**) -->
    <CommonPrecontractualModal v-if="!isPrpPage" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
// Los micrositios de referidos (/prp/**) no muestran la información precontractual global.
const isPrpPage = computed(() => /^\/prp(\/|$)/.test(route.path))
</script>

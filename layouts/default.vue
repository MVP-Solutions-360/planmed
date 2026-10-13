<template>
  <div class="min-h-screen bg-white text-black flex flex-col font-sans">
    <LayoutNavbar />
    <main class="flex-grow">
      <slot />
    </main>
    <LayoutFooter />
    
    <!-- Chat global: botón flotante con WhatsApp y Messenger (reemplaza el FAB único de WhatsApp) -->
    <LayoutChatLauncher />

    <!-- «Pide tu cita de valoración»: botón flotante + ventana (maqueta, no funcional). Sin micrositios PRP. -->
    <FormsValuationRequest v-if="!isPrpPage" />

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

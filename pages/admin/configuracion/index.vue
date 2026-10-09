<template>
  <div>
    <div class="mb-10">
      <h2 class="text-3xl font-serif text-[#0C2619] mb-2 uppercase">Configuración</h2>
      <p class="text-gray-500 font-light">Administración de usuarios de la línea Planmed. Solo visible para el líder de la línea.</p>
    </div>

    <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
      <h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Usuarios</h3>
      <div class="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 leading-relaxed">
        <p class="font-bold mb-1">Pendiente de Wellezy Hub</p>
        <p>
          El listado de usuarios de la línea y la acción Activar/Desactivar requieren endpoints de API en Wellezy Hub
          que todavía no existen. Esta sección se habilitará cuando estén disponibles.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHead } from '#imports'

useHead({ title: 'Configuración | Admin Planmed' })
definePageMeta({ layout: 'admin' })
</script>

<template>
  <div class="min-h-screen bg-[#fcf9f8] flex items-center justify-center p-6 font-sans selection:bg-[#0C2619] selection:text-white">
    <div class="w-full max-w-md">
      
      <!-- Logo y Encabezado -->
      <div class="text-center mb-10">
        <h1 class="font-serif text-[40px] font-medium text-[#0C2619] tracking-tight uppercase">Planmed.</h1>
        <p class="mt-3 text-[11px] font-bold tracking-[0.2em] text-[#D3A76A] uppercase">
          Panel Administrativo
        </p>
      </div>

      <!-- Tarjeta de Login -->
      <div class="bg-white rounded-xl shadow-2xl shadow-black/5 p-8 md:p-10 border border-[#e5e2e1]">
        
        <form @submit.prevent="onSubmit" class="space-y-6">
          
          <div v-if="error" class="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 text-sm">
            {{ error }}
          </div>

          <div>
            <label for="email" class="block text-xs font-bold tracking-wider text-gray-700 uppercase mb-2">
              Correo electrónico
            </label>
            <input 
              id="email"
              v-model="email"
              type="email" 
              required
              class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label for="password" class="block text-xs font-bold tracking-wider text-gray-700 uppercase mb-2">
              Contraseña
            </label>
            <input 
              id="password"
              v-model="password"
              type="password" 
              required
              class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            :disabled="loading"
            class="w-full bg-[#0C2619] text-white font-bold text-xs tracking-[0.15em] uppercase py-4 px-6 rounded-lg hover:bg-[#153a28] transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            <span v-if="loading">Iniciando sesión...</span>
            <span v-else>Iniciar sesión</span>
          </button>

        </form>

      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useHead, navigateTo } from '#imports'
import { authService } from '~/services/AuthService'

useHead({
  title: 'Iniciar sesión | Admin Planmed'
})

// Esta página usa su propio diseño
definePageMeta({
  layout: false
})

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  
  try {
    await authService.login(email.value, password.value)
    await navigateTo('/admin')
  } catch (e: any) {
    error.value = e.message || 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>
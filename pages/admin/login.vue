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
            <div class="relative">
              <input 
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'" 
                required
                autocomplete="current-password"
                class="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-[#0C2619] focus:outline-none focus-visible:text-[#0C2619]"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                :aria-pressed="showPassword"
                data-testid="toggle-password"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
              </button>
            </div>
          </div>

          <label class="flex items-center gap-3 text-sm text-gray-700 cursor-pointer select-none">
            <input
              v-model="remember"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 accent-[#0C2619]"
              data-testid="remember-me"
            />
            Recordarme en este equipo
          </label>

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
import { ref, onMounted } from 'vue'
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
const showPassword = ref(false)
const remember = ref(false)

// «Recordarme» guarda únicamente el correo en este navegador (nunca la contraseña ni el token); la sesión sigue siendo la de Hub.
const REMEMBER_KEY = 'planmed-admin-email'

onMounted(() => {
  try {
    const saved = localStorage.getItem(REMEMBER_KEY)
    if (saved) { email.value = saved; remember.value = true }
  } catch { /* almacenamiento bloqueado: el formulario funciona igual */ }
})

function persistRemember() {
  try {
    if (remember.value) localStorage.setItem(REMEMBER_KEY, email.value.trim())
    else localStorage.removeItem(REMEMBER_KEY)
  } catch { /* sin almacenamiento disponible */ }
}

async function onSubmit() {
  error.value = ''
  loading.value = true
  
  try {
    await authService.login(email.value, password.value)
    persistRemember()
    await navigateTo('/admin')
  } catch (e: any) {
    error.value = e.message || 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>
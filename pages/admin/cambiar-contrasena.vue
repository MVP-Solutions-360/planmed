<template>
  <div class="min-h-screen bg-[#fcf9f8] flex items-center justify-center p-6 font-sans selection:bg-[#0C2619] selection:text-white">
    <div class="w-full max-w-md">
      <div class="text-center mb-10">
        <h1 class="font-serif text-[40px] font-medium text-[#0C2619] tracking-tight uppercase">Planmed.</h1>
        <p class="mt-3 text-[11px] font-bold tracking-[0.2em] text-[#D3A76A] uppercase">Panel Administrativo</p>
      </div>

      <div class="bg-white rounded-xl shadow-2xl shadow-black/5 p-8 md:p-10 border border-[#e5e2e1]">
        <h2 class="text-sm font-bold tracking-wider text-[#0C2619] uppercase mb-2">Define tu contraseña</h2>
        <p class="text-sm text-gray-600 mb-6">
          Ingresaste con una contraseña temporal. Para continuar debes elegir tu contraseña personal.
          Las reglas de seguridad las valida Wellezy Hub (mínimo 8 caracteres, con mayúsculas, minúsculas, números y símbolos).
        </p>

        <form class="space-y-5" novalidate data-testid="change-password-form" @submit.prevent="onSubmit">
          <div v-if="error" role="alert" class="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 text-sm" data-testid="change-error">{{ error }}</div>

          <div v-for="f in fields" :key="f.key">
            <label :for="`cp-${f.key}`" class="block text-xs font-bold tracking-wider text-gray-700 uppercase mb-2">{{ f.label }}</label>
            <input
              :id="`cp-${f.key}`"
              v-model="form[f.key]"
              type="password"
              :autocomplete="f.auto"
              maxlength="1024"
              :aria-invalid="fieldErrors[f.key] ? 'true' : 'false'"
              :aria-describedby="fieldErrors[f.key] ? `cp-${f.key}-err` : undefined"
              class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent transition-all"
            />
            <p v-if="fieldErrors[f.key]" :id="`cp-${f.key}-err`" class="mt-1 text-xs text-red-700">{{ fieldErrors[f.key] }}</p>
          </div>

          <button type="submit" :disabled="saving" class="w-full bg-[#0C2619] text-white font-bold text-xs tracking-[0.15em] uppercase py-4 px-6 rounded-lg hover:bg-[#153a28] transition-colors disabled:opacity-70 disabled:cursor-not-allowed" data-testid="change-submit">
            <span v-if="saving">Guardando…</span>
            <span v-else>Guardar contraseña</span>
          </button>
        </form>

        <button type="button" class="mt-6 w-full text-center text-sm text-gray-500 hover:text-red-600" :disabled="saving" data-testid="change-logout" @click="onLogout">Cerrar sesión</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onBeforeUnmount } from 'vue'
import { useHead, navigateTo } from '#imports'
import { authService } from '~/services/AuthService'

useHead({ title: 'Cambiar contraseña | Admin Planmed' })
// Pantalla propia (sin el menú del panel): mientras el cambio sea obligatorio no hay otra navegación posible.
definePageMeta({ layout: false })

const fields = [
  { key: 'current_password', label: 'Contraseña actual (temporal)', auto: 'current-password' },
  { key: 'password', label: 'Nueva contraseña', auto: 'new-password' },
  { key: 'password_confirmation', label: 'Confirmar nueva contraseña', auto: 'new-password' }
] as const

// Las contraseñas viven solo en memoria de esta pantalla (nunca en almacenamiento, URL ni logs) y se borran al enviar y al salir.
const form = reactive({ current_password: '', password: '', password_confirmation: '' })
const fieldErrors = reactive<Record<string, string>>({})
const error = ref('')
const saving = ref(false)

function clearForm() {
  form.current_password = ''
  form.password = ''
  form.password_confirmation = ''
}

async function onSubmit() {
  // Guarda contra el doble envío: mientras hay una petición en vuelo, no se emite otra.
  if (saving.value) return
  saving.value = true
  error.value = ''
  for (const k of Object.keys(fieldErrors)) delete fieldErrors[k]
  try {
    const user = await authService.changePassword(form.current_password, form.password, form.password_confirmation)
    clearForm()
    // Con sesión renovada se entra al panel; si no se pudo renovar, se pide ingresar de nuevo con la contraseña nueva.
    await navigateTo(user ? '/admin' : '/admin/login?changed=1')
  } catch (e: any) {
    if (e.statusCode === 401) { clearForm(); await navigateTo('/admin/login'); return }
    const errors: Record<string, string[]> = e.errors ?? {}
    for (const [k, v] of Object.entries(errors)) if (k !== '_form' && v?.length) fieldErrors[k] = v[0]!
    error.value = errors._form?.[0] ?? (Object.keys(fieldErrors).length ? 'Revisa los campos marcados.' : e.message)
  } finally {
    saving.value = false
  }
}

async function onLogout() {
  clearForm()
  await authService.logout()
  await navigateTo('/admin/login')
}

onBeforeUnmount(clearForm)
</script>

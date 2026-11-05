<template>
  <form class="border border-gray-200 rounded-xl p-5 mb-6 bg-gray-50" novalidate aria-labelledby="lu-create-title" data-testid="line-user-create-form" @submit.prevent="submit">
    <h4 id="lu-create-title" class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-1">Nuevo colaborador</h4>
    <p class="text-sm text-gray-500 mb-4">
      Se crea en Wellezy Hub con una contraseña temporal que verás una sola vez al terminar; el colaborador deberá cambiarla en su primer ingreso.
      El salario y el auxilio de transporte quedan en 0 y se actualizan después desde Hub.
    </p>

    <p v-if="loadError" role="alert" class="rounded-lg border px-4 py-3 text-sm text-red-700 bg-red-50 border-red-200 mb-4">
      {{ loadError }} <button type="button" class="underline" @click="loadOptions">Reintentar</button>
    </p>

    <dl v-if="options" class="grid sm:grid-cols-2 gap-3 mb-4 text-sm">
      <div><dt class="text-[10px] uppercase tracking-wider text-gray-500">Empresa</dt><dd class="font-semibold text-gray-900" data-testid="ctx-company">{{ options.company?.name || '—' }}</dd></div>
      <div><dt class="text-[10px] uppercase tracking-wider text-gray-500">Línea</dt><dd class="font-semibold text-gray-900" data-testid="ctx-linea">{{ options.linea?.name || '—' }}</dd></div>
    </dl>

    <div v-if="formError" role="alert" class="rounded-lg border px-4 py-3 text-sm text-red-700 bg-red-50 border-red-200 mb-4" data-testid="create-error">{{ formError }}</div>

    <div class="grid sm:grid-cols-2 gap-4">
      <div v-for="f in textFields" :key="f.key">
        <label :for="`lu-${f.key}`" class="block text-xs font-semibold text-gray-700 mb-1">{{ f.label }}</label>
        <input :id="`lu-${f.key}`" v-model="form[f.key]" :type="f.type" :maxlength="f.max" :autocomplete="f.auto" :aria-invalid="errors[f.key] ? 'true' : 'false'" :aria-describedby="errors[f.key] ? `lu-${f.key}-err` : undefined" class="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#0C2619]" />
        <p v-if="errors[f.key]" :id="`lu-${f.key}-err`" class="mt-1 text-xs text-red-700">{{ errors[f.key] }}</p>
      </div>
      <div>
        <label for="lu-document_type" class="block text-xs font-semibold text-gray-700 mb-1">Tipo de documento</label>
        <select id="lu-document_type" v-model="form.document_type" :aria-invalid="errors.document_type ? 'true' : 'false'" :aria-describedby="errors.document_type ? 'lu-document_type-err' : undefined" class="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#0C2619]">
          <option value="">Selecciona</option>
          <option v-for="t in LINE_USER_DOCUMENT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
        <p v-if="errors.document_type" id="lu-document_type-err" class="mt-1 text-xs text-red-700">{{ errors.document_type }}</p>
      </div>
      <div>
        <label for="lu-role" class="block text-xs font-semibold text-gray-700 mb-1">Rol</label>
        <select id="lu-role" v-model="form.role_id" :aria-invalid="errors.role_id ? 'true' : 'false'" class="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#0C2619]">
          <option value="">Selecciona un rol</option>
          <option v-for="r in options?.roles ?? []" :key="r.id" :value="String(r.id)">{{ r.name }}</option>
        </select>
        <p v-if="errors.role_id" class="mt-1 text-xs text-red-700">{{ errors.role_id }}</p>
        <p v-else-if="options && !options.roles.length" class="mt-1 text-xs text-amber-700">Hub no ofrece roles asignables en este momento.</p>
      </div>
    </div>

    <div class="flex gap-3 mt-5">
      <button type="submit" class="px-5 py-2 rounded-lg bg-[#0C2619] text-white text-sm font-semibold disabled:opacity-50" :disabled="saving || !options || !options.roles.length" data-testid="create-submit">
        {{ saving ? 'Creando…' : 'Crear colaborador' }}
      </button>
      <button type="button" class="px-5 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 bg-white" :disabled="saving" @click="$emit('cancel')">Cancelar</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { navigateTo } from '#imports'
import { lineUsersService, type CreatedLineUser, type LineUserOptions } from '~/services/LineUsersService'

const emit = defineEmits<{ created: [result: CreatedLineUser], cancel: [] }>()

const options = ref<LineUserOptions | null>(null)
const loadError = ref('')
const formError = ref('')
const saving = ref(false)
const errors = reactive<Record<string, string>>({})
const form = reactive({ name: '', lastname: '', email: '', document_type: '', document_number: '', role_id: '' })

const textFields = [
  { key: 'name', label: 'Nombre', type: 'text', max: 255, auto: 'off' },
  { key: 'lastname', label: 'Apellido', type: 'text', max: 255, auto: 'off' },
  { key: 'email', label: 'Correo electrónico', type: 'email', max: 255, auto: 'off' },
  { key: 'document_number', label: 'Número de documento', type: 'text', max: 50, auto: 'off' }
] as const

async function loadOptions() {
  loadError.value = ''
  try {
    options.value = await lineUsersService.options()
    // Con un único rol disponible (primera entrega: Asesora financiera) se preselecciona; el servidor lo valida igualmente.
    if (options.value.roles.length === 1) form.role_id = String(options.value.roles[0]!.id)
  } catch (e: any) {
    loadError.value = e.message
  }
}

function clearErrors() {
  formError.value = ''
  for (const k of Object.keys(errors)) delete errors[k]
}

async function submit() {
  // Guarda contra el doble envío: mientras hay una petición en vuelo, no se emite otra.
  if (saving.value) return
  saving.value = true
  clearErrors()
  try {
    const result = await lineUsersService.create({
      name: form.name,
      lastname: form.lastname,
      email: form.email,
      document_type: form.document_type,
      document_number: form.document_number,
      role_id: Number(form.role_id)
    })
    emit('created', result)
  } catch (e: any) {
    // Sesión vencida: el servidor ya limpió la cookie; se vuelve al login.
    if (e.statusCode === 401) { await navigateTo('/admin/login'); return }
    const fieldErrors: Record<string, string[]> = e.errors ?? {}
    for (const [k, v] of Object.entries(fieldErrors)) if (k !== '_form' && v?.length) errors[k] = v[0]!
    // Sin errores por campo (o con errores generales) se muestra el mensaje general, incluido el de «no se pudo confirmar».
    formError.value = Object.keys(errors).length && !fieldErrors._form?.length ? 'Revisa los campos marcados.' : (fieldErrors._form?.[0] ?? e.message)
  } finally {
    saving.value = false
  }
}

onMounted(loadOptions)
</script>

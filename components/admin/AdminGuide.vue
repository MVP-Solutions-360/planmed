<template>
  <div class="space-y-8">
    <!-- Dónde vive cada cosa -->
    <section class="bg-white border border-gray-200 rounded-xl shadow-sm p-8" aria-labelledby="guide-where">
      <h3 id="guide-where" class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-2 border-b border-gray-100 pb-4">Dónde se guarda cada cosa</h3>
      <p class="text-sm text-gray-600 leading-relaxed mb-6">
        No todo lo que editas en este panel se guarda en el mismo lugar. Esto importa para saber qué se actualiza en <strong>Wellezy Hub</strong> y qué vive <strong>solo en la web</strong>.
      </p>

      <dl class="grid md:grid-cols-3 gap-4 mb-8">
        <div v-for="(meta, key) in GUIDE_STORAGE" :key="key" class="border rounded-lg p-4" :class="meta.badge">
          <dt class="text-xs font-bold uppercase tracking-wider">{{ meta.label }}</dt>
          <dd class="text-xs mt-2 leading-relaxed">{{ meta.description }}</dd>
        </div>
      </dl>

      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <caption class="sr-only">Origen del contenido de cada módulo del panel</caption>
          <thead>
            <tr class="text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
              <th scope="col" class="py-3 pr-4">Módulo</th>
              <th scope="col" class="py-3 pr-4">Se guarda en</th>
              <th scope="col" class="py-3">Dónde se ve</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in GUIDE_MODULES" :key="m.id" class="border-b border-gray-100 align-top">
              <th scope="row" class="py-3 pr-4 font-semibold text-gray-900 whitespace-nowrap">{{ m.title }}</th>
              <td class="py-3 pr-4"><span class="inline-flex px-2 py-1 border rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" :class="GUIDE_STORAGE[m.storage].badge">{{ GUIDE_STORAGE[m.storage].label }}</span></td>
              <td class="py-3 text-gray-600">{{ m.publicEffect }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-8">
        <h4 class="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">
          <span class="inline-flex px-2 py-1 border rounded-md mr-2 normal-case" :class="GUIDE_STORAGE.code.badge">Código</span> Páginas que no se editan en el panel
        </h4>
        <ul class="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600">
          <li v-for="p in GUIDE_FIXED_PAGES" :key="p.route"><strong class="text-gray-900">{{ p.name }}</strong> — {{ p.note }}</li>
        </ul>
      </div>
    </section>

    <!-- Cómo usar cada opción -->
    <section class="bg-white border border-gray-200 rounded-xl shadow-sm p-8" aria-labelledby="guide-how">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-2">
        <h3 id="guide-how" class="text-xs font-bold tracking-widest text-[#0C2619] uppercase">Cómo usar cada opción del panel</h3>
        <div class="flex gap-2">
          <button type="button" class="btn-sm" @click="toggleAll(true)">Abrir todo</button>
          <button type="button" class="btn-sm" @click="toggleAll(false)">Cerrar todo</button>
        </div>
      </div>

      <p class="text-sm text-gray-600 py-3">
        Hub (CRM administrativo): <a :href="hubUrl('/')" target="_blank" rel="noopener noreferrer" class="underline underline-offset-4 text-blue-700">{{ HUB_BASE_URL }}</a>. Cada módulo que tiene pantalla en el Hub muestra su acceso directo.
      </p>

      <div class="divide-y divide-gray-100">
        <details v-for="m in GUIDE_MODULES" :id="`guide-${m.id}`" :key="m.id" class="group py-1" :open="open[m.id]" @toggle="open[m.id] = ($event.target as HTMLDetailsElement).open">
          <summary class="flex items-center justify-between gap-3 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <span class="flex items-center gap-3 min-w-0">
              <span class="font-semibold text-gray-900">{{ m.title }}</span>
              <span class="inline-flex px-2 py-0.5 border rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0" :class="GUIDE_STORAGE[m.storage].badge">{{ GUIDE_STORAGE[m.storage].short }}</span>
            </span>
            <svg class="w-4 h-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </summary>

          <div class="pb-5 pl-1 space-y-4 text-sm text-gray-700 leading-relaxed">
            <p><span class="font-semibold text-gray-900">Dónde se guarda:</span> {{ GUIDE_STORAGE[m.storage].label }}. <span class="font-semibold text-gray-900">Dónde se ve:</span> {{ m.publicEffect }}</p>
            <ol class="list-decimal list-outside pl-5 space-y-1.5">
              <li v-for="s in m.steps" :key="s">{{ s }}</li>
            </ol>
            <ul v-if="m.notes?.length" class="space-y-1.5">
              <li v-for="n in m.notes" :key="n" class="flex gap-2 text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2"><span aria-hidden="true">⚠</span><span>{{ n }}</span></li>
            </ul>
            <div v-if="m.hubLinks?.length" class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-semibold text-gray-900">Acceso directo al Hub:</span>
              <a v-for="l in m.hubLinks" :key="l.path" :href="hubUrl(l.path)" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-3 py-1.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold hover:bg-blue-100">{{ l.label }} <span aria-hidden="true">↗</span><span class="sr-only">(se abre en otra pestaña)</span></a>
            </div>
            <p v-else-if="m.storage === 'hub' && m.id !== 'configuracion'" class="text-xs text-gray-500">En el Hub este contenido no tiene pantalla propia: se edita solo desde este panel (el Hub guarda el dato).</p>
            <NuxtLink v-if="m.route && m.route !== '/admin/configuracion'" :to="m.route" class="inline-block text-xs font-bold tracking-widest uppercase text-[#0C2619] underline underline-offset-4">Ir a {{ m.title }}</NuxtLink>
          </div>
        </details>
      </div>
    </section>

    <!-- Reglas comunes -->
    <section class="bg-white border border-gray-200 rounded-xl shadow-sm p-8" aria-labelledby="guide-rules">
      <h3 id="guide-rules" class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-4 border-b border-gray-100 pb-4">Reglas que valen para todo el panel</h3>
      <ul class="grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm text-gray-700 leading-relaxed">
        <li><strong>Guardar:</strong> nada se aplica hasta pulsar el botón de guardar de esa pantalla.</li>
        <li><strong>Errores:</strong> el mensaje sale junto al botón y tus cambios siguen en pantalla para corregir y reintentar.</li>
        <li><strong>Imágenes:</strong> JPG, PNG o WebP; se optimizan solas antes de subirse.</li>
        <li><strong>Texto con formato:</strong> negrita (N), cursiva (K), títulos H2/H3, listas y enlaces; lo demás se elimina por seguridad.</li>
        <li><strong>YouTube:</strong> pega el enlace tal cual; no se aceptan códigos de inserción.</li>
        <li><strong>Ocultar no borra:</strong> el contenido se conserva y se puede volver a publicar.</li>
        <li><strong>Sesión:</strong> dura 8 horas; luego hay que volver a entrar con tu usuario del Hub.</li>
        <li><strong>Permisos:</strong> en lo que vive en el Hub, el Hub decide qué puedes ver, crear, editar o eliminar; si te niega algo, pide el permiso a quien lo administra.</li>
        <li><strong>Dos personas a la vez:</strong> en lo que vive en la web, si otra persona guardó antes verás «Recarga la página» y no se pisan los cambios.</li>
        <li><strong>Respaldo:</strong> lo que vive en la web debe respaldarse en el servidor (carpeta de contenido); lo del Hub se respalda con el Hub.</li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { GUIDE_MODULES, GUIDE_STORAGE, GUIDE_FIXED_PAGES, HUB_BASE_URL, hubUrl } from '~/utils/adminGuide'

const open = reactive<Record<string, boolean>>({})
function toggleAll(value: boolean) {
  for (const m of GUIDE_MODULES) open[m.id] = value
}
</script>

<style scoped>
.btn-sm { padding: .375rem .75rem; border: 1px solid #e5e7eb; border-radius: .5rem; font-size: .75rem; font-weight: 600; color: #374151; background: #fff; }
.btn-sm:hover { background: #f9fafb; }
</style>

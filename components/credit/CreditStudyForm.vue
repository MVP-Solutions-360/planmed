<template>
  <section aria-labelledby="credit-form-title" class="mt-12 md:mt-16">
    <!-- AVISO TEMPORAL: retirar cuando el formulario sea funcional (validación, envío al CRM/Hub, archivos y consentimiento de datos). -->
    <div role="alert" data-testid="credit-form-not-functional" class="mb-6 border border-amber-300 border-l-4 border-l-amber-500 bg-amber-50 text-amber-900 px-5 py-4 text-sm leading-relaxed">
      <p class="font-bold uppercase tracking-wider text-xs">Formulario en maquetación — aún no es funcional</p>
      <p class="mt-1">Este formulario es solo el diseño: no valida, no guarda ni envía información, y los archivos que se seleccionen no se suben. Los datos que escribas no se registran en ninguna parte. Pendiente: confirmar las opciones de las listas (son provisionales), las reglas de los campos condicionales, las validaciones y conectar el envío.</p>
    </div>

    <div class="bg-white border border-[#e5e2e1] shadow-sm">
      <h2 id="credit-form-title" class="font-serif text-2xl md:text-3xl font-medium text-[#0C2619] text-center py-6 md:py-8 px-4">Formulario de crédito paciente</h2>

      <!-- Indicador de paso (móvil) -->
      <p class="sm:hidden px-5 pb-3 text-center text-[11px] font-bold uppercase tracking-widest text-[#9a7a45]" aria-live="polite">Paso {{ current + 1 }} de {{ steps.length }}</p>

      <!-- Pasos -->
      <div role="tablist" aria-label="Pasos del formulario" class="flex overflow-x-auto bg-[#0C2619] text-white [scrollbar-width:thin]" @keydown="onTabKey">
        <button
          v-for="(s, i) in steps"
          :id="`credit-tab-${s.key}`"
          :key="s.key"
          ref="tabs"
          type="button"
          role="tab"
          :aria-selected="current === i ? 'true' : 'false'"
          :aria-controls="`credit-panel-${s.key}`"
          :tabindex="current === i ? 0 : -1"
          class="flex-1 min-w-[140px] px-3 py-3 text-[11px] font-bold tracking-[0.08em] uppercase text-center leading-tight transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#D3A76A]"
          :class="current === i ? 'bg-[#D3A76A] text-[#0C2619]' : 'text-white/80 hover:bg-white/10'"
          @click="go(i)"
        >{{ s.label }}</button>
      </div>

      <form novalidate class="p-4 sm:p-6 lg:p-8" @submit.prevent="next">
        <div
          v-for="(s, i) in steps"
          v-show="current === i"
          :id="`credit-panel-${s.key}`"
          :key="s.key"
          role="tabpanel"
          :aria-labelledby="`credit-tab-${s.key}`"
          tabindex="0"
          class="focus:outline-none"
        >
          <div :class="s.split ? 'grid gap-x-12 gap-y-10 lg:grid-cols-2' : 'space-y-10'">
            <div v-for="(b, bi) in s.blocks" :key="bi" :class="b.full ? 'lg:col-span-2' : ''">
              <h3 v-if="b.title" class="font-serif text-lg md:text-xl uppercase tracking-wide text-[#0C2619] mb-1">{{ b.title }}</h3>
              <p v-if="b.note" class="text-xs text-gray-500 mb-4">{{ b.note }}</p>
              <div v-else-if="b.title" class="mb-4"></div>

              <div :class="gridClass(b)">
                <template v-for="fd in b.fields" :key="fd.id">
                  <div v-if="visible(fd)" :class="[fieldClass(b, fd), fd.type === 'checkbox' ? 'self-end' : '']">
                    <!-- Casilla -->
                    <label v-if="fd.type === 'checkbox'" class="flex items-center gap-3 text-sm text-[#4c4546] cursor-pointer min-h-[2.75rem]">
                      <input v-model="values[fd.id]" type="checkbox" class="w-4 h-4 accent-[#0C2619]" />
                      <span>{{ fd.label }}</span>
                    </label>

                    <template v-else>
                      <label :for="`cf-${fd.id}`" class="block text-[11px] font-bold uppercase tracking-wider text-[#4c4546] mb-2 leading-snug">
                        {{ fd.label }}<span v-if="fd.hint" class="ml-1 normal-case font-normal tracking-normal text-gray-500">({{ fd.hint }})</span><span v-if="fd.required" aria-hidden="true"> *</span><span v-if="fd.required" class="sr-only"> (obligatorio)</span>
                      </label>

                      <select v-if="fd.type === 'select'" :id="`cf-${fd.id}`" v-model="values[fd.id]" class="field" :required="fd.required" :disabled="disabled(fd)">
                        <option value="">{{ disabled(fd) ? 'n/a' : 'Seleccione' }}</option>
                        <option v-for="o in fd.options" :key="o" :value="o">{{ o }}</option>
                      </select>
                      <input v-else-if="fd.type === 'file'" :id="`cf-${fd.id}`" type="file" class="field file-field" :required="fd.required" accept=".pdf,image/png,image/jpeg" />
                      <input v-else-if="fd.sum" :id="`cf-${fd.id}`" class="field bg-[#fcf9f8] font-semibold" type="text" readonly :value="total(fd.sum)" />
                      <input v-else :id="`cf-${fd.id}`" v-model="values[fd.id]" class="field" :type="fd.type ?? 'text'" :inputmode="fd.inputmode" :required="fd.required" :disabled="disabled(fd)" :placeholder="disabled(fd) ? 'n/a' : undefined" autocomplete="off" />
                    </template>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <p v-if="s.key === 'conyuge'" class="mt-6 text-xs text-gray-500">Los datos del cónyuge se habilitan cuando el estado civil (paso 1) es casado(a) o unión libre. Regla provisional, por confirmar.</p>

          <div class="mt-8 flex items-center justify-between gap-3">
            <button type="button" class="px-6 py-3 border border-[#0C2619] text-[#0C2619] text-xs font-bold tracking-widest uppercase hover:bg-[#0C2619]/5 disabled:opacity-40" :disabled="i === 0" @click="go(i - 1)">Atrás</button>
            <button v-if="i < steps.length - 1" type="submit" class="px-8 py-3 bg-[#0C2619] text-white text-xs font-bold tracking-widest uppercase hover:bg-[#153a28]">Siguiente</button>
            <button v-else type="button" class="px-8 py-3 bg-[#0C2619] text-white text-xs font-bold tracking-widest uppercase hover:bg-[#153a28]" @click="saveClicked = true">Guardar</button>
          </div>
          <p v-if="i === steps.length - 1 && saveClicked" role="status" class="mt-4 text-sm font-semibold text-amber-800">Aún no es funcional: no se guardó ni se envió nada.</p>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
// Maquetación del «Formulario de crédito paciente» (Estudio de créditos). SIN funcionalidad: el estado local solo sirve para mostrar/ocultar
// campos condicionales y sumar totales; no hay validación ni envío. Las opciones de las listas son PROVISIONALES (las referencias solo muestran
// «Seleccione» o el valor de ejemplo) y deben confirmarse con Planmed.
import { reactive, ref } from 'vue'

type Cond = { field: string, in: string[] }
interface Field {
  id: string, label: string, hint?: string, type?: string, required?: boolean, options?: string[]
  inputmode?: 'text' | 'numeric' | 'decimal' | 'tel', span?: number, start4?: boolean
  showIf?: Cond, enabledIf?: Cond, sum?: string[]
}
interface Block { title?: string, note?: string, grid: 'lg' | 'sm', fields: Field[], full?: boolean }
interface Step { key: string, label: string, split?: boolean, blocks: Block[] }

const f = (id: string, label: string, extra: Partial<Field> = {}): Field => ({ id, label, ...extra })
const r = (id: string, label: string, extra: Partial<Field> = {}): Field => ({ id, label, required: true, ...extra })

const TIPOS_DOC = ['Cédula de ciudadanía', 'Cédula de extranjería', 'Pasaporte', 'Permiso por protección temporal']
const TIPOS_ACTIVIDAD = ['Empleado', 'Independiente', 'Otro']
const SI_NO = ['Sí', 'No']
const CONYUGE_ON: Cond = { field: 'estado-civil', in: ['Casado(a)', 'Unión libre'] }

// Archivos que se piden según el tipo de actividad económica (paso 3), alineados a la 4.ª columna como en la referencia.
const archivo = (cond: string[], id: string, label: string): Field => ({ id, label, type: 'file', required: true, start4: true, span: 3, showIf: { field: 'tipo-actividad', in: cond } })

const referencia = (p: string, n: number): Field[] => [
  f(`${p}-${n}-nombre`, 'Nombres y apellidos', { span: 12 }),
  f(`${p}-${n}-parentesco`, 'Parentesco', { span: 6 }),
  f(`${p}-${n}-tel-residencia`, 'Teléfono de residencia', { type: 'tel', inputmode: 'tel', span: 6 }),
  f(`${p}-${n}-tel-oficina`, 'Teléfono de oficina', { type: 'tel', inputmode: 'tel', span: 6 }),
  f(`${p}-${n}-celular`, 'Celular', { type: 'tel', inputmode: 'tel', span: 6 })
]

const beneficiarios: Field[] = [1, 2, 3, 4].flatMap(n => [
  f(`ben-${n}-tipo`, `${n} - Tipo de documento`, { type: 'select', options: TIPOS_DOC, span: 3 }),
  f(`ben-${n}-doc`, 'Documento', { span: 3 }),
  f(`ben-${n}-nombre`, 'Nombre y apellido', { span: 3 }),
  f(`ben-${n}-pct`, '%', { type: 'number', inputmode: 'decimal', span: 1 }),
  f(`ben-${n}-parentesco`, 'Parentesco', { span: 2 })
])

const PROCEDIMIENTOS = ['Mamoplastia de aumento', 'Mastopexia', 'Mentoplastia', 'Ritidoplastia', 'Mamoplastia de reducción', 'Lipomoldeamiento', 'Blefaroplastia', 'Rinoplastia', 'Implantes glúteos', 'Abdominoplastia', 'Otoplastia', 'Otro']

const ING = ['ing-salario', 'ing-comisiones', 'ing-arrendamientos', 'ing-otros']
const EGR = ['egr-vivienda', 'egr-vehiculo', 'egr-tarjeta', 'egr-arriendo', 'egr-gastos']
const money = (id: string, label: string): Field => ({ id, label, type: 'number', inputmode: 'numeric', span: 6 })

const steps: Step[] = [
  {
    key: 'personal',
    label: 'Información personal',
    blocks: [{
      grid: 'lg',
      fields: [
        r('primer-nombre', 'Primer nombre'),
        f('segundo-nombre', 'Segundo nombre'),
        r('primer-apellido', 'Primer apellido'),
        f('segundo-apellido', 'Segundo apellido'),
        r('tipo-documento', 'Tipo de documento', { type: 'select', options: TIPOS_DOC }),
        r('numero-documento', 'N° documento de identidad', { inputmode: 'numeric' }),
        r('lugar-expedicion', 'Lugar de expedición'),
        r('fecha-expedicion', 'Fecha de expedición', { type: 'date' }),
        r('fecha-nacimiento', 'Fecha de nacimiento', { type: 'date' }),
        r('lugar-nacimiento', 'Lugar de nacimiento'),
        r('sexo', 'Sexo', { type: 'select', options: ['Femenino', 'Masculino'] }),
        r('estado-civil', 'Estado civil', { type: 'select', options: ['Soltero(a)', 'Casado(a)', 'Unión libre', 'Separado(a)', 'Divorciado(a)', 'Viudo(a)'] }),
        r('nivel-educativo', 'Nivel educativo', { type: 'select', options: ['Primaria', 'Bachillerato', 'Técnico', 'Tecnólogo', 'Profesional', 'Posgrado'] }),
        r('profesion', 'Profesión / ocupación'),
        r('personas-a-cargo', 'N° de personas a cargo', { type: 'number', inputmode: 'numeric' }),
        r('numero-hijos', 'N° de hijos', { type: 'number', inputmode: 'numeric' }),
        r('tipo-vivienda', 'Tipo de vivienda', { type: 'select', options: ['Propia', 'Arrendada', 'Familiar'] }),
        r('nombre-arrendador', 'Nombre del arrendador'),
        r('telefono-arrendador', 'Teléfono del arrendador', { type: 'tel', inputmode: 'tel' }),
        r('peso', 'Peso (kg)', { type: 'number', inputmode: 'decimal', span: 2 }),
        r('estatura', 'Estatura (cm)', { type: 'number', inputmode: 'decimal', span: 1 })
      ]
    }]
  },
  {
    key: 'conyuge',
    label: 'Información del cónyuge',
    blocks: [{
      grid: 'lg',
      fields: [
        r('cy-primer-nombre', 'Primer nombre', { enabledIf: CONYUGE_ON }),
        r('cy-segundo-nombre', 'Segundo nombre', { enabledIf: CONYUGE_ON }),
        r('cy-primer-apellido', 'Primer apellido', { enabledIf: CONYUGE_ON }),
        r('cy-segundo-apellido', 'Segundo apellido', { enabledIf: CONYUGE_ON }),
        r('cy-tipo-documento', 'Tipo de documento', { type: 'select', options: TIPOS_DOC, enabledIf: CONYUGE_ON }),
        r('cy-numero-documento', 'N° documento de identidad', { inputmode: 'numeric', enabledIf: CONYUGE_ON }),
        r('cy-tipo-actividad', 'Tipo de actividad', { type: 'select', options: TIPOS_ACTIVIDAD, enabledIf: CONYUGE_ON }),
        r('cy-celular', 'Celular', { type: 'tel', inputmode: 'tel', enabledIf: CONYUGE_ON }),
        r('cy-empresa', 'Empresa donde labora', { enabledIf: CONYUGE_ON }),
        r('cy-cargo', 'Cargo', { enabledIf: CONYUGE_ON }),
        r('cy-ingresos', 'Ingresos mensuales', { type: 'number', inputmode: 'numeric', enabledIf: CONYUGE_ON })
      ]
    }]
  },
  {
    key: 'actividad',
    label: 'Actividad económica y localización cliente',
    blocks: [{
      grid: 'lg',
      fields: [
        r('dir-residencia', 'Dirección de residencia', { hint: 'especifique N° casa o apartamento', span: 6 }),
        r('barrio-residencia', 'Barrio / ciudad', { span: 6 }),
        r('tel-residencia', 'Teléfono residencia', { type: 'tel', inputmode: 'tel' }),
        r('celular', 'Celular', { type: 'tel', inputmode: 'tel' }),
        r('email', 'E-mail', { type: 'email' }),
        r('envio-correspondencia', 'Envío de correspondencia', { type: 'select', options: ['Residencia', 'Trabajo', 'Correo electrónico'] }),
        r('dir-correspondencia', 'Dirección', { hint: 'correspondencia' }),
        r('barrio-correspondencia', 'Barrio / ciudad', { hint: 'correspondencia' }),
        f('tel-correspondencia', 'Teléfono', { hint: 'correspondencia', type: 'tel', inputmode: 'tel' }),
        r('tipo-actividad', 'Tipo de actividad económica', { type: 'select', options: TIPOS_ACTIVIDAD }),
        archivo(['Empleado'], 'archivo-carta-laboral', 'Carta laboral'),
        archivo(['Empleado'], 'archivo-colillas', 'Colillas de pago'),
        archivo(['Independiente'], 'archivo-rut', 'RUT'),
        archivo(['', 'Empleado', 'Independiente', 'Otro'], 'archivo-extractos', 'Extractos bancarios'),
        f('otra-actividad', '¿Cuál?', { hint: 'otra actividad económica' }),
        f('empresa', 'Nombre de la empresa'),
        f('dir-trabajo', 'Dirección trabajo'),
        r('barrio-trabajo', 'Barrio / ciudad'),
        f('tel-trabajo', 'Teléfono', { hint: 'trabajo', type: 'tel', inputmode: 'tel', span: 2 }),
        f('ext-trabajo', 'Ext', { span: 2 }),
        f('fax-trabajo', 'Fax', { span: 2 }),
        f('dependencia', 'Dependencia / área'),
        f('cargo', 'Cargo'),
        r('tipo-contrato', 'Tipo de contrato', { type: 'select', options: ['Indefinido', 'Fijo', 'Prestación de servicios', 'Otro'] }),
        f('fecha-vinculacion', 'Fecha de vinculación', { type: 'date' })
      ]
    }]
  },
  {
    key: 'referencias',
    label: 'Referencias',
    split: true,
    blocks: [
      { title: 'Familiar (que no viva con usted)', grid: 'sm', fields: [...referencia('fam', 1), ...referencia('fam', 2)] },
      { title: 'Personal (que no viva con usted)', grid: 'sm', fields: [...referencia('per', 1), ...referencia('per', 2)] },
      { grid: 'lg', full: true, fields: [f('reportado', '¿Está reportado?', { type: 'select', options: SI_NO })] },
      { title: 'Beneficiarios voluntarios (póliza Sura)', grid: 'lg', full: true, fields: beneficiarios }
    ]
  },
  {
    key: 'ingresos',
    label: 'Relación de ingresos y egresos',
    split: true,
    blocks: [
      {
        title: 'Ingresos mensuales',
        grid: 'sm',
        fields: [
          money('ing-salario', '1. Salario básico y/o honorarios'), money('ing-comisiones', '2. Comisiones'),
          money('ing-arrendamientos', '3. Arrendamientos'), money('ing-otros', '4. Otros'),
          f('ing-cuales', '¿Cuáles?', { span: 12 }),
          { id: 'ing-total', label: 'Total ingresos', span: 12, sum: ING }
        ]
      },
      {
        title: 'Egresos mensuales',
        grid: 'sm',
        fields: [
          money('egr-vivienda', '1. Préstamo vivienda'), money('egr-vehiculo', '2. Préstamo vehículo u otros'),
          money('egr-tarjeta', '3. Tarjeta de crédito'), money('egr-arriendo', '4. Arriendo'),
          money('egr-gastos', '5. Gastos familiares y/o otros'),
          { id: 'egr-total', label: 'Total', span: 12, sum: EGR }
        ]
      },
      {
        title: 'Información del crédito solicitado',
        note: 'Procedimiento que se realiza (puede seleccionar más de uno)',
        grid: 'lg',
        full: true,
        fields: [
          ...PROCEDIMIENTOS.map((p): Field => ({ id: `proc-${p}`, label: p, type: 'checkbox' })),
          f('valor-cotizado', 'Valor cotizado', { type: 'number', inputmode: 'numeric' }),
          f('numero-cuotas', 'N° de cuotas', { type: 'number', inputmode: 'numeric' }),
          f('valor-financiar', 'Valor a financiar', { type: 'number', inputmode: 'numeric' }),
          f('fecha-cirugia', 'Fecha cirugía', { type: 'date' })
        ]
      }
    ]
  },
  {
    key: 'activos',
    label: 'Relación de activos',
    split: true,
    blocks: [
      {
        title: 'Bienes raíces',
        grid: 'sm',
        fields: [
          r('br-tipo', 'Tipo de inmueble', { type: 'select', options: ['Apartamento', 'Casa', 'Lote', 'Local', 'Otro'], span: 6 }),
          f('br-direccion', 'Dirección del bien', { span: 6 }),
          f('br-barrio', 'Barrio', { span: 6 }),
          f('br-ciudad', 'Ciudad', { span: 6 }),
          f('br-valor', 'Valor comercial', { type: 'number', inputmode: 'numeric', span: 6 }),
          f('br-hipoteca', 'Hipoteca a favor de', { span: 6 }),
          r('br-afectacion', 'Afectación familiar', { type: 'select', options: SI_NO, span: 6 })
        ]
      },
      {
        title: 'Vehículo',
        grid: 'sm',
        fields: [
          r('ve-tipo', 'Tipo', { type: 'select', options: ['Automóvil', 'Camioneta', 'Motocicleta', 'Otro'], span: 6 }),
          f('ve-placa', 'Placa', { span: 6 }),
          f('ve-transito', 'Tránsito de', { span: 6 }),
          f('ve-marca', 'Marca', { span: 6 }),
          f('ve-modelo', 'Modelo', { span: 4 }),
          f('ve-valor', 'Valor comercial', { type: 'number', inputmode: 'numeric', span: 4 }),
          f('ve-prenda', 'Prenda a valor de', { type: 'number', inputmode: 'numeric', span: 4 }),
          f('ve-otro', 'Otro: ¿cuáles?', { span: 12 })
        ]
      }
    ]
  }
]

const values = reactive<Record<string, any>>({ 'tipo-actividad': '' })
const current = ref(0)
const saveClicked = ref(false)
const tabs = ref<HTMLButtonElement[]>([])

// Clases estáticas (Tailwind no detecta nombres armados dinámicamente).
const LG: Record<number, string> = { 1: 'lg:col-span-1', 2: 'lg:col-span-2', 3: 'lg:col-span-3', 4: 'lg:col-span-4', 5: 'lg:col-span-5', 6: 'lg:col-span-6', 7: 'lg:col-span-7', 8: 'lg:col-span-8', 12: 'lg:col-span-12' }
const SM: Record<number, string> = { 1: 'sm:col-span-1', 2: 'sm:col-span-2', 3: 'sm:col-span-3', 4: 'sm:col-span-4', 5: 'sm:col-span-5', 6: 'sm:col-span-6', 7: 'sm:col-span-7', 8: 'sm:col-span-8', 12: 'sm:col-span-12' }

// 'lg': 1 columna en móvil, 2 en tablet y rejilla de 12 en escritorio (bloques de ancho completo).
// 'sm': 1 columna en móvil y rejilla de 12 desde tablet (bloques angostos, p. ej. mitad de la pantalla).
const gridClass = (b: Block) => (b.grid === 'lg'
  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-4 gap-y-5'
  : 'grid grid-cols-1 sm:grid-cols-12 gap-x-4 gap-y-5')

function fieldClass(b: Block, fd: Field) {
  const span = fd.span ?? 3
  if (b.grid === 'sm') return SM[span]
  return [span >= 6 ? 'sm:col-span-2' : '', LG[span], fd.start4 ? 'lg:col-start-10' : ''].join(' ')
}

const meets = (c?: Cond) => !c || c.in.includes(String(values[c.field] ?? ''))
const visible = (fd: Field) => meets(fd.showIf)
const disabled = (fd: Field) => !!fd.enabledIf && !meets(fd.enabledIf)
const total = (ids: string[]) => ids.reduce((sum, id) => sum + (Number(values[id]) || 0), 0).toLocaleString('es-CO')

function go(i: number) {
  current.value = Math.min(Math.max(i, 0), steps.length - 1)
  tabs.value[current.value]?.scrollIntoView?.({ block: 'nearest', inline: 'center' })
}
function next() { go(current.value + 1) }

// Teclado del patrón WAI-ARIA tabs: flechas, Inicio y Fin.
function onTabKey(e: KeyboardEvent) {
  const last = steps.length - 1
  const target = ({ ArrowRight: Math.min(current.value + 1, last), ArrowLeft: Math.max(current.value - 1, 0), Home: 0, End: last } as Record<string, number>)[e.key]
  if (target === undefined) return
  e.preventDefault()
  go(target)
  tabs.value[target]?.focus()
}
</script>

<style scoped>
.field { width: 100%; min-height: 2.75rem; padding: 0 .75rem; background: #fff; border: 1px solid #cfc4c5; border-radius: 2px; font-size: .875rem; color: #1c1b1b; }
.field:focus { outline: 2px solid #0C2619; outline-offset: 0; border-color: #0C2619; }
.field:disabled { background: #f0eeed; color: #8a8284; cursor: not-allowed; }
.file-field { padding: .5rem .75rem; }
</style>

<template>
  <div class="space-y-5" data-testid="blocks-editor">
    <fieldset :key="radioKey" class="border-0 p-0 m-0" data-testid="blocks-layout-choice">
      <legend class="label">Distribución</legend>
      <div class="flex flex-wrap gap-3">
        <label class="radio"><input type="radio" :name="`bl-layout-${uid}`" value="one_column" :checked="layout === 'one_column'" @change="setLayout('one_column')"> Una columna</label>
        <label class="radio"><input type="radio" :name="`bl-layout-${uid}`" value="two_columns" :checked="layout === 'two_columns'" @change="setLayout('two_columns')"> Dos columnas</label>
      </div>
    </fieldset>

    <!-- Columnas de la distribución activa: cada una apila sus bloques -->
    <div class="grid grid-cols-1 gap-5" :class="layout === 'two_columns' ? 'lg:grid-cols-2' : ''" data-testid="blocks-columns">
      <section v-for="slot in slots" :key="slot" class="min-w-0 border border-gray-200 rounded-lg bg-white p-4" :data-slot="slot">
        <h4 class="label">{{ SLOT_LABEL[slot] }}</h4>

        <p v-if="!slotBlocks(slot).length" class="text-xs text-gray-400 italic mb-3">Sin contenido. Agrega un bloque.</p>

        <div v-for="(b, i) in slotBlocks(slot)" :key="b.key" class="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50/60" data-testid="content-block" :data-type="b.type">
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-[11px] font-bold uppercase tracking-widest text-[#0C2619]">{{ TYPE_LABEL[b.type] }}</span>
            <div class="flex items-center gap-1">
              <button type="button" class="icon-btn" :disabled="i === 0" aria-label="Subir bloque" @click="moveBlock(b, -1)">↑</button>
              <button type="button" class="icon-btn" :disabled="i === slotBlocks(slot).length - 1" aria-label="Bajar bloque" @click="moveBlock(b, 1)">↓</button>
              <button v-if="layout === 'two_columns'" type="button" class="icon-btn" :aria-label="slot === 'left' ? 'Mover a la columna derecha' : 'Mover a la columna izquierda'" :title="slot === 'left' ? 'Mover a la derecha' : 'Mover a la izquierda'" @click="moveToOtherSlot(b)">{{ slot === 'left' ? '→' : '←' }}</button>
              <button type="button" class="icon-btn text-red-700" aria-label="Quitar bloque" @click="removeBlock(b)">✕</button>
            </div>
          </div>

          <AdminRichTextEditor v-if="b.type === 'text'" :key="`t-${b.key}`" v-model="b.content" min-height="8rem" placeholder="Escribe aquí el texto..." />

          <div v-else-if="b.type === 'image'" class="space-y-2">
            <label class="block w-full max-w-xs aspect-[4/3] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-[#0C2619] bg-white relative">
              <img v-if="b.newImage || b.imageUrl" :src="b.newImage || b.imageUrl" alt="Imagen del bloque" class="w-full h-full object-contain">
              <span v-else class="absolute inset-0 flex items-center justify-center text-xs text-gray-400 text-center px-3">Haz clic para subir (JPG, PNG o WebP)</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onBlockImage(b, $event)">
            </label>
            <input v-model="b.alt" type="text" class="field" maxlength="255" placeholder="Texto alternativo (describe la imagen)" aria-label="Texto alternativo">
          </div>

          <div v-else>
            <input v-model="b.url" type="url" class="field" maxlength="2048" :placeholder="b.type === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://www.instagram.com/p/...'" :aria-label="TYPE_LABEL[b.type]">
            <p v-if="b.url.trim() !== ''" class="mt-1 text-xs" :class="urlOk(b) ? 'text-green-700' : 'text-red-700'">{{ urlOk(b) ? 'Enlace válido.' : (b.type === 'youtube' ? 'No es un enlace válido de YouTube.' : 'No es un enlace válido de una publicación de Instagram.') }}</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2" data-testid="blocks-add">
          <button v-for="t in BLOCK_TYPES" :key="t" type="button" class="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest border border-gray-200 rounded hover:border-[#0C2619] cursor-pointer" :data-add="t" @click="addBlock(slot, t)">+ {{ TYPE_LABEL[t] }}</button>
        </div>
      </section>
    </div>

    <p v-if="hiddenCount" class="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2" data-testid="blocks-kept-columns">
      Hay {{ hiddenCount }} {{ hiddenCount === 1 ? 'bloque guardado' : 'bloques guardados' }} en {{ layout === 'two_columns' ? 'la columna única' : 'las dos columnas' }} que no se publican con esta distribución. Se conservan y se recuperan al volver a ella.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { activeSlots, blockHasData, BLOCK_TYPES, newDraftBlock, urlOk, type BlockSlot, type BlockType, type ColumnLayout, type DraftBlock } from '#shared/utils/contentBlocks'
import { fileToOptimizedDataUrl } from '~/utils/imageFile'

// Editor de las columnas de una sección: cada columna apila bloques de texto, imagen, video de YouTube y post de Instagram. Edita en el sitio la lista de
// borradores (`blocks`) y emite la distribución (`update:layout`). Los TRES conjuntos (una columna, izquierda y derecha) se conservan siempre: cambiar de
// distribución nunca descarta contenido. Compartido por las secciones de noticias y de procedimientos.
const props = defineProps<{ layout: ColumnLayout, blocks: DraftBlock[] }>()
const emit = defineEmits<{ 'update:layout': [value: ColumnLayout] }>()

const TYPE_LABEL: Record<BlockType, string> = { text: 'Texto', image: 'Imagen', youtube: 'Video de YouTube', instagram: 'Post de Instagram' }
const SLOT_LABEL: Record<BlockSlot, string> = { main: 'Contenido', left: 'Columna izquierda', right: 'Columna derecha' }

const notify = useNotify()
const radioKey = ref(0)
const uid = Math.random().toString(36).slice(2, 8)

const slots = computed(() => activeSlots(props.layout))
const slotBlocks = (slot: BlockSlot) => props.blocks.filter(b => b.slot === slot)
/** Bloques con datos guardados en columnas que la distribución actual no publica. */
const hiddenCount = computed(() => props.blocks.filter(b => !slots.value.includes(b.slot) && blockHasData(b)).length)

/** Cambia la distribución SIN descartar nada; al pasar a una columna con bloques en las columnas pide confirmación (se conservan, pero no se publican). */
function setLayout(next: ColumnLayout) {
  if (next === props.layout) return
  if (next === 'one_column' && props.blocks.some(b => b.slot !== 'main' && blockHasData(b))
    && !window.confirm('Los bloques de las dos columnas no se mostrarán mientras la sección sea de una columna, pero se conservan y se recuperan al volver a «Dos columnas». ¿Cambiar a una columna?')) {
    radioKey.value++ // restablece el radio al valor vigente (la distribución no cambia)
    return
  }
  emit('update:layout', next)
}

function addBlock(slot: BlockSlot, type: BlockType) { props.blocks.push(newDraftBlock(slot, type)) }
function removeBlock(b: DraftBlock) { props.blocks.splice(props.blocks.indexOf(b), 1) }

function moveBlock(b: DraftBlock, delta: -1 | 1) {
  const same = slotBlocks(b.slot)
  const neighbor = same[same.indexOf(b) + delta]
  if (!neighbor) return
  const a = props.blocks.indexOf(b)
  const c = props.blocks.indexOf(neighbor)
  ;[props.blocks[a], props.blocks[c]] = [props.blocks[c]!, props.blocks[a]!]
}

function moveToOtherSlot(b: DraftBlock) {
  props.blocks.splice(props.blocks.indexOf(b), 1)
  props.blocks.push({ ...b, slot: b.slot === 'left' ? 'right' : 'left' })
}

async function onBlockImage(b: DraftBlock, e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > 10 * 1024 * 1024) return void notify.error('La imagen no puede superar los 10 MB.')
  try {
    b.newImage = await fileToOptimizedDataUrl(file)
    b.fromSectionImage = false // una imagen nueva sustituye a la copia del formato anterior
  } catch (err: any) {
    void notify.error(err.message)
  }
}
</script>

<style scoped>
.label { display: block; font-size: .7rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: #374151; margin-bottom: .4rem; }
.field { width: 100%; padding: .65rem .9rem; border: 1px solid #e5e7eb; border-radius: .5rem; background: #fff; font-size: .875rem; }
.field:focus { outline: none; box-shadow: 0 0 0 2px #0C2619; border-color: transparent; }
.icon-btn { width: 2rem; height: 2rem; border: 1px solid #e5e7eb; border-radius: .375rem; font-weight: 700; background: #fff; cursor: pointer; }
.icon-btn:hover:not(:disabled) { border-color: #0C2619; }
.icon-btn:disabled { opacity: .35; cursor: default; }
.radio { display: inline-flex; align-items: center; gap: .5rem; padding: .6rem .9rem; border: 1px solid #e5e7eb; border-radius: .5rem; background: #fff; font-size: .875rem; font-weight: 600; cursor: pointer; }
</style>

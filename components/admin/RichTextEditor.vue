<template>
  <div class="relative border border-gray-200 rounded-lg bg-gray-50 focus-within:ring-2 focus-within:ring-[#0C2619] focus-within:border-transparent">
    <div v-if="editor && !readonly" class="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-white rounded-t-lg">
      <button v-for="b in buttons" :key="b.label" type="button" :title="b.title" :aria-label="b.title"
        @click="b.run()"
        class="px-2.5 py-1 text-xs font-bold rounded border transition-colors"
        :class="b.active() ? 'bg-[#0C2619] text-white border-[#0C2619]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#0C2619]'">
        {{ b.label }}
      </button>
    </div>
    <EditorContent :editor="editor" class="rich-content px-4 py-3 text-sm" :class="height ? 'overflow-y-auto' : ''" :style="height ? { height } : undefined" />
    <p v-if="placeholder && editor && editor.isEmpty && !readonly" class="pointer-events-none absolute left-4 text-sm text-gray-400" :class="editor && !readonly ? 'top-[3.65rem]' : 'top-3'" data-testid="editor-placeholder">{{ placeholder }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { sanitizeRichHtml } from '~/utils/richText'

const props = withDefaults(defineProps<{ modelValue?: string, minHeight?: string, height?: string, readonly?: boolean, placeholder?: string }>(), { modelValue: '', minHeight: '9rem', height: '', readonly: false, placeholder: '' })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function currentHtml(): string {
  const ed = editor.value
  return !ed || ed.isEmpty ? '' : sanitizeRichHtml(ed.getHTML())
}

// Solo el subconjunto permitido por sanitizeRichHtml: párrafos, saltos, negrita, cursiva, H2/H3, listas y enlaces.
const editor = useEditor({
  content: sanitizeRichHtml(props.modelValue),
  editable: !props.readonly,
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      trailingNode: false, strike: false, code: false, codeBlock: false, blockquote: false, horizontalRule: false, underline: false,
      link: { openOnClick: false, autolink: true, protocols: ['http', 'https', 'mailto', 'tel'], HTMLAttributes: { rel: 'noopener noreferrer nofollow' } }
    })
  ],
  editorProps: { attributes: { class: 'outline-none', style: `min-height:${props.minHeight}` } },
  onUpdate: () => emit('update:modelValue', currentHtml())
})

// Cambios externos (p. ej. carga asíncrona del registro al editar).
watch(() => props.modelValue, (value) => {
  const ed = editor.value
  if (!ed) return
  const incoming = sanitizeRichHtml(value)
  if (incoming !== currentHtml()) ed.commands.setContent(incoming, { emitUpdate: false })
})

watch(() => props.readonly, value => editor.value?.setEditable(!value))

function setLink() {
  const ed = editor.value
  if (!ed) return
  const previous = ed.getAttributes('link').href as string | undefined
  const url = window.prompt('URL del enlace (deja vacío para quitarlo):', previous || 'https://')
  if (url === null) return
  const trimmed = url.trim()
  if (!trimmed) { ed.chain().focus().extendMarkRange('link').unsetLink().run(); return }
  if (!/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) { window.alert('El enlace debe comenzar con https://, http://, mailto: o tel:'); return }
  ed.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run()
}

const buttons = computed(() => {
  const ed = editor.value!
  return [
    { label: 'N', title: 'Negrita', run: () => ed.chain().focus().toggleBold().run(), active: () => ed.isActive('bold') },
    { label: 'K', title: 'Cursiva', run: () => ed.chain().focus().toggleItalic().run(), active: () => ed.isActive('italic') },
    { label: 'H2', title: 'Encabezado 2', run: () => ed.chain().focus().toggleHeading({ level: 2 }).run(), active: () => ed.isActive('heading', { level: 2 }) },
    { label: 'H3', title: 'Encabezado 3', run: () => ed.chain().focus().toggleHeading({ level: 3 }).run(), active: () => ed.isActive('heading', { level: 3 }) },
    { label: '• Lista', title: 'Lista con viñetas', run: () => ed.chain().focus().toggleBulletList().run(), active: () => ed.isActive('bulletList') },
    { label: '1. Lista', title: 'Lista numerada', run: () => ed.chain().focus().toggleOrderedList().run(), active: () => ed.isActive('orderedList') },
    { label: 'Enlace', title: 'Insertar o editar enlace', run: setLink, active: () => ed.isActive('link') },
    { label: '↵', title: 'Salto de línea', run: () => ed.chain().focus().setHardBreak().run(), active: () => false }
  ]
})

onBeforeUnmount(() => editor.value?.destroy())
</script>

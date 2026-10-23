<template>
  <!-- Identificador visual de VISTA PRINCIPAL (listas y páginas institucionales): bloque verde contenido, esquinas rectas, barra dorada
       a la izquierda y texto alineado a la izquierda. Las vistas de DETALLE usan en cambio cabecera a todo el ancho, centrada, con
       degradado y tarjetas redondeadas (ver CommonDetailBack y las páginas [slug]). -->
  <header class="relative overflow-hidden bg-[#0C2619] text-white mb-10 md:mb-14 px-6 py-10 md:px-16 md:py-14 text-center md:text-left">
    <span aria-hidden="true" class="pointer-events-none absolute -right-24 -top-24 w-80 h-80 md:w-[28rem] md:h-[28rem] rounded-full border border-[#D3A76A]/30"></span>
    <span aria-hidden="true" class="pointer-events-none absolute -right-8 -top-8 w-48 h-48 md:w-72 md:h-72 rounded-full bg-[#D3A76A]/10"></span>
    <span aria-hidden="true" class="absolute left-0 top-0 h-full w-1.5 bg-[#D3A76A]"></span>

    <div class="relative grid gap-10 items-center" :class="facts.length ? 'md:grid-cols-[1fr_auto]' : ''">
      <div>
        <p class="text-[11px] font-bold tracking-[0.2em] text-[#D3A76A] uppercase mb-5 flex items-center justify-center md:justify-start gap-3">
          <span class="w-8 h-px bg-[#D3A76A]"></span>
          {{ eyebrow }}
        </p>
        <h1 class="font-serif text-[40px] md:text-[56px] lg:text-[72px] font-medium leading-[1.05] tracking-[-0.02em] text-white uppercase max-w-4xl break-words">
          <template v-for="(line, i) in lines" :key="i">{{ line }}<br v-if="i < lines.length - 1" /></template>
        </h1>
        <p v-if="lead" class="mt-8 text-lg text-white/80 font-light max-w-2xl leading-relaxed mx-auto md:mx-0">{{ lead }}</p>
        <div v-if="$slots.actions" class="mt-8"><slot name="actions" /></div>
      </div>

      <!-- Cifras destacadas a la derecha (solo escritorio). -->
      <dl v-if="facts.length" class="hidden md:grid gap-6 border-l border-[#D3A76A]/40 pl-10 text-left">
        <div v-for="f in facts" :key="f.label">
          <dd class="font-serif text-4xl lg:text-5xl text-[#D3A76A] leading-none">{{ f.value }}</dd>
          <dt class="mt-1 text-[11px] font-bold tracking-[0.15em] uppercase text-white/70">{{ f.label }}</dt>
        </div>
      </dl>
    </div>
  </header>
</template>

<script setup lang="ts">
// Sin `facts` se muestran las cifras que ya comunica el sitio (7,000 pacientes, 15 años, 72 meses); `:facts="[]"` las oculta.
withDefaults(defineProps<{ eyebrow: string, lines: string[], lead?: string, facts?: { value: string, label: string }[] }>(), {
  facts: () => [
    { value: '+7.000', label: 'Pacientes satisfechos' },
    { value: '+15', label: 'Años de experiencia' },
    { value: '72', label: 'Meses para pagar' }
  ]
})
</script>

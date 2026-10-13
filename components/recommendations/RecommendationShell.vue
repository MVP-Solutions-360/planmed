<template>
  <div class="bg-[#fcf9f8] min-h-screen font-sans">

    <!-- HERO -->
    <header class="relative overflow-hidden bg-gradient-to-br from-[#0C2619] via-[#12392a] to-[#1b5a3f] text-white pt-32 md:pt-40 pb-28 md:pb-36">
      <div class="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-[#D3A76A]/15 blur-3xl"></div>
      <div class="absolute -bottom-32 -left-20 w-[360px] h-[360px] rounded-full bg-white/5 blur-2xl"></div>
      <svg class="absolute inset-0 w-full h-full opacity-[0.05]" aria-hidden="true"><defs><pattern id="reco-dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#fff" /></pattern></defs><rect width="100%" height="100%" fill="url(#reco-dots)" /></svg>

      <div class="relative max-w-[900px] mx-auto px-6 text-center">
        <p class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D3A76A]/20 text-[#D3A76A] text-[11px] font-bold tracking-[0.2em] uppercase mb-6">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          {{ eyebrow }}
        </p>
        <h1 class="font-serif text-[34px] md:text-[54px] font-medium leading-[1.08] tracking-[-0.02em]">{{ title }}</h1>
        <p v-if="subtitle" class="mt-6 text-white/70 font-light text-lg max-w-2xl mx-auto leading-relaxed">{{ subtitle }}</p>
      </div>
    </header>

    <!-- CONTENIDO -->
    <main class="relative max-w-[900px] mx-auto px-4 md:px-6 -mt-16 md:-mt-20 pb-24">
      <article class="bg-white border border-[#e5e2e1] shadow-xl shadow-black/5 rounded-2xl p-6 md:p-12">
        <div v-if="videoUrl" class="-mt-2 mb-10 rounded-xl overflow-hidden [&>div]:my-0">
          <NewsYouTubeEmbed :url="videoUrl" />
        </div>

        <img v-if="image" :src="image" :alt="title" class="w-full md:w-[42%] md:float-right md:ml-10 mb-8 rounded-xl object-cover shadow-lg" />
        <CommonRichContent :html="html" class="reco-body" />
        <div class="clear-both"></div>
      </article>

      <!-- LLAMADO A LA ACCIÓN -->
      <aside class="mt-10 relative overflow-hidden rounded-2xl bg-[#0C2619] text-white p-8 md:p-12 text-center">
        <div class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#D3A76A]/20 blur-3xl"></div>
        <p class="relative text-[11px] font-bold tracking-[0.2em] text-[#D3A76A] uppercase mb-3">En Planmed te acompañamos</p>
        <h2 class="relative font-serif text-2xl md:text-3xl mb-4">Tu seguridad es lo más importante en cada etapa</h2>
        <p class="relative text-white/70 font-light max-w-xl mx-auto mb-8">Operarte con confianza es posible. Conoce cómo financiar tu cirugía con el respaldo de la entidad especializada en cirugía plástica.</p>
        <div class="relative flex flex-wrap justify-center gap-3">
          <NuxtLink to="/financiacion#calculadora" class="px-7 py-3 text-[11px] font-bold tracking-[0.15em] uppercase bg-[#D3A76A] text-[#0C2619] hover:bg-white transition-colors">Simular financiación</NuxtLink>
          <NuxtLink to="/procedimientos" class="px-7 py-3 text-[11px] font-bold tracking-[0.15em] uppercase border border-white/40 hover:bg-white/10 transition-colors">Ver procedimientos</NuxtLink>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  subtitle?: string
  html?: string
  videoUrl?: string
  image?: string
}>()
</script>

<style>
.reco-body { color: #4c4546; font-weight: 300; font-size: 1.0625rem; line-height: 1.75; }
.reco-body p { margin: 0 0 1.25em; }
.reco-body strong { font-weight: 600; color: #0C2619; }
.reco-body a { color: #0C2619; text-decoration: underline; text-underline-offset: 3px; }

.reco-body h2, .reco-body h3 {
  font-family: var(--font-serif, serif);
  font-size: 1.5rem; font-weight: 500; line-height: 1.25; text-transform: none; color: #0C2619;
  margin: 2.2em 0 .8em; padding-left: 1rem; border-left: 4px solid #D3A76A;
}
.reco-body > :first-child { margin-top: 0; }

.reco-body ul, .reco-body ol { list-style: none; padding: 0; margin: 0 0 1.6em; counter-reset: reco; display: grid; gap: .6rem; }
.reco-body li {
  position: relative; padding: .85rem 1rem .85rem 3.25rem; background: #f7faf8; border: 1px solid #e3ede7; border-radius: .75rem;
  transition: transform .2s, box-shadow .2s, border-color .2s;
}
.reco-body li:hover { transform: translateX(4px); border-color: #0C2619; box-shadow: 0 6px 18px rgba(12, 38, 25, .08); }
.reco-body li > p { margin: 0; }
.reco-body li::before {
  content: ''; position: absolute; left: 1rem; top: 50%; transform: translateY(-50%);
  width: 1.5rem; height: 1.5rem; border-radius: 9999px; background: #0C2619 center / .9rem no-repeat;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23D3A76A' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 13l4 4L19 7'/%3E%3C/svg%3E");
}
.reco-body ol li::before {
  counter-increment: reco; content: counter(reco); background-image: none; color: #D3A76A;
  font-size: .8rem; font-weight: 700; display: flex; align-items: center; justify-content: center;
}
</style>

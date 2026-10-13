<template>
  <section v-if="hasContact" class="bg-[#fcf9f8] border-t border-[#e5e2e1]" aria-labelledby="about-contact-title">
    <div class="max-w-[1200px] mx-auto px-6 md:px-12 py-16 md:py-24">
      <h2 id="about-contact-title" class="font-serif text-3xl md:text-4xl font-medium text-[#0C2619] uppercase mb-10 md:mb-14 text-center md:text-left">
        Contacto
      </h2>
      <div class="grid gap-10" :class="mapQuery && c.map.enabled ? 'lg:grid-cols-2' : ''">
        <ul class="grid sm:grid-cols-2 gap-px bg-[#e5e2e1] border border-[#e5e2e1]" :class="mapQuery && c.map.enabled ? '' : 'lg:grid-cols-4'">
          <li v-if="addressLines.length" class="bg-white p-6 md:p-8">
            <p class="label">Dirección</p>
            <p v-for="line in addressLines" :key="line" class="text-gray-800 leading-relaxed break-words">{{ line }}</p>
          </li>
          <li v-if="c.phone" class="bg-white p-6 md:p-8">
            <p class="label">Teléfono</p>
            <a :href="aboutPhoneHref(c.phone)" class="text-gray-800 hover:text-[#0C2619] underline-offset-4 hover:underline break-words">{{ c.phone }}</a>
          </li>
          <li v-if="c.email" class="bg-white p-6 md:p-8">
            <p class="label">Correo electrónico</p>
            <a :href="`mailto:${c.email}`" class="text-gray-800 hover:text-[#0C2619] underline-offset-4 hover:underline break-all">{{ c.email }}</a>
          </li>
          <li v-if="c.schedule" class="bg-white p-6 md:p-8">
            <p class="label">Horario de atención</p>
            <CommonRichContent :html="c.schedule" class="text-gray-800 leading-relaxed" />
          </li>
          <li v-if="socials.length" class="bg-white p-6 md:p-8">
            <p class="label">Redes sociales</p>
            <div class="flex items-center gap-4 text-[#0C2619]">
              <a
                v-for="s in socials"
                :key="s.network"
                :href="s.url"
                target="_blank"
                rel="noopener noreferrer"
                class="w-10 h-10 rounded-full border border-[#D3A76A] flex items-center justify-center hover:bg-[#0C2619] hover:text-[#D3A76A] transition-colors"
                :aria-label="`${s.label} de Planmed`"
                :title="s.label"
              >
                <svg class="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24" aria-hidden="true"><path :d="s.icon" /></svg>
              </a>
            </div>
          </li>
        </ul>

        <div v-if="mapQuery && c.map.enabled" class="flex flex-col gap-3">
          <div class="relative w-full aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[320px] border border-[#e5e2e1] bg-white overflow-hidden">
            <iframe
              :src="aboutMapEmbedUrl(mapQuery)"
              class="absolute inset-0 w-full h-full"
              :title="`Mapa: ${mapQuery}`"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <a :href="aboutMapLinkUrl(mapQuery)" target="_blank" rel="noopener noreferrer" class="self-start text-[11px] font-bold tracking-[0.15em] uppercase text-[#0C2619] hover:underline underline-offset-4">
            Abrir en Google Maps
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Sección «Contacto» (dirección, teléfono, correo, horario, redes y mapa) con los datos administrados en /admin/nosotros.
// Solo muestra lo que está guardado: nada se inventa. La usan /nosotros y /financiacion.
import { computed } from 'vue'
import { aboutMapQuery, aboutMapEmbedUrl, aboutMapLinkUrl, aboutPhoneHref, type AboutContent, type AboutSocialNetwork } from '#shared/utils/aboutContent'

const props = defineProps<{ contact: AboutContent['contact'] }>()
const c = computed(() => props.contact)

const addressLines = computed(() => [c.value.address, c.value.building, c.value.city, c.value.region].filter(Boolean))
const mapQuery = computed(() => (c.value.address && c.value.city ? aboutMapQuery(c.value) : ''))

const SOCIAL_META: Record<AboutSocialNetwork, { label: string, icon: string }> = {
  instagram: { label: 'Instagram', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
  facebook: { label: 'Facebook', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
  tiktok: { label: 'TikTok', icon: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.24-2.37.59-4.84 2.27-6.52 1.71-1.7 4.2-2.47 6.55-1.97v4.12c-1.64-.53-3.64-.17-4.88 1.09-1.24 1.25-1.55 3.32-.73 4.88.82 1.55 2.62 2.5 4.39 2.18 1.77-.32 3.12-1.85 3.12-3.64 0-4.99-.02-9.98.02-14.97z' }
}
const socials = computed(() => (Object.keys(SOCIAL_META) as AboutSocialNetwork[])
  .filter(n => c.value.socials[n])
  .map(n => ({ network: n, url: c.value.socials[n], ...SOCIAL_META[n] })))

const hasContact = computed(() => addressLines.value.length > 0 || !!c.value.phone || !!c.value.email || !!c.value.schedule || socials.value.length > 0)
</script>

<style scoped>
.label { font-size: 11px; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; color: #9a7a45; margin-bottom: .75rem; }
</style>

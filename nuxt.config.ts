import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      appName: 'Planmed',
      localDomain: 'planmed.com',
      // Wellezy Hub settings removed/disabled for now
      // apiBaseUrl: '',
      // tenantSlug: ''
    }
  },
  modules: [
    '@nuxtjs/sitemap'
  ],
  site: {
    url: 'https://planmed.com'
  },
  app: {
    head: {
      title: 'Planmed',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/images/branding/logo-ico.ico' }
      ]
    }
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  css: ['~/assets/css/tailwind.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ]
  },
  routeRules: {
    '/': { prerender: true },
    '/nosotros': { prerender: true },
    '/simulador': { ssr: false },
    '/recursos': { prerender: true },
    '/blog/**': { isr: 3600 },
    '/procedimientos/**': { ssr: true },
    '/casos-clinicos/**': { ssr: true },
    '/clinicas/**': { ssr: true }
  }
})

import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  runtimeConfig: {
    // Solo servidor (nunca expuestos al cliente). Se sobrescriben con NUXT_WELLEZY_*, NUXT_PLANMED_ADMIN_ROLE_IDS
    // y NUXT_SESSION_PASSWORD (mínimo 32 caracteres aleatorios).
    // Autenticación contra Wellezy Hub: p. ej. https://wellezyhub.com/api (local: http://localhost:8000/api).
    wellezyApiBaseUrl: '',
    wellezyCompanySlug: 'planmed',
    wellezyLineSlug: 'planmed',
    // IDs de rol (users.role.id de Wellezy) autorizados para el CMS, separados por coma.
    planmedAdminRoleIds: '19',
    sessionPassword: '',
    // Directorio persistente del contenido administrado localmente en la web (página «Nosotros»). NUXT_PLANMED_CONTENT_DIR.
    // Vacío => `<directorio de trabajo>/.data/planmed-content`. Debe quedar FUERA de `.output/` para sobrevivir a los despliegues.
    planmedContentDir: '',
    public: {
      appName: 'Planmed',
      localDomain: 'planmed.com',
      // Formulario público de PRP del CRM médico externo (POST directo desde el navegador). Se sobrescribe con NUXT_PUBLIC_CRM_PRP_FORM_URL.
      crmPrpFormUrl: 'https://pdtclientsolutions.com/crm-public/api/forms-px-prp',
      // Wellezy Hub settings removed/disabled for now
      // apiBaseUrl: '',
      // tenantSlug: ''
    }
  },
  typescript: {
    tsConfig: {
      // Scripts sueltos de mantenimiento (no forman parte de la aplicación); el typecheck solo cubre el código de la app.
      exclude: ['../*.js', '../*.cjs', '../scratch', '../scripts']
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
    // Estas páginas se renderizan en cada petición (SSR), NO en el build: el menú compartido (Navbar) trae datos del Hub
    // (recomendaciones, procedimientos, visibilidad de pacientes) y un prerenderizado los congelaría con lo que hubiera al compilar.
    '/': { ssr: true },
    '/nosotros': { ssr: true },
    // El simulador vive ahora dentro de /financiacion (sección #calculadora): la ruta anterior redirige.
    '/simulador': { redirect: { to: '/financiacion', statusCode: 301 } },
    '/recursos': { ssr: true },
    '/blog/**': { isr: 3600 },
    '/procedimientos/**': { ssr: true },
    '/prp/**': { ssr: true },
    '/casos-clinicos/**': { ssr: true },
    '/clinicas/**': { ssr: true }
  }
})

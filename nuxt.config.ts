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
    // IDs de rol que, además del líder de la línea, pueden ver y modificar la tasa de interés del simulador (rol «Diseñador gráfico» = 19 en
    // Wellezy Hub según el repositorio; confirmar en el Hub real). Separados por coma. NUXT_PLANMED_RATE_EDITOR_ROLE_IDS. Deben seguir siendo roles del CMS.
    planmedRateEditorRoleIds: '19',
    sessionPassword: '',
    // Proxies de confianza delante de la aplicación para resolver la IP del cliente (límite de peticiones del PRP). 0 = ignorar X-Forwarded-For
    // y usar la IP del socket (seguro, pero tras un proxy todos comparten una sola IP). NUXT_TRUSTED_PROXY_HOPS; subir a 1 SOLO tras confirmar la infraestructura.
    trustedProxyHops: 0,
    // Directorio persistente del contenido administrado localmente en la web (página «Nosotros»). NUXT_PLANMED_CONTENT_DIR.
    // Vacío => `<directorio de trabajo>/.data/planmed-content`. Debe quedar FUERA de `.output/` para sobrevivir a los despliegues.
    planmedContentDir: '',
    // Formulario de valoración → CRM médico (POST multipart desde el SERVIDOR; el navegador nunca lo llama). NUXT_CRM_VALUATION_URL.
    crmValuationUrl: 'https://pdtclientsolutions.com/crm-public/api/clients/forms',
    public: {
      appName: 'Planmed',
      localDomain: 'planmed.com.co',
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
    // Dominio público que se posiciona (confirmado por el responsable del sitio; coincide con documentacion/plan_implementacion_paginas_referido_y_noticias.md).
    // Se puede sobrescribir por entorno con NUXT_PUBLIC_SITE_URL (nuxt-site-config); si el despliegue lo define, esa variable manda.
    url: 'https://planmed.com.co'
  },
  // El sitemap solo lista páginas públicas: el panel (/admin/**) no debe ofrecerse a los buscadores.
  sitemap: {
    exclude: ['/admin', '/admin/**']
  },
  app: {
    head: {
      title: 'FINANCIACIÓN DE CIRUGÍAS PLÁSTICAS',
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
    // El panel nunca se indexa. NO se bloquea en robots.txt a propósito: un buscador que no puede rastrear la URL tampoco ve este encabezado.
    '/admin/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
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

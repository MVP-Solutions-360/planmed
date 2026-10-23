// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Página de error del sitio (error.vue): contenido por código HTTP, seguridad (sin detalles técnicos), acciones reales, diseño adaptable y
// accesibilidad básica. El estado HTTP real y las rutas válidas se comprueban en tests/integration/error-pages.test.ts (necesita el sitio en marcha).
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from './recommendations/harness.ts'
import { describeSiteError, isAdminPath } from '../utils/siteError.ts'

const read = rel => readFileSync(join(ROOT, rel), 'utf8')
const vue = read('error.vue')

describe('contenido por código HTTP', () => {
  test('404: «Esta página no está disponible», sin reintentar ni login', () => {
    const v = describeSiteError({ statusCode: 404, path: '/no-existe' })
    assert.equal(v.variant, 'not-found')
    assert.equal(v.code, 404)
    assert.equal(v.title, 'Esta página no está disponible')
    assert.match(v.message, /no existe|ya no está disponible/)
    assert.equal(v.retry, false)
    assert.equal(v.login, false)
  })

  test('500 y otros 5xx: «Estamos teniendo dificultades», con reintento y sin detalles internos', () => {
    for (const statusCode of [500, 501, 599, undefined, null, NaN, 'abc']) {
      const v = describeSiteError({ statusCode, statusMessage: 'SQLSTATE[42S02] at /var/www/secret.ts:12', path: '/x' })
      assert.equal(v.variant, 'unexpected', String(statusCode))
      assert.equal(v.title, 'Estamos teniendo dificultades')
      assert.equal(v.retry, true)
      assert.equal(v.code >= 500 && v.code <= 599, true)
      assert.doesNotMatch(JSON.stringify(v), /SQLSTATE|secret|\/var\/www|stack|Error:/)
    }
  })

  test('fallos temporales de conexión/servicio (502, 503, 504, 429) no se confunden con una ruta inexistente', () => {
    for (const statusCode of [502, 503, 504, 429]) {
      const v = describeSiteError({ statusCode, statusMessage: 'No fue posible cargar la página. Intenta nuevamente.' })
      assert.equal(v.variant, 'unavailable')
      assert.notEqual(v.variant, 'not-found')
      assert.equal(v.retry, true)
      assert.match(v.message, /temporal/)
      assert.match(v.message, /no de la dirección/)
    }
  })

  test('401 y 403 NO se convierten en 404 y conservan su código', () => {
    const a = describeSiteError({ statusCode: 401, path: '/admin/recomendaciones' })
    assert.equal(a.variant, 'auth'); assert.equal(a.code, 401); assert.equal(a.login, true)
    const f = describeSiteError({ statusCode: 403, path: '/admin/configuracion' })
    assert.equal(f.variant, 'forbidden'); assert.equal(f.code, 403)
    assert.notEqual(f.title, 'Esta página no está disponible')
  })

  test('403 del panel: el mensaje de usuario escrito a propósito se conserva; fuera del panel o con texto técnico no', () => {
    const text = 'Solo el líder de la línea puede acceder a la configuración.'
    assert.equal(describeSiteError({ statusCode: 403, statusMessage: text, path: '/admin/configuracion' }).message, text)
    assert.notEqual(describeSiteError({ statusCode: 403, statusMessage: text, path: '/procedimientos' }).message, text)
    const technical = describeSiteError({ statusCode: 403, statusMessage: 'Error: at C:\\\\app\\\\server.ts:10 <script>', path: '/admin/x' })
    assert.doesNotMatch(technical.message, /server\.ts|script|Error:/)
  })

  test('otros 4xx: solicitud no válida (no son 404 ni 500)', () => {
    const v = describeSiteError({ statusCode: 422 })
    assert.equal(v.variant, 'bad-request'); assert.equal(v.code, 422); assert.equal(v.retry, false)
  })

  test('rutas del panel se detectan sin falsos positivos', () => {
    assert.equal(isAdminPath('/admin'), true)
    assert.equal(isAdminPath('/admin/recomendaciones'), true)
    assert.equal(isAdminPath('/administracion'), false)
    assert.equal(isAdminPath('/recomendaciones/admin'), false)
    assert.equal(describeSiteError({ statusCode: 404, path: '/admin/nada' }).admin, true)
  })
})

describe('mecanismo y seguridad de error.vue', () => {
  test('usa el mecanismo oficial de Nuxt 4: error.vue junto a app.vue (no una ruta 404.vue)', () => {
    assert.equal(existsSync(join(ROOT, 'error.vue')), true)
    assert.equal(existsSync(join(ROOT, 'app.vue')), true)
    assert.equal(existsSync(join(ROOT, 'pages/404.vue')), false)
    assert.equal(existsSync(join(ROOT, 'pages/[...slug].vue')), false) // un catch-all respondería 200 en rutas inexistentes
    assert.match(vue, /defineProps<\{ error: NuxtError \}>\(\)/)
  })

  test('no muestra trazas ni mensajes técnicos: el detalle solo existe en desarrollo', () => {
    assert.match(vue, /const isDev = import\.meta\.dev/)
    assert.match(vue, /v-if="isDev && technical"/)
    assert.match(vue, /isDev \? \[/) // technical se calcula solo con isDev
    // El texto visible sale de describeSiteError, nunca de error.message/statusMessage/stack directamente en la plantilla.
    const template = vue.slice(0, vue.indexOf('<script'))
    assert.equal(/error\.(message|stack|statusMessage)/.test(template), false)
  })

  test('los botones hacen acciones reales y no provocan bucles', () => {
    assert.match(vue, /clearError\(\{ redirect: '\/' \}\)/) // Ir al inicio
    assert.match(vue, /clearError\(\{ redirect: '\/admin\/login' \}\)/)
    assert.match(vue, /reloadNuxtApp\(\{ path: route\.fullPath, persistState: false \}\)/) // Reintentar: acción del usuario
    assert.match(vue, /window\.history\.back\(\)/)
    assert.equal(/setTimeout|setInterval|navigateTo\(|router\.(push|replace)\(.*route\.fullPath/.test(vue.slice(vue.indexOf('<script'))), false) // nada automático
    assert.match(vue, /Ir al inicio/)
  })

  test('«Volver atrás» solo aparece si hay una página previa del propio sitio', () => {
    assert.match(vue, /v-if="canGoBack"/)
    assert.match(vue, /document\.referrer/)
    assert.match(vue, /origin === window\.location\.origin/)
  })

  test('no depende del Hub ni de datos externos (la cabecera es mínima) ni de imágenes remotas', () => {
    assert.equal(/LayoutNavbar|LayoutFooter|useAsyncData|useFetch|\$fetch|wellezy/i.test(vue), false)
    assert.equal(/<img[^>]+src="https?:/.test(vue), false)
    assert.equal(/<img[^>]+src="\/images\/branding\/logo\.jpg"/.test(vue), true)
    assert.equal(existsSync(join(ROOT, 'public/images/branding/logo.jpg')), true)
  })
})

describe('diseño adaptable y accesibilidad básica', () => {
  test('estructura semántica: main, un solo h1 enlazado a la sección, idioma y noindex', () => {
    assert.match(vue, /<main id="contenido"/)
    assert.equal((vue.match(/<h1/g) || []).length, 1)
    assert.match(vue, /aria-labelledby="error-titulo"/)
    assert.match(vue, /id="error-titulo"/)
    assert.match(vue, /lang: 'es'/)
    assert.match(vue, /robots: 'noindex, nofollow'/)
  })

  test('el número decorativo no se anuncia y el código sí está en texto', () => {
    assert.match(vue, /aria-hidden="true">\{\{ view\.code \}\}/)
    assert.match(vue, /Error \{\{ view\.code \}\}/)
  })

  test('adaptable: tipografías y botones se ajustan a móvil; acciones apilables', () => {
    assert.match(vue, /text-\[7\.5rem\] sm:text-\[10rem\]/)
    assert.match(vue, /text-3xl sm:text-4xl md:text-5xl/)
    assert.match(vue, /flex-col sm:flex-row/)
    assert.match(vue, /px-6/)
  })

  test('controles accesibles: <button type="button">, objetivo táctil ≥ 48px y foco visible', () => {
    assert.equal((vue.match(/<button(?![^>]*type="button")/g) || []).length, 0)
    assert.match(vue, /min-height: 48px/)
    assert.match(vue, /:focus-visible/)
    assert.match(vue, /focus-visible:ring-2/)
  })

  test('misma identidad visual que el sitio: paleta y tipografías existentes', () => {
    for (const token of ['#0C2619', '#D3A76A', '#fcf9f8', '#e5e2e1', '#4c4546', 'font-serif', 'font-sans']) assert.ok(vue.includes(token), token)
    assert.match(read('assets/css/theme.css'), /--color-accent: #0C2619/)
  })
})

describe('los flujos específicos existentes no cambian', () => {
  test('el middleware del panel sigue enviando 401 a /admin/login y lanzando 403 (no 404) en Configuración', () => {
    const mw = read('middleware/admin-auth.global.ts')
    assert.match(mw, /navigateTo\('\/admin\/login'\)/)
    assert.match(mw, /statusCode: 403/)
    assert.equal(/statusCode: 404/.test(mw), false)
  })

  test('las páginas públicas siguen distinguiendo 503 (Hub caído) de 404 (no existe)', () => {
    const page = read('pages/recomendaciones/[slug].vue')
    assert.match(page, /statusCode: 503/)
    assert.match(page, /statusCode: 404/)
  })

  test('la pantalla de Recomendaciones del panel conserva sus errores por acción (no usa error.vue para validaciones)', () => {
    assert.match(read('pages/admin/recomendaciones/historico.vue'), /AdminRecommendationsErrorNotice/)
    assert.equal(/showError|createError/.test(read('utils/recommendationsAdmin.ts')), false)
  })
})

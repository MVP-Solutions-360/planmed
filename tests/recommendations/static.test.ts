// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Comprobaciones estáticas del código fuente: SSR sin localStorage, sin mocks y sin tokens/URLs de administración en el navegador.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { ROOT } from './harness.ts'

const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8')

// Código sin comentarios (// al inicio o tras espacio, /* */ y <!-- -->): un comentario que menciona un término no cuenta como uso.
const code = (rel: string) => read(rel).replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1')

function walk(dir: string, out: string[] = []) {
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = `${dir}/${name}`
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, out)
    else out.push(rel)
  }
  return out
}

const recommendationFiles = [
  'providers/HubRecommendationsProvider.ts', 'providers/HubPublicRecommendationsProvider.ts', 'providers/RecommendationsProvider.ts',
  'providers/PublicRecommendationsProvider.ts', 'services/RecommendationsService.ts', 'services/PublicRecommendationsService.ts',
  'pages/recomendaciones/[slug].vue', 'pages/recomendaciones/cuidados/index.vue', 'pages/recomendaciones/cuidados/[slug].vue',
  'pages/recomendaciones/revision/index.vue', 'pages/recomendaciones/revision/[slug].vue', 'pages/admin/recomendaciones/index.vue',
  'components/recommendations/ProcedureRecommendation.vue', 'components/recommendations/ProcedureRecommendationIndex.vue',
  'components/recommendations/RecommendationShell.vue', 'utils/recommendationKinds.ts', 'types/recommendations.ts'
]

describe('sin mocks ni localStorage', () => {
  test('el proveedor mock de recomendaciones ya no existe y nada lo referencia', () => {
    assert.equal(existsSync(join(ROOT, 'providers/MockRecommendationsProvider.ts')), false)
    for (const file of [...walk('providers'), ...walk('services'), ...walk('pages'), ...walk('components'), ...walk('server')]) {
      assert.equal(/MockRecommendations/.test(read(file)), false, file)
    }
  })

  test('los módulos de recomendaciones no usan localStorage ni sessionStorage', () => {
    for (const file of recommendationFiles) {
      assert.equal(/localStorage|sessionStorage|indexedDB/.test(code(file)), false, file)
    }
    const nav = read('components/layout/Navbar.vue')
    // El Navbar aún usa el mock de "Nuestros Pacientes" (otro módulo); lo de recomendaciones no.
    assert.equal(/recommendationsService|MockRecommendations/.test(nav), false)
  })

  test('el servicio por defecto es Hub y no hay datos ficticios de contenido', () => {
    assert.match(read('services/RecommendationsService.ts'), /new HubRecommendationsProvider\(\)/)
    assert.match(read('services/PublicRecommendationsService.ts'), /new HubPublicRecommendationsProvider\(\)/)
    assert.equal(/Recomendaciones para asistir a cita de preanestesia|La importancia de la cita/.test(read('providers/HubRecommendationsProvider.ts')), false)
  })
})

describe('SSR de las páginas públicas', () => {
  const publicPages = [
    'pages/recomendaciones/[slug].vue', 'components/recommendations/ProcedureRecommendation.vue', 'components/recommendations/ProcedureRecommendationIndex.vue'
  ]

  test('cargan con useAsyncData en el servidor y no leen datos en onMounted', () => {
    for (const file of publicPages) {
      const src = read(file)
      assert.match(src, /await useAsyncData\(/, file)
      assert.equal(/onMounted/.test(src), false, `${file} no debe cargar contenido en onMounted`)
    }
  })

  test('página inexistente o no publicada => 404 real (createError fatal), no un mensaje con HTTP 200', () => {
    for (const file of ['pages/recomendaciones/[slug].vue', 'components/recommendations/ProcedureRecommendation.vue']) {
      const src = read(file)
      assert.match(src, /createError\(\{ statusCode: 404/, file)
      assert.match(src, /fatal: true/, file)
      assert.equal(/no está disponible por el momento/.test(src), false, file)
    }
  })

  test('el menú se construye con páginas publicadas e indicadores de la lista pública (sin pedir cada detalle)', () => {
    const nav = read('components/layout/Navbar.vue')
    assert.match(nav, /publicRecommendationsService\.getPages\(\)/)
    assert.match(read('utils/navMenus.ts'), /p\[meta\.flag\] === true/)
    assert.match(nav, /useAsyncData\('nav-recommendations'/)
    assert.equal(/getProcedureBySlug/.test(nav), false)
    assert.match(read('components/recommendations/ProcedureRecommendationIndex.vue'), /p\[meta\.flag\] === true/)
  })
})

describe('Hub caído no se confunde con página inexistente', () => {
  test('las páginas de recomendaciones responden 503 ante un error del Hub y 404 solo si no existe', () => {
    for (const file of ['pages/recomendaciones/[slug].vue', 'components/recommendations/ProcedureRecommendation.vue']) {
      const src = code(file)
      assert.match(src, /const \{ data(: \w+)?, error \} = await useAsyncData/, file)
      assert.match(src, /if \(error\.value\) \{\s*throw createError\(\{ statusCode: 503/, file)
      assert.ok(src.indexOf('statusCode: 503') < src.indexOf('statusCode: 404'), file + ': el 503 se evalúa antes que el 404')
    }
  })
})

describe('tokens administrativos y URLs del Hub fuera del navegador', () => {
  const clientDirs = ['pages', 'components', 'layouts', 'composables', 'middleware', 'providers', 'services', 'utils', 'types', 'plugins']

  test('ningún archivo del cliente referencia el Bearer, el token de sesión ni la URL del Hub', () => {
    for (const dir of clientDirs) {
      if (!existsSync(join(ROOT, dir))) continue
      for (const file of walk(dir).filter(f => /\.(vue|ts|js)$/.test(f))) {
        const src = code(file)
        assert.equal(/Authorization|Bearer |wellezyApiBaseUrl|NUXT_WELLEZY_API_BASE_URL|session\.data\.token/.test(src), false, file)
      }
    }
  })

  test('las URLs del Hub salen de la configuración del entorno, nunca hardcodeadas', () => {
    const files = [...walk('server'), ...recommendationFiles, 'nuxt.config.ts']
    for (const file of files) {
      const src = code(file)
      assert.equal(/https?:\/\/(localhost|127\.0\.0\.1|[a-z0-9.-]*wellezy)[^'"`\s]*/i.test(src), false, `${file} tiene una URL del Hub escrita en el código`)
    }
    const config = read('nuxt.config.ts')
    const privatePart = config.slice(config.indexOf('runtimeConfig'), config.indexOf('public:') > 0 ? config.indexOf('public:') : undefined)
    assert.match(privatePart, /wellezyApiBaseUrl: ''/)
    assert.match(read('server/utils/wellezy.ts'), /useRuntimeConfig\(event\)\.wellezyApiBaseUrl/)
  })

  test('el tenant y el token solo se usan en el servidor', () => {
    for (const file of walk('server/api').filter(f => f.includes('recommendations'))) {
      const src = read(file)
      assert.equal(/company_id|linea_id/.test(code(file)), false, `${file} no reenvía ids de empresa/línea`)
    }
    assert.match(read('server/utils/wellezy.ts'), /X-Tenant-Linea/)
  })

  test('las rutas de administración validan el origen y la sesión (adminSession)', () => {
    assert.match(read('server/utils/recommendations.ts'), /await adminSession\(event\)/)
  })
})

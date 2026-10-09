// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// (1) Listados públicos: lista vacía válida vs error del Hub vs tenant sin resolver vs respuesta inválida (rutas Nitro + páginas).
// (2) Fuente de las recomendaciones de un procedimiento (página vinculada publicada / oculta / histórico / ninguna).
import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { FakeHub, HUB_TOKEN, ROOT, makeEvent, run, setup } from './harness.ts'

const hub = new FakeHub()
let api
before(async () => {
  api = await setup(hub)
  Object.assign(globalThis, api.news, await imp('server/utils/patients.ts'))
})
const fresh = () => { hub.calls = []; hub.rules = []; hub.token = HUB_TOKEN }
const esc = p => new RegExp('^' + p.replace(/[?]/g, '[?]') + '$')
const src = rel => readFileSync(join(ROOT, rel), 'utf8')
const code = rel => src(rel).replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1')
const imp = rel => import(pathToFileURL(join(ROOT, rel)).href)

const LISTS = [
  { rel: 'server/api/public/procedures/index.get.ts', path: '/v1/web/cirugias?page=1', empty: { data: [], meta: { last_page: 1 } } },
  { rel: 'server/api/public/news/index.get.ts', path: '/v1/web/posts?per_page=50', empty: { data: [] } },
  { rel: 'server/api/public/recommendations/index.get.ts', path: '/v1/web/recommendation-pages', empty: { data: [] } }
]

describe('listados públicos (Nitro): lista vacía válida ≠ fallo del servicio', () => {
  for (const { rel, path, empty } of LISTS) {
    test(`${rel}: 200 con [] es una respuesta válida; los fallos son 503 con causa`, async () => {
      const handler = await api.handler(rel)
      fresh(); hub.on('GET', esc(path), 200, empty)
      const ok = await run(handler, makeEvent())
      assert.equal(ok.error, undefined)
      assert.deepEqual(ok.value, [])

      const cases = [
        ['hub_unavailable', 0, {}], ['hub_unavailable', 500, { message: 'x' }], ['hub_unavailable', 503, {}],
        ['tenant', 404, { message: 'Tenant Linea not found or inactive' }],
        ['rejected', 401, {}], ['rejected', 403, {}],
        ['invalid_response', 200, { data: 'no-es-una-lista' }], ['invalid_response', 200, {}]
      ]
      for (const [reason, status, data] of cases) {
        fresh(); hub.on('GET', esc(path), status, data)
        const { error } = await run(handler, makeEvent())
        assert.equal(error.statusCode, 503, `${reason} (${status})`)
        assert.equal(error.data.reason, reason, `${rel} ${status}`)
      }
    })
  }

  test('«Nuestros Pacientes»: sección válida => 200; mismos fallos => 503 con causa', async () => {
    const handler = await api.handler('server/api/public/patient-section.get.ts')
    fresh(); hub.on('GET', '/v1/web/patient-section', 200, { data: { visibility: { videos: true, before_after: true }, videos: [], instagram: [], before_after: [], referral: {} } })
    assert.equal((await run(handler, makeEvent())).error, undefined)
    for (const [reason, status, data] of [['hub_unavailable', 0, {}], ['tenant', 404, { message: 'Tenant x' }], ['invalid_response', 200, {}], ['rejected', 403, {}]]) {
      fresh(); hub.on('GET', '/v1/web/patient-section', status, data)
      const { error } = await run(handler, makeEvent())
      assert.equal(error.statusCode, 503)
      assert.equal(error.data.reason, reason)
    }
  })

  test('la lista de procedimientos con una página intermedia que falla también es 503 (no una lista parcial)', async () => {
    const handler = await api.handler('server/api/public/procedures/index.get.ts')
    fresh()
    hub.on('GET', esc('/v1/web/cirugias?page=1'), 200, { data: [{ slug: 'a', nombre: 'A' }], meta: { last_page: 2 } })
    hub.on('GET', esc('/v1/web/cirugias?page=2'), 500, {})
    assert.equal((await run(handler, makeEvent())).error.statusCode, 503)
  })

  test('los detalles distinguen: 404 de Hub => 404; tenant => 503 con causa', async () => {
    for (const [rel, path] of [['server/api/public/procedures/[slug].get.ts', '/v1/web/cirugias/x'], ['server/api/public/news/[slug].get.ts', '/v1/web/posts/x'], ['server/api/public/recommendations/[slug].get.ts', '/v1/web/recommendation-pages/x']]) {
      const handler = await api.handler(rel)
      fresh(); hub.on('GET', path, 404, { message: 'No query results' })
      assert.equal((await run(handler, makeEvent({ params: { slug: 'x' } }))).error.statusCode, 404, rel)
      fresh(); hub.on('GET', path, 404, { message: 'Tenant Linea not found' })
      const { error } = await run(handler, makeEvent({ params: { slug: 'x' } }))
      assert.equal(error.statusCode, 503, rel)
      assert.equal(error.data.reason, 'tenant', rel)
    }
  })
})

describe('páginas de listado (SSR + cliente)', () => {
  const listings = ['pages/procedimientos/index.vue', 'pages/noticias/index.vue', 'pages/testimonios/index.vue', 'pages/testimonios/antes-y-despues.vue', 'pages/testimonios/programa-de-referidos.vue', 'components/recommendations/ProcedureRecommendationIndex.vue']

  test('cada listado captura `error`, responde 503 en SSR y muestra el aviso con reintento en lugar de un estado vacío', () => {
    for (const rel of listings) {
      const s = code(rel)
      assert.match(s, /await useAsyncData\([\s\S]*?\)\s*\n/, rel)
      assert.match(s, /const \{ data[^}]*\berror\b[^}]*\brefresh\b[^}]*\} = await useAsyncData/, rel)
      assert.match(s, /useServiceUnavailable\(error\)/, rel)
      assert.match(src(rel), /<CommonHubUnavailable v-if="error" :retrying="status === 'pending'" @retry="refresh\(\)" \/>/, rel)
    }
  })

  test('los mensajes de «aún no hay contenido» no se muestran cuando hubo un error', () => {
    for (const rel of ['pages/testimonios/index.vue']) assert.match(src(rel), /v-else-if="loaded && !error"/, rel)
    // En el resto el aviso encabeza la cadena v-if/v-else-if: si hay error, nada más de la cadena se renderiza.
    assert.match(src('pages/testimonios/antes-y-despues.vue'), /v-if="error"[\s\S]*?v-else-if="loaded && !visibility"/)
    assert.match(src('pages/testimonios/programa-de-referidos.vue'), /v-if="error"[\s\S]*?v-else-if="referral\.content"/)
    assert.match(src('pages/procedimientos/index.vue'), /v-if="error"[\s\S]*?<div v-else class="grid/)
    assert.match(src('pages/noticias/index.vue'), /v-if="error"[\s\S]*?<div v-else class="grid/)
    assert.match(src('components/recommendations/ProcedureRecommendationIndex.vue'), /v-if="error"[\s\S]*?v-else-if="items\.length \|\| extras\.length"/)
  })

  test('el aviso es accesible (role=alert), no dice «no hay contenido» y ofrece Reintentar', () => {
    const s = src('components/common/HubUnavailable.vue')
    assert.match(s, /role="alert"/)
    assert.match(s, /Reintentar/)
    assert.match(s, /No significa que no haya contenido/)
    assert.match(s, /\$emit\('retry'\)/)
  })

  test('useServiceUnavailable: 503 solo en el servidor y solo si hubo error', () => {
    const s = code('composables/useServiceUnavailable.ts')
    assert.match(s, /import\.meta\.server && error\.value/)
    assert.match(s, /setResponseStatus\(event, 503/)
  })

  test('Navbar no usa el aviso: un fallo del Hub no debe romper la navegación (decisión documentada)', () => {
    assert.equal(/HubUnavailable|useServiceUnavailable/.test(src('components/layout/Navbar.vue')), false)
  })
})

describe('fuente de las recomendaciones de un procedimiento', () => {
  let resolveRecommendation, fromRecommendationSources, buildMenus, RECOMMENDATION_KINDS
  before(async () => {
    ({ resolveRecommendation } = await imp('utils/recommendationSource.ts'))
    ;({ buildMenus } = await imp('utils/navMenus.ts'))
    ;({ RECOMMENDATION_KINDS } = await imp('utils/recommendationKinds.ts'))
    fromRecommendationSources = api.proc.fromRecommendationSources
  })
  const isEmpty = html => html.replace(/<[^>]*>/g, '').trim() === ''
  const resolve = (procedure, kind = 'cuidados') => resolveRecommendation(procedure, kind, kind === 'cuidados' ? 'recomendaciones_post' : 'recomendaciones_revision', isEmpty)

  test('página vinculada publicada => se muestra la página (aunque haya histórico)', () => {
    const r = resolve({ recomendaciones: { cuidados: { fuente: 'pagina', paginaSlug: 'cuidado-x' } }, recomendaciones_post: '<p>viejo</p>' })
    assert.deepEqual(r, { type: 'page', slug: 'cuidado-x' })
  })
  test('página vinculada despublicada => nada, y NO reaparece el histórico', () => {
    const r = resolve({ recomendaciones: { cuidados: { fuente: 'pagina_oculta', paginaSlug: null } }, recomendaciones_post: '<p>viejo</p>' })
    assert.deepEqual(r, { type: 'none', reason: 'hidden' })
  })
  test('página inexistente + histórico disponible => histórico', () => {
    const r = resolve({ recomendaciones: { cuidados: { fuente: 'historico', paginaSlug: null } }, recomendaciones_post: '<p>viejo</p>' })
    assert.deepEqual(r, { type: 'historic', html: '<p>viejo</p>' })
  })
  test('ni página ni histórico => nada', () => {
    assert.deepEqual(resolve({ recomendaciones: { cuidados: { fuente: 'ninguna', paginaSlug: null } } }), { type: 'none', reason: 'empty' })
    assert.deepEqual(resolve({ recomendaciones: { cuidados: { fuente: 'historico', paginaSlug: null } }, recomendaciones_post: '<p> </p>' }), { type: 'none', reason: 'empty' })
  })
  test('tipos independientes: revisión no se ve afectada por la página de cuidados', () => {
    const p = { recomendaciones: { cuidados: { fuente: 'pagina_oculta', paginaSlug: null }, revision: { fuente: 'historico', paginaSlug: null } }, recomendaciones_revision: '<p>rev</p>' }
    assert.equal(resolve(p, 'cuidados').type, 'none')
    assert.deepEqual(resolve(p, 'revision'), { type: 'historic', html: '<p>rev</p>' })
  })
  test('compatibilidad con un Hub anterior (sin `recomendaciones`) y con valores desconocidos: comportamiento previo', () => {
    assert.deepEqual(resolve({ recomendaciones_post: '<p>viejo</p>' }), { type: 'historic', html: '<p>viejo</p>' })
    assert.deepEqual(resolve({}), { type: 'none', reason: 'empty' })
    assert.equal(fromRecommendationSources({ cuidados: { fuente: 'rara' } }), undefined)
    assert.equal(fromRecommendationSources(null), undefined)
    assert.deepEqual(fromRecommendationSources({ cuidados: { fuente: 'pagina', pagina_slug: 'x' }, revision: { fuente: 'pagina_oculta', pagina_slug: 'ignorado' } }), { cuidados: { fuente: 'pagina', paginaSlug: 'x' }, revision: { fuente: 'pagina_oculta', paginaSlug: null } })
  })
  test('el mapeo del procedimiento público conserva la fuente en lista y detalle', () => {
    const raw = { cuidados: { fuente: 'pagina', pagina_slug: 'cuidado-x' }, revision: { fuente: 'historico', pagina_slug: null } }
    assert.equal(api.proc.fromPublicListItem({ slug: 'a', nombre: 'A', recomendaciones: raw }).recomendaciones.cuidados.paginaSlug, 'cuidado-x')
    assert.equal(api.proc.fromPublicDetail({ slug: 'a', nombre: 'A', recomendaciones: raw, recomendaciones_post: null }).recomendaciones.revision.fuente, 'historico')
    assert.equal(api.proc.fromPublicDetail({ slug: 'a', nombre: 'A' }).recomendaciones, undefined)
  })
  test('menú: una página vinculada no se repite aparte; el procedimiento con página oculta (indicador falso) no aparece', () => {
    const menus = buildMenus({
      visibility: { videos: true, beforeAfter: true },
      pages: [{ slug: 'cuidado-x', group: 'cuidados', menuLabel: 'Cuidado X', procedureSlug: 'lipo' }, { slug: 'dieta', group: 'cuidados', menuLabel: 'Dieta', procedureSlug: null }],
      procedures: [{ slug: 'lipo', name: 'Lipo', tiene_recomendaciones_post: true }, { slug: 'rino', name: 'Rino', tiene_recomendaciones_post: false }]
    }, RECOMMENDATION_KINDS)
    const cuidados = menus.find(m => m.label === 'RECOMENDACIONES').items[0]
    assert.deepEqual(cuidados.children.map(c => c.to), ['/recomendaciones/cuidados/lipo', '/recomendaciones/dieta'])
  })
  test('la página de recomendación por procedimiento aplica la regla y no escribe', () => {
    const s = code('components/recommendations/ProcedureRecommendation.vue')
    assert.match(s, /resolveRecommendation\(procedure as any, props\.kind, meta\.field, isRichHtmlEmpty\)/)
    assert.equal(/\$fetch|method:\s*['"](POST|PUT|PATCH|DELETE)/i.test(s), false)
    assert.ok(s.indexOf('statusCode: 503') < s.indexOf('statusCode: 404'))
  })
})

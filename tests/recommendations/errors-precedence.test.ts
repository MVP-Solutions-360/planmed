// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// (1) Semántica de errores de las rutas públicas y páginas de detalle: inexistente => 404; Hub caído/timeout/5xx/401/403 => 503.
// (2) Regla de precedencia de Recomendaciones (ver documentacion/maestra/04, §2.1): se prueba el contrato actual.
import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { FakeHub, HUB_TOKEN, ROOT, makeEvent, run, setup } from './harness.ts'

const hub = new FakeHub()
let api
before(async () => { api = await setup(hub) })
const fresh = () => { hub.calls = []; hub.rules = []; hub.token = HUB_TOKEN }
const src = rel => readFileSync(join(ROOT, rel), 'utf8')
const code = rel => src(rel).replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1')

describe('semántica de errores — rutas Nitro públicas', () => {
  const routes = [
    ['server/api/public/procedures/[slug].get.ts', '/v1/web/cirugias/x'],
    ['server/api/public/news/[slug].get.ts', '/v1/web/posts/x'],
    ['server/api/public/recommendations/[slug].get.ts', '/v1/web/recommendation-pages/x']
  ]
  for (const [rel, path] of routes) {
    test(`${rel}: 404 de Hub => 404; caída/5xx/401/403/tenant => 503`, async () => {
      const handler = await api.handler(rel)
      fresh(); hub.on('GET', path, 404, { message: 'No query results for model' })
      assert.equal((await run(handler, makeEvent({ params: { slug: 'x' } }))).error.statusCode, 404)
      for (const status of [0, 500, 502, 503, 401, 403]) {
        fresh(); hub.on('GET', path, status, { message: 'x' })
        const { error } = await run(handler, makeEvent({ params: { slug: 'x' } }))
        assert.equal(error.statusCode, 503, `status de Hub ${status}`)
      }
      fresh(); hub.on('GET', path, 404, { message: 'Tenant Linea not found or inactive' })
      assert.equal((await run(handler, makeEvent({ params: { slug: 'x' } }))).error.statusCode, 503)
    })
  }

  test('las listas públicas responden 503 si Hub falla (no una lista vacía engañosa en el servidor)', async () => {
    for (const rel of ['server/api/public/procedures/index.get.ts', 'server/api/public/news/index.get.ts', 'server/api/public/recommendations/index.get.ts']) {
      fresh()
      assert.equal((await run(await api.handler(rel), makeEvent())).error.statusCode, 503, rel)
    }
  })
})

describe('semántica de errores — páginas de detalle (SSR)', () => {
  test('cada página de detalle evalúa el error ANTES del 404: Hub caído no se disfraza de "no existe"', () => {
    for (const rel of ['pages/procedimientos/[slug].vue', 'pages/noticias/[slug].vue', 'pages/recomendaciones/[slug].vue', 'components/recommendations/ProcedureRecommendation.vue']) {
      const s = code(rel)
      assert.match(s, /const \{ data(: \w+)?, error \} = await useAsyncData/, rel)
      assert.match(s, /if \(error\.value\) \{\s*throw createError\(\{\s*statusCode: 503/, rel)
      assert.ok(s.indexOf('statusCode: 503') < s.indexOf('statusCode: 404'), `${rel}: 503 antes que 404`)
      assert.match(s, /fatal: true/, rel)
    }
  })

  test('los proveedores públicos solo convierten el 404 en null; cualquier otro error se propaga', () => {
    for (const rel of ['providers/HubPublicProcedureProvider.ts', 'providers/HubPublicNewsProvider.ts', 'providers/HubPublicRecommendationsProvider.ts']) {
      assert.match(code(rel), /=== 404\) return null\s*\n\s*throw e/, rel)
    }
  })
})

describe('precedencia de Recomendaciones (regla vigente)', () => {
  test('R1: /recomendaciones/<slug> lee SOLO recommendation_pages; jamás consulta cirugías (sin fallback histórico)', () => {
    assert.equal(/publicProcedureService|getProcedure|recomendaciones_(post|revision)/.test(code('pages/recomendaciones/[slug].vue')), false)
    const route = code('server/api/public/recommendations/[slug].get.ts')
    assert.equal(/cirugias/.test(route), false)
    assert.match(route, /recommendation-pages/)
  })

  test('R1: página independiente existente pero despublicada => 404 y no se consulta ningún campo histórico', async () => {
    const detail = await api.handler('server/api/public/recommendations/[slug].get.ts')
    fresh()
    hub.on('GET', '/v1/web/recommendation-pages/prequirurgicas', 404, { message: 'No query results' })
    hub.on('GET', /^\/v1\/web\/cirugias/, 200, { data: { slug: 'x', nombre: 'X', recomendaciones_post: '<p>histórico</p>' } })
    const { error } = await run(detail, makeEvent({ params: { slug: 'prequirurgicas' } }))
    assert.equal(error.statusCode, 404)
    assert.deepEqual(hub.calls.map(c => c.path), ['/v1/web/recommendation-pages/prequirurgicas'])
  })

  test('R2: /recomendaciones/{cuidados|revision}/<procedimiento> parte del procedimiento y solo pide una página si el Hub la indica (pagina_slug)', () => {
    const s = code('components/recommendations/ProcedureRecommendation.vue')
    assert.match(s, /publicProcedureService\.getProcedureBySlug/)
    assert.match(s, /resolveRecommendation\(/)
    assert.match(s, /source\.type === 'page' \? await publicRecommendationsService\.getPage\(source\.slug\)/)
    assert.equal(/getPages\(/.test(s), false, 'no lista ni adivina páginas por slug')
  })

  test('R3: el campo histórico sigue siendo compatible (texto o lista) y la lectura no escribe', async () => {
    assert.equal(api.proc.fromPublicDetail({ slug: 'a', nombre: 'A', recomendaciones_post: ['Reposo', 'Hidratación'] }).recomendaciones_post, '<ul><li>Reposo</li><li>Hidratación</li></ul>')
    assert.equal(api.proc.fromPublicDetail({ slug: 'a', nombre: 'A', recomendaciones_post: '<p>Texto</p>' }).recomendaciones_post, '<p>Texto</p>')
    const detail = await api.handler('server/api/public/procedures/[slug].get.ts')
    fresh(); hub.on('GET', '/v1/web/cirugias/a', 200, { data: { slug: 'a', nombre: 'A', recomendaciones_post: ['Reposo'] } })
    await run(detail, makeEvent({ params: { slug: 'a' } }))
    assert.ok(hub.calls.length > 0 && hub.calls.every(c => c.method === 'GET' && c.kind === 'public'))
  })

  test('R3: todas las rutas públicas son GET (ninguna migra ni reescribe datos históricos)', () => {
    for (const f of readdirSync(join(ROOT, 'server/api/public'), { recursive: true }).filter(f => /\.ts$/.test(f))) assert.match(f, /\.get\.ts$/, f)
  })

  test('R4: el vínculo página↔procedimiento existe en el contrato (cirugia_slug) y Planmed lo mapea', () => {
    assert.match(code('types/recommendations.ts'), /procedureSlug/)
    assert.match(code('server/utils/recommendations.ts'), /procedureSlug: orNull\(d\.cirugia_slug\)/)
  })
})

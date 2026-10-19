// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Integración de SOLO LECTURA contra un Wellezy Hub real (el local). No crea, edita, publica ni elimina nada.
//
// Se omite por completo salvo que el entorno indique el Hub (misma variable que usa la aplicación; nunca hay una URL escrita aquí):
//   NUXT_WELLEZY_API_BASE_URL=<url del Hub local>/api  NUXT_WELLEZY_LINE_SLUG=planmed  npm test
// Ejecuta los handlers REALES de Nitro (server/api/public/**) y los mapeos reales, pero con respuestas reales del Hub en lugar de las
// simuladas del resto de pruebas: comprueba que el contrato que consume Planmed existe de verdad.
import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { FakeHub, makeEvent, run, setup } from '../recommendations/harness.ts'

const BASE = String(process.env.NUXT_WELLEZY_API_BASE_URL || '').replace(/\/+$/, '')
const LINE = process.env.NUXT_WELLEZY_LINE_SLUG || 'planmed'

async function hubGet(path: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', ...headers }, signal: AbortSignal.timeout(10_000) })
  let data: any
  try { data = await res.json() } catch { data = undefined }
  return { status: res.status, data }
}

let reachable = false
let api: Awaited<ReturnType<typeof setup>>

before(async () => {
  if (!BASE) return
  try { reachable = (await hubGet('/v1/web/recommendation-pages', { 'X-Tenant-Linea': LINE })).status > 0 } catch { reachable = false }
  if (!reachable) return
  api = await setup(new FakeHub())
  // Misma llamada pública que hace Planmed (wellezyPublicGet), pero contra el Hub real y con el tenant de la configuración.
  globalThis.wellezyPublicGet = async (_event: any, path: string) => hubGet(path, { 'X-Tenant-Linea': LINE })
})

const skipReason = () => (!BASE ? 'NUXT_WELLEZY_API_BASE_URL no está definida' : !reachable ? 'el Hub no responde' : false)

describe('Hub real (solo lectura): contrato público de recomendaciones', () => {
  test('el menú público responde 200 con una lista y el handler de Nitro la mapea', async (t) => {
    if (skipReason()) return t.skip(skipReason())
    const handler = await api.handler('server/api/public/recommendations/index.get.ts')
    const { value, error } = await run(handler, makeEvent())
    assert.equal(error, undefined, error?.message)
    assert.equal(Array.isArray(value), true)
    for (const p of value) {
      assert.equal(typeof p.slug, 'string')
      assert.ok(['general', 'cuidados', 'revision'].includes(p.group), `grupo inesperado: ${p.group}`)
      assert.equal(p.published, true) // el Hub solo entrega publicadas
      assert.equal('content' in p && p.content !== '', false, 'el listado no debe traer contenido')
    }
  })

  test('el detalle de una página inexistente/no publicada es un 404 real (no se revela si existe)', async (t) => {
    if (skipReason()) return t.skip(skipReason())
    const res = await hubGet('/v1/web/recommendation-pages/esta-pagina-no-existe-xyz', { 'X-Tenant-Linea': LINE })
    assert.equal(res.status, 404)
    const handler = await api.handler('server/api/public/recommendations/[slug].get.ts')
    const { error } = await run(handler, makeEvent({ params: { slug: 'esta-pagina-no-existe-xyz' } }))
    assert.equal(error?.statusCode, 404)
  })

  test('la lista de procedimientos trae la fuente efectiva por tipo con los valores que Planmed entiende', async (t) => {
    if (skipReason()) return t.skip(skipReason())
    const handler = await api.handler('server/api/public/procedures/index.get.ts')
    const { value, error } = await run(handler, makeEvent())
    assert.equal(error, undefined, error?.message)
    assert.equal(Array.isArray(value), true)
    for (const proc of value) {
      assert.ok(proc.recomendaciones, `${proc.slug}: falta \`recomendaciones\` (sin ella Planmed no puede resolver la fuente)`)
      for (const kind of ['cuidados', 'revision']) {
        const s = proc.recomendaciones[kind]
        assert.ok(s && ['pagina', 'pagina_oculta', 'historico', 'ninguna'].includes(s.fuente), `${proc.slug}/${kind}: fuente inesperada`)
        assert.equal(s.fuente === 'pagina' ? typeof s.paginaSlug === 'string' : s.paginaSlug === null, true, `${proc.slug}/${kind}: paginaSlug incoherente con la fuente`)
      }
      // El indicador de la lista debe ser coherente con la fuente: solo hay algo que mostrar con página publicada o histórico.
      for (const [kind, flag] of [['cuidados', 'tiene_recomendaciones_post'], ['revision', 'tiene_recomendaciones_revision']]) {
        const fuente = proc.recomendaciones[kind].fuente
        assert.equal(proc[flag], fuente === 'pagina' || fuente === 'historico', `${proc.slug}/${kind}: indicador incoherente con la fuente`)
      }
    }
  })
})

describe('Hub real (solo lectura): aislamiento y autorización', () => {
  test('sin tenant o con un tenant inexistente el Hub responde 404 (no entrega contenido de otra línea)', async (t) => {
    if (skipReason()) return t.skip(skipReason())
    assert.equal((await hubGet('/v1/web/recommendation-pages')).status, 404)
    assert.equal((await hubGet('/v1/web/recommendation-pages', { 'X-Tenant-Linea': 'linea-que-no-existe-xyz' })).status, 404)
  })

  test('la API administrativa exige autenticación (401 sin token, sin intentar eludirla)', async (t) => {
    if (skipReason()) return t.skip(skipReason())
    for (const path of ['/cms/recommendation-pages', '/cms/procedures']) assert.equal((await hubGet(path)).status, 401, path)
  })

  test('el cuerpo público no incluye identificadores de empresa/línea', async (t) => {
    if (skipReason()) return t.skip(skipReason())
    const res = await hubGet('/v1/web/recommendation-pages', { 'X-Tenant-Linea': LINE })
    assert.equal(res.status, 200)
    for (const row of res.data.data) assert.equal(Object.keys(row).some(k => /company_id|linea_id/.test(k)), false)
  })
})

describe('Hub real (solo lectura): árbol de recomendaciones (tema → subtemas → secciones → recomendaciones)', () => {
  const topicsHandler = () => api.handler('server/api/public/recommendation-topics/index.get.ts')
  const subtopicHandler = () => api.handler('server/api/public/recommendation-topics/[topic]/[subtopic].get.ts')

  test('el menú responde 200, los temas traen subtemas y ningún tema queda vacío ni repetido', async (t) => {
    if (skipReason()) return t.skip(skipReason())
    const { value, error } = await run(await topicsHandler(), makeEvent())
    assert.equal(error, undefined, error?.message)
    assert.equal(Array.isArray(value), true)
    const seen = new Set<string>()
    for (const topic of value) {
      assert.equal(typeof topic.slug, 'string')
      assert.ok(topic.subtopics.length > 0, `${topic.slug}: un tema sin subtemas publicados no debe llegar`)
      for (const sub of topic.subtopics) {
        assert.equal(seen.has(sub.slug), false, `${sub.slug}: subtema repetido`)
        seen.add(sub.slug)
      }
    }
    assert.equal(JSON.stringify(value).includes('company_id') || JSON.stringify(value).includes('linea_id'), false)
  })

  test('el detalle de cada subtema del menú cumple el contrato y pertenece a su tema', async (t) => {
    if (skipReason()) return t.skip(skipReason())
    const { value: topics } = await run(await topicsHandler(), makeEvent())
    for (const topic of topics) for (const sub of topic.subtopics) {
      const { value, error } = await run(await subtopicHandler(), makeEvent({ params: { topic: topic.slug, subtopic: sub.slug } }))
      assert.equal(error, undefined, `${topic.slug}/${sub.slug}: ${error?.message}`)
      assert.equal(value.slug, sub.slug)
      assert.equal(value.topic.slug, topic.slug)
      assert.equal(typeof value.intro.content, 'string')
      assert.equal(Array.isArray(value.sections), true)
      for (const s of value.sections) {
        assert.ok(['description', 'recommendations', 'callout', 'contact', 'custom'].includes(s.type), `tipo inesperado: ${s.type}`)
        assert.equal(Array.isArray(s.items), true)
        if (s.cta) assert.equal(typeof s.cta.url === 'string' && /^(https:|mailto:|tel:|\/)/.test(s.cta.url), true, 'destino de botón fuera de contrato')
      }
    }
  })

  test('un subtema inexistente, o pedido bajo otro tema, es un 404 real', async (t) => {
    if (skipReason()) return t.skip(skipReason())
    const { value: topics } = await run(await topicsHandler(), makeEvent())
    const res = await hubGet('/v1/web/recommendation-topics/tema-que-no-existe-xyz/subtema-xyz', { 'X-Tenant-Linea': LINE })
    assert.equal(res.status, 404)
    const { error } = await run(await subtopicHandler(), makeEvent({ params: { topic: 'tema-que-no-existe-xyz', subtopic: 'subtema-xyz' } }))
    assert.equal(error?.statusCode, 404)
    if (topics.length >= 2) {
      const { error: cross } = await run(await subtopicHandler(), makeEvent({ params: { topic: topics[0].slug, subtopic: topics[1].subtopics[0].slug } }))
      assert.equal(cross?.statusCode, 404, 'un subtema no se resuelve bajo un tema ajeno')
    }
  })

  test('sin tenant, el árbol responde 404 (no entrega contenido de otra línea)', async (t) => {
    if (skipReason()) return t.skip(skipReason())
    assert.equal((await hubGet('/v1/web/recommendation-topics')).status, 404)
    assert.equal((await hubGet('/v1/web/recommendation-topics', { 'X-Tenant-Linea': 'linea-que-no-existe-xyz' })).status, 404)
  })
})

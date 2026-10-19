// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Rutas de Nitro del árbol de Recomendaciones (server/api/public/recommendation-topics/**) contra un Wellezy Hub FALSO (sin red ni
// base de datos): mapeo del contrato, 404, 503 con su causa y proveedor de lectura.
import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { FakeHub, makeEvent, run, setup } from './harness.ts'
import { HubPublicRecommendationsProvider } from '../../providers/HubPublicRecommendationsProvider.ts'

const hub = new FakeHub()
let list
let detail

before(async () => {
  const api = await setup(hub)
  list = await api.handler('server/api/public/recommendation-topics/index.get.ts')
  detail = await api.handler('server/api/public/recommendation-topics/[topic]/[subtopic].get.ts')
})

const fresh = () => { hub.calls = []; hub.rules = [] }
const sub = (slug, over = {}) => ({ slug, grupo: 'cuidados', menu_label: `Menú ${slug}`, title: `Título ${slug}`, orden: 1, path: null, short_url: null, ...over })
const hubTopic = (slug, subtopics) => ({ slug, menu_label: `Tema ${slug}`, title: `Título ${slug}`, orden: 1, path: null, subtopics })
const hubPage = (over = {}) => ({
  ...sub('abdominoplastia'),
  topic: { slug: 'cuidados', title: 'Cuidados', menu_label: 'Cuidados' },
  intro: { content: '<p>Intro</p>', image: null, video: null },
  sections: [{ type: 'callout', orden: 1, title: 'Financia', subtitle: null, content: '<p>x</p>', layout: 'stacked', image: null, video: null, cta: { label: 'Pagar', url: 'https://pagos.example.com' }, items: [] }],
  ...over
})
const ev = (topic, subtopic) => makeEvent({ params: { topic, subtopic } })

describe('GET /api/public/recommendation-topics (menú)', () => {
  test('consulta solo la API pública del Hub y devuelve el árbol mapeado, en el orden recibido', async () => {
    fresh()
    hub.on('GET', '/v1/web/recommendation-topics', 200, { data: [hubTopic('uno', [sub('a'), sub('b')]), hubTopic('dos', [sub('c')])] })
    const { value } = await run(list, makeEvent())
    assert.deepEqual(value.map(t => [t.slug, t.subtopics.map(s => s.slug)]), [['uno', ['a', 'b']], ['dos', ['c']]])
    assert.deepEqual(hub.calls.map(c => [c.kind, c.method, c.path]), [['public', 'GET', '/v1/web/recommendation-topics']])
  })

  test('una lista vacía es válida: 200 con []', async () => {
    fresh()
    hub.on('GET', '/v1/web/recommendation-topics', 200, { data: [] })
    assert.deepEqual((await run(list, makeEvent())).value, [])
  })

  test('temas sin subtemas publicados no llegan al navegador', async () => {
    fresh()
    hub.on('GET', '/v1/web/recommendation-topics', 200, { data: [hubTopic('vacio', []), hubTopic('bien', [sub('a')])] })
    assert.deepEqual((await run(list, makeEvent())).value.map(t => t.slug), ['bien'])
  })

  test('Hub caído, tenant sin resolver, acceso rechazado o cuerpo fuera de contrato: 503 con su causa (no una lista vacía)', async () => {
    const cases = [
      [0, undefined, 'hub_unavailable'],
      [500, { message: 'x' }, 'hub_unavailable'],
      [404, { message: 'Tenant not found' }, 'tenant'],
      [403, { message: 'no' }, 'rejected'],
      [200, { data: 'no es una lista' }, 'invalid_response']
    ]
    for (const [status, data, reason] of cases) {
      fresh()
      hub.on('GET', '/v1/web/recommendation-topics', status, data)
      const { error } = await run(list, makeEvent())
      assert.equal(error?.statusCode, 503, reason)
      assert.equal(error?.data?.reason, reason)
    }
  })
})

describe('GET /api/public/recommendation-topics/{topic}/{subtopic}', () => {
  test('pide el subtema exacto y devuelve el modelo de Planmed (secciones, botón y datos editoriales)', async () => {
    fresh()
    hub.on('GET', '/v1/web/recommendation-topics/cuidados/abdominoplastia', 200, { data: hubPage() })
    const { value } = await run(detail, ev('cuidados', 'abdominoplastia'))
    assert.equal(hub.last().path, '/v1/web/recommendation-topics/cuidados/abdominoplastia')
    assert.equal(value.slug, 'abdominoplastia')
    assert.equal(value.topic.slug, 'cuidados')
    assert.equal(value.intro.content, '<p>Intro</p>')
    assert.deepEqual(value.sections[0].cta, { label: 'Pagar', url: 'https://pagos.example.com' })
  })

  test('404 del Hub (no existe, no publicado, de otra línea o de otro tema) => 404 real', async () => {
    fresh()
    hub.on('GET', '/v1/web/recommendation-topics/cuidados/no-existe', 404, { message: 'No query results for model' })
    const { error } = await run(detail, ev('cuidados', 'no-existe'))
    assert.equal(error?.statusCode, 404)
  })

  test('slugs con formato inválido => 404 sin llamar al Hub', async () => {
    for (const [topic, subtopic] of [['../x', 'a'], ['a', 'A B'], ['', 'a'], ['a', ''], ['a', 'x'.repeat(130)]]) {
      fresh()
      const { error } = await run(detail, ev(topic, subtopic))
      assert.equal(error?.statusCode, 404, `${topic}/${subtopic}`)
      assert.equal(hub.calls.length, 0)
    }
  })

  test('fallos del Hub => 503 (reintentable), nunca «no existe»', async () => {
    const cases = [[0, undefined, 'hub_unavailable'], [502, {}, 'hub_unavailable'], [404, { message: 'Tenant not found' }, 'tenant'], [401, {}, 'rejected']]
    for (const [status, data, reason] of cases) {
      fresh()
      hub.on('GET', '/v1/web/recommendation-topics/cuidados/abdominoplastia', status, data)
      const { error } = await run(detail, ev('cuidados', 'abdominoplastia'))
      assert.equal(error?.statusCode, 503, reason)
      assert.equal(error?.data?.reason, reason)
    }
  })

  test('respuesta fuera de contrato o que no corresponde a lo pedido => 503 (no se muestra bajo otra URL)', async () => {
    for (const data of [{ data: {} }, { data: hubPage({ topic: null }) }, { data: hubPage({ slug: 'otra-pagina' }) }, { data: hubPage({ topic: { slug: 'otro-tema', title: 'x' } }) }]) {
      fresh()
      hub.on('GET', '/v1/web/recommendation-topics/cuidados/abdominoplastia', 200, data)
      const { error } = await run(detail, ev('cuidados', 'abdominoplastia'))
      assert.equal(error?.statusCode, 503)
      assert.equal(error?.data?.reason, 'invalid_response')
    }
  })

  test('destinos inseguros del Hub no llegan al navegador (imagen, vídeo y botón)', async () => {
    fresh()
    hub.on('GET', '/v1/web/recommendation-topics/cuidados/abdominoplastia', 200, { data: hubPage({
      intro: { content: '', image: { url: 'javascript:alert(1)', alt: null }, video: { embed_url: 'https://evil.example.com/embed/abcdefghijk' } },
      sections: [{ type: 'contact', orden: 1, title: 'C', subtitle: null, content: '<p>x</p>', layout: 'stacked', image: { url: 'data:image/png;base64,AAAA' }, video: null, cta: { label: 'Ir', url: 'javascript:alert(1)' }, items: [] }]
    }) })
    const { value } = await run(detail, ev('cuidados', 'abdominoplastia'))
    assert.equal(value.intro.image, null)
    assert.equal(value.intro.video, null)
    assert.equal(value.sections[0].image, null)
    assert.equal(value.sections[0].cta, null)
    assert.equal(JSON.stringify(value).includes('javascript:'), false)
  })
})

describe('HubPublicRecommendationsProvider: árbol e histórico', () => {
  const fetcher = (handler) => {
    const calls = []
    return { calls, fn: async (url, options) => { calls.push(url); const out = handler(url, options); if (out instanceof Error) throw out; return out } }
  }
  const httpError = (statusCode) => Object.assign(new Error('fetch failed'), { statusCode })

  test('lee de las rutas internas de Nitro, nunca de Hub directamente', async () => {
    const f = fetcher(() => [])
    const provider = new HubPublicRecommendationsProvider(f.fn)
    await provider.getTopics()
    await provider.getSubtopic('tema', 'sub')
    await provider.getPages()
    await provider.getPage('pagina')
    assert.deepEqual(f.calls, ['/api/public/recommendation-topics', '/api/public/recommendation-topics/tema/sub', '/api/public/recommendations', '/api/public/recommendations/pagina'])
  })

  test('getSubtopic: 404 => null; otros errores se propagan (no se confunden con «no existe»)', async () => {
    assert.equal(await new HubPublicRecommendationsProvider(fetcher(() => httpError(404)).fn).getSubtopic('a', 'b'), null)
    await assert.rejects(() => new HubPublicRecommendationsProvider(fetcher(() => httpError(503)).fn).getSubtopic('a', 'b'), { statusCode: 503 })
  })

  test('los slugs se codifican en la URL', async () => {
    const f = fetcher(() => null)
    await new HubPublicRecommendationsProvider(f.fn).getSubtopic('a b', 'c/d')
    assert.equal(f.calls[0], '/api/public/recommendation-topics/a%20b/c%2Fd')
  })
})

// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Panel administrativo de la jerarquía de Recomendaciones: tabla de rutas permitidas, proxy de Nitro contra un Hub FALSO (sin red ni base de
// datos: autenticación, filtrado de campos, errores 401/403/404/409/422/5xx), proveedor del navegador y comprobaciones estáticas de las pantallas.
// NO sustituyen la validación en navegador contra el Hub real (ver informe).
import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { FakeHub, makeEvent, run, setup, ROOT, PNG } from './harness.ts'
import { resolveAdminRoute, pickAllowed, pickQuery, describeTreeError, moveId } from '../../shared/utils/recommendationAdminApi.ts'
import { HubRecommendationTreeAdminProvider } from '../../providers/HubRecommendationTreeAdminProvider.ts'

const read = rel => readFileSync(join(ROOT, rel), 'utf8')

// ───────────────────────── Tabla de rutas permitidas ─────────────────────────

describe('resolveAdminRoute: solo las rutas administrativas del contrato real de Hub', () => {
  const cases = [
    ['GET', 'section-types', '/recommendation-section-types'],
    ['GET', 'topics', '/recommendation-topics'],
    ['POST', 'topics', '/recommendation-topics'],
    ['POST', 'topics/reorder', '/recommendation-topics/reorder'],
    ['PUT', 'topics/4', '/recommendation-topics/4'],
    ['DELETE', 'topics/4', '/recommendation-topics/4'],
    ['GET', 'topics/4/subtopics', '/recommendation-topics/4/subtopics'],
    ['POST', 'topics/4/subtopics', '/recommendation-topics/4/subtopics'],
    ['POST', 'topics/4/subtopics/reorder', '/recommendation-topics/4/subtopics/reorder'],
    ['GET', 'subtopics/9', '/recommendation-subtopics/9'],
    ['PUT', 'subtopics/9', '/recommendation-subtopics/9'],
    ['DELETE', 'subtopics/9', '/recommendation-subtopics/9'],
    ['GET', 'subtopics/9/intro', '/recommendation-subtopics/9/intro'],
    ['PUT', 'subtopics/9/intro', '/recommendation-subtopics/9/intro'],
    ['POST', 'subtopics/9/intro/image', '/recommendation-subtopics/9/intro/image'],
    ['DELETE', 'subtopics/9/intro/image', '/recommendation-subtopics/9/intro/image'],
    ['GET', 'subtopics/9/short-link', '/recommendation-subtopics/9/short-link'],
    ['GET', 'subtopics/9/sections', '/recommendation-subtopics/9/sections'],
    ['POST', 'subtopics/9/sections', '/recommendation-subtopics/9/sections'],
    ['POST', 'subtopics/9/sections/reorder', '/recommendation-subtopics/9/sections/reorder'],
    ['GET', 'sections/12', '/recommendation-sections/12'],
    ['PUT', 'sections/12', '/recommendation-sections/12'],
    ['DELETE', 'sections/12', '/recommendation-sections/12'],
    ['POST', 'sections/12/image', '/recommendation-sections/12/image'],
    ['DELETE', 'sections/12/image', '/recommendation-sections/12/image'],
    ['GET', 'sections/12/items', '/recommendation-sections/12/items'],
    ['POST', 'sections/12/items', '/recommendation-sections/12/items'],
    ['POST', 'sections/12/items/reorder', '/recommendation-sections/12/items/reorder'],
    ['GET', 'items/30', '/recommendation-items/30'],
    ['PUT', 'items/30', '/recommendation-items/30'],
    ['DELETE', 'items/30', '/recommendation-items/30']
  ]
  for (const [method, path, hub] of cases) {
    test(`${method} ${path} → Hub ${hub}`, () => {
      assert.equal(resolveAdminRoute(method, path.split('/'))?.hubPath, hub)
    })
  }

  test('rechaza lo que no existe en el contrato: métodos, rutas extra, ids no numéricos y recorridos de ruta', () => {
    const bad = [
      ['DELETE', 'topics'], ['PATCH', 'topics/4'], ['GET', 'topics/reorder'], ['POST', 'topics/4'], ['GET', 'topics/abc'], ['GET', 'topics/0'],
      ['GET', 'topics/4/extra'], ['GET', 'topics/-1'], ['GET', 'topics/1e3'], ['GET', 'topics/..'], ['GET', 'topics/4%2F5'], ['PUT', 'topics/4/subtopics'],
      ['POST', 'subtopics/9'], ['PUT', 'subtopics/9/short-link'], ['DELETE', 'topics/4/subtopics/reorder'], ['GET', ''], ['GET', 'recommendation-pages'],
      ['GET', 'v1/web/recommendation-topics'], ['POST', 'items/30/image'], ['GET', 'topics/12345678901']
    ]
    for (const [method, path] of bad) assert.equal(resolveAdminRoute(method, path.split('/')), null, `${method} ${path}`)
  })

  test('el padre de una creación sale SOLO de la URL: el cuerpo de un subtema/sección/recomendación nunca puede cambiarlo', () => {
    const body = { title: 'T', topic_id: 99, company_id: 7, linea_id: 8, created_by: 1, recommendation_section_id: 5, recommendation_page_id: 6 }
    for (const [method, path] of [['POST', 'topics/4/subtopics'], ['POST', 'subtopics/9/sections'], ['POST', 'sections/12/items'], ['POST', 'topics']]) {
      const out = pickAllowed(body, resolveAdminRoute(method, path.split('/')).body)
      for (const forbidden of ['topic_id', 'company_id', 'linea_id', 'created_by', 'recommendation_section_id', 'recommendation_page_id']) assert.equal(forbidden in out, false, `${path}: ${forbidden}`)
    }
  })

  test('pickAllowed y pickQuery filtran y toleran cuerpos inválidos', () => {
    assert.deepEqual(pickAllowed({ title: 'a', x: 1 }, ['title']), { title: 'a' })
    assert.deepEqual(pickAllowed(null, ['title']), {})
    assert.deepEqual(pickAllowed([1], ['title']), {})
    assert.deepEqual(pickQuery({ published: '1', x: 'y' }, ['published']), { published: '1' })
    assert.deepEqual(pickQuery({ published: 'zzz' }, ['published']), {})
    assert.deepEqual(pickQuery({ published: '1' }, []), {})
  })

  test('la edición de un subtema solo admite sus campos de organización; la introducción va por su propia ruta', () => {
    const put = resolveAdminRoute('PUT', ['subtopics', '9'])
    assert.equal(put.body.includes('content'), false)
    assert.equal(put.body.includes('video_url'), false)
    assert.deepEqual(resolveAdminRoute('PUT', ['subtopics', '9', 'intro']).body, ['content', 'video_url'])
  })
})

describe('describeTreeError y moveId', () => {
  const err = (statusCode, message, fieldErrors) => ({ statusCode, message, fieldErrors })
  test('401, 403, 404, 409 y 422 se distinguen y 5xx/sin respuesta son transitorios', () => {
    assert.equal(describeTreeError(err(401)).kind, 'auth')
    assert.equal(describeTreeError(err(403, 'No tienes permiso para publicar contenido.')).message, 'No tienes permiso para publicar contenido.')
    assert.equal(describeTreeError(err(404)).kind, 'notfound')
    assert.equal(describeTreeError(err(409, 'El tema tiene subtemas')).kind, 'conflict')
    assert.equal(describeTreeError(err(409, 'El tema tiene subtemas')).message, 'El tema tiene subtemas')
    for (const status of [500, 503, 0, null, undefined, 429]) {
      const e = describeTreeError(err(status, 'x'))
      assert.equal(e.kind, 'transient', String(status))
      assert.equal(e.transient, true)
    }
    assert.equal(describeTreeError(err(422)).transient, false)
  })
  test('los errores de validación se asocian al campo (ids.0 → ids) con el primer mensaje', () => {
    const e = describeTreeError(err(422, 'x', { 'cta_url': ['Falta el destino del botón.', 'otro'], 'ids.0': ['dup'], title: 'texto' }))
    assert.deepEqual(e.fields, { cta_url: 'Falta el destino del botón.', ids: 'dup', title: 'texto' })
  })
  test('moveId intercambia con la vecina y rechaza los extremos', () => {
    assert.deepEqual(moveId([1, 2, 3], 1, -1), [2, 1, 3])
    assert.deepEqual(moveId([1, 2, 3], 1, 1), [1, 3, 2])
    assert.equal(moveId([1, 2, 3], 0, -1), null)
    assert.equal(moveId([1, 2, 3], 2, 1), null)
    assert.equal(moveId([], 0, 1), null)
  })
})

// ───────────────────────── Proxy de Nitro contra un Hub falso ─────────────────────────

const hub = new FakeHub()
let handler

before(async () => {
  const api = await setup(hub)
  const util = await import(pathToFileURL(resolve(ROOT, 'server/utils/recommendationAdmin.ts')).href)
  Object.assign(globalThis, util)
  handler = util.handleTreeRequest
  void api
})

const fresh = () => { hub.calls = []; hub.rules = []; hub.token = 'hub-secret-token'; hub.sessionCleared = false }
const ev = (method, path, body, query) => {
  const e = makeEvent({ params: { path }, body, method })
  if (query) globalThis.getQuery = () => query
  else globalThis.getQuery = () => ({})
  return e
}

describe('proxy administrativo /api/admin/recommendation-tree/*', () => {
  test('listar temas: usa el Bearer del servidor y la ruta /cms (nunca la pública) y devuelve la respuesta de Hub', async () => {
    fresh()
    hub.on('GET', '/cms/recommendation-topics', 200, { data: [{ id: 1, title: 'Cuidados', subtopics_count: 2 }] })
    const { value } = await run(handler, ev('GET', 'topics'))
    assert.equal(value.data[0].subtopics_count, 2)
    assert.deepEqual(hub.calls.map(c => [c.kind, c.method, c.path, c.token]), [['json', 'GET', '/cms/recommendation-topics', 'hub-secret-token']])
  })

  test('crear tema: solo los campos permitidos viajan a Hub (company_id y linea_id se descartan)', async () => {
    fresh()
    hub.on('POST', '/cms/recommendation-topics', 201, { data: { id: 5, title: 'Nuevo' } })
    const { value } = await run(handler, ev('POST', 'topics', { title: 'Nuevo', menu_label: 'N', published: false, company_id: 9, linea_id: 9, created_by: 1 }))
    assert.equal(value.data.id, 5)
    assert.deepEqual(hub.last().body, { title: 'Nuevo', menu_label: 'N', published: false })
  })

  test('crear subtema: el tema viaja en la ruta y el cuerpo no puede reasignarlo', async () => {
    fresh()
    hub.on('POST', '/cms/recommendation-topics/4/subtopics', 201, { data: { id: 8, topic_id: 4 } })
    const { value } = await run(handler, ev('POST', 'topics/4/subtopics', { title: 'Sub', grupo: 'cuidados', topic_id: 99, company_id: 1 }))
    assert.equal(value.data.topic_id, 4)
    assert.equal(hub.last().path, '/cms/recommendation-topics/4/subtopics')
    assert.deepEqual(hub.last().body, { title: 'Sub', grupo: 'cuidados' })
  })

  test('editar tema (publicar / ocultar), ordenar y eliminar pegan en las rutas reales de Hub', async () => {
    fresh()
    hub.on('PUT', '/cms/recommendation-topics/4', 200, { data: { id: 4, published: true } })
    hub.on('POST', '/cms/recommendation-topics/reorder', 200, { message: 'Orden actualizado.', data: [{ id: 2, orden: 1 }] })
    hub.on('DELETE', '/cms/recommendation-topics/4', 200, { message: 'Tema eliminado.' })
    assert.equal((await run(handler, ev('PUT', 'topics/4', { published: true }))).value.data.published, true)
    assert.deepEqual((await run(handler, ev('POST', 'topics/reorder', { ids: [2, 4], extra: 1 }))).value.data, [{ id: 2, orden: 1 }])
    assert.deepEqual(hub.last().body, { ids: [2, 4] })
    assert.equal((await run(handler, ev('DELETE', 'topics/4'))).value.message, 'Tema eliminado.')
    assert.deepEqual(hub.calls.map(c => `${c.method} ${c.path}`), ['PUT /cms/recommendation-topics/4', 'POST /cms/recommendation-topics/reorder', 'DELETE /cms/recommendation-topics/4'])
  })

  test('introducción: texto y vídeo por su ruta; la imagen se sube como multipart y el contenido de otros campos no viaja', async () => {
    fresh()
    hub.on('PUT', '/cms/recommendation-subtopics/9/intro', 200, { data: { content: '<p>x</p>', video_url: null, image_url: null } })
    hub.on('POST', '/cms/recommendation-subtopics/9/intro/image', 200, { data: { image_url: 'https://x/a.png' } })
    await run(handler, ev('PUT', 'subtopics/9/intro', { content: '<p>x</p>', video_url: null, title: 'no' }))
    assert.deepEqual(hub.last().body, { content: '<p>x</p>', video_url: null })
    const { value } = await run(handler, ev('POST', 'subtopics/9/intro/image', { image: PNG }))
    assert.equal(value.data.image_url, 'https://x/a.png')
    assert.deepEqual([hub.last().kind, hub.last().path], ['upload', '/cms/recommendation-subtopics/9/intro/image'])
  })

  test('imagen válida → multipart a Hub; imagen inválida (tipo, vacía, enorme) → 422 sin llamar a Hub', async () => {
    fresh()
    hub.on('POST', '/cms/recommendation-sections/12/image', 200, { data: { id: 12, image_url: 'https://x/s.png' } })
    const valid = 'data:image/png;base64,' + Buffer.from('imagen-de-prueba').toString('base64')
    const ok = await run(handler, ev('POST', 'sections/12/image', { image: valid }))
    assert.equal(ok.value.data.image_url, 'https://x/s.png')
    assert.equal(hub.last().kind, 'upload')
    assert.equal(hub.last().form.get('image').type, 'image/png')

    for (const image of ['data:text/html;base64,PGI+', 'data:image/gif;base64,R0lG', '', 'https://x/y.png', 'data:image/png;base64,@@@', undefined]) {
      hub.calls = []
      const { error } = await run(handler, ev('POST', 'sections/12/image', { image }))
      assert.equal(error?.statusCode, 422, String(image))
      assert.equal(hub.calls.length, 0)
    }
  })

  test('filtro published de las listas: solo 0|1', async () => {
    fresh()
    hub.on('GET', '/cms/recommendation-topics', 200, { data: [] })
    await run(handler, ev('GET', 'topics', undefined, { published: '1', x: 'y' }))
    assert.deepEqual(hub.last().query, { published: '1' })
  })

  test('rutas no permitidas → 404 sin llamar a Hub; sin sesión → 401 sin llamar a Hub', async () => {
    fresh()
    for (const [method, path] of [['DELETE', 'topics'], ['GET', 'recommendation-pages'], ['GET', 'topics/x'], ['PATCH', 'topics/1'], ['GET', 'v1/web/recommendation-topics']]) {
      const { error } = await run(handler, ev(method, path))
      assert.equal(error?.statusCode, 404, `${method} ${path}`)
    }
    assert.equal(hub.calls.length, 0)
    hub.token = null
    const { error } = await run(handler, ev('GET', 'topics'))
    assert.equal(error?.statusCode, 401)
    assert.equal(hub.calls.length, 0)
  })

  test('404 de Hub en una ruta de COLECCIÓN (listar, crear, ordenar, catálogo) = Hub sin la API de recomendaciones: 501 claro, no «no pertenece a tu línea»', async () => {
    for (const [method, path, hubPath] of [['GET', 'topics', '/cms/recommendation-topics'], ['POST', 'topics', '/cms/recommendation-topics'], ['POST', 'topics/reorder', '/cms/recommendation-topics/reorder'], ['GET', 'section-types', '/cms/recommendation-section-types']]) {
      fresh()
      hub.on(method, hubPath, 404, { message: 'Not Found.' })
      const { value, error } = await run(handler, ev(method, path, { title: 'x', ids: [1] }))
      assert.equal(value, undefined)
      assert.equal(error.statusCode, 501, `${method} ${path}`)
      assert.match(error.message, /no tiene habilitada la administración de recomendaciones/)
      assert.equal(/pertenece a tu línea/.test(error.message), false)
      assert.equal(hub.calls.length, 1, 'sin reintentos')
    }
    assert.equal(describeTreeError({ statusCode: 501, message: 'm' }).transient, false)
  })

  test('404 en rutas con id (incluida la lista de subtemas de un tema) sigue siendo «no existe o no pertenece a tu línea»: no se oculta ni se vuelve éxito', async () => {
    for (const [method, path, hubPath] of [['GET', 'topics/4/subtopics', '/cms/recommendation-topics/4/subtopics'], ['PUT', 'topics/4', '/cms/recommendation-topics/4'], ['POST', 'topics/4/subtopics', '/cms/recommendation-topics/4/subtopics'], ['DELETE', 'items/7', '/cms/recommendation-items/7']]) {
      fresh()
      hub.on(method, hubPath, 404, { message: 'Not Found.' })
      const { value, error } = await run(handler, ev(method, path, { title: 'x' }))
      assert.equal(value, undefined)
      assert.equal(error.statusCode, 404, `${method} ${path}`)
      assert.match(error.message, /no pertenece a tu línea/)
    }
  })

  test('hasId distingue las rutas de colección de las de registro', () => {
    for (const [m, p] of [['GET', 'topics'], ['POST', 'topics'], ['POST', 'topics/reorder'], ['GET', 'section-types']]) assert.equal(resolveAdminRoute(m, p.split('/')).hasId, false, p)
    for (const [m, p] of [['GET', 'topics/4'], ['GET', 'topics/4/subtopics'], ['POST', 'sections/2/items/reorder']]) assert.equal(resolveAdminRoute(m, p.split('/')).hasId, true, p)
  })

  test('errores de Hub: 401 cierra la sesión; 403 conserva el motivo; 404; 409 conserva el motivo; 422 trae errores por campo', async () => {
    fresh()
    const path = '/cms/recommendation-topics/4'
    hub.on('DELETE', path, 401, { message: 'Unauthenticated.' })
    let { error } = await run(handler, ev('DELETE', 'topics/4'))
    assert.equal(error.statusCode, 401)
    assert.equal(hub.sessionCleared, true)

    fresh()
    hub.on('POST', '/cms/recommendation-topics', 403, { message: 'No tienes permiso para publicar contenido.' })
    ;({ error } = await run(handler, ev('POST', 'topics', { title: 'x', published: true })))
    assert.equal(error.statusCode, 403)
    assert.equal(error.message, 'No tienes permiso para publicar contenido.')

    fresh()
    hub.on('GET', '/cms/recommendation-topics/4', 403, { message: 'This action is unauthorized.' })
    ;({ error } = await run(handler, ev('GET', 'topics/4')))
    assert.equal(error.statusCode, 403)
    assert.match(error.message, /permiso/)

    fresh()
    hub.on('GET', '/cms/recommendation-topics/4', 404, { message: 'No query results for model' })
    ;({ error } = await run(handler, ev('GET', 'topics/4')))
    assert.equal(error.statusCode, 404)
    assert.equal(/No query results/.test(error.message), false)

    fresh()
    hub.on('DELETE', path, 409, { message: 'El tema tiene subtemas: elimínalos o muévelos a otro tema primero.' })
    ;({ error } = await run(handler, ev('DELETE', 'topics/4')))
    assert.equal(error.statusCode, 409)
    assert.match(error.message, /subtemas/)

    fresh()
    hub.on('POST', '/cms/recommendation-subtopics/9/sections', 422, { message: 'Falta el destino del botón.', errors: { cta_url: ['Falta el destino del botón.'] } })
    ;({ error } = await run(handler, ev('POST', 'subtopics/9/sections', { type: 'callout', title: 'x', cta_label: 'Ir' })))
    assert.equal(error.statusCode, 422)
    assert.deepEqual(error.data.errors, { cta_url: ['Falta el destino del botón.'] })
  })

  test('fallos de Hub (5xx, sin respuesta, 429) son transitorios (503/429), nunca un éxito, y una escritura NO se reintenta', async () => {
    for (const status of [0, 500, 502, 503]) {
      fresh()
      hub.on('POST', '/cms/recommendation-topics', status, { message: 'boom' })
      const { value, error } = await run(handler, ev('POST', 'topics', { title: 'x' }))
      assert.equal(value, undefined)
      assert.equal(error.statusCode, 503, String(status))
      assert.equal(error.data.transient, true)
      assert.equal(hub.calls.length, 1, 'sin reintentos')
    }
    fresh()
    hub.on('POST', '/cms/recommendation-topics', 429, {})
    assert.equal((await run(handler, ev('POST', 'topics', { title: 'x' }))).error.statusCode, 429)
  })

  test('un 2xx cuyo cuerpo no es un objeto JSON no se toma por guardado', async () => {
    fresh()
    hub.on('POST', '/cms/recommendation-topics', 201, 'ok')
    assert.equal((await run(handler, ev('POST', 'topics', { title: 'x' }))).error.statusCode, 503)
  })

  test('toda llamada a Hub es /cms/* autenticada: nunca una ruta pública /v1/web', async () => {
    fresh()
    hub.on('GET', /.*/, 200, { data: [] })
    hub.on('POST', /.*/, 200, { data: {} })
    hub.on('PUT', /.*/, 200, { data: {} })
    hub.on('DELETE', /.*/, 200, { message: 'ok' })
    for (const [method, path] of [['GET', 'topics'], ['POST', 'topics'], ['PUT', 'sections/3'], ['DELETE', 'items/4'], ['GET', 'subtopics/2/short-link']]) await run(handler, ev(method, path, {}))
    assert.ok(hub.calls.length >= 5)
    for (const c of hub.calls) {
      assert.equal(c.kind, 'json')
      assert.match(c.path, /^\/cms\/recommendation-/)
      assert.equal(c.token, 'hub-secret-token')
    }
  })
})

// ───────────────────────── Proveedor del navegador ─────────────────────────

describe('HubRecommendationTreeAdminProvider', () => {
  const make = (handler) => {
    const calls = []
    return { calls, provider: new HubRecommendationTreeAdminProvider(async (url, options) => { calls.push({ url, method: options?.method, body: options?.body }); return handler(url, options) }) }
  }

  test('cada operación usa su método y su ruta administrativa (nunca las públicas) y devuelve `data`', async () => {
    const { provider, calls } = make(() => ({ data: { ok: true } }))
    await provider.listTopics(); await provider.createTopic({ title: 'T' }); await provider.updateTopic(1, { published: true }); await provider.deleteTopic(1); await provider.reorderTopics([2, 1])
    await provider.listSubtopics(1); await provider.createSubtopic(1, { title: 'S' }); await provider.reorderSubtopics(1, [3]); await provider.getSubtopic(3); await provider.updateSubtopic(3, { published: true }); await provider.deleteSubtopic(3)
    await provider.getIntro(3); await provider.updateIntro(3, { content: 'x' }); await provider.setIntroImage(3, PNG); await provider.removeIntroImage(3); await provider.getShortLink(3)
    await provider.listSections(3); await provider.createSection(3, { type: 'description', title: 'x' }); await provider.reorderSections(3, [5]); await provider.getSection(5); await provider.updateSection(5, { visible: false }); await provider.deleteSection(5); await provider.setSectionImage(5, PNG); await provider.removeSectionImage(5)
    await provider.listItems(5); await provider.createItem(5, { title: 'i' }); await provider.reorderItems(5, [7]); await provider.updateItem(7, { published: true }); await provider.deleteItem(7); await provider.sectionTypes()
    const seen = calls.map(c => `${c.method} ${c.url.replace('/api/admin/recommendation-tree', '')}`)
    assert.deepEqual(seen, [
      'GET /topics', 'POST /topics', 'PUT /topics/1', 'DELETE /topics/1', 'POST /topics/reorder',
      'GET /topics/1/subtopics', 'POST /topics/1/subtopics', 'POST /topics/1/subtopics/reorder', 'GET /subtopics/3', 'PUT /subtopics/3', 'DELETE /subtopics/3',
      'GET /subtopics/3/intro', 'PUT /subtopics/3/intro', 'POST /subtopics/3/intro/image', 'DELETE /subtopics/3/intro/image', 'GET /subtopics/3/short-link',
      'GET /subtopics/3/sections', 'POST /subtopics/3/sections', 'POST /subtopics/3/sections/reorder', 'GET /sections/5', 'PUT /sections/5', 'DELETE /sections/5', 'POST /sections/5/image', 'DELETE /sections/5/image',
      'GET /sections/5/items', 'POST /sections/5/items', 'POST /sections/5/items/reorder', 'PUT /items/7', 'DELETE /items/7', 'GET /section-types'
    ])
    for (const c of calls) assert.equal(c.url.startsWith('/api/admin/recommendation-tree/'), true)
  })

  test('el tema de un subtema se indica solo en la ruta; el cuerpo es el del formulario', async () => {
    const { provider, calls } = make(() => ({ data: { id: 1 } }))
    await provider.createSubtopic(4, { title: 'S', grupo: 'cuidados' })
    assert.equal(calls[0].url, '/api/admin/recommendation-tree/topics/4/subtopics')
    assert.deepEqual(calls[0].body, { title: 'S', grupo: 'cuidados' })
  })

  test('los errores 401/403/404/409/422/503 conservan statusCode, mensaje y errores por campo (nunca un éxito)', async () => {
    for (const [status, message] of [[401, 'No autenticado'], [403, 'Sin permiso'], [404, 'No existe'], [409, 'Conflicto'], [422, 'Revisa'], [503, 'Caído']]) {
      const { provider } = make(() => { throw Object.assign(new Error('fetch failed'), { statusCode: status, data: { data: { message, errors: { title: ['malo'] } } } }) })
      await assert.rejects(() => provider.createTopic({ title: 'x' }), (e) => {
        assert.equal(e.statusCode, status)
        assert.equal(e.message, message)
        assert.deepEqual(e.fieldErrors, { title: ['malo'] })
        return true
      })
    }
  })

  test('una respuesta que no es un objeto JSON no se toma por éxito', async () => {
    const { provider } = make(() => 'ok')
    await assert.rejects(() => provider.listTopics(), { statusCode: 503 })
  })
})

// ───────────────────────── Pantallas (comprobaciones estáticas) ─────────────────────────

describe('pantallas del panel de Recomendaciones', () => {
  const code = rel => read(rel).replace(/<!--[\s\S]*?-->/g, '')
  const PAGES = {
    topics: 'pages/admin/recomendaciones/temas/index.vue',
    topic: 'pages/admin/recomendaciones/temas/[topic]/index.vue',
    subtopic: 'pages/admin/recomendaciones/temas/[topic]/subtemas/[subtopic]/index.vue',
    newSection: 'pages/admin/recomendaciones/temas/[topic]/subtemas/[subtopic]/secciones/nueva.vue',
    editSection: 'pages/admin/recomendaciones/temas/[topic]/subtemas/[subtopic]/secciones/[section].vue'
  }
  const FORM = 'components/admin/recommendations/TreeSectionForm.vue'
  const ITEMS = 'components/admin/recommendations/TreeItems.vue'
  const all = [...Object.values(PAGES), FORM, ITEMS, 'components/admin/recommendations/TreeNotice.vue', 'components/admin/recommendations/TreeBreadcrumb.vue']

  test('un archivo de ruta Nitro por método, todos delegan en el mismo manejador autenticado', () => {
    for (const method of ['get', 'post', 'put', 'delete']) {
      const file = `server/api/admin/recommendation-tree/[...path].${method}.ts`
      assert.match(read(file), /handleTreeRequest\(event\)/, file)
    }
    const util = read('server/utils/recommendationAdmin.ts')
    assert.ok(util.indexOf('await adminSession(event)') < util.indexOf('resolveAdminRoute(String(event.method)'), 'la sesión y el origen se comprueban antes de resolver la ruta')
  })

  test('existen las cinco pantallas y usan el layout del panel (rutas bajo /admin, protegidas por el middleware existente)', () => {
    for (const file of Object.values(PAGES)) {
      assert.equal(existsSync(join(ROOT, file)), true, file)
      assert.match(read(file), /definePageMeta\(\{ layout: 'admin' \}\)/)
    }
    assert.match(read('middleware/admin-auth.global.ts'), /to\.path\.startsWith\('\/admin'\)/)
  })

  test('lista de temas: título, texto del menú, subtemas, estado, orden y acciones, con «Crear tema»', () => {
    const page = read(PAGES.topics)
    for (const text of ['Crear tema', 'Texto del menú', 'Subtemas', 'Estado', 'Orden', 'Acciones', 'Editar', 'Eliminar', 'subtopics_count']) assert.ok(page.includes(text), text)
    assert.match(page, /\/admin\/recomendaciones\/temas\/\$\{t\.id\}/) // abre el detalle
    assert.match(page, /reorderTopics/)
    assert.match(page, /deleteTopic/)
    assert.match(page, /notify\.confirm\(/)
  })

  test('detalle del tema: breadcrumbs, subtemas, «Crear subtema» sin pedir el tema y orden/publicación/eliminación', () => {
    const page = read(PAGES.topic)
    assert.match(page, /Crear subtema/)
    assert.match(page, /api\.createSubtopic\(topicId\.value, \{/)
    assert.equal(/topic_id/.test(page), false, 'el formulario no manda ni pide el tema')
    assert.equal(/company_id|linea_id/.test(page), false)
    for (const call of ['reorderSubtopics', 'updateSubtopic', 'deleteSubtopic', 'listSubtopics']) assert.ok(page.includes(call), call)
    assert.match(page, /label: 'Recomendaciones', to: '\/admin\/recomendaciones\/temas'/)
  })

  test('detalle del subtema: breadcrumbs, introducción independiente, enlace corto de Hub, secciones y la nota orientativa', () => {
    const page = read(PAGES.subtopic)
    assert.ok(page.includes('Puedes agregar contenido directamente en la introducción. Sin embargo, para facilitar la edición, el ordenamiento y el mantenimiento, te recomendamos organizar la información en secciones independientes.'))
    for (const call of ['updateIntro', 'setIntroImage', 'removeIntroImage', 'getShortLink', 'listSections', 'reorderSections', 'deleteSection']) assert.ok(page.includes(call), call)
    assert.match(page, /Añadir sección/)
    assert.match(page, /Copiar enlace/)
    // el enlace corto sale de Hub: nada de construir URLs ni códigos
    assert.equal(/go\.|short_code|generateCode|Math\.random/.test(code(PAGES.subtopic).replace(/short-link|short_url/g, '')), false)
    // la introducción NO se convierte en secciones
    assert.equal(/createSection/.test(page), false)
    // guardar la introducción no toca los datos del subtema ni viceversa
    assert.match(page, /api\.updateIntro\(subId\.value, \{ content: intro\.content/)
  })

  test('formulario de sección: placeholders exactos, botón opcional con mensajes del dato faltante, campos según el tipo y error de Hub visible', () => {
    const form = read(FORM)
    assert.ok(form.includes('placeholder="Ej. Recomendaciones"'))
    assert.ok(form.includes('placeholder="Ej. Cuidados antes de tu procedimiento"'))
    assert.ok(form.includes('placeholder="Escribe aquí la descripción o el contenido de la sección..."'))
    assert.match(form, /Falta el destino del botón\./)
    assert.match(form, /Falta el texto del botón\./)
    for (const field of ['subtitle', 'content', 'video', 'image', 'layout', 'cta']) assert.ok(form.includes(`allows('${field}')`), field)
    // los placeholders no son valores por defecto
    assert.match(form, /title: '', subtitle: '', content: ''/)
    assert.equal(/ref\(['"]Ej\. /.test(form), false)
    // cambio de tipo: contenido incompatible visible y vaciable de forma explícita, sin descartarlo
    assert.match(form, /data-testid="incompatible"/)
    assert.match(form, /Vaciar/)
    assert.match(form, /TreeNotice|AdminRecommendationsTreeNotice/)
  })

  test('el formulario de sección envía cada campo con su valor o null y deja que Hub decida lo incompatible (no se descarta en silencio)', () => {
    const form = read(FORM)
    const build = form.slice(form.indexOf('function buildInput'), form.indexOf('async function submit'))
    for (const field of ['subtitle', 'content', 'layout', 'image_alt', 'video_url', 'cta_label', 'cta_url', 'visible', 'type', 'title']) assert.ok(build.includes(`${field}:`), field)
    assert.equal(/allows\(/.test(build), false, 'buildInput no filtra por tipo')
  })

  test('recomendaciones individuales: solo en secciones de lista, fuera del formulario de la sección y con crear/editar/ordenar/eliminar', () => {
    const items = read(ITEMS)
    for (const call of ['listItems', 'createItem', 'updateItem', 'reorderItems', 'deleteItem']) assert.ok(items.includes(call), call)
    assert.match(items, /notify\.confirm\(/)
    const form = read(FORM)
    const closeForm = form.indexOf('</form>')
    assert.ok(closeForm > 0 && form.indexOf('<AdminRecommendationsTreeItems') > closeForm, 'los formularios no se anidan')
    assert.match(form, /section\.type === 'recommendations'/)
    // texto de la sección e items no se convierten entre sí
    assert.match(form, /no se convierten entre sí ni se duplican/)
  })

  test('envíos duplicados evitados, sin v-html, sin escrituras por rutas públicas y sin secretos en el navegador', () => {
    for (const file of all) {
      const src = read(file)
      assert.equal(/v-html/.test(src), false, file)
      assert.equal(/\/api\/v1\/web|\/v1\/web|Authorization|Bearer|NUXT_WELLEZY|localStorage|sessionStorage/.test(src), false, file)
    }
    for (const file of [...Object.values(PAGES), FORM, ITEMS].filter(f => !/nueva|\[section\]/.test(f))) {
      const src = read(file)
      assert.match(src, /useTreeAction\(\)/, file)
      assert.match(src, /busy\.value/, file)
    }
    const action = read('composables/useTreeAction.ts')
    assert.match(action, /if \(busy\.value\) return \{ ok: false \}/)
    assert.equal(/retry|setTimeout|while \(/.test(action), false, 'sin reintentos automáticos')
  })

  test('responsive: filas que se apilan en móvil, sin tablas anchas ni anchos fijos del viewport', () => {
    for (const file of [PAGES.topics, PAGES.topic, PAGES.subtopic]) {
      const src = read(file)
      assert.match(src, /md:grid-cols-\[/, file)
      assert.match(src, /break-words/, file)
      assert.equal(/<table/.test(src), false, file)
      assert.equal(/\bw-\[\d{3,}px\]|min-w-\[\d{3,}/.test(src), false, file)
    }
    assert.match(read('components/admin/recommendations/TreeBreadcrumb.vue'), /truncate/)
  })

  test('/admin/recomendaciones solo redirige a la tabla de temas (sin pestañas ni formularios heredados) y el menú apunta a los temas', () => {
    const index = read('pages/admin/recomendaciones/index.vue')
    assert.match(index, /redirect: '\/admin\/recomendaciones\/temas'/)
    for (const legacy of ['Recomendaciones generales', 'Contenido por procedimiento', 'role="tablist"', 'createAdminController', 'AdminRecommendationsPageEditor']) assert.equal(index.includes(legacy), false, legacy)
    // el destino es una pantalla real (no redirige): sin ciclos
    assert.equal(/redirect/.test(read('pages/admin/recomendaciones/temas/index.vue')), false)
    const layout = read('layouts/admin.vue')
    assert.match(layout, /to="\/admin\/recomendaciones\/temas"/)
    assert.equal(/to="\/admin\/recomendaciones"/.test(layout), false)
    assert.equal(/to="\/admin\/recomendaciones"/.test(read('pages/admin/index.vue')), false)
    // la pantalla heredada ya no es la entrada: queda aparte, avisa y enlaza a los temas
    assert.match(read('pages/admin/recomendaciones/historico.vue'), /data-testid="legacy-notice"/)
  })
})

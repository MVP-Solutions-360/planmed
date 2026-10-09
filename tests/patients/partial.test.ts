// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// «Nuestros Pacientes»: guardado con varias operaciones en Hub. Demuestra cómo se comunica una operación PARCIAL y que un
// reintento tras un fallo parcial no duplica registros.
import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { FakeHub, HUB_TOKEN, PNG, ROOT, makeEvent, run, setup } from '../recommendations/harness.ts'

const hub = new FakeHub()
let api, put

before(async () => {
  api = await setup(hub)
  Object.assign(globalThis, await import(pathToFileURL(join(ROOT, 'server/utils/patients.ts')).href))
  put = await api.handler('server/api/admin/patient-section.put.ts')
})

const settings = { data: { id: 1, show_videos: true, show_before_after: true, referral_title: 'R', referral_content: null } }
const body = (over = {}) => ({ visibility: { videos: true, beforeAfter: true }, videos: [], instagram: [], beforeAfter: [], referral: { title: 'R', content: '' }, ...over })
const newCase = (over = {}) => ({ id: 'new-c', title: 'Caso nuevo', description: '', beforeImage: PNG, afterImage: PNG, published: true, ...over })
const posts = (path) => hub.calls.filter(c => c.method === 'POST' && c.path === path).length

/** Hub con estado: los casos creados quedan guardados; la subida de imágenes falla las primeras `failUploads` veces. */
function statefulHub({ failUploads = 0 } = {}) {
  hub.calls = []; hub.rules = []; hub.sessionCleared = false; hub.token = HUB_TOKEN
  const state = { cases: [], uploads: 0 }
  hub.on('GET', '/cms/patient-section', 200, settings)
  hub.on('PUT', '/cms/patient-section', 200, settings)
  hub.on('GET', '/cms/testimonial-embeds', 200, { data: [] })
  hub.on('GET', '/cms/before-after-cases', 200, () => ({ data: state.cases }))
  hub.on('POST', '/cms/before-after-cases', 201, (call) => {
    const c = { id: 300 + state.cases.length + 1, title: call.body.title, description: call.body.description ?? null, published: call.body.published === true, before_url: null, after_url: null }
    state.cases.push(c)
    return { data: c }
  })
  hub.on('POST', /^\/cms\/before-after-cases\/\d+\/images$/, () => (++state.uploads <= failUploads ? 422 : 200), (call) => {
    if (state.uploads <= failUploads) return { message: 'La imagen no es válida.', errors: { before: ['x'] } }
    const c = state.cases.find(x => `/cms/before-after-cases/${x.id}/images` === call.path)
    c.before_url = 'https://h/b.png'; c.after_url = 'https://h/a.png'
    return { data: c }
  })
  hub.on('POST', /^\/cms\/before-after-cases\/reorder$/, 200, { message: 'ok' })
  hub.on('DELETE', /^\/cms\/before-after-cases\/\d+$/, 200, (call) => {
    state.cases = state.cases.filter(c => `/cms/before-after-cases/${c.id}` !== call.path)
    return { message: 'ok' }
  })
  return state
}

describe('operación parcial', () => {
  test('la imagen falla DESPUÉS de crear el caso: el error es parcial y trae lo realmente guardado', async () => {
    const state = statefulHub({ failUploads: 1 })
    const { error } = await run(put, makeEvent({ body: body({ beforeAfter: [newCase()] }) }))

    assert.equal(error.statusCode, 422)
    assert.equal(error.data.partial, true)
    assert.equal(error.data.content.beforeAfter.length, 1)
    assert.equal(error.data.content.beforeAfter[0].id, '301', 'el caso ya existe en Hub con su id real')
    assert.match(error.message, /Algunos cambios sí se guardaron/)
    assert.match(error.message, /La imagen no es válida\./)
    assert.equal(state.cases.length, 1)
  })

  test('el reintento converge a un solo caso; con el estado sincronizado no elimina ni recrea lo ya creado', async () => {
    const state = statefulHub({ failUploads: 1 })
    const first = await run(put, makeEvent({ body: body({ beforeAfter: [newCase()] }) }))
    const synced = first.error.data.content

    // El formulario sincronizado conserva las imágenes locales del usuario para el reintento.
    const retry = { ...synced, beforeAfter: synced.beforeAfter.map(c => ({ ...c, beforeImage: PNG, afterImage: PNG })) }
    const second = await run(put, makeEvent({ body: retry }))
    assert.equal(second.error, undefined)
    assert.equal(state.cases.length, 1, 'un solo caso en Hub')
    assert.equal(posts('/cms/before-after-cases'), 1, 'no se creó otro')
    assert.equal(hub.calls.filter(c => c.method === 'DELETE').length, 0, 'no se eliminó nada')
    assert.equal(second.value.beforeAfter[0].beforeImage, 'https://h/b.png')

    // Contraste: reenviar el formulario viejo (id temporal) también converge a un solo caso, pero elimina el recién creado y lo recrea.
    const stale = statefulHub({ failUploads: 1 })
    await run(put, makeEvent({ body: body({ beforeAfter: [newCase()] }) }))
    const again = await run(put, makeEvent({ body: body({ beforeAfter: [newCase()] }) }))
    assert.equal(again.error, undefined)
    assert.equal(stale.cases.length, 1)
    assert.equal(posts('/cms/before-after-cases'), 2)
    assert.equal(hub.calls.filter(c => c.method === 'DELETE').length, 1)
  })

  test('un fallo de Hub a mitad de camino (500) también es parcial; si no se puede releer, se indica recargar', async () => {
    statefulHub()
    hub.rules.unshift({ method: 'POST', path: /^\/cms\/before-after-cases$/, status: 500, data: {} })
    // La configuración (PUT) ya se aplicó antes de fallar el alta del caso; la relectura posterior también falla.
    let reads = 0
    hub.rules.unshift({ method: 'GET', path: /^\/cms\/before-after-cases$/, status: () => (++reads > 1 ? 0 : 200), data: { data: [] } })
    const { error } = await run(put, makeEvent({ body: body({ beforeAfter: [newCase()] }) }))
    assert.equal(error.statusCode, 503)
    assert.equal(error.data.partial, true)
    assert.equal(error.data.content, null)
    assert.match(error.message, /Recarga la página/)
  })

  test('un fallo en la PRIMERA escritura no es parcial: nada cambió', async () => {
    statefulHub()
    hub.rules.unshift({ method: 'PUT', path: /^\/cms\/patient-section$/, status: 422, data: { message: 'Texto inválido', errors: {} } })
    const { error } = await run(put, makeEvent({ body: body() }))
    assert.equal(error.statusCode, 422)
    assert.equal(error.data.partial, undefined)
    assert.equal(hub.calls.filter(c => c.method !== 'GET').length, 1)
  })

  test('sesión vencida (401) a mitad de camino no se disfraza de parcial y cierra la sesión', async () => {
    statefulHub()
    hub.rules.unshift({ method: 'POST', path: /^\/cms\/before-after-cases$/, status: 401, data: {} })
    const { error } = await run(put, makeEvent({ body: body({ beforeAfter: [newCase()] }) }))
    assert.equal(error.statusCode, 401)
    assert.equal(error.data?.partial, undefined)
    assert.equal(hub.sessionCleared, true)
  })

  test('éxito: devuelve el contenido guardado sin marca de parcial', async () => {
    statefulHub()
    const { value, error } = await run(put, makeEvent({ body: body({ beforeAfter: [newCase()] }) }))
    assert.equal(error, undefined)
    assert.equal(value.beforeAfter.length, 1)
    assert.equal(value.beforeAfter[0].beforeImage, 'https://h/b.png')
  })
})

describe('validación previa de imágenes', () => {
  test('una imagen nueva inválida se rechaza ANTES de crear nada (antes fallaba tras crear el caso)', async () => {
    for (const bad of ['data:image/svg+xml;base64,PHN2Zz4=', 'data:image/png;base64,@@@', 'data:text/html;base64,PGI+']) {
      const state = statefulHub()
      const { error } = await run(put, makeEvent({ body: body({ beforeAfter: [newCase({ beforeImage: bad })] }) }))
      assert.equal(error.statusCode, 422, bad)
      assert.match(error.message, /JPG, PNG o WebP/)
      assert.equal(hub.calls.length, 0, 'ninguna llamada a Hub')
      assert.equal(state.cases.length, 0)
    }
  })

  test('una imagen demasiado pesada (>5 MB) tampoco llega a Hub', async () => {
    const state = statefulHub()
    const huge = 'data:image/png;base64,' + Buffer.alloc(5 * 1024 * 1024 + 10).toString('base64')
    const { error } = await run(put, makeEvent({ body: body({ beforeAfter: [newCase({ afterImage: huge })] }) }))
    assert.equal(error.statusCode, 422)
    assert.equal(hub.calls.length, 0)
    assert.equal(state.cases.length, 0)
  })
})

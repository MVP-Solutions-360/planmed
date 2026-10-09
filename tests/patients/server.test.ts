// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// «Nuestros Pacientes»: rutas Nitro reales (server/api/**/patient-section*, server/utils/patients.ts) contra un Hub falso que
// registra cada llamada. Reutiliza el arnés de recomendaciones. La prueba contra un Hub real está en documentacion/maestra/08.
import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { FakeHub, HUB_TOKEN, PNG, ROOT, makeEvent, run, setup } from '../recommendations/harness.ts'

const hub = new FakeHub()
let api: any
let pat: any

before(async () => {
  api = await setup(hub)
  pat = await import(pathToFileURL(join(ROOT, 'server/utils/patients.ts')).href)
  Object.assign(globalThis, pat)
})

const fresh = () => { hub.calls = []; hub.rules = []; hub.sessionCleared = false; hub.token = HUB_TOKEN }
const settings = (over = {}) => ({ data: { id: 1, show_videos: true, show_before_after: true, referral_title: 'Referidos', referral_content: '<p>x</p>', company_id: 1, linea_id: 3, ...over } })
const embed = (id, platform, url, over = {}) => ({ id, platform, url, title: null, orden: id, activo: true, company_id: 1, linea_id: 3, ...over })
const kase = (id, over = {}) => ({ id, title: 'Caso', description: null, orden: id, published: true, before_url: 'https://h/b.png', after_url: 'https://h/a.png', company_id: 1, linea_id: 3, ...over })
const body = (over = {}) => ({
  visibility: { videos: true, beforeAfter: true }, videos: [], instagram: [], beforeAfter: [], referral: { title: 'Referidos', content: '' }, ...over
})
const ok = (data = {}) => ({ data })
const count = (method, path) => hub.calls.filter(x => x.method === method && x.path === path).length

function hubState({ embeds = [], cases = [] } = {}) {
  hub.on('GET', '/cms/patient-section', 200, settings())
  hub.on('PUT', '/cms/patient-section', 200, settings())
  hub.on('GET', '/cms/testimonial-embeds', 200, { data: embeds })
  hub.on('GET', '/cms/before-after-cases', 200, { data: cases })
  hub.on('DELETE', /^\/cms\/(testimonial-embeds|before-after-cases)\/\d+$/, 200, { message: 'ok' })
  hub.on('PUT', /^\/cms\/(testimonial-embeds|before-after-cases)\/\d+$/, 200, ok())
  hub.on('POST', '/cms/testimonial-embeds', 201, () => ok({ id: 100 + count('POST', '/cms/testimonial-embeds') }))
  hub.on('POST', '/cms/before-after-cases', 201, () => ok({ id: 200 + count('POST', '/cms/before-after-cases') }))
  hub.on('POST', /^\/cms\/before-after-cases\/\d+\/images$/, 200, ok())
  hub.on('POST', /^\/cms\/(testimonial-embeds|before-after-cases)\/reorder$/, 200, { message: 'ok' })
}
const writes = () => hub.calls.filter(c => c.method !== 'GET')

describe('mapeos', () => {
  test('fromPublicSection: visibilidad, videos, Instagram, casos y referidos; valores ausentes no rompen', () => {
    const out = pat.fromPublicSection({
      visibility: { videos: false, before_after: true },
      videos: [{ platform: 'youtube', external_id: 'abc', url: 'https://www.youtube.com/watch?v=abc', title: 'T' }],
      instagram: [{ platform: 'instagram', external_id: 'Z1', url: 'https://www.instagram.com/p/Z1/', title: null }],
      before_after: [{ title: 'C', description: 'D', before_url: 'b', after_url: 'a' }],
      referral: { title: 'R', content: '<p>c</p>' }
    })
    assert.deepEqual(out.visibility, { videos: false, beforeAfter: true })
    assert.equal(out.videos[0].id, 'abc')
    assert.equal(out.beforeAfter[0].beforeImage, 'b')
    assert.equal(out.referral.content, '<p>c</p>')
    const empty = pat.fromPublicSection({})
    assert.deepEqual([empty.videos, empty.instagram, empty.beforeAfter], [[], [], []])
    assert.equal(empty.visibility.videos, true)
  })

  test('fromCmsPatients conserva el contenido oculto (activo/publicado) y los ids de Hub', () => {
    const out = pat.fromCmsPatients(settings().data, [embed(1, 'youtube', 'u', { activo: false }), embed(2, 'instagram', 'i')], [kase(5, { published: false })])
    assert.equal(out.videos[0].id, '1'); assert.equal(out.videos[0].active, false)
    assert.equal(out.instagram[0].id, '2')
    assert.equal(out.beforeAfter[0].published, false)
  })

  test('hubId solo acepta enteros positivos; los ids temporales del formulario no', () => {
    assert.equal(pat.hubId('12'), 12)
    for (const v of ['new-ab12', '12345678x', '', '0', '-3', '1.5', null, undefined, {}]) assert.equal(pat.hubId(v), null, String(v))
  })
})

describe('GET público', () => {
  test('mapea la respuesta de Hub y deja que el servidor ponga el tenant', async () => {
    fresh()
    hub.on('GET', '/v1/web/patient-section', 200, { data: { visibility: { videos: true, before_after: false }, videos: [], instagram: [], before_after: [], referral: { title: 'R', content: '' } } })
    const { value, error } = await run(await api.handler('server/api/public/patient-section.get.ts'), makeEvent())
    assert.equal(error, undefined)
    assert.equal(value.visibility.beforeAfter, false)
    assert.equal(hub.last().kind, 'public')
  })

  test('Hub caído o respuesta inválida => 503, nunca un contenido vacío que parezca real', async () => {
    for (const status of [0, 500, 404]) {
      fresh(); hub.on('GET', '/v1/web/patient-section', status, { message: 'x' })
      const { error } = await run(await api.handler('server/api/public/patient-section.get.ts'), makeEvent())
      assert.equal(error.statusCode, 503)
    }
  })
})

describe('admin: autenticación', () => {
  test('sin sesión => 401 y ninguna llamada a Hub (GET y PUT)', async () => {
    fresh(); hub.token = null; hubState()
    for (const rel of ['server/api/admin/patient-section.get.ts', 'server/api/admin/patient-section.put.ts']) {
      const { error } = await run(await api.handler(rel), makeEvent({ body: body() }))
      assert.equal(error.statusCode, 401)
    }
    assert.equal(hub.calls.length, 0)
  })
})

describe('admin: PUT aplica solo lo que cambió', () => {
  const put = async (b) => run(await api.handler('server/api/admin/patient-section.put.ts'), makeEvent({ body: b }))

  test('sin cambios: solo se guarda la configuración y el orden; no se crea, edita ni elimina nada', async () => {
    fresh(); hubState({ embeds: [embed(1, 'youtube', 'https://www.youtube.com/watch?v=abc')], cases: [kase(5)] })
    const { error } = await put(body({
      videos: [{ id: '1', title: '', url: 'https://www.youtube.com/watch?v=abc', active: true }],
      beforeAfter: [{ id: '5', title: 'Caso', description: '', beforeImage: 'https://h/b.png', afterImage: 'https://h/a.png', published: true }]
    }))
    assert.equal(error, undefined)
    assert.deepEqual(writes().map(c => `${c.method} ${c.path}`), ['PUT /cms/patient-section', 'POST /cms/testimonial-embeds/reorder', 'POST /cms/before-after-cases/reorder'])
  })

  test('quitar y volver a pegar el mismo enlace: se elimina ANTES de crear (la unicidad de Hub no choca)', async () => {
    fresh(); hubState({ embeds: [embed(1, 'youtube', 'https://www.youtube.com/watch?v=abc')] })
    const { error } = await put(body({ videos: [{ id: 'new-1', title: 'Otra vez', url: 'https://youtu.be/abc', active: true }] }))
    assert.equal(error, undefined)
    const w = writes().map(c => `${c.method} ${c.path}`)
    assert.ok(w.indexOf('DELETE /cms/testimonial-embeds/1') < w.indexOf('POST /cms/testimonial-embeds'))
  })

  test('nuevos elementos: se crean con su plataforma y se reordena con los ids reales en el orden del formulario', async () => {
    fresh(); hubState({ embeds: [embed(1, 'youtube', 'https://www.youtube.com/watch?v=abc'), embed(2, 'instagram', 'https://www.instagram.com/p/Z1/')] })
    await put(body({
      videos: [{ id: 'new-v', title: 'N', url: 'https://youtu.be/xyz', active: true }, { id: '1', title: '', url: 'https://www.youtube.com/watch?v=abc', active: true }],
      instagram: [{ id: '2', url: 'https://www.instagram.com/p/Z1/', title: '', active: true }]
    }))
    const created = writes().find(c => c.method === 'POST' && c.path === '/cms/testimonial-embeds')
    assert.equal(created.body.platform, 'youtube')
    assert.deepEqual(writes().find(c => c.path === '/cms/testimonial-embeds/reorder').body.ids, [101, 1, 2])
  })

  test('editar: envía solo los campos modificados', async () => {
    fresh(); hubState({ embeds: [embed(1, 'youtube', 'https://www.youtube.com/watch?v=abc')] })
    await put(body({ videos: [{ id: '1', title: 'Nuevo título', url: 'https://www.youtube.com/watch?v=abc', active: false }] }))
    assert.deepEqual(writes().find(c => c.method === 'PUT' && c.path === '/cms/testimonial-embeds/1').body, { title: 'Nuevo título', activo: false })
  })

  test('imágenes: solo se suben las data URL; una URL ya publicada no se reenvía', async () => {
    fresh(); hubState({ cases: [kase(5)] })
    await put(body({
      beforeAfter: [
        { id: '5', title: 'Caso', description: '', beforeImage: PNG, afterImage: 'https://h/a.png', published: true },
        { id: 'new-c', title: 'Nuevo', description: '', beforeImage: PNG, afterImage: PNG, published: true }
      ]
    }))
    const uploads = writes().filter(c => c.kind === 'upload')
    assert.equal(uploads.length, 2)
    assert.deepEqual([...uploads[0].form.keys()], ['before'])
    assert.deepEqual([...uploads[1].form.keys()].sort(), ['after', 'before'])
    assert.equal(uploads[1].path, '/cms/before-after-cases/201/images')
  })

  test('company_id y linea_id nunca viajan a Hub, aunque el navegador los envíe', async () => {
    fresh(); hubState()
    await put({ ...body({ videos: [{ id: 'new-v', title: '', url: 'https://youtu.be/xyz', active: true, company_id: 9, linea_id: 9 }] }), company_id: 9, linea_id: 9 })
    for (const c of writes()) {
      assert.equal(JSON.stringify(c.body ?? {}).includes('company_id'), false)
      assert.equal(JSON.stringify(c.body ?? {}).includes('linea_id'), false)
    }
  })

  test('validación previa: enlace inválido, caso sin título o publicado sin imágenes => 422 SIN ninguna escritura en Hub', async () => {
    const malos = [
      body({ videos: [{ id: 'new-1', title: '', url: 'https://evil.com/x', active: true }] }),
      body({ instagram: [{ id: 'new-1', url: 'https://www.youtube.com/watch?v=abc', title: '', active: true }] }),
      body({ beforeAfter: [{ id: 'new-1', title: ' ', description: '', beforeImage: PNG, afterImage: PNG, published: true }] }),
      body({ beforeAfter: [{ id: 'new-1', title: 'X', description: '', beforeImage: '', afterImage: PNG, published: true }] }),
      { videos: 'x' }, null
    ]
    for (const b of malos) {
      fresh(); hubState({ embeds: [embed(1, 'youtube', 'https://www.youtube.com/watch?v=abc')] })
      const { error } = await put(b)
      assert.equal(error.statusCode, 422)
      assert.equal(hub.calls.length, 0, 'no debe tocar Hub')
    }
  })

  test('un caso oculto sin imágenes sí se puede guardar (borrador)', async () => {
    fresh(); hubState()
    const { error } = await put(body({ beforeAfter: [{ id: 'new-1', title: 'Borrador', description: '', beforeImage: '', afterImage: '', published: false }] }))
    assert.equal(error, undefined)
  })

  test('403 de Hub (sin permiso pacientes_web) se traduce sin filtrar detalles', async () => {
    fresh(); hubState(); hub.rules.unshift({ method: 'PUT', path: /^\/cms\/patient-section$/, status: 403, data: { message: 'secreto interno' } })
    const { error } = await put(body())
    assert.equal(error.statusCode, 403)
    assert.equal(String(error.message).includes('secreto'), false)
  })
})

describe('sin persistencia local', () => {
  const code = rel => readFileSync(join(ROOT, rel), 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1')
  const files = [
    'providers/TestimonialsProvider.ts', 'providers/HubTestimonialsProvider.ts', 'providers/PublicTestimonialsProvider.ts', 'providers/HubPublicTestimonialsProvider.ts',
    'services/TestimonialsService.ts', 'services/PublicTestimonialsService.ts', 'pages/testimonios/index.vue', 'pages/testimonios/antes-y-despues.vue',
    'pages/testimonios/programa-de-referidos.vue', 'pages/admin/testimonios/index.vue', 'components/testimonials/TestimonialsNav.vue', 'server/utils/patients.ts'
  ]
  test('ningún archivo del módulo usa localStorage/sessionStorage ni importa un mock', () => {
    for (const f of files) {
      const c = code(f)
      assert.equal(/localStorage|sessionStorage/.test(c), false, `${f} usa almacenamiento local`)
      assert.equal(/Mock\w*Provider/.test(c), false, `${f} usa un mock`)
    }
    assert.equal(existsSync(join(ROOT, 'providers/MockTestimonialsProvider.ts')), false)
  })

  test('las páginas públicas y el menú leen por el servicio público (SSR con useAsyncData), no por el de administración', () => {
    for (const f of ['pages/testimonios/index.vue', 'pages/testimonios/antes-y-despues.vue', 'pages/testimonios/programa-de-referidos.vue', 'components/testimonials/TestimonialsNav.vue', 'components/layout/Navbar.vue']) {
      const c = code(f)
      assert.ok(c.includes('publicTestimonialsService'), `${f} no usa el servicio público`)
      assert.equal(/\btestimonialsService\b/.test(c), false, `${f} usa el servicio de administración`)
    }
    for (const f of ['pages/testimonios/index.vue', 'pages/testimonios/antes-y-despues.vue', 'pages/testimonios/programa-de-referidos.vue']) assert.ok(code(f).includes('useAsyncData'), `${f} no usa useAsyncData`)
  })
})

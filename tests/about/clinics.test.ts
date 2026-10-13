// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// «Clínicas aliadas»: validación, persistencia local, subida de archivos, limpieza y control de acceso.
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT } from '../recommendations/harness.ts'

const imp = rel => import(pathToFileURL(join(ROOT, rel)).href)
const C = await imp('shared/utils/clinics.ts')
const PNG = 'data:image/png;base64,iVBORw0KGgo='
const PDF = 'data:application/pdf;base64,JVBERi0xLjQK'
let dir, get, put, upload, pub, media
const state = { session: true, authorized: true }
const ev = (body, extra = {}) => ({ method: 'PUT', body, headers: {}, params: {}, ...extra })
const GET = (extra = {}) => ev(undefined, { method: 'GET', ...extra })
const run = async (fn, e) => { try { return { value: await fn(e) } } catch (error) { return { error } } }
const name = url => url.split('/').pop()

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'clinics-'))
  const g = globalThis
  g.defineEventHandler = fn => fn
  g.readBody = async e => e.body
  g.getRouterParam = (e, n) => e.params[n]
  g.setHeader = () => {}
  g.useRuntimeConfig = () => ({ planmedContentDir: dir })
  g.createError = o => Object.assign(new Error(o.message ?? 'error'), o)
  g.authError = (statusCode, message) => g.createError({ statusCode, message, data: { message } })
  g.assertSameOrigin = () => {}
  g.wellezyMe = async () => ({ status: 200, data: { user: { id: 1 } } })
  g.isAuthorizedUser = () => state.authorized
  g.MSG_FORBIDDEN = 'forbidden'
  g.MSG_UNAVAILABLE = 'unavailable'
  Object.assign(g, C, await imp('server/utils/news.ts'), await imp('server/utils/aboutStore.ts'), await imp('server/utils/clinics.ts'))
  g.adminSession = async () => {
    if (!state.session) throw g.authError(401, 'No autenticado')
    return { session: { clear: async () => {} }, token: 't' }
  }
  get = (await imp('server/api/admin/clinics.get.ts')).default
  put = (await imp('server/api/admin/clinics.put.ts')).default
  upload = (await imp('server/api/admin/clinics/upload.post.ts')).default
  pub = (await imp('server/api/public/clinics/index.get.ts')).default
  media = (await imp('server/api/public/clinics/media/[name].get.ts')).default
})
after(() => rmSync(dir, { recursive: true, force: true }))

const up = async (dataUrl, kind) => (await upload(ev({ dataUrl, kind }, { method: 'POST' }))).url
const clinic = (over = {}) => ({ id: 'clinica-1', name: 'Clínica Central', description: '<p>Descripción</p>', image: '', gallery: [], documents: [], ...over })

describe('validación', () => {
  test('nombre, descripción e imagen principal son obligatorios; la galería es opcional', () => {
    const e = C.validateClinics({ clinics: [clinic({ name: '', description: '<p></p>' })], updatedAt: '' })
    assert.ok(e['clinics.0.name'] && e['clinics.0.description'] && e['clinics.0.image'])
    assert.equal(e['clinics.0.gallery'], undefined)
  })
  test('el documento solo es obligatorio si existe: título y archivos', () => {
    const img = `${C.CLINIC_MEDIA_PREFIX}img-abcdef12-1234abcd.jpg`
    const ok = C.validateClinics({ clinics: [clinic({ image: img })], updatedAt: '' })
    assert.deepEqual(ok, {})
    const bad = C.validateClinics({ clinics: [clinic({ image: img, documents: [{ id: 'doc-1', title: '', files: [] }] })], updatedAt: '' })
    assert.ok(bad['clinics.0.documents.0.title'] && bad['clinics.0.documents.0.files'])
  })
  test('solo se aceptan URLs de archivos propios', () => {
    const e = C.validateClinics({ clinics: [clinic({ image: 'https://evil.example/x.jpg', gallery: ['javascript:alert(1)'] })], updatedAt: '' })
    assert.ok(e['clinics.0.image'] && e['clinics.0.gallery'])
  })
})

describe('acceso y persistencia', () => {
  test('sin sesión => 401; sin rol => 403; nada se escribe ni se sube', async () => {
    state.session = false
    for (const [fn, e] of [[put, ev({ clinics: [] })], [upload, ev({ dataUrl: PNG, kind: 'image' }, { method: 'POST' })], [get, GET()]]) {
      assert.equal((await run(fn, e)).error.statusCode, 401)
    }
    state.session = true
    state.authorized = false
    assert.equal((await run(put, ev({ clinics: [] }))).error.statusCode, 403)
    assert.equal((await run(upload, ev({ dataUrl: PNG, kind: 'image' }, { method: 'POST' }))).error.statusCode, 403)
    state.authorized = true
    assert.ok(!existsSync(join(dir, 'clinics.json')) && !existsSync(join(dir, 'clinics-media')))
  })

  test('subidas: imagen válida, PDF solo como documento, tipos no permitidos => 422', async () => {
    const img = await up(PNG, 'image')
    assert.match(img, /^\/api\/public\/clinics\/media\/img-[a-z0-9-]+\.png$/)
    const doc = await up(PDF, 'document')
    assert.match(doc, /^\/api\/public\/clinics\/media\/doc-[a-z0-9-]+\.pdf$/)
    assert.equal((await run(upload, ev({ dataUrl: PDF, kind: 'image' }, { method: 'POST' }))).error.statusCode, 422)
    assert.equal((await run(upload, ev({ dataUrl: 'data:image/svg+xml;base64,PHN2Zz4=', kind: 'image' }, { method: 'POST' }))).error.statusCode, 422)
    assert.equal((await run(upload, ev({ dataUrl: 'data:text/html;base64,PGI+', kind: 'document' }, { method: 'POST' }))).error.statusCode, 422)
    assert.equal((await run(upload, ev({ dataUrl: PNG, kind: 'otro' }, { method: 'POST' }))).error.statusCode, 422)
    assert.ok(existsSync(join(dir, 'clinics-media', name(img))))
    const file = await media(GET({ params: { name: name(img) } }))
    assert.ok(file.length > 0)
    assert.equal((await run(media, GET({ params: { name: '../clinics.json' } }))).error.statusCode, 404)
  })

  test('guardar: valida (422), persiste, sanea la descripción y el público lo refleja', async () => {
    const image = await up(PNG, 'image')
    const bad = await run(put, ev({ clinics: [clinic({ image, name: '' })] }))
    assert.equal(bad.error.statusCode, 422)
    assert.ok(!existsSync(join(dir, 'clinics.json')))

    const gal = await up(PNG, 'image')
    const doc = await up(PDF, 'document')
    const body = { clinics: [clinic({ image, description: '<p>Hola <strong>mundo</strong></p><script>alert(1)</script>', gallery: [gal], documents: [{ id: 'doc-1', title: 'Certificado', files: [{ url: doc, name: 'cert.pdf' }] }] })] }
    const { value, error } = await run(put, ev(body))
    assert.ok(!error, error?.message)
    assert.equal(value.clinics[0].description, '<p>Hola <strong>mundo</strong></p>')
    assert.ok(existsSync(join(dir, 'clinics.json')))
    const p = await pub(GET())
    assert.equal(p.clinics[0].name, 'Clínica Central')
    assert.equal(p.clinics[0].documents[0].files[0].name, 'cert.pdf')
    assert.equal((await get(GET())).clinics.length, 1)
  })

  test('conflicto 409; y al quitar archivos se borran del disco', async () => {
    const cur = await get(GET())
    assert.equal((await run(put, ev({ ...cur, updatedAt: '2000-01-01T00:00:00.000Z' }))).error.statusCode, 409)
    const c = cur.clinics[0]
    const [gal] = c.gallery
    const doc = c.documents[0].files[0].url
    const next = await run(put, ev({ ...cur, clinics: [{ ...c, gallery: [], documents: [] }] }))
    assert.ok(!next.error, next.error?.message)
    assert.ok(!existsSync(join(dir, 'clinics-media', name(gal))))
    assert.ok(!existsSync(join(dir, 'clinics-media', name(doc))))
    assert.ok(existsSync(join(dir, 'clinics-media', name(c.image))))
  })

  test('cuerpo sin lista de clínicas no borra las existentes; lista vacía sí las quita', async () => {
    const cur = await get(GET())
    const kept = await run(put, ev({ updatedAt: cur.updatedAt }))
    assert.equal(kept.value.clinics.length, 1)
    const cleared = await run(put, ev({ clinics: [], updatedAt: kept.value.updatedAt }))
    assert.equal(cleared.value.clinics.length, 0)
  })
})

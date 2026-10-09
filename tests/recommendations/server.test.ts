// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { FakeHub, HUB_TOKEN, PNG, hubPage, makeEvent, run, setup } from './harness.ts'

const hub = new FakeHub()
let api: Awaited<ReturnType<typeof setup>>

before(async () => { api = await setup(hub) })

const fresh = () => { hub.calls = []; hub.rules = []; hub.sessionCleared = false; hub.token = HUB_TOKEN }
const adminList = (rows: any[]) => hub.on('GET', '/cms/recommendation-pages', 200, { data: rows })

describe('mapeos y textos históricos', () => {
  test('recommendationHtml: string tal cual, lista histórica como lista escapada, vacío => undefined', () => {
    assert.equal(api.rec.recommendationHtml('<p>Hola</p>'), '<p>Hola</p>')
    assert.equal(api.rec.recommendationHtml(['Descansar', '<b>x</b> & y']), '<ul><li>Descansar</li><li>&lt;b&gt;x&lt;/b&gt; &amp; y</li></ul>')
    for (const empty of [null, undefined, '', '   ', [], ['', '  '], 12, {}]) assert.equal(api.rec.recommendationHtml(empty), undefined)
  })

  test('la lectura no modifica el dato histórico recibido', () => {
    const history = ['Uno', 'Dos']
    const copy = JSON.stringify(history)
    api.rec.recommendationHtml(history)
    api.proc.fromPublicDetail({ slug: 'a', nombre: 'A', recomendaciones_post: history, recomendaciones_revision: null })
    assert.equal(JSON.stringify(history), copy)
  })

  test('fromCmsPage / fromPublicPage', () => {
    const cms = api.rec.fromCmsPage(hubPage({ grupo: 'revision', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', image_url: 'https://x/i.jpg', is_custom: true, published: false }))
    assert.deepEqual(cms, { slug: 'cita-preanestesia', group: 'revision', custom: true, menuLabel: 'Cita', title: 'Cita de preanestesia', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', image: 'https://x/i.jpg', content: '<p>Texto</p>', published: false, procedureSlug: null })
    const pub = api.rec.fromPublicPage({ slug: 's', grupo: 'desconocido', menu_label: 'M', title: 'T', orden: 1 })
    assert.equal(pub.group, 'general')
    assert.equal(pub.published, true)
    assert.equal(pub.content, '')
    assert.equal(pub.custom, false)
    assert.equal(pub.procedureSlug, null)
    assert.equal(api.rec.fromPublicPage({ slug: 's', grupo: 'cuidados', cirugia_slug: 'lipo' }).procedureSlug, 'lipo')
  })

  test('pickPageBody: solo campos soportados; publicar/despublicar no envía nada más', () => {
    assert.deepEqual(api.rec.pickPageBody({ published: true }), { published: true })
    assert.deepEqual(api.rec.pickPageBody({ published: false }), { published: false })
    const full = api.rec.pickPageBody({ title: 'T', menuLabel: ' M ', videoUrl: '', content: '<p>x</p>', published: true, slug: 'otro', company_id: 9, linea_id: 9, is_custom: false, group: 'cuidados', id: 99 })
    assert.deepEqual(full, { title: 'T', menu_label: 'M', video_url: null, content: '<p>x</p>', published: true })
  })

  test('pickCreateBody: título + grupo válido; nunca slug ni ids', () => {
    assert.deepEqual(api.rec.pickCreateBody({ title: '  Nueva  ', group: 'cuidados', slug: 'x', company_id: 1 }), { title: 'Nueva', grupo: 'cuidados' })
    assert.deepEqual(api.rec.pickCreateBody({ title: 'N', group: 'inventado' }), { title: 'N' })
  })

  test('procedimientos: indicadores de la lista, detalle con revisión, CMS e historia', () => {
    const list = api.proc.fromPublicListItem({ slug: 'a', nombre: 'A', tiene_recomendaciones_post: true, tiene_recomendaciones_revision: false })
    assert.equal(list.tiene_recomendaciones_post, true)
    assert.equal(list.tiene_recomendaciones_revision, false)
    assert.equal(api.proc.fromPublicListItem({ slug: 'b', nombre: 'B' }).tiene_recomendaciones_post, false)

    const detail = api.proc.fromPublicDetail({ slug: 'a', nombre: 'A', recomendaciones_post: '<p>Cuida</p>', recomendaciones_revision: '<p>Revisa</p>' })
    assert.equal(detail.recomendaciones_post, '<p>Cuida</p>')
    assert.equal(detail.recomendaciones_revision, '<p>Revisa</p>')
    assert.equal(api.proc.fromPublicDetail({ slug: 'a', nombre: 'A', recomendaciones_post: ['Reposo'] }).recomendaciones_post, '<ul><li>Reposo</li></ul>')
    assert.equal(api.proc.fromPublicDetail({ slug: 'a', nombre: 'A' }).recomendaciones_revision, undefined)

    const cms = api.proc.fromCms({ id: 1, slug: 'a', nombre: 'A', es_maestro: true, editable: false, recomendaciones_post: ['x'], recomendaciones_revision: '<p>r</p>' })
    assert.equal(cms.recomendaciones_post, '<ul><li>x</li></ul>')
    assert.equal(cms.recomendaciones_revision, '<p>r</p>')
    assert.equal(cms.editable, false)
  })

  test('pickProcedureBody envía recomendaciones solo si vienen; vacío se envía como cadena vacía (Hub lo guarda como null)', () => {
    assert.deepEqual(api.proc.pickProcedureBody({ recomendaciones_post: '<p>a</p>' }), { recomendaciones_post: '<p>a</p>' })
    assert.deepEqual(api.proc.pickProcedureBody({ recomendaciones_revision: '' }), { recomendaciones_revision: '' })
    assert.deepEqual(api.proc.pickProcedureBody({ activo: true }), { activo: true })
    assert.equal('recomendaciones_post' in api.proc.pickProcedureBody({ name: 'X' }), false)
  })
})

describe('rutas admin (Nitro → Hub)', () => {
  test('lista: lee de Hub con el Bearer de la sesión y mapea', async () => {
    fresh(); adminList([hubPage(), hubPage({ id: 8, slug: 'nueva', is_custom: true, published: false })])
    const get = await api.handler('server/api/admin/recommendations/index.get.ts')
    const { value } = await run(get, makeEvent())
    assert.equal(value.data.length, 2)
    assert.equal(value.data[1].slug, 'nueva')
    assert.equal(value.data[1].custom, true)
    assert.equal(hub.last().token, HUB_TOKEN)
    assert.equal(hub.last().path, '/cms/recommendation-pages')
    // El token nunca va en la respuesta al navegador.
    assert.equal(JSON.stringify(value).includes(HUB_TOKEN), false)
  })

  test('crear: envía título y grupo; nunca slug, empresa ni línea', async () => {
    fresh(); hub.on('POST', '/cms/recommendation-pages', 201, { data: hubPage({ id: 9, slug: 'dieta', published: false, is_custom: true, grupo: 'cuidados' }) })
    const post = await api.handler('server/api/admin/recommendations/index.post.ts')
    const { value } = await run(post, makeEvent({ body: { title: 'Dieta', group: 'cuidados', slug: 'hack', company_id: 99, linea_id: 99 } }))
    assert.deepEqual(hub.last().body, { title: 'Dieta', grupo: 'cuidados' })
    assert.equal(value.slug, 'dieta')
    assert.equal(value.published, false)
  })

  test('publicar y despublicar: PUT parcial con solo "published" al id resuelto por slug', async () => {
    const put = await api.handler('server/api/admin/recommendations/[slug].put.ts')
    for (const published of [true, false]) {
      fresh(); adminList([hubPage({ id: 7, slug: 'p', published: !published, is_custom: true })])
      hub.on('PUT', '/cms/recommendation-pages/7', 200, { data: hubPage({ id: 7, slug: 'p', published, is_custom: true }) })
      const { value } = await run(put, makeEvent({ params: { slug: 'p' }, body: { published } }))
      assert.equal(value.published, published)
      const call = hub.calls.find(c => c.method === 'PUT')!
      assert.deepEqual(call.body, { published })
    }
  })

  test('editar: título, etiqueta, video y contenido; imagen nueva se sube como multipart; "" la elimina; URL existente no se reenvía', async () => {
    const put = await api.handler('server/api/admin/recommendations/[slug].put.ts')

    fresh(); adminList([hubPage({ id: 7, slug: 'p', is_custom: true })])
    hub.on('PUT', '/cms/recommendation-pages/7', 200, { data: hubPage({ id: 7, slug: 'p' }) })
    hub.on('POST', '/cms/recommendation-pages/7/image', 200, { data: hubPage({ id: 7, slug: 'p', image_url: 'https://hub/img.png' }) })
    let r = await run(put, makeEvent({ params: { slug: 'p' }, body: { title: 'T', menuLabel: 'M', videoUrl: 'https://youtu.be/dQw4w9WgXcQ', content: '<p>c</p>', image: PNG } }))
    assert.equal(r.value.image, 'https://hub/img.png')
    const upload = hub.calls.find(c => c.kind === 'upload')!
    assert.equal(upload.path, '/cms/recommendation-pages/7/image')
    assert.equal((upload.form!.get('image') as Blob).type, 'image/png')

    fresh(); adminList([hubPage({ id: 7, slug: 'p', image_url: 'https://hub/img.png' })])
    hub.on('DELETE', '/cms/recommendation-pages/7/image', 200, { data: hubPage({ id: 7, slug: 'p', image_url: null }) })
    r = await run(put, makeEvent({ params: { slug: 'p' }, body: { image: '' } }))
    assert.equal(r.value.image, '')
    assert.ok(hub.calls.some(c => c.method === 'DELETE'))

    fresh(); adminList([hubPage({ id: 7, slug: 'p', image_url: 'https://hub/img.png' })])
    hub.on('PUT', '/cms/recommendation-pages/7', 200, { data: hubPage({ id: 7, slug: 'p', image_url: 'https://hub/img.png' }) })
    r = await run(put, makeEvent({ params: { slug: 'p' }, body: { title: 'Solo título', image: 'https://hub/img.png' } }))
    assert.equal(hub.calls.some(c => c.kind === 'upload' || c.method === 'DELETE'), false)
  })

  test('imagen inválida => 422 sin llamar a Hub para subirla', async () => {
    fresh(); adminList([hubPage({ id: 7, slug: 'p' })])
    const put = await api.handler('server/api/admin/recommendations/[slug].put.ts')
    const { error } = await run(put, makeEvent({ params: { slug: 'p' }, body: { image: 'data:image/svg+xml;base64,PHN2Zz4=' } }))
    assert.equal(error.statusCode, 422)
    assert.equal(hub.calls.some(c => c.kind === 'upload'), false)
  })

  test('eliminar: páginas personalizadas se eliminan; las base responden 403 sin llamar a DELETE', async () => {
    const del = await api.handler('server/api/admin/recommendations/[slug].delete.ts')

    fresh(); adminList([hubPage({ id: 8, slug: 'mia', is_custom: true })])
    hub.on('DELETE', '/cms/recommendation-pages/8', 200, { message: 'Página eliminada.' })
    assert.deepEqual((await run(del, makeEvent({ params: { slug: 'mia' } }))).value, { ok: true })

    fresh(); adminList([hubPage({ id: 7, slug: 'cita-preanestesia', is_custom: false })])
    const { error } = await run(del, makeEvent({ params: { slug: 'cita-preanestesia' } }))
    assert.equal(error.statusCode, 403)
    assert.equal(hub.calls.some(c => c.method === 'DELETE'), false)
  })

  test('slug de otra línea / inexistente / inválido => 404 y nunca se modifica nada', async () => {
    const put = await api.handler('server/api/admin/recommendations/[slug].put.ts')
    const del = await api.handler('server/api/admin/recommendations/[slug].delete.ts')
    for (const slug of ['ajena', 'Slug Malo', '../etc']) {
      fresh(); adminList([hubPage({ id: 7, slug: 'propia' })])
      for (const fn of [put, del]) {
        const { error } = await run(fn, makeEvent({ params: { slug }, body: { published: true } }))
        assert.equal(error.statusCode, 404, slug)
      }
      assert.equal(hub.calls.some(c => c.method === 'PUT' || c.method === 'DELETE'), false)
    }
  })

  test('errores de Hub: 401 cierra la sesión, 403 / 404 / 422 con mensaje; red caída => 503', async () => {
    const post = await api.handler('server/api/admin/recommendations/index.post.ts')
    const cases: Array<[number, number]> = [[401, 401], [403, 403], [404, 404], [422, 422], [429, 429], [500, 503]]
    for (const [hubStatus, expected] of cases) {
      fresh(); hub.on('POST', '/cms/recommendation-pages', hubStatus, { message: 'msg de hub', errors: { title: ['x'] } })
      const { error } = await run(post, makeEvent({ body: { title: 'X', group: 'general' } }))
      assert.equal(error.statusCode, expected, `Hub ${hubStatus}`)
      assert.equal(hub.sessionCleared, hubStatus === 401)
      if (hubStatus === 422) {
        assert.equal(error.data.message, 'msg de hub')
        assert.deepEqual(error.data.errors, { title: ['x'] })
      }
    }
    fresh() // sin reglas => status 0 (Hub no responde)
    assert.equal((await run(post, makeEvent({ body: { title: 'X' } }))).error.statusCode, 503)
  })

  test('sin sesión de administrador => 401 y no se llama a Hub', async () => {
    fresh(); hub.token = null
    const get = await api.handler('server/api/admin/recommendations/index.get.ts')
    const { error } = await run(get, makeEvent())
    assert.equal(error.statusCode, 401)
    assert.equal(hub.calls.length, 0)
  })
})

describe('rutas públicas (Nitro → Hub /v1/web)', () => {
  test('menú: solo publicadas que entrega Hub, sin Bearer, mapeadas', async () => {
    fresh(); hub.on('GET', '/v1/web/recommendation-pages', 200, { data: [{ slug: 'a', grupo: 'general', menu_label: 'A', title: 'T', orden: 1 }, { slug: 'prequirurgicas', grupo: 'revision', menu_label: 'P', title: 'P', orden: 2 }] })
    const list = await api.handler('server/api/public/recommendations/index.get.ts')
    const { value } = await run(list, makeEvent())
    assert.deepEqual(value.map((p: any) => [p.slug, p.group]), [['a', 'general'], ['prequirurgicas', 'revision']])
    assert.equal(hub.last().kind, 'public')
    assert.equal(hub.last().token, undefined)
  })

  test('menú sin contenido: lista vacía; Hub caído => 503', async () => {
    const list = await api.handler('server/api/public/recommendations/index.get.ts')
    fresh(); hub.on('GET', '/v1/web/recommendation-pages', 200, { data: [] })
    assert.deepEqual((await run(list, makeEvent())).value, [])
    fresh()
    assert.equal((await run(list, makeEvent())).error.statusCode, 503)
  })

  test('detalle: contenido, video e imagen; no publicada / otra línea / inexistente => 404 real', async () => {
    const detail = await api.handler('server/api/public/recommendations/[slug].get.ts')
    fresh(); hub.on('GET', '/v1/web/recommendation-pages/cita', 200, { data: { slug: 'cita', grupo: 'general', menu_label: 'C', title: 'Cita', orden: 1, video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', content: '<p>Hola</p>', image_url: null } })
    const ok = (await run(detail, makeEvent({ params: { slug: 'cita' } }))).value
    assert.equal(ok.content, '<p>Hola</p>')
    assert.equal(ok.videoUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')

    fresh(); hub.on('GET', '/v1/web/recommendation-pages/borrador', 404, { message: 'No query results for model' })
    assert.equal((await run(detail, makeEvent({ params: { slug: 'borrador' } }))).error.statusCode, 404)
    fresh()
    assert.equal((await run(detail, makeEvent({ params: { slug: 'Slug Inválido' } }))).error.statusCode, 404)
    assert.equal(hub.calls.length, 0, 'un slug inválido ni siquiera consulta a Hub')
  })

  test('tenant no resuelto => 503 (no se confunde con 404 de contenido)', async () => {
    const detail = await api.handler('server/api/public/recommendations/[slug].get.ts')
    fresh(); hub.on('GET', '/v1/web/recommendation-pages/x', 404, { message: 'Tenant Linea not found or inactive' })
    assert.equal((await run(detail, makeEvent({ params: { slug: 'x' } }))).error.statusCode, 503)
  })
})

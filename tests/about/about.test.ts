// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// «Nosotros»: contenido inicial, validación, persistencia local (rutas Nitro reales sobre un directorio temporal) y control de acceso.
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT } from '../recommendations/harness.ts'

const imp = rel => import(pathToFileURL(join(ROOT, rel)).href)
const C = await imp('shared/utils/aboutContent.ts')
const PNG = 'data:image/png;base64,iVBORw0KGgo='
let dir, put, pub, adminGet, media
const state = { session: true, me: { status: 200 }, authorized: true }
const ev = (body, extra = {}) => ({ method: 'PUT', body, headers: {}, params: {}, ...extra })
const GET = (extra = {}) => ev(undefined, { method: 'GET', ...extra })
const run = async (fn, e) => { try { return { value: await fn(e) } } catch (error) { return { error } } }

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'about-'))
  const g = globalThis
  g.defineEventHandler = fn => fn
  g.readBody = async e => e.body
  g.getRouterParam = (e, n) => e.params[n]
  g.setHeader = () => {}
  g.useRuntimeConfig = () => ({ planmedContentDir: dir })
  g.createError = o => Object.assign(new Error(o.message ?? 'error'), o)
  g.authError = (statusCode, message) => g.createError({ statusCode, message, data: { message } })
  g.wellezyMe = async () => ({ ...state.me, data: state.me.status === 200 ? { user: { id: 1 } } : undefined })
  g.isAuthorizedUser = () => state.authorized
  g.assertSameOrigin = () => {}
  g.MSG_FORBIDDEN = 'forbidden'
  g.MSG_UNAVAILABLE = 'unavailable'
  Object.assign(g, C, await imp('server/utils/news.ts'), await imp('server/utils/aboutStore.ts'))
  g.adminSession = async () => {
    if (!state.session) throw g.authError(401, 'No autenticado')
    return { session: { clear: async () => {} }, token: 't' }
  }
  put = (await imp('server/api/admin/about.put.ts')).default
  adminGet = (await imp('server/api/admin/about.get.ts')).default
  pub = (await imp('server/api/public/about/index.get.ts')).default
  media = (await imp('server/api/public/about/media/[name].get.ts')).default
})
after(() => rmSync(dir, { recursive: true, force: true }))

const fresh = () => structuredClone(C.aboutDefaultContent())

describe('contenido inicial', () => {
  test('conserva las cinco preguntas, los tres párrafos y el video institucional', () => {
    const c = C.aboutDefaultContent()
    assert.equal(c.faqs.length, 5)
    assert.equal(c.institutional.paragraphs.length, 3)
    assert.equal(C.aboutYoutubeId(c.video.url), 'zsNBJjsvjMg')
    assert.equal(c.hero.title, 'NUESTRO EQUIPO')
    assert.deepEqual(C.validateAboutContent(c), {})
  })
  test('contacto: solo datos verificados (sin horario ni mapa inventados)', () => {
    const k = C.aboutDefaultContent().contact
    assert.equal(k.phone, '+57 318 8043382')
    assert.equal(k.email, 'planmedequipodetrabajo@gmail.com')
    assert.equal(k.schedule, '')
    assert.equal(k.map.enabled, false)
  })
  test('la imagen de portada existe en public/', () => {
    assert.ok(existsSync(join(ROOT, 'public', C.aboutDefaultContent().hero.image)))
  })
})

describe('validación', () => {
  test('YouTube: acepta formatos válidos y rechaza otros', () => {
    for (const u of ['https://www.youtube.com/watch?v=zsNBJjsvjMg', 'https://youtu.be/zsNBJjsvjMg', 'https://www.youtube.com/embed/zsNBJjsvjMg', 'https://www.youtube.com/shorts/zsNBJjsvjMg']) assert.equal(C.aboutYoutubeId(u), 'zsNBJjsvjMg', u)
    for (const u of ['', 'javascript:alert(1)', 'https://evil.example/watch?v=zsNBJjsvjMg', 'https://youtube.com.evil.example/watch?v=zsNBJjsvjMg', '<iframe src="x">', 'https://www.youtube.com/watch?v=corto']) assert.equal(C.aboutYoutubeId(u), null, u)
  })
  test('el reproductor no hace autoplay', () => assert.ok(!C.aboutYoutubeEmbedUrl('zsNBJjsvjMg').includes('autoplay')))
  test('campos obligatorios, correo, teléfono y redes', () => {
    const c = fresh()
    c.hero.title = ''; c.contact.email = 'x'; c.contact.phone = 'abc'; c.contact.socials.instagram = 'https://evil.example/planmed'; c.video.url = 'nope'
    const e = C.validateAboutContent(c)
    for (const k of ['hero.title', 'contact.email', 'contact.phone', 'contact.socials.instagram', 'video.url']) assert.ok(e[k], k)
  })
  test('pregunta activa exige pregunta y respuesta; inactiva puede estar incompleta', () => {
    const c = fresh()
    c.faqs[0].answer = ''
    assert.ok(C.validateAboutContent(c)['faqs.0.answer'])
    c.faqs[0].active = false
    assert.equal(C.validateAboutContent(c)['faqs.0.answer'], undefined)
  })
  test('el mapa requiere dirección y ciudad', () => {
    const c = fresh(); c.contact.map.enabled = true; c.contact.city = ''
    assert.ok(C.validateAboutContent(c)['contact.map'])
  })
  test('vista pública omite preguntas inactivas', () => {
    const c = fresh(); c.faqs[1].active = false
    assert.equal(C.aboutPublicView(c).faqs.length, 4)
  })
  test('normalizar un cuerpo parcial no borra datos existentes', () => {
    const cur = fresh()
    const n = C.normalizeAboutContent({ hero: { title: 'OTRO' } }, cur)
    assert.equal(n.hero.title, 'OTRO')
    assert.equal(n.contact.phone, cur.contact.phone)
    assert.equal(n.faqs.length, 5)
    assert.equal(n.institutional.legal, cur.institutional.legal)
  })
})

describe('persistencia y acceso', () => {
  test('sin archivo guardado el público recibe el contenido inicial', async () => {
    assert.equal((await pub(GET())).faqs.length, 5)
  })

  test('sin sesión => 401 y nada se escribe', async () => {
    state.session = false
    const { error } = await run(put, ev(fresh()))
    assert.equal(error.statusCode, 401)
    assert.ok(!existsSync(join(dir, 'about.json')))
    state.session = true
  })

  test('usuario sin rol autorizado => 403 y nada se escribe', async () => {
    state.authorized = false
    const { error } = await run(put, ev(fresh()))
    assert.equal(error.statusCode, 403)
    assert.ok(!existsSync(join(dir, 'about.json')))
    state.authorized = true
  })

  test('Hub devuelve 401 => 401; Hub caído => 503', async () => {
    state.me = { status: 401 }
    assert.equal((await run(put, ev(fresh()))).error.statusCode, 401)
    state.me = { status: 500 }
    assert.equal((await run(put, ev(fresh()))).error.statusCode, 503)
    state.me = { status: 200 }
  })

  test('datos inválidos => 422 con errores por campo y no se escribe', async () => {
    const c = fresh(); c.video.url = 'https://evil.example/x'
    const { error } = await run(put, ev(c))
    assert.equal(error.statusCode, 422)
    assert.ok(error.data.errors['video.url'])
    assert.ok(!existsSync(join(dir, 'about.json')))
  })

  test('guardar persiste, el público lo refleja y el video se canoniza', async () => {
    const c = fresh()
    c.hero.title = 'NUESTRO EQUIPO ACTUALIZADO'
    c.video.url = 'https://youtu.be/zsNBJjsvjMg'
    c.faqs[2].active = false
    const { value, error } = await run(put, ev(c))
    assert.ok(!error, error?.message)
    assert.ok(value.updatedAt)
    assert.equal(value.video.url, 'https://www.youtube.com/watch?v=zsNBJjsvjMg')
    assert.ok(existsSync(join(dir, 'about.json')))
    const p = await pub(GET())
    assert.equal(p.hero.title, 'NUESTRO EQUIPO ACTUALIZADO')
    assert.equal(p.faqs.length, 4)
    assert.equal((await adminGet(GET())).faqs.length, 5) // el admin ve también las inactivas
  })

  test('un cuerpo parcial no pierde datos guardados', async () => {
    const cur = await adminGet(GET())
    const { value } = await run(put, ev({ updatedAt: cur.updatedAt, contact: { phone: '+57 300 1234567' } }))
    assert.equal(value.contact.phone, '+57 300 1234567')
    assert.equal(value.hero.title, 'NUESTRO EQUIPO ACTUALIZADO')
    assert.equal(value.faqs.length, 5)
  })

  test('texto enriquecido: se conserva el formato permitido y se elimina el HTML peligroso', async () => {
    const cur = await adminGet(GET())
    const body = structuredClone(cur)
    body.institutional.legal = '<p>Texto <strong>legal</strong></p><script>alert(1)</script><img src=x onerror=alert(1)>'
    body.institutional.paragraphs[0] = '<h2>Título</h2><ul><li>Uno</li></ul><p><a href="javascript:alert(1)">mal</a> <a href="https://planmed.com">bien</a></p>'
    body.faqs[0].answer = '<p>Respuesta <em>en cursiva</em></p><iframe src="https://evil.example"></iframe>'
    body.contact.schedule = 'Lunes a viernes'
    const { value, error } = await run(put, ev(body))
    assert.ok(!error, error?.message)
    assert.equal(value.institutional.legal, '<p>Texto <strong>legal</strong></p>')
    assert.ok(value.institutional.paragraphs[0].includes('<h2>Título</h2><ul><li>Uno</li></ul>'))
    assert.ok(!value.institutional.paragraphs[0].includes('javascript:'))
    assert.ok(value.institutional.paragraphs[0].includes('href="https://planmed.com"'))
    assert.equal(value.faqs[0].answer, '<p>Respuesta <em>en cursiva</em></p>')
    assert.equal(value.contact.schedule, '<p>Lunes a viernes</p>') // texto plano heredado => párrafo
  })

  test('un editor vacío en un campo obligatorio se rechaza', async () => {
    const cur = await adminGet(GET())
    const { error } = await run(put, ev({ ...cur, institutional: { ...cur.institutional, legal: '<p></p>' } }))
    assert.equal(error.statusCode, 422)
    assert.ok(error.data.errors['institutional.legal'])
  })

  test('edición concurrente desactualizada => 409', async () => {
    const { error } = await run(put, ev({ ...fresh(), updatedAt: '2000-01-01T00:00:00.000Z' }))
    assert.equal(error.statusCode, 409)
  })

  test('imagen subida: se guarda, se sirve y la anterior se elimina al reemplazarla', async () => {
    const cur = await adminGet(GET())
    const { value, error } = await run(put, ev({ ...cur, hero: { ...cur.hero, image: PNG } }))
    assert.ok(!error, error?.message)
    assert.match(value.hero.image, /^\/api\/public\/about\/media\/hero-[a-z0-9-]+\.png$/)
    const name = value.hero.image.split('/').pop()
    assert.ok(existsSync(join(dir, 'media', name)))
    assert.ok((await media(GET({ params: { name } }))).length > 0)
    assert.equal((await run(media, GET({ params: { name: '../about.json' } }))).error.statusCode, 404)
    const next = await run(put, ev({ ...value, hero: { ...value.hero, image: PNG } }))
    assert.ok(!next.error, next.error?.message)
    assert.ok(!existsSync(join(dir, 'media', name)))
    assert.notEqual(next.value.hero.image, value.hero.image)
  })

  test('imagen que no es JPG/PNG/WebP => 422', async () => {
    const cur = await adminGet(GET())
    const { error } = await run(put, ev({ ...cur, hero: { ...cur.hero, image: 'data:image/svg+xml;base64,PHN2Zz4=' } }))
    assert.equal(error.statusCode, 422)
  })

  test('archivo dañado: el público cae al contenido inicial y el guardado no lo sobrescribe a ciegas', async () => {
    writeFileSync(join(dir, 'about.json'), '{no es json')
    assert.equal((await pub(GET())).faqs.length, 5)
    const { error } = await run(put, ev(fresh()))
    assert.equal(error.statusCode, 500)
    assert.equal(readFileSync(join(dir, 'about.json'), 'utf8'), '{no es json')
  })
})

describe('alcance', () => {
  test('la página y la administración no usan Hub, almacenamiento del navegador ni HTML sin escapar', () => {
    for (const rel of ['server/utils/aboutStore.ts', 'server/api/admin/about.put.ts', 'server/api/public/about/index.get.ts', 'services/AboutService.ts', 'pages/admin/nosotros.vue', 'pages/nosotros.vue']) {
      const src = readFileSync(join(ROOT, rel), 'utf8')
      assert.ok(!/wellezyRequest|wellezyUpload|hubNews|localStorage.(get|set)Item|v-html/.test(src), rel)
    }
  })
})

// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Páginas informativas simples (Clínicas aliadas, Estudio de créditos): persistencia local, saneamiento, acceso y menú del admin.
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT } from '../recommendations/harness.ts'

const imp = rel => import(pathToFileURL(join(ROOT, rel)).href)
const S = await imp('shared/utils/sitePages.ts')
let dir, get, put, pub
const state = { session: true, authorized: true }
const ev = (slug, body, method = 'PUT') => ({ method, body, headers: {}, params: { slug } })
const run = async (fn, e) => { try { return { value: await fn(e) } } catch (error) { return { error } } }

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'pages-'))
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
  Object.assign(g, S, await imp('server/utils/news.ts'), await imp('server/utils/aboutStore.ts'), await imp('server/utils/sitePages.ts'))
  g.adminSession = async () => {
    if (!state.session) throw g.authError(401, 'No autenticado')
    return { session: { clear: async () => {} }, token: 't' }
  }
  get = (await imp('server/api/admin/pages/[slug].get.ts')).default
  put = (await imp('server/api/admin/pages/[slug].put.ts')).default
  pub = (await imp('server/api/public/pages/[slug].get.ts')).default
})
after(() => rmSync(dir, { recursive: true, force: true }))

describe('páginas informativas administrables', () => {
  test('slug desconocido => 404 (también para rutas de path traversal)', async () => {
    for (const slug of ['otra', '../about', 'quienes-somos']) {
      assert.equal((await run(pub, ev(slug, undefined, 'GET'))).error.statusCode, 404, slug)
      assert.equal((await run(put, ev(slug, { title: 'x' }))).error.statusCode, 404, slug)
    }
  })

  test('sin contenido guardado: título por defecto y cuerpo vacío (sin texto inventado)', async () => {
    const p = await pub(ev('clinicas-aliadas', undefined, 'GET'))
    assert.equal(p.title, 'Clínicas aliadas')
    assert.equal(p.body, '')
  })

  test('sin sesión => 401; sin rol autorizado => 403; no se escribe nada', async () => {
    state.session = false
    assert.equal((await run(put, ev('clinicas-aliadas', { title: 'X' }))).error.statusCode, 401)
    assert.equal((await run(get, ev('clinicas-aliadas', undefined, 'GET'))).error.statusCode, 401)
    state.session = true
    state.authorized = false
    assert.equal((await run(put, ev('clinicas-aliadas', { title: 'X' }))).error.statusCode, 403)
    state.authorized = true
    assert.ok(!existsSync(join(dir, 'pages', 'clinicas-aliadas.json')))
  })

  test('guardar persiste, sanea el HTML y el público lo refleja', async () => {
    const { value, error } = await run(put, ev('clinicas-aliadas', { title: 'Clínicas aliadas', subtitle: 'Red', body: '<p>Hola <strong>mundo</strong></p><script>alert(1)</script>' }))
    assert.ok(!error, error?.message)
    assert.equal(value.body, '<p>Hola <strong>mundo</strong></p>')
    assert.ok(existsSync(join(dir, 'pages', 'clinicas-aliadas.json')))
    const p = await pub(ev('clinicas-aliadas', undefined, 'GET'))
    assert.equal(p.subtitle, 'Red')
    assert.equal(p.body, '<p>Hola <strong>mundo</strong></p>')
    assert.equal((await run(pub, ev('estudio-de-creditos', undefined, 'GET'))).error.statusCode, 404) // ya no es una página administrable
  })

  test('título vacío => 422; cuerpo parcial no borra datos; edición desactualizada => 409', async () => {
    const cur = await get(ev('clinicas-aliadas', undefined, 'GET'))
    const bad = await run(put, ev('clinicas-aliadas', { ...cur, title: '' }))
    assert.equal(bad.error.statusCode, 422)
    assert.ok(bad.error.data.errors.title)
    const ok = await run(put, ev('clinicas-aliadas', { updatedAt: cur.updatedAt, subtitle: 'Nueva' }))
    assert.equal(ok.value.subtitle, 'Nueva')
    assert.equal(ok.value.body, '<p>Hola <strong>mundo</strong></p>')
    const stale = await run(put, ev('clinicas-aliadas', { ...cur, updatedAt: '2000-01-01T00:00:00.000Z' }))
    assert.equal(stale.error.statusCode, 409)
  })
})

describe('menú y páginas', () => {
  test('existen las rutas públicas y el submenú del admin solo lista las administrables', () => {
    const layout = readFileSync(join(ROOT, 'layouts/admin.vue'), 'utf8')
    for (const route of ['/quienes-somos', '/clinicas-aliadas', '/estudio-de-creditos', '/informacion-precontractual', '/politica-datos-personales']) {
      const file = join(ROOT, 'pages', `${route.slice(1)}.vue`)
      assert.ok(existsSync(file), file)
    }
    assert.ok(!layout.includes('/admin/paginas/estudio-de-creditos'), 'Estudio de créditos no va en el menú del admin')
    for (const to of ['/admin/nosotros', '/admin/paginas/clinicas-aliadas']) assert.ok(layout.includes(`'${to}'`), to)
    for (const to of ['/quienes-somos', '/informacion-precontractual', '/politica-datos-personales']) assert.ok(!layout.includes(to), `${to} no es administrable: no va en el menú del admin`)
  })

  test('el menú del admin queda fijo: la ventana no se desplaza, solo el contenido', () => {
    const layout = readFileSync(join(ROOT, 'layouts/admin.vue'), 'utf8')
    assert.match(layout, /h-screen overflow-hidden/)
    assert.match(layout, /<main class="[^"]*overflow-y-auto/)
  })

  test('Servicios está dentro del desplegable Planmed (no suelto) y usa los videos entregados', () => {
    assert.ok(existsSync(join(ROOT, 'pages/servicios.vue')))
    const nav = readFileSync(join(ROOT, 'components/layout/Navbar.vue'), 'utf8')
    assert.ok(nav.includes("to: '/servicios'"), 'opción de Planmed (escritorio y móvil comparten planmedItems)')
    assert.ok(!nav.includes('to="/servicios"'), 'sin enlace suelto en la barra')
    const page = readFileSync(join(ROOT, 'pages/servicios.vue'), 'utf8')
    for (const id of ['rH1wWM51SGM', 'x9ZPOewX4vk']) assert.ok(page.includes(id), id)
    assert.ok(!/autoplay|v-html/.test(page))
  })

  test('Financiación incluye el simulador; /simulador ya no existe como página y redirige; el menú no tiene «Financiación»', () => {
    assert.ok(existsSync(join(ROOT, 'pages/financiacion.vue')))
    assert.ok(!existsSync(join(ROOT, 'pages/simulador.vue')))
    assert.ok(existsSync(join(ROOT, 'components/simulator/SimulatorPanel.vue')))
    const page = readFileSync(join(ROOT, 'pages/financiacion.vue'), 'utf8')
    assert.ok(page.includes('NnAkWAmmK4A') && page.includes('<SimulatorPanel') && page.includes('id="calculadora"'))
    assert.ok(page.includes('href="#calculadora"'), 'botón de la cabecera hacia el simulador')
    for (const k of ['AboutFaqAccordion', 'AboutContactSection']) assert.ok(page.includes(k), k)
    assert.ok(!/autoplay|v-html/.test(page))
    const cfg = readFileSync(join(ROOT, 'nuxt.config.ts'), 'utf8')
    assert.match(cfg, /'\/simulador': \{ redirect: \{ to: '\/financiacion'/)
    const nav = readFileSync(join(ROOT, 'components/layout/Navbar.vue'), 'utf8')
    assert.ok(!nav.includes('to="/financiacion"') && !nav.includes("to: '/financiacion'"), 'sin entrada «Financiación» en el menú')
    assert.ok(nav.includes('to="/financiacion#calculadora"'), 'botón «Simular financiación» hacia el simulador')
  })

  test('ningún enlace interno apunta ya a /simulador', async () => {
    const { readdirSync, statSync } = await import('node:fs')
    const bad = []
    const walk = (d) => { for (const n of readdirSync(d)) { const f = join(d, n); if (statSync(f).isDirectory()) { if (!['node_modules', '.nuxt', '.output', '.git', 'tests', 'documentacion'].includes(n)) walk(f) } else if (/\.(vue|ts)$/.test(n) && !f.endsWith('nuxt.config.ts')) { if (/['"`]\/simulador(?![a-z-])/.test(readFileSync(f, 'utf8'))) bad.push(f) } } }
    walk(ROOT)
    assert.deepEqual(bad, [])
  })

  test('Programa de referidos: contenido entregado, formulario maquetado con aviso y sin envío', () => {
    const page = readFileSync(join(ROOT, 'pages/testimonios/programa-de-referidos.vue'), 'utf8')
    assert.ok(page.includes('<ReferralProgramContent') && page.includes('<ReferralForm'))
    const content = readFileSync(join(ROOT, 'components/referral/ProgramContent.vue'), 'utf8')
    for (const t of ['Programa de Remisión de Pacientes', 'hasta 10 días hábiles', '315 785 7783', 'después de 4 meses']) assert.ok(content.includes(t), t)
    const form = readFileSync(join(ROOT, 'components/referral/ReferralForm.vue'), 'utf8')
    assert.ok(form.includes('data-testid="referral-form-not-functional"') && form.includes('role="alert"'))
    assert.ok(form.includes('@submit.prevent') && !/\$fetch|useFetch|fetch\(|axios/.test(form), 'no envía datos')
    assert.ok(!/v-html|localStorage/.test(content + form))
  })
})

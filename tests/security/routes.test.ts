// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Matriz de seguridad de TODAS las rutas Nitro administrativas (server/api/admin/**) y de auth (login/logout):
// mutaciones sin señal de origen o de otro origen => 403 (PM-SEC-01), sin sesión => 401, y en ninguno de esos casos se llama a Hub.
import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT } from '../recommendations/harness.ts'

const HOST = 'planmed.test'
const hubCalls = []
const sessions = { current: null }
let handlers = []

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    statSync(p).isDirectory() ? walk(p, out) : out.push(p)
  }
  return out
}
const imp = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

before(async () => {
  const g = globalThis
  g.defineEventHandler = fn => fn
  g.readBody = async e => e.body
  g.getRouterParam = (e, n) => e.params[n]
  g.getQuery = () => ({})
  g.setHeader = () => {}
  g.getRequestHeader = (e, name) => e.headers[name.toLowerCase()]
  g.createError = o => Object.assign(new Error(o.message ?? o.statusMessage ?? 'error'), o)
  g.authError = (statusCode, message) => g.createError({ statusCode, message, data: { message } })
  g.useAdminSession = async e => ({ data: e.session ?? {}, clear: async () => {}, update: async () => {} })
  g.wellezyRequest = async (...args) => { hubCalls.push(args); return { status: 0 } }
  g.wellezyUpload = async (...args) => { hubCalls.push(args); return { status: 0 } }
  g.wellezyPublicGet = async (...args) => { hubCalls.push(args); return { status: 0 } }
  g.wellezyMe = async (...args) => { hubCalls.push(args); return { status: 0 } }
  g.wellezyLogin = async (...args) => { hubCalls.push(args); return { status: 0 } }
  g.isAuthorizedUser = () => false
  g.MSG_FORBIDDEN = 'forbidden'
  g.MSG_UNAVAILABLE = 'unavailable'
  g.wellezyLogout = async (...args) => { hubCalls.push(args); return 0 }

  for (const rel of ['server/utils/origin.ts', 'server/utils/news.ts', 'server/utils/procedures.ts', 'server/utils/prp.ts', 'server/utils/patients.ts', 'server/utils/recommendations.ts', 'server/utils/recommendationAdmin.ts', 'server/utils/procedureSections.ts', 'server/utils/newsSections.ts', 'shared/utils/aboutContent.ts', 'server/utils/aboutStore.ts', 'shared/utils/sitePages.ts', 'server/utils/sitePages.ts', 'shared/utils/clinics.ts', 'server/utils/clinics.ts', 'shared/utils/financing.ts', 'server/utils/financingRate.ts']) {
    Object.assign(g, await imp(rel))
  }

  const files = [...walk(join(ROOT, 'server/api/admin')), join(ROOT, 'server/api/auth/login.post.ts'), join(ROOT, 'server/api/auth/logout.post.ts')]
    // access.get y line-users.get usan requireAreaLeader (consulta /auth/me a Hub); se cubren aparte (tests/about/line-users.test.ts).
    .filter(f => !f.endsWith(`config${sep}access.get.ts`) && !f.endsWith(`config${sep}line-users.get.ts`))
  handlers = await Promise.all(files.map(async f => {
    const rel = relative(ROOT, f).split(sep).join('/')
    const method = /\.(get|post|put|delete|patch)\.ts$/.exec(rel)[1].toUpperCase()
    return { rel, method, fn: (await imp(rel)).default }
  }))
})

const event = (method, extra = {}) => ({ method, params: { id: '1', slug: 'una-pagina' }, body: { title: 'x', name: 'x', videos: [], instagram: [], beforeAfter: [] }, headers: {}, session: undefined, ...extra })
const call = async (fn, e) => { try { return { value: await fn(e) } } catch (error) { return { error } } }
const loggedIn = { token: 'hub-secret-token', user: { id: 1, name: 'U', email: 'u@x.test', role: { id: 1, name: 'R' } } }

describe('inventario', () => {
  test('se auditan todas las rutas admin (no hay ninguna sin cubrir)', () => {
    assert.equal(handlers.length, 44, `rutas auditadas: ${handlers.length} (si se agrega una ruta admin, esta matriz debe cubrirla)`)
    const names = handlers.map(h => h.rel)
    for (const must of ['server/api/admin/recommendations/[slug].put.ts', 'server/api/admin/about.put.ts', 'server/api/admin/pages/[slug].put.ts', 'server/api/admin/clinics.put.ts', 'server/api/admin/clinics/upload.post.ts', 'server/api/admin/patient-section.put.ts', 'server/api/admin/procedures/index.post.ts', 'server/api/admin/news/index.post.ts', 'server/api/admin/prp/index.post.ts', 'server/api/admin/config/financing-rate.put.ts', 'server/api/admin/config/financing-rate.get.ts', 'server/api/auth/login.post.ts', 'server/api/admin/recommendation-tree/[...path].get.ts', 'server/api/admin/recommendation-tree/[...path].post.ts', 'server/api/admin/recommendation-tree/[...path].put.ts', 'server/api/admin/recommendation-tree/[...path].delete.ts', 'server/api/admin/procedure-sections/[...path].get.ts', 'server/api/admin/procedure-sections/[...path].post.ts', 'server/api/admin/procedure-sections/[...path].put.ts', 'server/api/admin/procedure-sections/[...path].delete.ts', 'server/api/admin/news-sections/[...path].get.ts', 'server/api/admin/news-sections/[...path].post.ts', 'server/api/admin/news-sections/[...path].put.ts', 'server/api/admin/news-sections/[...path].delete.ts']) {
      assert.ok(names.includes(must), must)
    }
  })

  test('las rutas públicas son solo GET', () => {
    for (const f of walk(join(ROOT, 'server/api/public'))) assert.match(f, /\.get\.ts$/, f)
  })
})

describe('PM-SEC-01: mutaciones deben demostrar el mismo origen (falla cerrado)', () => {
  test('sin Origin, Sec-Fetch-Site ni Referer => 403 y Hub no se toca (con sesión válida)', async () => {
    for (const h of handlers.filter(h => h.method !== 'GET')) {
      hubCalls.length = 0
      const { error } = await call(h.fn, event(h.method, { headers: { host: HOST }, session: loggedIn }))
      assert.equal(error?.statusCode, 403, `${h.method} ${h.rel}`)
      assert.equal(hubCalls.length, 0, `${h.rel} no debe llamar a Hub`)
    }
  })

  test('otro origen (Origin, Sec-Fetch-Site o Referer ajenos, Origin: null) => 403', async () => {
    const hostile = [
      { origin: 'https://evil.example' }, { origin: 'null' }, { origin: 'https://planmed.test.evil.example' },
      { 'sec-fetch-site': 'cross-site' }, { 'sec-fetch-site': 'same-site' }, { 'sec-fetch-site': 'none' },
      { referer: 'https://evil.example/page' }
    ]
    for (const h of handlers.filter(h => h.method !== 'GET')) {
      for (const headers of hostile) {
        hubCalls.length = 0
        const { error } = await call(h.fn, event(h.method, { headers: { host: HOST, ...headers }, session: loggedIn }))
        assert.equal(error?.statusCode, 403, `${h.method} ${h.rel} ${JSON.stringify(headers)}`)
        assert.equal(hubCalls.length, 0)
      }
    }
  })

  test('Origin ajeno gana sobre un Sec-Fetch-Site same-origin falsificado', async () => {
    const h = handlers.find(x => x.rel.endsWith('recommendations/[slug].put.ts'))
    const { error } = await call(h.fn, event('PUT', { headers: { host: HOST, origin: 'https://evil.example', 'sec-fetch-site': 'same-origin' }, session: loggedIn }))
    assert.equal(error?.statusCode, 403)
  })

  test('las tres señales legítimas del navegador (Origin, Sec-Fetch-Site same-origin, Referer) pasan el control de origen', async () => {
    const h = handlers.find(x => x.rel.endsWith('recommendations/[slug].put.ts'))
    for (const headers of [{ origin: `https://${HOST}` }, { 'sec-fetch-site': 'same-origin' }, { referer: `https://${HOST}/admin/recomendaciones` }]) {
      const { error } = await call(h.fn, event('PUT', { headers: { host: HOST, ...headers }, session: loggedIn }))
      assert.notEqual(error?.statusCode, 403, JSON.stringify(headers)) // llega a Hub (503 simulado)
    }
  })

  test('detrás de un proxy se compara con X-Forwarded-Host', async () => {
    const h = handlers.find(x => x.rel.endsWith('recommendations/[slug].put.ts'))
    const ok = await call(h.fn, event('PUT', { headers: { host: 'internal:3000', 'x-forwarded-host': HOST, origin: `https://${HOST}` }, session: loggedIn }))
    assert.notEqual(ok.error?.statusCode, 403)
    const bad = await call(h.fn, event('PUT', { headers: { host: HOST, 'x-forwarded-host': 'otro.test', origin: `https://${HOST}` }, session: loggedIn }))
    assert.equal(bad.error?.statusCode, 403)
  })
})

describe('autenticación: sin sesión nada llega a Hub', () => {
  test('mutaciones con origen válido y sin sesión => 401', async () => {
    for (const h of handlers.filter(h => h.method !== 'GET' && !h.rel.includes('/auth/'))) {
      hubCalls.length = 0
      const { error } = await call(h.fn, event(h.method, { headers: { host: HOST, origin: `https://${HOST}` } }))
      assert.equal(error?.statusCode, 401, `${h.method} ${h.rel}`)
      assert.equal(hubCalls.length, 0, `${h.rel} no debe llamar a Hub`)
    }
  })

  test('lecturas admin sin sesión => 401', async () => {
    for (const h of handlers.filter(h => h.method === 'GET')) {
      hubCalls.length = 0
      const { error } = await call(h.fn, event('GET', { headers: { host: HOST } }))
      assert.equal(error?.statusCode, 401, h.rel)
      assert.equal(hubCalls.length, 0)
    }
  })

  test('una sesión sin token o sin usuario no cuenta como sesión', async () => {
    const h = handlers.find(x => x.rel.endsWith('recommendations/index.get.ts'))
    for (const session of [{}, { token: 'x' }, { user: loggedIn.user }]) {
      const { error } = await call(h.fn, event('GET', { headers: { host: HOST }, session }))
      assert.equal(error?.statusCode, 401)
    }
  })

  test('el 422 de validación del guardado de pacientes no se adelanta a la autenticación', async () => {
    const h = handlers.find(x => x.rel.endsWith('patient-section.put.ts'))
    const { error } = await call(h.fn, event('PUT', { headers: { host: HOST, origin: `https://${HOST}` }, body: { videos: 'no-es-lista' } }))
    assert.equal(error?.statusCode, 401)
  })
})

describe('login y logout', () => {
  test('exigen el mismo origen antes de hacer nada', async () => {
    for (const rel of ['server/api/auth/login.post.ts', 'server/api/auth/logout.post.ts']) {
      const h = handlers.find(x => x.rel === rel)
      hubCalls.length = 0
      const { error } = await call(h.fn, event('POST', { headers: { host: HOST }, body: { email: 'a@b.test', password: 'x' } }))
      assert.equal(error?.statusCode, 403, rel)
      assert.equal(hubCalls.length, 0)
    }
  })
})

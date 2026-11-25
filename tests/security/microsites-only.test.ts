// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// «Asesora financiera»: el panel se limita a Micrositios en la navegación, el menú y la API. Se ejecuta el código REAL (reglas compartidas,
// auth.ts, wellezy.ts, el middleware del servidor y las rutas de Micrositios) sobre un servidor h3 en 127.0.0.1. Solo Hub está simulado.
import { test, describe, before, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import http from 'node:http'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, relative, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT } from '../recommendations/harness.ts'

const url = path => pathToFileURL(path).href
const imp = rel => import(url(join(ROOT, rel)))
const read = rel => readFileSync(join(ROOT, rel), 'utf8')
const ASESORA = 'Asesora financiera'
const user = (role, over = {}) => ({ id: 1, name: 'U', email: 'u@x.test', role: role === null ? null : { id: 30, name: role }, is_area_leader: false, is_global_admin: false, must_change_password: false, permissions: ['prp_referrers.ver'], company: { slug: 'planmed' }, line: { slug: 'planmed' }, ...over })
/** Perfiles que NO deben cambiar. */
const OTHERS = {
  'líder': user('Líder', { is_area_leader: true }),
  'asesora que además es líder': user(ASESORA, { is_area_leader: true }),
  'diseñador gráfico': user('Diseñador gráfico'),
  'administrador': user('admin'),
  'administrador de contenido': user('Administrador de contenido de línea'),
  'superadmin': user(null, { is_global_admin: true, company: null, line: null }),
  'superadmin con rol principal de asesora': user(ASESORA, { is_global_admin: true })
}

const hub = { user: null, me: 200, prp: 200, calls: [] }
let gate, auth, dir, saved, server, port

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'microsites-only-'))
  const h3 = await import(url(createRequire(join(ROOT, 'package.json')).resolve('h3')))
  saved = new Map()
  const define = (name, value) => { if (!saved.has(name)) saved.set(name, globalThis[name]); globalThis[name] = value }
  for (const [name, value] of Object.entries(h3)) if (typeof value === 'function') define(name, value)
  define('useRuntimeConfig', () => ({ sessionPassword: 'x'.repeat(40), wellezyApiBaseUrl: 'http://hub.test/api', wellezyCompanySlug: 'planmed', wellezyLineSlug: 'planmed', planmedContentEditorRoleIds: '' }))
  define('canManageFinancingRate', () => false)
  define('$fetch', { raw: async (full, opts) => {
    const path = String(full).replace('http://hub.test/api', '')
    hub.calls.push({ path, method: opts.method })
    if (path === '/auth/me') return { status: hub.me, _data: hub.me === 200 ? { user: hub.user } : {} }
    return { status: hub.prp, _data: { data: [] } }
  } })
  gate = await imp('shared/utils/adminPasswordGate.ts')
  writeFileSync(join(dir, 'wellezy.ts'), read('server/utils/wellezy.ts'))
  writeFileSync(join(dir, 'auth.ts'), read('server/utils/auth.ts').replaceAll("'./wellezy'", "'./wellezy.ts'"))
  const wellezy = await import(url(join(dir, 'wellezy.ts')))
  auth = await import(url(join(dir, 'auth.ts')))
  for (const mod of [gate, wellezy, auth, await imp('server/utils/origin.ts'), await imp('server/utils/prp.ts')]) for (const [n, v] of Object.entries(mod)) define(n, v)

  const app = h3.createApp()
  // Inicio de sesión de prueba: guarda en la cookie sellada lo que el servidor guardaría para ese usuario.
  app.use('/test/session', h3.defineEventHandler(async e => {
    const session = await auth.useAdminSession(e)
    await session.update({ token: 'tk', user: auth.toPublicUser(hub.user, e) })
    return {}
  }))
  app.use((await imp('server/middleware/admin-microsites-only.ts')).default)
  const router = h3.createRouter()
  router.get('/api/admin/prp', (await imp('server/api/admin/prp/index.get.ts')).default)
  router.post('/api/admin/prp', (await imp('server/api/admin/prp/index.post.ts')).default)
  router.get('/api/admin/prp/:id', (await imp('server/api/admin/prp/[id].get.ts')).default)
  router.put('/api/admin/prp/:id', (await imp('server/api/admin/prp/[id].put.ts')).default)
  router.delete('/api/admin/prp/:id', (await imp('server/api/admin/prp/[id].delete.ts')).default)
  app.use(router)
  // Lo que el middleware deja pasar bajo /api/admin/ responde 200 aquí. Como el enrutador de Nitro, no resuelve `..`: una ruta que no
  // empieza literalmente por /api/admin/ no ejecuta ningún manejador administrativo (404).
  app.use(h3.defineEventHandler(e => {
    if (!/^\/api\/admin\//.test(e.path)) throw h3.createError({ statusCode: 404 })
    return { passed: true }
  }))
  server = http.createServer(h3.toNodeListener(app))
  await new Promise(r => server.listen(0, '127.0.0.1', r))
  port = server.address().port
})
after(() => {
  server?.closeAllConnections(); server?.close()
  rmSync(dir, { recursive: true, force: true })
  for (const [name, value] of saved) globalThis[name] = value
})
beforeEach(() => { Object.assign(hub, { me: 200, prp: 200, calls: [] }) })

function send(path, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body)
    const req = http.request({ host: '127.0.0.1', port, path, method, headers: { host: `127.0.0.1:${port}`, origin: `http://127.0.0.1:${port}`, ...(data ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(data) } : {}), ...headers } }, res => {
      let text = ''
      res.on('data', d => { text += d })
      res.on('end', () => { let json; try { json = JSON.parse(text) } catch {} resolve({ status: res.statusCode, json, headers: res.headers }) })
    })
    req.on('error', reject)
    req.end(data)
  })
}
async function signIn(who) {
  hub.user = who
  const cookie = (await send('/test/session')).headers['set-cookie'].at(-1).split(';')[0]
  hub.calls = []
  return (path, opts = {}) => send(path, { ...opts, headers: { cookie, ...opts.headers } })
}

/** Todas las rutas de server/api/admin, con su método. */
function adminRoutes() {
  const api = join(ROOT, 'server/api')
  const walk = d => readdirSync(d).flatMap(n => statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)])
  return walk(join(api, 'admin')).map(f => relative(api, f).split(sep).join('/')).map(f => {
    const [, route, method] = /^(.*)\.(get|post|put|delete|patch)\.ts$/.exec(f)
    return [method.toUpperCase(), '/api/' + route.replace(/\/index$/, '').replace('[id]', '1').replace('[slug]', 'ejemplo').replace('[...path]', 'sections')]
  })
}
const isPrp = path => path === '/api/admin/prp' || path === '/api/admin/prp/1'

describe('quién queda restringido', () => {
  test('solo el rol Asesora financiera, sin importar mayúsculas ni espacios', () => {
    for (const name of [ASESORA, 'asesora financiera', '  ASESORA FINANCIERA ']) assert.equal(gate.isMicrositesOnlyUser({ role: { name } }), true, name)
    for (const name of ['Asesora', 'Asesor financiero', 'Asesora financiera senior', 'admin', '']) assert.equal(gate.isMicrositesOnlyUser({ role: { name } }), false, name)
    assert.equal(gate.isMicrositesOnlyUser(null), false)
  })
  test('líder, diseñador, administradores y superadmin no se restringen (con los datos reales del servidor)', () => {
    assert.equal(gate.isMicrositesOnlyUser(auth.toPublicUser(user(ASESORA))), true)
    for (const [label, who] of Object.entries(OTHERS)) assert.equal(gate.isMicrositesOnlyUser(auth.toPublicUser(who)), false, label)
  })
  test('estar restringida no agrega permisos: las banderas siguen saliendo de Hub', () => {
    const none = auth.toPublicUser(user(ASESORA, { permissions: [] }))
    assert.deepEqual([none.canCreatePrp, none.canEditPrp, none.canDeletePrp, none.canEditContent, none.isAreaLeader, none.isGlobalAdmin], [false, false, false, false, false, undefined])
  })
})

describe('navegación del panel', () => {
  const asesora = { role: { name: ASESORA }, mustChangePassword: false }
  const go = (path, who) => gate.adminGateRedirect(path, who)
  test('al iniciar sesión y por URL directa todo lleva a Micrositios', () => {
    for (const p of ['/admin', '/admin/', '/admin/login', '/admin/cambiar-contrasena', '/admin/procedimientos', '/admin/noticias/1', '/admin/testimonios', '/admin/recomendaciones/temas', '/admin/nosotros', '/admin/paginas/clinicas-aliadas', '/admin/configuracion', '/Admin/noticias', '/ADMIN', '//admin//noticias', '/admin/micrositiosx']) {
      assert.equal(go(p, asesora), '/admin/micrositios', p)
    }
  })
  test('Micrositios (listado, alta y detalle) queda accesible y las rutas públicas no se tocan', () => {
    for (const p of ['/admin/micrositios', '/admin/micrositios/', '/admin/micrositios/nuevo', '/admin/micrositios/12', '/', '/noticias', '/administracion']) assert.equal(go(p, asesora), null, p)
  })
  test('el cambio obligatorio de contraseña tiene prioridad y después lleva a Micrositios', () => {
    const pending = { ...asesora, mustChangePassword: true }
    for (const p of ['/admin', '/admin/login', '/admin/micrositios', '/admin/noticias']) assert.equal(go(p, pending), '/admin/cambiar-contrasena', p)
    assert.equal(go('/admin/cambiar-contrasena', pending), null)
  })
  test('los demás perfiles conservan su navegación', () => {
    for (const [label, who] of Object.entries(OTHERS)) {
      const u = auth.toPublicUser(who)
      assert.equal(go('/admin/login', u), '/admin', label)
      for (const p of ['/admin', '/admin/noticias', '/admin/configuracion', '/admin/micrositios']) assert.equal(go(p, u), null, `${label} ${p}`)
    }
  })
  test('sin sesión se va al login', () => { assert.equal(go('/admin/micrositios', null), '/admin/login') })
  test('el menú oculta todo salvo Micrositios y el middleware usa la regla compartida', () => {
    const layout = read('layouts/admin.vue')
    assert.match(layout, /<div v-if="!micrositesOnly">\s*<NuxtLink to="\/admin"/)
    assert.match(layout, /<template v-if="!micrositesOnly">[\s\S]*\/admin\/procedimientos[\s\S]*\/admin\/noticias[\s\S]*\/admin\/testimonios[\s\S]*\/admin\/recomendaciones[\s\S]*pageLinks[\s\S]*<\/template>\s*<NuxtLink to="\/admin\/micrositios"/)
    assert.match(layout, /v-if="!micrositesOnly && \(user\?\.isAreaLeader \|\| user\?\.canEditRate\)"/)
    assert.match(read('middleware/admin-auth.global.ts'), /!isAdminPanelPath\(to\.path\)/)
  })
})

describe('API administrativa', () => {
  test('la asesora solo alcanza Micrositios: el resto de rutas responde 403 microsites_only', async () => {
    const asesora = await signIn(user(ASESORA))
    const routes = adminRoutes()
    assert.ok(routes.length > 40)
    for (const [method, path] of routes) {
      const res = await asesora(path, { method })
      if (isPrp(path)) assert.equal(res.status, 200, `${method} ${path}`)
      else assert.equal(res.json?.data?.code, 'microsites_only', `${method} ${path} → ${res.status}`)
    }
  })
  test('las cinco operaciones de Micrositios llegan a Hub, que sigue decidiendo', async () => {
    const asesora = await signIn(user(ASESORA))
    const ops = [['GET', '/api/admin/prp'], ['POST', '/api/admin/prp'], ['GET', '/api/admin/prp/1'], ['PUT', '/api/admin/prp/1'], ['DELETE', '/api/admin/prp/1']]
    for (const [method, path] of ops) assert.equal((await asesora(path, { method, ...(method === 'POST' || method === 'PUT' ? { body: { name: 'N' } } : {}) })).status, 200, `${method} ${path}`)
    assert.deepEqual(hub.calls.map(c => c.method), ops.map(o => o[0]))
    assert.ok(hub.calls.every(c => c.path.startsWith('/prp-referrers')))
    hub.prp = 403
    assert.equal((await asesora('/api/admin/prp', { method: 'POST', body: { name: 'N' } })).status, 403)
  })
  test('rutas codificadas, con `..` o en mayúsculas no esquivan la restricción', async () => {
    const asesora = await signIn(user(ASESORA))
    for (const path of ['/api/%61dmin/news', '/api/admi%6e/news', '/%61pi/admin/news', '/api/admin/%6eews', '/API/admin/news', '/api/Admin/news', '//api/admin/news', '/api//admin//news/', '/api/admin/prp/../news', '/api/x/../admin/news', '/api/admin/prp/%2e%2e/news', '/api/admin/prpx', '/api/admin/prp/abc', '/api/admin/news?x=/api/admin/prp']) {
      const res = await asesora(path)
      assert.ok(res.json?.data?.code === 'microsites_only' || res.status === 404, `${path} → ${res.status} ${JSON.stringify(res.json)}`)
      assert.notEqual(res.json?.passed, true, path)
    }
  })
  test('la sesión enviada por cabecera no se acepta', async () => {
    const asesora = await signIn(user(ASESORA))
    let sealed
    hub.user = user(ASESORA)
    sealed = (await send('/test/session')).headers['set-cookie'].at(-1).split(';')[0].split('=')[1]
    hub.calls = []
    const res = await send('/api/admin/prp', { headers: { 'x-planmed-admin-session': sealed } })
    assert.equal(res.status, 401)
    assert.equal(hub.calls.length, 0)
    assert.equal((await asesora('/api/admin/prp')).status, 200)
  })
  test('contraseña temporal: ninguna ruta, Micrositios incluido', async () => {
    const pending = await signIn(user(ASESORA, { must_change_password: true }))
    for (const path of ['/api/admin/prp', '/api/admin/prp/1', '/api/admin/news', '/api/%61dmin/prp']) assert.equal((await pending(path)).json?.data?.code, 'password_change_required', path)
    assert.equal(hub.calls.length, 0)
  })
  test('los demás perfiles pasan sin consultar nada adicional a Hub', async () => {
    for (const [label, who] of Object.entries(OTHERS)) {
      const b = await signIn(who)
      for (const path of ['/api/admin/news', '/api/admin/config/access', '/api/admin/about']) assert.equal((await b(path, { method: 'POST' })).json?.passed, true, `${label} ${path}`)
      assert.equal(hub.calls.length, 0, label)
    }
  })
  test('sin sesión no interviene', async () => { assert.equal((await send('/api/admin/news')).json?.passed, true) })
  test('cookie desactualizada: si Hub ya no la considera restringida pasa; si no lo confirma, se deniega', async () => {
    const old = await signIn(user(ASESORA))
    hub.user = user(ASESORA, { is_global_admin: true }) // superadmin con sesión anterior a este cambio
    assert.equal((await old('/api/admin/news')).json?.passed, true)
    hub.user = user('Diseñador gráfico')
    assert.equal((await old('/api/admin/news')).json?.passed, true)
    hub.user = user('Diseñador gráfico', { line: { slug: 'crediestetica' } })
    assert.equal((await old('/api/admin/news')).status, 403)
    for (const status of [401, 429, 500]) { hub.me = status; assert.equal((await old('/api/admin/news')).status, 403, String(status)) }
  })
})

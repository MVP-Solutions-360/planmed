// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Cambio obligatorio de contraseña (contraseña temporal de un colaborador): el portal reconoce must_change_password al iniciar sesión, solo
// permite la pantalla de cambio, usa POST /auth/password/change de Hub (autoridad) y renueva la sesión porque Hub revoca todos los tokens.
// Usa el código REAL de auth.ts / wellezy.ts / passwordChange.ts con un Hub simulado a nivel de $fetch: nunca hay red.
import { test, describe, before, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT } from '../recommendations/harness.ts'

const imp = rel => import(pathToFileURL(join(ROOT, rel)).href)
const read = rel => readFileSync(join(ROOT, rel), 'utf8')
const HOST = 'planmed.test'
const OLD_TOKEN = 'tk-temporal-viejo'
const NEW_TOKEN = 'tk-nuevo-tras-cambio'
const TEMP = 'Tmp#Pass-2027x'
const NEW_PASS = 'Definitiva#2027'

const base = { id: 7, name: 'Marta Ruiz', email: 'marta@x.test', role: { id: 22, name: 'Asesora financiera' }, is_area_leader: false, company: { slug: 'planmed' }, line: { slug: 'planmed' }, permissions: ['prp_referrers.ver'] }
const PENDING = { ...base, must_change_password: true }
const DONE = { ...base, must_change_password: false }
const OTRA_LINEA = { ...base, line: { slug: 'crediestetica' }, must_change_password: false }

const state = { session: {}, hub: {}, calls: [], logs: [] }
let login, me, passwordPost, gate, W

const ev = (body, extra = {}) => ({ method: 'POST', body, headers: { host: HOST, origin: `https://${HOST}` }, ...extra })
const run = async (fn, e) => { try { return { value: await fn(e) } } catch (error) { return { error } } }
const changeCalls = () => state.calls.filter(c => c.path === '/auth/password/change')
const loginCalls = () => state.calls.filter(c => c.path === '/auth/login')
const GOOD = { current_password: TEMP, password: NEW_PASS, password_confirmation: NEW_PASS }

before(async () => {
  const g = globalThis
  g.defineEventHandler = fn => fn
  g.readBody = async e => e.body
  g.setHeader = () => {}
  g.getQuery = () => ({})
  g.getRequestURL = e => new URL(e.url ?? '/', 'http://localhost')
  g.getCookie = (e, name) => e.cookies?.[name]
  g.getRequestHeader = (e, n) => e.headers?.[n]
  g.createError = o => Object.assign(new Error(o.message ?? 'error'), o)
  g.authError = (statusCode, message) => g.createError({ statusCode, message, data: { message } })
  g.canManageFinancingRate = () => false
  g.useRuntimeConfig = () => ({ planmedAdminRoleIds: '', wellezyApiBaseUrl: 'http://hub.test/api', sessionPassword: 'x'.repeat(40), wellezyCompanySlug: 'planmed', wellezyLineSlug: 'planmed' })
  g.useSession = async () => ({
    get data() { return state.session },
    update: async (d) => { state.session = { ...state.session, ...d } },
    clear: async () => { state.session = {} }
  })
  // Hub simulado a nivel de $fetch (lo usa el cliente REAL de wellezy.ts).
  g.$fetch = { raw: async (url, opts) => {
    const path = String(url).replace('http://hub.test/api', '')
    state.calls.push({ path, method: opts.method, body: opts.body, auth: opts.headers?.Authorization })
    const rule = state.hub[path]
    if (!rule || rule.throw) throw new Error('red caída')
    return { status: rule.status, _data: rule.data }
  } }
  for (const m of ['log', 'info', 'warn', 'error', 'debug']) {
    const orig = console[m]
    console[m] = (...a) => { state.logs.push(a.map(String).join(' ')); if (process.env.SHOW_LOGS) orig(...a) }
  }

  const dir = mkdtempSync(join(tmpdir(), 'pwchange-'))
  before.dir = dir
  const shim = join(dir, '_shim')
  mkdirSync(shim)
  writeFileSync(join(shim, 'wellezy.ts'), read('server/utils/wellezy.ts'))
  writeFileSync(join(shim, 'auth.ts'), read('server/utils/auth.ts').replaceAll("'./wellezy'", "'./wellezy.ts'"))
  W = await import(pathToFileURL(join(shim, 'wellezy.ts')).href)
  const A = await import(pathToFileURL(join(shim, 'auth.ts')).href)
  Object.assign(g, W, A, await imp('server/utils/origin.ts'), await imp('server/utils/passwordChange.ts'))
  g.wellezyMe = W.wellezyMe

  login = (await imp('server/api/auth/login.post.ts')).default
  me = (await imp('server/api/auth/me.get.ts')).default
  passwordPost = (await imp('server/api/auth/password.post.ts')).default
  gate = await imp('shared/utils/adminPasswordGate.ts')
  g.adminMiddleware = (await imp('server/middleware/admin-password-change.ts')).default
})
after(() => rmSync(before.dir, { recursive: true, force: true }))

beforeEach(() => {
  state.calls = []
  state.logs = []
  state.session = { token: OLD_TOKEN, user: { id: 7, name: 'Marta Ruiz', email: 'marta@x.test', role: { id: 22, name: 'Asesora financiera' }, mustChangePassword: true } }
  state.hub = {
    '/auth/login': { status: 200, data: { token: NEW_TOKEN, user: DONE } },
    '/auth/me': { status: 200, data: { user: PENDING } },
    '/auth/password/change': { status: 200, data: { message: 'Contraseña actualizada. Inicia sesión de nuevo.' } }
  }
})

describe('inicio de sesión con contraseña temporal', () => {
  test('el portal reconoce must_change_password: lo conserva en la sesión del servidor y lo informa al navegador sin token', async () => {
    state.session = {}
    state.hub['/auth/login'] = { status: 200, data: { token: OLD_TOKEN, user: PENDING } }
    const { value, error } = await run(login, ev({ email: 'marta@x.test', password: TEMP }))
    assert.ok(!error, error?.message)
    assert.equal(value.user.mustChangePassword, true)
    assert.equal(state.session.token, OLD_TOKEN) // se necesita para llamar a /auth/password/change
    assert.equal(state.session.user.mustChangePassword, true)
    assert.ok(!JSON.stringify(value).includes(OLD_TOKEN) && !('permissions' in value.user))
  })

  test('sin la bandera (o false) el usuario queda sin cambio pendiente; solo `true` estricto cuenta', async () => {
    for (const flag of [false, undefined, 'true', 1, null]) {
      state.session = {}
      const user = { ...base, must_change_password: flag }
      if (flag === undefined) delete user.must_change_password
      state.hub['/auth/login'] = { status: 200, data: { token: 't', user } }
      const { value } = await run(login, ev({ email: 'marta@x.test', password: 'x' }))
      assert.equal(value.user.mustChangePassword, false, String(flag))
    }
  })

  test('/auth/me vuelve a informar la bandera desde Hub en cada carga', async () => {
    state.session = { token: OLD_TOKEN, user: { id: 7 } }
    const { value } = await run(me, { method: 'GET', headers: {} })
    assert.equal(value.user.mustChangePassword, true)
    state.hub['/auth/me'] = { status: 200, data: { user: DONE } }
    assert.equal((await run(me, { method: 'GET', headers: {} })).value.user.mustChangePassword, false)
  })
})

describe('bloqueo mientras el cambio es obligatorio', () => {
  const adminEvent = (path, cookies = { 'planmed-admin': 'sellada' }) => ({ method: 'GET', url: path, cookies, headers: {} })

  test('servidor: toda ruta /api/admin/** responde 403 password_change_required (también las de contenido local)', async () => {
    for (const path of ['/api/admin/news', '/api/admin/about', '/api/admin/pages/clinicas-aliadas', '/api/admin/config/line-users', '/api/admin/config/financing-rate', '/api/admin/prp?x=1']) {
      const { error } = await run(adminMiddleware, adminEvent(path))
      assert.equal(error?.statusCode, 403, path)
      assert.equal(error.data.code, 'password_change_required')
    }
  })

  test('servidor: /api/auth/** (cambio de contraseña, me, logout), el sitio público y las peticiones sin sesión no se bloquean', async () => {
    for (const path of ['/api/auth/password', '/api/auth/me', '/api/auth/logout', '/api/public/news', '/procedimientos', '/admin/login']) {
      assert.ok(!(await run(adminMiddleware, adminEvent(path))).error, path)
    }
    assert.ok(!(await run(adminMiddleware, adminEvent('/api/admin/news', {}))).error) // sin cookie: cada ruta decide (401)
  })

  test('servidor: sin cambio pendiente (o ya cambiado) el acceso es normal', async () => {
    state.session.user.mustChangePassword = false
    assert.ok(!(await run(adminMiddleware, adminEvent('/api/admin/news'))).error)
  })

  test('navegador: con cambio pendiente solo se permite la pantalla de cambio (todas las demás rutas del panel redirigen)', () => {
    const { adminGateRedirect: go, ADMIN_CHANGE_PASSWORD_PATH: CHANGE } = gate
    const pending = { mustChangePassword: true }
    for (const p of ['/admin', '/admin/', '/admin/procedimientos', '/admin/noticias/1', '/admin/configuracion', '/admin/nosotros', '/admin/login']) {
      assert.equal(go(p, pending), CHANGE, p)
    }
    assert.equal(go(CHANGE, pending), null)
    assert.equal(go(`${CHANGE}/`, pending), null)
  })

  test('navegador: sin cambio pendiente la pantalla de cambio no se muestra, y sin sesión todo va al login', () => {
    const { adminGateRedirect: go, ADMIN_CHANGE_PASSWORD_PATH: CHANGE } = gate
    assert.equal(go(CHANGE, { mustChangePassword: false }), '/admin')
    assert.equal(go('/admin', { mustChangePassword: false }), null)
    assert.equal(go('/admin/login', { mustChangePassword: false }), '/admin')
    assert.equal(go('/admin/login', null), null)
    for (const p of ['/admin', '/admin/procedimientos', CHANGE]) assert.equal(go(p, null), '/admin/login', p)
    assert.equal(go('/procedimientos', { mustChangePassword: true }), null) // el sitio público no se toca
    assert.equal(go('/administracion', { mustChangePassword: true }), null)
  })

  test('el middleware de rutas usa la regla compartida y el layout del panel no se usa en la pantalla de cambio', () => {
    assert.match(read('middleware/admin-auth.global.ts'), /adminGateRedirect\(to\.path, authService\.getUser\(\)\.value\)/)
    assert.match(read('pages/admin/cambiar-contrasena.vue'), /definePageMeta\(\{ layout: false \}\)/)
  })
})

describe('POST /api/auth/password', () => {
  test('origen inválido => 403; sin sesión => 401; Hub no se toca', async () => {
    for (const headers of [{ host: HOST }, { host: HOST, origin: 'https://evil.example' }, { host: HOST, 'sec-fetch-site': 'cross-site' }]) {
      assert.equal((await run(passwordPost, ev(GOOD, { headers }))).error.statusCode, 403, JSON.stringify(headers))
    }
    state.session = {}
    assert.equal((await run(passwordPost, ev(GOOD))).error.statusCode, 401)
    assert.equal(state.calls.length, 0)
  })

  test('cuerpo con lista blanca: solo los tres campos, como texto; faltantes o inválidos => 422 y Hub no se toca (las reglas de contraseña NO se duplican)', async () => {
    for (const body of [null, 'x', [], {}, { ...GOOD, password: 123 }, { ...GOOD, current_password: '' }, { ...GOOD, password_confirmation: 'x'.repeat(1025) }]) {
      const { error } = await run(passwordPost, ev(body))
      assert.equal(error?.statusCode, 422, JSON.stringify(body))
      assert.ok(Object.keys(error.data.errors).length > 0)
    }
    assert.equal(state.calls.length, 0)
    // Una contraseña «débil» o una confirmación distinta NO se rechazan en el portal: las valida Hub.
    const { error } = await run(passwordPost, ev({ current_password: TEMP, password: 'abc', password_confirmation: 'otra' }))
    assert.ok(!error)
    assert.equal(changeCalls().length, 1)
    const src = read('server/utils/passwordChange.ts')
    assert.ok(!/\[A-Z\]|\[a-z\]|\\d|\.length\s*[<>]=?\s*(?:[6-9]|[1-3]\d)\b(?!\d)|toUpperCase|zxcvbn/.test(src.replace(/1024/g, '')))
  })

  test('éxito: llama a /auth/password/change con el token de la sesión y SOLO los tres campos, e inicia sesión de nuevo con la contraseña nueva', async () => {
    const { value, error } = await run(passwordPost, ev({ ...GOOD, evil: 'x', email: 'otro@x.test', company: 'z' }))
    assert.ok(!error, error?.message)
    assert.deepEqual(state.calls.map(c => c.path), ['/auth/password/change', '/auth/login'])
    assert.equal(changeCalls()[0].auth, `Bearer ${OLD_TOKEN}`)
    assert.deepEqual(Object.keys(changeCalls()[0].body).sort(), ['current_password', 'password', 'password_confirmation'])
    // Hub revocó TODOS los tokens: el nuevo se obtiene con login (correo de la sesión, contraseña recién elegida).
    assert.deepEqual([loginCalls()[0].body.email, loginCalls()[0].body.password], ['marta@x.test', NEW_PASS])
    assert.equal(state.session.token, NEW_TOKEN)
    assert.equal(state.session.user.mustChangePassword, false)
    assert.equal(value.user.mustChangePassword, false)
    // Acceso normal tras el cambio: el servidor ya no bloquea /api/admin/**.
    assert.ok(!(await run(adminMiddleware, { method: 'GET', url: '/api/admin/news', cookies: { 'planmed-admin': 's' }, headers: {} })).error)
  })

  test('la respuesta no contiene contraseñas ni tokens, y ninguna contraseña llega a los logs', async () => {
    const { value } = await run(passwordPost, ev(GOOD))
    const text = JSON.stringify(value)
    for (const secret of [TEMP, NEW_PASS, OLD_TOKEN, NEW_TOKEN]) assert.ok(!text.includes(secret))
    // También en los errores y en los registros de consola.
    state.hub['/auth/password/change'] = { status: 422, data: { message: 'x', errors: { password: ['Muy corta.'] } } }
    const { error } = await run(passwordPost, ev(GOOD))
    assert.ok(!JSON.stringify({ message: error.message, data: error.data }).includes(NEW_PASS))
    assert.ok(!state.logs.join('\n').includes(NEW_PASS) && !state.logs.join('\n').includes(TEMP))
  })

  test('si el nuevo inicio de sesión falla (o es de otra línea), la contraseña ya cambió: se cierra la sesión y se pide ingresar de nuevo', async () => {
    for (const hub of [{ status: 0, throw: true }, { status: 401, data: {} }, { status: 200, data: { token: 't', user: OTRA_LINEA } }]) {
      state.session = { token: OLD_TOKEN, user: { email: 'marta@x.test', mustChangePassword: true } }
      state.hub['/auth/login'] = hub
      const { value, error } = await run(passwordPost, ev(GOOD))
      assert.ok(!error)
      assert.equal(value.user, null)
      assert.deepEqual(state.session, {})
    }
  })

  test('errores de Hub: 422 conserva los detalles por campo; 401 cierra la sesión; 403; 429; 503', async () => {
    state.hub['/auth/password/change'] = { status: 422, data: { message: 'invalid', errors: { current_password: ['La contraseña actual no es correcta.'], password: ['Mínimo 8.'], email: ['x'] } } }
    let { error } = await run(passwordPost, ev(GOOD))
    assert.equal(error.statusCode, 422)
    assert.deepEqual(error.data.errors, { current_password: ['La contraseña actual no es correcta.'], password: ['Mínimo 8.'], _form: ['x'] })
    assert.equal(loginCalls().length, 0)

    state.hub['/auth/password/change'] = { status: 401, data: {} }
    error = (await run(passwordPost, ev(GOOD))).error
    assert.equal(error.statusCode, 401)
    assert.deepEqual(state.session, {})

    for (const [status, code, re] of [[403, 403, /acceso/], [429, 429, /Demasiados/], [503, 503, /conectar/]]) {
      state.session = { token: OLD_TOKEN, user: { email: 'marta@x.test', mustChangePassword: true } }
      state.hub['/auth/password/change'] = { status, data: {} }
      error = (await run(passwordPost, ev(GOOD))).error
      assert.equal(error.statusCode, code)
      assert.match(error.message, re)
      assert.equal(state.session.token, OLD_TOKEN) // la sesión se conserva para reintentar
    }
  })

  test('problema de conexión o timeout: 504 «no se pudo confirmar», sin reintento ni nuevo login y con la sesión intacta', async () => {
    state.hub['/auth/password/change'] = { status: 0, throw: true }
    const { error } = await run(passwordPost, ev(GOOD))
    assert.equal(error.statusCode, 504)
    assert.equal(error.data.code, 'password_change_unconfirmed')
    assert.match(error.message, /No se pudo confirmar/)
    assert.equal(changeCalls().length, 1)
    assert.equal(loginCalls().length, 0)
    assert.equal(state.session.token, OLD_TOKEN)
  })
})

describe('pantalla de cambio (cliente)', () => {
  const page = read('pages/admin/cambiar-contrasena.vue')
  const provider = read('providers/WellezyAuthProvider.ts')
  const service = read('services/AuthService.ts')

  test('pide contraseña actual, nueva y confirmación, y usa el servicio de autenticación (Hub es la autoridad)', () => {
    for (const f of ['current_password', 'password', 'password_confirmation']) assert.match(page, new RegExp(`key: '${f}'`))
    assert.match(page, /authService\.changePassword\(form\.current_password, form\.password, form\.password_confirmation\)/)
    assert.match(provider, /'\/api\/auth\/password'/)
    assert.match(provider, /current_password: currentPassword, password, password_confirmation: confirmation/)
    assert.match(page, /Wellezy Hub/)
  })

  test('tras el éxito entra al panel; si no se pudo renovar la sesión va al login; 401 vuelve al login; 422 muestra errores por campo', () => {
    assert.match(page, /navigateTo\(user \? '\/admin' : '\/admin\/login\?changed=1'\)/)
    assert.match(page, /e\.statusCode === 401[\s\S]*navigateTo\('\/admin\/login'\)/)
    assert.match(page, /fieldErrors\[k\]/)
    assert.match(page, /e\.message/)
    assert.match(read('pages/admin/login.vue'), /query\.changed === '1'/)
    assert.match(service, /statusCode === 401\) userState\.value = null/)
  })

  test('bloquea el doble envío y mantiene las contraseñas solo en memoria (se borran al enviar y al salir)', () => {
    assert.match(page, /if \(saving\.value\) return\s*\n\s*saving\.value = true/)
    assert.match(page, /:disabled="saving"/)
    assert.match(page, /onBeforeUnmount\(clearForm\)/)
    assert.ok(!/localStorage|sessionStorage|indexedDB|document\.cookie|console\.|useCookie|useState|query:/.test(page))
    let calls = 0
    let saving = false
    let release
    const submit = async () => { if (saving) return; saving = true; try { calls++; await new Promise(r => { release = r }) } finally { saving = false } }
    const a = submit(); const b = submit()
    release(); return Promise.all([a, b]).then(() => assert.equal(calls, 1))
  })

  test('las rutas nuevas no escriben datos de contraseña en ningún log del servidor', () => {
    const code = ['server/api/auth/password.post.ts', 'server/utils/passwordChange.ts', 'server/middleware/admin-password-change.ts'].map(read).join('\n')
    assert.ok(!/console\./.test(code))
  })
})

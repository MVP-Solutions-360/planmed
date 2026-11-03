// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Política única de acceso al panel (isAuthorizedUser) y su aplicación en POST /api/auth/login y GET /api/auth/me:
//  A. superadmin global (`is_global_admin === true`): único acceso sin pertenecer a la empresa y línea de Planmed.
//  B. cualquier otro usuario —con cualquier rol, incluido `admin`—: debe pertenecer a la empresa y línea de Planmed (company.slug / line.slug
//     de Hub contra la configuración del servidor). El rol `admin` no concede acceso global y NUXT_PLANMED_ADMIN_ROLE_IDS no interviene.
// Se ejecutan las funciones y rutas REALES con auto-imports de Nitro simulados.
import { test, describe, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT } from '../recommendations/harness.ts'

const imp = rel => import(pathToFileURL(join(ROOT, rel)).href)
const PLANMED = { company: { slug: 'planmed' }, line: { slug: 'planmed' } }
const OTRA_LINEA = { company: { slug: 'planmed' }, line: { slug: 'crediestetica' } }
const base = (over = {}) => ({ id: 1, name: 'U', email: 'u@x.test', role: { id: 19, name: 'Diseñador gráfico' }, is_area_leader: false, is_global_admin: false, permissions: [], ...PLANMED, ...over })

const state = { config: {}, loginUser: null, meUser: null, meStatus: 200, loggedOut: 0, cleared: 0, updated: 0 }
const defaults = { planmedAdminRoleIds: '19,22', wellezyCompanySlug: 'planmed', wellezyLineSlug: 'planmed', sessionPassword: 'x'.repeat(40), wellezyApiBaseUrl: 'https://hub.test/api' }
const run = async (fn, e) => { try { return { value: await fn(e) } } catch (error) { return { error } } }
const ev = (extra = {}) => ({ method: 'POST', body: {}, headers: {}, ...extra })

let dir, A, W, login, me

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'panel-access-'))
  const g = globalThis
  g.defineEventHandler = fn => fn
  g.readBody = async e => e.body
  g.setHeader = () => {}
  g.assertSameOrigin = () => {}
  g.useRuntimeConfig = () => ({ ...defaults, ...state.config })
  g.createError = o => Object.assign(new Error(o.message ?? 'error'), o)
  g.authError = (statusCode, message) => g.createError({ statusCode, message, data: { message } })
  // auth.ts importa './wellezy' sin extensión (lo resuelve Nitro, no Node): se prueba el código real desde una copia con la extensión.
  writeFileSync(join(dir, 'wellezy.ts'), readFileSync(join(ROOT, 'server/utils/wellezy.ts'), 'utf8'))
  writeFileSync(join(dir, 'auth.ts'), readFileSync(join(ROOT, 'server/utils/auth.ts'), 'utf8').replaceAll("'./wellezy'", "'./wellezy.ts'"))
  W = await import(pathToFileURL(join(dir, 'wellezy.ts')).href)
  A = await import(pathToFileURL(join(dir, 'auth.ts')).href)
  Object.assign(g, A)
  g.canManageFinancingRate = () => false // auto-import de financingRate.ts; no interviene en el acceso al panel
  // Hub simulado: lo único que cambia entre pruebas es el usuario que devuelve.
  g.wellezyLogin = async () => ({ status: 200, data: { token: 'tk-nuevo', user: state.loginUser } })
  g.wellezyMe = async () => state.meStatus === 200 ? { status: 200, data: { user: state.meUser } } : { status: state.meStatus }
  g.wellezyLogout = async () => { state.loggedOut++; return 200 }
  g.useAdminSession = async () => ({ data: { token: 'tk-sesion' }, clear: async () => { state.cleared++ }, update: async () => { state.updated++ } })
  login = (await imp('server/api/auth/login.post.ts')).default
  me = (await imp('server/api/auth/me.get.ts')).default
})

after(() => { rmSync(dir, { recursive: true, force: true }) })

beforeEach(() => {
  Object.assign(state, { config: {}, loginUser: null, meUser: null, meStatus: 200, loggedOut: 0, cleared: 0, updated: 0 })
})

const e = () => ({})

describe('isAuthorizedUser: política A (superadmin global) / B (pertenencia a Planmed)', () => {
  test('A · superadmin global sin rol principal ni empresa/línea: permitido', () => {
    assert.equal(A.isAuthorizedUser(e(), base({ role: null, is_global_admin: true, company: null, line: null })), true)
  })
  test('A · superadmin global con cualquier rol o de otra empresa/línea: permitido', () => {
    assert.equal(A.isAuthorizedUser(e(), base({ is_global_admin: true, role: { id: 500, name: 'Asesora' }, ...OTRA_LINEA })), true)
    assert.equal(A.isAuthorizedUser(e(), base({ is_global_admin: true, company: { slug: 'otra' }, line: { slug: 'otra' } })), true)
  })
  test('A · solo `true` estricto cuenta como superadmin global', () => {
    for (const bad of ['true', 1, 'yes', null, undefined, {}]) {
      assert.equal(A.isAuthorizedUser(e(), base({ role: null, is_global_admin: bad, ...OTRA_LINEA })), false, String(bad))
    }
  })

  test('B · admin con empresa y línea de Planmed: permitido (como cualquier usuario de la línea)', () => {
    assert.equal(A.isAuthorizedUser(e(), base({ role: { id: 1, name: 'admin' } })), true)
  })
  test('B · admin de otra línea o de otra empresa: DENEGADO (el rol admin no concede acceso global)', () => {
    for (const name of ['admin', 'ADMIN', ' Admin ', 'aDmIn']) {
      assert.equal(A.isAuthorizedUser(e(), base({ role: { id: 1, name }, ...OTRA_LINEA })), false, JSON.stringify(name))
      assert.equal(A.isAuthorizedUser(e(), base({ role: { id: 1, name }, company: { slug: 'otra' }, line: { slug: 'planmed' } })), false, JSON.stringify(name))
    }
  })
  test('B · admin sin datos de empresa/línea: denegado', () => {
    assert.equal(A.isAuthorizedUser(e(), base({ role: { id: 1, name: 'admin' }, company: null, line: null })), false)
  })
  test('B · usuario normal de Planmed: permitido, esté o no su id de rol en NUXT_PLANMED_ADMIN_ROLE_IDS', () => {
    assert.equal(A.isAuthorizedUser(e(), base({ role: { id: 19, name: 'Diseñador gráfico' } })), true)
    assert.equal(A.isAuthorizedUser(e(), base({ role: { id: 500, name: 'Ventas' } })), true)
    state.config = { planmedAdminRoleIds: '' }
    assert.equal(A.isAuthorizedUser(e(), base({ role: { id: 500, name: 'Ventas' } })), true)
    assert.equal(A.isAuthorizedUser(e(), base({ role: null })), true, 'la pertenencia verificada por Hub basta; el rol no interviene')
  })
  test('B · slugs de Planmed sin distinguir mayúsculas ni espacios', () => {
    assert.equal(A.isAuthorizedUser(e(), base({ company: { slug: ' PLANMED ' }, line: { slug: 'Planmed' } })), true)
  })
  test('B · usuario normal de otra línea u otra empresa: denegado', () => {
    assert.equal(A.isAuthorizedUser(e(), base(OTRA_LINEA)), false)
    assert.equal(A.isAuthorizedUser(e(), base({ company: { slug: 'otra' }, line: { slug: 'planmed' } })), false)
    assert.equal(A.isAuthorizedUser(e(), base({ role: { id: 19, name: 'Diseñador gráfico' }, ...OTRA_LINEA })), false, 'el id en la lista no salta la pertenencia')
  })
  test('B · empresa o línea incompletas, o configuración sin slugs: denegado', () => {
    assert.equal(A.isAuthorizedUser(e(), base({ company: null })), false)
    assert.equal(A.isAuthorizedUser(e(), base({ line: null })), false)
    assert.equal(A.isAuthorizedUser(e(), base({ company: {}, line: {} })), false)
    assert.equal(A.isAuthorizedUser(e(), base({ company: undefined, line: undefined })), false)
    assert.equal(A.isAuthorizedUser(e(), base({ company: { slug: '' }, line: { slug: '' } })), false)
    state.config = { wellezyCompanySlug: '', wellezyLineSlug: '' }
    assert.equal(A.isAuthorizedUser(e(), base()), false, 'sin slugs configurados no se puede demostrar la pertenencia')
  })
})

describe('wellezy.ts conserva el contexto que Hub verifica', () => {
  test('wellezyMe conserva is_global_admin y company/line (solo slug, en minúsculas); descarta lo demás', async () => {
    const orig = globalThis.$fetch
    globalThis.$fetch = { raw: async () => ({ status: 200, _data: { user: { id: 3, name: 'N', email: 'n@x.test', role: null, is_global_admin: true, company: { id: 1, name: 'X', slug: ' Planmed ' }, line: { id: 2, slug: 'PLANMED', secreto: 'no' } } } }) }
    const u = (await W.wellezyMe({}, 'tok')).data.user
    globalThis.$fetch = orig
    assert.equal(u.is_global_admin, true)
    assert.deepEqual(u.company, { slug: 'planmed' })
    assert.deepEqual(u.line, { slug: 'planmed' })
  })
  test('sin company/line en la respuesta de Hub => null (contexto no verificable)', async () => {
    const orig = globalThis.$fetch
    globalThis.$fetch = { raw: async () => ({ status: 200, _data: { user: { id: 3, name: 'N', email: 'n@x.test', role: { id: 19, name: 'x' } } } }) }
    const u = (await W.wellezyMe({}, 'tok')).data.user
    globalThis.$fetch = orig
    assert.equal(u.company, null)
    assert.equal(u.line, null)
  })
})

// Mismos escenarios de la tabla en las dos rutas: el login y la validación de sesión deben dar el mismo veredicto.
const CASES = [
  ['superadmin global sin rol principal ni empresa/línea', base({ role: null, is_global_admin: true, company: null, line: null }), true],
  ['superadmin global de otra empresa/línea', base({ is_global_admin: true, role: { id: 500, name: 'Asesora' }, ...OTRA_LINEA }), true],
  ['admin con empresa y línea de Planmed', base({ role: { id: 1, name: 'admin' } }), true],
  ['admin de otra línea', base({ role: { id: 1, name: 'admin' }, ...OTRA_LINEA }), false],
  ['admin de otra empresa', base({ role: { id: 1, name: 'ADMIN' }, company: { slug: 'otra' } }), false],
  ['usuario normal de Planmed', base(), true],
  ['usuario normal de Planmed con id de rol fuera de la lista', base({ role: { id: 500, name: 'Ventas' } }), true],
  ['usuario normal de otra línea', base(OTRA_LINEA), false],
  ['usuario normal de otra empresa', base({ role: { id: 500, name: 'Ventas' }, company: { slug: 'otra' } }), false],
  ['empresa o línea incompletas', base({ company: null, line: null }), false]
]

describe('POST /api/auth/login', () => {
  for (const [nombre, user, permitido] of CASES) {
    test(`${nombre}: ${permitido ? 'acceso permitido' : 'denegado (403) y token revocado'}`, async () => {
      state.loginUser = user
      const r = await run(login, ev({ body: { email: 'u@x.test', password: 'secreta' } }))
      if (permitido) {
        assert.ok(!r.error, r.error?.message)
        assert.equal(r.value.user.id, user.id)
        assert.equal(state.updated, 1, 'se crea la sesión')
        assert.equal(state.loggedOut, 0)
        assert.equal('token' in r.value.user || 'permissions' in r.value.user, false)
      } else {
        assert.equal(r.error?.statusCode, 403)
        assert.equal(r.error?.message, MSG_FORBIDDEN)
        assert.equal(state.loggedOut, 1, 'se revoca el token recién emitido')
        assert.equal(state.cleared, 1, 'no se crea ni conserva sesión')
        assert.equal(state.updated, 0)
      }
    })
  }

  test('el navegador no puede aportar empresa, línea, rol ni superadmin: solo cuenta la respuesta de Hub', async () => {
    state.loginUser = base({ role: { id: 1, name: 'admin' }, ...OTRA_LINEA })
    const r = await run(login, ev({ body: { email: 'u@x.test', password: 'x', company_id: 1, linea_id: 1, company: { slug: 'planmed' }, line: { slug: 'planmed' }, is_global_admin: true, role: { id: 1, name: 'admin' } }, headers: { 'x-company': 'planmed', 'x-is-global-admin': '1' } }))
    assert.equal(r.error?.statusCode, 403)
    assert.equal(state.loggedOut, 1)
  })

  test('los demás códigos de Hub siguen igual (401 credenciales, 403 de Hub, 503 caído)', async () => {
    const orig = globalThis.wellezyLogin
    for (const [status, esperado] of [[401, 401], [403, 403], [422, 422], [429, 429], [500, 503], [0, 503]]) {
      globalThis.wellezyLogin = async () => ({ status })
      const r = await run(login, ev({ body: { email: 'u@x.test', password: 'x' } }))
      assert.equal(r.error?.statusCode, esperado, String(status))
    }
    globalThis.wellezyLogin = orig
  })
})

describe('GET /api/auth/me', () => {
  for (const [nombre, user, permitido] of CASES) {
    test(`${nombre}: ${permitido ? 'sesión válida' : 'denegado (403), token revocado y sesión destruida'}`, async () => {
      state.meUser = user
      const r = await run(me, ev({ method: 'GET' }))
      if (permitido) {
        assert.ok(!r.error, r.error?.message)
        assert.equal(r.value.user.id, user.id)
        assert.equal(state.updated, 1)
        assert.equal(state.loggedOut, 0)
      } else {
        assert.equal(r.error?.statusCode, 403)
        assert.equal(r.error?.message, MSG_FORBIDDEN)
        assert.equal(state.loggedOut, 1)
        assert.equal(state.cleared, 1)
        assert.equal(state.updated, 0)
      }
    })
  }

  test('la pertenencia cambia entre el login y la sesión: quien deja la línea queda fuera en /auth/me', async () => {
    state.loginUser = base({ role: { id: 1, name: 'admin' } })
    assert.ok(!(await run(login, ev({ body: { email: 'a@x.test', password: 'x' } }))).error)
    state.meUser = base({ role: { id: 1, name: 'admin' }, ...OTRA_LINEA })
    const r = await run(me, ev({ method: 'GET' }))
    assert.equal(r.error?.statusCode, 403)
    assert.equal(state.loggedOut, 1)
  })

  test('token vencido (401) destruye la sesión; fallo temporal del Hub (503) no', async () => {
    state.meStatus = 401
    assert.equal((await run(me, ev({ method: 'GET' }))).error?.statusCode, 401)
    assert.equal(state.cleared, 1)
    state.cleared = 0
    state.meStatus = 500
    assert.equal((await run(me, ev({ method: 'GET' }))).error?.statusCode, 503)
    assert.equal(state.cleared, 0)
  })
})

describe('login y /auth/me comparten la misma función', () => {
  test('ambas rutas llaman a isAuthorizedUser y no duplican condiciones de rol', () => {
    for (const rel of ['server/api/auth/login.post.ts', 'server/api/auth/me.get.ts']) {
      const src = readFileSync(join(ROOT, rel), 'utf8')
      assert.match(src, /isAuthorizedUser\(event, user\)/, rel)
      assert.equal(/allowedRoleIds|is_global_admin|role\.name/.test(src), false, `${rel} no reimplementa la política`)
    }
  })
})

// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Autorización por perfil en el portal: permisos de Hub conservados, escrituras de contenido local solo para perfiles editores
// y micrositios (PRP) reenviados a Hub sin evadir sus 403. Usa las funciones REALES de auth.ts / aboutStore.ts / prp.ts.
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT } from '../recommendations/harness.ts'

const imp = rel => import(pathToFileURL(join(ROOT, rel)).href)
const read = rel => readFileSync(join(ROOT, rel), 'utf8')

const PANEL_ROLE_IDS = '19,20,22,30'
const USERS = {
  asesora: { id: 5, name: 'Asesora', email: 'a@x.test', role: { id: 22, name: 'Asesora financiera' }, is_area_leader: false, permissions: ['prp_referrers.ver', 'prp_referrers.crear', 'clientes.ver'] },
  disenadora: { id: 6, name: 'Diseñadora', email: 'd@x.test', role: { id: 19, name: 'Diseñador gráfico' }, is_area_leader: false, permissions: ['prp_referrers.ver', 'prp_referrers.crear', 'prp_referrers.editar', 'prp_referrers.eliminar'] },
  contenido: { id: 7, name: 'Contenido', email: 'c@x.test', role: { id: 20, name: 'Administrador de contenido de línea' }, is_area_leader: false, permissions: [] },
  admin: { id: 8, name: 'Admin', email: 'ad@x.test', role: { id: 1, name: 'admin' }, is_area_leader: false, permissions: [] },
  superadmin: { id: 9, name: 'Super', email: 's@x.test', role: { id: 2, name: 'Superadmin' }, is_area_leader: false, permissions: [] },
  soloLista: { id: 10, name: 'Solo lista', email: 'l@x.test', role: { id: 30, name: 'Otro rol del panel' }, is_area_leader: false, permissions: ['prp_referrers.ver'] },
  superGlobal: { id: 12, name: 'Super', email: 'sg@x.test', role: null, is_area_leader: false, is_global_admin: true, permissions: [] },
  adminOrdinario: { id: 13, name: 'Admin Hub', email: 'ao@x.test', role: { id: 1, name: 'admin' }, is_area_leader: false, is_global_admin: false, permissions: ['prp_referrers.ver', 'prp_referrers.crear', 'prp_referrers.editar', 'prp_referrers.eliminar'] },
  sinPermisos: { id: 11, name: 'Sin lista', email: 'n@x.test', role: { id: 22, name: 'Asesora financiera' }, is_area_leader: false }
}

// Pertenencia a Planmed tal como la devuelve Hub (company.slug / line.slug del contexto del token).
for (const u of Object.values(USERS)) Object.assign(u, { company: { slug: 'planmed' }, line: { slug: 'planmed' } })
const OTRO_ROL = { id: 500, name: 'Otro rol', email: 'o@x.test', role: { id: 22, name: 'Asesora financiera' }, is_area_leader: false, is_global_admin: false, permissions: [], company: { slug: 'planmed' }, line: { slug: 'crediestetica' } }

let dir, W, A, put
const state = { me: 'asesora', session: true }
const hubCalls = []
const hubRules = {}
const run = async (fn, e) => { try { return { value: await fn(e) } } catch (error) { return { error } } }
const ev = (extra = {}) => ({ method: 'PUT', body: {}, headers: {}, params: { id: '1', slug: 'clinicas-aliadas' }, ...extra })

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'authz-'))
  const g = globalThis
  g.defineEventHandler = fn => fn
  g.readBody = async e => e.body
  g.getRouterParam = (e, n) => e.params[n]
  g.setHeader = () => {}
  g.getQuery = e => e.query ?? {}
  g.useRuntimeConfig = () => ({ planmedAdminRoleIds: PANEL_ROLE_IDS, wellezyCompanySlug: 'planmed', wellezyLineSlug: 'planmed', planmedContentEditorRoleIds: '', planmedContentDir: dir })
  g.createError = o => Object.assign(new Error(o.message ?? 'error'), o)
  g.authError = (statusCode, message) => g.createError({ statusCode, message, data: { message } })
  g.assertSameOrigin = () => {}
  g.MSG_UNAVAILABLE = 'unavailable'
  g.canManageFinancingRate = () => false
  g.wellezyRequest = async (_e, token, method, path, options) => {
    hubCalls.push({ token, method, path, body: options?.body, query: options?.query })
    const rule = hubRules[`${method} ${path}`] ?? hubRules[method]
    return rule ?? { status: 200, data: { data: { id: 1 } } }
  }
  // auth.ts importa './wellezy' sin extensión (lo resuelve Nitro, no Node): se prueba el código real desde una copia temporal con la extensión.
  const shim = join(dir, '_shim')
  mkdirSync(shim)
  writeFileSync(join(shim, 'wellezy.ts'), read('server/utils/wellezy.ts'))
  writeFileSync(join(shim, 'auth.ts'), read('server/utils/auth.ts').replaceAll("'./wellezy'", "'./wellezy.ts'"))
  W = await import(pathToFileURL(join(shim, 'wellezy.ts')).href)
  g.wellezyMe = async () => ({ status: 200, data: { user: USERS[state.me] } })
  A = await import(pathToFileURL(join(shim, 'auth.ts')).href)
  Object.assign(g, A, await imp('server/utils/prp.ts'), await imp('server/utils/news.ts'))
  g.wellezyMe = async () => ({ status: 200, data: { user: USERS[state.me] } })
  g.useAdminSession = async () => ({ data: state.session ? { token: 'hub-token', user: { id: 1 } } : {}, clear: async () => {}, update: async () => {} })
  g.adminSession = async () => {
    if (!state.session) throw g.authError(401, 'No autenticado')
    return { session: { clear: async () => {} }, token: 't' }
  }
  const store = await imp('server/utils/aboutStore.ts')
  const pages = await imp('server/utils/sitePages.ts')
  Object.assign(g, await imp('shared/utils/aboutContent.ts'), await imp('shared/utils/sitePages.ts'), await imp('shared/utils/clinics.ts'), await imp('server/utils/clinics.ts'), store, pages)
  put = {
    about: (await imp('server/api/admin/about.put.ts')).default,
    clinics: (await imp('server/api/admin/clinics.put.ts')).default,
    upload: (await imp('server/api/admin/clinics/upload.post.ts')).default,
    page: (await imp('server/api/admin/pages/[slug].put.ts')).default,
    prpPost: (await imp('server/api/admin/prp/index.post.ts')).default,
    prpPut: (await imp('server/api/admin/prp/[id].put.ts')).default,
    prpDelete: (await imp('server/api/admin/prp/[id].delete.ts')).default,
    prpGet: (await imp('server/api/admin/prp/index.get.ts')).default
  }
})
after(() => rmSync(dir, { recursive: true, force: true }))

describe('identidad de Hub: permisos conservados solo en servidor', () => {
  test('hasHubPermission usa la lista verificada; sin lista => sin permisos', () => {
    assert.equal(A.hasHubPermission(USERS.asesora, 'prp_referrers.crear'), true)
    assert.equal(A.hasHubPermission(USERS.asesora, 'prp_referrers.editar'), false)
    assert.equal(A.hasHubPermission(USERS.sinPermisos, 'prp_referrers.crear'), false)
    assert.equal(A.hasHubPermission({ permissions: 'prp_referrers.crear' }, 'prp_referrers.crear'), false)
  })

  test('el usuario público lleva banderas derivadas, nunca la lista de permisos ni el token', () => {
    const e = ev()
    const asesora = A.toPublicUser(USERS.asesora, e)
    assert.deepEqual([asesora.canCreatePrp, asesora.canEditPrp, asesora.canDeletePrp, asesora.canEditContent], [true, false, false, false])
    const dis = A.toPublicUser(USERS.disenadora, e)
    assert.deepEqual([dis.canCreatePrp, dis.canEditPrp, dis.canDeletePrp, dis.canEditContent], [true, true, true, true])
    assert.equal('permissions' in asesora, false)
    assert.equal(JSON.stringify(asesora).includes('hub-token'), false)
  })
})

describe('contenido local: solo perfiles editores (no basta estar en NUXT_PLANMED_ADMIN_ROLE_IDS)', () => {
  test('canEditLocalContent: contenido, diseñador, admin y superadmin sí; asesora, rol solo de lista y sin rol no', () => {
    const e = ev()
    for (const k of ['contenido', 'disenadora', 'admin', 'superadmin']) assert.equal(A.canEditLocalContent(e, USERS[k]), k !== 'admin' && k !== 'superadmin' ? true : A.isAuthorizedUser(e, USERS[k]) ? true : false, k)
    assert.equal(A.canEditLocalContent(e, USERS.asesora), false)
    assert.equal(A.canEditLocalContent(e, USERS.soloLista), false)
    assert.equal(A.canEditLocalContent(e, { ...USERS.asesora, role: null }), false)
  })

  test('un nombre de rol manipulado en el navegador no cuenta: se usa el rol que devuelve Hub', () => {
    assert.equal(A.canEditLocalContent(ev({ body: { role: { name: 'admin' } }, headers: { 'x-role': 'admin' } }), USERS.asesora), false)
  })

  test('las cuatro escrituras responden 403 a la asesora y no escriben nada', async () => {
    state.me = 'asesora'
    const body = { title: 'x', heroTitle: 'x', clinics: [], dataUrl: 'data:image/png;base64,iVBORw0KGgo=', kind: 'image' }
    for (const [name, fn] of [['about', put.about], ['clinics', put.clinics], ['upload', put.upload], ['page', put.page]]) {
      const { error } = await run(fn, ev({ body }))
      assert.equal(error?.statusCode, 403, name)
    }
    assert.deepEqual(readdirSync(dir).filter(n => n !== '_shim'), [], 'no se escribió nada en el directorio de contenido')
  })

  test('un usuario solo incluido en la lista del panel tampoco puede escribir', async () => {
    state.me = 'soloLista'
    for (const fn of [put.about, put.clinics, put.upload, put.page]) assert.equal((await run(fn, ev({ body: {} }))).error?.statusCode, 403)
  })

  test('los perfiles editores superan la autorización (el rechazo, si lo hay, es de validación 422, nunca 401/403)', async () => {
    for (const k of ['contenido', 'disenadora']) {
      state.me = k
      for (const fn of [put.about, put.clinics, put.page]) {
        const { error } = await run(fn, ev({ body: {} }))
        assert.ok(!error || ![401, 403].includes(error.statusCode), `${k}: ${error?.statusCode}`)
      }
    }
  })

  test('sin sesión => 401 antes de cualquier otra cosa', async () => {
    state.session = false
    state.me = 'disenadora'
    assert.equal((await run(put.about, ev())).error?.statusCode, 401)
    state.session = true
  })

  test('los ids opcionales NUXT_PLANMED_CONTENT_EDITOR_ROLE_IDS también habilitan, pero solo si el rol está en el panel', () => {
    globalThis.useRuntimeConfig = () => ({ planmedAdminRoleIds: PANEL_ROLE_IDS, wellezyCompanySlug: 'planmed', wellezyLineSlug: 'planmed', planmedContentEditorRoleIds: '30' })
    assert.equal(A.canEditLocalContent(ev(), USERS.soloLista), true)
    assert.equal(A.canEditLocalContent(ev(), { ...USERS.soloLista, role: { id: 99, name: 'Fuera' } }), false)
    globalThis.useRuntimeConfig = () => ({ planmedAdminRoleIds: PANEL_ROLE_IDS, wellezyCompanySlug: 'planmed', wellezyLineSlug: 'planmed', planmedContentEditorRoleIds: '', planmedContentDir: dir })
  })
})

describe('micrositios (PRP): el portal reenvía y respeta los 403 de Hub', () => {
  test('crear y consultar llegan a Hub sin company_id/linea_id ni campos extra', async () => {
    hubCalls.length = 0
    state.me = 'asesora'
    hubRules.POST = { status: 201, data: { data: { id: 9 } } }
    const created = await run(put.prpPost, ev({ method: 'POST', body: { name: 'Dra', external_code: 'a1', company_id: 99, linea_id: 99, owner: 'x' } }))
    assert.ok(!created.error, created.error?.message)
    assert.deepEqual(hubCalls[0].body, { name: 'Dra', external_code: 'a1' })
    assert.equal(hubCalls[0].path, '/prp-referrers')
    hubRules.GET = { status: 200, data: { data: [] } }
    assert.ok(!(await run(put.prpGet, ev({ method: 'GET', query: {} }))).error)
  })

  test('editar, cambiar slug/código/título, activar/desactivar y eliminar: 403 de Hub => 403 del portal, sin bypass', async () => {
    hubCalls.length = 0
    hubRules.PUT = { status: 403, data: { message: 'This action is unauthorized.' } }
    hubRules.DELETE = { status: 403, data: { message: 'This action is unauthorized.' } }
    for (const body of [{ name: 'otro' }, { slug: 'nuevo', external_code: 'N', title: 'T' }, { is_active: false }, { is_active: true }]) {
      const { error } = await run(put.prpPut, ev({ method: 'PUT', body }))
      assert.equal(error?.statusCode, 403, JSON.stringify(body))
    }
    assert.equal((await run(put.prpDelete, ev({ method: 'DELETE' }))).error?.statusCode, 403)
    assert.ok(hubCalls.every(c => c.token === 'hub-token'))
  })

  test('para quien Hub autoriza (editor), editar y desactivar siguen funcionando', async () => {
    hubRules.PUT = { status: 200, data: { data: { id: 1, name: 'ok' } } }
    hubRules.DELETE = { status: 200, data: { data: { id: 1, is_active: false } } }
    assert.ok(!(await run(put.prpPut, ev({ method: 'PUT', body: { name: 'ok' } }))).error)
    assert.ok(!(await run(put.prpDelete, ev({ method: 'DELETE' }))).error)
  })

  test('la interfaz oculta lo no autorizado (solo informativo; Hub impone)', () => {
    const list = read('pages/admin/micrositios/index.vue')
    assert.match(list, /v-if="canCreate"[^>]*to="\/admin\/micrositios\/nuevo"/)
    assert.match(list, /v-if="canEdit"[^>]*:to="`\/admin\/micrositios\/\$\{item\.id\}`"/)
    assert.match(list, /v-if="canToggle\(item\)"/)
    assert.match(list, /canPrp|canEditPrp/)
    const form = read('pages/admin/micrositios/[id].vue')
    assert.match(form, /canEditPrp/)
    assert.match(form, /isNew && !canEdit \? true/)
    const mw = read('middleware/admin-auth.global.ts')
    assert.match(mw, /canEditContent/)
    assert.match(read('layouts/admin.vue'), /v-if="user\?\.canEditContent"/)
  })
})

describe('normalización de la identidad de Hub', () => {
  test('wellezyMe conserva permissions como cadenas y descarta campos desconocidos', async () => {
    const origFetch = globalThis.$fetch
    globalThis.useRuntimeConfig = () => ({ wellezyApiBaseUrl: 'https://hub.test/api' })
    globalThis.$fetch = { raw: async () => ({ status: 200, _data: { user: { id: 3, name: 'N', email: 'e@x.test', role: { id: 22, name: 'Asesora financiera' }, is_area_leader: false, permissions: ['prp_referrers.crear', 7, null, 'clientes.ver'], password: 'secreto', extra: 1 } } }) }
    const res = await W.wellezyMe({}, 'tok')
    globalThis.$fetch = origFetch
    assert.equal(res.status, 200)
    assert.deepEqual(res.data.user.permissions, ['prp_referrers.crear', 'clientes.ver'])
    assert.equal('password' in res.data.user, false)
    assert.equal('extra' in res.data.user, false)
    // Restaura la configuración base: las pruebas siguientes dependen de los slugs de Planmed.
    globalThis.useRuntimeConfig = () => ({ wellezyApiBaseUrl: 'https://hub.test/api', planmedAdminRoleIds: PANEL_ROLE_IDS, wellezyCompanySlug: 'planmed', wellezyLineSlug: 'planmed', planmedContentEditorRoleIds: '', planmedContentDir: dir })
  })

  test('si Hub no envía permissions, queda una lista vacía (falla cerrado)', async () => {
    const origFetch = globalThis.$fetch
    globalThis.$fetch = { raw: async () => ({ status: 200, _data: { user: { id: 3, name: 'N', email: 'e@x.test', role: null } } }) }
    const res = await W.wellezyMe({}, 'tok')
    globalThis.$fetch = origFetch
    assert.deepEqual(res.data.user.permissions, [])
  })
})

describe('superadmin global (verificado por Hub) vs admin', () => {
  test('el superadmin global entra al panel sin pertenecer a la línea; el rol admin NO recibe acceso global (solo por pertenecer a Planmed)', () => {
    const e = ev()
    const ajeno = { company: { slug: 'otra' }, line: { slug: 'otra' } }
    assert.equal(A.isAuthorizedUser(e, { ...USERS.superGlobal, ...ajeno }), true)
    assert.equal(A.isAuthorizedUser(e, USERS.adminOrdinario), true, 'admin de Planmed entra como cualquier usuario de la línea')
    assert.equal(A.isAuthorizedUser(e, { ...USERS.adminOrdinario, ...ajeno }), false, 'admin de otra empresa/línea: denegado')
    assert.equal(A.isAuthorizedUser(e, { ...USERS.asesora, ...ajeno, role: null, is_global_admin: 'true' }), false, 'solo true estricto cuenta como superadmin')
    assert.equal(A.isAuthorizedUser(e, { ...USERS.asesora, ...ajeno, role: { id: 500, name: 'Superadmin' } }), false, 'un nombre de rol no basta')
  })

  test('wellezyMe solo acepta is_global_admin === true estricto', async () => {
    const origFetch = globalThis.$fetch
    globalThis.useRuntimeConfig = () => ({ wellezyApiBaseUrl: 'https://hub.test/api' })
    const me = async value => {
      globalThis.$fetch = { raw: async () => ({ status: 200, _data: { user: { id: 3, name: 'N', email: 'e@x.test', role: null, is_global_admin: value } } }) }
      return (await W.wellezyMe({}, 'tok')).data.user.is_global_admin
    }
    assert.equal(await me(true), true)
    for (const bad of ['true', 1, 'yes', null, undefined]) assert.equal(await me(bad), false, String(bad))
    globalThis.$fetch = origFetch
    globalThis.useRuntimeConfig = () => ({ planmedAdminRoleIds: PANEL_ROLE_IDS, wellezyCompanySlug: 'planmed', wellezyLineSlug: 'planmed', planmedContentEditorRoleIds: '', planmedContentDir: dir })
  })

  test('el navegador no puede falsificar is_global_admin: el login usa solo la respuesta de Hub', async () => {
    const g = globalThis
    const login = (await imp('server/api/auth/login.post.ts')).default
    let loggedOut = 0
    const keep = { wellezyLogin: g.wellezyLogin, wellezyLogout: g.wellezyLogout }
    g.wellezyLogin = async () => ({ status: 200, data: { token: 'tk', user: OTRO_ROL } })
    g.wellezyLogout = async () => { loggedOut++; return 200 }
    const { error } = await run(login, ev({ method: 'POST', body: { email: 'ao@x.test', password: 'x', is_global_admin: true, role: { id: 19 } }, headers: { 'x-is-global-admin': '1' } }))
    assert.equal(error?.statusCode, 403)
    assert.equal(loggedOut, 1, 'se revoca el token recién emitido')
    g.wellezyLogin = async () => ({ status: 200, data: { token: 'tk', user: USERS.superGlobal } })
    const ok = await run(login, ev({ method: 'POST', body: { email: 'sg@x.test', password: 'x' } }))
    assert.ok(!ok.error, ok.error?.message)
    assert.equal(ok.value.user.role.name, 'Superadmin')
    assert.equal(ok.value.user.isAreaLeader, false)
    assert.equal('token' in ok.value.user || 'permissions' in ok.value.user, false)
    Object.assign(g, keep)
  })

  test('el superadmin no es líder de línea: requireAreaLeader lo rechaza y no gana permisos de micrositios por entrar', async () => {
    const origFetch = globalThis.$fetch
    globalThis.useRuntimeConfig = () => ({ wellezyApiBaseUrl: 'https://hub.test/api', planmedAdminRoleIds: PANEL_ROLE_IDS, wellezyCompanySlug: 'planmed', wellezyLineSlug: 'planmed', sessionPassword: 'x'.repeat(40) })
    globalThis.useSession = async () => ({ data: { token: 'hub-token' }, clear: async () => {}, update: async () => {} })
    globalThis.$fetch = { raw: async () => ({ status: 200, _data: { user: USERS.superGlobal } }) }
    state.me = 'superGlobal'
    const { error } = await run(A.requireAreaLeader, ev())
    delete globalThis.useSession
    globalThis.$fetch = origFetch
    globalThis.useRuntimeConfig = () => ({ planmedAdminRoleIds: PANEL_ROLE_IDS, wellezyCompanySlug: 'planmed', wellezyLineSlug: 'planmed', planmedContentEditorRoleIds: '', planmedContentDir: dir })
    assert.equal(error?.statusCode, 403)
    const pub = A.toPublicUser(USERS.superGlobal, ev())
    assert.deepEqual([pub.canCreatePrp, pub.canEditPrp, pub.canDeletePrp, pub.isAreaLeader], [false, false, false, false])
  })

  test('el superadmin global y el rol admin pueden escribir contenido local; la asesora no', async () => {
    assert.equal(A.canEditLocalContent(ev(), USERS.superGlobal), true)
    assert.equal(A.canEditLocalContent(ev(), USERS.adminOrdinario), true)
    state.me = 'superGlobal'
    for (const fn of [put.about, put.clinics, put.page]) {
      const { error } = await run(fn, ev({ body: {} }))
      assert.ok(!error || ![401, 403].includes(error.statusCode), String(error?.statusCode))
    }
    state.me = 'asesora'
    for (const fn of [put.about, put.clinics, put.upload, put.page]) assert.equal((await run(fn, ev({ body: {} }))).error?.statusCode, 403)
  })

  test('la asesora sigue consultando y creando micrositios, y Hub sigue negando editar y eliminar', async () => {
    state.me = 'asesora'
    hubCalls.length = 0
    hubRules.GET = { status: 200, data: { data: [] } }
    hubRules.POST = { status: 201, data: { data: { id: 2 } } }
    hubRules.PUT = { status: 403, data: { message: 'x' } }
    hubRules.DELETE = { status: 403, data: { message: 'x' } }
    assert.ok(!(await run(put.prpGet, ev({ method: 'GET', query: {} }))).error)
    assert.ok(!(await run(put.prpPost, ev({ method: 'POST', body: { name: 'a', external_code: 'b' } }))).error)
    assert.equal((await run(put.prpPut, ev({ method: 'PUT', body: { name: 'z' } }))).error?.statusCode, 403)
    assert.equal((await run(put.prpDelete, ev({ method: 'DELETE' }))).error?.statusCode, 403)
  })
})

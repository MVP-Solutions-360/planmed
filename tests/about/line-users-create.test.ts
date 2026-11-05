// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Alta de colaboradores desde el portal (POST /api/admin/config/line-users) y catálogos (GET .../options). Usa el código REAL de
// auth.ts (requireAreaLeader), origin.ts y lineUsers.ts, con un Hub simulado: nunca se contacta un Hub real.
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
const TOKEN = 'hub-sanctum-secret-token'

const base = { company: { slug: 'planmed' }, line: { slug: 'planmed' }, permissions: [] }
const USERS = {
  lider: { id: 1, name: 'Líder', email: 'l@x.test', role: { id: 3, name: 'Líder' }, is_area_leader: true, ...base },
  asesora: { id: 2, name: 'Asesora', email: 'a@x.test', role: { id: 22, name: 'Asesora financiera' }, is_area_leader: false, ...base },
  superadmin: { id: 9, name: 'Super', email: 's@x.test', role: null, is_area_leader: false, is_global_admin: true, ...base },
  liderOtraLinea: { id: 4, name: 'Otro', email: 'o@x.test', role: null, is_area_leader: true, company: { slug: 'planmed' }, line: { slug: 'crediestetica' }, permissions: [] }
}

const state = { me: 'lider', session: true, hub: { status: 201, data: null }, cleared: false }
const hubCalls = []
let dir, post, options

const TEMP = 'Tmp#Pass-2027x'
const HUB_201 = {
  data: { id: 50, user_id: 70, name: 'Ana Pérez', email: 'ana@x.test', role: { id: 22, name: 'Asesora financiera' }, status: 'active', is_area_leader: false, temporary_password: TEMP, password: 'no-debe-salir', token: TOKEN },
  meta: { must_change_password: true }
}
const HUB_OPTIONS = { data: { company: { id: 3, name: 'Planmed SAS' }, linea: { id: 3, name: 'Planmed' }, roles: [{ id: 22, name: 'Asesora financiera' }], departments: [{ id: 1, name: 'x' }] } }
const VALID = { name: ' Ana ', lastname: 'Pérez', email: ' ANA@X.Test ', document_type: 'CC', document_number: '123', role_id: '22' }

const ev = (body = VALID, headers = { host: HOST, origin: `https://${HOST}` }) => ({ method: 'POST', body, headers })
const run = async (fn, e) => { try { return { value: await fn(e) } } catch (error) { return { error } } }
const postCalls = () => hubCalls.filter(c => c.method === 'POST')

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'lu-create-'))
  const g = globalThis
  g.defineEventHandler = fn => fn
  g.readBody = async e => e.body
  g.setHeader = () => {}
  g.setResponseStatus = (e, s) => { e.status = s }
  g.getRequestHeader = (e, n) => e.headers[n]
  g.createError = o => Object.assign(new Error(o.message ?? 'error'), o)
  g.authError = (statusCode, message) => g.createError({ statusCode, message, data: { message } })
  g.useRuntimeConfig = () => ({ planmedAdminRoleIds: '', wellezyCompanySlug: 'planmed', wellezyLineSlug: 'planmed' })
  g.canManageFinancingRate = () => false
  g.MSG_UNAVAILABLE = 'unavailable'
  g.MSG_LEADER_ONLY = 'solo líder'
  // useAdminSession (real, de auth.ts) llama a useSession de h3: se simula la cookie sellada.
  g.useSession = async () => ({ data: state.session ? { token: TOKEN, user: { id: 1 } } : {}, clear: async () => { state.cleared = true }, update: async () => {} })
  g.wellezyRequest = async (_e, token, method, path, opts) => {
    hubCalls.push({ token, method, path, body: opts?.body, query: opts?.query, timeout: opts?.timeout })
    return state.hub
  }
  // auth.ts importa './wellezy' sin extensión (lo resuelve Nitro): se prueba el código real desde una copia temporal.
  const shim = join(dir, '_shim')
  mkdirSync(shim)
  writeFileSync(join(shim, 'wellezy.ts'), read('server/utils/wellezy.ts'))
  writeFileSync(join(shim, 'auth.ts'), read('server/utils/auth.ts').replaceAll("'./wellezy'", "'./wellezy.ts'"))
  await import(pathToFileURL(join(shim, 'wellezy.ts')).href)
  g.wellezyMe = async () => ({ status: 200, data: { user: USERS[state.me] } })
  const A = await import(pathToFileURL(join(shim, 'auth.ts')).href)
  Object.assign(g, A, await imp('shared/utils/lineUserDocumentTypes.ts'), await imp('server/utils/origin.ts'), await imp('server/utils/lineUsers.ts'))
  // requireAreaLeader (real) usa wellezyMe importado dentro del shim; se simula el estado del usuario a través de wellezyRequest/wellezyMe real:
  // el shim llama a su propio wellezyMe -> $fetch. Para no tocar red, se intercepta $fetch.
  g.$fetch = { raw: async (url) => {
    if (String(url).endsWith('/auth/me')) return state.session && state.me ? { status: 200, _data: { user: USERS[state.me] } } : { status: 401, _data: {} }
    return { status: 0, _data: {} }
  } }
  g.useRuntimeConfig = () => ({ planmedAdminRoleIds: '', wellezyApiBaseUrl: 'http://hub.test/api', sessionPassword: 'x'.repeat(40), wellezyCompanySlug: 'planmed', wellezyLineSlug: 'planmed' })
  post = (await imp('server/api/admin/config/line-users.post.ts')).default
  options = (await imp('server/api/admin/config/line-users/options.get.ts')).default
})
after(() => rmSync(dir, { recursive: true, force: true }))

beforeEach(() => {
  hubCalls.length = 0
  Object.assign(state, { me: 'lider', session: true, hub: { status: 201, data: HUB_201 }, cleared: false })
})

describe('alta: autorización y orden', () => {
  test('líder autorizado crea: 201, una sola llamada POST a /cms/line-users con el token de la sesión', async () => {
    const e = ev()
    const { value, error } = await run(post, e)
    assert.ok(!error, error?.message)
    assert.equal(e.status, 201)
    assert.equal(postCalls().length, 1)
    assert.deepEqual([postCalls()[0].token, postCalls()[0].path], [TOKEN, '/cms/line-users'])
    assert.deepEqual(Object.keys(value.user).sort(), ['email', 'id', 'isAreaLeader', 'name', 'role', 'status', 'userId'])
    assert.equal(value.temporaryPassword, TEMP)
    assert.deepEqual(Object.keys(value).sort(), ['temporaryPassword', 'user'])
  })

  test('sin sesión => 401 y Hub no recibe el alta', async () => {
    state.session = false
    assert.equal((await run(post, ev())).error.statusCode, 401)
    assert.equal(postCalls().length, 0)
  })

  test('no líder => 403; superadmin global => 403; líder de otra línea => 403; Hub no recibe el alta', async () => {
    for (const who of ['asesora', 'superadmin', 'liderOtraLinea']) {
      state.me = who
      hubCalls.length = 0
      assert.equal((await run(post, ev())).error.statusCode, 403, who)
      assert.equal(postCalls().length, 0, who)
    }
  })

  test('origen inválido o ausente => 403 antes de consultar sesión o Hub', async () => {
    const bad = [{ host: HOST }, { host: HOST, origin: 'https://evil.example' }, { host: HOST, origin: 'null' }, { host: HOST, 'sec-fetch-site': 'cross-site' }, { host: HOST, referer: 'https://evil.example/x' }]
    for (const headers of bad) {
      hubCalls.length = 0
      state.session = false // si el origen no se validara primero, saldría 401
      assert.equal((await run(post, ev(VALID, headers))).error.statusCode, 403, JSON.stringify(headers))
      assert.equal(hubCalls.length, 0)
    }
  })

  test('options: líder obtiene solo empresa, línea y roles de Hub; sin sesión 401; no líder y superadmin 403', async () => {
    state.hub = { status: 200, data: HUB_OPTIONS }
    const { value, error } = await run(options, { method: 'GET', headers: {} })
    assert.ok(!error, error?.message)
    assert.deepEqual(value, { company: { id: 3, name: 'Planmed SAS' }, linea: { id: 3, name: 'Planmed' }, roles: [{ id: 22, name: 'Asesora financiera' }] })
    assert.deepEqual([hubCalls[0].method, hubCalls[0].path], ['GET', '/cms/line-users/options'])
    state.session = false
    assert.equal((await run(options, { method: 'GET', headers: {} })).error.statusCode, 401)
    state.session = true
    for (const who of ['asesora', 'superadmin']) { state.me = who; assert.equal((await run(options, { method: 'GET', headers: {} })).error.statusCode, 403, who) }
  })
})

describe('alta: lo que viaja a Hub', () => {
  test('salario y auxilio siempre 0 aunque el cliente envíe otros valores; correo normalizado y textos recortados', async () => {
    await run(post, ev({ ...VALID, base_salary: 9999999, transportation_assistance: 500000 }))
    assert.deepEqual(postCalls()[0].body, { name: 'Ana', lastname: 'Pérez', email: 'ana@x.test', document_type: 'CC', document_number: '123', role_id: 22, base_salary: 0, transportation_assistance: 0 })
  })

  test('company_id, linea_id, password, is_area_leader y campos desconocidos no se reenvían', async () => {
    await run(post, ev({ ...VALID, company_id: 99, linea_id: 98, password: 'Hack123!', is_area_leader: true, status: 'inactive', department_id: 5, evil: 'x', user_id: 1 }))
    const sent = postCalls()[0].body
    assert.deepEqual(Object.keys(sent).sort(), ['base_salary', 'document_number', 'document_type', 'email', 'lastname', 'name', 'role_id', 'transportation_assistance'])
    for (const k of ['company_id', 'linea_id', 'password', 'is_area_leader', 'status', 'department_id', 'evil', 'user_id']) assert.ok(!(k in sent), k)
  })

  test('validación estricta: campos faltantes o inválidos => 422 por campo y Hub no se llama', async () => {
    for (const body of [null, 'texto', [], {}, { ...VALID, name: '  ' }, { ...VALID, email: 'no-es-correo' }, { ...VALID, role_id: 'abc' }, { ...VALID, role_id: -1 }, { ...VALID, document_type: 'x'.repeat(21) }, { ...VALID, name: 5 }]) {
      hubCalls.length = 0
      const { error } = await run(post, ev(body))
      assert.equal(error?.statusCode, 422, JSON.stringify(body))
      assert.ok(Object.keys(error.data.errors).length > 0)
      assert.equal(postCalls().length, 0)
    }
    const { error } = await run(post, ev({ ...VALID, email: 'x', name: '' }))
    assert.deepEqual(Object.keys(error.data.errors).sort(), ['email', 'name'])
  })
})

describe('alta: tipo de documento y tiempo de espera', () => {
  test('solo se aceptan CC, CE y PP (mismos valores que el formulario de RR. HH. del Hub)', async () => {
    for (const ok of ['CC', 'CE', 'PP']) {
      hubCalls.length = 0
      assert.ok(!(await run(post, ev({ ...VALID, document_type: ok }))).error, ok)
      assert.equal(postCalls()[0].body.document_type, ok)
    }
    for (const bad of ['Cédula', 'cc', 'TI', 'Pasaporte', '']) {
      hubCalls.length = 0
      const { error } = await run(post, ev({ ...VALID, document_type: bad }))
      assert.equal(error?.statusCode, 422, bad)
      assert.ok(error.data.errors.document_type, bad)
      assert.equal(postCalls().length, 0)
    }
  })

  test('el alta espera hasta 30 s (el Hub hashea, escribe y envía el correo en la misma petición)', async () => {
    await run(post, ev())
    assert.equal(postCalls()[0].timeout, 30000)
  })
})

describe('alta: respuestas de Hub', () => {
  test('201 entrega la contraseña temporal UNA vez y nada más: ni token, ni hash, ni campos extra de Hub', async () => {
    const { value } = await run(post, ev())
    assert.equal(value.temporaryPassword, TEMP)
    const text = JSON.stringify(value)
    assert.ok(!text.includes(TOKEN) && !text.includes('no-debe-salir') && !/"token"|activation|"password"/i.test(text))
  })

  test('201 sin contraseña temporal => operación NO confirmada (504, revisar el listado) y sin reintento', async () => {
    const { temporary_password, ...noPassword } = HUB_201.data
    for (const data of [{ ...HUB_201, data: noPassword }, { ...HUB_201, data: { ...noPassword, temporary_password: '' } }, { ...HUB_201, data: { ...noPassword, temporary_password: 12345 } }, { ...HUB_201, data: { ...noPassword, temporary_password: 'x'.repeat(129) } }]) {
      hubCalls.length = 0
      state.hub = { status: 201, data }
      const { error } = await run(post, ev())
      assert.equal(error.statusCode, 504)
      assert.equal(error.data.code, 'creation_unconfirmed')
      assert.match(error.message, /listado/)
      assert.ok(!JSON.stringify(error).includes('Tmp#'))
      assert.equal(postCalls().length, 1)
    }
  })

  test('201 irreconocible => no se confirma la creación (504)', async () => {
    state.hub = { status: 201, data: {} }
    const { error } = await run(post, ev())
    assert.equal(error.statusCode, 504)
    assert.match(error.message, /listado/)
  })

  test('422 conserva los detalles por campo (solo campos del formulario; el resto en _form)', async () => {
    state.hub = { status: 422, data: { message: 'invalid', errors: { email: ['Ya existe.'], document_number: ['Duplicado.'], is_area_leader: ['No habilitado.'], role_id: ['Rol no permitido.'] } } }
    const { error } = await run(post, ev())
    assert.equal(error.statusCode, 422)
    assert.deepEqual(error.data.errors, { email: ['Ya existe.'], document_number: ['Duplicado.'], _form: ['No habilitado.'], role_id: ['Rol no permitido.'] })
  })

  test('409 conflicto, 429, 403, 500 y 503 de correo se mapean sin reintentar', async () => {
    const cases = [
      [{ status: 409, data: { message: 'Conflicto de datos.' } }, 409, /Conflicto/],
      [{ status: 429, data: {} }, 429, /Demasiados/],
      [{ status: 403, data: {} }, 403, /líder/],
      [{ status: 500, data: { message: 'interno SQL secreto' } }, 502, /No se pudo crear/],
      [{ status: 503, data: {} }, 503, /conectar/]
    ]
    for (const [hub, code, re] of cases) {
      hubCalls.length = 0
      state.hub = hub
      const { error } = await run(post, ev())
      assert.equal(error.statusCode, code, JSON.stringify(hub))
      assert.match(error.message, re)
      assert.ok(!error.message.includes('SQL'))
      assert.equal(postCalls().length, 1, 'una sola llamada: sin reintentos')
    }
  })

  test('401 de Hub limpia la sesión y devuelve 401', async () => {
    state.hub = { status: 401, data: {} }
    assert.equal((await run(post, ev())).error.statusCode, 401)
    assert.equal(state.cleared, true)
  })

  test('timeout o status 0 => 504 «no se pudo confirmar» y una única llamada (sin reintento)', async () => {
    for (const status of [0, 502, 504]) {
      hubCalls.length = 0
      state.hub = { status }
      const { error } = await run(post, ev())
      assert.equal(error.statusCode, 504, String(status))
      assert.match(error.message, /No se pudo confirmar/)
      assert.match(error.message, /listado/)
      assert.equal(error.data.code, 'creation_unconfirmed')
      assert.equal(postCalls().length, 1)
    }
  })
})

describe('interfaz y código', () => {
  const form = read('components/admin/LineUserCreateForm.vue')
  const panel = read('components/admin/LineUsersPanel.vue')

  test('el envío se bloquea mientras hay una petición en vuelo (doble clic = una sola solicitud)', async () => {
    assert.match(form, /if \(saving\.value\) return\s*\n\s*saving\.value = true/)
    assert.match(form, /:disabled="saving/)
    // Simulación del manejador con la misma guarda: dos clics seguidos producen una sola solicitud.
    let calls = 0
    let saving = false
    let release
    const submit = async () => { if (saving) return; saving = true; try { calls++; await new Promise(r => { release = r }) } finally { saving = false } }
    const a = submit(); const b = submit()
    release(); await Promise.all([a, b])
    assert.equal(calls, 1)
  })

  test('el tipo de documento es una lista con las opciones de RR. HH. y no un campo libre', () => {
    assert.match(form, /<select id="lu-document_type"[^>]*v-model="form\.document_type"/)
    assert.match(form, /v-for="t in LINE_USER_DOCUMENT_TYPES"/)
    assert.ok(!/key: 'document_type'/.test(form))
    assert.deepEqual(LINE_USER_DOCUMENT_TYPES.map(t => [t.value, t.label]), [['CC', 'Cédula de Ciudadanía'], ['CE', 'Cédula de Extranjería'], ['PP', 'Pasaporte']])
  })

  test('la interfaz no pide salario ni auxilio, ni empresa/línea editables; muestra el contexto como texto', () => {
    assert.ok(!/salary|transportation|salario|auxilio de transporte"?\s*<\/label>/i.test(form.replace(/El salario y el auxilio de transporte quedan en 0[^<]*/, '')))
    assert.ok(!/company_id|linea_id|password|is_area_leader/.test(form))
    assert.match(form, /ctx-company/)
    assert.match(form, /ctx-linea/)
    assert.ok(!/<input[^>]*(company|linea)/i.test(form))
  })

  test('muestra correo y contraseña temporal, permite copiar, avisa que es una sola vez y actualiza el listado', () => {
    assert.match(panel, /data-testid="cred-email"/)
    assert.match(panel, /data-testid="cred-password"/)
    assert.match(panel, /navigator\.clipboard\.writeText/)
    assert.match(panel, /copy-password/)
    assert.match(panel, /copy-credentials/)
    assert.match(panel, /se muestra una sola vez/)
    assert.match(panel, /function onCreated[\s\S]*load\(\)/)
  })

  test('la contraseña solo vive en memoria: se borra al cerrar el aviso y al desmontar; no hay almacenamiento, URL ni logs', () => {
    assert.match(panel, /function closeCredentials\(\) \{\s*credentials\.value = null/)
    assert.match(panel, /onBeforeUnmount\([\s\S]*?credentials\.value = null/)
    const all = form + panel + read('services/LineUsersService.ts')
    assert.ok(!/localStorage|sessionStorage|indexedDB|document\.cookie|console\.|useCookie|useState/.test(all))
    // El botón «Nuevo colaborador» no está mientras se muestran las credenciales (no se pierden por accidente).
    assert.match(panel, /v-if="!showForm && !credentials"/)
  })

  test('el servicio del cliente solo usa /api/admin/config/line-users y no envía campos prohibidos', () => {
    const svc = read('services/LineUsersService.ts')
    assert.match(svc, /\/api\/admin\/config\/line-users\/options/)
    assert.ok(!/company_id|linea_id|password|is_area_leader|base_salary/.test(svc))
  })

  test('las rutas nuevas validan origen primero y exigen líder (no solo acceso al panel)', () => {
    const postSrc = read('server/api/admin/config/line-users.post.ts')
    assert.ok(postSrc.indexOf('assertSameOrigin') < postSrc.indexOf('requireAreaLeader'))
    assert.ok(postSrc.indexOf('requireAreaLeader') < postSrc.indexOf('readBody'))
    assert.match(read('server/api/admin/config/line-users/options.get.ts'), /fetchLineUserOptions/)
    assert.match(read('server/utils/lineUsers.ts'), /export async function fetchLineUserOptions[\s\S]*await requireAreaLeader/)
    assert.ok(!/isAuthorizedUser/.test(read('server/utils/lineUsers.ts') + postSrc))
  })
})

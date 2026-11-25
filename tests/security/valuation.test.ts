// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Solicitud de valoración («Pide tu cita») de Planmed: el CRM Médico (formulario multipart) es el destino PRINCIPAL y el correo es una notificación
// COMPLEMENTARIA que sale solo DESPUÉS de que el CRM confirma. Se ejecuta el código REAL del servidor con CRM y SMTP SIMULADOS: no se llama al CRM real
// ni se envía ningún correo. Del CRM se conocen el formulario público (sesión Laravel y `_token`) y la respuesta de éxito (`mensagge`); las demás respuestas son
// INVENTADAS. Datos, tokens, cookies, claves e identificadores son FICTICIOS.
import { test, describe, before, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { ROOT } from '../recommendations/harness.ts'

const fileUrl = rel => pathToFileURL(join(ROOT, rel)).href
const read = rel => readFileSync(join(ROOT, rel), 'utf8')
const CRM_URL = 'https://crm.example.test/crm-public/api/clients/forms' // CRM simulado (la prueba nunca usa el real)
const CRM_CFG = { crmFormUrl: CRM_URL, crmFormUserId: 101, crmFormLineId: 102, crmFormAdvisorId: '103' } // identificadores ficticios
const OK_BODY = { mensagge: 'Los datos fueron registrados satisfactoriamente' }
const FORM_PAGE = 'https://crm.example.test/crm-public/forms/101/102' // formulario público derivado del destino y los identificadores
const TOKEN = 'tokenFicticio0123456789abcdefghijklmnop'
const COOKIES = ['XSRF-TOKEN=xsrfFicticia%3D; expires=Wed, 25-Nov-2026 23:00:00 GMT; Max-Age=7200; path=/', 'laravel_session=sesionFicticia%3D; path=/; httponly']
const formHtml = (token = TOKEN) => `<form id="store" method="post"><input type="hidden" name="_token" value="${token}"><input type="text" name="nombres"></form>`
/** Respuesta simulada del GET del formulario público. */
const page = ({ status = 200, cookies = COOKIES, html = formHtml() } = {}) => async () => ({ status, headers: { getSetCookie: () => cookies }, text: async () => html, body: null })
const WINDOW = 10 * 60_000

const MAIL_CFG = {
  mailHost: 'smtp.example.test', mailPort: 465, mailUsername: 'sender@example.test', mailPassword: 'clave-ficticia', mailFromAddress: '', mailFromName: 'Marca de prueba',
  valuationTo: 'valoracion@example.test', valuationCc: 'copia@example.test', public: { appName: 'Marca de prueba' }
}
const state = { cfg: {}, fetchCalls: [], fetchImpl: null, pageCalls: [], pageImpl: null, clock: 1_800_000_000_000, sent: [], sendImpl: null, order: [], logs: [] }
let dir, mod, mail, crm, realNow, realError, realFetch

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'valuation-'))
  realNow = Date.now
  realError = console.error
  console.error = (...a) => { state.logs.push(a.map(String).join(' ')) }
  Date.now = () => state.clock
  const g = globalThis
  g.createError = o => Object.assign(new Error(o.message ?? 'error'), o)
  g.useRuntimeConfig = () => state.cfg
  g.setHeader = () => {}
  g.assertSameOrigin = () => {}
  g.getRequestIP = () => '203.0.113.9'
  g.getRequestHeader = () => undefined
  g.readBody = async e => e.body
  realFetch = g.fetch
  // `fetchCalls` = envíos del paciente (POST); `pageCalls` = cargas del formulario público (GET).
  g.fetch = (url, init) => {
    if (init.method === 'GET') { state.pageCalls.push([url, init]); return state.pageImpl(url, init) }
    state.fetchCalls.push([url, init]); state.order.push('crm'); return state.fetchImpl(url, init)
  }
  const base = fileUrl('shared/utils')
  const fix = s => s.replace(/'#shared\/utils\/([A-Za-z]+)'/g, (_, m) => `'${base}/${m}.ts'`).replace("'./formMail'", "'./formMail.ts'").replace("'./crmClient'", "'./crmClient.ts'")
  writeFileSync(join(dir, 'formMail.ts'), fix(read('server/utils/formMail.ts')))
  writeFileSync(join(dir, 'crmClient.ts'), fix(read('server/utils/crmClient.ts')))
  writeFileSync(join(dir, 'valuation.ts'), fix(read('server/utils/valuation.ts')))
  mod = await import(pathToFileURL(join(dir, 'valuation.ts')).href)
  mail = await import(pathToFileURL(join(dir, 'formMail.ts')).href)
  crm = await import(pathToFileURL(join(dir, 'crmClient.ts')).href)
})
beforeEach(() => {
  state.cfg = { ...CRM_CFG, ...MAIL_CFG }
  state.fetchCalls = []
  state.pageCalls = []
  state.pageImpl = page()
  state.order = []
  state.logs = []
  state.sent = []
  state.fetchImpl = async () => ({ ok: true, status: 200, json: async () => OK_BODY })
  state.sendImpl = async () => { state.order.push('mail'); return { accepted: ['valoracion@example.test', 'copia@example.test'], rejected: [] } }
  state.clock += 3 * WINDOW
  mod.resetValuationGuards()
  mail.resetMailGuards()
  mail.setMailTransportFactory(async () => ({ sendMail: async (msg) => { state.sent.push(msg); return state.sendImpl(msg) }, close: () => {} }))
})
after(() => {
  mail.resetMailGuards()
  mail.setMailTransportFactory()
  Date.now = realNow
  console.error = realError
  globalThis.fetch = realFetch
  rmSync(dir, { recursive: true, force: true })
})

const VALID = {
  nombres: 'Ana', apellidos: 'Prueba', identificacion: '12345678', fecha_nacimiento: '1990-05-10', direccion: 'Bogotá',
  telefono: '3001234567', email: 'ana@example.com', name_surgery: 'Rinoplastia', forma_pago: 'Financiación', accept: true
}
const sentFields = (i = 0) => [...state.fetchCalls[i][1].body.entries()]
const sentBody = (i = 0) => Object.fromEntries(sentFields(i))
const reply = (status, body) => async () => ({ ok: status >= 200 && status < 300, status, json: async () => { if (body === undefined) throw new SyntaxError('no json'); return body } })
const netError = code => async () => { throw Object.assign(new TypeError('fetch failed'), { cause: Object.assign(new Error(code), { code }) }) }
const run = async (fn, e) => { try { return { value: await fn(e) } } catch (error) { return { error } } }
const submit = async (body = { ...VALID }) => { const r = await run(mod.handleValuation, { method: 'POST', body, headers: {} }); await mail.settleNotifications(); return r }
const smtpDown = () => { state.sendImpl = async () => { state.order.push('mail-fail'); throw Object.assign(new Error('boom'), { code: 'ECONNREFUSED' }) } }
const key = () => `valuation|${createHash('sha256').update(`${VALID.identificacion}|${VALID.telefono}`).digest('hex')}`

describe('CRM principal + correo complementario', () => {
  test('CRM ok + correo ok => {ok:true}; el CRM se llama primero y el correo sale después, con asunto y destinatarios del servidor', async () => {
    const r = await submit()
    assert.deepEqual(r.value, { ok: true })
    assert.deepEqual(state.order, ['crm', 'mail'])
    assert.equal(state.fetchCalls.length, 1)
    assert.equal(state.fetchCalls[0][0], CRM_URL)
    assert.equal(state.sent.length, 1)
    assert.equal(state.sent[0].subject, '[Marca de prueba] Nueva solicitud de valoración')
    assert.deepEqual(state.sent[0].to, ['valoracion@example.test'])
    assert.deepEqual(state.sent[0].cc, ['copia@example.test'])
  })

  test('el CRM recibe un formulario multipart con los nombres exactos, con la sesión y el token del formulario público, sin Content-Type manual ni redirecciones', async () => {
    await submit({ ...VALID, nombres: '  Ana   María ', apellidos: ' Prueba   Ficticia ', direccion: '  Santa   Rosa de Osos ' })
    const [url, init] = state.fetchCalls[0]
    assert.equal(url, CRM_URL)
    assert.equal(init.method, 'POST')
    assert.equal(init.redirect, 'manual')
    assert.ok(init.body instanceof FormData)
    assert.deepEqual(init.headers, {
      Accept: 'application/json', Cookie: 'XSRF-TOKEN=xsrfFicticia%3D; laravel_session=sesionFicticia%3D',
      'X-Requested-With': 'XMLHttpRequest', Origin: 'https://crm.example.test', Referer: FORM_PAGE
    })
    assert.deepEqual(sentFields(), [
      ['_token', TOKEN], ['_method', 'post'], ['nombres', 'Ana María'], ['apellidos', 'Prueba Ficticia'], ['identificacion', '12345678'], ['fecha_nacimiento', '1990-05-10'],
      ['direccion', 'Santa Rosa de Osos'], ['telefono', '3001234567'], ['email', 'ana@example.com'], ['name_surgery', 'Rinoplastia'], ['forma_pago', 'Financiacion'],
      ['state', 'No Contactada'], ['origen', 'Formulario Web'], ['id_user', '101'], ['id_line', '102'], ['id_user_asesora', '103'], ['accept', '1']
    ])
    for (const old of ['name', 'phone', 'city', 'ad_headline', 'advisor_email']) assert.equal(old in sentBody(), false, old)
  })

  test('«Contado» se envía como lo rotula el formulario del CRM', async () => {
    assert.deepEqual((await submit({ ...VALID, forma_pago: 'Contado' })).value, { ok: true })
    assert.equal(sentBody().forma_pago, 'Contado')
  })

  test('la fecha viaja en AAAA-MM-DD y el teléfono solo con dígitos (campo numérico en el formulario original)', async () => {
    await submit({ ...VALID, fecha_nacimiento: '2000-01-09', telefono: '+57 (300) 123-4567' })
    assert.equal(sentBody().fecha_nacimiento, '2000-01-09')
    assert.equal(sentBody().telefono, '573001234567')
  })

  test('una fecha en otro formato o inexistente no llega al CRM', async () => {
    for (const fecha_nacimiento of ['10/05/1990', '1990-5-1', '1990-02-30', '']) {
      mod.resetValuationGuards(); state.fetchCalls = []
      const r = await submit({ ...VALID, fecha_nacimiento })
      assert.equal(r.error?.statusCode, 422, fecha_nacimiento)
      assert.equal(state.fetchCalls.length, 0)
    }
  })

  test('el correo complementario conserva los datos tal como se muestran en el formulario', async () => {
    await submit({ ...VALID, direccion: 'Santa Rosa de Osos' })
    assert.match(state.sent[0].text, /Ciudad: Santa Rosa de Osos/)
    assert.match(state.sent[0].text, /Forma de pago: Financiación/)
  })

  test('destino e identificadores salen solo de la configuración; si falta o es inválido uno => 503 sin petición', async () => {
    const bad = [
      { crmFormUrl: '' }, { crmFormUserId: '' }, { crmFormLineId: '' }, { crmFormAdvisorId: '' }, { crmFormLineId: 'abc' }, { crmFormUserId: '-1' },
      { crmFormAdvisorId: '0' }, { crmFormLineId: '1.5' }, { crmFormUrl: 'http://crm.dominio.com/api' }, { crmFormUrl: 'https://user:clave@crm.example.test/crm-public/api/clients/forms' }, { crmFormUrl: 'no es url' },
      { crmFormUrl: 'https://crm.example.test/api/chat/create/client' }, { crmFormUrl: `${CRM_URL}?a=1` }, { crmFormUrl: 'http://crm.dominio.com/crm-public/api/clients/forms' }
    ]
    for (const override of bad) {
      state.cfg = { ...CRM_CFG, ...override }
      mod.resetValuationGuards(); state.fetchCalls = []
      const r = await submit()
      assert.equal(r.error?.statusCode, 503, JSON.stringify(override))
      assert.equal(r.error.data.reason, 'not_configured')
      assert.equal(state.fetchCalls.length + state.pageCalls.length, 0)
    }
    assert.deepEqual(crm.resolveCrmClientConfig({}).invalid, ['NUXT_CRM_FORM_URL', 'NUXT_CRM_FORM_USER_ID', 'NUXT_CRM_FORM_LINE_ID', 'NUXT_CRM_FORM_ADVISOR_ID'])
    assert.equal(state.sent.length, 0)
  })

  test('las variables de la integración anterior ya no activan ningún envío', async () => {
    state.cfg = { crmClientUrl: 'https://crm.example.test/api/chat/create/client', crmClientLineId: 12, crmClientAdvisorEmail: 'x@example.test' }
    const r = await submit()
    assert.equal(r.error?.data.reason, 'not_configured')
    assert.equal(state.fetchCalls.length, 0)
  })

  test('CRM ok + correo FALLA => el usuario ve el mismo éxito, el registro del CRM se conserva y el correo queda pendiente de reintento', async () => {
    smtpDown()
    const r = await submit()
    assert.equal(r.error, undefined)
    assert.deepEqual(r.value, { ok: true })
    assert.equal(state.fetchCalls.length, 1)
    assert.equal(mail.notificationState(key()), 'pending')
    assert.doesNotMatch(state.logs.join('\n'), /Ana|Prueba|example\.com|12345678/)
  })

  test('CRM ok + correo sin configurar (destinatario vacío) => éxito normal y ningún envío', async () => {
    state.cfg = { ...CRM_CFG }
    const r = await submit()
    assert.deepEqual(r.value, { ok: true })
    assert.equal(state.sent.length, 0)
  })

  test('el correo no se duplica si el mismo envío se repite tras fallar el correo', async () => {
    smtpDown()
    await submit()
    state.sendImpl = async () => ({ accepted: ['valoracion@example.test', 'copia@example.test'], rejected: [] })
    mod.resetValuationGuards() // el bloqueo de doble envío del CRM es independiente: aquí se aísla la lógica del correo
    await submit()
    await submit()
    assert.equal(state.sent.filter((m, i) => i > 0).length, 1, 'solo un correo aceptado tras el fallo')
  })
})

describe('Sesión y CSRF', () => {
  test('primero un GET del formulario público, sin datos ni credenciales; después el POST', async () => {
    const sequence = []
    state.pageImpl = async (...a) => { sequence.push('GET'); return page()(...a) }
    state.fetchImpl = async () => { sequence.push('POST'); return { status: 200, json: async () => OK_BODY } }
    assert.deepEqual((await submit()).value, { ok: true })
    assert.deepEqual(sequence, ['GET', 'POST'])
    const [url, init] = state.pageCalls[0]
    assert.equal(url, FORM_PAGE)
    assert.deepEqual([init.method, init.redirect, init.headers, init.body], ['GET', 'manual', { Accept: 'text/html' }, undefined])
  })

  test('cada paciente usa su propia sesión: no se reutilizan token ni cookies', async () => {
    await submit()
    state.pageImpl = page({ html: formHtml('otroTokenFicticio987654321'), cookies: ['laravel_session=otraSesion; path=/'] })
    await submit({ ...VALID, identificacion: '99999999' })
    assert.equal(state.pageCalls.length, 2)
    assert.equal(sentBody(1)._token, 'otroTokenFicticio987654321')
    assert.equal(state.fetchCalls[1][1].headers.Cookie, 'laravel_session=otraSesion')
  })

  test('token y cookies: extracción tolerante al HTML y cabecera solo con nombre=valor', () => {
    assert.equal(crm.extractCsrfToken(`<input value='${TOKEN}' type='hidden' name='_token' />`), TOKEN)
    for (const html of ['', '<input name="_token">', '<input name="_token" value="">', '<input name="_token" value="a b c d e f g h i j">', '<input name="token" value="abcdefghijklmnopqrst">']) {
      assert.equal(crm.extractCsrfToken(html), '', html)
    }
    assert.equal(crm.cookieHeader(['a=1; path=/', 'b=x=y; Secure', 'c=deleted', 'sin-igual', 'a=2']), 'a=2; b=x=y')
  })

  test('sin sesión válida no se envía el paciente: 503 crm_session, sin correo y se puede reintentar', async () => {
    const cases = [
      ...[302, 403, 404, 419, 500, 503].map(status => [`HTTP ${status}`, page({ status })]),
      ['sin token', page({ html: '<form></form>' })], ['sin cookies', page({ cookies: [] })],
      ['sin conexión', netError('ECONNREFUSED')], ['corte', netError('ECONNRESET')],
      ['cuerpo cortado', async () => ({ status: 200, headers: { getSetCookie: () => COOKIES }, text: async () => { throw new Error('corte') } })]
    ]
    for (const [label, impl] of cases) {
      mod.resetValuationGuards(); state.fetchCalls = []; state.pageCalls = []; state.sent = []
      state.pageImpl = impl
      const r = await submit()
      assert.equal(r.error?.statusCode, 503, label)
      assert.equal(r.error.data.reason, 'crm_session', label)
      assert.equal(r.error.data.uncertain, undefined, label)
      assert.equal(state.pageCalls.length, 1, `sin reintentos: ${label}`)
      assert.equal(state.fetchCalls.length, 0, label)
      assert.equal(state.sent.length, 0, label)
      state.pageImpl = page()
      assert.deepEqual((await submit()).value, { ok: true }, label)
    }
  })

  test('tiempo agotado al cargar el formulario: 503, sin POST', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    state.pageImpl = (_url, init) => new Promise((_res, rej) => { init.signal.addEventListener('abort', () => rej(Object.assign(new Error('abort'), { name: 'AbortError' }))) })
    const pending = run(mod.handleValuation, { method: 'POST', body: { ...VALID }, headers: {} })
    await new Promise(res => setImmediate(res))
    t.mock.timers.tick(15_000)
    const r = await pending
    assert.equal(r.error?.statusCode, 503)
    assert.equal(r.error.data.reason, 'crm_session')
    assert.equal(state.fetchCalls.length, 0)
  })
})

describe('Confirmación del CRM', () => {
  test('un 2xx con `mensagge` de registro satisfactorio confirma', async () => {
    for (const [status, mensagge] of [[200, OK_BODY.mensagge], [201, OK_BODY.mensagge], [200, '  los datos fueron  registrados SATISFACTORIAMENTE. ']]) {
      mod.resetValuationGuards(); mail.resetMailGuards()
      state.fetchImpl = reply(status, { mensagge })
      assert.deepEqual((await submit()).value, { ok: true }, mensagge)
    }
  })

  test('cualquier otro 2xx es INCIERTO: sin éxito, sin correo y sin reintento', async () => {
    const bodies = [undefined, {}, [], null, { data: {}, created: true }, { success: true }, { ok: true }, { status: 'success' }, { message: OK_BODY.mensagge },
      { mensagge: '' }, { mensagge: true }, { mensagge: [OK_BODY.mensagge] }, { mensagge: 'Los datos no fueron registrados satisfactoriamente' }, { mensagge: 'Registro creado' }]
    for (const body of bodies) {
      mod.resetValuationGuards(); state.fetchCalls = []
      state.fetchImpl = reply(200, body)
      const r = await submit()
      assert.equal(r.value, undefined, JSON.stringify(body))
      assert.equal(r.error?.statusCode, 502, JSON.stringify(body))
      assert.equal(r.error.data.reason, 'unconfirmed')
      assert.equal(r.error.data.uncertain, true)
      assert.equal(state.fetchCalls.length, 1, 'sin reintentos')
    }
    assert.equal(state.sent.length, 0)
  })
})

describe('CRM falla: rechazo o resultado incierto, y NINGÚN correo', () => {
  const check = async (impl, status, reason, isUncertain, label) => {
    mod.resetValuationGuards(); state.fetchCalls = []
    state.fetchImpl = impl
    const r = await submit()
    assert.equal(r.value, undefined, label)
    assert.equal(r.error?.statusCode, status, label)
    assert.equal(r.error.data.reason, reason, label)
    assert.equal(r.error.data.uncertain === true, isUncertain, label)
    assert.equal(state.fetchCalls.length, 1, `sin reintentos: ${label}`)
    return r
  }

  test('422: solo se devuelven errores de campos del formulario', async () => {
    const errors = { telefono: ['teléfono inválido'], direccion: 'ciudad inválida', fecha_nacimiento: ['fecha inválida'], id_user: ['x'], _token: ['x'], phone: ['x'] }
    const r = await check(reply(422, { errors }), 422, 'crm_validation', false, '422')
    assert.deepEqual(r.error.data.errors, { fecha_nacimiento: 'fecha inválida', direccion: 'ciudad inválida', telefono: 'teléfono inválido' })
    assert.equal(state.sent.length, 0)
  })

  test('4xx (incluido 419, sesión/CSRF) y 5xx son errores; una redirección es incierta', async () => {
    for (const s of [400, 401, 403, 404, 408, 409, 419, 429, 500, 502, 503]) await check(reply(s, OK_BODY), 502, 'crm_error', false, `HTTP ${s}`)
    for (const s of [301, 302, 307]) await check(reply(s, OK_BODY), 502, 'crm_error', true, `HTTP ${s}`)
    assert.equal(state.sent.length, 0)
  })

  test('sin conexión demostrable es un fallo; cortes y errores sin causa son inciertos', async () => {
    for (const code of ['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN']) await check(netError(code), 503, 'network', false, code)
    for (const code of ['ECONNRESET', 'UND_ERR_SOCKET', 'UND_ERR_CONNECT_TIMEOUT']) await check(netError(code), 503, 'network', true, code)
    await check(async () => { throw new TypeError('fetch failed') }, 503, 'network', true, 'sin causa')
    assert.equal(state.sent.length, 0)
  })

  test('un fallo interno al preparar el envío => 500 (no 502), sin petición y se puede reintentar', async () => {
    const Original = globalThis.FormData
    globalThis.FormData = class { constructor() { throw new Error('Ana 12345678') } }
    try {
      const r = await submit()
      assert.equal(r.error?.statusCode, 500)
      assert.equal(r.error.data.reason, 'internal_error')
      assert.equal(state.fetchCalls.length, 0)
    } finally { globalThis.FormData = Original }
    assert.deepEqual((await submit()).value, { ok: true })
    assert.doesNotMatch(state.logs.join('\n'), /Ana|12345678/)
  })

  test('timeout: la petición se aborta a los 15 s y el resultado es incierto, no un fallo definitivo', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    let signal
    state.fetchImpl = (_url, init) => new Promise((_res, rej) => { signal = init.signal; signal.addEventListener('abort', () => rej(Object.assign(new Error('abort'), { name: 'AbortError' }))) })
    const pending = run(mod.handleValuation, { method: 'POST', body: { ...VALID }, headers: {} })
    await new Promise(res => setImmediate(res))
    t.mock.timers.tick(14_999)
    assert.equal(signal.aborted, false)
    t.mock.timers.tick(1)
    const r = await pending
    assert.equal(r.error?.statusCode, 504)
    assert.equal(r.error.data.reason, 'timeout')
    assert.equal(r.error.data.uncertain, true)
    assert.equal(state.fetchCalls.length, 1)
    assert.equal(state.sent.length, 0)
  })

  test('ningún registro contiene datos personales, el destino ni el cuerpo de la respuesta', async () => {
    for (const impl of [reply(500, { detail: 'Ana Prueba 3001234567' }), reply(422, { errors: { telefono: ['Ana 12345678'] } }), netError('ECONNRESET')]) {
      mod.resetValuationGuards(); state.fetchImpl = impl
      await submit()
    }
    assert.ok(state.logs.length >= 3)
    assert.doesNotMatch(state.logs.join('\n'), /Ana|Prueba|3001234567|12345678|ana@|Bogotá|Rinoplastia|crm\.example|_token|tokenFicticio|sesionFicticia|xsrfFicticia|laravel_session/)
  })

  test('sin destino del CRM => 503 not_configured y sin correo ni petición', async () => {
    state.cfg = { ...MAIL_CFG }
    const r = await submit()
    assert.equal(r.error?.statusCode, 503)
    assert.equal(r.error.data.reason, 'not_configured')
    assert.equal(state.fetchCalls.length, 0)
    assert.equal(state.sent.length, 0)
  })

  test('validación inválida => 422 sin CRM ni correo', async () => {
    const r = await submit({ ...VALID, accept: false })
    assert.equal(r.error?.statusCode, 422)
    assert.equal(state.fetchCalls.length, 0)
    assert.equal(state.sent.length, 0)
  })
})

describe('Protección contra duplicados', () => {
  const again = (body = { ...VALID }) => submit(body)

  test('tras confirmar, el mismo cliente (aunque cambie el formato del teléfono o la cirugía) recibe 409 durante 2 minutos', async () => {
    await submit()
    const r = await again({ ...VALID, telefono: '+57 300 123 4567', name_surgery: 'Otra' })
    assert.equal(r.error?.statusCode, 409)
    assert.equal(r.error.data.reason, 'duplicate')
    assert.equal(state.fetchCalls.length, 1)
    state.clock += 2 * 60_000
    assert.deepEqual((await again()).value, { ok: true })
    assert.equal(state.fetchCalls.length, 2)
  })

  test('dos envíos simultáneos => una sola petición al CRM', async () => {
    let release
    state.fetchImpl = () => new Promise((res) => { release = () => res({ ok: true, status: 200, json: async () => OK_BODY }) })
    const first = run(mod.handleValuation, { method: 'POST', body: { ...VALID }, headers: {} })
    await new Promise(res => setImmediate(res))
    const second = await run(mod.handleValuation, { method: 'POST', body: { ...VALID }, headers: {} })
    assert.equal(second.error?.statusCode, 409)
    release()
    assert.deepEqual((await first).value, { ok: true })
    await mail.settleNotifications()
    assert.equal(state.fetchCalls.length, 1)
  })

  test('tras un resultado incierto o un 5xx del CRM no se reenvía durante 24 horas', async () => {
    for (const impl of [reply(200, { data: {}, created: true }), reply(500, {}), netError('ECONNRESET')]) {
      mod.resetValuationGuards(); mail.resetMailGuards(); state.fetchCalls = []; state.sent = []
      state.fetchImpl = impl
      await submit()
      state.fetchImpl = reply(200, OK_BODY)
      state.clock += 23 * 60 * 60_000
      const r = await again()
      assert.equal(r.error?.statusCode, 409)
      assert.equal(r.error.data.uncertain, true)
      assert.equal(state.fetchCalls.length, 1)
      assert.equal(state.sent.length, 0)
      state.clock += 2 * 60 * 60_000
      assert.deepEqual((await again()).value, { ok: true })
    }
  })

  test('tras un rechazo demostrado se puede volver a enviar', async () => {
    for (const impl of [reply(422, {}), reply(429, {}), netError('ECONNREFUSED')]) {
      mod.resetValuationGuards(); state.fetchCalls = []
      state.fetchImpl = impl
      await submit()
      state.fetchImpl = reply(200, OK_BODY)
      assert.deepEqual((await again()).value, { ok: true })
      assert.equal(state.fetchCalls.length, 2)
    }
  })

  test('límite por IP: el noveno intento en 10 minutos => 429', async () => {
    for (let i = 0; i < 8; i++) await submit({ ...VALID, identificacion: `1000000${i}` })
    const r = await submit({ ...VALID, identificacion: '20000000' })
    assert.equal(r.error?.statusCode, 429)
    assert.equal(state.fetchCalls.length, 8)
  })
})

describe('La solicitud se conserva en el correo y la integración queda en el servidor', () => {
  test('el correo posterior a la confirmación contiene todos los datos del formulario', async () => {
    await submit()
    for (const value of Object.values(VALID).filter(v => typeof v === 'string')) assert.ok(state.sent[0].text.includes(value), String(value))
    assert.match(state.sent[0].text, /Aceptada/)
  })

  test('destino vacío por defecto, nada público y el navegador sigue usando la ruta de Planmed', () => {
    const cfg = read('nuxt.config.ts')
    assert.match(cfg, /^    crmFormUrl: '',\r?$/m)
    // Identificadores de los campos ocultos del formulario público de Planmed; el destino sigue vacío.
    for (const [name, id] of [['crmFormUserId', '73'], ['crmFormLineId', '16'], ['crmFormAdvisorId', '73']]) assert.match(cfg, new RegExp(`^    ${name}: '${id}',\\r?$`, 'm'))
    assert.doesNotMatch(cfg, /clients\/forms|crmValuationUrl|crmClient/)
    assert.doesNotMatch(cfg, /public: \{[^}]*crmForm/s)
    assert.match(read('services/ValuationService.ts'), /\/api\/forms\/valuation/)
    for (const f of ['services/ValuationService.ts', 'components/forms/ValuationRequest.vue', 'shared/utils/valuation.ts']) {
      assert.doesNotMatch(read(f), /crmedic|clients\/forms|chat\/create|id_user|id_line/, f)
    }
  })
})

describe('Blindaje y respuesta independiente del correo complementario', () => {
  test('un error al LEER la configuración de correo no altera el registro confirmado por el CRM', async () => {
    const cfg = { ...CRM_CFG, ...MAIL_CFG }
    Object.defineProperty(cfg, 'mailHost', { get() { throw new Error('config corrupta') }, enumerable: true, configurable: true })
    state.cfg = cfg
    const r = await submit()
    assert.deepEqual(r.value, { ok: true })
    assert.equal(state.fetchCalls.length, 1)
    assert.equal(state.sent.length, 0)
    assert.doesNotMatch(state.logs.join('\n'), /config corrupta|Ana/)
  })

  test('SMTP mal configurado (sin contraseña o puerto inválido) => el CRM confirma igual y no se intenta el envío', async () => {
    for (const bad of [{ mailPassword: '' }, { mailPort: 'abc' }]) {
      state.cfg = { ...CRM_CFG, ...MAIL_CFG, ...bad }
      mod.resetValuationGuards(); mail.resetMailGuards(); state.fetchCalls = []
      const r = await submit()
      assert.deepEqual(r.value, { ok: true }, JSON.stringify(bad))
      assert.equal(state.sent.length, 0)
    }
  })

  test('la respuesta NO espera al SMTP: con el SMTP colgado responde {ok:true} de inmediato y el correo queda pendiente hasta que termina', async () => {
    let release
    state.sendImpl = () => new Promise((res) => { release = () => res({ accepted: ['valoracion@example.test', 'copia@example.test'], rejected: [] }) })
    const r = await run(mod.handleValuation, { method: 'POST', body: { ...VALID }, headers: {} }) // sin esperar al correo
    assert.deepEqual(r.value, { ok: true })
    assert.equal(mail.notificationState(key()), 'pending', 'no se informa como enviado mientras no lo esté')
    await new Promise(res => setImmediate(res))
    assert.equal(typeof release, 'function')
    release()
    await mail.settleNotifications()
    assert.equal(mail.notificationState(key()), 'sent')
  })

  test('REINICIO simulado: el estado del correo se pierde y un reenvío puede enviar OTRO correo (límite documentado, sin garantía de «exactamente una vez»)', async () => {
    await submit()
    assert.equal(state.sent.length, 1)
    mail.resetMailGuards()
    mod.resetValuationGuards() // el reinicio también borra el bloqueo de doble envío del CRM, que es de memoria
    await submit()
    assert.equal(state.sent.length, 2)
  })

  test('el formulario y el destino del CRM no cambian aunque falle el correo', async () => {
    state.sendImpl = async () => { throw Object.assign(new Error('x'), { code: 'ECONNREFUSED' }) }
    await submit()
    assert.equal(state.fetchCalls[0][0], CRM_URL)
    assert.equal(sentBody().nombres, 'Ana')
    assert.equal(sentBody().origen, 'Formulario Web')
  })
})

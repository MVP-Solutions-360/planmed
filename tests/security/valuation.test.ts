// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Solicitud de valoración («Pide tu cita») de Planmed: el registro del CLIENTE en el CRM Médico es el destino PRINCIPAL y el correo es una notificación
// COMPLEMENTARIA que sale solo DESPUÉS de que el CRM confirma. Se ejecuta el código REAL del servidor con CRM y SMTP SIMULADOS: no se llama al CRM real
// ni se envía ningún correo. Las respuestas del CRM de este archivo son INVENTADAS (su contrato no está confirmado). Direcciones y claves son FICTICIAS.
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
const CRM_URL = 'https://crm.example.test/api/chat/create/client' // CRM simulado (la prueba nunca usa el real)
const WINDOW = 10 * 60_000

const MAIL_CFG = {
  mailHost: 'smtp.example.test', mailPort: 465, mailUsername: 'sender@example.test', mailPassword: 'clave-ficticia', mailFromAddress: '', mailFromName: 'Marca de prueba',
  valuationTo: 'valoracion@example.test', valuationCc: 'copia@example.test', public: { appName: 'Marca de prueba' }
}
const state = { cfg: {}, fetchCalls: [], fetchImpl: null, clock: 1_800_000_000_000, sent: [], sendImpl: null, order: [], logs: [] }
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
  g.fetch = (...args) => { state.fetchCalls.push(args); state.order.push('crm'); return state.fetchImpl(...args) }
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
  state.cfg = { crmClientUrl: CRM_URL, ...MAIL_CFG }
  state.fetchCalls = []
  state.order = []
  state.logs = []
  state.sent = []
  state.fetchImpl = async () => ({ ok: true, status: 200, json: async () => ({ success: true }) })
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
const sentBody = (i = 0) => JSON.parse(state.fetchCalls[i][1].body)
const reply = (status, body) => async () => ({ ok: status >= 200 && status < 300, status, json: async () => { if (body === undefined) throw new SyntaxError('no json'); return body } })
const netError = code => async () => { throw Object.assign(new TypeError('fetch failed'), { cause: Object.assign(new Error(code), { code }) }) }
const run = async (fn, e) => { try { return { value: await fn(e) } } catch (error) { return { error } } }
const submit = async (body = { ...VALID }) => { const r = await run(mod.handleValuation, { method: 'POST', body, headers: {} }); await mail.settleNotifications(); return r }
const smtpDown = () => { state.sendImpl = async () => { state.order.push('mail-fail'); throw Object.assign(new Error('boom'), { code: 'ECONNREFUSED' }) } }
const key = () => `valuation|${createHash('sha256').update(`${VALID.identificacion}|+57${VALID.telefono}`).digest('hex')}`

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

  test('el CRM recibe exactamente el payload de Planmed, en JSON, por POST y sin seguir redirecciones', async () => {
    await submit({ ...VALID, nombres: '  Ana   María ', apellidos: ' Prueba   Ficticia ', direccion: '  Santa   Rosa de Osos ' })
    const [url, init] = state.fetchCalls[0]
    assert.equal(url, CRM_URL)
    assert.equal(init.method, 'POST')
    assert.equal(init.redirect, 'manual')
    assert.equal(init.headers['Content-Type'], 'application/json')
    assert.equal(init.headers.Accept, 'application/json')
    assert.equal(init.headers.Authorization, undefined)
    assert.deepEqual(sentBody(), {
      name: 'Ana María Prueba Ficticia', phone: '+573001234567', city: 5, identificacion: '12345678',
      ad_headline: 'Quiero más info', advisor_email: 'disenadoraplanmed@gmail.com', id_line: 12
    })
    assert.deepEqual(Object.keys(sentBody()), ['name', 'phone', 'city', 'identificacion', 'ad_headline', 'advisor_email', 'id_line'])
    assert.equal('origen' in sentBody(), false, '`origen` no se envía')
    assert.equal(typeof sentBody().city, 'number')
    assert.equal(typeof sentBody().id_line, 'number')
    assert.match(init.body, /"city":5,/, 'entero JSON, sin comillas')
    assert.doesNotMatch(init.body, /Santa|Rosa|Osos/, 'el texto de la ciudad no viaja al CRM')
  })

  test('city es siempre el entero 5, sea cual sea la ciudad escrita; los demás campos salen del formulario y de la configuración', () => {
    const cfg = { lineId: 99, advisorEmail: 'otra@example.test' }
    for (const direccion of ['Medellín', 'Cali', '  Santa   Rosa de Osos ', '76001', '5']) {
      const input = { ...VALID, nombres: ' Ana  María ', apellidos: ' Prueba ', telefono: '300 123 4567', direccion }
      const payload = crm.buildCrmClientPayload(input, cfg)
      assert.deepEqual(payload, {
        name: 'Ana María Prueba', phone: '+573001234567', city: 5, identificacion: '12345678',
        ad_headline: 'Quiero más info', advisor_email: 'otra@example.test', id_line: 99
      }, direccion)
      assert.strictEqual(payload.city, 5)
      assert.match(JSON.stringify(payload), /"city":5,/)
      assert.equal(input.direccion, direccion, 'el dato del formulario no se modifica')
    }
  })

  test('el correo complementario conserva la ciudad escrita en el formulario', async () => {
    await submit({ ...VALID, direccion: 'Santa Rosa de Osos' })
    assert.equal(sentBody().city, 5)
    assert.match(state.sent[0].text, /Ciudad: Santa Rosa de Osos/)
    assert.match(state.sent[0].html, /Santa Rosa de Osos/)
  })

  test('el teléfono lleva +57 sin duplicarlo, con espacios y separadores', async () => {
    for (const input of ['3001234567', '300 123 4567', '(300) 123-4567', '+573001234567', '+57 300 123 4567', '+57 (300) 123-4567', '573001234567', '57 300 123 4567']) {
      assert.equal(crm.crmPhone(input), '+573001234567', input)
    }
    await submit({ ...VALID, telefono: '+57 300 123-4567' })
    assert.equal(sentBody().phone, '+573001234567')
  })

  test('sin regla confirmada (fijo o extranjero) se envían solo los dígitos, sin inventar un indicativo', () => {
    assert.equal(crm.crmPhone('6012345678'), '6012345678')
    assert.equal(crm.crmPhone('+1 305 555 0100'), '13055550100')
    assert.equal(crm.crmPhone('+30 0123 4567'), '3001234567')
  })

  test('línea y asesora se pueden sustituir desde el servidor; valores inválidos => 503 sin petición', async () => {
    state.cfg = { crmClientUrl: CRM_URL, crmClientLineId: 99, crmClientAdvisorEmail: 'otra@example.test' }
    await submit()
    assert.equal(sentBody().id_line, 99)
    assert.equal(sentBody().advisor_email, 'otra@example.test')
    for (const bad of [{ crmClientLineId: 'abc' }, { crmClientLineId: '-1' }, { crmClientAdvisorEmail: 'sin-arroba' },
      { crmClientUrl: 'http://crm.dominio.com/api' }, { crmClientUrl: 'https://user:clave@crm.example.test/api' }, { crmClientUrl: 'no es url' }]) {
      state.cfg = { crmClientUrl: CRM_URL, ...bad }
      mod.resetValuationGuards(); state.fetchCalls = []
      const r = await submit()
      assert.equal(r.error?.data.reason, 'not_configured', JSON.stringify(bad))
      assert.equal(state.fetchCalls.length, 0)
    }
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
    state.cfg = { crmClientUrl: CRM_URL }
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

describe('Confirmación del CRM (criterio PROVISIONAL tomado de Crediestética)', () => {
  test('solo una marca positiva explícita confirma el registro', async () => {
    for (const body of [{ success: true }, { ok: true }, { status: 'success' }, { status: 'OK' }, { status: 'created' }, { ok: true, id: 5 }]) {
      mod.resetValuationGuards(); mail.resetMailGuards()
      state.fetchImpl = reply(201, body)
      assert.deepEqual((await submit()).value, { ok: true }, JSON.stringify(body))
    }
  })

  test('un 2xx sin confirmación reconocible es INCIERTO: sin éxito y sin correo', async () => {
    const bodies = [undefined, {}, [], null, { message: 'Cliente creado' }, { mensagge: 'Registro creado' }, { id: 5 }, { status: 'pending' }, { success: false }, { status: 'error' }, { ok: true, error: 'x' }, { success: true, errors: ['x'] }]
    for (const body of bodies) {
      mod.resetValuationGuards(); state.fetchCalls = []
      state.fetchImpl = reply(200, body)
      const r = await submit()
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

  test('422: error de validación con los campos traducidos a los del formulario', async () => {
    const r = await check(reply(422, { errors: { phone: ['teléfono inválido'], city: 'ciudad inválida', name: ['nombre inválido'], otro: ['x'] } }), 422, 'crm_validation', false, '422')
    assert.deepEqual(r.error.data.errors, { telefono: 'teléfono inválido', direccion: 'ciudad inválida', nombres: 'nombre inválido' })
    assert.equal(state.sent.length, 0)
  })

  test('4xx son rechazos; 5xx y redirecciones son inciertos', async () => {
    for (const s of [400, 401, 403, 404, 408, 409, 429]) await check(reply(s, {}), 502, 'crm_error', false, `HTTP ${s}`)
    for (const s of [301, 302, 307, 500, 502, 503]) await check(reply(s, { success: true }), 502, 'crm_error', true, `HTTP ${s}`)
    assert.equal(state.sent.length, 0)
  })

  test('sin conexión demostrable es un fallo; cortes y errores sin causa son inciertos', async () => {
    for (const code of ['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN']) await check(netError(code), 503, 'network', false, code)
    for (const code of ['ECONNRESET', 'UND_ERR_SOCKET', 'UND_ERR_CONNECT_TIMEOUT']) await check(netError(code), 503, 'network', true, code)
    await check(async () => { throw new TypeError('fetch failed') }, 503, 'network', true, 'sin causa')
    assert.equal(state.sent.length, 0)
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

  test('ningún registro contiene datos personales ni el cuerpo de la respuesta', async () => {
    for (const impl of [reply(500, { detail: 'Ana Prueba 3001234567' }), reply(422, { errors: { phone: ['Ana 12345678'] } }), netError('ECONNRESET')]) {
      mod.resetValuationGuards(); state.fetchImpl = impl
      await submit()
    }
    assert.ok(state.logs.length >= 3)
    assert.doesNotMatch(state.logs.join('\n'), /Ana|Prueba|3001234567|12345678|ana@|Bogotá|Rinoplastia|disenadora/)
  })

  test('sin destino del CRM => 503 not_configured y sin correo ni petición', async () => {
    state.cfg = { crmClientUrl: '', ...MAIL_CFG }
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
    state.fetchImpl = () => new Promise((res) => { release = () => res({ ok: true, status: 200, json: async () => ({ success: true }) }) })
    const first = run(mod.handleValuation, { method: 'POST', body: { ...VALID }, headers: {} })
    await new Promise(res => setImmediate(res))
    const second = await run(mod.handleValuation, { method: 'POST', body: { ...VALID }, headers: {} })
    assert.equal(second.error?.statusCode, 409)
    release()
    assert.deepEqual((await first).value, { ok: true })
    await mail.settleNotifications()
    assert.equal(state.fetchCalls.length, 1)
  })

  test('tras un resultado INCIERTO no se reenvía durante 24 horas', async () => {
    state.fetchImpl = reply(500, {})
    await submit()
    state.fetchImpl = reply(200, { success: true })
    state.clock += 23 * 60 * 60_000
    const r = await again()
    assert.equal(r.error?.statusCode, 409)
    assert.equal(r.error.data.uncertain, true)
    assert.equal(state.fetchCalls.length, 1)
    assert.equal(state.sent.length, 0)
    state.clock += 2 * 60 * 60_000
    assert.deepEqual((await again()).value, { ok: true })
  })

  test('tras un rechazo demostrado se puede volver a enviar', async () => {
    for (const impl of [reply(422, {}), reply(429, {}), netError('ECONNREFUSED')]) {
      mod.resetValuationGuards(); state.fetchCalls = []
      state.fetchImpl = impl
      await submit()
      state.fetchImpl = reply(200, { success: true })
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
    assert.match(cfg, /^    crmClientUrl: '',\r?$/m)
    assert.doesNotMatch(cfg, /clients\/forms|crmValuationUrl/)
    assert.doesNotMatch(cfg, /public: \{[^}]*crmClient/s)
    assert.match(read('services/ValuationService.ts'), /\/api\/forms\/valuation/)
    for (const f of ['services/ValuationService.ts', 'components/forms/ValuationRequest.vue', 'shared/utils/valuation.ts']) {
      assert.doesNotMatch(read(f), /crmedic|chat\/create|advisor_email|disenadora/, f)
    }
  })
})

describe('Blindaje y respuesta independiente del correo complementario', () => {
  test('un error al LEER la configuración de correo no altera el registro confirmado por el CRM', async () => {
    const cfg = { crmClientUrl: CRM_URL, ...MAIL_CFG }
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
      state.cfg = { crmClientUrl: CRM_URL, ...MAIL_CFG, ...bad }
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

  test('el payload y el destino del CRM no cambian aunque falle el correo', async () => {
    state.sendImpl = async () => { throw Object.assign(new Error('x'), { code: 'ECONNREFUSED' }) }
    await submit()
    assert.equal(state.fetchCalls[0][0], CRM_URL)
    assert.equal(sentBody().name, 'Ana Prueba')
    assert.equal(sentBody().ad_headline, 'Quiero más info')
    assert.equal('origen' in sentBody(), false)
  })
})

// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Solicitud de valoración («Pide tu cita») de Planmed: el CRM médico es el destino PRINCIPAL (integración original, sin cambios) y el correo es una
// notificación COMPLEMENTARIA que sale solo DESPUÉS de que el CRM confirma. Se ejecuta el código REAL del servidor con CRM y SMTP SIMULADOS: no hay red,
// no se llama al CRM real ni se envía ningún correo. Direcciones y claves de este archivo son FICTICIAS.
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
const CRM_URL = 'https://crm.example.test/api/clients/forms' // CRM simulado (la prueba nunca usa el real)
const WINDOW = 10 * 60_000

const MAIL_CFG = {
  mailHost: 'smtp.example.test', mailPort: 465, mailUsername: 'sender@example.test', mailPassword: 'clave-ficticia', mailFromAddress: '', mailFromName: 'Marca de prueba',
  valuationTo: 'valoracion@example.test', valuationCc: 'copia@example.test', public: { appName: 'Marca de prueba' }
}
const state = { cfg: {}, fetchCalls: [], fetchImpl: null, clock: 1_800_000_000_000, sent: [], sendImpl: null, order: [], logs: [] }
let dir, mod, mail, realNow, realError

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
  g.fetch = (...args) => { state.fetchCalls.push(args); state.order.push('crm'); return state.fetchImpl(...args) }
  const base = fileUrl('shared/utils')
  const fix = s => s.replace(/'#shared\/utils\/([A-Za-z]+)'/g, (_, m) => `'${base}/${m}.ts'`).replace("'./formMail'", "'./formMail.ts'")
  writeFileSync(join(dir, 'formMail.ts'), fix(read('server/utils/formMail.ts')))
  writeFileSync(join(dir, 'valuation.ts'), fix(read('server/utils/valuation.ts')))
  mod = await import(pathToFileURL(join(dir, 'valuation.ts')).href)
  mail = await import(pathToFileURL(join(dir, 'formMail.ts')).href)
})
beforeEach(() => {
  state.cfg = { crmValuationUrl: CRM_URL, ...MAIL_CFG }
  state.fetchCalls = []
  state.order = []
  state.logs = []
  state.sent = []
  state.fetchImpl = async () => ({ ok: true, status: 200, json: async () => ({ mensagge: 'Registro creado' }) })
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
  rmSync(dir, { recursive: true, force: true })
})

const VALID = {
  nombres: 'Ana', apellidos: 'Prueba', identificacion: '12345678', fecha_nacimiento: '1990-05-10', direccion: 'Bogotá',
  telefono: '3001234567', email: 'ana@example.com', name_surgery: 'Rinoplastia', forma_pago: 'Financiación', accept: true
}
const run = async (fn, e) => { try { return { value: await fn(e) } } catch (error) { return { error } } }
const submit = async (body = { ...VALID }) => { const r = await run(mod.handleValuation, { method: 'POST', body, headers: {} }); await mail.settleNotifications(); return r }
const smtpDown = () => { state.sendImpl = async () => { state.order.push('mail-fail'); throw Object.assign(new Error('boom'), { code: 'ECONNREFUSED' }) } }
const key = () => `valuation|${createHash('sha256').update(`${VALID.identificacion}|${VALID.telefono}|${VALID.name_surgery.toLowerCase()}`).digest('hex')}`

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

  test('el CRM recibe los campos originales (ids y campos fijos de Planmed, sin cambios)', async () => {
    await submit()
    const fields = Object.fromEntries(state.fetchCalls[0][1].body.entries())
    assert.equal(fields.nombres, 'Ana')
    assert.equal(fields.accept, '1')
    assert.ok('id_line' in fields && 'id_user' in fields, 'ids del CRM originales presentes')
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
    state.cfg = { crmValuationUrl: CRM_URL }
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

describe('CRM falla: comportamiento original y NINGÚN correo', () => {
  test('error 500, 422, sin confirmación, timeout y sin conexión conservan sus errores originales y no envían correo', async () => {
    const cases = [
      [async () => ({ ok: false, status: 500, json: async () => ({}) }), 502, 'crm_error'],
      [async () => ({ ok: false, status: 422, json: async () => ({ errors: { email: ['inválido'] } }) }), 422, 'crm_validation'],
      [async () => ({ ok: true, status: 200, json: async () => ({}) }), 502, 'unconfirmed'],
      [async () => { throw Object.assign(new Error('abort'), { name: 'AbortError' }) }, 504, 'timeout'],
      [async () => { throw new TypeError('fetch failed') }, 503, 'network']
    ]
    for (const [impl, status, reason] of cases) {
      state.fetchImpl = impl
      mod.resetValuationGuards()
      const r = await submit()
      assert.equal(r.error?.statusCode, status, reason)
      assert.equal(r.error.data.reason, reason)
    }
    assert.equal(state.sent.length, 0)
  })

  test('sin destino del CRM => 503 not_configured (comportamiento original) y sin correo ni petición', async () => {
    state.cfg = { crmValuationUrl: '', ...MAIL_CFG }
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

describe('La integración original con el CRM se conserva', () => {
  test('el CRM de Planmed sigue configurado por defecto y la ruta/servicio originales no cambiaron', () => {
    assert.match(read('nuxt.config.ts'), /crmValuationUrl: 'https:\/\/pdtclientsolutions\.com\/crm-public\/api\/clients\/forms'/)
    assert.match(read('server/utils/valuation.ts'), /crmValuationUrl/)
    assert.match(read('shared/utils/valuation.ts'), /export function buildCrmFields/)
    assert.match(read('services/ValuationService.ts'), /\/api\/forms\/valuation/)
  })
})

describe('Blindaje y respuesta independiente del correo complementario', () => {
  test('un error al LEER la configuración de correo no altera el registro confirmado por el CRM', async () => {
    const cfg = { crmValuationUrl: CRM_URL, ...MAIL_CFG }
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
      state.cfg = { crmValuationUrl: CRM_URL, ...MAIL_CFG, ...bad }
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

  test('los campos y el destino del CRM no cambian aunque falle el correo', async () => {
    state.sendImpl = async () => { throw Object.assign(new Error('x'), { code: 'ECONNREFUSED' }) }
    await submit()
    assert.equal(state.fetchCalls[0][0], CRM_URL)
    const fields = Object.fromEntries(state.fetchCalls[0][1].body.entries())
    assert.equal(fields.nombres, 'Ana')
    assert.equal(fields.accept, '1')
  })
})

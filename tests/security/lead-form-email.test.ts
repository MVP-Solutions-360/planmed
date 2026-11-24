// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Formulario «Solicitud de financiación» (LeadForm) → correo: validación, destinatarios y asunto definidos en el servidor, configuración SMTP ausente, errores
// del proveedor, envío exitoso, duplicados y límite de intentos. Se ejecuta el código REAL del servidor con un transporte SMTP simulado: no se envía ningún
// correo, no hay red y no se llama a ningún CRM. Las direcciones, contraseñas y datos de este archivo son FICTICIOS.
import { test, describe, before, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT } from '../recommendations/harness.ts'

const fileUrl = rel => pathToFileURL(join(ROOT, rel)).href
const read = rel => readFileSync(join(ROOT, rel), 'utf8')
const SOCKET_IP = '203.0.113.20'
const SECRET = 'p4ss-w0rd-FICTICIA-no-real'

const CFG = {
  mailHost: 'smtp.example.test',
  mailPort: 465,
  mailUsername: 'sender@example.test',
  mailPassword: SECRET,
  mailFromAddress: '',
  mailFromName: 'Marca de prueba',
  creditStudyTo: 'otro-formulario@example.test',
  creditStudyCc: '',
  leadFormTo: 'leads@example.test',
  leadFormCc: 'copia-leads@example.test',
  trustedProxyHops: 0,
  public: { appName: 'Marca de prueba' }
}

const state = { cfg: {}, reads: 0, sent: [], closed: 0, sendImpl: null, factoryCalls: 0, logs: [] }
let dir, mod, mail, L, svc, realError

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'lead-form-'))
  realError = console.error
  console.error = (...a) => { state.logs.push(a.map(String).join(' ')) }
  const g = globalThis
  g.createError = o => Object.assign(new Error(o.message ?? 'error'), o)
  g.useRuntimeConfig = () => state.cfg
  g.setHeader = () => {}
  g.assertSameOrigin = () => {}
  g.getRequestIP = e => e.ip
  g.getRequestHeader = (e, name) => e.headers?.[name.toLowerCase()]
  g.readBody = async e => { state.reads++; if (e.bodyError) throw new Error('json roto'); return e.body }

  const base = fileUrl('shared/utils')
  const fix = s => s.replace(/'#shared\/utils\/([A-Za-z]+)'/g, (_, m) => `'${base}/${m}.ts'`).replace("'./formMail'", "'./formMail.ts'")
  writeFileSync(join(dir, 'leadForm.ts'), fix(read('server/utils/leadForm.ts')))
  writeFileSync(join(dir, 'formMail.ts'), fix(read('server/utils/formMail.ts')))
  writeFileSync(join(dir, 'LeadService.ts'), fix(read('services/LeadService.ts')))
  mod = await import(pathToFileURL(join(dir, 'leadForm.ts')).href)
  mail = await import(pathToFileURL(join(dir, 'formMail.ts')).href)
  svc = await import(pathToFileURL(join(dir, 'LeadService.ts')).href)
  L = await import(fileUrl('shared/utils/leadForm.ts'))
})

beforeEach(() => {
  state.cfg = { ...CFG }
  state.reads = 0
  state.sent = []
  state.closed = 0
  state.factoryCalls = 0
  state.logs = []
  state.sendImpl = async () => ({ accepted: ['leads@example.test', 'copia-leads@example.test'], rejected: [] })
  mail.resetMailGuards()
  mail.setMailTransportFactory(async (cfg) => {
    state.factoryCalls++
    return { sendMail: async (msg) => { state.sent.push({ cfg, msg }); return state.sendImpl(msg) }, close: () => { state.closed++ } }
  })
})

after(() => {
  console.error = realError
  mail.setMailTransportFactory()
  rmSync(dir, { recursive: true, force: true })
})

// ── Datos de prueba ──────────────────────────────────────────────────────────

const payload = (over = {}, meta = {}) => ({
  first_name: 'Ana Prueba',
  phone: '300 123 4567',
  email: 'ana.prueba@example.com',
  city: 'Medellín',
  procedure_name: 'Rinoplastia',
  requested_amount: 12_000_000,
  installments: 24,
  comments: 'Prefiero que me llamen en la tarde.',
  accepted_habeas_data: true,
  metadata: {
    quote_rate_percent: 2.1, quote_monthly_payment: 640000, quote_rate_version: '2026-01-01T00:00:00Z',
    doc_type: 'Cedula ciudadania', doc_number: '1234567890', doc_issue_place: 'Medellín', doc_issue_date: '2010-03-04', birth_date: '1990-05-10',
    birth_place: 'Cali', occupation: 'Diseñadora', dependents: 1, housing_type: 'Arrendada', residence_city: 'Medellín', surgery_city: 'Medellín',
    activity_type: 'Empleado', social_security: 'Si', monthly_income: 4_500_000, monthly_expenses: 2_000_000, contract_type: 'Indefinido',
    contract_duration: '2 años o mas', has_property: 'No', has_vehicle: 'No', is_reported: 'No', ...meta
  },
  ...over
})
const event = (body = payload(), over = {}) => ({
  method: 'POST',
  ip: SOCKET_IP,
  body,
  ...over,
  headers: { 'content-length': '1500', 'content-type': 'application/json', ...(over.headers ?? {}) }
})
const run = async (fn, e) => { try { return { value: await fn(e) } } catch (error) { return { error } } }
const submit = (body, over) => run(mod.handleLead, event(body, over))
const logged = () => state.logs.join('\n')

// ── Reglas compartidas ────────────────────────────────────────────────────────

describe('Validación de campos (reglas compartidas)', () => {
  test('una solicitud completa es válida y se normaliza', () => {
    const r = L.validateLead(payload())
    assert.deepEqual(r.errors, {})
    assert.equal(r.values.first_name, 'Ana Prueba')
    assert.equal(r.values.meta.doc_number, '1234567890')
  })
  test('solo lo obligatorio basta: el preaprobado es opcional', () => {
    const r = L.validateLead({ first_name: 'Ana', phone: '3001234567', city: 'Cali', procedure_name: 'Lipo', requested_amount: 5000000, installments: 12, accepted_habeas_data: true })
    assert.deepEqual(r.errors, {})
    assert.equal(r.values.email, '')
    assert.deepEqual(r.values.meta, {})
  })
  test('obligatorios vacíos y consentimiento ausente se marcan', () => {
    const r = L.validateLead({})
    for (const k of ['first_name', 'phone', 'city', 'procedure_name', 'requested_amount', 'installments', 'accepted_habeas_data']) assert.ok(r.errors[k], k)
    assert.equal(L.validateLead(payload({ accepted_habeas_data: 'true' })).errors.accepted_habeas_data !== undefined, true, 'solo true booleano')
  })
  test('correo, teléfono, monto, plazo y listas inválidos', () => {
    assert.ok(L.validateLead(payload({ email: 'no-es-correo' })).errors.email)
    assert.ok(L.validateLead(payload({ phone: 'abc' })).errors.phone)
    assert.ok(L.validateLead(payload({ requested_amount: -5 })).errors.requested_amount)
    assert.ok(L.validateLead(payload({ requested_amount: 1.5 })).errors.requested_amount)
    assert.ok(L.validateLead(payload({ installments: 13 })).errors.installments)
    assert.ok(L.validateLead(payload({}, { doc_type: 'Otro' })).errors.doc_type)
    assert.ok(L.validateLead(payload({}, { doc_issue_date: '2010-13-45' })).errors.doc_issue_date)
    assert.ok(L.validateLead(payload({}, { monthly_income: -1 })).errors.monthly_income)
    assert.ok(L.validateLead(payload({ comments: 'x'.repeat(1001) })).errors.comments)
  })
  test('el contrato solo se conserva para empleados', () => {
    const r = L.validateLead(payload({}, { activity_type: 'Independiente' }))
    assert.equal(r.values.meta.contract_type, undefined)
  })
})

// ── Configuración y destinatarios ─────────────────────────────────────────────

describe('Configuración SMTP y destinatarios', () => {
  test('sin configuración de correo: 503 not_configured, sin leer el cuerpo y sin transporte', async () => {
    state.cfg = { ...CFG, mailHost: '', mailPassword: '' }
    const r = await submit()
    assert.equal(r.error.statusCode, 503)
    assert.equal(r.error.data.reason, 'not_configured')
    assert.equal(state.reads, 0)
    assert.equal(state.factoryCalls, 0)
    assert.match(logged(), /NUXT_MAIL_HOST/)
    assert.ok(!logged().includes(SECRET))
  })
  test('sin destinatarios del formulario el envío queda bloqueado (aunque otro formulario sí los tenga)', async () => {
    state.cfg = { ...CFG, leadFormTo: '' }
    const r = await submit()
    assert.equal(r.error.statusCode, 503)
    assert.equal(r.error.data.reason, 'not_configured')
    assert.match(logged(), /NUXT_LEAD_FORM_TO/)
    assert.equal(state.factoryCalls, 0)
  })
  test('los destinatarios de este formulario son independientes de los del estudio de crédito', async () => {
    const r = await submit()
    assert.deepEqual(r.value, { ok: true })
    assert.deepEqual(state.sent[0].msg.to, ['leads@example.test'])
    assert.deepEqual(state.sent[0].msg.cc, ['copia-leads@example.test'])
    assert.ok(!JSON.stringify(state.sent[0].msg).includes('otro-formulario@example.test'))
  })
  test('el navegador no puede fijar destinatarios, copia, remitente ni asunto', async () => {
    const body = payload({ to: 'atacante@evil.test', cc: 'atacante@evil.test', bcc: 'atacante@evil.test', from: 'atacante@evil.test', subject: 'Asunto falso', replyTo: 'atacante@evil.test' })
    body.metadata.to = 'atacante@evil.test'
    const r = await submit(body)
    assert.deepEqual(r.value, { ok: true })
    const msg = state.sent[0].msg
    assert.deepEqual(msg.to, ['leads@example.test'])
    assert.equal(msg.bcc, undefined)
    assert.equal(msg.subject, '[Marca de prueba] Nuevo prospecto de financiación')
    assert.equal(msg.replyTo, 'ana.prueba@example.com')
    assert.ok(!JSON.stringify(msg).includes('atacante@evil.test'))
    assert.ok(!JSON.stringify(msg).includes('Asunto falso'))
  })
  test('Planmed: sin destinatarios por defecto; el envío queda bloqueado hasta que el negocio defina los autorizados', async () => {
    const cfg = read('nuxt.config.ts')
    assert.match(cfg, /^    leadFormTo: '',$/m)
    assert.match(cfg, /^    leadFormCc: '',$/m)
    assert.doesNotMatch(cfg, /disenadoraplanmed|convenioscrediestetica/i, 'no se reutilizan los destinatarios de otra marca')
    assert.doesNotMatch(cfg, /public: \{[^}]*leadForm/s)
    state.cfg = { ...CFG, leadFormTo: '', leadFormCc: '' }
    const r = await submit()
    assert.equal(r.error.statusCode, 503)
    assert.equal(r.error.data.reason, 'not_configured')
    assert.equal(state.factoryCalls, 0)
  })
})

// ── Validación en el servidor ─────────────────────────────────────────────────

describe('Validación en el servidor', () => {
  test('datos inválidos: 422 con los campos y sin enviar', async () => {
    const r = await submit(payload({ first_name: '', accepted_habeas_data: false, installments: 99 }))
    assert.equal(r.error.statusCode, 422)
    assert.equal(r.error.data.reason, 'validation')
    assert.deepEqual(Object.keys(r.error.data.errors).sort(), ['accepted_habeas_data', 'first_name', 'installments'])
    assert.equal(state.factoryCalls, 0)
  })
  test('cuerpo ausente o roto: 422 sin enviar', async () => {
    assert.equal((await submit(null)).error.statusCode, 422)
    assert.equal((await submit(payload(), { bodyError: true })).error.statusCode, 422)
    assert.equal(state.factoryCalls, 0)
  })
  test('tipo de contenido y tamaño: 415, 411 y 413 sin leer el cuerpo', async () => {
    assert.equal((await submit(payload(), { headers: { 'content-type': 'text/plain' } })).error.statusCode, 415)
    assert.equal((await submit(payload(), { headers: { 'content-length': '' } })).error.statusCode, 411)
    assert.equal((await submit(payload(), { headers: { 'content-length': String(L.LEAD_LIMITS.maxRequestBytes + 1) } })).error.statusCode, 413)
    assert.equal(state.reads, 0)
  })
})

// ── Correo ────────────────────────────────────────────────────────────────────

describe('Envío', () => {
  test('éxito: asunto, remitente y contenido por secciones, sin JSON crudo', async () => {
    const r = await submit()
    assert.deepEqual(r.value, { ok: true })
    assert.equal(state.sent.length, 1)
    const { msg, cfg } = state.sent[0]
    assert.equal(cfg.password, SECRET)
    assert.deepEqual(msg.from, { name: 'Marca de prueba', address: 'sender@example.test' })
    assert.equal(msg.subject, '[Marca de prueba] Nuevo prospecto de financiación')
    for (const t of ['Marca de prueba', 'Nuevo prospecto de financiación', 'Recibida:', 'PROSPECTO', 'SOLICITUD DE FINANCIACIÓN', 'Ana Prueba', 'Rinoplastia', '$ 12.000.000', '24 cuotas mensuales',
      'ACTIVIDAD ECONÓMICA', 'Aceptada por el prospecto']) assert.ok(msg.text.includes(t), t)
    assert.ok(!msg.text.includes('{') && !msg.text.includes('"first_name"'), 'sin JSON crudo')
    assert.ok(!msg.text.includes('quote_rate') && !msg.html.includes('accepted_habeas_data'), 'sin nombres internos')
    assert.deepEqual(msg.attachments, [])
    assert.equal(state.closed, 1)
  })
  test('el HTML escapa todo valor del navegador', async () => {
    await submit(payload({ first_name: '<script>alert(1)</script>', comments: '<img src=x onerror=alert(1)>' }))
    const { html } = state.sent[0].msg
    assert.ok(!html.includes('<script>') && !html.includes('<img'))
    assert.ok(html.includes('&lt;script&gt;'))
  })
  test('no hay objetos por secciones vacías: sin preaprobado no se listan sus secciones', async () => {
    await submit({ first_name: 'Ana', phone: '3001234567', city: 'Cali', procedure_name: 'Lipo', requested_amount: 5000000, installments: 12, accepted_habeas_data: true })
    const { text } = state.sent[0].msg
    assert.ok(!text.includes('ACTIVIDAD ECONÓMICA') && !text.includes('DATOS DEL TOMADOR'))
    assert.equal(state.sent[0].msg.replyTo, undefined)
  })
  test('error del servidor SMTP: 502/503 genérico, sin confirmar recepción y sin datos en el registro', async () => {
    state.sendImpl = async () => { throw Object.assign(new Error('535 5.7.8 usuario ana.prueba@example.com rechazado'), { code: 'EAUTH' }) }
    let r = await submit()
    assert.equal(r.error.statusCode, 502)
    assert.equal(r.error.data.reason, 'smtp_error')
    assert.ok(!r.error.message.includes('535') && !r.error.message.includes('example.com'))
    state.sendImpl = async () => { throw Object.assign(new Error('connect ECONNREFUSED 10.0.0.1:465'), { code: 'ESOCKET' }) }
    mail.resetMailGuards()
    r = await submit()
    assert.equal(r.error.statusCode, 503)
    assert.equal(r.error.data.reason, 'smtp_unreachable')
    const log = logged()
    assert.ok(!log.includes('ana.prueba') && !log.includes('Rinoplastia') && !log.includes('1234567890') && !log.includes(SECRET) && !log.includes('10.0.0.1'))
    assert.match(log, /fallo SMTP \(EAUTH\)/)
    assert.equal(state.closed, 2)
  })
  test('éxito solo si el SMTP aceptó a todos los destinatarios', async () => {
    state.sendImpl = async () => ({ accepted: ['leads@example.test'], rejected: ['copia-leads@example.test'] })
    const r = await submit()
    assert.equal(r.error.statusCode, 502)
    assert.equal(r.error.data.reason, 'smtp_rejected')
  })
  test('un fallo no bloquea el reintento del mismo contenido; un éxito sí lo marca como duplicado', async () => {
    state.sendImpl = async () => { throw Object.assign(new Error('x'), { code: 'ETIMEDOUT' }) }
    assert.equal((await submit()).error.statusCode, 503)
    state.sendImpl = async () => ({ accepted: ['leads@example.test', 'copia-leads@example.test'], rejected: [] })
    assert.deepEqual((await submit()).value, { ok: true })
    const dup = await submit()
    assert.equal(dup.error.statusCode, 409)
    assert.equal(dup.error.data.reason, 'duplicate')
    assert.equal(state.sent.length, 2, 'solo el intento fallido y el exitoso llegaron al transporte')
  })
  test('doble clic simultáneo: un solo correo', async () => {
    let release
    state.sendImpl = () => new Promise(res => { release = () => res({ accepted: ['leads@example.test', 'copia-leads@example.test'], rejected: [] }) })
    const first = submit()
    await new Promise(r => setTimeout(r, 10))
    const second = await submit()
    assert.equal(second.error.statusCode, 409)
    release()
    assert.deepEqual((await first).value, { ok: true })
    assert.equal(state.sent.length, 1)
  })
  test('límite de intentos por IP: el sexto intento recibe 429', async () => {
    for (let i = 0; i < 5; i++) await submit(payload({ first_name: `Persona ${i}` }))
    const r = await submit(payload({ first_name: 'Persona 6' }))
    assert.equal(r.error.statusCode, 429)
    assert.equal(r.error.data.reason, 'rate_limited')
  })
  test('el límite de intentos no se comparte con otros formularios ni con otras IP', async () => {
    for (let i = 0; i < 5; i++) await submit(payload({ first_name: `Persona ${i}` }))
    const other = await submit(payload({ first_name: 'Otra IP' }), { ip: '203.0.113.99' })
    assert.deepEqual(other.value, { ok: true })
  })
})

// ── Servicio del navegador ────────────────────────────────────────────────────

describe('LeadService', () => {
  test('envía JSON a /api/forms/lead y confirma solo con ok: true', async () => {
    const calls = []
    const s = new svc.LeadService(async (url, opts) => { calls.push([url, opts]); return { ok: true } })
    assert.equal(await s.submitLead(payload()), true)
    assert.equal(calls[0][0], '/api/forms/lead')
    assert.equal(calls[0][1].method, 'POST')
    await assert.rejects(new svc.LeadService(async () => ({})).submitLead(payload()), e => e.kind === 'server')
  })
  test('traduce 422, 409, 429 y fallos de red a mensajes aptos para el usuario', () => {
    const k = (statusCode, data) => svc.LeadService.toError({ statusCode, data: { data } })
    assert.equal(k(422, { message: 'Revisa los datos ingresados.' }).kind, 'validation')
    assert.equal(k(409, {}).kind, 'duplicate')
    assert.equal(k(429, {}).kind, 'rate_limited')
    assert.equal(k(503, {}).kind, 'unavailable')
    assert.equal(svc.LeadService.toError(new Error('fetch failed')).kind, 'unavailable')
    assert.equal(k(500, {}).kind, 'server')
  })
})

// ── Código del proyecto ───────────────────────────────────────────────────────

describe('Formulario y archivos del proyecto', () => {
  test('LeadForm usa el servicio real: sin proveedor simulado, sin console.log y sin CRM', () => {
    assert.doesNotMatch(read('services/LeadService.ts'), /MockLeadProvider/)
    for (const f of ['services/LeadService.ts', 'server/utils/leadForm.ts', 'server/api/forms/lead.post.ts', 'shared/utils/leadForm.ts', 'components/forms/LeadForm.vue']) {
      const s = read(f)
      assert.doesNotMatch(s, /console\.log|pdtclientsolutions|crm-public|id_credit|id_line/i, f)
      assert.doesNotMatch(s, /localStorage|sessionStorage|writeFile|createWriteStream/, f)
    }
    assert.match(read('components/forms/LeadForm.vue'), /accepted_habeas_data: form\.accepted_habeas_data === true/)
  })
  test('no crea un transporte propio: usa el núcleo común de correo', () => {
    const s = read('server/utils/leadForm.ts')
    assert.doesNotMatch(s, /nodemailer|createTransport/)
    assert.match(s, /deliverFormMail/)
    assert.equal(read('server/api/forms/lead.post.ts').includes('handleLead'), true)
  })
  test('las variables de destinatarios están documentadas sin valores', () => {
    const env = read('.env.example')
    assert.match(env, /^NUXT_LEAD_FORM_TO=$/m)
    assert.match(env, /^NUXT_LEAD_FORM_CC=$/m)
  })
})

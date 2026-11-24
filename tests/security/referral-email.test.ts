// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Programa de REFERIDOS (ReferralForm): Wellezy Hub es el destino PRINCIPAL y el correo es un respaldo COMPLEMENTARIO que sale DESPUÉS de que Hub confirma.
// Se ejecuta el código REAL del servidor con Hub y SMTP SIMULADOS: no se llama a ningún sistema externo ni se envía ningún correo.
// Direcciones, claves, documentos y cuentas de este archivo son FICTICIOS. Este formulario NO es el PRP de pacientes.
import { test, describe, before, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT } from '../recommendations/harness.ts'

const fileUrl = rel => pathToFileURL(join(ROOT, rel)).href
const read = rel => readFileSync(join(ROOT, rel), 'utf8')
const SOCKET_IP = '203.0.113.40'
const ACCOUNT = '12345678901'
const HOLDER_DOC = '1020304050'

const CFG = {
  mailHost: 'smtp.example.test', mailPort: 465, mailUsername: 'sender@example.test', mailPassword: 'clave-ficticia', mailFromAddress: '', mailFromName: 'Marca de prueba',
  referralTo: 'referidos@example.test', referralCc: 'copia-referidos@example.test',
  sessionPassword: 'x'.repeat(40), trustedProxyHops: 0, public: { appName: 'Marca de prueba' }
}

const state = { cfg: {}, sent: [], sendImpl: null, factoryCalls: 0, logs: [], hubCalls: [], hubImpl: null, order: [], inscriptions: new Map(), netCalls: [] }
let dir, enrol, referral, mail, realError, realFetch

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'referral-'))
  realError = console.error
  console.error = (...a) => { state.logs.push(a.map(String).join(' ')) }
  const g = globalThis
  realFetch = g.fetch
  g.fetch = (...a) => { state.netCalls.push(a); throw new Error('sin red en las pruebas') }
  g.createError = o => Object.assign(new Error(o.message ?? 'error'), o)
  g.useRuntimeConfig = () => state.cfg
  g.setHeader = () => {}
  g.assertSameOrigin = () => {}
  g.getRequestIP = e => e.ip
  g.getRequestHeader = (e, name) => e.headers?.[name.toLowerCase()]
  g.readBody = async e => e.body
  // Hub simulado con la semántica de idempotencia: la misma clave nunca crea otra inscripción.
  g.wellezyPublicPost = async (event, path, payload, headers) => {
    state.hubCalls.push({ path, payload, headers })
    state.order.push('hub')
    return state.hubImpl({ path, payload, headers })
  }
  const base = fileUrl('shared/utils')
  const fix = s => s.replace(/'#shared\/utils\/([A-Za-z]+)'/g, (_, m) => `'${base}/${m}.ts'`).replace("'./formMail'", "'./formMail.ts'").replace("'./referral'", "'./referral.ts'")
  for (const f of ['formMail', 'referral', 'prpEnrollment']) writeFileSync(join(dir, `${f}.ts`), fix(read(`server/utils/${f}.ts`)))
  enrol = await import(pathToFileURL(join(dir, 'prpEnrollment.ts')).href)
  referral = await import(pathToFileURL(join(dir, 'referral.ts')).href)
  mail = await import(pathToFileURL(join(dir, 'formMail.ts')).href)
})

beforeEach(() => {
  state.cfg = { ...CFG }
  state.sent = []
  state.factoryCalls = 0
  state.logs = []
  state.hubCalls = []
  state.order = []
  state.inscriptions = new Map()
  state.netCalls = []
  state.sendImpl = async () => { state.order.push('mail'); return { accepted: ['referidos@example.test', 'copia-referidos@example.test'], rejected: [] } }
  state.hubImpl = async ({ headers, payload }) => {
    const key = headers['Idempotency-Key']
    const replay = state.inscriptions.has(key)
    if (!replay) state.inscriptions.set(key, payload)
    return { status: replay ? 200 : 201, data: { data: { status: 'completed' } } }
  }
  enrol.resetEnrollmentGuards()
  mail.resetMailGuards()
  mail.setMailTransportFactory(async (cfg) => {
    state.factoryCalls++
    return { sendMail: async (msg) => { state.sent.push({ cfg, msg }); return state.sendImpl(msg) }, close: () => {} }
  })
})

after(() => {
  console.error = realError
  globalThis.fetch = realFetch
  mail.resetMailGuards()
  mail.setMailTransportFactory()
  rmSync(dir, { recursive: true, force: true })
})

const CASH = {
  full_name: 'Ana María Prueba', phone: '300 123 4567', email: 'Ana.Prueba@Example.com', document_type: 'Cédula de ciudadanía', document_number: '1.098.765.432',
  surgery_date: '2025-03-10', surgery_name: 'Rinoplastia', wants_control: true, payment_method: 'Efectivo', suggestion: 'Todo muy bien, gracias.',
  bank_holder_name: '', bank_holder_document: '', bank_account_number: '', accepted_contract: true
}
const TRANSFER = { ...CASH, payment_method: 'Transferencia Bancaria (Bancolombia)', bank_holder_name: 'Ana María Prueba', bank_holder_document: HOLDER_DOC, bank_account_number: ACCOUNT }
const event = (body = { ...CASH }, over = {}) => ({
  method: 'POST', ip: SOCKET_IP, body, ...over,
  headers: { 'content-length': '900', 'content-type': 'application/json', ...(over.headers ?? {}) }
})
const run = async (fn, e) => { try { return { value: await fn(e) } } catch (error) { return { error } } }
const enroll = async (body, over) => { const r = await run(enrol.handlePrpEnrollment, event(body, over)); await mail.settleNotifications(); return r }
const retryRoute = (body, over) => run(referral.handleReferral, event(body, over))
const smtpDown = () => { state.sendImpl = async () => { state.order.push('mail-fail'); throw Object.assign(new Error('boom'), { code: 'ECONNREFUSED' }) } }
const smtpUp = () => { state.sendImpl = async () => ({ accepted: ['referidos@example.test', 'copia-referidos@example.test'], rejected: [] }) }
const logged = () => state.logs.join('\n')

describe('Hub principal + correo de respaldo', () => {
  test('Hub ok + correo ok => {ok:true,status}; Hub se llama primero y el correo sale después con asunto y destinatarios del servidor', async () => {
    const r = await enroll()
    assert.equal(r.value?.ok, true)
    assert.equal(r.value.status, 'completed')
    assert.deepEqual(state.order, ['hub', 'mail'])
    assert.equal(state.hubCalls.length, 1)
    assert.equal(state.hubCalls[0].path, '/v1/web/prp-enrollments')
    assert.match(state.hubCalls[0].headers['Idempotency-Key'], /^[0-9a-f]{48}$/)
    assert.equal(state.sent.length, 1)
    const { msg } = state.sent[0]
    assert.equal(msg.subject, '[Marca de prueba] Nueva inscripción al programa de referidos')
    assert.deepEqual(msg.to, ['referidos@example.test'])
    assert.deepEqual(msg.cc, ['copia-referidos@example.test'])
    assert.match(msg.text, /Ana María Prueba/)
  })

  test('Hub ok + correo FALLA => el usuario ve el mismo éxito, la inscripción en Hub se conserva y el correo queda pendiente de reintento', async () => {
    smtpDown()
    const r = await enroll()
    assert.equal(r.error, undefined, 'el fallo del correo nunca llega al usuario')
    assert.deepEqual(r.value, { ok: true, status: 'completed' })
    assert.equal(state.hubCalls.length, 1)
    assert.equal(state.inscriptions.size, 1)
    const key = state.hubCalls[0].headers['Idempotency-Key']
    assert.equal(mail.notificationState(key), 'pending')
    assert.doesNotMatch(logged(), /Ana|Prueba|example\.com|1\.?098/)
  })

  test('Hub ok sin correo configurado (o sin destinatario) => éxito normal; no se intenta ningún envío', async () => {
    for (const cfg of [{ ...CFG, referralTo: '' }, { ...CFG, mailHost: '' }]) {
      state.cfg = cfg
      mail.resetMailGuards()
      state.hubCalls = []
      const r = await enroll()
      assert.equal(r.value?.ok, true)
      assert.equal(state.factoryCalls, 0)
    }
  })

  test('Hub devuelve `received` => también se considera confirmada y se envía el respaldo', async () => {
    state.hubImpl = async () => ({ status: 201, data: { data: { status: 'received' } } })
    const r = await enroll()
    assert.deepEqual(r.value, { ok: true, status: 'received' })
    assert.equal(state.sent.length, 1)
  })
})

describe('Hub falla: no se afirma registro ni se envía correo', () => {
  test('503 / 500 / sin conexión => 503 hub_unavailable reintentable y NINGÚN correo', async () => {
    for (const res of [{ status: 503, data: null }, { status: 500, data: null }, { status: 0, data: null }]) {
      state.hubImpl = async () => res
      mail.resetMailGuards()
      const r = await enroll()
      assert.equal(r.error?.statusCode, 503)
      assert.equal(r.error.data.reason, 'hub_unavailable')
      assert.equal(r.error.data.retryable, true)
      assert.equal(state.sent.length, 0)
    }
  })

  test('422 / 409 / 429 de Hub => se conserva el error original y NO sale correo', async () => {
    for (const status of [422, 409, 429]) {
      state.hubImpl = async () => ({ status, data: { errors: { document_number: ['inválido'] } } })
      mail.resetMailGuards()
      const r = await enroll()
      assert.equal(r.error?.statusCode, status)
      assert.equal(state.sent.length, 0)
    }
  })

  test('2xx sin estado válido => 502 unconfirmed y NO sale correo', async () => {
    state.hubImpl = async () => ({ status: 201, data: { data: {} } })
    const r = await enroll()
    assert.equal(r.error?.statusCode, 502)
    assert.equal(r.error.data.reason, 'unconfirmed')
    assert.equal(state.sent.length, 0)
  })

  test('validación local inválida => 422 sin llamar a Hub ni al correo', async () => {
    const r = await enroll({ ...CASH, accepted_contract: false })
    assert.equal(r.error?.statusCode, 422)
    assert.equal(state.hubCalls.length, 0)
    assert.equal(state.sent.length, 0)
  })
})

describe('Reintentos: nunca una segunda inscripción ni un segundo correo', () => {
  test('correo falla; el usuario reenvía lo mismo => misma clave en Hub (1 sola inscripción), el correo se reintenta y sale UNA vez', async () => {
    smtpDown()
    const a = await enroll()
    assert.equal(a.value?.ok, true)
    smtpUp()
    const b = await enroll()
    assert.equal(b.value?.ok, true)
    assert.equal(state.hubCalls.length, 2)
    assert.equal(state.hubCalls[0].headers['Idempotency-Key'], state.hubCalls[1].headers['Idempotency-Key'])
    assert.equal(state.inscriptions.size, 1, 'Hub conserva una sola inscripción')
    assert.equal(state.sent.length, 2, 'un intento fallido y uno aceptado')
    const c = await enroll()
    assert.equal(c.value?.ok, true)
    assert.equal(state.sent.length, 2, 'ya entregado: no se vuelve a enviar')
  })

  test('éxito completo reenviado => el correo no se duplica', async () => {
    await enroll()
    await enroll()
    assert.equal(state.inscriptions.size, 1)
    assert.equal(state.sent.length, 1)
  })

  test('POST /api/forms/referral reintenta SOLO una inscripción pendiente confirmada por Hub: no llama a Hub y no crea otra inscripción', async () => {
    smtpDown()
    await enroll()
    const hubBefore = state.hubCalls.length
    smtpUp()
    const r = await retryRoute()
    assert.deepEqual(r.value, { ok: true, notification: 'sent' })
    assert.equal(state.hubCalls.length, hubBefore, 'no vuelve a llamar a Hub')
    assert.equal(state.inscriptions.size, 1)
    const again = await retryRoute()
    assert.deepEqual(again.value, { ok: true, notification: 'sent' })
    assert.equal(state.sent.length, 2)
  })

  test('POST /api/forms/referral sin inscripción confirmada => 409 y NO envía correo (no sirve para enviar correos sin Hub)', async () => {
    const r = await retryRoute()
    assert.equal(r.error?.statusCode, 409)
    assert.equal(r.error.data.reason, 'hub_not_confirmed')
    assert.equal(state.sent.length, 0)
    assert.equal(state.hubCalls.length, 0)
  })

  test('la cola de reintento es acotada y en memoria: tras agotar los intentos se abandona sin lanzar ni tocar a Hub', async () => {
    smtpDown()
    await enroll()
    const key = state.hubCalls[0].headers['Idempotency-Key']
    for (let i = 0; i < 3; i++) await enroll() // cada reenvío reintenta el correo: 1 + 3 intentos agotan la cola
    assert.equal(mail.notificationState(key), 'gave_up')
    assert.equal(state.inscriptions.size, 1)
  })
})

describe('Datos bancarios', () => {
  test('Hub recibe los datos completos; el correo solo lleva el titular y los últimos 4 dígitos', async () => {
    const r = await enroll({ ...TRANSFER })
    assert.equal(r.value?.ok, true)
    const sentToHub = JSON.stringify(state.hubCalls[0].payload)
    assert.ok(sentToHub.includes(ACCOUNT) && sentToHub.includes(HOLDER_DOC), 'Hub conserva los datos completos')
    const { msg } = state.sent[0]
    for (const part of [msg.text, msg.html]) {
      assert.ok(!part.includes(ACCOUNT), 'cuenta completa fuera del correo')
      assert.ok(!part.includes(HOLDER_DOC), 'documento del titular completo fuera del correo')
      assert.ok(part.includes('****8901') && part.includes('****4050'))
    }
    assert.doesNotMatch(logged(), new RegExp(`${ACCOUNT}|${HOLDER_DOC}`))
  })

  test('con efectivo el correo no incluye sección bancaria', async () => {
    await enroll({ ...CASH })
    assert.doesNotMatch(state.sent[0].msg.text, /Datos bancarios/)
  })
})

describe('Rutas, servicio y alcance: la integración con Hub se conserva', () => {
  test('la ruta y el servicio originales de Hub existen; ReferralService sigue enviando a Hub (no a la ruta de correo)', () => {
    assert.ok(existsSync(join(ROOT, 'server/api/forms/prp-enrollment.post.ts')))
    assert.ok(existsSync(join(ROOT, 'server/utils/prpEnrollment.ts')))
    assert.ok(existsSync(join(ROOT, 'shared/utils/prpEnrollment.ts')))
    assert.match(read('server/api/forms/prp-enrollment.post.ts'), /handlePrpEnrollment/)
    assert.match(read('services/ReferralService.ts'), /\/api\/forms\/prp-enrollment/)
    assert.doesNotMatch(read('services/ReferralService.ts'), /\/api\/forms\/referral/)
    assert.match(read('server/utils/prpEnrollment.ts'), /\/v1\/web\/prp-enrollments/)
  })

  test('el correo es posterior a la confirmación: el handler de Hub solo lo invoca dentro de la rama confirmada', () => {
    const src = read('server/utils/prpEnrollment.ts')
    const call = src.indexOf('notifyReferralByEmail(event')
    assert.ok(call > src.indexOf("status === 'completed'"), 'después de validar el estado de Hub')
    assert.ok(call < src.indexOf('return { ok: true, status }'))
  })

  test('el PRP de pacientes no se modificó (PrpLeadForm, /prp/[slug], PrpLeadService, CrmPrpLeadProvider, server/utils/prp)', () => {
    const files = ['components/prp/PrpLeadForm.vue', 'pages/prp/[slug].vue', 'services/PrpLeadService.ts', 'providers/CrmPrpLeadProvider.ts', 'server/utils/prp.ts']
    for (const f of files) assert.ok(existsSync(join(ROOT, f)), f)
    const changed = execFileSync('git', ['status', '--porcelain', '--', ...files], { cwd: ROOT, encoding: 'utf8' })
    assert.equal(changed.trim(), '', 'sin cambios locales en el PRP de pacientes')
  })

  test('las pruebas no hicieron llamadas de red reales', () => {
    assert.deepEqual(state.netCalls, [])
  })
})

describe('Blindaje, respuesta independiente y límites de la deduplicación del correo', () => {
  const keyOfHub = () => state.hubCalls[0].headers['Idempotency-Key']

  test('un error al LEER la configuración de correo no altera la inscripción confirmada por Hub', async () => {
    const cfg = { ...CFG }
    Object.defineProperty(cfg, 'mailHost', { get() { throw new Error('config corrupta') }, enumerable: true, configurable: true })
    state.cfg = cfg
    const r = await enroll()
    assert.deepEqual(r.value, { ok: true, status: 'completed' })
    assert.equal(state.inscriptions.size, 1)
    assert.equal(state.sent.length, 0)
    assert.doesNotMatch(logged(), /config corrupta|Ana|example\.com/)
  })

  test('SMTP mal configurado (sin contraseña, puerto inválido o sin servidor) => la inscripción de Hub queda intacta y no se intenta el envío', async () => {
    for (const bad of [{ mailPassword: '' }, { mailPort: 'abc' }, { mailHost: '' }]) {
      state.cfg = { ...CFG, ...bad }
      mail.resetMailGuards()
      const r = await enroll()
      assert.deepEqual(r.value, { ok: true, status: 'completed' }, JSON.stringify(bad))
      assert.equal(state.factoryCalls, 0)
    }
  })

  test('la respuesta NO espera al SMTP: con el SMTP colgado Hub responde de inmediato y el correo queda pendiente hasta que termina', async () => {
    let release
    state.sendImpl = () => new Promise((res) => { release = () => res({ accepted: ['referidos@example.test', 'copia-referidos@example.test'], rejected: [] }) })
    const r = await run(enrol.handlePrpEnrollment, event()) // sin esperar al correo
    assert.deepEqual(r.value, { ok: true, status: 'completed' })
    assert.equal(mail.notificationState(keyOfHub()), 'pending', 'no se informa como enviado mientras no lo esté')
    await new Promise(res => setImmediate(res))
    assert.equal(typeof release, 'function', 'el envío está en curso en segundo plano')
    release()
    await mail.settleNotifications()
    assert.equal(mail.notificationState(keyOfHub()), 'sent')
  })

  test('POST /api/forms/referral informa la verdad: mientras el SMTP siga caído responde notification:"pending", nunca "sent"', async () => {
    smtpDown()
    await enroll()
    const r = await retryRoute()
    assert.deepEqual(r.value, { ok: true, notification: 'pending' })
  })

  test('REINICIO simulado: el estado del correo se pierde; un reenvío envía OTRO correo y Hub conserva UNA inscripción (límite documentado, sin garantía de «exactamente una vez»)', async () => {
    await enroll()
    assert.equal(state.sent.length, 1)
    mail.resetMailGuards() // equivale a reiniciar Node: la memoria desaparece
    await enroll()
    assert.equal(state.inscriptions.size, 1)
    assert.equal(state.sent.length, 2, 'sin persistencia no se puede evitar este duplicado de correo')
  })

  test('REINICIO con correo pendiente: el pendiente se pierde (no hay reintento recuperable) y POST /api/forms/referral responde 409', async () => {
    smtpDown()
    await enroll()
    const attempts = state.sent.length // el intento fallido ya quedó registrado por el transporte simulado
    mail.resetMailGuards()
    smtpUp()
    const r = await retryRoute()
    assert.equal(r.error?.statusCode, 409)
    assert.equal(state.sent.length, attempts, 'no sale ningún correo nuevo')
    assert.equal(state.inscriptions.size, 1, 'Hub conserva el registro')
  })

  test('VARIAS INSTANCIAS: cada una tiene su memoria; el reintento en otra instancia da 409 y un reenvío allí envía otro correo (límite documentado)', async () => {
    const d = mkdtempSync(join(tmpdir(), 'referral-i2-'))
    const base = fileUrl('shared/utils')
    const fix = s => s.replace(/'#shared\/utils\/([A-Za-z]+)'/g, (_, m) => `'${base}/${m}.ts'`).replace("'./formMail'", "'./formMail.ts'").replace("'./referral'", "'./referral.ts'")
    for (const f of ['formMail', 'referral', 'prpEnrollment']) writeFileSync(join(d, `${f}.ts`), fix(read(`server/utils/${f}.ts`)))
    const B = {
      enrol: await import(pathToFileURL(join(d, 'prpEnrollment.ts')).href),
      referral: await import(pathToFileURL(join(d, 'referral.ts')).href),
      mail: await import(pathToFileURL(join(d, 'formMail.ts')).href)
    }
    B.mail.setMailTransportFactory(async cfg => ({ sendMail: async (msg) => { state.sent.push({ cfg, msg }); return state.sendImpl(msg) }, close: () => {} }))
    try {
      smtpDown()
      await enroll() // instancia A: queda pendiente en A
      assert.equal((await run(B.referral.handleReferral, event())).error?.statusCode, 409, 'B no conoce el pendiente de A')
      smtpUp()
      B.enrol.resetEnrollmentGuards()
      const r = await run(B.enrol.handlePrpEnrollment, event())
      await B.mail.settleNotifications()
      assert.equal(r.value?.ok, true)
      assert.equal(state.inscriptions.size, 1, 'Hub no duplica')
      assert.equal(B.mail.notificationState(keyOfHub()), 'sent')
      assert.equal(mail.notificationState(keyOfHub()), 'pending', 'A sigue con su pendiente: puede reintentarlo y duplicar el correo')
    } finally {
      B.mail.resetMailGuards()
      B.mail.setMailTransportFactory()
      mail.resetMailGuards()
      rmSync(d, { recursive: true, force: true })
    }
  })

  test('lo entregado se recuerda 24 h en este proceso (no 1 h) y pasado ese plazo ya no se recuerda', async () => {
    const realNow = Date.now
    let t = realNow()
    Date.now = () => t
    try {
      await enroll()
      t += 2 * 60 * 60_000
      await enroll()
      assert.equal(state.sent.length, 1, 'a las 2 h no se repite')
      t += 23 * 60 * 60_000 // 25 h en total
      await enroll()
      assert.equal(state.sent.length, 2, 'pasadas 24 h puede repetirse (límite documentado)')
      assert.equal(state.inscriptions.size, 1)
    } finally { Date.now = realNow }
  })

  test('retención mínima: el reintento usa el mensaje YA enmascarado y la cola no guarda el formulario completo', async () => {
    smtpDown()
    await enroll({ ...TRANSFER })
    smtpUp()
    const r = await retryRoute({ ...TRANSFER })
    assert.deepEqual(r.value, { ok: true, notification: 'sent' })
    const last = state.sent[state.sent.length - 1].msg
    for (const part of [last.text, last.html]) {
      assert.ok(!part.includes(ACCOUNT) && !part.includes(HOLDER_DOC))
      assert.ok(part.includes('****8901') && part.includes('****4050'))
    }
    const src = read('server/utils/formMail.ts')
    const entry = src.slice(src.indexOf('interface NotifyEntry'), src.indexOf('const pending'))
    assert.match(entry, /msg\?: ComplementaryMessage/)
    assert.doesNotMatch(entry, /build|value|EnrollmentInput/, 'solo el mensaje construido, nunca el formulario')
    assert.doesNotMatch(logged(), new RegExp(`${ACCOUNT}|${HOLDER_DOC}`))
  })
})

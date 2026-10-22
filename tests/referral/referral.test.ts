// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Inscripción al PRP (Programa de referidos): validación compartida, payload hacia Hub, ruta de servidor (con un Hub FALSO), servicio del
// navegador y comprobaciones estáticas del formulario. Ninguna prueba envía nada real (ni a Hub ni al CRM médico).
import { test, describe, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT, makeError } from '../recommendations/harness.ts'
import { buildHubPayload, normalizeEnrollment, validateEnrollment, DOCUMENT_TYPES } from '../../shared/utils/prpEnrollment.ts'
import { resolveClientIp } from '../../shared/utils/clientIp.ts'
import { ReferralService, ReferralError } from '../../services/ReferralService.ts'

const read = rel => readFileSync(join(ROOT, rel), 'utf8')
const TODAY = new Date(Date.UTC(2026, 9, 19))
const good = (over = {}) => ({
  full_name: 'Persona Ficticia Prueba', phone: '3001112233', email: 'ficticia.prueba@example.com', document_type: 'Cédula de ciudadanía', document_number: '1098765432',
  surgery_date: '2026-01-15', surgery_name: 'Abdominoplastia', wants_control: true, payment_method: 'Efectivo', suggestion: '',
  bank_holder_name: '', bank_holder_document: '', bank_account_number: '', accepted_contract: true, ...over
})
const transfer = (over = {}) => good({ payment_method: 'Transferencia Bancaria (Bancolombia)', bank_holder_name: 'Titular Ficticio', bank_holder_document: '1098765432', bank_account_number: '12345678901', ...over })
const errorsOf = (body) => validateEnrollment(normalizeEnrollment(body), TODAY)

// ───────────────────────── Validación compartida ─────────────────────────

describe('validateEnrollment', () => {
  test('efectivo y transferencia completos son válidos', () => {
    assert.deepEqual(errorsOf(good()), {})
    assert.deepEqual(errorsOf(transfer()), {})
  })

  test('cada campo obligatorio vacío produce su mensaje', () => {
    for (const field of ['full_name', 'phone', 'email', 'document_type', 'document_number', 'surgery_date', 'surgery_name']) {
      const e = errorsOf(good({ [field]: '' }))
      assert.ok(e[field], field)
      assert.equal(Object.keys(e).length, 1, field)
    }
  })

  test('tipo y número de documento: lista cerrada y número validado según el tipo', () => {
    assert.deepEqual(DOCUMENT_TYPES.map(t => t.label), ['Cédula de ciudadanía', 'Tarjeta de identidad', 'Cédula de extranjería', 'Pasaporte', 'NIT', 'Otro'])
    assert.ok(errorsOf(good({ document_type: 'Licencia' })).document_type)
    for (const [type, number] of [['Cédula de ciudadanía', 'ABC12345'], ['Tarjeta de identidad', '123'], ['Cédula de extranjería', '12'], ['NIT', 'XX'], ['Pasaporte', '12']]) {
      assert.ok(errorsOf(good({ document_type: type, document_number: number })).document_number, `${type} ${number}`)
    }
    for (const [type, number] of [['Pasaporte', 'AB123456'], ['NIT', '900123456-7'], ['Otro', 'XYZ-12345'], ['Cédula de extranjería', '123456']]) {
      assert.deepEqual(errorsOf(good({ document_type: type, document_number: number })), {}, `${type} ${number}`)
    }
    // El número se normaliza (puntos y espacios fuera, mayúsculas).
    assert.equal(normalizeEnrollment(good({ document_number: ' 1.098.765.432 ' })).document_number, '1098765432')
  })

  test('formatos: teléfono, correo y fecha de la cirugía (no futura, real)', () => {
    assert.ok(errorsOf(good({ phone: '123' })).phone)
    assert.ok(errorsOf(good({ phone: 'abc1234567' })).phone)
    assert.ok(errorsOf(good({ email: 'no-es-correo' })).email)
    assert.ok(errorsOf(good({ surgery_date: '2999-01-01' })).surgery_date)
    assert.ok(errorsOf(good({ surgery_date: '2026-02-30' })).surgery_date)
    assert.ok(errorsOf(good({ surgery_date: '15/01/2026' })).surgery_date)
    assert.ok(errorsOf(good({ suggestion: 'x'.repeat(1001) })).suggestion)
  })

  test('datos bancarios: obligatorios y válidos SOLO con transferencia; con efectivo nunca se exigen', () => {
    for (const field of ['bank_holder_name', 'bank_holder_document', 'bank_account_number']) {
      assert.ok(errorsOf(transfer({ [field]: '' }))[field], field)
      assert.equal(errorsOf(good({ [field]: '' }))[field], undefined, field)
    }
    assert.ok(errorsOf(transfer({ bank_account_number: '12ab' })).bank_account_number)
    assert.ok(errorsOf(transfer({ bank_account_number: '123' })).bank_account_number)
    assert.equal(normalizeEnrollment(transfer({ bank_account_number: '1234-5678 901' })).bank_account_number, '12345678901')
  })

  test('al elegir efectivo los datos bancarios se descartan (no quedan en lo que se envía)', () => {
    const v = normalizeEnrollment(good({ bank_holder_name: 'Alguien', bank_holder_document: '123456789', bank_account_number: '1234567890' }))
    assert.deepEqual([v.bank_holder_name, v.bank_holder_document, v.bank_account_number], ['', '', ''])
    const payload = buildHubPayload(v)
    assert.equal(payload.payment_method, 'efectivo')
    for (const k of ['bank_holder_name', 'bank_holder_document', 'bank_account_number']) assert.equal(k in payload, false, k)
  })

  test('el consentimiento del contrato es obligatorio y solo vale `true` exacto', () => {
    for (const accepted_contract of [false, undefined, 'true', 1, null]) assert.ok(errorsOf(good({ accepted_contract })).accepted_contract, String(accepted_contract))
  })

  test('buildHubPayload: valores canónicos, transferencia con datos bancarios y sin campos desconocidos', () => {
    const p = buildHubPayload(normalizeEnrollment(transfer({ company_id: 9, linea_id: 9, id_user: 1 })))
    assert.equal(p.document_type, 'CÉDULA DE CIUDADANÍA')
    assert.equal(p.payment_method, 'transferencia')
    assert.deepEqual([p.bank_holder_name, p.bank_account_number], ['Titular Ficticio', '12345678901'])
    for (const k of ['company_id', 'linea_id', 'id_user']) assert.equal(k in p, false, k)
    assert.equal(p.accepted_contract, true)
    assert.throws(() => buildHubPayload(normalizeEnrollment(good({ accepted_contract: false }))))
  })

  test('resolveClientIp: sin proxies de confianza ignora X-Forwarded-For; con N toma la N-ésima desde el FINAL y descarta basura', () => {
    // Por defecto (0) la cabecera se ignora: forjarla no cambia la clave del límite.
    assert.equal(resolveClientIp('10.0.0.1', '1.2.3.4', 0), '10.0.0.1')
    assert.equal(resolveClientIp('10.0.0.1', '1.2.3.4', undefined), '10.0.0.1')
    // Un proxy de confianza: la última entrada la añadió él; lo anterior lo controla el cliente.
    assert.equal(resolveClientIp('172.18.0.2', '6.6.6.6, 9.9.9.9, 203.0.113.7', 1), '203.0.113.7')
    assert.equal(resolveClientIp('172.18.0.2', '203.0.113.7', 1), '203.0.113.7')
    assert.equal(resolveClientIp('172.18.0.2', '6.6.6.6, 203.0.113.7, 172.18.0.9', 2), '203.0.113.7')
    // Cadena vacía, valores no IP o desmedidos: se vuelve a la IP del socket.
    for (const bad of ['', '   ', 'no-es-ip!', '<script>', 'a'.repeat(600), undefined, null]) assert.equal(resolveClientIp('10.0.0.1', bad, 1), '10.0.0.1', String(bad).slice(0, 12))
    // Cadena más corta que los proxies esperados o número de proxies inválido.
    assert.equal(resolveClientIp('10.0.0.1', '1.1.1.1', 2), '10.0.0.1')
    assert.equal(resolveClientIp('10.0.0.1', '1.1.1.1', -1), '10.0.0.1')
    assert.equal(resolveClientIp('10.0.0.1', '1.1.1.1', 1.5), '10.0.0.1')
    assert.equal(resolveClientIp(undefined, undefined, 1), 'unknown')
    assert.equal(resolveClientIp('2001:db8::1', '::1, 2001:db8::7', 1), '2001:db8::7')
  })
})

// ───────────────────────── Ruta de servidor (Hub falso) ─────────────────────────

let handle, reset, hubCalls, hubResponder
const logs = []
const SECRET = 'secreto-de-prueba-con-mas-de-32-caracteres-aleatorios'
const runtime = { sessionPassword: SECRET, trustedProxyHops: 0 }
const event = (body, headers = { origin: 'https://planmed.test', host: 'planmed.test' }, ip = '10.0.0.1') => ({ method: 'POST', body, headers, ip })
const run = async (e) => { try { return { value: await handle(e) } } catch (error) { return { error } } }

before(async () => {
  const g = globalThis
  g.createError = makeError
  g.authError = (statusCode, message) => makeError({ statusCode, message })
  g.getRequestHeader = (e, name) => e.headers[name.toLowerCase()]
  g.setHeader = () => {}
  g.readBody = async e => e.body
  g.getRequestIP = e => e.ip
  g.useRuntimeConfig = () => runtime
  g.assertSameOrigin = (await import(pathToFileURL(resolve(ROOT, 'server/utils/origin.ts')).href)).assertSameOrigin
  g.wellezyPublicPost = async (_e, path, body, headers = {}) => { hubCalls.push({ path, body, headers }); return hubResponder(path, body, headers) }
  const mod = await import(pathToFileURL(resolve(ROOT, 'server/utils/prpEnrollment.ts')).href)
  handle = mod.handlePrpEnrollment
  reset = mod.resetEnrollmentGuards
  for (const level of ['log', 'warn', 'error', 'info']) console[level] = (...a) => { logs.push(a.map(String).join(' ')) }
})

beforeEach(() => {
  reset()
  hubCalls = []
  logs.length = 0
  runtime.sessionPassword = SECRET
  runtime.trustedProxyHops = 0
  hubResponder = async () => ({ status: 201, data: { data: { uuid: 'u-1', status: 'received' } } })
})

describe('POST /api/forms/prp-enrollment', () => {
  test('envía UNA petición a Hub con el payload canónico, tenant del servidor y clave de idempotencia estable', async () => {
    const r = await run(event(good()))
    assert.deepEqual(r.value, { ok: true, status: 'received' })
    assert.equal(hubCalls.length, 1)
    assert.equal(hubCalls[0].path, '/v1/web/prp-enrollments')
    assert.deepEqual(hubCalls[0].body, buildHubPayload(normalizeEnrollment(good())))
    const key = hubCalls[0].headers['Idempotency-Key']
    assert.match(key, /^[0-9a-f]{48}$/)
    // El MISMO envío reintentado produce la MISMA clave (idempotente, también tras un timeout).
    reset(); hubCalls.length = 0
    await run(event(good()))
    assert.equal(hubCalls[0].headers['Idempotency-Key'], key)
    // Cualquier dato distinto (contacto, cirugía, documento, banco) produce OTRA clave: un tercero no puede ocupar la inscripción ajena.
    for (const over of [{ phone: '3110000000' }, { suggestion: 'otra sugerencia' }, { document_number: '1111111111' }, { surgery_name: 'Rinoplastia' }, { email: 'otro@example.com' }]) {
      reset(); hubCalls.length = 0
      await run(event(good(over)))
      assert.notEqual(hubCalls[0].headers['Idempotency-Key'], key, JSON.stringify(over))
    }
    reset(); hubCalls.length = 0
    await run(event(transfer()))
    const bankKey = hubCalls[0].headers['Idempotency-Key']
    reset(); hubCalls.length = 0
    await run(event(transfer({ bank_account_number: '99999999999' })))
    assert.notEqual(hubCalls[0].headers['Idempotency-Key'], bankKey)
    // La clave depende del secreto del servidor (no se puede calcular con datos públicos) y no contiene los datos.
    runtime.sessionPassword = 'otro-secreto-distinto-con-mas-de-32-caracteres-xyz'
    reset(); hubCalls.length = 0
    await run(event(good()))
    assert.notEqual(hubCalls[0].headers['Idempotency-Key'], key)
    assert.equal(hubCalls[0].headers['Idempotency-Key'].includes('1098765432'), false)
  })

  test('sin secreto de servidor configurado: falla cerrado (503), Hub no se invoca y el log no tiene datos personales', async () => {
    runtime.sessionPassword = ''
    const r = await run(event(transfer()))
    assert.equal(r.error.statusCode, 503)
    assert.equal(hubCalls.length, 0)
    for (const secret of ['Persona Ficticia', '1098765432', '12345678901', 'ficticia.prueba']) assert.equal(logs.join('\n').includes(secret), false)
  })

  test('Hub responde 409 (clave con otros datos): 409 sin reintento automático ni datos de la otra inscripción', async () => {
    hubResponder = async () => ({ status: 409, data: { message: 'La clave de idempotencia ya se utilizó con otros datos.', uuid: 'ajena', full_name: 'Otra Persona' } })
    const r = await run(event(good()))
    assert.equal(r.error.statusCode, 409)
    assert.equal(r.error.data.reason, 'conflict')
    assert.equal(JSON.stringify(r.error).includes('Otra Persona'), false)
    assert.equal(hubCalls.length, 1)
  })

  test('éxito definitivo SOLO con `completed`; `received` es «guardada, pendiente»', async () => {
    hubResponder = async () => ({ status: 201, data: { data: { uuid: 'u', status: 'completed' } } })
    assert.deepEqual((await run(event(good()))).value, { ok: true, status: 'completed' })
    for (const data of [undefined, {}, { data: {} }, { data: { status: 'ok' } }, { data: { status: 'sent' } }]) {
      reset()
      hubResponder = async () => ({ status: 201, data })
      const r = await run(event(good()))
      assert.equal(r.value, undefined)
      assert.equal(r.error.statusCode, 502)
      assert.equal(r.error.data.retryable, true)
    }
  })

  test('payload inválido → 422 por campo y Hub NO se invoca (incluye consentimiento, documento y bancarios)', async () => {
    for (const body of [good({ accepted_contract: false }), good({ document_type: '' }), good({ document_number: 'x' }), transfer({ bank_account_number: '' }), good({ email: 'x' }), {}, null, 'texto']) {
      reset(); hubCalls.length = 0
      const r = await run(event(body))
      assert.equal(r.error?.statusCode, 422)
      assert.equal(r.error.data.reason, 'validation')
      assert.ok(Object.keys(r.error.data.errors).length)
      assert.equal(hubCalls.length, 0)
    }
  })

  test('con efectivo los datos bancarios que lleguen NO viajan a Hub', async () => {
    await run(event({ ...good(), bank_holder_name: 'Alguien', bank_holder_document: '123456789', bank_account_number: '1234567890' }))
    assert.equal(hubCalls.length, 1)
    for (const k of ['bank_holder_name', 'bank_holder_document', 'bank_account_number']) assert.equal(k in hubCalls[0].body, false, k)
  })

  test('con transferencia viajan los datos bancarios a Hub', async () => {
    await run(event(transfer()))
    assert.equal(hubCalls[0].body.bank_account_number, '12345678901')
    assert.equal(hubCalls[0].body.payment_method, 'transferencia')
  })

  test('los ids de empresa o línea del navegador se ignoran (Hub resuelve el tenant)', async () => {
    await run(event({ ...good(), company_id: 99, linea_id: 99, tenant: 'otro' }))
    assert.equal(JSON.stringify(hubCalls[0]).includes('99'), false)
    assert.equal('company_id' in hubCalls[0].body, false)
  })

  test('sin señal de mismo origen → 403 y Hub no se invoca', async () => {
    for (const headers of [{ host: 'planmed.test' }, { origin: 'https://otro.test', host: 'planmed.test' }]) {
      assert.equal((await run(event(good(), headers))).error?.statusCode, 403)
    }
    assert.equal(hubCalls.length, 0)
  })

  test('errores de Hub: 422 → campos; 429; 5xx / sin conexión → 503 reintentable (misma clave, sin duplicar)', async () => {
    hubResponder = async () => ({ status: 422, data: { errors: { document_number: ['El número no es válido'], accepted_contract: ['Debes aceptar'] } } })
    let r = await run(event(good()))
    assert.equal(r.error.statusCode, 422)
    assert.deepEqual(r.error.data.errors, { document_number: 'El número no es válido', accepted_contract: 'Debes aceptar' })

    reset(); hubResponder = async () => ({ status: 429 })
    assert.equal((await run(event(good()))).error.statusCode, 429)

    for (const status of [0, 500, 502, 503, 404]) {
      reset(); hubCalls.length = 0
      hubResponder = async () => ({ status })
      r = await run(event(good()))
      assert.equal(r.value, undefined)
      assert.equal(r.error.statusCode, 503, String(status))
      assert.equal(r.error.data.retryable, true)
      assert.equal(hubCalls.length, 1, 'sin reintentos automáticos')
    }
  })

  test('límite por IP: pasado el máximo → 429 sin llamar a Hub; otra IP no se afecta', async () => {
    for (let i = 0; i < 6; i++) await run(event(good({ document_number: `100000000${i}` }), undefined, '10.9.9.9'))
    const before = hubCalls.length
    assert.equal((await run(event(good(), undefined, '10.9.9.9'))).error.statusCode, 429)
    assert.equal(hubCalls.length, before)
    assert.deepEqual((await run(event(good(), undefined, '10.8.8.8'))).value, { ok: true, status: 'received' })
  })

  test('cabeceras X-Forwarded-For manipuladas NO evaden el límite sin proxies de confianza (la IP del socket manda)', async () => {
    const origin = { origin: 'https://planmed.test', host: 'planmed.test' }
    for (let i = 0; i < 6; i++) await run(event(good({ document_number: `200000000${i}` }), { ...origin, 'x-forwarded-for': `1.1.1.${i}` }, '10.7.7.7'))
    const before = hubCalls.length
    // Rotar la cabecera en cada petición no da un cupo nuevo.
    for (const xff of ['8.8.8.8', '9.9.9.9, 7.7.7.7', 'basura', '2.2.2.2,'.repeat(80)]) {
      assert.equal((await run(event(good(), { ...origin, 'x-forwarded-for': xff }, '10.7.7.7'))).error.statusCode, 429, xff.slice(0, 20))
    }
    assert.equal(hubCalls.length, before)
  })

  test('con un proxy de confianza se usa la IP que ÉL añadió; lo que el cliente antepone no cambia su cupo', async () => {
    runtime.trustedProxyHops = 1
    const origin = { origin: 'https://planmed.test', host: 'planmed.test' }
    const viaProxy = spoof => event(good(), { ...origin, 'x-forwarded-for': `${spoof}203.0.113.7` }, '172.18.0.2')
    for (let i = 0; i < 6; i++) assert.equal((await run(viaProxy(`5.5.5.${i}, `))).error, undefined)
    assert.equal((await run(viaProxy('6.6.6.6, '))).error.statusCode, 429)
    // Otro cliente real detrás del mismo proxy no se ve afectado.
    assert.deepEqual((await run(event(good(), { ...origin, 'x-forwarded-for': '198.51.100.9' }, '172.18.0.2'))).value, { ok: true, status: 'received' })
  })

  test('memoria acotada: con el registro saturado de IPs distintas se falla cerrado y no crece sin límite', async () => {
    const origin = { origin: 'https://planmed.test', host: 'planmed.test' }
    for (let i = 0; i < 5000; i++) await run(event({}, origin, `10.${(i >> 8) & 255}.${i & 255}.1`))
    assert.equal((await run(event({}, origin, '10.250.250.250'))).error.statusCode, 429)
  })

  test('los datos personales y bancarios NUNCA aparecen en los logs', async () => {
    const secrets = ['Persona Ficticia', '1098765432', '3001112233', 'ficticia.prueba@example.com', 'Titular Ficticio', '12345678901']
    for (const make of [async () => ({ status: 201, data: { data: { status: 'received' } } }), async () => ({ status: 422, data: { errors: { email: ['ficticia.prueba@example.com inválido'] } } }), async () => ({ status: 500 }), async () => ({ status: 0 }), async () => ({ status: 201, data: {} })]) {
      reset(); hubResponder = make
      await run(event(transfer()))
    }
    const text = logs.join('\n')
    for (const s of secrets) assert.equal(text.includes(s), false, `el log contiene «${s}»`)
  })
})

// ───────────────────────── Servicio del navegador ─────────────────────────

describe('ReferralService', () => {
  const svc = impl => new ReferralService(async (url, options) => impl(url, options))
  const fail = (statusCode, data) => { throw Object.assign(new Error('x'), { statusCode, data: { data } }) }

  test('envía a la ruta de Planmed (nunca a Hub ni al CRM) y devuelve completed/received solo si el servidor lo confirma', async () => {
    let seen
    assert.equal(await svc((u, o) => { seen = { u, o }; return { ok: true, status: 'received' } }).submit(good()), 'received')
    assert.equal(seen.u, '/api/forms/prp-enrollment')
    assert.equal(/pdtclientsolutions|crm-public|wellezy|v1\/web/i.test(JSON.stringify(seen.u)), false)
    assert.equal(await svc(() => ({ ok: true, status: 'completed' })).submit(good()), 'completed')
    for (const res of [undefined, null, {}, { ok: false }, { ok: true }, { ok: true, status: 'done' }, 'ok']) {
      await assert.rejects(() => svc(() => res).submit(good()), e => e instanceof ReferralError && e.retryable === true, JSON.stringify(res))
    }
  })

  test('errores: 422 con campos, 429, 503/504/sin respuesta reintentables y otros', async () => {
    await assert.rejects(() => svc(() => fail(422, { errors: { email: 'Correo inválido' } })).submit(good()), e => e.kind === 'validation' && e.fields.email === 'Correo inválido')
    await assert.rejects(() => svc(() => fail(429, {})).submit(good()), e => e.kind === 'rate_limited')
    for (const status of [503, 504]) await assert.rejects(() => svc(() => fail(status, {})).submit(good()), e => e.kind === 'unavailable' && e.retryable === true)
    await assert.rejects(() => svc(() => { throw new Error('offline') }).submit(good()), e => e.kind === 'unavailable' && e.retryable)
    await assert.rejects(() => svc(() => fail(502, { retryable: true })).submit(good()), e => e.kind === 'server' && e.retryable === true)
  })

  test('no reintenta solo: una llamada por envío', async () => {
    let n = 0
    await assert.rejects(() => svc(() => { n++; fail(503, {}) }).submit(good()))
    assert.equal(n, 1)
  })
})

// ───────────────────────── Formulario (estático) ─────────────────────────

describe('ReferralForm.vue', () => {
  const src = read('components/referral/ReferralForm.vue')
  const code = src.replace(/<!--[\s\S]*?-->/g, '')

  test('conserva el diseño y los campos y añade tipo y número de documento', () => {
    for (const text of ['Regístrate en el programa', 'Ingresa tu nombre completo', 'Actualiza tu número de WhatsApp o celular', 'Actualiza tu correo electrónico', 'Ingresa la fecha en la que te operaste con nosotros', '¿Qué cirugía te practicaste?', '¿Deseas que te programemos una cita de control?', 'El pago de la bonificación prefieres que sea:', '¿Tienes alguna sugerencia para nuestro grupo?', 'Entiendo y acepto las condiciones del contrato de remisión de pacientes', 'Tipo de documento', 'Número de documento', 'Enviar']) {
      assert.ok(src.includes(text), text)
    }
    assert.match(src, /v-for="t in DOCUMENT_TYPES"/)
  })

  test('el aviso «no funcional» ya no existe', () => {
    assert.equal(/referral-form-not-functional|aún no es funcional|en maquetación/i.test(src), false)
  })

  test('datos bancarios solo con transferencia y se vacían al volver a efectivo', () => {
    assert.match(src, /v-if="transfer"/)
    assert.match(src, /watch\(transfer, \(on\) => \{\s*if \(on\) return\s*values\.bank_holder_name = ''/)
  })

  test('éxito definitivo solo con `completed`; `received` se muestra como pendiente; el consentimiento arranca desmarcado', () => {
    assert.match(src, /status === 'completed' \? '¡Gracias! Quedaste inscrita en el programa' : 'Recibimos tu inscripción'/)
    assert.match(src, /accepted_contract: false/)
    assert.match(src, /status\.value = result/)
    assert.ok(src.indexOf('await referralService.submit(payload)') < src.indexOf('Object.assign(values, empty())'))
    const catchBlock = src.slice(src.indexOf('} catch (e) {'), src.indexOf('</script>'))
    assert.equal(/Object\.assign\(values/.test(catchBlock), false, 'los datos se conservan si falla')
  })

  test('envío: servicio del servidor, antidoble envío, sin almacenamiento local, sin logs y sin conocer Hub ni el CRM', () => {
    assert.match(src, /:disabled="status === 'submitting'"/)
    assert.match(src, /if \(status\.value === 'submitting'\) return/)
    assert.equal(/localStorage|sessionStorage|indexedDB|document\.cookie|console\./.test(code), false)
    assert.equal(/pdtclientsolutions|crm-public|wellezy|v1\/web|fetch\(|\$fetch|company_id|linea_id/i.test(code), false)
  })
})

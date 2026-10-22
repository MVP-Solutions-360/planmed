// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Formulario de valoración → CRM médico: validación compartida, payload multipart, ruta de servidor (con un CRM FALSO: ninguna prueba crea
// registros reales), servicio del navegador y comprobaciones estáticas del formulario.
import { test, describe, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT, makeError } from '../recommendations/harness.ts'
import { buildCrmFields, crmConfirmed, normalizeValuation, validateValuation, PAYMENT_OPTIONS, VALUATION_CRM_IDS } from '../../shared/utils/valuation.ts'
import { ValuationService, ValuationError } from '../../services/ValuationService.ts'

const read = rel => readFileSync(join(ROOT, rel), 'utf8')
const TODAY = new Date(Date.UTC(2026, 9, 19))
const good = (over = {}) => ({
  nombres: 'Prueba', apellidos: 'Ficticia', identificacion: 'PRUEBA12345', fecha_nacimiento: '1990-05-17', direccion: 'Ciudad de Prueba',
  telefono: '3000000000', email: 'prueba.ficticia@example.com', name_surgery: 'Abdominoplastia', forma_pago: 'Financiación', accept: true, ...over
})

// ───────────────────────── Validación compartida ─────────────────────────

describe('validateValuation', () => {
  test('un formulario completo es válido', () => assert.deepEqual(validateValuation(normalizeValuation(good()), TODAY), {}))

  test('cada campo obligatorio vacío produce su mensaje', () => {
    for (const field of ['nombres', 'apellidos', 'identificacion', 'fecha_nacimiento', 'direccion', 'telefono', 'email', 'name_surgery', 'forma_pago']) {
      const errors = validateValuation(normalizeValuation(good({ [field]: '' })), TODAY)
      assert.ok(errors[field], field)
      assert.equal(Object.keys(errors).length, 1, field)
    }
  })

  test('formatos: email, teléfono, cédula, fecha y forma de pago', () => {
    const bad = (over) => Object.keys(validateValuation(normalizeValuation(good(over)), TODAY))
    assert.deepEqual(bad({ email: 'no-es-email' }), ['email'])
    assert.deepEqual(bad({ email: 'a@b' }), ['email'])
    assert.deepEqual(bad({ telefono: '123' }), ['telefono'])
    assert.deepEqual(bad({ telefono: 'abc1234567' }), ['telefono'])
    assert.deepEqual(bad({ identificacion: '12.345.678' }), ['identificacion'])
    assert.deepEqual(bad({ identificacion: '123' }), ['identificacion'])
    assert.deepEqual(bad({ fecha_nacimiento: '2026-02-30' }), ['fecha_nacimiento'])
    assert.deepEqual(bad({ fecha_nacimiento: '17/05/1990' }), ['fecha_nacimiento'])
    assert.deepEqual(bad({ fecha_nacimiento: '2027-01-01' }), ['fecha_nacimiento'])
    assert.deepEqual(bad({ fecha_nacimiento: '1850-01-01' }), ['fecha_nacimiento'])
    assert.deepEqual(bad({ forma_pago: 'Tarjeta' }), ['forma_pago'])
    assert.deepEqual(bad({ nombres: 'x'.repeat(101) }), ['nombres'])
  })

  test('el consentimiento es obligatorio y solo vale `true` exacto (no "1", "true" ni 1)', () => {
    for (const accept of [false, undefined, 'true', '1', 1, null]) {
      const errors = validateValuation(normalizeValuation(good({ accept })), TODAY)
      assert.ok(errors.accept, String(accept))
    }
    assert.equal(validateValuation(normalizeValuation(good({ accept: true })), TODAY).accept, undefined)
  })

  test('normalize descarta campos desconocidos y recorta espacios', () => {
    const v = normalizeValuation({ ...good({ nombres: '  Ana  ' }), id_user: 999, state: 'x', _token: 'y' })
    assert.equal(v.nombres, 'Ana')
    assert.deepEqual(Object.keys(v).sort(), ['accept', 'apellidos', 'direccion', 'email', 'fecha_nacimiento', 'forma_pago', 'identificacion', 'name_surgery', 'nombres', 'telefono'])
  })
})

describe('buildCrmFields: contrato del CRM', () => {
  const fields = Object.fromEntries(buildCrmFields(normalizeValuation(good())))

  test('nombres de campo exactos, en el orden de la petición observada, sin _token ni _method', () => {
    assert.deepEqual(buildCrmFields(normalizeValuation(good())).map(([k]) => k), [
      'nombres', 'apellidos', 'identificacion', 'fecha_nacimiento', 'direccion', 'telefono', 'email', 'name_surgery', 'forma_pago', 'state', 'origen', 'id_user', 'id_line', 'id_user_asesora', 'accept'
    ])
    assert.equal('_token' in fields || '_method' in fields, false)
  })

  test('valores fijos: estado, origen e identificadores del CRM (73 / 16 / 73) y accept=1', () => {
    assert.equal(fields.state, 'No Contactada')
    assert.equal(fields.origen, 'Formulario Web')
    assert.deepEqual([fields.id_user, fields.id_line, fields.id_user_asesora], ['73', '16', '73'])
    assert.deepEqual(VALUATION_CRM_IDS, { id_user: '73', id_line: '16', id_user_asesora: '73' })
    assert.equal(fields.accept, '1')
  })

  test('mapeo: Ciudad → direccion; procedimiento → nombre visible; datos personales solo del formulario', () => {
    assert.equal(fields.direccion, 'Ciudad de Prueba')
    assert.equal(fields.name_surgery, 'Abdominoplastia')
    assert.equal(fields.nombres, 'Prueba')
    assert.equal(fields.identificacion, 'PRUEBA12345')
    assert.equal(fields.fecha_nacimiento, '1990-05-17')
  })

  test('forma de pago: Contado → contado, Financiación → financiacion (convención observada)', () => {
    assert.deepEqual(PAYMENT_OPTIONS.map(o => o.label), ['Contado', 'Financiación'])
    assert.equal(Object.fromEntries(buildCrmFields(normalizeValuation(good({ forma_pago: 'Contado' }))))['forma_pago'], 'contado')
    assert.equal(fields.forma_pago, 'financiacion')
  })

  test('sin consentimiento o con forma de pago inválida no se construye el payload', () => {
    assert.throws(() => buildCrmFields(normalizeValuation(good({ accept: false }))))
    assert.throws(() => buildCrmFields(normalizeValuation(good({ forma_pago: 'x' }))))
  })

  test('crmConfirmed: solo el texto de éxito del CRM cuenta (un 200 cualquiera o un error con message no)', () => {
    assert.equal(crmConfirmed({ mensagge: 'Los datos fueron registrados satisfactoriamente' }), true)
    assert.equal(crmConfirmed({ message: 'Los datos fueron registrados' }), true)
    for (const body of [null, 'ok', {}, { mensagge: '' }, { message: 'Error interno' }, { success: true }, []]) assert.equal(crmConfirmed(body), false, JSON.stringify(body))
  })
})

// ───────────────────────── Ruta de servidor (CRM falso) ─────────────────────────

const CRM_URL = 'https://crm.example.test/crm-public/api/clients/forms'
let handle, reset
let calls
let crmResponder
const logs = []

const event = (body, headers = { origin: 'https://planmed.test', host: 'planmed.test' }, ip = '10.0.0.1') => ({ method: 'POST', body, headers, ip })
const ok = () => new Response(JSON.stringify({ mensagge: 'Los datos fueron registrados satisfactoriamente' }), { status: 200, headers: { 'content-type': 'application/json' } })
const run = async (e) => { try { return { value: await handle(e) } } catch (error) { return { error } } }

before(async () => {
  const g = globalThis
  g.createError = makeError
  g.authError = (statusCode, message) => makeError({ statusCode, message })
  g.getRequestHeader = (e, name) => e.headers[name.toLowerCase()]
  g.setHeader = () => {}
  g.readBody = async e => e.body
  g.getRequestIP = e => e.ip
  g.useRuntimeConfig = () => ({ crmValuationUrl: CRM_URL })
  g.assertSameOrigin = (await import(pathToFileURL(resolve(ROOT, 'server/utils/origin.ts')).href)).assertSameOrigin
  const mod = await import(pathToFileURL(resolve(ROOT, 'server/utils/valuation.ts')).href)
  handle = mod.handleValuation
  reset = mod.resetValuationGuards
  for (const level of ['log', 'warn', 'error', 'info']) console[level] = (...a) => { logs.push(a.map(String).join(' ')) }
})

beforeEach(() => {
  reset()
  calls = []
  logs.length = 0
  crmResponder = async () => ok()
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    return crmResponder(url, options)
  }
})

describe('POST /api/forms/valuation', () => {
  test('envía UNA petición multipart al endpoint del CRM con los campos exactos y confirma solo con la respuesta del CRM', async () => {
    const { value, error } = await run(event(good()))
    assert.equal(error, undefined)
    assert.deepEqual(value, { ok: true })
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, CRM_URL)
    assert.equal(calls[0].options.method, 'POST')
    const form = calls[0].options.body
    assert.ok(form instanceof FormData)
    assert.deepEqual([...form.entries()], buildCrmFields(normalizeValuation(good())))
    // Sin Content-Type manual (fetch genera el boundary) y sin credenciales ni cookies.
    assert.deepEqual(Object.keys(calls[0].options.headers), ['Accept'])
    assert.equal('credentials' in calls[0].options, false)
    assert.ok(calls[0].options.signal instanceof AbortSignal)
  })

  test('payload inválido → 422 con errores por campo y el CRM NO se invoca', async () => {
    for (const body of [good({ email: 'x' }), good({ accept: false }), good({ nombres: '' }), {}, null, 'texto', good({ forma_pago: 'otra' })]) {
      calls.length = 0
      const { error } = await run(event(body))
      assert.equal(error?.statusCode, 422)
      assert.equal(error.data.reason, 'validation')
      assert.ok(Object.keys(error.data.errors).length)
      assert.equal(calls.length, 0)
    }
  })

  test('el servidor ignora valores del navegador para los campos fijos (estado, origen, ids)', async () => {
    await run(event({ ...good(), state: 'Contactada', origen: 'otro', id_user: 1, id_line: 2, id_user_asesora: 3, _token: 'x' }))
    const sent = Object.fromEntries(calls[0].options.body.entries())
    assert.deepEqual([sent.state, sent.origen, sent.id_user, sent.id_line, sent.id_user_asesora], ['No Contactada', 'Formulario Web', '73', '16', '73'])
    assert.equal('_token' in sent, false)
  })

  test('sin señal de mismo origen → 403 y el CRM no se invoca', async () => {
    for (const headers of [{ host: 'planmed.test' }, { origin: 'https://otro.test', host: 'planmed.test' }, { origin: 'null', host: 'planmed.test' }]) {
      const { error } = await run(event(good(), headers))
      assert.equal(error?.statusCode, 403)
    }
    assert.equal(calls.length, 0)
  })

  test('respuestas del CRM: 422 (campos conocidos), otros 4xx y 5xx → error, nunca éxito', async () => {
    crmResponder = async () => new Response(JSON.stringify({ errors: { email: ['El email ya existe'], desconocido: ['x'], telefono: 'inválido' } }), { status: 422 })
    let r = await run(event(good()))
    assert.equal(r.error.statusCode, 422)
    assert.equal(r.error.data.reason, 'crm_validation')
    assert.deepEqual(r.error.data.errors, { email: 'El email ya existe', telefono: 'inválido' })

    for (const status of [400, 401, 403, 404, 419, 500, 502, 503]) {
      reset()
      crmResponder = async () => new Response('{}', { status })
      r = await run(event(good()))
      assert.equal(r.value, undefined, String(status))
      assert.equal(r.error.statusCode, 502, String(status))
      assert.equal(r.error.data.reason, 'crm_error')
    }
  })

  test('un 200 sin la confirmación del CRM (vacío, no JSON, mensaje de error) NO es éxito y se marca como incierto', async () => {
    for (const make of [() => new Response('', { status: 200 }), () => new Response('<html>', { status: 200 }), () => new Response('{}', { status: 200 }), () => new Response(JSON.stringify({ message: 'Error interno' }), { status: 200 })]) {
      reset()
      crmResponder = async () => make()
      const r = await run(event(good()))
      assert.equal(r.value, undefined)
      assert.equal(r.error.statusCode, 502)
      assert.equal(r.error.data.reason, 'unconfirmed')
      assert.equal(r.error.data.uncertain, true)
    }
  })

  test('conectividad y timeout: 503 / 504 inciertos, sin reintentos automáticos', async () => {
    crmResponder = async () => { throw new TypeError('fetch failed') }
    let r = await run(event(good()))
    assert.equal(r.error.statusCode, 503)
    assert.deepEqual([r.error.data.reason, r.error.data.uncertain], ['network', true])
    assert.equal(calls.length, 1)

    reset(); calls.length = 0
    crmResponder = async () => { throw Object.assign(new Error('abort'), { name: 'AbortError' }) }
    r = await run(event(good()))
    assert.equal(r.error.statusCode, 504)
    assert.deepEqual([r.error.data.reason, r.error.data.uncertain], ['timeout', true])
    assert.equal(calls.length, 1, 'un timeout NO se reintenta: podría haber creado el registro')
  })

  test('el envío se aborta por timeout (señal) y una petición lenta no deja el bloqueo activo', async () => {
    crmResponder = async (_u, options) => new Promise((_res, rej) => options.signal.addEventListener('abort', () => rej(Object.assign(new Error('abort'), { name: 'AbortError' }))))
    const t0 = Date.now()
    const orig = globalThis.setTimeout
    globalThis.setTimeout = (fn, ms, ...a) => orig(fn, ms >= 10_000 ? 20 : ms, ...a) // acelera solo el timeout de 15 s
    try {
      const r = await run(event(good()))
      assert.equal(r.error.statusCode, 504)
    } finally { globalThis.setTimeout = orig }
    assert.ok(Date.now() - t0 < 2000)
  })

  test('doble envío: el segundo idéntico se rechaza (409) sin llamar al CRM, también si el primero sigue en curso', async () => {
    let release
    crmResponder = () => new Promise((res) => { release = () => res(ok()) })
    const first = run(event(good()))
    await new Promise(r => setImmediate(r))
    const second = await run(event(good()))
    assert.equal(second.error.statusCode, 409)
    assert.equal(second.error.data.reason, 'duplicate')
    release()
    assert.deepEqual((await first).value, { ok: true })
    const third = await run(event(good()))
    assert.equal(third.error.statusCode, 409)
    assert.equal(calls.length, 1)
    // Otra persona/solicitud distinta sí pasa.
    crmResponder = async () => ok()
    assert.deepEqual((await run(event(good({ identificacion: 'OTRA987654', telefono: '3111111111' })))).value, { ok: true })
  })

  test('tras un fallo del CRM el usuario SÍ puede reintentar (el bloqueo solo cubre registros confirmados o en curso)', async () => {
    crmResponder = async () => new Response('{}', { status: 500 })
    assert.equal((await run(event(good()))).error.statusCode, 502)
    crmResponder = async () => ok()
    assert.deepEqual((await run(event(good()))).value, { ok: true })
  })

  test('límite por IP: a partir del máximo → 429 sin llamar al CRM; otra IP no se ve afectada', async () => {
    for (let i = 0; i < 8; i++) await run(event(good({ identificacion: `ID${String(i).padStart(6, '0')}`, telefono: `30000000${i}0` }), undefined, '10.9.9.9'))
    const before = calls.length
    const r = await run(event(good({ identificacion: 'ZZZ999999' }), undefined, '10.9.9.9'))
    assert.equal(r.error.statusCode, 429)
    assert.equal(calls.length, before)
    assert.deepEqual((await run(event(good({ identificacion: 'YYY888888' }), undefined, '10.8.8.8'))).value, { ok: true })
  })

  test('los datos personales NUNCA aparecen en los logs (ni en éxito ni en cualquier fallo)', async () => {
    const secrets = ['Prueba', 'Ficticia', 'PRUEBA12345', '1990-05-17', 'Ciudad de Prueba', '3000000000', 'prueba.ficticia@example.com']
    const scenarios = [ok, () => new Response(JSON.stringify({ errors: { email: ['prueba.ficticia@example.com inválido'] } }), { status: 422 }), () => new Response('{}', { status: 500 }), () => new Response('{}', { status: 200 })]
    for (const make of scenarios) {
      reset()
      crmResponder = async () => make()
      await run(event(good()))
    }
    crmResponder = async () => { throw new TypeError('fetch failed') }
    reset(); await run(event(good()))
    const text = logs.join('\n')
    for (const s of secrets) assert.equal(text.includes(s), false, `el log contiene «${s}»`)
  })
})

// ───────────────────────── Servicio del navegador ─────────────────────────

describe('ValuationService', () => {
  const svc = (impl) => new ValuationService(async (url, options) => impl(url, options))
  const fail = (statusCode, data) => { throw Object.assign(new Error('x'), { statusCode, data: { data } }) }

  test('envía JSON a la ruta del servidor de Planmed (nunca al CRM) y confirma solo con { ok: true }', async () => {
    let seen
    await svc((url, options) => { seen = { url, options }; return { ok: true } }).submit(normalizeValuation(good()))
    assert.equal(seen.url, '/api/forms/valuation')
    assert.equal(seen.options.method, 'POST')
    assert.equal(/pdtclientsolutions|crm-public/.test(JSON.stringify(seen)), false)
    for (const res of [undefined, null, {}, { ok: false }, 'ok', { ok: 'true' }]) {
      await assert.rejects(() => svc(() => res).submit(normalizeValuation(good())), (e) => e instanceof ValuationError && e.uncertain === true, JSON.stringify(res))
    }
  })

  test('errores: 422 con campos, 409, 429, 503/504 inciertos, 502 y sin respuesta', async () => {
    const cases = [
      [422, { message: 'Revisa', errors: { email: 'Email inválido' } }, 'validation'],
      [409, { message: 'Ya recibimos tu solicitud.' }, 'duplicate'],
      [429, { message: 'Demasiados intentos' }, 'rate_limited'],
      [503, { message: 'Sin conexión', uncertain: true }, 'network'],
      [504, { uncertain: true }, 'network'],
      [502, { message: 'No pudimos registrar tus datos.' }, 'server'],
      [500, {}, 'server']
    ]
    for (const [status, data, kind] of cases) {
      await assert.rejects(() => svc(() => fail(status, data)).submit(normalizeValuation(good())), (e) => {
        assert.equal(e.kind, kind, String(status))
        assert.ok(e.message.length > 5)
        return true
      })
    }
    await assert.rejects(() => svc(() => fail(422, { errors: { email: 'Email inválido' } })).submit(normalizeValuation(good())), (e) => e.fields.email === 'Email inválido')
    await assert.rejects(() => svc(() => { throw new Error('offline') }).submit(normalizeValuation(good())), (e) => e.kind === 'network')
    await assert.rejects(() => svc(() => fail(502, { uncertain: true })).submit(normalizeValuation(good())), (e) => e.uncertain === true)
  })

  test('no reintenta: una sola llamada por envío aunque falle', async () => {
    let n = 0
    await assert.rejects(() => svc(() => { n++; fail(503, {}) }).submit(normalizeValuation(good())))
    assert.equal(n, 1)
  })
})

// ───────────────────────── Formulario (estático) ─────────────────────────

describe('ValuationRequest.vue', () => {
  const src = read('components/forms/ValuationRequest.vue')
  const code = src.replace(/<!--[\s\S]*?-->/g, '')

  test('conserva el diseño: mismos campos, botón flotante, modal y etiqueta «Ciudad»', () => {
    for (const label of ['Nombres', 'Apellidos', 'Número de cédula', 'Fecha de nacimiento', 'Ciudad', 'Teléfono', 'Email', '¿Qué cirugía se quiere realizar?', 'Forma de pago (contado/financiación)', 'Pide tu cita de valoración', 'Enviar']) {
      assert.ok(src.includes(label), label)
    }
    assert.match(src, /data-testid="valuation-fab"/)
  })

  test('el aviso «no funcional» y la maqueta ya no existen', () => {
    assert.equal(/valuation-not-functional|Solo informativo|aún no es funcional|SOLO MAQUETA/.test(src), false)
  })

  test('consentimiento: casilla desmarcada por defecto, obligatoria y con el PDF de la política del CRM', () => {
    assert.match(src, /https:\/\/pdtclientsolutions\.com\/crm-public\/Politica_Tratamiento_Personal\.pdf/)
    assert.match(src, /accept: false/)
    assert.match(src, /v-model="values\.accept" type="checkbox"/)
    assert.equal(/<input[^>]*type="checkbox"[^>]*checked/.test(src), false)
    assert.match(src, /target="_blank" rel="noopener noreferrer"/)
  })

  test('los procedimientos vienen de Hub (servicio público) y no hay lista estática de cirugías', () => {
    assert.match(src, /publicProcedureService\.getProcedures\(\)/)
    assert.match(src, /v-for="name in procedures"/)
    assert.equal(/abdominoplastia|mamoplastia|rinoplastia|liposucci|blefaroplastia/i.test(code), false)
  })

  test('envío: servicio del servidor, sin CRM directo, sin almacenamiento local y sin datos en logs', () => {
    assert.match(src, /valuationService\.submit\(payload\)/)
    assert.equal(/pdtclientsolutions\.com\/crm-public\/api|clients\/forms|id_user|id_line|fetch\(|\$fetch/.test(code), false, 'el navegador no conoce el endpoint del CRM ni sus ids')
    assert.equal(/localStorage|sessionStorage|indexedDB|document\.cookie|console\./.test(code), false)
  })

  test('estados: botón bloqueado al enviar, antidoble envío, éxito solo tras el servicio y datos conservados al fallar', () => {
    assert.match(src, /:disabled="status === 'submitting'"/)
    assert.match(src, /if \(status\.value === 'submitting'\) return/)
    const success = src.indexOf("status.value = 'success'")
    assert.ok(src.indexOf('await valuationService.submit(payload)') < success)
    // los valores solo se limpian DESPUÉS de la confirmación (dentro del try, tras submit), nunca en el catch
    const catchBlock = src.slice(src.indexOf('} catch (e) {'), src.indexOf('async function open()'))
    assert.equal(/Object\.assign\(values/.test(catchBlock), false)
  })
})

describe('configuración', () => {
  test('la URL del CRM de valoración es solo del servidor (runtimeConfig privado) y apunta a clients/forms, no al endpoint de PRP', () => {
    const cfg = read('nuxt.config.ts')
    assert.match(cfg, /crmValuationUrl: 'https:\/\/pdtclientsolutions\.com\/crm-public\/api\/clients\/forms'/)
    const publicBlock = cfg.slice(cfg.indexOf('public: {'), cfg.indexOf('typescript:'))
    assert.equal(/crmValuationUrl/.test(publicBlock), false)
    assert.equal(/forms-px-prp/.test(read('server/utils/valuation.ts')), false)
  })

  test('la ruta existe una sola vez, por POST, fuera de /api/public (que es solo lectura)', () => {
    assert.match(read('server/api/forms/valuation.post.ts'), /handleValuation\(event\)/)
  })
})

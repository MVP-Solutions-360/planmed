// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Formulario «Estudio de créditos» → correo: reglas compartidas, validación en el servidor, documentos, destinatarios por marca, configuración SMTP
// ausente, error del proveedor, envío exitoso y doble envío. Se ejecuta el código REAL del servidor con un transporte SMTP simulado: no se envía
// ningún correo, no hay red y no se llama a ningún CRM. Las direcciones, contraseñas y datos de este archivo son FICTICIOS.
import { test, describe, before, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT } from '../recommendations/harness.ts'

const fileUrl = rel => pathToFileURL(join(ROOT, rel)).href
const read = rel => readFileSync(join(ROOT, rel), 'utf8')
const SOCKET_IP = '203.0.113.9'
const SECRET = 'p4ss-w0rd-FICTICIA-no-real'

const CFG = {
  mailHost: 'smtp.example.test',
  mailPort: 465,
  mailUsername: 'sender@example.test',
  mailPassword: SECRET,
  mailFromAddress: '',
  mailFromName: 'Marca de prueba',
  creditStudyTo: 'destino@example.test',
  creditStudyCc: 'copia@example.test',
  trustedProxyHops: 0,
  public: { appName: 'Marca de prueba' }
}

const state = { cfg: {}, reads: 0, originChecks: 0, sent: [], closed: 0, sendImpl: null, factoryCalls: 0, logs: [] }
let dir, mod, mail, S, svc, realError

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'credit-study-'))
  realError = console.error
  console.error = (...a) => { state.logs.push(a.map(String).join(' ')) }
  const g = globalThis
  g.createError = o => Object.assign(new Error(o.message ?? 'error'), o)
  g.useRuntimeConfig = () => state.cfg
  g.setHeader = () => {}
  g.assertSameOrigin = () => { state.originChecks++ }
  g.getRequestIP = e => e.ip
  g.getRequestHeader = (e, name) => e.headers?.[name.toLowerCase()]
  g.readMultipartFormData = async e => { state.reads++; if (e.partsError) throw new Error('multipart roto'); return e.parts }

  const base = fileUrl('shared/utils')
  const src = read('server/utils/creditStudy.ts').replace(/'#shared\/utils\/([A-Za-z]+)'/g, (_, m) => `'${base}/${m}.ts'`).replace("'./formMail'", "'./formMail.ts'")
  writeFileSync(join(dir, 'creditStudy.ts'), src)
  // Núcleo de correo compartido (transporte, configuración, guardas, plantilla): el manejador lo importa con ruta relativa.
  writeFileSync(join(dir, 'formMail.ts'), read('server/utils/formMail.ts').replace(/'#shared\/utils\/([A-Za-z]+)'/g, (_, m) => `'${base}/${m}.ts'`))
  mod = await import(pathToFileURL(join(dir, 'creditStudy.ts')).href)
  mail = await import(pathToFileURL(join(dir, 'formMail.ts')).href)
  S = await import(fileUrl('shared/utils/creditStudy.ts'))
  const svcSrc = read('services/CreditStudyService.ts').replace(/'#shared\/utils\/([A-Za-z]+)'/g, (_, m) => `'${base}/${m}.ts'`)
  writeFileSync(join(dir, 'CreditStudyService.ts'), svcSrc)
  svc = await import(pathToFileURL(join(dir, 'CreditStudyService.ts')).href)
})

beforeEach(() => {
  state.cfg = { ...CFG }
  state.reads = 0
  state.originChecks = 0
  state.sent = []
  state.closed = 0
  state.factoryCalls = 0
  state.logs = []
  state.sendImpl = async () => ({ accepted: ['destino@example.test', 'copia@example.test'], rejected: [] })
  mod.resetCreditStudyGuards()
  mod.setCreditStudyTransportFactory(async (cfg) => {
    state.factoryCalls++
    return { sendMail: async (msg) => { state.sent.push({ cfg, msg }); return state.sendImpl(msg) }, close: () => { state.closed++ } }
  })
})

after(() => {
  console.error = realError
  mod.setCreditStudyTransportFactory()
  rmSync(dir, { recursive: true, force: true })
})

// ── Datos de prueba ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

const PDF = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(300, 1)])
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(300, 2)])
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(300, 3)])
const GIF = Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(300, 4)])
const EXE = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(300, 5)])
const HTML = Buffer.from('<html><script>alert(1)</script></html>')

/** Valores válidos para TODOS los campos de texto, tomados de la definición compartida (estado civil soltero, empleado, vivienda propia). */
function validRaw(over = {}) {
  const raw = {}
  for (const fd of S.CREDIT_FIELDS) {
    if (fd.type === 'file' || fd.sum || fd.type === 'checkbox') continue
    if (fd.type === 'select') raw[fd.id] = fd.options[0]
    else if (fd.type === 'tel') raw[fd.id] = '3001234567'
    else if (fd.type === 'email') raw[fd.id] = 'ana.prueba@example.com'
    else if (fd.type === 'number') raw[fd.id] = '1500'
    else if (fd.type === 'date') raw[fd.id] = '1990-05-10'
    else raw[fd.id] = 'Texto de prueba'
  }
  raw['primer-nombre'] = 'Ana'
  raw['primer-apellido'] = 'Prueba'
  raw['proc-Rinoplastia'] = 'true'
  return { ...raw, ...over }
}
const part = (name, value) => ({ name, data: Buffer.from(String(value), 'utf8') })
const filePart = (name, bytes, filename = 'documento.pdf') => ({ name, filename, type: 'application/pdf', data: Buffer.from(bytes) })
const DOCS = () => [filePart('archivo-carta-laboral', PDF, '../../etc/passwd.pdf'), filePart('archivo-colillas', PNG, 'colillas.png'), filePart('archivo-extractos', JPG, 'extractos.jpg')]
const partsOf = (raw, docs = DOCS()) => [...Object.entries(raw).map(([k, v]) => part(k, v)), ...docs]

const event = (over = {}) => ({
  method: 'POST',
  ip: SOCKET_IP,
  parts: partsOf(validRaw()),
  ...over,
  headers: { 'content-length': '6000', 'content-type': 'multipart/form-data; boundary=x', ...(over.headers ?? {}) }
})
const run = async (fn, e) => { try { return { value: await fn(e) } } catch (error) { return { error } } }
const submit = (over = {}) => run(mod.handleCreditStudy, event(over))
const logged = () => state.logs.join('\n')

// ── Definición compartida ────────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('Definición compartida del formulario', () => {
  test('conserva los 6 pasos, etiquetas y los 4 documentos del formulario', () => {
    assert.deepEqual(S.CREDIT_STEPS.map(s => s.key), ['personal', 'conyuge', 'actividad', 'referencias', 'ingresos', 'activos'])
    assert.deepEqual(S.CREDIT_STEPS.map(s => s.label), ['Información personal', 'Información del cónyuge', 'Actividad económica y localización cliente', 'Referencias', 'Relación de ingresos y egresos', 'Relación de activos'])
    const files = S.CREDIT_FIELDS.filter(f => f.type === 'file')
    assert.deepEqual(files.map(f => [f.id, f.label]), [['archivo-carta-laboral', 'Carta laboral'], ['archivo-colillas', 'Colillas de pago'], ['archivo-rut', 'RUT'], ['archivo-extractos', 'Extractos bancarios']])
    assert.equal(new Set(S.CREDIT_FIELDS.map(f => f.id)).size, S.CREDIT_FIELDS.length, 'ids únicos')
  })

  test('detectFileKind reconoce PDF, PNG y JPEG por su firma y rechaza el resto', () => {
    assert.equal(S.detectFileKind(PDF), 'pdf')
    assert.equal(S.detectFileKind(PNG), 'png')
    assert.equal(S.detectFileKind(JPG), 'jpeg')
    for (const bad of [GIF, EXE, HTML, Buffer.alloc(0), Buffer.from('%PDF'), Buffer.from([0xff, 0xd8])]) assert.equal(S.detectFileKind(bad), null)
  })
})

describe('Validación de campos (reglas compartidas)', () => {
  const v = (over = {}, files = { 'archivo-carta-laboral': { size: 100 }, 'archivo-colillas': { size: 100 }, 'archivo-extractos': { size: 100 } }) =>
    S.validateCreditStudy(S.normalizeCreditValues(validRaw(over)), files)

  test('una solicitud completa no tiene errores', () => assert.deepEqual(v(), {}))

  test('los campos obligatorios vacíos se marcan, y los opcionales no', () => {
    const e = v({ 'primer-nombre': '', 'primer-apellido': '  ', 'segundo-nombre': '', 'email': '' })
    assert.ok(e['primer-nombre'] && e['primer-apellido'] && e.email)
    assert.equal(e['segundo-nombre'], undefined)
  })

  test('correo, teléfonos, números y fechas inválidos', () => {
    const e = v({ email: 'no-es-correo', celular: '12', 'tel-residencia': 'abc', 'peso': '-3', 'fecha-nacimiento': '2999-01-01', 'fecha-expedicion': '1990-02-31', 'valor-cotizado': '12.3.4' })
    for (const id of ['email', 'celular', 'tel-residencia', 'peso', 'fecha-nacimiento', 'fecha-expedicion', 'valor-cotizado']) assert.ok(e[id], id)
  })

  test('una lista solo acepta sus opciones; el texto largo se rechaza', () => {
    const e = v({ sexo: 'Otro valor', profesion: 'x'.repeat(201) })
    assert.ok(e.sexo && e.profesion)
  })

  test('el arrendador solo es obligatorio si la vivienda es arrendada', () => {
    assert.equal(v({ 'tipo-vivienda': 'Propia', 'nombre-arrendador': '', 'telefono-arrendador': '' })['nombre-arrendador'], undefined)
    const e = v({ 'tipo-vivienda': 'Arrendada', 'nombre-arrendador': '', 'telefono-arrendador': '' })
    assert.ok(e['nombre-arrendador'] && e['telefono-arrendador'])
  })

  test('el cónyuge solo se exige (y se acepta) si el estado civil es casado o unión libre', () => {
    const raw = validRaw({ 'estado-civil': 'Soltero(a)', 'cy-primer-nombre': 'Dato ignorado' })
    assert.equal(S.normalizeCreditValues(raw)['cy-primer-nombre'], '', 'se descarta lo deshabilitado')
    const e = v({ 'estado-civil': 'Casado(a)', 'cy-primer-nombre': '' })
    assert.ok(e['cy-primer-nombre'])
  })

  test('inmueble y vehículo son opcionales como bloque, pero si se diligencia algo exigen su tipo', () => {
    const empty = { 'br-tipo': '', 'br-direccion': '', 'br-barrio': '', 'br-ciudad': '', 'br-valor': '', 'br-hipoteca': '', 'br-afectacion': '', 've-tipo': '', 've-placa': '', 've-transito': '', 've-marca': '', 've-modelo': '', 've-valor': '', 've-prenda': '', 've-otro': '' }
    assert.deepEqual(v(empty), {})
    const e = v({ ...empty, 've-placa': 'ABC123' })
    assert.ok(e['ve-tipo'])
    assert.equal(e['br-tipo'], undefined)
  })

  test('los documentos que se exigen dependen del tipo de actividad', () => {
    const none = {}
    assert.deepEqual(Object.keys(v({ 'tipo-actividad': 'Empleado' }, none)).sort(), ['archivo-carta-laboral', 'archivo-colillas', 'archivo-extractos'])
    assert.deepEqual(Object.keys(v({ 'tipo-actividad': 'Independiente' }, none)).sort(), ['archivo-extractos', 'archivo-rut'])
    assert.deepEqual(Object.keys(v({ 'tipo-actividad': 'Otro' }, none)).sort(), ['archivo-extractos'])
  })

  test('tamaños: archivo vacío y sobre el máximo por archivo (el tope total no es alcanzable con 3 documentos)', () => {
    const MB = 1024 * 1024
    const e = v({ 'tipo-actividad': 'Independiente' }, { 'archivo-rut': { size: 0 }, 'archivo-extractos': { size: 5 * MB + 1 } })
    assert.ok(e['archivo-rut'] && e['archivo-extractos'])
    assert.equal(v({ 'tipo-actividad': 'Independiente' }, { 'archivo-rut': { size: 5 * MB }, 'archivo-extractos': { size: 5 * MB } }).archivos, undefined)
    // Con los documentos que corresponden a cada actividad el total nunca supera 3 × 5 MB = 15 MB; el tope total es una red de seguridad.
    // Se comprueba el cálculo con una definición de actividad que muestra más de tres documentos (no existe hoy): el RUT de un empleado no suma.
    const big = S.validateCreditStudy(S.normalizeCreditValues(validRaw()), { 'archivo-carta-laboral': { size: 4.5 * MB }, 'archivo-colillas': { size: 4.5 * MB }, 'archivo-extractos': { size: 4.5 * MB }, 'archivo-rut': { size: 4.5 * MB } })
    assert.equal(big.archivos, undefined, 'el RUT no aplica a un empleado y no suma: 3 × 4,5 MB < 15 MB')
  })
})

// ── Configuración y destinatarios ────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('Configuración SMTP y destinatarios', () => {
  test('sin configuración de correo: 503 not_configured, sin leer el cuerpo, sin transporte y sin consumir el límite', async () => {
    state.cfg = { ...CFG, mailHost: '', mailPassword: '' }
    for (let i = 0; i < 8; i++) {
      const r = await submit()
      assert.equal(r.error.statusCode, 503)
      assert.equal(r.error.data.reason, 'not_configured')
    }
    assert.equal(state.reads, 0)
    assert.equal(state.factoryCalls, 0)
    state.cfg = { ...CFG }
    assert.equal((await submit()).value.ok, true, 'el límite por IP no se consumió con la configuración ausente')
    assert.match(logged(), /NUXT_MAIL_HOST/)
    assert.doesNotMatch(logged(), new RegExp(SECRET))
  })

  test('sin destinatarios (Para) el envío queda bloqueado', async () => {
    state.cfg = { ...CFG, creditStudyTo: '' }
    const r = await submit()
    assert.equal(r.error.data.reason, 'not_configured')
    assert.equal(state.factoryCalls, 0)
    assert.match(logged(), /NUXT_CREDIT_STUDY_TO/)
  })

  test('resolveMailConfig: valida puerto, direcciones y remitente, y nunca devuelve valores en los errores', () => {
    const bad = mail.resolveMailConfig({ ...CFG, mailPort: 'abc', creditStudyTo: 'no-es-correo', creditStudyCc: 'a@b.cc, malo', mailUsername: 'no-correo', mailFromAddress: '' })
    assert.equal(bad.ok, false)
    assert.deepEqual(bad.invalid.sort(), ['NUXT_CREDIT_STUDY_CC', 'NUXT_CREDIT_STUDY_TO', 'NUXT_MAIL_FROM_ADDRESS', 'NUXT_MAIL_PORT'].sort())
    assert.ok(!JSON.stringify(bad).includes(SECRET))
    const ok = mail.resolveMailConfig({ ...CFG, mailPort: '587', creditStudyTo: 'A@x.co; b@x.co', creditStudyCc: '' })
    assert.equal(ok.ok, true)
    assert.deepEqual(ok.config.to, ['a@x.co', 'b@x.co'])
    assert.deepEqual(ok.config.cc, [])
    assert.equal(ok.config.fromAddress, 'sender@example.test', 'el usuario SMTP es el remitente si es un correo y no hay otro')
    assert.equal(mail.resolveMailConfig({ ...CFG, creditStudyTo: 'a@x.co,b@x.co,c@x.co,d@x.co,e@x.co,f@x.co' }).ok, false, 'máximo 5 destinatarios')
  })

  test('los destinatarios salen SOLO de la configuración del servidor, nunca del navegador', async () => {
    const evil = [...partsOf(validRaw()), part('to', 'atacante@evil.test'), part('cc', 'atacante@evil.test'), part('bcc', 'atacante@evil.test'), part('email', 'ana.prueba@example.com')]
    // `email` está repetido a propósito arriba: se rechaza por mal formado; sin repetirlo, los campos to/cc/bcc se ignoran.
    assert.equal((await submit({ parts: evil })).error.statusCode, 400)
    const r = await submit({ parts: [...partsOf(validRaw()), part('to', 'atacante@evil.test'), part('cc', 'atacante@evil.test'), part('bcc', 'atacante@evil.test')] })
    assert.equal(r.value.ok, true)
    const { msg } = state.sent[0]
    assert.deepEqual(msg.to, ['destino@example.test'])
    assert.deepEqual(msg.cc, ['copia@example.test'])
    assert.equal(msg.bcc, undefined)
    assert.ok(!JSON.stringify(msg).includes('atacante@evil.test'))
  })

  test('Planmed: sin destinatarios por defecto; el envío queda bloqueado hasta que el negocio defina los autorizados', async () => {
    const cfg = read('nuxt.config.ts')
    assert.match(cfg, /^    creditStudyTo: '',$/m)
    assert.match(cfg, /^    creditStudyCc: '',$/m)
    assert.doesNotMatch(cfg, /disenadoraplanmed|convenioscrediestetica/i, 'no se reutilizan los destinatarios de otra marca')
    assert.doesNotMatch(cfg, /public: \{[^}]*creditStudy/s, 'los destinatarios no están en `public`')
    // Con la configuración real del proyecto (sin destinatarios) el manejador responde 503 y no llega al transporte.
    state.cfg = { ...CFG, creditStudyTo: '', creditStudyCc: '' }
    const r = await submit()
    assert.equal(r.error.statusCode, 503)
    assert.equal(r.error.data.reason, 'not_configured')
    assert.equal(state.factoryCalls, 0)
    assert.equal(mail.resolveMailConfig({ ...CFG, creditStudyTo: '', creditStudyCc: '' }).ok, false)
  })
})

// ── Envío ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('Envío del correo', () => {
  test('éxito: el servidor SMTP acepta el mensaje, con remitente, asunto y adjuntos seguros', async () => {
    const r = await submit()
    assert.deepEqual(r.value, { ok: true })
    assert.equal(state.originChecks, 1)
    assert.equal(state.sent.length, 1)
    const { cfg, msg } = state.sent[0]
    assert.equal(cfg.port, 465)
    assert.deepEqual(msg.from, { name: 'Marca de prueba', address: 'sender@example.test' })
    assert.equal(msg.subject, '[Marca de prueba] Nueva solicitud de estudio de crédito')
    assert.equal(msg.replyTo, 'ana.prueba@example.com')
    assert.deepEqual(msg.attachments.map(a => a.filename), ['01-carta-laboral.pdf', '02-colillas.png', '03-extractos.jpg'], 'nombres generados por el servidor')
    assert.deepEqual(msg.attachments.map(a => a.contentType), ['application/pdf', 'image/png', 'image/jpeg'])
    assert.ok(Buffer.from(msg.attachments[0].content).equals(PDF), 'el adjunto es el documento recibido')
    assert.ok(!JSON.stringify(msg.attachments.map(a => a.filename)).includes('passwd'), 'no se usa el nombre original')
    assert.equal(state.closed, 1)
  })

  test('el correo incluye marca, fecha de recepción, datos, procedimientos, totales y lista de documentos, y escapa el HTML', async () => {
    const r = await submit({ parts: partsOf(validRaw({ 'primer-nombre': '<script>alert("x")</script>', 'ing-salario': '2000000', 'ing-comisiones': '500000', 'ing-arrendamientos': '', 'ing-otros': '', 'egr-vivienda': '300000', 'egr-vehiculo': '', 'egr-tarjeta': '', 'egr-arriendo': '', 'egr-gastos': '' })) })
    assert.equal(r.value.ok, true)
    const { msg } = state.sent[0]
    assert.match(msg.text, /Marca de prueba — Solicitud de estudio de crédito/)
    assert.match(msg.text, /Recibida: /)
    assert.match(msg.text, /Procedimientos: Rinoplastia/)
    assert.match(msg.text, /Total ingresos: \$ 2\.500\.000/)
    assert.match(msg.text, /Total: \$ 300\.000/)
    assert.match(msg.text, /Carta laboral: 01-carta-laboral\.pdf/)
    assert.doesNotMatch(msg.html, /<script>/)
    assert.match(msg.html, /&lt;script&gt;/)
    assert.doesNotMatch(msg.text + msg.html, new RegExp(SECRET))
  })

  test('los campos ocultos o deshabilitados no se incluyen en el correo', async () => {
    const r = await submit({ parts: partsOf(validRaw({ 'estado-civil': 'Soltero(a)', 'cy-primer-nombre': 'CONYUGE-SECRETO' })) })
    assert.equal(r.value.ok, true)
    assert.ok(!state.sent[0].msg.text.includes('CONYUGE-SECRETO'))
  })

  test('un documento que no corresponde al tipo de actividad se ignora (no se adjunta)', async () => {
    const r = await submit({ parts: partsOf(validRaw(), [...DOCS(), filePart('archivo-rut', PDF, 'rut.pdf')]) })
    assert.equal(r.value.ok, true)
    assert.equal(state.sent[0].msg.attachments.length, 3)
  })

  test('error del proveedor SMTP: 502 genérico, sin exponer el mensaje interno ni registrar datos personales', async () => {
    state.sendImpl = async () => { throw Object.assign(new Error('535 5.7.8 usuario sender@example.test contraseña incorrecta ' + SECRET), { code: 'EAUTH' }) }
    const r = await submit()
    assert.equal(r.error.statusCode, 502)
    assert.equal(r.error.data.reason, 'smtp_error')
    assert.doesNotMatch(r.error.message, /535|sender@|contraseña|EAUTH/)
    assert.doesNotMatch(JSON.stringify(r.error.data), /535|sender@|EAUTH/)
    const log = logged()
    assert.match(log, /EAUTH/)
    assert.doesNotMatch(log, /Ana|Prueba|535|sender@|ana\.prueba|3001234567/)
    assert.doesNotMatch(log, new RegExp(SECRET))
    assert.equal(state.closed, 1, 'el transporte se cierra también tras un error')
  })

  test('sin conexión con el servidor SMTP: 503 smtp_unreachable', async () => {
    state.sendImpl = async () => { throw Object.assign(new Error('connect ECONNREFUSED 10.0.0.1:465'), { code: 'ECONNREFUSED' }) }
    const r = await submit()
    assert.equal(r.error.statusCode, 503)
    assert.equal(r.error.data.reason, 'smtp_unreachable')
    assert.doesNotMatch(r.error.message, /10\.0\.0\.1|ECONNREFUSED/)
  })

  test('un destinatario rechazado por el proveedor no cuenta como envío', async () => {
    state.sendImpl = async () => ({ accepted: ['destino@example.test'], rejected: ['copia@example.test'] })
    const r = await submit()
    assert.equal(r.error.statusCode, 502)
    assert.equal(r.error.data.reason, 'smtp_rejected')
  })

  test('tras un error del proveedor el mismo envío se puede reintentar (no quedó registrado como recibido)', async () => {
    state.sendImpl = async () => { throw Object.assign(new Error('x'), { code: 'ETIMEDOUT' }) }
    assert.equal((await submit()).error.statusCode, 503)
    state.sendImpl = async () => ({ accepted: ['destino@example.test', 'copia@example.test'], rejected: [] })
    assert.equal((await submit()).value.ok, true)
    assert.equal(state.sent.length, 2)
  })
})

describe('Doble envío', () => {
  test('el mismo contenido enviado dos veces seguidas genera un solo correo (409 duplicate)', async () => {
    assert.equal((await submit()).value.ok, true)
    const second = await submit()
    assert.equal(second.error.statusCode, 409)
    assert.equal(second.error.data.reason, 'duplicate')
    assert.equal(state.sent.length, 1)
  })

  test('dos envíos simultáneos del mismo contenido (doble clic) generan un solo correo', async () => {
    let release
    state.sendImpl = () => new Promise((res) => { release = () => res({ accepted: ['destino@example.test', 'copia@example.test'], rejected: [] }) })
    const first = submit()
    await new Promise(r => setTimeout(r, 20))
    const second = await submit()
    assert.equal(second.error.statusCode, 409)
    release()
    assert.equal((await first).value.ok, true)
    assert.equal(state.sent.length, 1)
  })

  test('un contenido distinto (otro documento) no se considera duplicado', async () => {
    assert.equal((await submit()).value.ok, true)
    const other = [filePart('archivo-carta-laboral', Buffer.concat([PDF, Buffer.from('otro')])), filePart('archivo-colillas', PNG), filePart('archivo-extractos', JPG)]
    assert.equal((await submit({ parts: partsOf(validRaw(), other) })).value.ok, true)
  })
})

// ── Validación en el servidor ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('Validación y documentos en el servidor', () => {
  test('un envío válido pasa; los campos obligatorios ausentes devuelven 422 con el campo, sin llegar al transporte', async () => {
    const raw = validRaw()
    delete raw['primer-nombre']
    raw.email = 'no-es-correo'
    const r = await submit({ parts: partsOf(raw) })
    assert.equal(r.error.statusCode, 422)
    assert.equal(r.error.data.reason, 'validation')
    assert.ok(r.error.data.errors['primer-nombre'] && r.error.data.errors.email)
    assert.equal(state.factoryCalls, 0)
  })

  test('faltan documentos obligatorios', async () => {
    const r = await submit({ parts: partsOf(validRaw(), [filePart('archivo-extractos', JPG)]) })
    assert.equal(r.error.statusCode, 422)
    assert.ok(r.error.data.errors['archivo-carta-laboral'] && r.error.data.errors['archivo-colillas'])
  })

  test('el tipo REAL manda: un ejecutable, un GIF o un HTML con extensión y tipo de PDF se rechazan', async () => {
    for (const bad of [EXE, GIF, HTML]) {
      const docs = [{ ...filePart('archivo-carta-laboral', bad, 'carta.pdf'), type: 'application/pdf' }, filePart('archivo-colillas', PNG), filePart('archivo-extractos', JPG)]
      const r = await submit({ parts: partsOf(validRaw(), docs) })
      assert.equal(r.error.statusCode, 422)
      assert.match(r.error.data.errors['archivo-carta-laboral'], /Formato no permitido/)
    }
    assert.equal(state.factoryCalls, 0)
  })

  test('un PDF/PNG/JPEG válido se acepta aunque su nombre y tipo declarado no coincidan', async () => {
    const docs = [filePart('archivo-carta-laboral', PNG, 'carta.exe'), filePart('archivo-colillas', JPG, 'x'), filePart('archivo-extractos', PDF, 'extractos.txt')]
    assert.equal((await submit({ parts: partsOf(validRaw(), docs) })).value.ok, true)
    assert.deepEqual(state.sent[0].msg.attachments.map(a => a.filename), ['01-carta-laboral.png', '02-colillas.jpg', '03-extractos.pdf'])
  })

  test('archivo vacío y archivo mayor al máximo por documento', async () => {
    const big = Buffer.concat([PDF, Buffer.alloc(5 * 1024 * 1024)])
    const docs = [filePart('archivo-carta-laboral', Buffer.alloc(0)), filePart('archivo-colillas', big), filePart('archivo-extractos', JPG)]
    const r = await submit({ parts: partsOf(validRaw(), docs) })
    assert.equal(r.error.statusCode, 422)
    assert.match(r.error.data.errors['archivo-carta-laboral'], /vacío/)
    assert.match(r.error.data.errors['archivo-colillas'], /supera/)
  })

  test('petición demasiado grande (413), sin tamaño declarado (411), que no es multipart (415) o ilegible (400): ninguna llega al correo', async () => {
    const big = await submit({ headers: { 'content-length': String(S.CREDIT_LIMITS.maxRequestBytes + 1) } })
    assert.equal(big.error.statusCode, 413)
    assert.equal(state.reads, 0, 'el cuerpo no se lee si el tamaño declarado ya excede el límite')
    assert.equal((await submit({ headers: { 'content-length': '' } })).error.statusCode, 411)
    assert.equal((await submit({ headers: { 'content-type': 'application/json' } })).error.statusCode, 415)
    assert.equal((await submit({ partsError: true })).error.statusCode, 400)
    assert.equal((await submit({ parts: [] })).error.statusCode, 400)
    assert.equal(state.factoryCalls, 0)
  })

  test('campos repetidos o texto desmesurado se rechazan', async () => {
    assert.equal((await submit({ parts: [...partsOf(validRaw()), part('celular', '3001234567')] })).error.statusCode, 400)
    const r = await submit({ parts: partsOf(validRaw({ profesion: 'x'.repeat(5000) })) })
    assert.equal(r.error.statusCode, 422)
    assert.ok(r.error.data.errors.profesion)
  })

  test('límite de frecuencia por IP: tras 5 intentos responde 429; X-Forwarded-For se ignora con 0 proxies de confianza', async () => {
    for (let i = 0; i < 5; i++) assert.equal((await submit({ parts: [] })).error.statusCode, 400)
    assert.equal((await submit({ headers: { 'x-forwarded-for': '198.51.100.7' } })).error.statusCode, 429)
    assert.equal((await submit({ parts: [], ip: '203.0.113.200' })).error.statusCode, 400, 'otra IP tiene su propia ventana')
  })
})

// ── Cliente (servicio y formulario) ──────────────────────────────────────────────────────────────────────────────────────────────────────

describe('Servicio del navegador', () => {
  const values = () => S.normalizeCreditValues(validRaw({ 'estado-civil': 'Soltero(a)', 'cy-primer-nombre': 'X' }))

  test('envía multipart con los campos visibles y habilitados y solo los documentos que corresponden', () => {
    const files = { 'archivo-carta-laboral': new Blob([PDF]), 'archivo-colillas': new Blob([PNG]), 'archivo-extractos': new Blob([JPG]), 'archivo-rut': new Blob([PDF]) }
    const fd = svc.buildCreditStudyFormData(values(), files)
    const names = [...fd.keys()]
    assert.ok(names.includes('primer-nombre') && names.includes('archivo-carta-laboral') && names.includes('proc-Rinoplastia'))
    assert.ok(!names.includes('archivo-rut'), 'el RUT no aplica a un empleado')
    assert.ok(!names.includes('cy-primer-nombre'), 'el cónyuge está deshabilitado')
    assert.ok(!names.includes('ing-total'), 'los totales calculados no se envían')
    assert.ok(!names.some(n => /^(to|cc|bcc|destinatario)/.test(n)), 'el navegador no envía destinatarios')
  })

  test('éxito solo si el servidor responde ok: true; los errores se traducen sin exponer detalles', async () => {
    const s = new svc.CreditStudyService(async () => ({ ok: true }))
    await s.submit(values(), {})
    await assert.rejects(new svc.CreditStudyService(async () => ({})).submit(values(), {}), e => e.kind === 'server')
    const mk = (statusCode, data) => new svc.CreditStudyService(async () => { throw { statusCode, data: { data } } })
    await assert.rejects(mk(422, { errors: { email: 'mal' } }).submit(values(), {}), e => e.kind === 'validation' && e.fields.email === 'mal')
    await assert.rejects(mk(409, {}).submit(values(), {}), e => e.kind === 'duplicate')
    await assert.rejects(mk(429, {}).submit(values(), {}), e => e.kind === 'rate_limited')
    await assert.rejects(mk(413, {}).submit(values(), {}), e => e.kind === 'too_large')
    await assert.rejects(mk(503, {}).submit(values(), {}), e => e.kind === 'unavailable')
    await assert.rejects(mk(502, {}).submit(values(), {}), e => e.kind === 'server')
  })
})

describe('Formulario y archivos del proyecto', () => {
  const form = read('components/credit/CreditStudyForm.vue')
  const serverSrc = read('server/utils/creditStudy.ts')
  const sharedSrc = read('shared/utils/creditStudy.ts')
  const serviceSrc = read('services/CreditStudyService.ts')

  test('el formulario ya es funcional: usa el servicio, controla el doble envío y conserva los datos si falla', () => {
    assert.match(form, /creditStudyService\.submit\(payload, files\)/)
    assert.match(form, /if \(status\.value === 'submitting'\) return/)
    assert.match(form, /:disabled="status === 'submitting'"/)
    assert.doesNotMatch(form, /aún no es funcional|credit-form-not-functional|en maquetación/i)
    assert.match(form, /<input[^>]*:name="fd\.id"[^>]*type="file"/)
    assert.match(form, /@change="onFile\(fd\.id, \$event\)"/)
    // Los datos solo se descartan tras la confirmación del servidor (después del await, no antes).
    assert.ok(form.indexOf('await creditStudyService.submit') < form.indexOf('Object.assign(values, emptyValues())'))
  })

  test('no se guarda nada en el navegador ni se escribe a disco en el servidor', () => {
    for (const src of [form, serviceSrc]) assert.doesNotMatch(src, /localStorage|sessionStorage|indexedDB/)
    assert.doesNotMatch(serverSrc, /writeFile|createWriteStream|mkdtemp|tmpdir|node:fs/)
  })

  test('sin console.log y sin ninguna referencia al CRM en el código nuevo', () => {
    for (const src of [form, serverSrc, sharedSrc, serviceSrc, read('server/api/forms/credit-study.post.ts')]) {
      assert.doesNotMatch(src, /console\.log/)
      assert.doesNotMatch(src, /pdtclientsolutions|form\/credit|crm-public|id_credit|id_line|(?<![$.\w])fetch\(/)
    }
  })

  test('la ruta delega en el manejador y las variables de correo están documentadas sin valores secretos', () => {
    assert.match(read('server/api/forms/credit-study.post.ts'), /handleCreditStudy\(event\)/)
    for (const f of ['.env.example']) {
      const env = read(f)
      for (const k of ['NUXT_MAIL_HOST', 'NUXT_MAIL_PORT', 'NUXT_MAIL_USERNAME', 'NUXT_MAIL_PASSWORD', 'NUXT_MAIL_FROM_ADDRESS', 'NUXT_CREDIT_STUDY_TO', 'NUXT_CREDIT_STUDY_CC']) assert.match(env, new RegExp(`^${k}=$`, 'm'), `${f}: ${k} sin valor`)
    }
    const cfg = read('nuxt.config.ts')
    for (const k of ['mailHost', 'mailPassword', 'mailUsername']) assert.match(cfg, new RegExp(`^    ${k}: '',$`, 'm'))
  })
})

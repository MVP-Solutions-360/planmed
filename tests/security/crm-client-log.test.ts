// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Traza segura de las peticiones al CRM (server/utils/crmClient.ts). Se ejecuta el código REAL contra un servidor SIMULADO en 127.0.0.1; las respuestas son
// INVENTADAS. Un guardián en `fetch` rechaza cualquier destino que no sea ese servidor: ninguna prueba puede salir a la red. Datos FICTICIOS.
import { test, describe, before, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT } from '../recommendations/harness.ts'

const fileUrl = rel => pathToFileURL(join(ROOT, rel)).href
const read = rel => readFileSync(join(ROOT, rel), 'utf8')

const VALUE = {
  nombres: 'Zoraida', apellidos: 'Ficticia Quimbayo', identificacion: 'PRUEBA90817263', fecha_nacimiento: '1987-03-21', direccion: 'Medellín',
  telefono: '3009998877', email: 'zoraida@correo.test', name_surgery: 'Blefaroplastia', forma_pago: 'Financiación', accept: true
}
const IDS = { userId: 911, lineId: 922, advisorId: 933 } // ficticios
const OK_BODY = { mensagge: 'Los datos fueron registrados satisfactoriamente' }
const TOKEN = 'tokenFicticio0123456789abcdefghijklmnop'
const FORM_PATH = '/crm/forms/911/922'
const SUBMIT_PATH = '/crm/api/clients/forms'
// Cualquiera de estos textos en un log sería una fuga.
const SECRETS = /Zoraida|Ficticia|Quimbayo|3009998877|90817263|Medell|Blefaro|1987-03|correo\.test|registrados|VALOR-SECRETO|token-ficticio|tokenFicticio|sesionFicticia|laravel_session|127\.0\.0\.1|crm\/(api|forms)|set-cookie|Bearer/i
const LINE = /^\[valuation\] crm-registro id=([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}) clasificacion=(confirmado|rechazado|incierto) motivo=([a-z_]+) http=(\d{3}|-) duracion_ms=(\d+) respuesta=([a-z_]+) claves=(\S+)$/

let dir, crm, server, origin, respond, closedUrl, received, loaded
const sendPage = (status = 200, html = `<input type="hidden" name="_token" value="${TOKEN}">`) => (_req, res) => {
  res.writeHead(status, { 'Content-Type': 'text/html', 'Set-Cookie': ['XSRF-TOKEN=token-ficticio; path=/', 'laravel_session=sesionFicticia; path=/; httponly'] })
  res.end(html)
}
let servePage = sendPage()
const state = { logs: [], requests: 0, pages: 0, simulated: 0, external: [] }
const originals = { fetch: globalThis.fetch, info: console.info, warn: console.warn, error: console.error, log: console.log }

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'crm-log-'))
  const fix = s => s.replace(/'#shared\/utils\/([A-Za-z]+)'/g, (_, m) => `'${fileUrl('shared/utils')}/${m}.ts'`).replace("'./formMail'", "'./formMail.ts'")
  writeFileSync(join(dir, 'formMail.ts'), fix(read('server/utils/formMail.ts')))
  writeFileSync(join(dir, 'crmClient.ts'), fix(read('server/utils/crmClient.ts')))
  crm = await import(pathToFileURL(join(dir, 'crmClient.ts')).href)

  server = createServer((req, res) => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => {
      const info = { method: req.method, url: req.url, headers: req.headers, body: Buffer.concat(chunks) }
      if (req.method === 'GET') { state.pages++; loaded = info; return servePage(req, res) }
      state.requests++; received = info; respond(req, res)
    })
  })
  await new Promise(r => server.listen(0, '127.0.0.1', r))
  origin = `http://127.0.0.1:${server.address().port}`
  // Puerto local recién liberado: conexión rechazada de verdad.
  const spare = createServer()
  await new Promise(r => spare.listen(0, '127.0.0.1', r))
  closedUrl = `http://127.0.0.1:${spare.address().port}${SUBMIT_PATH}`
  await new Promise(r => spare.close(r))

  globalThis.fetch = (url, init) => {
    if (new URL(url).hostname !== '127.0.0.1') { state.external.push(String(url)); throw new Error('Red externa bloqueada en pruebas.') }
    state.simulated++
    return originals.fetch(url, init)
  }
  for (const m of ['info', 'warn', 'error', 'log']) console[m] = (...a) => { state.logs.push(a.map(String).join(' ')) }
})
beforeEach(() => { state.logs = []; state.requests = 0; state.pages = 0; servePage = sendPage() })
after(() => {
  globalThis.fetch = originals.fetch
  for (const m of ['info', 'warn', 'error', 'log']) console[m] = originals[m]
  server.closeAllConnections()
  server.close()
  rmSync(dir, { recursive: true, force: true })
})

const send = (status, body, headers = {}) => (_req, res) => {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Set-Cookie': 's=token-ficticio', ...headers })
  res.end(typeof body === 'string' ? body : JSON.stringify(body))
}
const config = url => crm.resolveCrmClientConfig({ crmFormUrl: url, crmFormUserId: IDS.userId, crmFormLineId: IDS.lineId, crmFormAdvisorId: IDS.advisorId }).config
const call = (url = `${origin}${SUBMIT_PATH}`, value = VALUE) => crm.registerCrmClient(config(url), value)
/** Comprueba que hubo UNA línea de traza, sin fugas, y la devuelve troceada. */
const trace = () => {
  assert.equal(state.logs.length, 1, state.logs.join('\n'))
  assert.doesNotMatch(state.logs[0], SECRETS)
  const m = state.logs[0].match(LINE)
  assert.ok(m, state.logs[0])
  const [, id, clasificacion, motivo, http, ms, respuesta, claves] = m
  return { id, clasificacion, motivo, http, ms: Number(ms), respuesta, claves }
}
const leaky = extra => ({ ...extra, data: { nombre: 'Zoraida', valor: 'VALOR-SECRETO' }, message: `Cliente ${VALUE.nombres} ${VALUE.telefono}` })

describe('Traza segura del registro en el CRM (simulado)', () => {
  test('1. 2xx con `mensagge` => confirmado, con código, duración y solo los nombres de las claves', async () => {
    respond = send(200, leaky(OK_BODY))
    assert.deepEqual(await call(), { state: 'sent', reason: 'confirmed', status: 200 })
    const t = trace()
    assert.deepEqual([t.clasificacion, t.motivo, t.http, t.respuesta, t.claves], ['confirmado', 'confirmed', '200', 'json', 'mensagge,data,message'])
    assert.equal(state.requests, 1)
  })

  test('en la red: GET del formulario y POST multipart real con sus cookies, su token y los campos exactos', async () => {
    respond = send(200, OK_BODY)
    await call()
    assert.deepEqual([state.pages, state.requests], [1, 1])
    assert.equal(loaded.url, FORM_PATH)
    assert.equal(loaded.headers.cookie, undefined)
    assert.equal(loaded.body.length, 0)
    assert.equal(received.method, 'POST')
    assert.equal(received.url, SUBMIT_PATH)
    const type = received.headers['content-type']
    assert.match(type, /^multipart\/form-data; boundary=\S+$/)
    assert.equal(received.headers.cookie, 'XSRF-TOKEN=token-ficticio; laravel_session=sesionFicticia')
    assert.equal(received.headers['x-requested-with'], 'XMLHttpRequest')
    assert.equal(received.headers.referer, `${origin}${FORM_PATH}`)
    assert.equal(received.headers.authorization, undefined)
    const form = await new Response(received.body, { headers: { 'Content-Type': type } }).formData()
    assert.deepEqual([...form.entries()], [
      ['_token', TOKEN], ['_method', 'post'], ['nombres', 'Zoraida'], ['apellidos', 'Ficticia Quimbayo'], ['identificacion', 'PRUEBA90817263'], ['fecha_nacimiento', '1987-03-21'],
      ['direccion', 'Medellín'], ['telefono', '3009998877'], ['email', 'zoraida@correo.test'], ['name_surgery', 'Blefaroplastia'], ['forma_pago', 'Financiacion'],
      ['state', 'No Contactada'], ['origen', 'Formulario Web'], ['id_user', '911'], ['id_line', '922'], ['id_user_asesora', '933'], ['accept', '1']
    ])
  })

  test('sin sesión no se envía el paciente y la traza indica la causa sin datos', async () => {
    for (const [page, reason, status] of [[sendPage(500), 'session_rejected', 500], [sendPage(302), 'session_rejected', 302], [sendPage(200, '<html>VALOR-SECRETO</html>'), 'session_invalid', 200]]) {
      state.logs = []; servePage = page
      assert.deepEqual(await call(), { state: 'failed', reason, status })
      assert.deepEqual([trace().motivo, state.requests], [reason, 0])
    }
  })

  test('un formulario sin validar no sale: fallo interno, sin petición', async () => {
    for (const bad of [{ ...VALUE, accept: false }, { ...VALUE, forma_pago: 'Otra' }]) {
      state.logs = []
      assert.deepEqual(await call(undefined, bad), { state: 'failed', reason: 'internal_error' })
      assert.equal(trace().motivo, 'internal_error')
    }
    assert.equal(state.requests, 0)
  })

  test('2. 2xx con estructura desconocida => incierto y las claves permiten conocer el formato', async () => {
    respond = send(200, leaky({ created: true }))
    assert.deepEqual(await call(), { state: 'unknown', reason: 'unconfirmed_response', status: 200 })
    const t = trace()
    assert.deepEqual([t.clasificacion, t.motivo, t.http, t.claves], ['incierto', 'unconfirmed_response', '200', 'created,data,message'])
    assert.equal(state.requests, 1)
  })

  test('3. 4xx => rechazado; el cuerpo solo se devuelve (sin registrarse) en el 422', async () => {
    for (const [status, reason] of [[400, 'http_rejected'], [401, 'http_rejected'], [408, 'http_retryable'], [419, 'http_rejected'], [422, 'http_rejected'], [429, 'http_retryable']]) {
      state.logs = []; state.requests = 0
      const body = { errors: { telefono: [`${VALUE.telefono} VALOR-SECRETO`] }, message: VALUE.nombres }
      respond = send(status, body)
      const r = await call()
      assert.deepEqual([r.state, r.reason, r.status], ['failed', reason, status])
      assert.deepEqual(r.body, status === 422 ? body : undefined, String(status))
      const t = trace()
      assert.deepEqual([t.clasificacion, t.motivo, t.http, t.claves], ['rechazado', reason, String(status), 'errors,message'])
      assert.equal(state.requests, 1, 'sin reintentos')
    }
  })

  test('4. 5xx => error aunque el cuerpo diga éxito', async () => {
    for (const status of [500, 502, 503]) {
      state.logs = []; state.requests = 0
      respond = send(status, leaky(OK_BODY))
      assert.deepEqual(await call(), { state: 'failed', reason: 'http_server_error', status })
      const t = trace()
      assert.deepEqual([t.clasificacion, t.motivo, t.http], ['rechazado', 'http_server_error', String(status)])
      assert.equal(state.requests, 1, 'sin reintentos')
    }
  })

  test('una redirección es incierta, no se sigue y no se registra su destino', async () => {
    respond = send(307, '', { Location: `${origin}/VALOR-SECRETO` })
    assert.deepEqual(await call(), { state: 'unknown', reason: 'redirect_not_followed', status: 307 })
    assert.equal(trace().respuesta, 'no_json')
    assert.equal(state.requests, 1)
  })

  test('5. timeout sin respuesta => incierto, motivo genérico y sin código HTTP', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    let arrived
    const waiting = new Promise((r) => { arrived = r })
    respond = () => arrived()
    const pending = call()
    await waiting
    t.mock.timers.tick(15_000)
    assert.deepEqual(await pending, { state: 'unknown', reason: 'timeout' })
    const l = trace()
    assert.deepEqual([l.clasificacion, l.motivo, l.http, l.respuesta, l.claves], ['incierto', 'timeout', '-', 'sin_respuesta', '-'])
    assert.equal(state.requests, 1, 'sin reintentos')
  })

  test('cuerpo que no llega a completarse: la clasificación la sigue dando el código HTTP', async (t) => {
    for (const [status, expected] of [[200, ['unknown', 'unconfirmed_response']], [400, ['failed', 'http_rejected']], [500, ['failed', 'http_server_error']]]) {
      state.logs = []
      respond = (_req, res) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.write('{"mensagge":'); setImmediate(() => res.destroy()) }
      const r = await call()
      assert.deepEqual([r.state, r.reason, r.status], [...expected, status])
      assert.equal(trace().respuesta, 'ilegible')
    }
  })

  test('6. error de conexión: sin sesión si no conecta; incierto si se corta durante el envío', async () => {
    assert.deepEqual(await call(closedUrl), { state: 'failed', reason: 'session_unreachable', status: undefined })
    let l = trace()
    assert.deepEqual([l.clasificacion, l.motivo, l.http, l.respuesta], ['rechazado', 'session_unreachable', '-', 'sin_respuesta'])
    state.logs = []; state.requests = 0
    respond = req => req.socket.destroy()
    assert.deepEqual(await call(), { state: 'unknown', reason: 'no_response' })
    l = trace()
    assert.deepEqual([l.clasificacion, l.motivo, l.http], ['incierto', 'no_response', '-'])
    assert.equal(state.requests, 1, 'sin reintentos')
  })

  test('7. respuesta no JSON o JSON que no es un objeto => se indica el tipo, nunca el contenido', async () => {
    for (const [body, kind] of [[`<html>${VALUE.nombres} VALOR-SECRETO</html>`, 'no_json'], ['', 'no_json'], [`"${VALUE.nombres}"`, 'json_no_objeto'], [`["VALOR-SECRETO"]`, 'json_no_objeto'], ['null', 'json_no_objeto']]) {
      state.logs = []
      respond = send(200, body)
      assert.deepEqual(await call(), { state: 'unknown', reason: 'unconfirmed_response', status: 200 }, body)
      const l = trace()
      assert.deepEqual([l.respuesta, l.claves], [kind, '-'], body)
    }
  })

  test('8. datos usados como NOMBRE de clave se ocultan y la lista tiene límite', async () => {
    const keys = { ...OK_BODY, Zoraida: 1, 'ficticia_registro': 1, 'medellín': 1, PRUEBA90817263: 1, '+573009998877': 1, tel_3009998877: 1, 'zoraida@correo.test': 1, 'con espacio': 1, 'salto\nde linea': 1, ['x'.repeat(41)]: 1 }
    respond = send(200, keys)
    assert.equal((await call()).state, 'sent')
    assert.equal(trace().claves, ['mensagge', ...Array(10).fill('[omitida]')].join(','))
    state.logs = []
    respond = send(200, Object.fromEntries(Array.from({ length: 25 }, (_, i) => [`campo${i}`, 'VALOR-SECRETO'])))
    await call()
    assert.equal(trace().claves, [...Array.from({ length: 20 }, (_, i) => `campo${i}`), '(+5)'].join(','))
  })

  test('cada petición lleva su propio identificador y un fallo al escribir la traza no cambia el resultado', async () => {
    respond = send(200, OK_BODY)
    await call()
    const first = trace().id
    state.logs = []
    await call()
    assert.notEqual(trace().id, first)
    const info = console.info
    console.info = () => { throw new Error('salida cerrada') }
    try { assert.equal((await call()).state, 'sent') } finally { console.info = info }
  })

  test('todas las peticiones fueron al servidor simulado: ninguna salió a la red', (t) => {
    t.diagnostic(`peticiones al CRM simulado: ${state.simulated}`)
    assert.ok(state.simulated > 0)
    assert.ok(state.logs.every(x => !SECRETS.test(x)))
    assert.deepEqual(state.external, [])
  })
})

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

const PAYLOAD = {
  name: 'Zoraida Ficticia Quimbayo', phone: '+573009998877', city: 'Medellín', identificacion: 'PRUEBA90817263',
  ad_headline: 'Quiero más info', advisor_email: 'asesora@example.test', id_line: 12
}
// Cualquiera de estos textos en un log sería una fuga.
const SECRETS = /Zoraida|Ficticia|Quimbayo|3009998877|90817263|Medell|Quiero|asesora@|example\.test|VALOR-SECRETO|token-ficticio|127\.0\.0\.1|crm\/alta|set-cookie|Bearer/i
const LINE = /^\[valuation\] crm-registro id=([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}) clasificacion=(confirmado|rechazado|incierto) motivo=([a-z_]+) http=(\d{3}|-) duracion_ms=(\d+) respuesta=([a-z_]+) claves=(\S+)$/

let dir, crm, server, origin, respond, closedUrl
const state = { logs: [], requests: 0, simulated: 0, external: [] }
const originals = { fetch: globalThis.fetch, info: console.info, warn: console.warn, error: console.error, log: console.log }

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'crm-log-'))
  const fix = s => s.replace(/'#shared\/utils\/([A-Za-z]+)'/g, (_, m) => `'${fileUrl('shared/utils')}/${m}.ts'`).replace("'./formMail'", "'./formMail.ts'")
  writeFileSync(join(dir, 'formMail.ts'), fix(read('server/utils/formMail.ts')))
  writeFileSync(join(dir, 'crmClient.ts'), fix(read('server/utils/crmClient.ts')))
  crm = await import(pathToFileURL(join(dir, 'crmClient.ts')).href)

  server = createServer((req, res) => { req.resume(); req.on('end', () => { state.requests++; respond(req, res) }) })
  await new Promise(r => server.listen(0, '127.0.0.1', r))
  origin = `http://127.0.0.1:${server.address().port}`
  // Puerto local recién liberado: conexión rechazada de verdad.
  const spare = createServer()
  await new Promise(r => spare.listen(0, '127.0.0.1', r))
  closedUrl = `http://127.0.0.1:${spare.address().port}/crm/alta`
  await new Promise(r => spare.close(r))

  globalThis.fetch = (url, init) => {
    if (new URL(url).hostname !== '127.0.0.1') { state.external.push(String(url)); throw new Error('Red externa bloqueada en pruebas.') }
    state.simulated++
    return originals.fetch(url, init)
  }
  for (const m of ['info', 'warn', 'error', 'log']) console[m] = (...a) => { state.logs.push(a.map(String).join(' ')) }
})
beforeEach(() => { state.logs = []; state.requests = 0 })
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
const call = (url = `${origin}/crm/alta`) => crm.registerCrmClient({ url, lineId: 12, advisorEmail: PAYLOAD.advisor_email }, PAYLOAD)
/** Comprueba que hubo UNA línea de traza, sin fugas, y la devuelve troceada. */
const trace = () => {
  assert.equal(state.logs.length, 1, state.logs.join('\n'))
  assert.doesNotMatch(state.logs[0], SECRETS)
  const m = state.logs[0].match(LINE)
  assert.ok(m, state.logs[0])
  const [, id, clasificacion, motivo, http, ms, respuesta, claves] = m
  return { id, clasificacion, motivo, http, ms: Number(ms), respuesta, claves }
}
const leaky = extra => ({ ...extra, data: { nombre: 'Zoraida', valor: 'VALOR-SECRETO' }, message: `Cliente ${PAYLOAD.name} ${PAYLOAD.phone}` })

describe('Traza segura del registro en el CRM (simulado)', () => {
  test('1. 2xx confirmado => confirmado, con código, duración y solo los nombres de las claves', async () => {
    respond = send(201, leaky({ success: true }))
    assert.deepEqual(await call(), { state: 'sent', reason: 'confirmed', status: 201 })
    const t = trace()
    assert.deepEqual([t.clasificacion, t.motivo, t.http, t.respuesta, t.claves], ['confirmado', 'confirmed', '201', 'json', 'success,data,message'])
    assert.equal(state.requests, 1)
  })

  test('2. 2xx con estructura desconocida => incierto y las claves permiten conocer el formato', async () => {
    respond = send(200, leaky({ cliente_id: 'VALOR-SECRETO', creado: true }))
    assert.deepEqual(await call(), { state: 'unknown', reason: 'unconfirmed_response', status: 200 })
    const t = trace()
    assert.deepEqual([t.clasificacion, t.motivo, t.http, t.claves], ['incierto', 'unconfirmed_response', '200', 'cliente_id,creado,data,message'])
    assert.equal(state.requests, 1)
  })

  test('3. 4xx => rechazado; el cuerpo solo se devuelve (sin registrarse) en el 422', async () => {
    for (const [status, reason] of [[400, 'http_rejected'], [401, 'http_rejected'], [408, 'http_retryable'], [422, 'http_rejected'], [429, 'http_retryable']]) {
      state.logs = []; state.requests = 0
      const body = { errors: { phone: [`${PAYLOAD.phone} VALOR-SECRETO`] }, message: PAYLOAD.name }
      respond = send(status, body)
      const r = await call()
      assert.deepEqual([r.state, r.reason, r.status], ['failed', reason, status])
      assert.deepEqual(r.body, status === 422 ? body : undefined, String(status))
      const t = trace()
      assert.deepEqual([t.clasificacion, t.motivo, t.http, t.claves], ['rechazado', reason, String(status), 'errors,message'])
      assert.equal(state.requests, 1, 'sin reintentos')
    }
  })

  test('4. 5xx => incierto aunque el cuerpo diga éxito', async () => {
    for (const status of [500, 502, 503]) {
      state.logs = []; state.requests = 0
      respond = send(status, leaky({ success: true }))
      assert.deepEqual(await call(), { state: 'unknown', reason: 'http_other', status })
      const t = trace()
      assert.deepEqual([t.clasificacion, t.motivo, t.http], ['incierto', 'http_other', String(status)])
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
    for (const [status, expected] of [[200, ['unknown', 'unconfirmed_response']], [400, ['failed', 'http_rejected']], [500, ['unknown', 'http_other']]]) {
      state.logs = []
      respond = (_req, res) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.write('{"success":'); setImmediate(() => res.destroy()) }
      const r = await call()
      assert.deepEqual([r.state, r.reason, r.status], [...expected, status])
      assert.equal(trace().respuesta, 'ilegible')
    }
  })

  test('6. error de conexión: rechazado si no llegó a conectar; incierto si se cortó', async () => {
    assert.deepEqual(await call(closedUrl), { state: 'failed', reason: 'no_connection' })
    let l = trace()
    assert.deepEqual([l.clasificacion, l.motivo, l.http, l.respuesta], ['rechazado', 'no_connection', '-', 'sin_respuesta'])
    state.logs = []; state.requests = 0
    respond = req => req.socket.destroy()
    assert.deepEqual(await call(), { state: 'unknown', reason: 'no_response' })
    l = trace()
    assert.deepEqual([l.clasificacion, l.motivo, l.http], ['incierto', 'no_response', '-'])
    assert.equal(state.requests, 1, 'sin reintentos')
  })

  test('7. respuesta no JSON o JSON que no es un objeto => se indica el tipo, nunca el contenido', async () => {
    for (const [body, kind] of [[`<html>${PAYLOAD.name} VALOR-SECRETO</html>`, 'no_json'], ['', 'no_json'], [`"${PAYLOAD.name}"`, 'json_no_objeto'], [`["VALOR-SECRETO"]`, 'json_no_objeto'], ['null', 'json_no_objeto']]) {
      state.logs = []
      respond = send(200, body)
      assert.deepEqual(await call(), { state: 'unknown', reason: 'unconfirmed_response', status: 200 }, body)
      const l = trace()
      assert.deepEqual([l.respuesta, l.claves], [kind, '-'], body)
    }
  })

  test('8. datos usados como NOMBRE de clave se ocultan y la lista tiene límite', async () => {
    const keys = { success: true, Zoraida: 1, 'ficticia_registro': 1, 'medellín': 1, PRUEBA90817263: 1, '+573009998877': 1, tel_3009998877: 1, 'asesora@example.test': 1, 'con espacio': 1, 'salto\nde linea': 1, ['x'.repeat(41)]: 1 }
    respond = send(200, keys)
    assert.equal((await call()).state, 'sent')
    assert.equal(trace().claves, ['success', ...Array(10).fill('[omitida]')].join(','))
    state.logs = []
    respond = send(200, Object.fromEntries(Array.from({ length: 25 }, (_, i) => [`campo${i}`, 'VALOR-SECRETO'])))
    await call()
    assert.equal(trace().claves, [...Array.from({ length: 20 }, (_, i) => `campo${i}`), '(+5)'].join(','))
  })

  test('cada petición lleva su propio identificador y un fallo al escribir la traza no cambia el resultado', async () => {
    respond = send(200, { success: true })
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
    assert.deepEqual(state.external, [])
  })
})

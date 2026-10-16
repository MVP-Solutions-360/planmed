// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Función de petición PREDETERMINADA de FinancingRateService (la que usa el navegador): las pruebas que inyectan una función falsa no la
// ejercitan. Aquí se simulan los auto-imports de Nuxt (`$fetch`, `useRequestFetch`) y se llama al servicio como lo hacen los consumidores
// reales: desde temporizadores (debounce del simulador), eventos y onMounted, y también SIN contexto de Nuxt.
import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT } from '../recommendations/harness.ts'

const imp = rel => import(pathToFileURL(join(ROOT, rel)).href)

// Se importa ANTES de definir los globals: demuestra que el módulo no resuelve nada de Nuxt al importarse.
assert.equal(typeof globalThis.$fetch, 'undefined')
assert.equal(typeof globalThis.useRequestFetch, 'undefined')
const S = await imp('services/FinancingRateService.ts')
const P = await imp('providers/MockQuotationProvider.ts')
const F = await imp('shared/utils/financing.ts')

const calls = { $fetch: [], request: [] }
let noContext = false
const ok = (url, options) => Promise.resolve(url === '/api/public/financing-rate' ? { rate: '2.1200', updatedAt: 'v-public' } : { rate: '2.1200', updatedAt: 'v-admin', updatedBy: { id: 7, name: 'x' }, source: 'admin', history: [] })

beforeEach(() => {
  calls.$fetch.length = 0
  calls.request.length = 0
  noContext = false
  // En el navegador useRequestFetch() devuelve $fetch sin necesitar contexto; en el servidor lo necesita (y falla si no lo hay).
  globalThis.$fetch = (url, options) => { calls.$fetch.push([url, options]); return ok(url, options) }
  globalThis.useRequestFetch = () => {
    if (noContext) throw new Error('[nuxt] instance unavailable')
    return (url, options) => { calls.request.push([url, options]); return ok(url, options) }
  }
})
afterEach(() => { delete globalThis.$fetch; delete globalThis.useRequestFetch })

describe('lectura pública (simulador y formulario de solicitud)', () => {
  test('usa $fetch directamente y NO depende del contexto de Nuxt', async () => {
    noContext = true
    const svc = new S.FinancingRateService()
    assert.deepEqual(await svc.getPublicRate(), { rate: '2.1200', updatedAt: 'v-public' })
    assert.deepEqual(calls.$fetch.map(c => c[0]), ['/api/public/financing-rate'])
    assert.equal(calls.request.length, 0)
  })

  test('funciona desde un temporizador (debounce del simulador) y tras un await, fuera de cualquier contexto', async () => {
    noContext = true
    const svc = new S.FinancingRateService()
    const quote = await new Promise(resolve => setTimeout(async () => { await Promise.resolve(); resolve(await svc.getPublicRate()) }, 5))
    assert.equal(quote.rate, '2.1200')
  })

  test('cotización completa por el camino real: proveedor → servicio por defecto → $fetch → fórmula', async () => {
    noContext = true
    const quote = await new P.MockQuotationProvider(new S.FinancingRateService()).getQuote(15_000_000, 24, 'x')
    assert.equal(quote.monthlyPayment, F.calculateMonthlyPayment(15_000_000, 24, 0.0212))
    assert.equal(quote.ratePercent, '2.1200')
    assert.equal(quote.rateUpdatedAt, 'v-public')
  })

  test('si $fetch no existe en el entorno: error CONTROLADO (no un TypeError suelto) y sin tasa inventada', async () => {
    delete globalThis.$fetch
    const svc = new S.FinancingRateService()
    await assert.rejects(svc.getPublicRate(), S.FinancingRateUnavailableError)
    await assert.rejects(new P.MockQuotationProvider(svc).getQuote(15_000_000, 24, 'x'), S.FinancingRateUnavailableError)
    globalThis.$fetch = (url, options) => { calls.$fetch.push([url, options]); return ok(url, options) }
    assert.equal((await svc.getPublicRate()).rate, '2.1200', 'se recupera en cuanto $fetch existe')
  })

  test('si $fetch lanza de forma síncrona también es un error controlado', async () => {
    globalThis.$fetch = () => { throw new TypeError('boom') }
    await assert.rejects(new S.FinancingRateService().getPublicRate(), S.FinancingRateUnavailableError)
  })

  test('sin el servidor: error controlado (no se inventa una tasa)', async () => {
    globalThis.$fetch = () => Promise.reject(Object.assign(new Error('503'), { statusCode: 503 }))
    await assert.rejects(new S.FinancingRateService().getPublicRate(), S.FinancingRateUnavailableError)
  })
})

describe('administración (panel de tasa)', () => {
  test('getAdminRate y saveRate usan useRequestFetch (cookies de sesión) con la ruta, el método y el cuerpo correctos', async () => {
    const svc = new S.FinancingRateService()
    assert.equal((await svc.getAdminRate()).updatedAt, 'v-admin')
    await svc.saveRate('2.12', 'v-admin')
    assert.deepEqual(calls.request, [
      ['/api/admin/config/financing-rate', undefined],
      ['/api/admin/config/financing-rate', { method: 'PUT', body: { rate: '2.12', expectedUpdatedAt: 'v-admin' } }]
    ])
    assert.equal(calls.$fetch.length, 0, 'la administración nunca pasa por el $fetch sin cookies')
  })

  test('se resuelve al llamar: una instancia creada sin contexto sigue funcionando cuando ya hay contexto', async () => {
    noContext = true
    const svc = new S.FinancingRateService()
    noContext = false
    assert.equal((await svc.getAdminRate()).updatedAt, 'v-admin')
  })

  test('sin contexto de Nuxt (solo posible en SSR) falla de forma visible y NO cae a una petición sin cookies', async () => {
    noContext = true
    const svc = new S.FinancingRateService()
    await assert.rejects(svc.getAdminRate(), e => e instanceof Error && !(e instanceof S.FinancingRateUnavailableError))
    await assert.rejects(svc.saveRate('2.12', 'v'), Error)
    assert.equal(calls.$fetch.length, 0)
  })

  test('los errores del servidor llegan con mensaje, código y error de campo', async () => {
    globalThis.useRequestFetch = () => () => Promise.reject({ statusCode: 409, data: { data: { message: 'Otra persona modificó la tasa', errors: {} } } })
    await assert.rejects(new S.FinancingRateService().saveRate('2.12', 'v'), e => e.statusCode === 409 && /Otra persona/.test(e.message))
  })
})

describe('servicio del panel: la petición se resuelve en el setup y se reutiliza', () => {
  // Simula el contexto de Nuxt del servidor: useRequestFetch() solo es válido DENTRO del setup (antes de cualquier await).
  let inContext = true
  beforeEach(() => {
    inContext = true
    globalThis.useRequestFetch = () => {
      if (!inContext) throw new Error('[nuxt] instance unavailable')
      return (url, options) => { calls.request.push([url, options]); return ok(url, options) }
    }
  })

  test('creado en contexto válido, funciona después de perderlo (onMounted tras un await, eventos del usuario)', async () => {
    const svc = S.createAdminFinancingRateService() // setup
    inContext = false // a partir de aquí ya no hay contexto de Nuxt
    await Promise.resolve()
    assert.equal((await svc.getAdminRate()).updatedAt, 'v-admin') // onMounted
    await new Promise(resolve => setTimeout(resolve, 5))
    await svc.saveRate('2.12', 'v-admin') // clic en Guardar
    assert.deepEqual(calls.request.map(c => c[0]), ['/api/admin/config/financing-rate', '/api/admin/config/financing-rate'])
    assert.equal(calls.request[1][1].method, 'PUT')
    assert.equal(calls.$fetch.length, 0, 'siempre por la función con reenvío de cookies, nunca por un $fetch sin ellas')
  })

  test('creado FUERA del contexto de Nuxt falla al crearse (visible), no en silencio ni sin credenciales', () => {
    inContext = false
    assert.throws(() => S.createAdminFinancingRateService(), /instance unavailable/)
    assert.equal(calls.$fetch.length, 0)
  })

  test('el servicio por defecto (sin fábrica) resuelve useRequestFetch al llamar: sin contexto falla, con contexto funciona', async () => {
    const svc = new S.FinancingRateService()
    inContext = false
    await assert.rejects(svc.getAdminRate(), Error)
    inContext = true
    assert.equal((await svc.getAdminRate()).updatedAt, 'v-admin')
  })
})

describe('consumidores reales: solo llaman desde onMounted y eventos del navegador', () => {
  test('ningún consumidor llama al servicio durante setup/SSR', async () => {
    const { readFileSync } = await import('node:fs')
    const panel = readFileSync(join(ROOT, 'components/admin/FinancingRatePanel.vue'), 'utf8')
    assert.match(panel, /onMounted\(load\)/)
    assert.equal((panel.match(/rateService\.\w+\(/g) ?? []).length, 2, 'getAdminRate (en load) y saveRate (en el envío)')
    assert.ok(!/financingRateService/.test(panel), 'el panel no usa el singleton con la petición por defecto')
    // La fábrica se llama UNA vez, en el setup (nivel superior del script), antes de registrar onMounted y fuera de funciones/eventos.
    const script = panel.slice(panel.indexOf('<script setup'))
    assert.equal((script.match(/createAdminFinancingRateService\(\)/g) ?? []).length, 1)
    assert.match(script, /^const rateService = createAdminFinancingRateService\(\)\r?$/m)
    assert.ok(script.indexOf('const rateService') < script.indexOf('onMounted(load)'))
    const sim = readFileSync(join(ROOT, 'components/simulator/SimulatorPanel.vue'), 'utf8')
    assert.match(sim, /onMounted\(\(\) => \{\s*submitSimulation\(\)/)
  })
})

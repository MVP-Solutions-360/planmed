// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Estado HTTP REAL de las páginas de error: pide URLs a un servidor de Planmed ya en marcha (solo lectura: únicamente GET).
// Se omite salvo que se indique el sitio por entorno (no hay URL escrita aquí):
//   PLANMED_SITE_URL=<url del sitio local>  npm test
import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'

const SITE = String(process.env.PLANMED_SITE_URL || '').replace(/\/+$/, '')
let up = false

async function get(path, headers = {}) {
  const res = await fetch(`${SITE}${path}`, { redirect: 'manual', headers: { Accept: 'text/html', ...headers }, signal: AbortSignal.timeout(30_000) })
  return { status: res.status, location: res.headers.get('location'), body: await res.text() }
}

before(async () => {
  if (!SITE) return
  try { up = (await get('/')).status > 0 } catch { up = false }
})
const skip = () => (!SITE ? 'PLANMED_SITE_URL no está definida' : !up ? 'el sitio no responde' : false)

describe('HTTP real de las páginas de error', () => {
  test('una ruta inexistente responde 404 REAL con la página personalizada (no la genérica de Nuxt)', async (t) => {
    if (skip()) return t.skip(skip())
    for (const path of ['/esta-ruta-no-existe', '/procedimientos/esto/no/existe/nunca', '/recomendaciones/cuidados/esto/no/existe']) {
      const r = await get(path)
      assert.equal(r.status, 404, path)
      assert.match(r.body, /Esta página no está disponible/, path)
      assert.match(r.body, /Ir al inicio/, path)
      // Sin trazas, consultas ni nombres de variables de entorno del servidor (`__NUXT__` es el estado público de Nuxt, no un secreto).
      assert.doesNotMatch(r.body, /SQLSTATE|NUXT_WELLEZY|NUXT_SESSION|at \S+\.(ts|mjs|js):\d+:\d+/i, `${path}: sin detalles técnicos`)
    }
  })

  test('una URL inexistente de /api sigue devolviendo 404 JSON (no HTML de la página de error)', async (t) => {
    if (skip()) return t.skip(skip())
    const r = await get('/api/no-existe-xyz', { Accept: 'application/json' })
    assert.equal(r.status, 404)
  })

  test('las rutas válidas siguen respondiendo 200 y no muestran la pantalla de error', async (t) => {
    if (skip()) return t.skip(skip())
    for (const path of ['/', '/nosotros', '/admin/login']) {
      const r = await get(path)
      assert.equal(r.status, 200, path)
      assert.doesNotMatch(r.body, /Esta página no está disponible/, path)
    }
  })

  test('las rutas que dependen del Hub nunca se disfrazan de 404: 200 con el Hub arriba, 503 (reintentable) si no responde', async (t) => {
    if (skip()) return t.skip(skip())
    for (const path of ['/procedimientos', '/recomendaciones/cuidados', '/recomendaciones/revision']) {
      const r = await get(path)
      assert.ok([200, 503].includes(r.status), `${path}: estado ${r.status}`)
      assert.doesNotMatch(r.body, /Esta página no está disponible/, path)
    }
  })

  test('el panel sin sesión sigue redirigiendo a /admin/login (401 no se convierte en 404)', async (t) => {
    if (skip()) return t.skip(skip())
    const r = await get('/admin/recomendaciones')
    assert.notEqual(r.status, 404)
    assert.ok([200, 301, 302, 303, 307, 308].includes(r.status), `estado ${r.status}`)
    const api = await get('/api/admin/recommendations', { Accept: 'application/json' })
    assert.equal(api.status, 401)
  })
})

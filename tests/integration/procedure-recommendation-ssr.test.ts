// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Regresión del 503 en /recomendaciones/{cuidados|revision}/{procedimiento} por CARGA DIRECTA (SSR): cuando el Hub informa que una página
// vinculada sustituye el texto histórico (`fuente: "pagina"`), ProcedureRecommendation.vue hace una SEGUNDA llamada tras un await y, sin el
// contexto de Nuxt, useRequestFetch() lanzaba «[nuxt] instance unavailable» (→ 503). Solo lectura (GET). Se omite sin sitio en marcha:
//   PLANMED_SITE_URL=<url del sitio local>  npm test
import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from '../recommendations/harness.ts'

const SITE = String(process.env.PLANMED_SITE_URL || '').replace(/\/+$/, '')
let up = false
let linked = []

async function get(path, headers = {}) {
  const res = await fetch(`${SITE}${path}`, { redirect: 'manual', headers: { Accept: 'text/html', ...headers }, signal: AbortSignal.timeout(60_000) })
  return { status: res.status, body: await res.text() }
}

before(async () => {
  if (!SITE) return
  try {
    const list = JSON.parse((await get('/api/public/procedures', { Accept: 'application/json' })).body)
    up = Array.isArray(list)
    // Procedimientos cuyo texto de cuidados/revisión lo da una PÁGINA vinculada (el caso que exige la segunda llamada).
    for (const p of list.slice(0, 40)) {
      const detail = JSON.parse((await get(`/api/public/procedures/${p.slug}`, { Accept: 'application/json' })).body)
      for (const kind of ['cuidados', 'revision']) {
        const source = detail?.recomendaciones?.[kind]
        if (source?.fuente === 'pagina' && source.paginaSlug) linked.push({ kind, slug: p.slug, page: source.paginaSlug })
      }
    }
  } catch { up = false }
})
const skip = () => (!SITE ? 'PLANMED_SITE_URL no está definida' : !up ? 'el sitio no responde' : false)

describe('SSR directo de recomendaciones por procedimiento', () => {
  test('cada procedimiento con página vinculada responde 200 en carga directa y muestra el contenido de la página (nunca 503)', async (t) => {
    if (skip()) return t.skip(skip())
    if (!linked.length) return t.skip('ningún procedimiento tiene página vinculada en este entorno')
    for (const { kind, slug, page } of linked) {
      const r = await get(`/recomendaciones/${kind}/${slug}`)
      assert.equal(r.status, 200, `${kind}/${slug}`)
      const pageData = JSON.parse((await get(`/api/public/recommendations/${page}`, { Accept: 'application/json' })).body)
      assert.ok(r.body.includes(pageData.title), `${kind}/${slug}: el título de la página vinculada «${pageData.title}» debe estar en el HTML renderizado por el servidor`)
      assert.doesNotMatch(r.body, /instance unavailable|No fue posible cargar la p/i, `${kind}/${slug}`)
    }
  })

  test('los índices y un procedimiento con texto histórico siguen respondiendo 200', async (t) => {
    if (skip()) return t.skip(skip())
    for (const path of ['/recomendaciones/revision', '/recomendaciones/cuidados']) assert.equal((await get(path)).status, 200, path)
  })

  test('un procedimiento inexistente sigue siendo 404 (el contexto no convierte errores en 200)', async (t) => {
    if (skip()) return t.skip(skip())
    assert.equal((await get('/recomendaciones/revision/procedimiento-que-no-existe-xyz')).status, 404)
  })
})

describe('ProcedureRecommendation.vue: la llamada posterior a un await conserva el contexto de Nuxt', () => {
  const src = readFileSync(join(ROOT, 'components/recommendations/ProcedureRecommendation.vue'), 'utf8')
  test('captura useNuxtApp() en el setup (antes de cualquier await) y ejecuta getPage con runWithContext', () => {
    assert.ok(src.indexOf('const nuxtApp = useNuxtApp()') > 0 && src.indexOf('const nuxtApp = useNuxtApp()') < src.indexOf('await useAsyncData'))
    assert.match(src, /await nuxtApp\.runWithContext\(\(\) => publicRecommendationsService\.getPage\(source\.slug\)\)/)
  })
  test('el 503 por fallo real del Hub y el 404 por ausencia se conservan', () => {
    assert.match(src, /statusCode: 503/)
    assert.match(src, /statusCode: 404/)
  })
})

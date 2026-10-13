// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Guía del panel (Configuración): cubre todo el menú del admin y el origen declarado de cada módulo coincide con el código.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT } from '../recommendations/harness.ts'

const G = await import(pathToFileURL(join(ROOT, 'utils/adminGuide.ts')).href)
const src = rel => readFileSync(join(ROOT, rel), 'utf8')
const routeFile = route => {
  const base = route.replace(/^\//, '')
  return [`pages/${base}/index.vue`, `pages/${base}.vue`, `pages/${base.replace(/\/[^/]+$/, '')}/[slug].vue`].find(f => existsSync(join(ROOT, f)))
}

describe('guía del panel', () => {
  test('cada módulo tiene pasos, efecto público y un origen válido', () => {
    for (const m of G.GUIDE_MODULES) {
      assert.ok(m.title && m.publicEffect && m.steps.length >= 2, m.id)
      assert.ok(Object.keys(G.GUIDE_STORAGE).includes(m.storage), m.id)
    }
    assert.equal(new Set(G.GUIDE_MODULES.map(m => m.id)).size, G.GUIDE_MODULES.length, 'ids únicos')
  })

  test('todas las opciones del menú lateral del admin están en la guía y cada ruta existe', () => {
    const layout = src('layouts/admin.vue')
    const menuRoutes = [...layout.matchAll(/(?:to="|to: ')(\/admin\/[a-z/-]+)/g)].map(m => m[1]).filter(r => r !== '/admin')
    assert.ok(menuRoutes.length >= 8, `rutas del menú: ${menuRoutes.length}`)
    const guided = new Set(G.GUIDE_MODULES.map(m => m.route))
    for (const r of menuRoutes) assert.ok(guided.has(r), `${r} falta en la guía`)
    for (const m of G.GUIDE_MODULES) assert.ok(routeFile(m.route), `${m.route} sin página`)
  })

  test('los módulos «web» guardan en el servidor de la web y no en el Hub', () => {
    for (const m of G.guideModulesBy('web')) {
      const page = src(routeFile(m.route))
      const uses = /AboutService|SitePagesService|ClinicsManager/.test(page)
      assert.ok(uses, `${m.id} debe usar los servicios locales`)
      assert.ok(!/wellezy/i.test(page), `${m.id} no debe hablar con el Hub`)
    }
    for (const rel of ['server/utils/aboutStore.ts', 'server/utils/sitePages.ts', 'server/utils/clinics.ts']) {
      assert.ok(!/wellezyRequest|wellezyUpload/.test(src(rel)), `${rel} no usa el Hub para guardar`)
    }
  })

  test('los módulos «hub» escriben por rutas que llaman al Hub', () => {
    const hubApi = { procedimientos: 'server/utils/procedures.ts', noticias: 'server/utils/news.ts', pacientes: 'server/utils/patients.ts', recomendaciones: 'server/utils/recommendations.ts', micrositios: 'server/utils/prp.ts' }
    for (const m of G.guideModulesBy('hub').filter(m => hubApi[m.id])) {
      assert.match(src(hubApi[m.id]), /wellezy|Wellezy/, `${m.id} debe usar Hub`)
    }
  })

  test('la pantalla Configuración muestra la guía', () => {
    assert.ok(src('pages/admin/configuracion/index.vue').includes('<AdminGuide'))
    const comp = src('components/admin/AdminGuide.vue')
    assert.ok(comp.includes('GUIDE_MODULES') && !/v-html/.test(comp))
  })

  test('accesos directos al Hub: https://wellezyhub.com + ruta, y cada ruta existe en el Hub', () => {
    assert.equal(G.HUB_BASE_URL, 'https://wellezyhub.com')
    const links = G.GUIDE_MODULES.flatMap(m => m.hubLinks ?? [])
    assert.deepEqual(links.map(l => G.hubUrl(l.path)).sort(), [
      'https://wellezyhub.com/posts/cms', 'https://wellezyhub.com/posts/cms/create',
      'https://wellezyhub.com/procedimientos', 'https://wellezyhub.com/procedimientos/create',
      'https://wellezyhub.com/users'
    ])
    for (const l of links) assert.ok(l.path.startsWith('/') && !l.path.includes('//'), l.path)
    const comp = readFileSync(join(ROOT, 'components/admin/AdminGuide.vue'), 'utf8')
    assert.ok(comp.includes('rel="noopener noreferrer"'))
  })
})

// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Desplegable de Procedimientos: datos reales de la lista pública de Hub, slugs reales, sin lista hardcodeada ni detalle por ítem.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT } from '../recommendations/harness.ts'

const { buildProcedureMenu } = await import(pathToFileURL(join(ROOT, 'utils/navMenus.ts')).href)
const navbar = readFileSync(join(ROOT, 'components/layout/Navbar.vue'), 'utf8')

describe('buildProcedureMenu', () => {
  test('un enlace por procedimiento con su slug real y el orden de Hub', () => {
    const items = buildProcedureMenu([{ slug: 'mamoplastia-de-aumento', name: 'Mamoplastia de aumento' }, { slug: 'lipo', name: ' Lipo ' }])
    assert.deepEqual(items, [{ to: '/procedimientos/mamoplastia-de-aumento', label: 'Mamoplastia de aumento' }, { to: '/procedimientos/lipo', label: 'Lipo' }])
  })
  test('lista vacía (o Hub caído) => sin entradas: el Navbar deja el enlace simple', () => {
    assert.deepEqual(buildProcedureMenu([]), [])
  })
  test('descarta datos inválidos (slug raro, sin nombre) para no generar enlaces rotos ni inyectar rutas', () => {
    const items = buildProcedureMenu([{ slug: '../admin', name: 'X' }, { slug: 'a b', name: 'X' }, { slug: 'ok', name: '' }, { slug: 'ok2', name: 'Bien' }, { name: 'Sin slug' }])
    assert.deepEqual(items.map(i => i.to), ['/procedimientos/ok2'])
  })
  test('una lista larga se entrega completa (el límite es visual, con scroll, no un recorte de datos)', () => {
    const many = Array.from({ length: 60 }, (_, i) => ({ slug: `p-${i}`, name: `P ${i}` }))
    assert.equal(buildProcedureMenu(many).length, 60)
  })
})

describe('Navbar.vue — desplegable de Procedimientos', () => {
  test('usa la lista pública ya cargada (sin detalle por procedimiento) y no hay lista hardcodeada', () => {
    assert.match(navbar, /buildProcedureMenu\(hubMenu\.value\?\.procedures/)
    assert.equal(/getProcedureBySlug/.test(navbar), false)
    assert.equal(/\/procedimientos\/[a-z]/.test(navbar), false, 'ningún slug escrito a mano')
  })
  test('altura máxima ligada al viewport y scroll interno, en escritorio y móvil', () => {
    assert.match(navbar, /max-h-\[min\(70vh,calc\(100dvh-120px\)\)\] overflow-y-auto/)
    assert.match(navbar, /data-testid="procedures-list-mobile"/)
    assert.match(navbar, /max-h-\[50dvh\] overflow-y-auto/)
  })
  test('accesible: se abre con foco de teclado, expone aria-expanded/haspopup y Escape cierra', () => {
    assert.match(navbar, /data-testid="procedures-menu" @focusin="openMenu = 'PROCEDIMIENTOS'" @focusout="openMenu = null"/)
    assert.match(navbar, /aria-haspopup="true" :aria-expanded="openMenu === 'PROCEDIMIENTOS'/)
    assert.match(navbar, /@keydown\.esc/)
  })
  test('sin procedimientos queda el enlace simple a /procedimientos', () => {
    assert.match(navbar, /<NuxtLink v-else to="\/procedimientos"/)
  })
  test('un fallo de la lista de páginas no borra el menú de procedimientos (y viceversa)', () => {
    assert.match(navbar, /Promise\.allSettled\(\[publicRecommendationsService\.getPages\(\), publicProcedureService\.getProcedures\(\)\]\)/)
  })
})

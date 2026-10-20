// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Título comercial de la web: «FINANCIACIÓN DE CIRUGÍAS PLÁSTICAS» en el título por defecto y en el de la página principal (title y og:title).
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from '../recommendations/harness.ts'

const read = rel => readFileSync(join(ROOT, rel), 'utf8')
const TITLE = 'FINANCIACIÓN DE CIRUGÍAS PLÁSTICAS'

describe('título comercial de la web', () => {
  test('el título global por defecto (app.head.title) es el comercial, con tildes', () => {
    assert.match(read('nuxt.config.ts'), /head: \{\s*title: 'FINANCIACIÓN DE CIRUGÍAS PLÁSTICAS',/)
  })

  test('la página principal declara el mismo título en title y og:title, sin marca ni sufijos', () => {
    const home = read('pages/index.vue')
    assert.ok(home.includes(`title: '${TITLE}',`))
    assert.ok(home.includes(`ogTitle: '${TITLE}',`))
    assert.equal(/Financiación Médica Directa/.test(home), false)
  })

  test('el título anterior no sigue en el código fuente y la marca no se toca en el layout', () => {
    for (const f of ['nuxt.config.ts', 'pages/index.vue', 'app.vue']) assert.equal(/Financiación Médica Directa/.test(read(f)), false, f)
    assert.ok(read('components/layout/Navbar.vue').length > 0)
  })
})

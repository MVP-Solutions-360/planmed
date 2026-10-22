// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Orientación de la portada de procedimientos: se guarda localmente por slug (Hub no tiene ese dato).
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { ROOT } from '../recommendations/harness.ts'

const g = globalThis as any
let dir = ''
let mod: any

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'planmed-orient-'))
  g.aboutContentDir = () => dir
  g.createError = (o: any) => Object.assign(new Error(o.message), o)
  mod = await import('../../server/utils/procedureOrientation.ts')
})
after(() => rmSync(dir, { recursive: true, force: true }))

describe('orientación de portada', () => {
  test('sin dato es vertical; guarda y lee horizontal por slug; ignora valores y slugs inválidos', async () => {
    assert.deepEqual((await mod.withOrientation({}, [{ slug: 'liposuccion' }]))[0].imageOrientation, 'vertical')
    await mod.saveOrientation({}, 'liposuccion', 'horizontal')
    await mod.saveOrientation({}, 'mamoplastia', 'diagonal')
    await mod.saveOrientation({}, '../x', 'horizontal')
    const rows = await mod.withOrientation({}, [{ slug: 'liposuccion' }, { slug: 'mamoplastia' }])
    assert.deepEqual(rows.map((r: any) => r.imageOrientation), ['horizontal', 'vertical'])
  })
  test('el admin ofrece los dos radios y la web pública usa la orientación', () => {
    const admin = readFileSync(join(ROOT, 'pages/admin/procedimientos/[slug].vue'), 'utf8')
    assert.match(admin, /type="radio"[^>]*value="vertical"/)
    assert.match(admin, /type="radio"[^>]*value="horizontal"/)
    for (const f of ['components/home/ProcedureCard.vue', 'pages/procedimientos/index.vue', 'pages/procedimientos/[slug].vue']) {
      assert.match(readFileSync(join(ROOT, f), 'utf8'), /imageOrientation === 'horizontal'/, f)
    }
  })
})

describe('home y catálogo', () => {
  test('la home muestra solo 4 procedimientos con botón a /procedimientos; el catálogo tiene buscador y filtro por tipo', () => {
    const home = readFileSync(join(ROOT, 'components/home/ProceduresSection.vue'), 'utf8')
    assert.match(home, /HOME_LIMIT = 4/)
    assert.match(home, /v-for="\(proc, index\) in featured"/)
    assert.match(home, /data-testid="home-all-procedures"/)
    const cat = readFileSync(join(ROOT, 'pages/procedimientos/index.vue'), 'utf8')
    assert.match(cat, /id="procedure-search"/)
    assert.match(cat, /aria-label="Filtrar por tipo de procedimiento"/)
    assert.match(cat, /v-for="proc in filtered"/)
  })
})

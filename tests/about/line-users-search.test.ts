// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Buscador dinámico de Colaboradores de la línea: debounce, filtro de estado, borrado del texto, indicador de carga y carreras.
// Se ejecuta el <script setup> REAL del componente (sin Nuxt) con la reactividad de Vue y un servicio simulado.
import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { stripTypeScriptTypes } from 'node:module'
import { ref, watch, nextTick } from 'vue'
import { ROOT } from '../recommendations/harness.ts'

const source = readFileSync(join(ROOT, 'components/admin/LineUsersPanel.vue'), 'utf8')
const template = source.slice(source.indexOf('<template>'), source.indexOf('</template>\n\n<script'))
const script = source.slice(source.indexOf('<script setup lang="ts">') + '<script setup lang="ts">'.length, source.indexOf('</script>'))
const js = stripTypeScriptTypes(script.replace(/^import .*$/gm, ''), { mode: 'strip' })

const emptyPage = users => ({ users, meta: { page: 1, lastPage: 1, total: users.length, perPage: 15 } })
const user = (id, name) => ({ id, userId: id, name, email: `${name.toLowerCase()}@x.test`, role: 'R', status: 'active', isAreaLeader: false })

let calls, pending, mounted, unmount, panel

// Cada llamada al servicio queda pendiente hasta que la prueba la resuelva (para controlar el orden de las respuestas).
const service = {
  list: filters => new Promise((resolve, reject) => {
    const call = { filters: { ...filters }, resolve, reject }
    calls.push(call)
    pending.push(call)
  })
}

function mountPanel() {
  mounted = null
  unmount = null
  const factory = new Function('ref', 'watch', 'onMounted', 'onBeforeUnmount', 'lineUsersService', `${js}\nreturn { page, loading, error, forbidden, search, status, current, load, applyNow, go }`)
  panel = factory(ref, watch, cb => { mounted = cb }, cb => { unmount = cb }, service)
  mounted()
}
const flush = async () => { await nextTick(); await Promise.resolve() }

beforeEach(() => {
  calls = []
  pending = []
  mock.timers.enable({ apis: ['setTimeout'] })
  mountPanel()
})
afterEach(() => { unmount?.(); mock.timers.reset() })

describe('buscador dinámico de colaboradores', () => {
  test('la carga inicial consulta una vez sin filtros y muestra el indicador de carga hasta responder', async () => {
    assert.equal(calls.length, 1)
    assert.deepEqual(calls[0].filters, { search: '', status: '', page: 1 })
    assert.equal(panel.loading.value, true)
    calls[0].resolve(emptyPage([user(1, 'Ana')]))
    await flush()
    assert.equal(panel.loading.value, false)
    assert.equal(panel.page.value.users.length, 1)
  })

  test('buscar por nombre o correo: espera ~350 ms y consulta una sola vez', async () => {
    calls[0].resolve(emptyPage([])); await flush()
    panel.search.value = 'ana'
    await flush()
    mock.timers.tick(349)
    assert.equal(calls.length, 1, 'aún no consulta antes del debounce')
    mock.timers.tick(1)
    assert.equal(calls.length, 2)
    assert.deepEqual(calls[1].filters, { search: 'ana', status: '', page: 1 })

    panel.search.value = 'ana@x.test'
    await flush()
    mock.timers.tick(350)
    assert.equal(calls.at(-1).filters.search, 'ana@x.test')
  })

  test('escribir rápido varios caracteres genera una sola consulta con el texto final', async () => {
    calls[0].resolve(emptyPage([])); await flush()
    for (const text of ['a', 'an', 'ana', 'anai']) {
      panel.search.value = text
      await flush()
      mock.timers.tick(100)
    }
    assert.equal(calls.length, 1, 'ninguna consulta mientras se sigue escribiendo')
    mock.timers.tick(350)
    assert.equal(calls.length, 2)
    assert.equal(calls[1].filters.search, 'anai')
  })

  test('cambiar el estado consulta de inmediato, sin escribir y volviendo a la página 1', async () => {
    calls[0].resolve(emptyPage([])); await flush()
    panel.current.value = 3
    panel.status.value = 'inactive'
    await flush()
    assert.equal(calls.length, 2)
    assert.deepEqual(calls[1].filters, { search: '', status: 'inactive', page: 1 })
  })

  test('borrar el texto restaura los resultados del estado seleccionado', async () => {
    calls[0].resolve(emptyPage([])); await flush()
    panel.status.value = 'active'; await flush()
    calls.at(-1).resolve(emptyPage([user(1, 'Ana'), user(2, 'Luis')])); await flush()
    panel.search.value = 'zzz'; await flush(); mock.timers.tick(350)
    calls.at(-1).resolve(emptyPage([])); await flush()
    assert.equal(panel.page.value.users.length, 0)

    panel.search.value = ''
    await flush()
    mock.timers.tick(350)
    assert.deepEqual(calls.at(-1).filters, { search: '', status: 'active', page: 1 })
    calls.at(-1).resolve(emptyPage([user(1, 'Ana'), user(2, 'Luis')])); await flush()
    assert.equal(panel.page.value.users.length, 2)
  })

  test('una respuesta antigua no sobrescribe los resultados de la búsqueda más reciente', async () => {
    calls[0].resolve(emptyPage([])); await flush()
    panel.search.value = 'an'; await flush(); mock.timers.tick(350)
    panel.search.value = 'ana'; await flush(); mock.timers.tick(350)
    const [, older, newer] = calls
    assert.equal(older.filters.search, 'an')
    assert.equal(newer.filters.search, 'ana')

    newer.resolve(emptyPage([user(1, 'Ana')])); await flush()
    assert.equal(panel.loading.value, false)
    older.resolve(emptyPage([user(2, 'Antonio'), user(3, 'Andrea')])); await flush()
    assert.deepEqual(panel.page.value.users.map(u => u.name), ['Ana'], 'la respuesta tardía se descarta')
    assert.equal(panel.loading.value, false)
  })

  test('un error antiguo no pisa un resultado correcto más reciente, ni al revés', async () => {
    calls[0].resolve(emptyPage([])); await flush()
    panel.status.value = 'active'; await flush()
    panel.status.value = 'inactive'; await flush()
    const [, a, b] = calls
    b.resolve(emptyPage([user(9, 'Eva')])); await flush()
    a.reject(Object.assign(new Error('falló'), { statusCode: 503 })); await flush()
    assert.equal(panel.error.value, '')
    assert.deepEqual(panel.page.value.users.map(u => u.name), ['Eva'])
  })

  test('el indicador de carga se mantiene mientras la última consulta sigue pendiente', async () => {
    calls[0].resolve(emptyPage([])); await flush()
    panel.status.value = 'active'; await flush()
    panel.status.value = ''; await flush()
    calls[1].resolve(emptyPage([user(1, 'Ana')])); await flush()
    assert.equal(panel.loading.value, true, 'la respuesta antigua no apaga la carga de la consulta vigente')
    calls[2].resolve(emptyPage([])); await flush()
    assert.equal(panel.loading.value, false)
  })

  test('Enter aplica la búsqueda de inmediato y cancela el debounce pendiente', async () => {
    calls[0].resolve(emptyPage([])); await flush()
    panel.search.value = 'ana'; await flush()
    panel.applyNow()
    assert.equal(calls.length, 2)
    mock.timers.tick(500)
    assert.equal(calls.length, 2, 'no hay una segunda consulta duplicada')
  })

  test('desmontar cancela el debounce y descarta respuestas en vuelo', async () => {
    calls[0].resolve(emptyPage([])); await flush()
    panel.search.value = 'ana'; await flush()
    unmount()
    mock.timers.tick(500)
    assert.equal(calls.length, 1)
  })
})

describe('plantilla', () => {
  test('sin botón «Buscar»; el formulario sigue aplicando con Enter y el estado ya no usa @change', () => {
    assert.equal(/>\s*Buscar\s*</.test(template), false)
    assert.equal(/type="submit"/.test(template), false)
    assert.match(template, /@submit\.prevent="applyNow"/)
    assert.equal(/@change=/.test(template), false)
  })

  test('indicador de carga discreto y accesible, estados vacío y de error conservados', () => {
    assert.match(template, /v-if="loading && page"[^>]*role="status"[^>]*aria-label="Actualizando resultados"/)
    assert.match(template, /No hay colaboradores que coincidan con la búsqueda\./)
    assert.match(template, /Cargando colaboradores…/)
    assert.match(template, /:class="\{ 'opacity-60 transition-opacity': loading \}"/)
    assert.match(template, /role="alert"/)
  })

  test('el debounce es de 350 ms', () => {
    assert.match(script, /SEARCH_DEBOUNCE_MS = 350/)
  })

  test('no se tocó la autorización ni el servicio: sigue llamando al mismo endpoint con los mismos filtros', () => {
    const svc = readFileSync(join(ROOT, 'services/LineUsersService.ts'), 'utf8')
    assert.match(svc, /\/api\/admin\/config\/line-users/)
    assert.match(svc, /query\.search = f\.search\.trim\(\)/)
    assert.match(svc, /query\.status = f\.status/)
  })
})

// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Colaboradores de la línea (Configuración): acceso solo líder, filtros acotados, normalización y solo lectura.
import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT } from '../recommendations/harness.ts'

const imp = rel => import(pathToFileURL(join(ROOT, rel)).href)
const U = await imp('server/utils/lineUsers.ts')
let route
const calls = []
const state = { leader: 'ok', hub: { status: 200, data: null }, session: true }
const run = async (q = {}) => { try { return { value: await route({ method: 'GET', headers: {}, query: q }) } } catch (error) { return { error } } }

const hubBody = {
  data: [
    { id: 7, user_id: 20, name: 'Estefania Montoya', email: 'estefania@x.test', role: { id: 19, name: 'Diseñador gráfico' }, status: 'active', is_area_leader: false, password: 'no-debe-salir' },
    { id: 8, user_id: 21, name: 'Líder Planmed', email: 'lider@x.test', role: null, status: 'inactive', is_area_leader: true }
  ],
  meta: { current_page: 1, last_page: 3, total: 31, per_page: 15 }
}

before(async () => {
  const g = globalThis
  g.defineEventHandler = fn => fn
  g.setHeader = () => {}
  g.getQuery = e => e.query
  g.createError = o => Object.assign(new Error(o.message ?? 'error'), o)
  g.authError = (statusCode, message) => g.createError({ statusCode, message, data: { message } })
  g.MSG_LEADER_ONLY = 'solo líder'
  g.MSG_UNAVAILABLE = 'no disponible'
  g.requireAreaLeader = async () => {
    if (!state.session) throw g.authError(401, 'No autenticado')
    if (state.leader === 'no') throw g.authError(403, g.MSG_LEADER_ONLY)
    if (state.leader === 'down') throw g.authError(503, g.MSG_UNAVAILABLE)
  }
  g.useAdminSession = async () => ({ data: { token: 'hub-token' }, clear: async () => { state.cleared = true } })
  g.wellezyRequest = async (_e, token, method, path, options) => { calls.push({ token, method, path, query: options?.query }); return state.hub }
  Object.assign(g, U)
  route = (await imp('server/api/admin/config/line-users.get.ts')).default
})

describe('colaboradores de la línea', () => {
  test('sin sesión => 401, no líder => 403, Hub caído => 503, y no se llama al Hub', async () => {
    calls.length = 0
    state.session = false
    assert.equal((await run()).error.statusCode, 401)
    state.session = true; state.leader = 'no'
    assert.equal((await run()).error.statusCode, 403)
    state.leader = 'down'
    assert.equal((await run()).error.statusCode, 503)
    state.leader = 'ok'
    assert.equal(calls.length, 0)
  })

  test('lista: llama a /cms/line-users con el token, entrega solo los campos esperados y no filtra datos extra', async () => {
    calls.length = 0
    state.hub = { status: 200, data: hubBody }
    const { value, error } = await run()
    assert.ok(!error, error?.message)
    assert.equal(calls.length, 1)
    assert.deepEqual([calls[0].token, calls[0].method, calls[0].path], ['hub-token', 'GET', '/cms/line-users'])
    assert.equal(value.users.length, 2)
    assert.deepEqual(Object.keys(value.users[0]).sort(), ['email', 'id', 'isAreaLeader', 'name', 'role', 'status', 'userId'])
    assert.equal(value.users[0].role, 'Diseñador gráfico')
    assert.equal(value.users[1].isAreaLeader, true)
    assert.equal(value.users[1].status, 'inactive')
    assert.equal(JSON.stringify(value).includes('no-debe-salir'), false)
    assert.deepEqual(value.meta, { page: 1, lastPage: 3, total: 31, perPage: 15 })
  })

  test('filtros: solo search, status válido, page y per_page acotados; la empresa/línea nunca viajan desde el navegador', async () => {
    calls.length = 0
    state.hub = { status: 200, data: hubBody }
    await run({ search: '  ana  ', status: 'inactive', page: '2', per_page: '9999', company_id: '5', linea_id: '9', evil: 'x' })
    assert.deepEqual(calls[0].query, { search: 'ana', status: 'inactive', page: 2, per_page: 50 })
    calls.length = 0
    await run({ status: 'borrado', page: '-3', search: '' })
    assert.deepEqual(calls[0].query, { page: 1, per_page: 15 })
  })

  test('errores del Hub: 401 => 401 (y cierra sesión), 403 => 403 de líder, otros => 503', async () => {
    state.cleared = false
    state.hub = { status: 401 }
    assert.equal((await run()).error.statusCode, 401)
    assert.equal(state.cleared, true)
    state.hub = { status: 403 }
    assert.equal((await run()).error.statusCode, 403)
    for (const status of [0, 500, 502]) { state.hub = { status }; assert.equal((await run()).error.statusCode, 503, String(status)) }
  })

  test('solo lectura: ninguna ruta ni servicio de colaboradores escribe en el Hub', () => {
    const code = ['server/utils/lineUsers.ts', 'server/api/admin/config/line-users.get.ts', 'services/LineUsersService.ts', 'components/admin/LineUsersPanel.vue'].map(f => readFileSync(join(ROOT, f), 'utf8')).join('\n')
    assert.ok(!/'(POST|PUT|PATCH|DELETE)'|method: ?'(POST|PUT|PATCH|DELETE)'/.test(code))
    assert.ok(!/localStorage|v-html/.test(code))
  })

  test('Configuración tiene pestañas «Configuración» y «Guía del panel»', () => {
    const page = readFileSync(join(ROOT, 'pages/admin/configuracion/index.vue'), 'utf8')
    assert.ok(page.includes("label: 'Configuración'") && page.includes("label: 'Guía del panel'"))
    assert.ok(page.includes('<AdminLineUsersPanel') && page.includes('<AdminGuide'))
  })
})

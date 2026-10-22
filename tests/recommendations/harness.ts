// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Arnés de pruebas (Node, sin Nuxt): simula los auto-imports de Nitro y un Wellezy Hub falso, para ejecutar las rutas reales de
// server/api/**/recommendations* y server/utils/{recommendations,procedures,news}.ts sin red ni base de datos.
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

export const ROOT = resolve(import.meta.dirname, '..', '..')
export const HUB_TOKEN = 'hub-secret-token'
export const PNG = 'data:image/png;base64,iVBORw0KGgo='

export interface HubCall { kind: 'json' | 'upload' | 'public', method: string, path: string, body?: any, query?: any, token?: string, form?: FormData }
type Rule = { method: string, path: RegExp, status: number | ((call: HubCall) => number), data: any }

export class FakeHub {
  calls: HubCall[] = []
  rules: Rule[] = []
  sessionCleared = false
  /** null => no hay sesión de administrador (401 antes de llamar a Hub). */
  token: string | null = HUB_TOKEN

  on(method: string, path: RegExp | string, status: Rule['status'], data: any) {
    this.rules.push({ method, path: typeof path === 'string' ? new RegExp(`^${path}$`) : path, status, data })
    return this
  }

  handle(call: HubCall): { status: number, data?: any } {
    this.calls.push(call)
    const rule = this.rules.find(r => r.method === call.method && r.path.test(call.path))
    if (!rule) return { status: 0 }
    return { status: typeof rule.status === 'function' ? rule.status(call) : rule.status, data: typeof rule.data === 'function' ? rule.data(call) : rule.data }
  }

  last() { return this.calls[this.calls.length - 1] }
}

export function makeError(o: { statusCode: number, message?: string, statusMessage?: string, data?: any }) {
  return Object.assign(new Error(o.message ?? o.statusMessage ?? 'error'), o)
}

export function makeEvent(opts: { params?: Record<string, string>, body?: any, method?: string, headers?: Record<string, string>, session?: any } = {}) {
  return { params: opts.params ?? {}, body: opts.body, method: opts.method ?? 'GET', headers: opts.headers ?? {}, session: opts.session }
}

const loaded = new Map<string, any>()
async function load(rel: string) {
  if (!loaded.has(rel)) loaded.set(rel, await import(pathToFileURL(resolve(ROOT, rel)).href))
  return loaded.get(rel)
}

/** Instala los globals que Nuxt/Nitro auto-importa y devuelve las rutas cargadas. Llamar una vez por archivo de prueba. */
export async function setup(hub: FakeHub) {
  const g = globalThis as any
  g.defineEventHandler = (fn: any) => fn
  g.readBody = async (e: any) => e.body
  g.getRouterParam = (e: any, name: string) => e.params[name]
  g.getQuery = () => ({})
  g.setHeader = () => {}
  g.createError = makeError
  g.authError = (statusCode: number, message: string) => makeError({ statusCode, message })
  g.adminSession = async () => {
    if (!hub.token) throw g.authError(401, 'No autenticado')
    return { session: { clear: async () => { hub.sessionCleared = true } }, token: hub.token }
  }
  g.wellezyRequest = async (_e: any, token: string, method: string, path: string, options: any = {}) =>
    hub.handle({ kind: 'json', method, path, token, body: options.body, query: options.query })
  g.wellezyUpload = async (_e: any, token: string, path: string, form: FormData) =>
    hub.handle({ kind: 'upload', method: 'POST', path, token, form })
  g.wellezyPublicGet = async (_e: any, path: string) => hub.handle({ kind: 'public', method: 'GET', path })

  const news = await load('server/utils/news.ts')
  g.translate = news.translate
  g.dataUrlToBlob = news.dataUrlToBlob
  const rec = await load('server/utils/recommendations.ts')
  Object.assign(g, rec)
  Object.assign(g, await load('server/utils/publicErrors.ts'))
  const proc = await load('server/utils/procedures.ts')
  Object.assign(g, proc)
  // Orientación de portada: carpeta inexistente => sin archivo => valor por defecto (sin escribir en disco).
  g.aboutContentDir = () => '.data/__sin-contenido-de-prueba__'
  Object.assign(g, await load('server/utils/procedureOrientation.ts'))

  return {
    news,
    rec,
    proc,
    handler: async (rel: string) => (await load(rel)).default as (event: any) => Promise<any>
  }
}

/** Ejecuta un handler y devuelve { value } o { error } (con statusCode/message/data). */
export async function run(fn: (event: any) => Promise<any>, event: any): Promise<{ value?: any, error?: any }> {
  try {
    return { value: await fn(event) }
  } catch (error) {
    return { error }
  }
}

export const hubPage = (over: Record<string, unknown> = {}) => ({
  id: 7, slug: 'cita-preanestesia', grupo: 'general', menu_label: 'Cita', title: 'Cita de preanestesia', video_url: null,
  content: '<p>Texto</p>', image_url: null, orden: 1, published: true, is_custom: false, company_id: 1, linea_id: 3, ...over
})

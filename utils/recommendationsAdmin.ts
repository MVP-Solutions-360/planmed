// Lógica pura (sin Nuxt ni DOM) de la administración de Recomendaciones, para poder probarla con Node.
//  - Clasificación de páginas: generales, vinculadas a un procedimiento y sin asociación.
//  - Fuente efectiva de un procedimiento por tipo: SE APOYA en `resolveRecommendation` (utils/recommendationSource.ts, la misma regla
//    que aplica la web pública y que decide el Hub); aquí no se define ninguna regla paralela.
//  - Borradores, cambios pendientes, URL pública y mensajes de error del módulo.
import type { RecommendationPage } from '~/types/recommendations'

export type RecommendationKindKey = 'cuidados' | 'revision'
export const KIND_KEYS: readonly RecommendationKindKey[] = ['cuidados', 'revision']

/** Campo histórico del procedimiento que corresponde a cada tipo (igual que RECOMMENDATION_KINDS[kind].field). */
export const LEGACY_FIELD: Record<RecommendationKindKey, 'recomendaciones_post' | 'recomendaciones_revision'> = {
  cuidados: 'recomendaciones_post',
  revision: 'recomendaciones_revision'
}

export const KIND_LABEL: Record<RecommendationKindKey, string> = { cuidados: 'Cuidados', revision: 'Citas de revisión' }

interface ProcedureLike { slug: string, name: string, activo?: boolean, editable?: boolean, [field: string]: unknown }

// ───────────────────────── Clasificación ─────────────────────────

export interface PagesClassification {
  /** Páginas generales (grupo «general»): no sustituyen el texto de ningún procedimiento. */
  general: RecommendationPage[]
  /** Páginas de cuidados/revisión vinculadas a un procedimiento de la lista, por `${procedureSlug}::${grupo}`. */
  linked: Record<string, RecommendationPage>
  /** Páginas de cuidados/revisión SIN procedimiento (o cuyo procedimiento no está en la lista). */
  unassociated: RecommendationPage[]
}

export const linkKey = (procedureSlug: string, kind: string) => `${procedureSlug}::${kind}`

export function classifyPages(pages: RecommendationPage[], procedures: ProcedureLike[]): PagesClassification {
  const known = new Set(procedures.map(p => p.slug))
  const out: PagesClassification = { general: [], linked: {}, unassociated: [] }
  for (const page of pages) {
    if (page.group === 'general') {
      out.general.push(page)
    } else if (page.procedureSlug && known.has(page.procedureSlug)) {
      // El Hub admite una sola página por línea, procedimiento y tipo; si hubiera más, manda la primera (como `firstWhere` del Hub).
      const key = linkKey(page.procedureSlug, page.group)
      if (!out.linked[key]) out.linked[key] = page
    } else {
      out.unassociated.push(page)
    }
  }
  return out
}

/** «Sin asociación» solo existe si hay páginas en ese caso: nunca se muestra una categoría vacía. */
export const hasUnassociated = (c: PagesClassification) => c.unassociated.length > 0

// ───────────────────────── Fuente efectiva ─────────────────────────

export type SourceKind = 'pagina' | 'pagina_oculta' | 'historico' | 'ninguna'

export interface SourceDeps {
  /** utils/recommendationSource.resolveRecommendation */
  resolve: (procedure: any, kind: string, field: string, isEmpty: (html: string) => boolean) => any
  /** utils/richText.isRichHtmlEmpty */
  isEmpty: (html: string) => boolean
}

export interface EffectiveSource {
  fuente: SourceKind
  /** Página vinculada (publicada u oculta) cuando existe. */
  page: RecommendationPage | null
  /** Texto histórico del procedimiento para este tipo ('' si no hay). */
  historicText: string
}

/**
 * Fuente que termina publicándose para un procedimiento y tipo. Se construye el mismo objeto `recomendaciones` que entrega la API pública
 * del Hub (pagina | pagina_oculta | historico) a partir de las páginas del CMS y se delega la decisión en `resolveRecommendation`.
 */
export function deriveSource(procedure: ProcedureLike, kind: RecommendationKindKey, linked: Record<string, RecommendationPage>, deps: SourceDeps): EffectiveSource {
  const field = LEGACY_FIELD[kind]
  const page = linked[linkKey(procedure.slug, kind)] ?? null
  const text = typeof procedure[field] === 'string' ? procedure[field] as string : ''

  const source = page
    ? (page.published ? { fuente: 'pagina', paginaSlug: page.slug } : { fuente: 'pagina_oculta', paginaSlug: null })
    : { fuente: 'historico', paginaSlug: null }
  const resolution = deps.resolve({ [field]: text, recomendaciones: { [kind]: source } }, kind, field, deps.isEmpty)

  const fuente: SourceKind = resolution.type === 'page' ? 'pagina'
    : resolution.type === 'historic' ? 'historico'
      : resolution.reason === 'hidden' ? 'pagina_oculta' : 'ninguna'
  return { fuente, page, historicText: deps.isEmpty(text) ? '' : text }
}

export const SOURCE_LABEL: Record<SourceKind, string> = {
  pagina: 'Página publicada',
  pagina_oculta: 'Página oculta',
  historico: 'Texto del procedimiento',
  ninguna: 'Sin contenido'
}

export const SOURCE_HELP: Record<SourceKind, string> = {
  pagina: 'Se publica la página vinculada. El texto histórico del procedimiento no se muestra mientras exista esta página.',
  pagina_oculta: 'Hay una página vinculada pero está oculta: hoy no se muestra nada en la web y el texto histórico tampoco reaparece. Publica la página para que sea visible.',
  historico: 'No hay página vinculada: se publica el texto del procedimiento.',
  ninguna: 'No hay página vinculada ni texto: este contenido no aparece en la web.'
}

// ───────────────────────── URL pública ─────────────────────────

/** Página general o sin asociación: solo existe en la web si está publicada. */
export function pagePublicUrl(page: Pick<RecommendationPage, 'slug' | 'published'>): string | null {
  return page.published ? `/recomendaciones/${page.slug}` : null
}

/** Procedimiento + tipo: la web publica en /recomendaciones/{cuidados|revision}/{procedimiento} cuando hay página publicada o texto. */
export function procedurePublicUrl(procedure: ProcedureLike, kind: RecommendationKindKey, source: EffectiveSource): string | null {
  // Un procedimiento inactivo no está en las listas públicas: la URL no existiría.
  if (procedure.activo === false) return null
  return source.fuente === 'pagina' || source.fuente === 'historico' ? `/recomendaciones/${kind}/${procedure.slug}` : null
}

// ───────────────────────── Borradores y cambios pendientes ─────────────────────────

export interface PageDraft { title: string, videoUrl: string, image: string, content: string }
export interface LegacyDraft { text: string }

export const pageDraftOf = (p: Pick<RecommendationPage, 'title' | 'videoUrl' | 'image' | 'content'>): PageDraft =>
  ({ title: p.title, videoUrl: p.videoUrl, image: p.image, content: p.content })

export const legacyDraftOf = (procedure: ProcedureLike, kind: RecommendationKindKey): LegacyDraft => {
  const v = procedure[LEGACY_FIELD[kind]]
  return { text: typeof v === 'string' ? v : '' }
}

/** Comparación de campos (no de referencias): el editor puede reescribir "<p></p>" por "" sin que sea un cambio real. */
export function isDraftDirty(draft: object | undefined, baseline: object | undefined, isEmpty: (html: string) => boolean = () => false): boolean {
  if (!draft || !baseline) return false
  const d = draft as Record<string, string>
  const base = baseline as Record<string, string>
  return Object.keys(base).some((k) => {
    const a = d[k] ?? ''
    const b = base[k] ?? ''
    if (a === b) return false
    return !((k === 'content' || k === 'text') && isEmpty(a) && isEmpty(b))
  })
}

export const pageKey = (slug: string) => `page:${slug}`
export const legacyKey = (procedureSlug: string, kind: RecommendationKindKey) => `legacy:${procedureSlug}:${kind}`

export const YOUTUBE_RE = /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i

/** Validación previa al guardado de una página (mismas reglas que el panel anterior). */
export function validatePageDraft(draft: PageDraft): string | null {
  if (!draft.title.trim()) return 'Escribe el título de la página.'
  if (draft.videoUrl.trim() && !YOUTUBE_RE.test(draft.videoUrl.trim())) return 'Solo se admiten enlaces de YouTube.'
  return null
}

// ───────────────────────── Errores del módulo ─────────────────────────

export type AdminAction = 'list' | 'create' | 'save' | 'publish' | 'unpublish' | 'delete' | 'procedures' | 'save-legacy'

/** Permiso del Hub que exige cada acción (policy `recomendaciones.*`; el texto histórico del procedimiento usa `cirugias.editar`). */
export const REQUIRED_PERMISSION: Record<AdminAction, string> = {
  list: 'recomendaciones.ver',
  create: 'recomendaciones.crear',
  save: 'recomendaciones.editar',
  publish: 'recomendaciones.editar',
  unpublish: 'recomendaciones.editar',
  delete: 'recomendaciones.eliminar',
  procedures: 'cirugias.ver',
  'save-legacy': 'cirugias.editar'
}

/** Clase del fallo según el código de respuesta: validación (422), sesión (401), permisos (403), conexión (sin respuesta/503), servidor (5xx) u otro. */
export type ErrorKind = 'validation' | 'auth' | 'forbidden' | 'network' | 'server' | 'local' | 'other'

export interface AdminError { status: number | null, message: string, forbidden: boolean, kind: ErrorKind, details: string[] }

/** Detalles de validación que devuelve el Hub (`errors`: campo → mensajes), aplanados y sin repetir. */
function fieldMessages(error: any): string[] {
  const raw = error?.fieldErrors
  if (!raw || typeof raw !== 'object') return []
  const out: string[] = []
  for (const value of Object.values(raw)) {
    for (const m of Array.isArray(value) ? value : [value]) if (typeof m === 'string' && m.trim() && !out.includes(m)) out.push(m)
  }
  return out
}

export function describeError(error: any, action: AdminAction): AdminError {
  const status = Number.isSafeInteger(error?.statusCode) ? error.statusCode as number : null
  if (status === 403) {
    return { status, forbidden: true, kind: 'forbidden', details: [], message: `Tu usuario no tiene permiso para esta acción (requiere «${REQUIRED_PERMISSION[action]}» en Wellezy Hub).` }
  }
  if (status === 401) {
    return { status, forbidden: false, kind: 'auth', details: [], message: 'Tu sesión expiró. Inicia sesión de nuevo; lo que escribiste sigue en pantalla.' }
  }
  const message = typeof error?.message === 'string' && error.message ? error.message : 'No fue posible completar la acción. Intenta nuevamente.'
  const kind: ErrorKind = status === 422 ? 'validation'
    : status === null || status === 0 || status === 503 || status === 504 ? 'network'
      : status >= 500 ? 'server' : 'other'
  return { status, forbidden: false, kind, message, details: kind === 'validation' ? fieldMessages(error) : [] }
}

/** Acciones que pueden fallar y se muestran junto al control que las originó. */
export type ActionKey = 'save' | 'publish' | 'unpublish' | 'delete' | 'create'

export const ACTION_TITLE: Record<ActionKey, string> = {
  save: 'No se pudieron guardar los cambios',
  publish: 'No se pudo publicar la página',
  unpublish: 'No se pudo ocultar la página',
  delete: 'No se pudo eliminar la página',
  create: 'No se pudo crear la página'
}

/** Etiqueta corta de la insignia roja: dice QUÉ falló, no siempre «guardar». */
export const ACTION_BADGE: Record<ActionKey, string> = {
  save: 'Error al guardar',
  publish: 'Error al publicar',
  unpublish: 'Error al ocultar',
  delete: 'Error al eliminar',
  create: 'Error al crear'
}

export interface ActionError { action: ActionKey, title: string, detail: string, details: string[], kind: ErrorKind, status: number | null }

export function makeActionError(action: ActionKey, detail: string, kind: ErrorKind = 'local', details: string[] = [], status: number | null = null): ActionError {
  return { action, title: ACTION_TITLE[action], detail, details, kind, status }
}

export function actionErrorFrom(error: any, action: ActionKey, permissionAction: AdminAction = action): ActionError {
  const d = describeError(error, permissionAction)
  return makeActionError(action, d.message, d.kind, d.details, d.status)
}

// ───────────────────────── Controlador de la pantalla ─────────────────────────
// Selección, borradores, cambios pendientes, guardado por elemento, publicación y protección contra pérdida de cambios. El estado se recibe
// de fuera (en la página es un `reactive`) para que la vista lo observe y las pruebas con Node lo ejerciten con un objeto plano.

type TabKey = 'general' | 'procedure'

interface ProcedureRow { slug: string, name: string, activo?: boolean, editable?: boolean, [field: string]: unknown }

export interface AdminState {
  loaded: boolean
  pages: RecommendationPage[]
  procedures: ProcedureRow[]
  /** Un fallo de carga NUNCA se interpreta como lista vacía. */
  pagesError: AdminError | null
  proceduresError: AdminError | null
  tab: TabKey
  generalSlug: string | null
  unassociatedSlug: string | null
  procedureSlug: string | null
  kind: RecommendationKindKey
  drafts: Record<string, PageDraft | LegacyDraft>
  saving: Record<string, boolean>
  publishing: Record<string, boolean>
  errors: Record<string, ActionError | null>
  savedAt: Record<string, number | null>
}

export const createAdminState = (): AdminState => ({
  loaded: false, pages: [], procedures: [], pagesError: null, proceduresError: null,
  tab: 'general', generalSlug: null, unassociatedSlug: null, procedureSlug: null, kind: 'cuidados',
  drafts: {}, saving: {}, publishing: {}, errors: {}, savedAt: {}
})

export interface ConfirmOptions { title: string, text: string, confirmText: string }

export interface AdminDeps extends SourceDeps {
  pages: {
    getPages: () => Promise<RecommendationPage[]>
    savePage: (page: RecommendationPage) => Promise<RecommendationPage>
    setPublished: (slug: string, published: boolean) => Promise<RecommendationPage>
    createPage: (data: { title: string, group: 'general' }) => Promise<RecommendationPage>
    deletePage: (slug: string) => Promise<void>
  }
  procedures: {
    getProcedures: () => Promise<ProcedureRow[]>
    updateProcedure: (slug: string, data: Record<string, unknown>) => Promise<ProcedureRow>
  }
  confirm: (options: ConfirmOptions) => Promise<boolean>
  /** Pide el título de una página nueva (null = cancelado). */
  askTitle: () => Promise<string | null>
  notify?: { success?: (m: string) => void, warning?: (m: string) => void }
  now?: () => number
}

export type CurrentElement =
  | { type: 'page', key: string, label: string, page: RecommendationPage }
  | { type: 'legacy', key: string, label: string, procedure: ProcedureRow, kind: RecommendationKindKey, readonly: boolean, source: EffectiveSource }
  | { type: 'blocked', key: null, label: string, reason: string }
  | null

export function createAdminController(state: AdminState, deps: AdminDeps) {
  const now = deps.now ?? Date.now
  const classification = () => classifyPages(state.pages, state.procedures)
  const findPage = (slug: string | null) => (slug ? state.pages.find(p => p.slug === slug) ?? null : null)
  const findProcedure = (slug: string | null) => (slug ? state.procedures.find(p => p.slug === slug) ?? null : null)
  const sourceOf = (procedure: ProcedureRow, kind: RecommendationKindKey) => deriveSource(procedure, kind, classification().linked, deps)

  /** Elemento que se está editando ahora (o null). */
  function current(): CurrentElement {
    if (state.tab === 'general') {
      const page = findPage(state.generalSlug)
      return page ? { type: 'page', key: pageKey(page.slug), label: page.title, page } : null
    }
    if (state.unassociatedSlug) {
      const page = findPage(state.unassociatedSlug)
      return page ? { type: 'page', key: pageKey(page.slug), label: page.title, page } : null
    }
    const procedure = findProcedure(state.procedureSlug)
    if (!procedure) return null
    const kind = state.kind
    // Sin las páginas del CMS no se puede saber qué se publica: no se permite editar a ciegas.
    if (state.pagesError) {
      return { type: 'blocked', key: null, label: procedure.name, reason: 'No se pudieron cargar las páginas del CMS, así que no es posible determinar qué contenido se publica.' }
    }
    const source = sourceOf(procedure, kind)
    if (source.page) return { type: 'page', key: pageKey(source.page.slug), label: source.page.title, page: source.page }
    return {
      type: 'legacy', key: legacyKey(procedure.slug, kind), label: `${KIND_LABEL[kind]} de ${procedure.name}`, procedure, kind, source,
      readonly: procedure.editable === false
    }
  }

  const baselineOf = (key: string): PageDraft | LegacyDraft | undefined => {
    if (key.startsWith('page:')) {
      const page = findPage(key.slice(5))
      return page ? pageDraftOf(page) : undefined
    }
    const [, slug, kind] = key.split(':')
    const procedure = findProcedure(slug ?? null)
    return procedure ? legacyDraftOf(procedure, kind as RecommendationKindKey) : undefined
  }

  /** Borrador del elemento (se crea desde el valor guardado la primera vez). Es el objeto que enlazan los formularios. */
  function draft(key: string): PageDraft | LegacyDraft | null {
    if (!state.drafts[key]) {
      const base = baselineOf(key)
      if (!base) return null
      state.drafts[key] = { ...base }
    }
    return state.drafts[key] ?? null
  }

  const isDirty = (key: string | null | undefined) => !!key && isDraftDirty(state.drafts[key] as any, baselineOf(key), deps.isEmpty)
  const dirtyKeys = () => Object.keys(state.drafts).filter(isDirty)
  const anyDirty = () => dirtyKeys().length > 0
  const isBusy = (key: string | null | undefined) => !!key && (state.saving[key] === true || state.publishing[key] === true)

  function clearError(key: string) {
    state.errors[key] = null
  }

  function discard(key: string) {
    delete state.drafts[key]
    state.errors[key] = null
  }

  /** Cualquier cambio de selección o pestaña pasa por aquí: pide confirmación si el elemento actual tiene cambios sin guardar. */
  async function go(apply: () => void): Promise<boolean> {
    const el = current()
    if (el?.key) {
      if (isBusy(el.key)) return false // no se abandona un elemento mientras se guarda
      if (isDirty(el.key)) {
        const ok = await deps.confirm({
          title: 'Hay cambios sin guardar',
          text: `Si continúas se descartarán los cambios de «${el.label}».`,
          confirmText: 'Descartar y continuar'
        })
        if (!ok) return false
      }
      discard(el.key)
    }
    apply()
    return true
  }

  // Volver a elegir el elemento que ya está abierto no cambia nada (ni pide confirmación).
  const same = Promise.resolve(true)
  const selectTab = (tab: TabKey) => state.tab === tab ? same : go(() => { state.tab = tab })
  const selectGeneralPage = (slug: string) => state.tab === 'general' && state.generalSlug === slug ? same : go(() => { state.tab = 'general'; state.generalSlug = slug })
  const selectProcedure = (slug: string) => state.tab === 'procedure' && state.procedureSlug === slug && !state.unassociatedSlug
    ? same
    : go(() => { state.tab = 'procedure'; state.procedureSlug = slug; state.unassociatedSlug = null })
  const selectKind = (kind: RecommendationKindKey) => state.kind === kind && !state.unassociatedSlug ? same : go(() => { state.kind = kind; state.unassociatedSlug = null })
  const selectUnassociated = (slug: string) => state.unassociatedSlug === slug ? same : go(() => { state.tab = 'procedure'; state.unassociatedSlug = slug })
  const clearUnassociated = () => (state.unassociatedSlug ? go(() => { state.unassociatedSlug = null }) : same)

  async function load() {
    state.loaded = false
    const [pagesRes, proceduresRes] = await Promise.allSettled([deps.pages.getPages(), deps.procedures.getProcedures()])
    state.pagesError = null
    state.proceduresError = null
    if (pagesRes.status === 'fulfilled') state.pages = pagesRes.value
    else state.pagesError = describeError(pagesRes.reason, 'list')
    if (proceduresRes.status === 'fulfilled') state.procedures = proceduresRes.value
    else state.proceduresError = describeError(proceduresRes.reason, 'procedures')
    state.drafts = {}
    const firstGeneral = classification().general[0]
    state.generalSlug = firstGeneral ? firstGeneral.slug : null
    state.loaded = true
  }

  /** «Reintentar»: recargar descarta los borradores, así que antes se aplica la misma protección de cambios sin guardar. */
  async function reload(): Promise<boolean> {
    if (!(await go(() => {}))) return false
    await load()
    return true
  }

  /** Guarda SOLO el elemento indicado. Si falla, el borrador queda intacto. */
  async function save(key: string): Promise<boolean> {
    if (isBusy(key)) return false // sin solicitudes duplicadas
    const el = current()
    if (!el || el.key !== key) return false
    const d = draft(key)
    if (!d) return false

    state.errors[key] = null
    if (el.type === 'page') {
      const pd = d as PageDraft
      const invalid = validatePageDraft(pd)
      if (invalid) { state.errors[key] = makeActionError('save', invalid, 'validation'); return false }
      const next: RecommendationPage = {
        ...el.page, title: pd.title.trim(), videoUrl: pd.videoUrl.trim(), image: pd.image, content: pd.content,
        // Las páginas creadas desde el panel usan su título como etiqueta del menú (comportamiento previo).
        menuLabel: el.page.custom ? pd.title.trim() : el.page.menuLabel
      }
      state.saving[key] = true
      try {
        const saved = await deps.pages.savePage(next)
        state.pages = state.pages.map(p => (p.slug === saved.slug ? saved : p))
        state.drafts[key] = pageDraftOf(saved)
        state.savedAt[key] = now()
        if (!saved.published) deps.notify?.warning?.('Guardado. La página sigue oculta: publícala para que aparezca en la web.')
        else deps.notify?.success?.('Cambios guardados')
        return true
      } catch (e) {
        state.errors[key] = actionErrorFrom(e, 'save')
        return false
      } finally {
        state.saving[key] = false
      }
    }

    // Texto histórico del procedimiento (solo si es la fuente publicada y el procedimiento es editable).
    if (el.readonly || el.source.fuente === 'pagina' || el.source.fuente === 'pagina_oculta') return false
    const field = LEGACY_FIELD[el.kind]
    const text = (d as LegacyDraft).text
    const value = deps.isEmpty(text) ? '' : text
    if (value === '' && !deps.isEmpty(String(el.procedure[field] ?? ''))) {
      const ok = await deps.confirm({
        title: 'Vaciar el texto',
        text: 'Si lo dejas vacío, este procedimiento dejará de aparecer en ese menú y no tendrá página pública.',
        confirmText: 'Sí, vaciar'
      })
      if (!ok) return false
    }
    state.saving[key] = true
    try {
      const saved = await deps.procedures.updateProcedure(el.procedure.slug, { [field]: value })
      state.procedures = state.procedures.map(p => (p.slug === el.procedure.slug ? { ...p, [field]: saved[field] ?? value } : p))
      state.drafts[key] = legacyDraftOf(findProcedure(el.procedure.slug)!, el.kind)
      state.savedAt[key] = now()
      deps.notify?.success?.(`Guardado: ${el.label}`)
      return true
    } catch (e) {
      state.errors[key] = actionErrorFrom(e, 'save', 'save-legacy')
      return false
    } finally {
      state.saving[key] = false
    }
  }

  /** Publica u oculta una página SIN guardar el borrador: si hay cambios pendientes, se exige guardarlos antes. */
  async function setPublished(slug: string, published: boolean): Promise<boolean> {
    const page = findPage(slug)
    if (!page) return false
    const key = pageKey(slug)
    if (isBusy(key)) return false
    const action: ActionKey = published ? 'publish' : 'unpublish'
    if (isDirty(key)) { state.errors[key] = makeActionError(action, 'Guarda los cambios antes de publicar u ocultar: se publica el contenido guardado.', 'validation'); return false }
    if (published && deps.isEmpty(page.content)) { state.errors[key] = makeActionError(action, 'La página no tiene contenido guardado. Escribe el contenido, guárdalo y vuelve a publicar.', 'validation'); return false }
    if (!published) {
      const ok = await deps.confirm({
        title: 'Ocultar página',
        text: 'Dejará de mostrarse en la web y en el menú. El contenido se conserva.',
        confirmText: 'Sí, ocultar'
      })
      if (!ok) return false
    }
    state.errors[key] = null
    state.publishing[key] = true
    try {
      const saved = await deps.pages.setPublished(slug, published)
      state.pages = state.pages.map(p => (p.slug === saved.slug ? saved : p))
      state.drafts[key] = pageDraftOf(saved)
      deps.notify?.success?.(saved.published ? 'Página publicada' : 'Página oculta')
      return true
    } catch (e) {
      state.errors[key] = actionErrorFrom(e, action, action)
      return false
    } finally {
      state.publishing[key] = false
    }
  }

  /** «+ Agregar» (solo recomendaciones generales). La página nace oculta; el Hub genera el slug. */
  async function createGeneralPage(): Promise<boolean> {
    const el = current()
    if (el?.key && (isBusy(el.key) || isDirty(el.key))) {
      // Se aplica la misma protección de cambios sin guardar antes de cambiar de elemento.
      if (!(await go(() => {}))) return false
    }
    const title = await deps.askTitle()
    if (!title) return false
    try {
      const page = await deps.pages.createPage({ title, group: 'general' })
      state.pages = [...state.pages, page]
      await go(() => { state.tab = 'general'; state.generalSlug = page.slug })
      deps.notify?.success?.('Página creada. Está oculta hasta que la publiques.')
      return true
    } catch (e) {
      state.errors['create'] = actionErrorFrom(e, 'create')
      return false
    }
  }

  async function deletePage(slug: string): Promise<boolean> {
    const page = findPage(slug)
    if (!page || !page.custom) return false // las páginas base no se eliminan (solo se ocultan)
    const key = pageKey(slug)
    if (isBusy(key)) return false
    const ok = await deps.confirm({ title: `¿Eliminar «${page.title}»?`, text: 'Esta acción no se puede deshacer.', confirmText: 'Sí, eliminar' })
    if (!ok) return false
    try {
      await deps.pages.deletePage(slug)
      state.pages = state.pages.filter(p => p.slug !== slug)
      discard(key)
      if (state.generalSlug === slug) state.generalSlug = classification().general[0]?.slug ?? null
      if (state.unassociatedSlug === slug) state.unassociatedSlug = null
      deps.notify?.success?.('Página eliminada')
      return true
    } catch (e) {
      state.errors[key] = actionErrorFrom(e, 'delete')
      return false
    }
  }

  return {
    state, classification, current, draft, isDirty, dirtyKeys, anyDirty, isBusy, sourceOf, findPage, findProcedure,
    load, reload, save, setPublished, clearError, createGeneralPage, deletePage, discard,
    selectTab, selectGeneralPage, selectProcedure, selectKind, selectUnassociated, clearUnassociated
  }
}

export type AdminController = ReturnType<typeof createAdminController>

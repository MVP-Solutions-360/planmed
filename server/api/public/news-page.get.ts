// Listado público PAGINADO de noticias desde Wellezy Hub (GET /api/v1/web/posts?page=&per_page=).
// Hub limita per_page a 50 y devuelve la paginación en `meta`: antes la web pedía solo la primera página de 50 y el resto
// nunca se mostraba. Hub resuelve empresa/línea con X-Tenant-Linea (configuración del servidor); nada de company_id/linea_id
// viaja desde el navegador. /api/public/news (lista simple) se conserva sin cambios.
const DEFAULT_PER_PAGE = 12
const MAX_PER_PAGE = 50

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const q = getQuery(event)
  const page = parsePage(q.page)
  const rawPer = Number.parseInt(String(Array.isArray(q.per_page) ? q.per_page[0] : q.per_page ?? ''), 10)
  const perPage = Number.isFinite(rawPer) ? Math.min(Math.max(rawPer, 1), MAX_PER_PAGE) : DEFAULT_PER_PAGE

  const res = await wellezyPublicGet<any>(event, `/v1/web/posts?per_page=${perPage}&page=${page}`)

  assertHubOk('news', res, Array.isArray(res.data?.data), 'No fue posible cargar las noticias. Intenta nuevamente.')

  const items = res.data.data.map(fromPublicPost)
  const meta = res.data.meta ?? {}
  const total = Number(meta.total)
  const lastPage = Number(meta.last_page)
  return {
    items,
    page: Number.isFinite(Number(meta.current_page)) ? Number(meta.current_page) : page,
    perPage: Number.isFinite(Number(meta.per_page)) ? Number(meta.per_page) : perPage,
    total: Number.isFinite(total) ? total : items.length,
    lastPage: Number.isFinite(lastPage) && lastPage >= 1 ? lastPage : 1
  }
})

// Listado público de procedimientos desde Wellezy Hub (GET /api/v1/web/cirugias).
// Hub resuelve la línea con X-Tenant-Linea (configuración de Planmed) y solo entrega los procedimientos activos y habilitados
// para esa línea (maestros habilitados + propios). Nada de company_id/linea_id viaja desde el navegador.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const rows: any[] = []
  for (let page = 1; page <= 20; page++) {
    const res = await wellezyPublicGet<any>(event, `/v1/web/cirugias?page=${page}`)

    if (res.status === 404 && String(res.data?.message ?? '').includes('Tenant')) {
      console.error('[procedures] Hub no resolvió el tenant (revisa NUXT_WELLEZY_LINE_SLUG).')
    }
    if (res.status !== 200 || !Array.isArray(res.data?.data)) {
      throw createError({ statusCode: 503, message: 'No fue posible cargar los procedimientos. Intenta nuevamente.' })
    }
    rows.push(...res.data.data)
    if (page >= Number(res.data.meta?.last_page ?? 1)) break
  }

  return rows.map(fromPublicListItem)
})

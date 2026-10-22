// Listado público de procedimientos desde Wellezy Hub (GET /api/v1/web/cirugias).
// Hub resuelve la línea con X-Tenant-Linea (configuración de Planmed) y solo entrega los procedimientos activos y habilitados
// para esa línea (maestros habilitados + propios). Nada de company_id/linea_id viaja desde el navegador.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const rows: any[] = []
  for (let page = 1; page <= 20; page++) {
    const res = await wellezyPublicGet<any>(event, `/v1/web/cirugias?page=${page}`)

    assertHubOk('procedures', res, Array.isArray(res.data?.data), 'No fue posible cargar los procedimientos. Intenta nuevamente.')
    rows.push(...res.data.data)
    if (page >= Number(res.data.meta?.last_page ?? 1)) break
  }

  return await withOrientation(event, rows.map(fromPublicListItem))
})

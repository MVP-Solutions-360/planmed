// Proxy administrativo de la jerarquía de Recomendaciones (ver server/utils/recommendationAdmin.ts). Un archivo por método, como el resto de rutas admin.
export default defineEventHandler(event => handleTreeRequest(event))

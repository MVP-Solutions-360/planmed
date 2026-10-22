// Secciones de noticias por línea (ver server/utils/newsSections.ts). Un archivo por método, como el resto de rutas admin.
export default defineEventHandler(event => handleNewsSectionsRequest(event))

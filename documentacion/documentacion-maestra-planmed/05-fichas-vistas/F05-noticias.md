# F05 · Noticias (`/noticias`, `/noticias/:slug`)

Capturas: `CAPTURAS/publico/{desktop,movil}__noticias-listado.png`, `…__noticia-detalle.png`, `desktop__estado-hub-caido__noticias.png`.

| Campo | Listado | Detalle |
|---|---|---|
| Archivo | `pages/noticias/index.vue` | `pages/noticias/[slug].vue` |
| API | `GET /api/public/news` → Hub `/v1/web/posts?per_page=50` | `GET /api/public/news/:slug` → `/v1/web/posts/{slug}` |
| Servicio | `publicNewsService` | idem |
| Tipo / layout | pública / `default` | idem |
| Componentes | `CommonHubUnavailable`, `richHtmlToText` | `CommonRichContent`, `CommonShareActions`, `NewsYouTubeEmbed`, `NewsInstagramEmbed` |

**Reglas de visibilidad** (las decide el Hub): solo noticias de la línea, `published` y con fecha de publicación vigente (una futura no es pública). La regla de ruta `/blog/**` es un resto sin página.

## Estructura
* **Listado**: eyebrow + H1 (Noticias), rejilla 1/2/3 columnas de tarjetas (portada, título serif, extracto convertido a texto plano).
* **Detalle**: «Volver», fecha de publicación (formato largo es-CO; el autor llega en la API y solo alimenta el SEO, no se muestra), H1 mayúsculas, `ShareActions` (copiar enlace / WhatsApp; las noticias **no tienen enlace corto** en Hub, siempre se comparte la URL pública de la página), portada 16:9, contenido enriquecido, y — si existen — YouTube (`youtubeUrl`) e Instagram (`instagramUrl`) incrustados (Instagram carga `embed.js` externo una vez).
* SEO detalle: `seo.metaTitle` o `<título> | Planmed Noticias`, `og:*`, `ogType article`, `articlePublishedTime`, `articleAuthor`.

## Estados
Cargado (EJ); vacío válido (cuadrícula vacía, COD); 503 con aviso y reintento (EJ); 404 inexistente (COD/TEST); móvil (EJ). Instagram/YouTube dependen de internet (no verificable offline).

## Interacciones
| Elemento | Resultado | Verif. |
|---|---|---|
| Tarjeta | abre detalle | COD |
| Copiar enlace | `navigator.clipboard`; si falla, método clásico; si falla, campo con el enlace visible (`share-manual`) | TEST (`tests/share/share.test.ts`) |
| Compartir WhatsApp | `https://wa.me/?text=…` con título + URL | TEST |

## Evidencias
`tests/share/share.test.ts`, `tests/integration/*`. Administración: [A03](A03-noticias.md).

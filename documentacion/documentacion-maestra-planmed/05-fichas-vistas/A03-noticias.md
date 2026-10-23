# A03 · Noticias (admin)

Capturas: `CAPTURAS/admin/{desktop,movil}__noticias-listado.png`, `…__noticia-nueva.png`.

| Ruta | Archivo | API | Hub |
|---|---|---|---|
| `/admin/noticias` | `pages/admin/noticias/index.vue` | `GET /api/admin/news` | `/cms/posts` |
| `/admin/noticias/nuevo` · `/:slug` | `pages/admin/noticias/[slug].vue` | `POST /api/admin/news`, `GET/PUT/DELETE /:id` | `/cms/posts`, `/{id}/cover` (multipart) |

## Listado
Botón **NUEVA NOTICIA**, buscador (título, slug, extracto) y filtro de estado (Todos / Publicados / Borradores) — filtrado local; tabla Artículo (portada, título), Estado (botón que **publica/despublica** con `PUT {publishedAt}`), Fecha, Acciones (Editar, Eliminar). **Eliminar** abre un modal propio («Eliminar noticia», Cancelar / Eliminar) y ejecuta `DELETE`, que en Hub **despublica** (queda borrador): mensaje «Noticia despublicada (se conserva como borrador en Wellezy Hub)». Datos cargados solo en cliente (`server:false`). Sin paginación.

## Formulario
| Campo | Tipo | Oblig. | Reglas |
|---|---|---|---|
| Título | texto | ✔ | |
| Slug | texto (monoespaciado) | ✔ al editar; vacío al crear ⇒ se autogenera | |
| Extracto | editor enriquecido | ✔ | no vacío |
| Contenido editorial | editor (20 rem) | ✔ | no vacío |
| Instagram URL, YouTube URL | `url` | — | embebidos en el detalle público |
| Publicado (casilla) + Fecha de publicación (`datetime-local`) | | — | por defecto *publicado* con fecha actual en nueva; fecha vacía al marcar ⇒ ahora; **fecha futura = programada** (no pública hasta la fecha) |
| Portada | archivo JPG/PNG/WebP ≤10 MB, se redimensiona a 1600 px | ✔ | «Sube una imagen de portada para la noticia.» |
| SEO | Meta Title, Meta Description | — | |
Mensajes de éxito: «Noticia publicada correctamente», «Borrador creado correctamente», «Noticia despublicada correctamente». Tras guardar: `clearNuxtData()` y vuelta al listado. Errata en etiqueta: «Fecha de Publicacin». Verif.: EJ listado y formulario nuevo; guardado no ejercido (Hub simulado solo lectura). El Hub deriva empresa, línea, autor y estado del token (Planmed nunca los envía).

# F07 · Recomendaciones públicas

Capturas: `CAPTURAS/publico/…__recomendaciones-tema.png`, `…__recomendaciones-subtema.png`, `…__recomendaciones-cuidados-listado.png`, `…__recomendaciones-revision-listado.png`, `desktop__estado-hub-caido__recomendaciones-tema.png`.

## Rutas
| Ruta | Archivo | Componente | Origen |
|---|---|---|---|
| `/recomendaciones/:tema/:subtema` | `pages/recomendaciones/[topic]/[subtopic].vue` | `RecommendationShell` + `RecommendationSections` | `GET /api/public/recommendation-topics/:t/:s` → Hub `/v1/web/recommendation-topics/{t}/{s}` |
| `/recomendaciones/:slug` | `pages/recomendaciones/[slug].vue` | `RecommendationTopicIndex` o `RecommendationShell` (heredado) | árbol (`/recommendation-topics`) y `/recommendation-pages/{slug}` |
| `/recomendaciones/cuidados` · `/revision` | `pages/recomendaciones/{cuidados,revision}/index.vue` | `ProcedureRecommendationIndex kind=…` | procedimientos + páginas |
| `/recomendaciones/cuidados/:slug` · `/revision/:slug` | `…/[slug].vue` | `ProcedureRecommendation kind=…` | procedimiento del Hub + página vinculada |

Tipo: pública; layout `default`.

## Modelo (jerarquía)
**Tema** → **Subtema** (grupo `general | cuidados | revision`) → **Secciones** (tipos `description`, `recommendations`, `callout`, `contact`, `custom`; distribución `stacked | media_left | media_right`; imagen, video, botón CTA) → **Recomendaciones individuales** (título + contenido). Un subtema tiene además **introducción** (texto, video, imagen).

## Resolución de `/recomendaciones/:slug` (orden)
1. `slug` es un **subtema** → **301** a `/recomendaciones/{tema}/{slug}` (URLs antiguas siguen vivas).
2. `slug` es un **tema** → portada con la lista de subtemas publicados.
3. Página heredada sin tema → se muestra como antes.
4. Si no: 404, o 503 si el árbol no pudo cargarse.

## Regla de precedencia por procedimiento (`utils/recommendationSource.ts`)
Fuente efectiva decidida por Hub: `pagina` → página vinculada; `pagina_oculta` → **404** (no se cae al texto histórico); `historico` → texto del campo del procedimiento (`recomendaciones_post/revision`); `ninguna` → 404.

## Estructura visual
`RecommendationShell`: banda verde con eyebrow («Recomendaciones», «Cuidados de cirugía», «Cita de revisión»), H1, subtítulo, **ShareActions** (enlace corto de Hub si existe); artículo blanco con video/imagen/introducción; secciones como tarjetas (callout = fondo verde; contact = borde dorado); bloque final «Tu seguridad es lo más importante en cada etapa» con botones al simulador y a procedimientos. Una sección sin contenido no genera tarjeta. Botón CTA solo si el destino es válido (`safeCtaUrl`: https, mailto, tel o ruta interna).

## Estados
Subtema cargado (EJ), tema (EJ), listados (EJ), 503 (EJ: tema/hub caído), 404 (TEST), subtema oculto/tema oculto ⇒ 404 (decide Hub). Pestañas del menú: ver F10.

## Evidencias
`tests/recommendations/{static,tree-static,tree-contract,tree-server,server,listings-and-source,errors-precedence,providers}.test.ts`, `tests/integration/procedure-recommendation-ssr.test.ts`, `tests/seo/*`. Administración: [A05](A05-recomendaciones-arbol.md), [A06](A06-recomendaciones-historico.md).

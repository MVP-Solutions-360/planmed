# F04 · Procedimientos (`/procedimientos`, `/procedimientos/:slug`)

[← Inventario](../02-inventario-completo-vistas.md) · Capturas: `CAPTURAS/publico/{desktop,movil}__procedimientos-listado.png`, `…__procedimiento-detalle.png`, `desktop__procedimiento-inexistente-404.png`, `desktop__estado-hub-caido__procedimientos.png`, `…__procedimiento-detalle.png`

## Identificación
| Campo | Listado | Detalle |
|---|---|---|
| URL | `/procedimientos` | `/procedimientos/:slug` (slug `^[a-z0-9]+(?:-[a-z0-9]+)*$`) |
| Archivo | `pages/procedimientos/index.vue` | `pages/procedimientos/[slug].vue` |
| Servicio | `publicProcedureService.getProcedures()` | `.getProcedureBySlug(slug)` |
| API | `GET /api/public/procedures` | `GET /api/public/procedures/:slug` |
| Hub | `/v1/web/cirugias?page=n` (hasta 20 páginas) | `/v1/web/cirugias/{slug}` |
| Regla de ruta | `ssr: true` (`/procedimientos/**`) | idem |
| Tipo / layout | pública / `default` | pública / `default` |

## Propósito
Catálogo de procedimientos **activos y habilitados para la línea Planmed** (el Hub decide) y ficha de cada uno con acceso directo al simulador (`/financiacion?procedureId=<slug>#calculadora`).

## Estructura visual — listado
Eyebrow «PORTAFOLIO MÉDICO», H1 «NUESTROS PROCEDIMIENTOS.», subtítulo; rejilla 1/2/3 columnas de tarjetas (imagen 4:5 en gris que se colorea al hover, categoría, nombre serif, descripción corta, «Conocer más»; sin imagen → «Sin imagen»); bloque final verde «DISEÑA TU PLAN DE PAGO» con botón al simulador.

## Estructura visual — detalle
Enlace «Volver» a `/procedimientos`; 2 columnas (≥`lg`): izquierda categoría, H1 en mayúsculas, descripción corta, texto enriquecido «¿Qué es?» (HTML saneado), «Condiciones médicas compatibles» (si existe), separador y caja «Inicia tu plan.» con botón **SIMULAR FINANCIACIÓN**; derecha imagen principal 3:4 pegajosa (o «IMAGEN EN PRODUCCIÓN»).
**La ficha técnica (anestesia, tiempo quirúrgico, recuperación), el perfil numérico (edad/IMC), la galería y las recomendaciones post/revisión se capturan en el admin y llegan en la respuesta, pero esta plantilla NO los muestra** (solo `condiciones_medicas_compatibles`) [COD].

## Datos y reglas
* SEO del detalle: `seo.meta_title` o `<nombre> | Planmed`; descripción `seo.meta_description` o descripción corta.
* Errores (`publicErrors.ts`): lista vacía = 200; Hub caído/tenant/rechazado/contrato inválido = **503** con `reason`; slug inexistente = **404** (también en SSR).
* Listado con error: `CommonHubUnavailable` («Esta sección no está disponible por ahora», botón REINTENTAR → `refresh()`), HTTP 503 en SSR (`useServiceUnavailable`).
* Detalle con error: `createError 503` ⇒ `error.vue` («No pudimos cargar el contenido», con Reintentar). Inexistente: `createError 404` ⇒ `error.vue` («Esta página no está disponible»).

## Interacciones
| Elemento | Acción | Resultado | Verif. |
|---|---|---|---|
| Tarjeta | clic | detalle | EJ |
| SIMULAR FINANCIACIÓN (detalle) | clic | `/financiacion?procedureId=…#calculadora` | COD |
| REINTENTAR | clic | recarga listado | EJ (estado visible; clic no ejercido) |
| «Volver» | clic | listado | COD |

## Estados
Cargado (EJ), sin imagen (COD), vacío válido (cuadrícula vacía, COD), 503 (EJ), 404 (EJ), móvil (EJ).

## Evidencias
Pruebas: `tests/integration/error-pages.test.ts`, `hub-readonly.test.ts`, `tests/navigation/procedures-menu.test.ts`, `tests/recommendations/server.test.ts`. Dependencia: el menú **PROCEDIMIENTOS** de la barra usa la misma lista (F10).

# F09 · Errores y estados transversales

Capturas: `CAPTURAS/publico/desktop__ruta-inexistente-404.png`, `…__procedimiento-inexistente-404.png`, `…__prp-inexistente-404.png`, `…__estado-hub-caido__*.png`.

## `error.vue` (página de error global)
* Archivo `error.vue` + `utils/siteError.ts` (`describeSiteError`, lógica pura con pruebas). Usa el layout público (menú, pie, chat) para ofrecer las mismas opciones de navegación; `noindex`.
* Estructura: número gigante dorado (`404`…), «Error NNN», H1 (título), mensaje, botones.
* Botones: **Ir al inicio** (siempre) · **Iniciar sesión** (401) · **Ir al panel** (ruta `/admin/**` y no 401) · **Reintentar** (recarga completa de la misma URL; solo 429/502/503/504/5xx) · **Volver atrás** (solo si el referrer es del mismo origen). En desarrollo, `<details>` con detalle técnico.

| Código | Variante | Título | Notas |
|---|---|---|---|
| 404 | not-found | «Esta página no está disponible» | EJ |
| 401 | auth | «Necesitas iniciar sesión» | Reintentar no se ofrece; botón Iniciar sesión |
| 403 | forbidden | «No tienes acceso a esta sección» | En `/admin/**` se permite el **mensaje propio** si pasa una lista blanca de caracteres (p. ej. «Solo el líder de la línea puede acceder a la configuración.») |
| 429/502/503/504 | unavailable | «No pudimos cargar el contenido» | `retry` |
| ≥500 otros | unexpected | «Estamos teniendo dificultades» | `retry` |
| otros 4xx | bad-request | «No pudimos procesar la solicitud» | |

Nunca se muestran trazas ni mensajes técnicos en producción. Pruebas: `tests/site-error.test.ts`, `tests/integration/error-pages.test.ts` (parte omitida por requerir `PLANMED_SITE_URL`; ver `11`).

## Otros estados transversales
| Estado | Dónde | Mecanismo | Verif. |
|---|---|---|---|
| Aviso de Hub caído con reintento | listados públicos | `CommonHubUnavailable` (`role="alert"`, botón REINTENTAR) | EJ |
| HTTP 503 real en SSR | listados | `useServiceUnavailable(error)` | EJ (503 medido) |
| Esqueletos | PRP, simulador, formularios admin | `animate-pulse` / «Cargando…» | COD |
| Menú tolerante a Hub caído | Navbar | `Promise.allSettled`: sin Hub desaparecen Recomendaciones y el desplegable de Procedimientos | EJ (`desktop__estado-hub-caido__inicio.png`) |
| Confirmaciones y avisos | panel | SweetAlert2 (`useNotify`: éxito `toast` 3 s, advertencia 6 s, error modal, confirmación con «Cancelar») | COD |
| Protección al salir con cambios | `/admin/nosotros`, `/admin/paginas/:slug`, histórico | `beforeunload` (+ `onBeforeRouteLeave` en histórico) | COD |
| Sesión vencida | panel | `/api/auth/me` 401 ⇒ redirección a login | EJ (sin sesión → login) |
| Sin permiso (403) en Configuración | `/admin/configuracion` | middleware ⇒ `createError 403` ⇒ `error.vue` | COD/TEST |

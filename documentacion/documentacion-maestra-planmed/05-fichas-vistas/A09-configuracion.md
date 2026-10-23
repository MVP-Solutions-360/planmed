# A09 · Configuración (`/admin/configuracion`)

Capturas: `CAPTURAS/admin/{desktop,movil}__configuracion.png`, `…__configuracion-tasa.png`, `…__configuracion-guia.png`.

| Campo | Valor |
|---|---|
| Archivo | `pages/admin/configuracion/index.vue`; paneles `AdminLineUsersPanel`, `AdminFinancingRatePanel`, `AdminGuide` |
| Acceso | sesión + **middleware** (`admin-auth.global.ts`) que llama `GET /api/admin/config/access` ⇒ 401 login · 403 `error.vue` («Solo el líder de la línea puede acceder a la configuración.») · 503/otro ⇒ 403. El servidor **vuelve a comprobar cada ruta** |
| Menú | el enlace solo se ve si `isAreaLeader || canEditRate` (informativo; no es seguridad) |
| Pestañas | `?tab=` `tasa` o `guia` (sin parámetro = «Configuración»/primera permitida). Patrón WAI-ARIA (flechas, Inicio, Fin) |

## Matriz de permisos de esta pantalla
| Pestaña | Líder de la línea (`is_area_leader` + rol CMS) | Rol de tasa (`NUXT_PLANMED_RATE_EDITOR_ROLE_IDS`, por defecto 19) | Otro rol CMS |
|---|---|---|---|
| Configuración (colaboradores) | ✔ lectura | — | — |
| Tasa de usura | ✔ ver y editar | ✔ ver y editar | — |
| Guía del panel | ✔ | ✔ | (solo si llegan: la pantalla exige acceso previo) |
`canManageFinancingRate` = rol CMS autorizado **y** (líder o rol listado).

## Pestaña «Configuración» — Colaboradores (`LineUsersPanel`)
Solo lectura. Hub `GET /cms/line-users` (empresa y línea salen del token). Búsqueda (nombre/correo), filtro Estado (Todos/Activos/Inactivos), botón Buscar; contador; tabla Colaborador (con insignia de líder), Correo, Rol, Estado; paginación Anterior/Siguiente (`per_page` ≤50). Estados: cargando, 403 ámbar (sin reintento), error con *Reintentar*, vacío («No hay colaboradores que coincidan…»). **No hay alta, edición ni baja de usuarios**: la gestión de usuarios/roles vive en Wellezy Hub.

## Pestaña «Tasa de usura» (`FinancingRatePanel`)
* Muestra **Tasa vigente** (% mensual, 4 decimales), última actualización (zona America/Bogota) y responsable, formulario «Nueva tasa mensual (%)» (placeholder «Ej. 2.0126 (usa punto decimal)»), tabla **Historial de cambios** (tasa, fecha, responsable; origen «ARRANQUE» para el valor inicial; hasta 500 entradas).
* Reglas: punto decimal (la coma se rechaza), máximo 4 decimales, `0 < tasa ≤ 5 %` (guarda técnica, **no** el tope legal); no corrige la entrada; si es igual a la vigente: «La tasa vigente ya es X %.»; confirmación «¿Cambiar la tasa de usura mensual? El simulador pasará de A % a B % mensual para las nuevas cotizaciones.»
* `PUT /api/admin/config/financing-rate {rate, expectedUpdatedAt}`: control de concurrencia (409 ⇒ recarga), escritura atómica en `financing-rate.json` con copia `financing-rate.prev.json`; el archivo se crea con el **valor de arranque 2.0000 %** si no existe (se registra en consola).
* La cotización pública usa siempre la última tasa (`/api/public/financing-rate`, `no-store`); sin tasa legible ⇒ 503 y el simulador no muestra cuota.
* Verif.: EJ (vista con tasa de arranque); guardado por TEST (`tests/financing/rate-store.test.ts`).

## Pestaña «Guía del panel» (`AdminGuide` + `utils/adminGuide.ts`)
Acordeón con una sección por módulo (Procedimientos, Noticias, Nuestros Pacientes, Recomendaciones, Micrositios, Nosotros, Clínicas aliadas, Configuración) con pasos y preguntas frecuentes; contenido estático (`tests/about/guide.test.ts`).

## Estados
Pestañas visibles según permisos (EJ con usuario simulado líder), 403 (COD/TEST), cargando/errores por panel. Móvil: EJ.

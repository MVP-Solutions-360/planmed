# A08 · Micrositios PRP (admin)

Capturas: `CAPTURAS/admin/{desktop,movil}__micrositios-listado.png`, `…__micrositio-nuevo.png`.

| Ruta | Archivo | API | Hub |
|---|---|---|---|
| `/admin/micrositios` | `pages/admin/micrositios/index.vue` | `GET /api/admin/prp?search&is_active&page` | `/prp-referrers` (paginado) |
| `/admin/micrositios/nuevo` · `/:id` | `pages/admin/micrositios/[id].vue` | `POST /api/admin/prp`, `GET/PUT/DELETE /api/admin/prp/:id` | `/prp-referrers[/{id}]` |

Servicio: `PrpService` → `HubPrpProvider` (usa `PrpError` con `fieldErrors`). Pruebas: no hay un archivo dedicado a PRP admin [no encontrado]; cubierto parcialmente por `tests/security/routes.test.ts`.

## Listado
Botón **NUEVO MICROSITIO**; buscador (nombre, código PRP o slug) con *debounce* 350 ms; filtro estado (Todos/Activos/Inactivos); tabla: Nombre, Código PRP, Enlace público (botón copiar `window.location.origin + /prp/<slug>`), Título, Estado (botón activar/desactivar), Acciones (Editar). **Desactivar** pide confirmación («El enlace … dejará de estar disponible y no se podrán recibir nuevos leads…»). Paginación Anterior/Siguiente (muestra solo si `lastPage>1`), estados cargando / error con *Reintentar* / vacío. Todo cargado en cliente (`server:false`).

## Formulario
| Campo | Oblig. | Reglas |
|---|---|---|
| Nombre | ✔ (≤255) | |
| Código PRP | ✔ (≤50, mayúsculas, monoespaciado) | «código del PRP en el CRM médico»; se envía con cada formulario |
| Slug (URL pública) | — (≤255) | `slugify` local solo como vista previa; vacío en creación ⇒ lo genera el backend y resuelve colisiones; al editar avisa que cambiarlo rompe enlaces compartidos |
| Título (≤150) | — | titular del micrositio (ej. «AGENDA TU VALORACION») |
| Activo | casilla | |
Panel «Enlace público» con botón copiar. Errores por campo desde Hub (422) y mensaje general. Al guardar: toast «Micrositio creado/actualizado» y vuelta al listado. **Eliminación**: la API admite `DELETE`, pero **la interfaz no la ofrece** (solo activar/desactivar). Verif.: EJ (vistas con 1 registro simulado).

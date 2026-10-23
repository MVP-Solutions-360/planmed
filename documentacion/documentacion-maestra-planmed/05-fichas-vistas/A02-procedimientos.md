# A02 · Procedimientos (admin)

Capturas: `CAPTURAS/admin/{desktop,movil}__procedimientos-listado.png`, `…__procedimiento-nuevo.png`.

| Ruta | Archivo | API | Hub |
|---|---|---|---|
| `/admin/procedimientos` | `pages/admin/procedimientos/index.vue` | `GET /api/admin/procedures` | `/cms/procedures?per_page=100&page=n` (hasta 20 páginas; filtros `search`, `activo`, `tipo`) |
| `/admin/procedimientos/nuevo` | `pages/admin/procedimientos/[slug].vue` | `POST /api/admin/procedures` | `POST /cms/procedures` + subidas `/{id}/image`, `/{id}/gallery`, `DELETE /{id}/gallery/{asset}` |
| `/admin/procedimientos/:slug` | idem | `GET /:id`, `PUT /:id`, `DELETE /:id` | `/cms/procedures/{id}` |

Layout `admin`; permisos: cualquier sesión con rol CMS (el Hub aplica sus propios permisos y devuelve 403 si faltan).

## Listado
Título, botón dorado **NUEVO PROCEDIMIENTO** (`/admin/procedimientos/nuevo`), buscador local (nombre o categoría), tabla: Procedimiento (miniatura + nombre + descripción corta), Categoría (etiqueta), Estado (insignia Activo/Inactivo + etiqueta Maestro/Propio), **Destacado** (interruptor), Acciones (Editar/Ver, **activar/desactivar**). Estados: cargando, sin resultados, tabla. No hay paginación en la UI (el servidor trae todo), ni ordenamiento.
Acciones: `toggleDestacado` / `toggleActivo` → `PUT` parcial `{destacado}` / `{activo}`; error ⇒ modal «Ocurrió un error». **No hay eliminación real**: DELETE «desactiva» el propio o «deshabilita» el maestro en la línea (el registro se conserva). 

## Formulario (crear/editar) — 3 columnas (`lg`)
**Columna principal**
| Sección | Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|---|
| Información básica | Nombre | texto | ✔ | autogenera slug |
| | Slug (URL) | texto | ✔ | `slugify`; botón «Volver a automático»; al cambiar el de un existente avisa que cambia la URL pública |
| | Categoría (slug) | texto libre | — | **texto libre, no selector** |
| | Descripción corta | textarea | ✔ | |
| | ¿Qué es? | editor enriquecido | ✔ (no vacío) | |
| Ficha técnica | Tipo de anestesia, Tiempo quirúrgico, Tiempo de recuperación | texto | — | |
| | Cicatrización mínima | casilla | — | |
| Perfil del paciente | Edad mínima/máxima, IMC máximo | numérico | — | |
| | Condiciones médicas compatibles | editor | — | |
**Columna lateral**: Visibilidad (casillas *Activo*, *Destacado*), Imagen principal (JPG/PNG/WebP; se optimiza a 1600 px, ≤10 MB; «Subir», «Descartar» la nueva), Galería (hasta **10** nuevas por guardado; quitar existentes marca `galleryRemovals`; las nuevas llevan borde punteado), SEO (Meta Title **solo lectura**: «<nombre> | Planmed»; Meta Description ≤200).
Botón **Guardar Cambios** (cabecera; la plantilla invoca `submitForm` 3 veces): valida que «¿Qué es?» no esté vacío y que haya slug; éxito ⇒ `router.push('/admin/procedimientos')` **sin toast**; error ⇒ modal.

### Procedimientos «maestros» (contenido global del Hub)
`isMaster` ⇒ formulario en **solo lectura** con aviso ámbar; solo se pueden cambiar *Activo* y *Destacado* (botón «Guardar estado»). El Hub responde 403 si se intenta editar contenido.
El servidor además acepta `recomendaciones_post/revision` (HTML de cuidados / cita de revisión) pero **el formulario no los muestra** (se gestionan por Recomendaciones); sin edición desde aquí.

## Estados
Cargando (COD), vacío (COD), 401 ⇒ login, 403/422/503 ⇒ modal con mensaje traducido (`translate`), éxito ⇒ redirección. Edición abre con `onMounted` (cliente): si el slug no existe, redirige al listado. Verif.: EJ listado y formulario nuevo; edición, maestro y guardados **no ejercidos** (el Hub simulado es de solo lectura; sin escrituras reales).
Pruebas: `tests/integration/hub-readonly.test.ts`, `tests/navigation/procedures-menu.test.ts`, `tests/recommendations/server.test.ts` (parcial).

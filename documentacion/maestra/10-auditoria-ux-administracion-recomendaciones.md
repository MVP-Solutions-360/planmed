# 10 · Auditoría funcional y propuesta UX — Administración de Recomendaciones (Planmed)

**Fecha:** 2026-10-13 · **Alcance:** `/admin/recomendaciones` (Planmed web) y su contrato con Wellezy Hub. **Solo diagnóstico: no se implementó ningún rediseño.**
**Etiquetas de evidencia** (como en el [README](README.md)): **[Código]** leído en el repositorio · **[Prueba]** ejecutado · **[No verificado]** no comprobable ahora · **[Propuesta]** no existe, es diseño nuevo · **[Decisión]** requiere decisión antes de implementar.

---

## 1. Resumen ejecutivo

1. La pantalla mezcla **dos modelos de datos distintos** bajo un mismo botón: (a) *páginas de recomendaciones* (`recommendation_pages` en Hub) y (b) el **texto histórico por procedimiento** (`cirugias.recomendaciones_post` / `recomendaciones_revision`). El usuario no ve esa diferencia. [Código]
2. **"GUARDAR CAMBIOS" no es global**: guarda solo el elemento seleccionado. Los cambios hechos en otro elemento quedan en memoria sin guardar y sin ningún indicador. [Código]
3. **Hallazgo de riesgo alto:** el Hub permite *vincular* una página a un procedimiento (`cirugia_id`) y, en la web pública, **una página vinculada publicada (o vinculada y oculta) tiene prioridad sobre el texto histórico**. El panel edita solo el texto histórico y **no puede crear ni mostrar el vínculo**. Si un procedimiento ya tiene página vinculada, editar su "Cuidado de X" en el panel **no cambia la web pública**. [Código — reglas y pruebas]; que existan datos así en la BD real: [No verificado].
4. El error "No tienes permiso…" es un **403 real del Hub**, no visual. Planmed **descarta el mensaje original del Hub** y lo sustituye por un texto genérico, por eso no se sabe qué permiso falta. En el entorno local el diagnóstico concuerda con que al rol del usuario le faltan `recomendaciones.*` (ver §5.1).
5. Sin diseño nuevo de backend se puede mejorar bastante solo en frontend: separar visualmente los dos tipos de contenido, leyenda de estados, acciones explícitas, aviso de cambios sin guardar, búsqueda. Orden manual y vínculo con procedimiento **requieren** exponer en Planmed rutas Nitro que hoy no existen (el Hub ya las tiene).

> **ACTUALIZACIÓN 2026-10-13 (posterior a esta auditoría)** — Estado vigente; el resto del documento conserva el historial y marca como ~~resuelto~~ lo que ya no aplica:
> - ✅ **Configuración restaurada:** `nuxt.config.ts` volvió a `wellezyApiBaseUrl: ''` y `planmedAdminRoleIds: '19'` (decisión A). El Hub y los roles se leen de `NUXT_WELLEZY_API_BASE_URL` / `NUXT_PLANMED_ADMIN_ROLE_IDS`.
> - ✅ **Pruebas:** `npm test` → **132/132**; `npm run typecheck` → correcto.
> - ✅ **MySQL local disponible** (MariaDB 10.4.32, BD `wellezy_pd_copy`, `APP_ENV=local`). La BD **sigue sin migrar** (13 migraciones pendientes) y con `patient_section_settings` a medias: ver doc 11 §0 y el informe de recuperación entregado en esa fase.
> - ⏳ Sigue vigente: el 403 local se debe a que faltan los permisos `recomendaciones.*` (no existen aún) y la tabla `recommendation_pages`.

> **Cambios previos de esta sesión** *(histórico; el punto (b) quedó ~~resuelto~~: ver actualización)* (hechos antes de esta auditoría, sin commit): (a) `pages/admin/recomendaciones/index.vue` ahora captura errores de carga y muestra el aviso rojo (antes se quedaba en "Cargando…" para siempre); (b) ~~`nuxt.config.ts` ahora elige el Hub según modo (dev/prod); rompe una prueba de guarda~~ — **revertido** el 2026-10-13.

---

## 2. Arquitectura y flujo actual

### 2.1 Página y componentes [Código]

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Página admin (todo en un solo SFC) | `pages/admin/recomendaciones/index.vue` | Lista lateral, editor de página, editor de texto de procedimiento, crear/eliminar, guardar. `definePageMeta({ layout: 'admin' })`. |
| Editor enriquecido | `components/admin/RichTextEditor.vue` (`<AdminRichTextEditor>`) | Contenido HTML de página o de procedimiento. |
| Notificaciones | `useNotify()` + SweetAlert2 | Avisos y confirmación de eliminar / diálogo "Nueva página". |
| Servicio de páginas | `services/RecommendationsService.ts` → `providers/HubRecommendationsProvider.ts` | `getPages / savePage / createPage / deletePage` vía rutas Nitro internas. |
| Servicio de procedimientos | `services/ProcedureService.ts` → `HubProcedureProvider` | Lista y actualiza el texto por procedimiento. |
| Tipos y constantes | `types/recommendations.ts`, `utils/recommendationKinds.ts` | `RecommendationPage`, grupos y textos de etiqueta (`Cuidado de X`, `Revisión X`). |
| Lado público (no se edita aquí) | `pages/recomendaciones/[slug].vue`, `cuidados/*`, `revision/*`, `components/recommendations/*`, `utils/recommendationSource.ts` | Muestran lo publicado. |

No hay componentes hijos propios: la lógica de la pantalla vive entera en el SFC.

### 2.2 Flujo de datos [Código]

```
Navegador (index.vue)
  └─ recommendationsService / procedureService (useRequestFetch, cookie de sesión)
       └─ Nitro  /api/admin/recommendations*   y   /api/admin/procedures*
            └─ adminSession(): assertSameOrigin + cookie planmed-admin (Bearer de Hub, nunca llega al navegador)
                 └─ Hub  /api/cms/recommendation-pages*   y   /api/cms/cirugias*(procedimientos)
```

Carga inicial (`onMounted`): `Promise.allSettled([getPages(), getProcedures()])`. Selecciona la primera página si existe.

### 2.3 Operaciones

| Acción en UI | Método y ruta Planmed | Hub | Notas |
|---|---|---|---|
| Listar páginas | `GET /api/admin/recommendations` | `GET /cms/recommendation-pages` (policy `viewAny` → `recomendaciones.ver`) | Sin paginación; `ordered()` por `orden`. |
| "+ Agregar" | `POST /api/admin/recommendations` `{title, group}` | `POST` (`recomendaciones.crear`) | Hub genera el slug del título (`-2`, `-3` si choca) y la crea **oculta**. |
| Guardar página | `PUT /api/admin/recommendations/{slug}` | `PUT /{id}` (`recomendaciones.editar`) | Envía título, etiqueta de menú, video, contenido, publicado. Imagen solo si cambió (data URL → multipart `POST /{id}/image`; `''` → `DELETE /{id}/image`). |
| Publicar/ocultar | El interruptor modifica `published` en memoria; **se aplica al pulsar Guardar** | idem PUT | No hay acción inmediata de publicar. |
| Eliminar | `DELETE /api/admin/recommendations/{slug}` | `DELETE` (`recomendaciones.eliminar`) | Solo páginas `custom`; las base → 403 ("ocúltalas"). |
| Guardar texto de procedimiento | `PUT /api/admin/procedures/{id}` (campo `recomendaciones_post` o `_revision`) | `PUT` de cirugías (`cirugias.editar`) | Vacío se envía como `''` (Hub lo guarda `null`) → el procedimiento deja de aparecer en el submenú. Maestros del Hub no editables (`editable === false`). |

Cómo se guarda: **por elemento seleccionado**, con el botón superior. La función `save()` decide: si hay `currentPage` guarda página; si no, procedimiento. [Código]

Identificación: las páginas se identifican por **slug** en el navegador (Nitro lo resuelve al **id** de Hub leyendo la lista completa en cada operación: `hubPageBySlug`); los procedimientos por slug en la UI y por id en Hub. [Código]

Orden: el Hub tiene columna `orden` y `POST recommendation-pages/reorder`; Planmed **no tiene ruta ni UI de reordenar** (listado de `server/api/admin/recommendations/` = `index.get/post`, `[slug].put/delete`). Al crear, Hub asigna `max(orden)+1`. El orden visible es el de Hub. [Código]

---

## 3. Modelo de datos real

### 3.1 Página de recomendaciones — tabla Hub `recommendation_pages` [Código: migraciones `2026_10_09_100300` y `…100600`]

| Campo Hub | ¿Lo maneja el panel hoy? | Detalle |
|---|---|---|
| `id` | No (usa slug) | |
| `company_id`, `linea_id` | No (Hub los deriva del token) | Planmed nunca los envía (prueba estática). |
| `slug` (único por línea) | Solo lectura | Hub lo genera al crear; en páginas base es inmutable; Planmed no envía `slug` al editar aunque Hub lo aceptaría en páginas custom. |
| `grupo` (`general`/`cuidados`/`revision`) | Se fija al crear; no se edita después | |
| `cirugia_id` (nullable) → **procedimiento vinculado** | **No.** Se recibe como `procedureSlug` en el DTO pero la UI no lo muestra ni permite fijarlo | Único por (`linea`, `cirugia`, `grupo`). Solo grupos `cuidados`/`revision`. |
| `menu_label` | Sí (en páginas `custom` se iguala al título al guardar) | |
| `title` | Sí | |
| `video_url` | Sí (solo YouTube, validado en cliente y Hub) | |
| `content` (HTML, sanitizado por Hub) | Sí | |
| imagen (`mediaAssets`, categoría `image`) | Sí (≤5 MB en Hub; el cliente valida 10 MB — ver §5.3) | |
| `orden` | **No** | |
| `published` | Sí (interruptor + Guardar) | |
| `is_custom` | Solo lectura (`custom`) | `false` = páginas base sembradas, no se eliminan. |
| `created_by`, timestamps | No | |

**Qué es cada cosa en la práctica**
- *Recomendación general*: página independiente (`grupo = general`, `cirugia_id = null`). Las dos base: `cita-preanestesia`, `prequirurgicas`. [Código: `RECOMMENDATION_SLUGS`]
- *Cuidado de cirugía / revisión* aparece en la UI por **dos orígenes distintos**:
  1. una fila por cada **procedimiento** de la lista, cuyo contenido es el texto histórico (`recomendaciones_post` / `recomendaciones_revision`);
  2. además, cualquier **página** del grupo `cuidados`/`revision` (creada con "+ Agregar" en ese grupo o vinculada desde otro cliente del Hub) se lista aparte.
  Nada en pantalla explica la diferencia entre 1 y 2.

### 3.2 Texto histórico por procedimiento
`Procedure.recomendaciones_post` y `recomendaciones_revision` (HTML; los datos antiguos de `post` pueden ser una lista y se muestran escapados — la lectura no los reescribe). Un procedimiento sin texto no aparece en el menú público. [Código]

### 3.3 Regla de precedencia pública (por procedimiento y tipo) [Código + Prueba: `listings-and-source.test.ts`]

| Hub informa `fuente` | Qué ve el público |
|---|---|
| `pagina` (vinculada y publicada) | La página (**el histórico se ignora**) |
| `pagina_oculta` (vinculada y despublicada) | Nada (**el histórico NO reaparece**) |
| `historico` | El texto del procedimiento |
| `ninguna` | Nada |

→ Esto es lo que vuelve ambigua la edición del texto de procedimiento desde el panel (§1.3).

---

## 4. Endpoints y permisos implicados

| Operación | Permiso Hub exigido | Verificado en |
|---|---|---|
| Ver/listar páginas | `recomendaciones.ver` (`viewAny`) | `RecommendationPagePolicy` → `LineOwnedContentPolicy` |
| Crear | `recomendaciones.crear` | idem |
| Editar, subir/quitar imagen, reordenar | `recomendaciones.editar` (+ pertenencia a la línea vía `LineContext::sees`) | controlador (`reorder` usa `hasPermission` directo) |
| Eliminar | `recomendaciones.eliminar` + página `custom` | controlador (`abort_unless(is_custom, 403)`) |
| Editar texto de procedimiento | `cirugias.editar`; maestros: no editables | Hub / `editable` en DTO |
| Entrar al panel Planmed | rol principal ∈ `NUXT_PLANMED_ADMIN_ROLE_IDS` | `server/utils/auth.ts` (`isAuthorizedUser`) |

En Planmed **no hay ninguna comprobación de permisos en el frontend**: el menú lateral no se filtra por permiso y los botones no se deshabilitan según lo que el usuario puede hacer. [Código] La única autoridad es el Hub; el error aparece solo cuando se intenta la operación.

---

## 5. Problemas concretos

### 5.1 El error de permisos (traza completa) [Código]
1. En la captura, la **lista de procedimientos se cargó** (el panel muestra "Cuidado de Abdominoplastia Planmed", etc.) pero **ninguna página** → la petición fallida es `GET /api/admin/recommendations`. (Inferencia por lo que se ve; la petición en sí no se capturó.)
2. Nitro → `hubRecommendations()` → Hub responde 403 → `translate()` (`server/utils/news.ts:106`) lanza `authError(403, MSG_FORBIDDEN)` con el texto fijo **"No tienes permiso para realizar esta acción."** (`news.ts:10`). **El mensaje real del Hub se descarta**, por eso no distingue "falta `recomendaciones.ver`" de otra causa. (La mejora ya figura en la memoria del proyecto como propuesta no implementada.)
3. Antes de mi corrección, ese error escapaba de `onMounted` sin captura y la pantalla se quedaba en **"Cargando…" indefinidamente**; ahora se muestra en el aviso rojo.
4. **Causa concordante en el entorno local** [Código + consulta de solo lectura hecha antes en esta sesión]: BD local `wellezy_pd_copy`; Estefania Montoya (usuario 32) tiene los roles 18 y 19; el rol 19 solo tenía `blog.*` y `cirugias.*`; los permisos `recomendaciones.*` y `pacientes_web.*` **no existían** en esa BD y las 8 migraciones del 9-oct figuraban pendientes. → `Gate::authorize('viewAny')` niega.
5. **No es autenticación** (la sesión es válida: se ve su nombre y la lista de procedimientos) **ni un fallo visual**. Es una negativa de autorización del Hub. Otras causas posibles de 403 (resolución del contexto de línea) **[No verificado]**.
6. ~~**Estado actual de la BD local [No verificado]:**~~ *(resuelto: MySQL volvió; ver actualización y doc 11 §0)* un intento de `migrate` (autorizado antes de esta tarea) se interrumpió por caída de MySQL; ahora MySQL local rechaza conexiones. Las migraciones pueden haber quedado a medias. No se tocó nada desde entonces.

### 5.2 Usabilidad (verificado en código)

| # | Problema | Evidencia |
|---|---|---|
| U1 | Un solo botón "GUARDAR CAMBIOS" parece global pero guarda solo el elemento abierto; no hay indicador de "cambios sin guardar"; al cambiar de selección los datos editados quedan en memoria (se editan los objetos de la lista con `v-model`) sin guardar ni avisar. | `save()`, `v-model="currentPage.*"` |
| U2 | Publicar/ocultar es un interruptor que **no surte efecto hasta Guardar**; el texto de ayuda lo dice, pero la lista lateral cambia de color de inmediato (el punto refleja el estado *no guardado*). | `p.published` en la lista |
| U3 | Los puntos de color: **sí tienen semántica definida** (verde = publicada/con texto; gris = oculta/sin texto) pero se explican solo con un `title` (tooltip) y una nota al **final** de un panel largo; en una lista con muchos procedimientos la leyenda queda fuera de vista. | plantilla del `<aside>` |
| U4 | Dos orígenes de datos para "cuidados/revisión" sin explicar (§3.1) y posible **duplicado** de un mismo procedimiento (fila de procedimiento + página vinculada). | listas `procedures` y `pagesOf(g.key)` |
| U5 | Editar el texto de un procedimiento con página vinculada no cambia la web (§1.3). El panel no informa de la fuente efectiva. *(Corrección 2026-10-13: `fuente` solo existe en la API pública del Hub; el recurso CMS de procedimientos NO la entrega — ver doc 11.)* | `fromRecommendationSources` |
| U6 | "+ Agregar" en Cuidados/Revisión crea una **página independiente** (sin vínculo); no se puede elegir procedimiento. | `pickCreateBody` solo envía `title` y `grupo` |
| U7 | El slug no se ve ni se puede cambiar; no se muestra la URL pública de la página. | — |
| U8 | Sin búsqueda ni filtros: la lista de procedimientos es larga (captura) y se mezcla con páginas. | — |
| U9 | Sin vista previa del resultado público ni enlace "Ver en la web". | — |
| U10 | Procedimientos maestros no editables se listan igual; el aviso solo aparece al abrirlos. | `editable === false` |
| U11 | El mensaje de permisos no dice qué falta ni qué hacer (§5.1). | `translate()` |
| U12 | Eliminar una página `custom` es permanente; el texto "no se puede deshacer" ya está. Las páginas base no se eliminan (solo ocultar) pero el botón simplemente no aparece: no se explica. | `v-if="currentPage.custom"` |

### 5.3 Otros riesgos técnicos detectados
- **Tamaño de imagen:** el cliente valida 10 MB (`onImage`), el Hub acepta 5 MB (`max:5120`) y Nitro `dataUrlToBlob` 5 MB. Se mitiga con `fileToOptimizedDataUrl` (no inspeccionado en esta auditoría) **[No verificado]**: un archivo de 6–10 MB podría pasar el cliente y fallar con 422.
- **Cada operación sobre una página lee la lista completa** para resolver slug → id (sin paginar). Aceptable con pocas páginas.
- **Sin control de concurrencia:** dos administradores pueden sobrescribirse (PUT parcial por campo, último gana). [Código]

---

## 6. Propuesta de diseño y flujo de trabajo — **[Propuesta]** salvo que se indique

### 6.1 Estructura
1. **Dos pestañas explícitas**, con una frase que explica cada una:
   - **"Páginas de recomendaciones"** (generales; `grupo = general`): tabla con *Título · Menú · Estado · Imagen/Video · Acciones*.
   - **"Cuidados y revisión por procedimiento"**: tabla con una fila por procedimiento y columnas *Procedimiento · Cuidados (estado) · Revisión (estado) · Fuente publicada*. Cada celda abre el editor de ese tipo.
2. **Estados con texto, no solo color** (insignias): `Publicada`, `Oculta`, `Sin texto`, `Con texto`, y la **fuente efectiva** (`Página vinculada` / `Texto del procedimiento` / `Página oculta`). Leyenda visible en la cabecera de la tabla.
3. **Editor en panel/páginas separadas** con campos agrupados: *Contenido* (título, texto), *Medios* (imagen, video), *Publicación* (estado, URL pública).
4. **Acciones separadas y rotuladas:** `Guardar borrador` (guarda sin cambiar estado), `Publicar` / `Ocultar` (acción propia con confirmación y resultado), `Eliminar` (solo `custom`, con confirmación). Un indicador "Cambios sin guardar" y confirmación al salir.
5. **Búsqueda** por título/procedimiento y filtro por estado, **solo si** el volumen lo justifica (hoy la lista de procedimientos ya es larga: justifica una búsqueda simple).
6. **Vista previa**: botón "Ver en la web" (URL pública conocida: `/recomendaciones/<slug>`, `/recomendaciones/cuidados/<procedimiento>`, `/revision/<procedimiento>`), y vista previa del HTML con los estilos públicos como segunda fase.

### 6.2 Tabla problema → solución → qué requiere

| Mejora | Resuelve | Frontend | API Planmed (Nitro) | Hub / BD |
|---|---|---|---|---|
| Pestañas General / Por procedimiento | U4, U8 | Reorganizar `index.vue` en componentes | — | — |
| Insignias de estado + leyenda visible | U3, U2, U10 | Sí | — | — |
| Indicador de cambios sin guardar + aviso al cambiar | U1 | Sí (estado "dirty" por elemento) | — | — |
| Botones Guardar / Publicar / Ocultar / Eliminar separados | U2, U12 | Sí (Publicar = `PUT` parcial con solo `published`; **ya soportado** por Nitro y probado) | — | — |
| Mostrar fuente efectiva por procedimiento | U5 | Sí, **derivándola en el cliente** cruzando procedimientos con páginas vinculadas (el CMS no entrega `fuente`; ver doc 11) | — | — |
| Mensaje de permisos informativo | U11 | Mostrar | Propagar el mensaje del Hub en `translate()` para 403 (cambio de utilidad compartida con Noticias/PRP: ver riesgos) | Opcional: permiso concreto en el mensaje |
| Búsqueda/filtros | U8 | Sí | — | — |
| URL pública + "Ver en la web" | U7, U9 | Sí | — | — |
| **Crear/ver vínculo página ↔ procedimiento** | U4, U5, U6 | Selector de procedimiento | **Nuevo:** `pickCreateBody/pickPageBody` deben aceptar `cirugia_id`/slug (hoy no lo envían) | Ya existe `cirugia_id` + validaciones |
| **Reordenar páginas** | orden fijo | Arrastrar/subir-bajar | **Nuevo:** ruta `POST /api/admin/recommendations/reorder` | Ya existe `reorder` |
| **Editar slug de páginas custom** | U7 | Campo con advertencia | **Nuevo:** enviar `slug` | Ya lo acepta (custom) — **riesgo de enlaces rotos** |
| Vista previa fiel | U9 | Renderizar HTML con estilo público | — | — |
| Control de concurrencia (`updated_at` / ETag) | §5.3 | Enviar versión | Propagar | **Nuevo** en Hub |
| Unificar "texto histórico" y "página vinculada" en un solo concepto | U4, U5 | Migrar UI | Nuevo flujo | **[Decisión]**: migración de datos de `cirugias.recomendaciones_*` a páginas vinculadas (no se propone ejecutarla ahora) |

---

## 7. Qué se resuelve solo en frontend y qué exige backend

- **Solo frontend (sin riesgo para datos):** pestañas, insignias y leyenda, aviso de cambios sin guardar, separación Guardar/Publicar/Ocultar (reutiliza el `PUT` parcial existente), búsqueda/filtros, URL pública, mostrar la fuente efectiva, manejo de errores de carga (ya parcialmente hecho).
- **Requiere cambios en Nitro (Planmed), sin tocar el Hub:** reordenar, vincular a procedimiento, editar slug, propagar el mensaje real del Hub en 403.
- **Requiere Hub/BD:** control de concurrencia, cualquier unificación del modelo histórico/vinculado, nuevos permisos.
- **Dependiente de datos/permisos, no de código:** que Estefania pueda usar la pantalla exige que el Hub tenga los permisos `recomendaciones.*` asignados a su rol (en local, además, aplicar migraciones pendientes — ver §5.1.6). Esto no se modificó.

---

## 8. Pruebas

### 8.1 Existentes [Código; histórico: el 13-oct, antes de la corrección, `npm test` daba 131/132; **tras restaurar `nuxt.config.ts`: 132/132** — **[Prueba]**]
`tests/recommendations/`: `providers.test.ts` (proveedor admin/público, errores 401/403/404/422), `server.test.ts` (mapeos, rutas admin Nitro→Hub: crear, publicar/despublicar, editar con imagen, eliminar base→403, slug inválido→404, 401 sin sesión, rutas públicas), `errors-precedence.test.ts` (503 vs 404, reglas R1–R4), `listings-and-source.test.ts` (listados públicos, fuente de recomendación por procedimiento), `static.test.ts` (sin mocks, SSR, tokens fuera del navegador, **URLs del Hub sin hardcodear**).

> ~~**La prueba que falla es consecuencia de mi cambio en `nuxt.config.ts`**~~ *(RESUELTO: la configuración se restauró y la prueba pasa)* — texto original: (primer turno): `static.test.ts:112` («las URLs del Hub salen de la configuración del entorno, nunca hardcodeadas») prohíbe `localhost`/`wellezy` en `nuxt.config.ts` y exige `wellezyApiBaseUrl: ''`. Mi valor por defecto por modo la incumple. **No se corrigió** (restricción de esta tarea). Ver decisión D1.
> **No existen pruebas de la pantalla admin** (`pages/admin/recomendaciones/index.vue`): ninguna cubre el comportamiento de la UI. [Código]

### 8.2 Necesarias antes/durante un rediseño
1. Pruebas de componente/lógica de la UI: carga con fallo parcial (páginas 403 + procedimientos OK), estado "dirty", guardado por elemento, publicar/ocultar sin enviar otros campos.
2. Contrato Nitro: `403` propaga el mensaje del Hub (si se decide); el cambio en `translate()` no altera Noticias/PRP (pruebas existentes de `tests/` de noticias).
3. Contrato de vínculo: crear/editar con `cirugia_id`, duplicado `(procedimiento, tipo)` → 422, procedimiento de otra línea → 422.
4. Regla de precedencia vista desde el admin: la UI debe reflejar `fuente` (`pagina`/`pagina_oculta`/`historico`/`ninguna`).
5. Reordenar: orden estable, solo de la línea propia.
6. Regresión de slug: las páginas base no cambian de slug; slug custom editado no deja la ruta pública rota (404 esperado y avisado).
7. E2E manual/automatizado con un usuario **con** y **sin** `recomendaciones.*` (esperado: pantalla útil / mensaje claro).

---

## 9. Riesgos de contenido

| Riesgo | Causa | Mitigación propuesta |
|---|---|---|
| Perder contenido sin guardar | U1 (cambios en memoria sin indicador) | Indicador + aviso al salir/cambiar |
| Editar el texto equivocado y ver que "no cambia la web" | §3.3 | Mostrar la fuente efectiva y avisar |
| Cambiar slug y romper enlaces/menú | Hub permite slug en custom; la web enlaza por slug | No exponer slug hasta decidir; si se expone, advertir y mantener redirección |
| Ocultar sin querer una página base | Interruptor sin confirmación + Guardar | Acción "Ocultar" explícita con confirmación |
| Eliminar contenido | `DELETE` permanente de páginas custom | Confirmación (existe); considerar "Ocultar" como acción recomendada |
| Vaciar el texto de un procedimiento | Vacío se guarda como `null` → desaparece del menú | Avisar antes de guardar vacío |
| Sobrescritura entre administradores | Sin control de versión | Fase backend |
| Modificar accidentalmente el público | Publicar y Guardar acoplados | Separar acciones |
| Romper relación con procedimientos | Eliminar procedimiento → `nullOnDelete`: la página queda independiente | Informar en la UI |

---

## 10. Plan de implementación incremental (por riesgo y valor)

| Fase | Contenido | Riesgo | Valor | Requiere |
|---|---|---|---|---|
| 0 | **Desbloqueo de datos:** permisos `recomendaciones.*` (y migraciones pendientes) en el entorno local/real, **por decisión del equipo** | Medio (datos) | Alto | Hub/BD — fuera de esta auditoría |
| 1 | Aviso de cambios sin guardar; leyenda de estados visible; insignias con texto; mensaje de error de carga claro | Bajo | Alto | Solo frontend |
| 2 | Pestañas "Páginas" / "Por procedimiento"; búsqueda; mostrar fuente efectiva y URL pública | Bajo | Alto | Solo frontend |
| 3 | Separar `Guardar` / `Publicar` / `Ocultar` / `Eliminar` | Bajo-medio | Alto | Frontend (usa PUT parcial existente) |
| 4 | Propagar el mensaje real del Hub en 403 | Medio (utilidad compartida con Noticias/PRP) | Medio | Nitro + pruebas de regresión |
| 5 | Vincular página ↔ procedimiento desde el panel; reordenar | Medio | Alto | Nitro nuevo (el Hub ya lo soporta) |
| 6 | Vista previa fiel; editar slug (si se decide) | Medio-alto | Medio | Frontend/Nitro; decisión de enlaces |
| 7 | Unificar histórico/vinculado; control de concurrencia | Alto | Alto | Hub + migración de datos |

---

## Decisiones necesarias antes de implementar

- ~~**D1 — Prueba rota por `nuxt.config.ts`:**~~ **RESUELTA (opción A: revertir a `''`).** Texto original: ¿ajustar la prueba para permitir el valor por defecto por modo, o volver a `wellezyApiBaseUrl: ''` y usar solo `.env`/variables (con el riesgo de que PD sin `.env` no tenga Hub)? Mi recomendación: ajustar la prueba (la intención era "nada de URLs del Hub en el código del cliente/servidor"; el valor por modo es de runtime privado).
- **D2 — Modelo de "cuidados por procedimiento":** ¿se mantiene el texto histórico, se migra a páginas vinculadas, o se convive mostrando la fuente efectiva (opción segura, fase 2)?
- **D3 — Permisos:** ¿qué rol debe tener `recomendaciones.*`? (el rol "Administrador de contenido de línea" del seeder los prevé; en local ni existen los permisos). ¿Se aplican las migraciones pendientes de la BD local, y se revisa el estado tras la caída de MySQL?
- **D4 — Slug editable:** ¿se expone o se mantiene inmutable?
- **D5 — Mensaje de 403:** ¿se propaga el mensaje del Hub (afecta a Noticias/PRP) o se hace solo para Recomendaciones?
- **D6 — Orden manual de páginas:** ¿se necesita? (hoy el orden lo fija Hub al crear).
- **D7 — Vista previa:** ¿enlace "Ver en la web" (fácil) o previsualización integrada (fase posterior)?

## Archivos inspeccionados

Planmed: `pages/admin/recomendaciones/index.vue`, `services/RecommendationsService.ts`, `services/ProcedureService.ts`, `providers/HubRecommendationsProvider.ts`, `types/recommendations.ts`, `utils/recommendationKinds.ts`, `server/api/admin/recommendations/*`, `server/api/admin/procedures/[id].put.ts`, `server/utils/recommendations.ts`, `server/utils/news.ts` (`translate`, `adminSession`), `server/utils/auth.ts`, `server/utils/wellezy.ts`, `server/utils/procedures.ts`, `nuxt.config.ts`, `tests/recommendations/*`.
Hub (solo lectura): `routes/api.php`, `app/Http/Controllers/Api/Cms/RecommendationPageController.php`, `app/Policies/RecommendationPagePolicy.php`, `app/Policies/LineOwnedContentPolicy.php`, `database/migrations/2026_10_09_1003*, 1005*, 1006*`, `database/seeders/ContentAdminRoleSeeder.php`; consultas de lectura previas a la BD local (usuario 32, roles, permisos, estado de migraciones).

# 11 · Plan técnico — Rediseño de la administración de Recomendaciones (Planmed)

**Fecha:** 2026-10-13 · **Estado:** PLAN, pendiente de aprobación. No se ha modificado ningún archivo funcional.
**Base:** [doc 10](10-auditoria-ux-administracion-recomendaciones.md). Etiquetas: **[Código]** verificado leyendo código · **[Prueba]** ejecutado · **[No verificado]** · **[Nuevo]** no existe hoy · **[Decisión]**.

---

## 0. Estado actual (actualizado 2026-10-13)

- ✅ **Pruebas:** `npm test` → **132/132**; `npm run typecheck` → correcto. **[Prueba]**
- ✅ **Configuración restaurada** (decisión A): `nuxt.config.ts` con `wellezyApiBaseUrl: ''` y `planmedAdminRoleIds: '19'`; el Hub y los roles vienen de `NUXT_WELLEZY_API_BASE_URL` y `NUXT_PLANMED_ADMIN_ROLE_IDS` (en PD, como variables del proceso). Se resolvió así el fallo de `static.test.ts:112` (histórico: lo causó el default por modo que yo había añadido; el invariante «sin URLs del Hub en el código» era deliberado).
- ✅ **MySQL local disponible** (MariaDB 10.4.32). Su log muestra una *recuperación tras apagado no limpio* (páginas recuperadas del doublewrite buffer).
- ⚠ **BD local `wellezy_pd_copy` sin migrar:** 13 migraciones pendientes y `patient_section_settings` creada a medias (le faltan `UNIQUE(linea_id)` e índice `(company_id, linea_id)`; 0 filas). La **fase 0 de este plan ya no es la prueba rota**: pasa a ser *«recuperar la BD local»* (procedimiento propuesto en el informe de recuperación; requiere autorización explícita).
- ⏳ Sin tabla `recommendation_pages`, sin permisos `recomendaciones.*` y sin columna `cirugias.recomendaciones_revision`, **no hay páginas vinculadas que inspeccionar** localmente; solo existen 2 procedimientos propios de la línea con texto histórico de cuidados.

**Corrección a la auditoría (doc 10):** afirmé que el DTO de procedimientos del admin ya traía la *fuente efectiva* (`fuente`). **Es falso para el admin**: `fuente` solo la entrega la API pública del Hub (`CirugiaDetailResource`); el recurso CMS (`CirugiaResource`) y `fromCms` no la incluyen. La fuente efectiva en el panel hay que **derivarla en el cliente** (§6). Ya corregí las dos frases en el doc 10.

---

## 1. Árbol de componentes propuesto

Hoy todo vive en un SFC de ~270 líneas. Propuesta (nombres tentativos; directorio nuevo `components/admin/recommendations/`):

```
pages/admin/recomendaciones/index.vue          ← orquestador delgado: carga, pestañas principales, estado global de datos
├─ RecommendationsTabs                         ← barra de pestañas (mismo markup que testimonios: border-b-2 / uppercase)
│
├─ [pestaña 1] GeneralPagesPanel
│   ├─ PageList                                ← lista de páginas generales (tabla/lista con insignias de estado)
│   │   └─ StatusBadge                         ← "Publicada / Oculta" con texto (compartido)
│   └─ PageEditor                              ← formulario de UNA página
│       ├─ EditingBanner                       ← "Editando: <título> · Fuente: página general · /recomendaciones/<slug>"
│       ├─ PublicationControl                  ← estado + "Ver en la web"
│       ├─ MediaFields                         ← video YouTube + imagen
│       ├─ (AdminRichTextEditor)               ← reutilizado
│       └─ SaveBar                             ← "Guardar «<título>»" + estado de guardado/errores
│
└─ [pestaña 2] ProcedureContentPanel
    ├─ ProcedurePicker                         ← buscador + lista de procedimientos (filtro local por nombre)
    │   └─ ProcedureRow                        ← nombre + 2 insignias: Cuidados / Revisión (estado de fuente)
    └─ ProcedureContentEditor                  ← aparece al elegir procedimiento
        ├─ ProcedureHeader                     ← nombre, maestro/propio, enlace al procedimiento
        ├─ SubTabs  [Cuidados | Citas de revisión]   ← pestañas internas (NO principales)
        └─ KindEditor (uno por tipo activo)
            ├─ SourceNotice                    ← explica la fuente efectiva y qué se está editando
            ├─ LinkedPageEditor                ← si existe página vinculada (reusa PageEditor)
            ├─ HistoricTextEditor              ← si la fuente es texto histórico
            ├─ UnlinkedGroupPages              ← páginas grupo cuidados/revisión sin procedimiento (§7, "sin asociación")
            └─ SaveBar
```

Composables **[Nuevo]**: `useRecommendationsAdmin()` (carga con `allSettled`, errores por fuente), `useDirtyTracker()` (copia de referencia por elemento → "cambios sin guardar"), `deriveRecommendationSource()` (función pura en `utils/`, §6).
Tipos: ampliar `RecommendationPage` con `order` y `procedureName` (ver §5, ambos ya los entrega el Hub y hoy se descartan).

---

## 2. Flujo: recomendaciones generales (pestaña 1)

Alcance = páginas con `group === 'general'` y `procedureSlug == null`. **[Código]**

**Crear**
1. "+ Nueva página" → diálogo (SweetAlert, ya existe) pide **solo título** (es lo único que el backend acepta al crear: `pickCreateBody` = `title` + `group`).
2. `POST /api/admin/recommendations` → Hub genera slug y la crea **oculta**. Se selecciona automáticamente.
3. Aviso: «Página creada. Está *oculta* hasta que la publiques.»

**Editar**
1. Elegir en la lista. El banner indica *qué* se edita y su URL pública.
2. Campos reales: título, etiqueta de menú (solo páginas `custom` se igualan al título hoy), video YouTube, imagen, contenido, publicada. **El slug se muestra solo como texto fijo** (decisión 3).
3. Botones separados (lo que el backend admite): **Guardar «título»** (PUT con campos), **Publicar/Ocultar** (PUT parcial `{published}`; ya soportado y probado), **Eliminar** (solo `custom`, confirmación; las base: texto «Las páginas base no se eliminan; puedes ocultarlas»).
4. Indicador «Cambios sin guardar» por página; aviso al cambiar de elemento/pestaña con cambios pendientes.
5. Resultado: «Guardado a las HH:MM» o el error **real** (§7).

---

## 3. Flujo: contenido por procedimiento (pestaña 2)

1. **Buscar/elegir procedimiento**: caja de búsqueda con filtrado en el cliente (nombre; la lista ya está completa en memoria — `getProcedures()` sin paginar en el panel actual **[Código]**; si en el futuro se pagina, usar `?search=` que el Hub ya soporta **[Código: `ProcedureController::index`]**). Cada fila muestra dos insignias (Cuidados / Revisión) con la fuente efectiva derivada.
2. Al elegir, `ProcedureContentEditor` muestra sub-pestañas **Cuidados** y **Citas de revisión**, con la insignia de estado en cada una.
3. Dentro de cada sub-pestaña, según la **fuente derivada** (§6):
   - **Página vinculada publicada** → se edita *esa página* (es la publicada). El texto histórico se muestra **solo lectura, colapsado**, rotulado «Texto histórico (no se publica mientras exista la página vinculada)».
   - **Página vinculada oculta** → aviso destacado: «Hay una página vinculada *oculta*: hoy **no se muestra nada** en la web y el texto histórico tampoco». Se edita la página; publicarla la hace visible.
   - **Solo texto histórico** → se edita el texto del procedimiento (`PUT procedures/{id}`), rotulado «Texto del procedimiento (fuente actual)». Si el procedimiento es **maestro** (`editable === false`): solo lectura con aviso.
   - **Ninguna** → estado vacío con explicación. **Crear página vinculada** queda fuera de la primera entrega (requiere Nitro nuevo, §5); mientras tanto se permite escribir el texto histórico (comportamiento actual).
4. Acciones por tipo: **Guardar** (sobre la fuente que se está editando) y, si es página, **Publicar/Ocultar**.
5. Cada sub-pestaña guarda **solo su contenido**; la barra de guardado dice exactamente cuál («Guardar *Cuidados de Abdominoplastia*»).

---

## 4. Reutilización

| Existe | Reutilizar | Nota |
|---|---|---|
| `AdminRichTextEditor` | Sí, tal cual | |
| `recommendationsService` / `HubRecommendationsProvider` | Sí | Tienen `getPages/savePage/createPage/deletePage`. `savePage` envía todos los campos; añadir un método `setPublished(slug, bool)` que envíe solo `{published}` (Nitro ya lo soporta). |
| `procedureService` | Sí | `updateProcedure(slug, {recomendaciones_post|revision})`. |
| `RECOMMENDATION_KINDS` (`utils/recommendationKinds.ts`) | Sí | Etiquetas «Cuidado de X», «Revisión X». |
| `resolveRecommendation` (`utils/recommendationSource.ts`) | **Referencia/espejo** | Es la regla pública (usa `fuente` del Hub). El panel necesita su equivalente derivado; se prueba contra ella (§8). |
| `useNotify`, SweetAlert, estilos `.field`/`.item` | Sí | |
| Navegación por pestañas de «Nuestros Pacientes» (`pages/admin/testimonios/index.vue`, líneas ~17-26: `border-b-2 -mb-px`, uppercase, `#0C2619`) | Copiar el *markup/estilo*; extraer a `RecommendationsTabs` (o a un componente genérico `AdminTabs` si se quiere reutilizar en ambos, **[Decisión]** menor) | No tocar testimonios en esta fase. |
| `toError()` del proveedor | Ampliar para conservar el mensaje real | §7 |

---

## 5. Frontend vs. Hub vs. Nitro

**Solo frontend (sin riesgo para contenido):**
pestañas y sub-pestañas, buscador, insignias con texto + leyenda, banner «qué se edita», estado «sin guardar», guardado por elemento con etiqueta explícita, estados de carga/error/permisos, enlace «Ver en la web» (URLs públicas conocidas: `/recomendaciones/<slug>`, `/recomendaciones/cuidados/<procedimiento>`, `/recomendaciones/revision/<procedimiento>` **[Código: estructura de `pages/recomendaciones/`]**), fuente derivada en el cliente, Publicar/Ocultar con el PUT parcial existente.

**Nitro (Planmed), sin tocar el Hub** — todos **[Nuevo]**, **mínimos y de bajo riesgo**:
- `fromCmsPage` debe dejar de **descartar** campos que el Hub ya envía: `cirugia_nombre` (nombre del procedimiento) y `orden`/`updated_at`. Es aditivo (campos nuevos opcionales en el DTO); no cambia el comportamiento actual.
- Mensaje de error real en rutas de **Recomendaciones** solamente: nueva función local (p. ej. `translateRecommendations`) en `server/utils/recommendations.ts` que *propague* el mensaje del Hub en 403/422, usada por `hubRecommendations`/`hubPageImage`. **`translate()` de `news.ts` no se toca** (decisión 4).
- *Fase posterior:* ruta `POST /api/admin/recommendations/reorder` (slugs → ids → Hub `reorder`), y aceptar `cirugia_id`/vínculo en crear/editar.

**Hub:** nada para la primera entrega. Capacidades **ya existentes [Código]**: `reorder` (acepta `ids[]`, valida que todos pertenezcan a la línea, escribe `orden = posición` en transacción; exige `recomendaciones.editar`), `cirugia_id` + validaciones, recurso con `cirugia_nombre`/`cirugia_slug`/`orden`/`updated_at`.
**Habría que tocar el Hub solo para:** que el recurso CMS de procedimientos entregue la `fuente` efectiva (evita derivarla en cliente), control de concurrencia real (hoy `updated_at` se entrega pero **no se valida** al guardar), y cualquier unificación histórico↔vinculado (fuera de alcance, decisión 1).

**Orden manual (decisión 5):**
- **Confirmado [Código]:** el Hub soporta `reorder`, y la API pública lista con `ordered()` (`orden`, luego `id`) → **el orden afecta el orden del menú público** de las páginas, no su visibilidad ni su contenido. `reorder` **reescribe `orden` de todas las páginas enviadas** (posiciones 0..n-1), por lo que debe enviarse la lista completa de la línea (o del grupo) en el orden final; enviar un subconjunto reasigna solo esas posiciones y puede dejar empates con las no enviadas.
- **No verificado:** cómo el menú público combina `orden` con el orden de procedimientos y con las páginas vinculadas que sustituyen entradas (`navMenus.ts`); efecto sobre las páginas base en el menú; si `orden` es por grupo o global. Hay que probarlo en local antes de construir la UI.
- Diseño (sin construirlo ahora): botones subir/bajar o arrastrar en `PageList`, con «Guardar orden» como acción propia y separada.

---

## 6. Evitar duplicaciones, pérdidas y ediciones sobre una fuente no publicada

**Fuente efectiva derivada** (función pura `deriveRecommendationSource(procedure, kind, pages)`), reflejando la regla pública **[Código + Prueba: `listings-and-source.test.ts`]**:

| Condición (para el procedimiento P y tipo T = cuidados/revisión) | Fuente | Qué se edita |
|---|---|---|
| Existe página con `procedureSlug === P.slug` y `group === T`, `published` | `pagina` | La página |
| Existe esa página, `published === false` | `pagina_oculta` (se muestra «nada publicado») | La página (aviso) |
| No existe página y el texto `recomendaciones_*` no está vacío | `historico` | Texto del procedimiento |
| No existe página y texto vacío | `ninguna` | Texto del procedimiento (vacío) |

Supuesto **[No verificado]**: que `page.procedureSlug` esté siempre informado para páginas vinculadas (el recurso lo emite desde la relación `cirugia`; un comentario en `types/recommendations.ts` dice que solo si el procedimiento sigue activo/habilitado, lo cual **no coincide** con el código del recurso). Si no se informara, el panel creería «solo histórico» cuando hay página. **Mitigación obligatoria:** si el Hub devuelve una página `cuidados`/`revision` sin `procedureSlug`, se muestra en «Sin asociación» (§7), nunca se asume que no existe. Verificación pendiente con datos reales locales (MySQL caído).

**Duplicaciones:** la fila de procedimiento y la página vinculada **se presentan como una sola entrada** (la del procedimiento) con su fuente; la página vinculada no se lista aparte. Las páginas `cuidados/revision` sin vínculo van a «Sin asociación».

**Pérdidas de contenido:**
- No existe migración ni escritura automática entre fuentes (decisión 1). Cambiar de fuente no copia ni borra nada.
- Nunca se escribe en el campo histórico cuando la fuente efectiva es una página (y viceversa); el editor histórico queda **solo lectura** en ese caso.
- Guardar vacío en el texto histórico: confirmación explícita («el procedimiento dejará de aparecer en el menú»).
- Aviso al salir/cambiar con cambios sin guardar; el estado «sucio» se mantiene por elemento.
- Slug fijo: no se envía `slug` en ningún PUT (ya es así) y se prueba que siga sin enviarse.
- Se envían **solo** los campos soportados; `savePage` conserva la regla de imagen (solo si cambió).

**Edición sobre fuente no publicada:** el banner de cada editor dice siempre «Fuente publicada hoy: …». Si se edita algo que **no** es la fuente publicada (p. ej. un histórico bajo una página vinculada) está en solo lectura; no hay camino en la UI para escribirlo.

---

## 7. Estados

| Estado | Comportamiento |
|---|---|
| **Carga** | Esqueleto/«Cargando…» por fuente (páginas y procedimientos independientes, con `allSettled`); un fallo no bloquea la otra. Con timeout visible y botón **Reintentar** (hoy ya no se cuelga, pero no hay reintento). |
| **Guardando** | Botón deshabilitado + «Guardando «<título>»…»; sin reenvíos dobles. |
| **Guardado** | «Guardado a las HH:MM» persistente junto al botón; se limpia el estado «sin guardar». Aviso extra si se guardó una página **oculta** (ya existe). |
| **Error de API** | Mensaje real (§5 Nitro, solo Recomendaciones) + código HTTP + acción sugerida; **422** muestra los errores de campo del Hub; **503** «Hub no disponible» distinto de **403**. Los datos editados **no se pierden** al fallar. |
| **Permisos insuficientes (403)** | Banner persistente: «Tu usuario no tiene permiso para esta acción en Recomendaciones» (+ mensaje real del Hub si lo trae). Si el 403 es en la **lista**, la pestaña 1 queda en modo informativo (no «Selecciona una página»); la pestaña 2 puede seguir funcionando si `procedimientos` cargó. Si falla guardar/crear/eliminar, solo esa acción se bloquea. Mapeo de permiso **[No verificado]** más allá del 403 (el mensaje del Hub aún no se propaga): no se afirmará «falta X» hasta que Nitro entregue el mensaje. |
| **Sin sesión (401)** | Redirección a login (la sesión se limpia en Nitro, ya ocurre). |
| **Sin asociación** | Sección «Páginas sin procedimiento asociado» dentro de la pestaña 2 (para páginas `cuidados/revision` con `procedureSlug` nulo): lista con título, estado y enlace a editar (como página independiente), con explicación «No sustituyen el texto de ningún procedimiento». Además, procedimientos **sin contenido** → estado vacío por sub-pestaña. |
| **Vacío** | Sin páginas generales: «Aún no hay páginas generales» + botón crear. |
| **Maestro (solo lectura)** | Texto bloqueado con aviso (ya existe la propiedad `editable`). |

---

## 8. Pruebas para no alterar el contenido público

Marco existente: `node --test` sin framework de componentes **[Código]**. Dos niveles:

**A. Lógica pura (se puede hacer ya con `node --test`):**
1. `deriveRecommendationSource` — tabla de §6 completa, incluida «página sin `procedureSlug`» → «Sin asociación».
2. **Paridad con la regla pública:** para cada combinación (pagina / pagina_oculta / historico / ninguna) `deriveRecommendationSource` ≡ `resolveRecommendation` (que ya tiene pruebas).
3. Dirty tracker: sin cambios → limpio; editar → sucio; guardar → limpio; fallo de guardado → sigue sucio.
4. Construcción de URLs «Ver en la web» (por slug de página / de procedimiento / tipo).

**B. Contrato de red (reutilizando `tests/recommendations/harness.ts`):**
5. Publicar/Ocultar envía **solo** `{published}`; guardar nunca envía `slug`, `company_id`, `linea_id`, `cirugia_id` ni `orden`.
6. Nitro de Recomendaciones propaga el mensaje real del Hub en 403/422; **`translate()` de Noticias/PRP y sus pruebas siguen idénticos** (guarda de regresión).
7. `fromCmsPage` conserva todo lo previo y añade `procedureName`/`order`/`updatedAt` sin alterar los campos existentes (snapshot de los mapeos actuales).
8. La edición del texto histórico solo ocurre si la fuente derivada es `historico`/`ninguna` (helper `canEditHistoric`).
9. Reordenar (fase posterior): envía ids completos de la línea/grupo, en orden; nunca ids ajenos.

**C. Estáticas (estilo `static.test.ts`):**
10. Ningún componente nuevo importa el Hub/Bearer ni escribe URLs del Hub (la misma guarda de hoy); nada usa `localStorage`; las rutas públicas siguen siendo solo `GET` (`R3`).
11. **No se modifican** `pages/recomendaciones/**`, `utils/recommendationSource.ts`, `server/api/public/**`, `Navbar.vue`: una prueba que verifique que el rediseño no toca la lectura pública (lista de archivos protegida; en la práctica se vigila con `git diff --name-only` en revisión).

**D. Manual en local (cuando MySQL esté arriba, con datos reales):** comprobar la web pública antes/después de cada fase: menú de Recomendaciones, un cuidado con página vinculada, uno solo histórico, uno con página oculta; contenido idéntico campo a campo.
Las pruebas de UI interactiva (clics en pestañas) **[No verificado]** que puedan automatizarse: no hay framework de componentes en el repo; sería una dependencia nueva (**[Decisión]**).

---

## 9. Fases (pequeñas y verificables)

Cada fase termina con `npm test` y, cuando haya BD, revisión manual de la web pública. Ninguna escribe datos fuera de las acciones normales del administrador.

| Fase | Entrega | Verificación | Toca |
|---|---|---|---|
| **0** | ~~Cerrar la prueba rota (D1)~~ **HECHA (opción A, 132/132).** Nueva fase 0: recuperar la BD local (ver informe de recuperación; requiere autorización) | `migrate:status` limpio + tablas/permisos presentes | Solo BD local (no código) |
| **1** | Diagnóstico y errores de Recomendaciones: `fromCmsPage` aditivo + `translateRecommendations` local (mensaje real 403/422) + `toError` conserva mensaje/código. Sin cambios visuales de fondo. | Pruebas 5–7 | `server/utils/recommendations.ts`, `providers/HubRecommendationsProvider.ts`, tipos |
| **2** | Esqueleto de pestañas (`RecommendationsTabs`) y partición del SFC en componentes **sin cambiar comportamiento** (misma carga/guardado), + estados de carga/error/403/reintento (§7). | Pruebas 3, 10; manual | `pages/admin/recomendaciones/index.vue` + componentes nuevos |
| **3** | Pestaña 1 completa: lista con insignias y leyenda, `EditingBanner`, `SaveBar` con etiqueta, dirty tracking, Publicar/Ocultar separado, «Ver en la web». | Pruebas 3–5; manual | solo frontend |
| **4** | Pestaña 2: buscador, `ProcedureRow`, sub-pestañas, `deriveRecommendationSource`, `SourceNotice`, editores por fuente, «Sin asociación». | Pruebas 1, 2, 8; manual con datos | solo frontend |
| **5** | **Verificar** soporte y efecto del orden (§5) en local; si procede, Nitro `reorder` + UI. | Prueba 9 + comprobación manual del menú público | Nitro + frontend |
| **6** | *(Opcional, decisión posterior)* crear/editar vínculo página↔procedimiento desde el panel; fuente efectiva entregada por el Hub. | contrato + manual | Nitro (+ Hub) |

Restricciones respetadas: sin servidores, sin despliegue, sin commits, sin tocar datos/roles/permisos/migraciones, sin reparar MySQL, sin URLs fijas del Hub, sin revertir cambios locales.

---

## 10. Decisiones e información aún no verificada

**Decisiones**
- ~~**D1:** la prueba rota.~~ **RESUELTA (opción A).** Texto original: Recomendación: ajustar la guarda para que permita un *default privado de runtime* **o** revertir mi default y volver a `''` con `.env` local. Ambas respetan «no URLs fijas para pasar pruebas» solo si tú lo decides; no lo he hecho.
- **D2:** ¿se extrae un componente genérico `AdminTabs` y se reutiliza también en «Nuestros Pacientes» (más limpio, toca otra pantalla) o se copia el estilo (sin riesgo)? Recomiendo copiar el estilo en esta fase.
- **D3:** ¿añadir un framework de pruebas de componentes (p. ej. `@vue/test-utils` + `vitest`/`happy-dom`) o limitarse a lógica pura + pruebas estáticas con `node --test`? Recomiendo lo segundo por ahora.
- **D4:** nombre de las pestañas: «Recomendaciones generales» / «Contenido por procedimiento» (como en tu brief) y sub-pestañas «Cuidados» / «Citas de revisión».
- **D5:** ¿«Sin asociación» se muestra solo cuando existan esas páginas o siempre (con estado vacío)? Recomiendo solo cuando existan.

**No verificado (requiere MySQL/Hub local funcionando o permisos)**
1. Si `procedureSlug` llega informado en todas las páginas vinculadas (§6).
2. Si en la BD real hay procedimientos con página vinculada (alcance real del riesgo de «editar lo que no se publica»).
3. Efecto exacto del orden en el menú público y si `orden` es por grupo o global (§5).
4. Si el 403 de la lista proviene solo de `recomendaciones.ver` o de otra causa (contexto de línea); depende de la fase 1 para ver el mensaje real.
5. Límite real de imagen (cliente 10 MB vs. Hub 5 MB) y el efecto de `fileToOptimizedDataUrl` (no inspeccionado).
6. Estado de las migraciones locales tras la caída de MySQL.

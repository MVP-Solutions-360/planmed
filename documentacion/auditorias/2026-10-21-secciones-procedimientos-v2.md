# Secciones de Procedimientos como capacidad reutilizable de Wellezy Hub — revisión 2

Fecha: 2026-10-21 · Fase: diagnóstico y plan (no se modificó código, BD ni configuración).
Esta revisión **sustituye** las secciones 5 (alternativas), 6 (plan), 7 (riesgos) y 10 (decisiones) de
[2026-10-21-secciones-procedimientos.md](2026-10-21-secciones-procedimientos.md); el resto de ese informe (flujo de Recomendaciones, ficha actual de Procedimientos, comparación) sigue vigente.

Decisiones funcionales recibidas: (1) las secciones aplican a procedimientos **maestros y propios**; (2) se configuran **por línea** desde la BD, sin que una web pise a otra; compartir entre líneas es opcional; (3) quedan vinculadas al procedimiento sin duplicar la ficha maestra; (4) las líneas autorizadas las administran sin modificar el contenido maestro; (5) la API entrega a cada web solo sus secciones, de forma compatible con los consumidores actuales.

## 1. Cómo se resuelve hoy el contexto empresa/línea (verificado en código)

### 1.1 API pública (webs: Planmed, Crediestética, BMQ…)
- Rutas `v1/web/*` con middleware `linea.tenant` (`App\Http\Middleware\ResolveLineaTenant`): resuelve la línea por la cabecera **`X-Tenant-Domain`** (tabla `linea_domains`, activa) y, como respaldo, por **`X-Tenant-Linea`** (slug de `lineas`). Deja el modelo en `request->attributes['tenant_linea']`; 404 si no resuelve.
- Líneas con slug hoy en la copia de PD: `planmed` (id 3, empresa 3), `crediestetica` (id 4, empresa 16), `bmq` (id 21, empresa 21). 7 de 20 líneas no tienen empresa.
- `CatalogoController::cirugiaShow` selecciona el procedimiento con `Cirugia::where('slug')->where('activo',true)->availableToLinea($linea->id)` (**maestros + propios de esa línea**, nunca propios de otra) y exige una fila **activa** en el pivote `cirugia_linea` para esa línea (`whereHas('lineasComerciales')`). Es el mecanismo que ya decide «qué maestros ve cada web».
- Precedente exacto de «contenido maestro + contenido de la línea»: `before_after_pairs` (`company_id` NULL = caso maestro; `company_id` = empresa de la línea) y la bandera `cirugia_linea.use_master_cases`. `cirugiaShow` los filtra por la empresa de la línea del tenant. Es el patrón a seguir.

### 1.2 API administrativa (CMS, paneles)
- Rutas `/api/cms/*` con `auth:sanctum` + `api.context` (`EnsureApiTokenContext`): el token lleva `company:`/`line:`; se revalida el `Personnel` activo y se deja en `request->attributes['api_personnel']` (`company_id`, `linea_id`). **Empresa y línea salen solo del token** (`ResolvesLineContext::lineContext`, que además exige línea con empresa coherente → 403).
- Procedimientos (`Cms\ProcedureController`): `visible()` = maestros (`linea_id NULL`) + propios de la línea del token; `scoped()` = solo propios (`Cirugia::forContext`). En `update`, un maestro solo admite `activo`/`destacado` (`syncPivot` sobre `cirugia_linea` de **la línea del token**) y cualquier otro campo da 403. Habilitar un maestro = crear/actualizar su fila de pivote.
- Permisos: `CirugiaPolicy` (`cirugias.ver/crear/editar/eliminar`), `ownsOrSuper` bloquea editar contenido de maestros salvo superadmin; `toggleMaster` (`cirugias.editar`) permite habilitar/destacar. En el backoffice Livewire, `LineContext::lineIdFor` usa el `Personnel` del usuario (superadmin: todas las líneas).

### 1.3 Estado real de datos (copia de PD)
- 96 `cirugias`: 90 maestros, 6 propios de Planmed. `cirugia_linea` tiene 6 filas, **todas de procedimientos propios**: hoy ningún maestro está habilitado en ninguna línea (consistente con que la lista pública de Planmed salga con pocos procedimientos).
- `cirugia_linea` **no tiene índice único** `(cirugia_id, linea_id)` (solo PK `id`), aunque en la copia no hay duplicados. `lineas` **sí** tiene único `(id, company_id)` (`lineas_id_company_unique`).

## 2. Cómo se seleccionarán y administrarán las secciones (propuesta)

**Principio:** la sección pertenece a **(procedimiento, línea)**; el procedimiento (maestro o propio) no se modifica nunca. Es el mismo eje que ya usa `cirugia_linea`.

- **Lectura pública:** `secciones` = filas con `cirugia_id` = procedimiento servido, `linea_id` = `tenant_linea->id` y `company_id` = `tenant_linea->company_id`, `visible = true`, ordenadas. Una web nunca recibe filas de otra línea; el filtro se aplica en la consulta, no en el cliente.
- **Escritura (CMS):** línea y empresa **del token**, nunca del cuerpo. Al crear/editar se exige que el procedimiento esté **disponible para esa línea**: es propio de la línea, o es maestro **con fila activa en `cirugia_linea` de la línea del token**. La escritura solo toca `cirugia_sections` (+ `media_assets`); no se escribe en `cirugias` (el maestro queda intacto).
- **Autorización:** nuevo método `CirugiaPolicy::manageSections(User, Cirugia)` = permiso `cirugias.editar` + procedimiento disponible para la línea del usuario (propio o maestro habilitado). Evita `ownsOrSuper`, que es la restricción que bloquea hoy a los maestros y que no se debe relajar (relajarla abriría el contenido global). Ver/listar: `cirugias.ver`. Eliminar: `cirugias.eliminar`.

## 3. Modelo de datos recomendado (revisado)

Tabla **`cirugia_sections`** (la propuesta v1 sin `company_id`/`linea_id` para maestros queda descartada):

| Columna | Justificación (arquitectura real) |
|---|---|
| `id` | |
| `cirugia_id` FK → `cirugias` ON DELETE CASCADE | vínculo con el procedimiento (como `cirugia_linea`, `before_after_pairs`); sin duplicar la ficha. Hoy el Hub no elimina procedimientos (los desactiva) |
| `company_id`, `linea_id` NOT NULL | Un maestro tiene `linea_id` NULL, así que el alcance **no puede derivarse del procedimiento**; debe vivir en la sección. Son exactamente los de la línea del token. Permite reutilizar `BelongsToLine` (valida línea/empresa) y `forContext()` (defensa en profundidad que usa todo el CMS) |
| FK compuesta `(linea_id, company_id)` → `lineas(id, company_id)` | Existe el único `lineas_id_company_unique`: la BD garantiza que la empresa corresponde a la línea sin migraciones adicionales |
| `title`, `content` (longText HTML), `layout` (`stacked/media_left/media_right`), `image_alt`, `orden`, `visible`, `created_by`, `updated_by`, timestamps | mínimo funcional pedido; mismo patrón de `recommendation_page_sections`. Imagen por `media_assets` (morph) con `ImageAttachment` |
| Índices: `(cirugia_id, linea_id, visible, orden)` | la consulta pública y la del panel |

- **Integridad «solo si el procedimiento está disponible para la línea»:** validación en `CirugiaSection::saving` (propio de la línea o maestro con pivote existente) + `CirugiaPolicy`. Una FK al pivote exigiría añadir un índice único `(cirugia_id, linea_id)` a `cirugia_linea` (migración sobre una tabla en uso, no necesaria para el alcance): se deja como **endurecimiento opcional**, a verificar contra duplicados en producción antes.
- **Qué pasa si una línea deshabilita el maestro:** la sección **se conserva** (no se borra por cascada) y deja de mostrarse porque `cirugiaShow` ya exige pivote activo; al rehabilitar reaparece.
- **Procedimiento propio:** mismas reglas (`company_id/linea_id` = los del procedimiento, que coinciden con el token).
- **No se agregan** columnas para compartir; ver §4.

## 4. Secciones compartidas entre líneas (opcional)

Evaluado, **no obligatorio y no incluido en la primera entrega**:
- **Opción recomendada si se necesita (fase posterior):** secciones «maestras» (con `company_id/linea_id` NULL, solo editables por superadmin) y una bandera `use_master_sections` en `cirugia_linea`, copiando el patrón `before_after_pairs`/`use_master_cases`. Cada línea elige heredar las maestras y/o tener las suyas. Requiere relajar `BelongsToLine` para esa tabla o usar otra tabla; por eso se deja fuera del alcance inicial y se documenta como extensión compatible (no cambia el contrato `secciones`).
- **Alternativa ligera:** acción explícita «copiar secciones de otra línea/plantilla» en el panel (duplicación puntual y consciente; no vínculo vivo).
- Un esquema de compartir mediante tabla pivote `section↔línea` se descarta: complica el aislamiento y la consulta sin necesidad actual.

## 5. API (compatibilidad y aislamiento)

- **Pública** (`GET /api/v1/web/cirugias/{slug}`): campo **aditivo** `secciones: [{orden, title, content, layout, image:{url,alt}|null}]` (`[]` si no hay), construido en `CirugiaDetailResource` desde las secciones de la línea del tenant. No se renombra ni elimina ninguna clave existente: `Planmed` (`fromPublicDetail`, mapeo explícito) y `cliniplanes-web` (`CrmProcedureProvider.mapDetail`, que hace `...raw` y ya tolera claves nuevas) siguen funcionando. Nota: el proveedor de Crediestética está **inactivo por defecto** (`NUXT_PUBLIC_PROCEDURE_SOURCE=crm`); hay que confirmar con el equipo de esa web si lo activará.
- **CMS** (grupo `api.context`, mismo prefijo que `procedures`): `GET/POST procedures/{id}/sections`, `GET/PUT/DELETE procedure-sections/{id}`, `POST procedures/{id}/sections/reorder`, `POST/DELETE procedure-sections/{id}/image`. El `{id}` del procedimiento se resuelve con `visible()` (maestro o propio) y la disponibilidad para la línea del token; el `{id}` de sección se resuelve con `forContext(token)` (ajeno ⇒ 404).
- Lógica común en una **Action/servicio** (`ProcedureSections`) invocada por la API (y más adelante por Livewire) para no duplicar reglas.

## 6. Dónde administrarlas

Combinación, con la API como fuente de reglas:
1. **Fase 1 – panel de cada web vía API CMS** (Planmed ya la usa para todo su CMS; Crediestética cuando tenga panel). Es lo que permite que cada línea configure lo suyo con su propio token.
2. **Fase posterior – backoffice Livewire del Hub** (`EditCirugia`): útil para superadmin (con selector de línea, porque `LineContext::administrableLines` devuelve todas las líneas a un superadmin) y soporte; reutiliza la Action. No es imprescindible para la primera entrega.

## 7. Plan por fases (actualizado)

- **Fase 0 – Decisiones** (§10).
- **Fase 1 – Hub backend:** migración `create_cirugia_sections_table` aditiva (con `down()` que se niega a borrar filas, como la de recomendaciones); modelo `CirugiaSection` (`BelongsToLine`, `mediaAssets`, purga al borrar); `SectionLayouts` compartido con `RecommendationSection::LAYOUTS`; `reorderExact` extraído a un trait común con el permiso configurable; `CirugiaPolicy::manageSections`; Action `ProcedureSections`; controlador CMS; `CirugiaDetailResource` + `CatalogoController::cirugiaShow` (eager-load filtrado por la línea del tenant); documentación en `docs/cms/`.
- **Fase 2 – Planmed:** `types/procedure.ts` y `fromPublicDetail` (`secciones`, layout desconocido ⇒ `stacked`), rutas Nitro de administración, formulario reutilizando el subcomponente extraído de `TreeSectionForm.vue`, renderizado con el componente neutro extraído de `RecommendationSections.vue`/`SectionMedia.vue`; maestros editables solo en secciones (el formulario de ficha sigue de solo lectura, ya implementado como `readOnly`).
- **Fase 3 – Crediestética / otras líneas:** solo consumo del campo `secciones` desde la misma API (sin estructuras propias) cuando activen el proveedor.
- **Fase 4 – Pruebas** (Hub: `tests/Feature/Api/Cms`, siguiendo `ProcedureCmsTest`, `RecommendationAdminApiTest`, `CmsPermissionMatrixTest`): maestro con secciones distintas por línea (Planmed vs Crediestética) sin contaminación; el maestro no se modifica (`cirugias` intacta, hash de fila); maestro no habilitado en la línea ⇒ 404/403; propio de otra línea ⇒ 404; API pública solo devuelve secciones del tenant y respeta `visible/orden`; compatibilidad del contrato (claves anteriores idénticas); imágenes (reemplazo/borrado sin huérfanos, tipos y tamaño); reordenamiento exacto; permisos (`ver/editar/eliminar`); regresión de Recomendaciones. Planmed (`node --test`) y comprobación visual móvil/escritorio.
- **Fase 5 – Despliegue/reversión:** (1) migración + Hub, (2) Planmed. Reversible: el campo `secciones` es aditivo; `migrate:rollback` solo si la tabla está vacía. Verificar `GET /v1/web/cirugias/{slug}` con `X-Tenant-Linea: planmed` y `crediestetica` (cada uno solo ve las suyas).

## 8. Riesgos (actualizado)

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| Fuga de secciones entre líneas | Baja | Alto | Filtro por `linea_id`+`company_id` del tenant/token en consulta; FK compuesta a `lineas`; pruebas cruzadas Planmed↔Crediestética |
| Relajar `ownsOrSuper` abre el contenido maestro | Media (si se implementa mal) | Alto | Política nueva `manageSections` que nunca autoriza escribir `cirugias`; prueba de que la fila maestra no cambia |
| Sección sobre maestro no habilitado en la línea | Media | Medio | Validación en modelo + política + 404; test |
| `cirugia_linea` sin único `(cirugia_id, linea_id)` | Baja | Medio | No se depende del pivote por FK; endurecimiento opcional tras auditar duplicados en producción |
| Maestros ocultos hoy (ninguno habilitado en la copia): las secciones no se verán hasta habilitarlos | Alta | Medio | Comunicarlo; es una decisión de datos |
| Consumidores que no toleren la clave nueva | Baja | Medio | Campo aditivo; confirmar con Crediestética/BMQ |
| Duplicación de contenido entre líneas | Media | Bajo | Acción «copiar» opcional o maestras compartidas (§4) en fase posterior |
| Huérfanos de imagen | Baja | Bajo | `ImageAttachment` y purga al borrar |
| Dos UIs (Livewire y paneles) con reglas distintas | Media | Medio | Una Action común; Livewire en fase posterior |
| Permiso `cirugias.editar` demasiado amplio para editar secciones | Media | Medio | Decisión §10 (permiso propio o no) |
| Sin caché verificada en producción | Desconocida | Medio | Revisar antes del despliegue (no verificado) |

## 9. Cambios respecto a la recomendación v1
- Sigue siendo **A + B** (tabla propia + piezas compartidas, sin bloques genéricos), pero el alcance cambia de «solo propios» a **(procedimiento, línea) para cualquier procedimiento**, con `company_id/linea_id` NOT NULL en cada sección (necesarios porque el maestro no tiene línea).
- Se descarta la v1 que dejaba los maestros fuera; se añade `CirugiaPolicy::manageSections` y la validación «disponible para la línea».
- Compartir entre líneas pasa a ser una extensión opcional (§4), no parte de la primera entrega.
- Prerrequisito detectado: para que un maestro muestre secciones en una web, debe estar **habilitado en `cirugia_linea`** de esa línea.

## 10. Decisiones que siguen necesitando tu aprobación
1. **Permiso:** ¿basta `cirugias.editar` para administrar secciones, o se crea un permiso propio (p. ej. `cirugias.secciones`)? Un permiso nuevo exige migración de permisos/seeder (patrón de `2026_10_08_100000_add_cirugias_permissions_for_line_leaders`) y su aplicación en el entorno.
2. **Convivencia con el HTML actual `procedimiento`:** ¿las secciones se muestran **debajo** o **en lugar de** ese texto (hoy el maestro lo trae)?
3. **Campos mínimos:** título, texto, imagen y posición (propuesto) o también subtítulo, vídeo y botón.
4. **Compartir secciones:** ¿cero en la primera entrega (propuesto), o incluir ya la herencia de maestras con `use_master_sections`?
5. **Endurecimiento opcional:** ¿agregar el único `(cirugia_id, linea_id)` a `cirugia_linea` (y FK de las secciones al pivote) tras revisar duplicados en producción?
6. **Alcance de administración:** ¿solo vía API/paneles de las webs en la primera entrega y Livewire después (propuesto)?
7. **Crediestética:** ¿activará el proveedor de procedimientos del Hub? Confirmarlo con su equipo antes de esperar secciones allí.
8. **Habilitar maestros:** hoy no hay ninguno habilitado en la copia; ¿se habilitarán en Planmed antes de configurar secciones sobre ellos?

## 11. Verificado vs. no verificado
Verificado por lectura de código y consultas de solo lectura en `wellezy_pd_copy`: middleware de tenant, `cirugiaShow`, `ProcedureController`, `CirugiaPolicy`, `LineContext`, esquema de `cirugia_linea`, `before_after_pairs`, `lineas` (índices), `media_assets`.
No verificado: producción (datos, índices duplicados, caché), si Crediestética activará el proveedor, comportamiento con tokens reales de otras líneas (se probará en la fase de pruebas).

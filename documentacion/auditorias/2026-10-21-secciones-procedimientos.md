# Auditoría: secciones de Recomendaciones → Procedimientos (Wellezy Hub + Planmed web)

Fecha: 2026-10-21 · Fase: solo diagnóstico y plan (no se modificó código, BD ni configuración).
Repos leídos: `C:\xampp\htdocs\laravel\wellezy-hub-2` (Git limpio, HEAD `f7bb3ab`), `planmed-web` y, solo para consumo de la API, `Cliniplanes/cliniplanes-web`.
BD consultada en solo lectura: `wellezy_pd_copy` (copia de PD).

> **Actualización:** tras las decisiones funcionales del 2026-10-21 (secciones para maestros y propios, por línea, reutilizables), las secciones 5, 6, 7 y 10 de este informe quedan sustituidas por [2026-10-21-secciones-procedimientos-v2.md](2026-10-21-secciones-procedimientos-v2.md).

## 1. Resumen ejecutivo

1. **El editor de la ruta `/admin/recomendaciones/temas/3/subtemas/9/secciones/nueva` NO está en el Hub: es una pantalla Nuxt de `planmed-web`** (`pages/admin/recomendaciones/temas/[topic]/subtemas/[subtopic]/secciones/nueva.vue` → `components/admin/recommendations/TreeSectionForm.vue`). Habla con la API CMS del Hub (`/api/cms/recommendation-*`). El Hub tiene además su propia UI Livewire (módulo «Financieras», `App\Livewire\Financieras\Recomendaciones\Sections\Form`) que usa las mismas reglas.
2. **Procedimientos NO tiene un sistema de secciones.** No existe tabla de secciones de procedimientos (`recommendation_page_sections` es solo de recomendaciones y `post_sections` es de noticias). Un procedimiento (`cirugias`) es una ficha de **campos fijos**: `procedimiento` (un único bloque HTML), `perfil_paciente` (HTML), ficha técnica, listas JSON (`tecnicas`, `candidatos_*`, …), imagen destacada y una galería plana (sin orden, alt ni posición). La premisa «en Procedimientos también existe un sistema de secciones» no se cumple en el código.
3. Por eso **la funcionalidad requiere una migración nueva** (no hay columna ni estructura que sirva para «secciones con posición de imagen»). Lo demás (reglas de imagen, autorización, orden, componentes de UI) es reutilizable.
4. **Restricción crítica de datos:** en la BD hay 96 procedimientos, **90 son maestros** (`linea_id IS NULL`, contenido global compartido por todas las líneas) y 6 propios de Planmed. `CirugiaPolicy::ownsOrSuper` y `ProcedureController::update` impiden que una línea edite el contenido de un maestro. Las secciones nuevas solo podrían editarse en procedimientos propios, salvo decisión funcional distinta (ver §12).
5. **Recomendación:** Alternativa B (compartir piezas, modelos separados) + A (tabla propia para Procedimientos): nueva tabla `cirugia_sections` aditiva en el Hub, endpoints CMS propios, campo aditivo `secciones` en el detalle público (sin tocar los campos existentes), y en Planmed reutilizar el formulario y el renderizador de secciones. No se recomienda una estructura genérica de bloques (Alternativa C).

## 2. Flujo actual de Recomendaciones

```
Planmed Nuxt (admin)                   Hub (Laravel)                                   Planmed Nuxt (público)
TreeSectionForm.vue  ──/api/admin/──▶  Nitro proxy ──▶ /api/cms/recommendation-*  ─────▶ BD
  (layout, imagen)                     SectionController (Cms\Recommendations)
                                       RecommendationSection + media_assets
GET /api/v1/web/recommendation-topics/{t}/{s} ◀── PublicRecommendationSubtopicResource ◀── RecommendationSections.vue + SectionMedia.vue
```

### 2.1 Rutas y autorización (Hub, `routes/api.php`, grupo CMS `auth:sanctum` + `api.context`)

| Ruta | Método | Clase responsable | Autorización | Finalidad |
|---|---|---|---|---|
| `recommendation-section-types` | GET | `SectionController::types` | `viewAny` | Catálogo de tipos y de layouts |
| `recommendation-subtopics/{page}/sections` | GET / POST | `SectionController::index/store` | `viewAny` / `create` | Listar / crear |
| `recommendation-sections/{id}` | GET / PUT-PATCH / DELETE | `show/update/destroy` | `view/update/delete` | Consulta, edición, baja |
| `recommendation-subtopics/{page}/sections/reorder` | POST | `reorder` (trait `ManagesRecommendationAdmin::reorderExact`) | exige `recomendaciones.editar` | Reordenar |
| `recommendation-sections/{id}/image` | POST / DELETE | `image` / `removeImage` | `update` | Subir/reemplazar y quitar imagen |

- Políticas: `RecommendationSectionPolicy extends LineOwnedContentPolicy` (módulo `recomendaciones`: `ver/crear/editar/eliminar`); borrar una sección exige además rol `admin` o superadmin.
- Aislamiento: empresa y línea salen **solo del token** (`ResolvesLineContext`); `scopedTo()` filtra por `forContext(company, linea)`; un id ajeno responde 404. La pertenencia sección↔subtema se resuelve con `pageOrFail($request,$page)` (`scopedSubtopics`) y en BD con una **FK compuesta** `(recommendation_page_id, linea_id, company_id)`; además `RecommendationSection::saving` verifica que empresa/línea coincidan con las del tema.
- UI Livewire equivalente: `routes/financieras.php` (`recomendaciones.secciones.create/edit`, middleware `permission:recomendaciones.*` + `FinancieraModuleAccess`).

### 2.2 Editor y reglas (verificado en código)

- Campos reales (`recommendation_page_sections`): `type`, `title` (obligatorio), `subtitle`, `content` (HTML, ≤500 000, sanitizado con `RichTextSanitizer`), `layout`, `image_alt`, `video_url` (solo YouTube, `EmbedUrl`), `cta_label` + `cta_url` (opcionales, juntos; `SafeLink`), `orden`, `visible`, `created_by/updated_by`.
- **Tipos** (`RecommendationSection::TYPES`): `description`, `recommendations`, `callout`, `contact`, `custom`; cada uno declara los campos que admite (`fields`); `assertCapabilities` rechaza con 422 un campo no admitido y un cambio de tipo nunca descarta contenido en silencio.
- **Posición de imagen** (`LAYOUTS`): `stacked` «Una columna» (por defecto), `media_left`, `media_right`. Se guarda en la columna `layout` (string 20). No hay otras opciones.
- Imagen: `ImageAttachment` (jpg/jpeg/png/webp, máx. 5120 KB, disco `public`, ruta generada por Laravel en `recommendations/sections`, tabla polimórfica `media_assets` categoría `image`). `replace()` guarda el archivo nuevo y registra ANTES de purgar el anterior (sin huérfanos ni pérdida si falla); `remove()` purga. La imagen es opcional y se sube en una llamada aparte (`/image`) tras crear/editar.
- Orden: `orden` entero; al crear sin valor, `max+1` con `lockForUpdate` dentro de transacción (3 reintentos); `reorderExact` exige la lista completa y valida antes de escribir.
- Eliminación: `$section->delete()` por Eloquent (purga imagen de disco y `media_assets`); 409 si hay recomendaciones.
- Persistencia: **relacional**, una fila por sección (no JSON). Sin observers/jobs propios de la sección (sí `booted()` del modelo). Migración: `2026_10_17_110000_create_recommendation_page_sections_table.php` (índice `recommendation_sections_page_order_idx`, único de scope para la FK de los ítems).

### 2.3 Representación pública

- API: `GET /api/v1/web/recommendation-topics/{topic}/{subtopic}` (`WebRecommendationTopicController`, middleware `linea.tenant`) → `PublicRecommendationSubtopicResource::sectionData()`: entrega `type, orden, title, subtitle, content, layout, image{url,alt}, video{embed_url}, cta, items`; aplica `allows()` del tipo y devuelve `layout:'stacked'` si el tipo no admite layout.
- Planmed: `shared/utils/recommendationTree.ts` valida el contrato (`SECTION_LAYOUTS`, layout desconocido → `stacked`); `components/recommendations/RecommendationSections.vue` (líneas 40–44) usa `md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]` si `layout !== 'stacked'` **y hay contenido**, y `md:order-2` para `media_right`; en móvil (< md) la imagen queda apilada encima del texto. `SectionMedia.vue` pinta imagen (`rounded-xl object-cover`) y/o vídeo. Sin imagen/texto: la rejilla solo se activa si hay `content`; sin imagen no se reserva columna.

## 3. Flujo actual de Procedimientos

### 3.1 Administración
- **Planmed Nuxt:** `pages/admin/procedimientos/[slug].vue` → `/api/admin/procedures*` (Nitro, `server/utils/procedures.ts`) → Hub `/api/cms/procedures*`.
- **Hub CMS API** (`routes/api.php`: `apiResource('procedures')`, `procedures/{id}/image`, `/gallery`, `/gallery/{asset}`): `Cms\ProcedureController`, requests `StoreCirugiaRequest/UpdateCirugiaRequest` (`CirugiaRequest::sharedRules`).
- **Hub Livewire:** `App\Livewire\Cirugias\CreateCirugia/EditCirugia` (editores Quill `x-rich-editor` para `procedimiento`, `perfil_paciente`, `recomendaciones_*`; repetidores para `tecnicas`, `candidatos_*`, etc.). Esta UI **también** edita los campos de `cirugias`, por lo que cualquier cambio de modelo debe contemplarla.
- Autorización: `CirugiaPolicy` (`cirugias.ver/crear/editar/eliminar`); maestros solo superadmin (`ownsOrSuper`); `toggleMaster` permite solo habilitar/destacar en la línea (`ProcedureController::update` rechaza con 403 cualquier otro campo de un maestro). `store` fija `company_id/linea_id` desde `api_personnel` (token), nunca del cuerpo.
- Imágenes: featured `catalogo/cirugias/featured` (reemplazo borra el anterior ANTES de guardar el nuevo, a diferencia de `ImageAttachment`), galería hasta 10 por llamada `catalogo/cirugias/gallery`; ambas jpg/jpeg/png/webp ≤ 5 MB, `media_assets` categorías `featured`/`gallery` (12 galerías y 6 featured en la copia de PD). `media_assets` no tiene columnas de orden, alt ni layout (solo `variant`, `category`, `path`…).
- El Hub no elimina procedimientos: los desactiva.

### 3.2 Base de datos
- `cirugias` (columnas verificadas en `wellezy_pd_copy`): `nombre, slug (único), categoria_id, descripcion_corta, perfil_paciente, procedimiento (longtext), tiempo_quirurgico, tipo_anestesia, hospitalizacion, tiempo_recuperacion, visibilidad_resultados, activo, tecnicas/adicionales_*/complicaciones/restricciones_medicas/candidatos_* (JSON), recomendaciones_post/revision, meta_title/meta_description, company_id, linea_id, edad_minima/maxima, imc_maximo, cicatrizacion_minima` + legacy `cali…premium`. Pivote `cirugia_linea` (activo, destacado, orden).
- **No existe ninguna columna o tabla que represente secciones, posición de imagen o tipo de bloque** para procedimientos. `procedimiento` es un solo HTML; `tecnicas` es JSON `[{titulo, descripcion}]` sin imagen. **No se puede implementar sin migración** salvo degradar el requisito (p. ej. incrustar `<img>` dentro del HTML, sin posición controlada ni gestión de archivos).
- Datos históricos: 96 procedimientos (90 maestros / 6 propios). Los existentes seguirían intactos si la nueva tabla es aditiva.

### 3.3 Consumo web
- Público: `GET /api/v1/web/cirugias[/{slug}]` (`CatalogoController::cirugiaShow` → `CirugiaDetailResource`), middleware `linea.tenant`; filtra por `availableToLinea` y `cirugia_linea.activo`.
- Respuesta actual (campos relevantes): `procedimiento`, `imagen_destacada`, `galeria` (array de URLs), `perfil_paciente`, `ficha_tecnica`, listas JSON, `galeria_antes_despues`, `seo`.
- Planmed: `server/utils/procedures.ts::fromPublicDetail` mapea **campo por campo** (los campos desconocidos se ignoran) y `pages/procedimientos/[slug].vue` renderiza `whatIsIt` con `CommonRichContent` + galería.
- Otros consumidores: `Cliniplanes/cliniplanes-web` (`providers/CrmProcedureProvider.ts`, `composables/useCatalogo.ts`) lee `procedimiento`, `galeria`, `galeria_antes_despues` del mismo endpoint; BMQ usa su propio portal (`PortalApiController::procedures`, otro modelo `Procedure`). Un campo **nuevo y aditivo** no rompe a ninguno, porque ambos mapean de forma explícita.

## 4. Comparación técnica

| Dimensión | Recomendaciones | Procedimientos | Clasificación |
|---|---|---|---|
| Modelo de datos | `recommendation_page_sections` (FK compuesta página/línea/empresa) | Sin secciones; ficha de campos fijos | Específico; requiere tabla nueva |
| Editor admin | `TreeSectionForm.vue` (Nuxt) + Livewire `Sections\Form` | Formulario plano en `[slug].vue` / Livewire `EditCirugia` | Reutilizable mediante abstracción (extraer subcomponente) |
| Campos | tipo, título, subtítulo, contenido, layout, alt, vídeo, CTA, orden, visible | — | Compartidos: título, contenido, layout, alt, orden, visible. No conviene copiar: tipos, CTA, ítems, vídeo (sin requisito) |
| Imagen | `ImageAttachment` (seguro, sin huérfanos), `media_assets` morph | featured/gallery con borrado previo; `media_assets` | **Reutilizable directamente** `ImageAttachment` y `ImageAttachment::rules()` |
| Posición de imagen | columna `layout` (`stacked/media_left/media_right`) | No existe | Reutilizable mediante abstracción (constante compartida) |
| Orden | `orden` + `reorderExact` | `orden` solo en pivote de catálogo | `reorderExact` reutilizable (trait) con permisos propios |
| Validaciones | `SectionController::validated` | `CirugiaRequest` | Parcialmente compartibles (HTML, alt); permisos específicos |
| Persistencia | transacción + `lockForUpdate` | `DB::transaction` en store/update | Reutilizable el patrón |
| API | `{data:{...}}`, CMS + pública | CMS + pública | Contrato nuevo aditivo |
| Frontend público | `RecommendationSections.vue`/`SectionMedia.vue` | `[slug].vue` con HTML único | Reutilizable mediante abstracción |
| Permisos | `recomendaciones.*`, `LineOwnedContentPolicy` | `cirugias.*`, `CirugiaPolicy` (maestros) | **Específico de cada módulo; no unificar** |
| Compatibilidad | consumidores del árbol | Planmed + Crediestética leen `cirugias/{slug}` | Aditiva, sin cambiar claves existentes |

## 5. Alternativas

- **A. Replicar dentro de Procedimientos** (tabla propia `cirugia_sections`, endpoints propios): menor acoplamiento y alcance; algo de duplicación de reglas (título/contenido/layout).
- **B. Extraer piezas compartidas** (constante de layouts, `ImageAttachment`, `reorderExact`, subcomponente de formulario y de renderizado en Nuxt) sin fusionar modelos: reduce duplicación sin tocar Recomendaciones.
- **C. Bloques genéricos** (tabla polimórfica `content_blocks`): exigiría migrar datos vivos de Recomendaciones (14 secciones en la copia), reescribir políticas, FK compuestas, contrato público y consumidores; los dos módulos tienen permisos y tipos distintos (Recomendaciones: tipos, ítems, CTA; Procedimientos: sin ellos). No aporta valor proporcional al riesgo.

**Recomendación: A + B.** Cumple los criterios: no toca datos existentes, migración mínima y aditiva, aislamiento heredado del procedimiento, evolución sin acoplar.

## 6. Plan por fases

**Fase 0 – Requisitos (decisiones en §12).** Imprescindible: título + contenido HTML por sección, imagen opcional con `stacked/media_left/media_right`, orden, edición, visible/oculto, móvil. Opcional: vista previa, CTA, vídeo, tipos.

**Fase 1 – Hub (backend).**
- Migración **aditiva** `create_cirugia_sections_table`: `id, cirugia_id (FK cascade), company_id, linea_id (copiados del procedimiento propio), title, content (longText), layout (default stacked), image_alt, orden, visible, created_by, updated_by, timestamps`, índice `(cirugia_id, visible, orden)` y FK compuesta `(cirugia_id, linea_id, company_id)` análoga a la de recomendaciones (requiere índice único de scope en `cirugias`: verificar, hoy no existe). `down()` que se detenga si hay filas (patrón de la migración existente).
- Modelo `CirugiaSection` (reutiliza `BelongsToLine`, `mediaAssets`, `purge` al borrar); constante `LAYOUTS` movida a una clase compartida (p. ej. `App\Support\Cms\SectionLayouts`) usada por ambos modelos.
- `Cms\ProcedureSectionController` (index/store/show/update/destroy/reorder/image/removeImage) con `ImageAttachment`, `reorderExact` (extraer el trait a uno común con permiso configurable), `RichTextSanitizer`, y autorización vía `CirugiaPolicy::update` (sección solo en procedimientos propios; maestro → 403).
- Resource CMS y ampliación **aditiva** de `CirugiaDetailResource`: `secciones: [{orden,title,content,layout,image{url,alt}}]` solo visibles y ordenadas; `[]` si no hay. No se renombra ni elimina ninguna clave.
- Actualizar `docs/cms/` con el contrato.

**Fase 2 – Panel.**
- Planmed: extraer de `TreeSectionForm.vue` un subcomponente de «bloque con imagen + distribución» y usarlo en una sección nueva de `pages/admin/procedimientos/[slug].vue` (lista ordenable, crear/editar/eliminar, estados vacíos y errores). Guardado: primero el procedimiento, luego secciones (imagen en llamada aparte, igual que hoy).
- Hub Livewire (`EditCirugia`): decidir si se replica (§12); si no, documentar que las secciones se gestionan solo desde Planmed.
- Sin tocar el flujo de recomendaciones.

**Fase 3 – API y público.**
- `server/utils/procedures.ts::fromPublicDetail` y `types/procedure.ts`: mapear `secciones` con validación defensiva (layout desconocido → `stacked`, URL http/https).
- Reutilizar `RecommendationSections`/`SectionMedia` extrayendo un componente neutro; en `pages/procedimientos/[slug].vue` mostrar las secciones tras `whatIsIt` (o en lugar de él si el contenido lo cubre; decisión §12). Móvil: imagen apilada; sin imagen, sin columna reservada. Fallback si el Hub es anterior: sin `secciones` no se renderiza nada.
- Sin caché propia en Planmed (`Cache-Control: no-store` en Nitro); revisar que el Hub no cachee el detalle (no se observó caché en `CatalogoController`).

**Fase 4 – Pruebas.** Hub (Pest/PHPUnit en `tests/Feature/Api/Cms`, siguiendo `ProcedureCmsTest` y `RecommendationAdminApiTest`): CRUD, `layout` guardado y devuelto, sección sin imagen, reemplazo/borrado de imagen sin huérfanos, archivos no permitidos y > 5 MB, reorder exacto, 404 entre líneas/empresas, maestro → 403, contrato de `CirugiaDetailResource` con y sin secciones, regresión de Recomendaciones. Planmed (`node --test`): mapeo, render por layout, fallback móvil/sin imagen, regresión de recomendaciones. Manual: página pública en móvil y escritorio.

**Fase 5 – Despliegue/reversión.** Orden: (1) migración + Hub (el campo nuevo es aditivo, los clientes actuales lo ignoran), (2) Planmed. Revertir: desplegar versión anterior de Planmed; el Hub puede quedar con la tabla (sin efecto) o `migrate:rollback` si está vacía (`down()` lo impide si hay filas). Verificar `GET /v1/web/cirugias/{slug}` en Planmed y Crediestética y una página con secciones. **No ejecutado en esta auditoría.**

## 7. Riesgos

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| 90 de 96 procedimientos son maestros: no editables por la línea | Alta | Alto (la función no sirve para ellos) | Decisión funcional §12 |
| Archivos huérfanos | Media | Bajo | `ImageAttachment` + purga en `deleting` |
| Romper consumidores (Crediestética/BMQ) | Baja | Alto | Solo campo aditivo `secciones`; no tocar claves existentes |
| Fuga entre líneas | Baja | Alto | Línea desde el token, FK compuesta, tests 404 |
| Desfase panel vs público | Media | Medio | Mismo contrato `visible/orden`; sin caché |
| Duplicidad de contenido (HTML `procedimiento` + secciones) | Media | Medio | Definir convivencia (§12) |
| Doble UI (Livewire y Nuxt) desalineadas | Media | Medio | Decidir alcance de `EditCirugia` |
| Rendimiento | Baja | Bajo | Tabla relacional con índice; ≤ decenas de filas |

## 8. Lista priorizada de archivos (probables)

**Confirmados (existen y serían tocados o reutilizados):** `app/Support/Cms/ImageAttachment.php` (reutilizar), `ManagesRecommendationAdmin.php` (extraer `reorderExact`), `app/Models/RecommendationSection.php` (`LAYOUTS` compartido), `app/Http/Resources/Web/CirugiaDetailResource.php` (campo aditivo), `routes/api.php`, `app/Policies/CirugiaPolicy.php` (solo uso), `planmed-web`: `types/procedure.ts`, `server/utils/procedures.ts`, `pages/procedimientos/[slug].vue`, `pages/admin/procedimientos/[slug].vue`, `components/admin/recommendations/TreeSectionForm.vue` (extraer), `components/recommendations/RecommendationSections.vue` y `SectionMedia.vue` (extraer).
**Nuevos (por crear):** migración `cirugia_sections`, `CirugiaSection`, `Cms\ProcedureSectionController`, request/resource, pruebas; rutas Nitro `server/api/admin/procedures/[id]/sections*`.
**Por verificar:** si `cirugias` admite la FK compuesta (índice único de scope), `EditCirugia` Livewire, caché del detalle público en producción, y qué usa BMQ del catálogo.

## 9. Complejidad relativa

Fase 0: baja · Fase 1: media-alta (migración + controlador + pruebas) · Fase 2: media · Fase 3: media · Fase 4: media · Fase 5: baja-media.

## 10. Decisiones pendientes (requieren tu decisión)

1. **Maestros (90 de 96):** ¿solo procedimientos propios, o se quiere que cada línea pueda añadir secciones propias sobre un maestro (tabla por línea + maestro)? Esto cambia el modelo y la FK.
2. ¿Las secciones **reemplazan** el HTML único `procedimiento` o se muestran **debajo** de él?
3. ¿Campos mínimos (título, texto, imagen, posición) o también subtítulo, vídeo y botón?
4. ¿Se debe poder editar también desde la UI Livewire del Hub (`EditCirugia`)?
5. ¿Vista previa en el panel? (opcional).
6. Orientación de portada: hoy se guarda en Planmed (`procedure-image-orientation.json`); si se hace migración en el Hub podría moverse allí (`cirugias` o `cirugia_linea`).

## 11. Limitaciones de esta auditoría

No se ejecutaron pruebas del Hub ni se probó la API en vivo con tokens de otra línea; las conclusiones sobre aislamiento se basan en lectura de código (políticas, `scopedTo`, FK). No se revisó producción. No se verificó si el servidor cachea `GET /v1/web/cirugias/{slug}`.

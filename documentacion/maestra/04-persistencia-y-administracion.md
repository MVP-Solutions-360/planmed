# 04 — Persistencia y administración por módulo

Hub = `C:\xampp\htdocs\laravel\wellezy-hub-2`. Contrato detallado: `docs/cms/persistence-api.md` del Hub. Todas las rutas CMS exigen Bearer + `api.context`; las públicas `throttle:60,1` + `linea.tenant`.

## 1. Procedimientos
| Ítem | Detalle |
|---|---|
| Fuente de verdad | Hub: `cirugias` (+ pivote `cirugia_linea`, `media_assets` morph para imagen/galería) |
| Lectura pública | `GET /api/v1/web/cirugias[/{slug}]` → Nitro `/api/public/procedures*` |
| Escritura | `/api/cms/procedures` (+ `/image`, `/gallery`) → Nitro `/api/admin/procedures*`; permisos `cirugias.*` |
| Campos persistidos | nombre, slug, categoría, descripción corta, procedimiento (HTML), ficha técnica, perfil paciente, edad/IMC, SEO, `activo`, `destacado`, `recomendaciones_post`, `recomendaciones_revision` |
| Aislamiento | `company_id/linea_id` NULL = maestro (solo `activo`/`destacado` editables por una línea; otro campo → 403); propios por línea; de otra línea → 404 |
| Datos locales/mocks | Ninguno. |
| Pendiente | Menú dinámico (PM-PROC-01). No hay necesidad de campos nuevos demostrada. |

## 2. Recomendaciones
| Ítem | Detalle |
|---|---|
| Fuentes | (a) `recommendation_pages` (páginas independientes: título, etiqueta, grupo, slug único por línea, video YouTube, `content` HTML, **una** imagen, `orden`, `published`, `is_custom`); (b) `cirugias.recomendaciones_post` (columna **JSON** con cast array; strings → HTML; listas históricas se devuelven como arreglo) y `cirugias.recomendaciones_revision` (longText) |
| Endpoints | CMS `/api/cms/recommendation-pages` (CRUD, `/image`, `/reorder`); público `/api/v1/web/recommendation-pages[/{slug}]`; procedimientos: ver §1 |
| Nitro (Planmed) | `server/api/{admin,public}/recommendations/*` (sin commit, en curso por otra sesión) |
| Mock a eliminar | `providers/MockRecommendationsProvider.ts` (localStorage `planmed-mock-recommendations`): **ya no aparece en el árbol**; confirmar que ningún import queda |
| Permisos | `recomendaciones.{ver,crear,editar,eliminar}`; páginas base (`is_custom=false`) no se eliminan (403) |
| Siembra | `PlanmedRecommendationPagesSeeder` (`firstOrCreate`, no destructivo, **manual**) crea `cita-preanestesia` y `prequirurgicas` |
| Lo que el esquema NO soporta | introducción separada, sección «Es normal», antes/después en la página, imagen/video adicional, CTA configurable, bloques «financiamiento»/«contáctanos», relación con un procedimiento |
| Compatibilidad histórica | Mantener `recomendaciones_*` sin reescribir al leer (la lectura solo transforma para mostrar) |

### 2.1 Regla de precedencia (vigente, comprobada con pruebas)
Hay **dos fuentes con rutas separadas**; no hay fallback entre ellas, por eso un contenido despublicado no puede reaparecer:
- **R1** `recommendation_pages` es la fuente principal y exclusiva de las páginas independientes (`/recomendaciones/<slug>`). Publicada → 200. Existente pero **despublicada** → el Hub público no la entrega → 404; Planmed **no consulta** `cirugias` como alternativa. Inexistente → 404 (el público no puede distinguirlas).
- **R2** Los campos `recomendaciones_post/revision` de `cirugias` (texto o lista histórica) alimentan solo `/recomendaciones/{cuidados|revision}/<procedimiento>`; esa ruta no consulta páginas independientes.
- **R3** El campo histórico sigue siendo compatible y la lectura no escribe ni migra nada (todas las rutas públicas son `GET`).
- **R4 — bloqueo de contrato (no se inventó API):** una página independiente no puede declararse «sustituta» del campo histórico de un procedimiento porque `recommendation_pages` no tiene vínculo con `cirugias` y la API pública no distingue «despublicada» de «inexistente». Para aplicar «el fallback histórico solo se usa si no existe una página que lo sustituya» el Hub tendría que aportar `cirugia_id` + `kind` en `recommendation_pages` y un indicador público (p. ej. `reemplaza_historico`) o el estado de existencia. **Propuesta para otra fase del Hub; no implementada.**
Pruebas: `tests/recommendations/errors-precedence.test.ts` (grupo «precedencia de Recomendaciones»; R4 falla si el tipo de Planmed incorpora el vínculo, para forzar la revisión de esta regla).

## 3. Nuestros pacientes
| Ítem | Detalle |
|---|---|
| Tablas | `patient_section_settings` (1 fila/línea: `show_videos`, `show_before_after`, `referral_title`, `referral_content`), `testimonial_embeds` (YouTube/Instagram, URL normalizada, único por línea/plataforma/id), `web_before_after_cases` (+ imágenes `before`/`after` en `media_assets`) |
| Endpoints | CMS: `/api/cms/{patient-section, testimonial-embeds[/reorder], before-after-cases[/{id}/images, /reorder]}`; público: `GET /api/v1/web/patient-section` |
| Permisos | `pacientes_web.*` |
| Visibilidad | Videos solo si `show_videos`; casos solo si `show_before_after` **y** publicados con ambas imágenes; Instagram solo activos |
| Mocks | `MockTestimonialsProvider` (localStorage `planmed-mock-testimonials`) **eliminado** en esta fase; `TestimonialsService` usa Hub |
| Implementación | `server/utils/patients.ts`, `server/api/{admin,public}/patient-section*`. Planmed conserva `id` string (id de Hub como texto; temporal `new-…` para nuevos) y `beforeImage/afterImage` (URL pública, o data URL al subir). Guardado por diff, no transaccional: ver `08` |

## 4. Noticias
`posts`, `post_sections`, `post_authors`; CMS `/api/cms/posts[/{id}/cover]` (permisos `blog.*`), público `/api/v1/web/posts[/{slug}]`. Planmed ya consume ambos. Estados y visibilidad: `draft/review/approved/published/internal`. Verificar en Planmed: despublicada → 404 público (cubierto en Hub por `PublicNewsPublicationTest`).

## 5. PRP
`prp_referrers` (CMS `/api/prp-referrers`, público `/api/v1/web/prp/{slug}`). El envío del formulario va al CRM médico externo (`forms-px-prp`), no a Hub. **[No verificado]** que ese CRM sea el mismo que el de Hub; registros creados por ese CRM: ver `06`.

## 6. Reglas de aislamiento (todas las tablas nuevas)
FK compuesta `(linea_id, company_id) → lineas(id, company_id)`; empresa/línea del token (nunca del cuerpo); 404 indistinto para otra línea; `LineOwnedContentPolicy` (permiso + pertenencia, sin maestros); purga de `media_assets` al borrar por Eloquent (límite conocido: `DELETE` SQL directo sobre `lineas/companies` no purga archivos).

## 7. Migraciones pendientes
- Del Hub: las 7 migraciones del 2026-10-09 (`…095900`–`…100500`) existen en el árbol; que estén **aplicadas en cada entorno** es **[No verificado]** (no se consultó ninguna base real).
- Para PM-RECO-04 (bloques de abdominoplastia): ampliación de `recommendation_pages` propuesta en la fase anterior; **no creada** (sin aprobación ni contenido original).

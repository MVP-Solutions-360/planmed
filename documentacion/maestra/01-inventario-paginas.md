# 01 — Inventario de páginas

Fecha de comprobación: 2026-10-09 · Estado = código del árbol de trabajo (no producción).
Tipos de brecha: **INEXISTENTE** (no hay página), **INCOMPLETA** (existe pero falta contenido/comportamiento), **NAVEGACIÓN** (solo requiere ajustes de enlaces/menú), **OK*** (existe y está conectada a su fuente; *no implica verificación visual contra la web original*).

> «Contenido de la web original»: no hay copia de la web de producción ni las capturas en ningún repositorio. Solo se registra lo documentado o deducible del código. Todo lo demás es **[No verificado]**.

## 1. Planmed (`planmed-web`)

### 1.1 Páginas públicas

| Ruta | Menú | Fuente de datos hoy | Estado | Brecha / falta | Dependencias | Verificación necesaria |
|---|---|---|---|---|---|---|
| `/` (`pages/index.vue`) | Inicio | Estático + `ProceduresSection` (procedimientos de Hub) [Código] | OK* | Contenido original [No verificado] | Hub `GET /v1/web/cirugias` | Comparar con capturas |
| `/procedimientos` | Procedimientos (enlace simple) | Hub vía `/api/public/procedures` (SSR con `useAsyncData`) [Código] | OK* | El menú de escritorio y móvil es **desplegable** con los procedimientos de la lista pública de Hub (PM-PROC-01, implementado; ver `08` §6) | Hub catálogo, `cirugia_linea` | `tests/navigation/procedures-menu.test.ts` |
| `/procedimientos/[slug]` | — | Hub detalle [Código] | OK* | Revisar uso de `galeria`, `ficha_tecnica`, `perfil_paciente` y antes/después ya expuestos (PM-PROC-03) | Hub | Visual |
| `/noticias`, `/noticias/[slug]` | Noticias | Hub `GET /v1/web/posts` vía Nitro, SSR [Código] | OK* | Contenido HTML renderizado con sanitización de Hub (el Hub sanitiza; ver `04`) | Hub `posts` | Estados vacío/despublicado |
| `/recursos` | Recursos | Estático; muestra «Próximamente… documentos» [Código] | **INCOMPLETA** | No hay documentos; el original [No verificado] (PM-REC-01) | [Decisión] contenido | Capturas |
| `/nosotros` | Nosotros | Estático, prerender [Código] | OK* | Contenido original [No verificado] | — | Capturas |
| `/simulador` | Botón «Simular financiación» | `MockQuotationProvider` + `MockLeadProvider` (**solo `console.log`**) [Código] | **INCOMPLETA** | El lead **no se envía a ningún CRM** (PM-PRE-01). Regla de tasa/financiación: no tocar | CRM receptor [Decisión] | Ver `06` |
| `/prp/[slug]` | — (microsito por referidor) | Hub `GET /v1/web/prp/{slug}` + envío directo al CRM externo `forms-px-prp` [Código] | OK* | Envío navegador→CRM externo sin Hub (decisión previa documentada) | CRM `pdtclientsolutions.com/crm-public` [Doc] | Prueba con CRM de pruebas [No verificado] |
| `/testimonios` (Videos) | Nuestros pacientes | Hub `GET /v1/web/patient-section` vía Nitro, SSR [Código, sin commit] | OK* (técnico verificado en `08`) | Texto introductorio fijo en la página (de la web original, no verificado); falta revisión visual | Hub `testimonial_embeds`, `patient_section_settings` | Visual |
| `/testimonios/antes-y-despues` | Nuestros pacientes | Hub vía Nitro, SSR; imágenes en `media_assets` [Código, sin commit] | OK* | Solo casos publicados con ambas imágenes (regla de Hub) | Hub `web_before_after_cases` | Visual |
| `/testimonios/programa-de-referidos` | Nuestros pacientes | Hub vía Nitro, SSR [Código, sin commit] | OK* | Contenido lo escribe el equipo (vacío = «Pronto publicaremos…») | Hub | Visual |
| `/recomendaciones/[slug]` | Recomendaciones | **Antes: Mock/localStorage; ahora el árbol tiene `PublicRecommendationsService`→Nitro→Hub** (en curso por otra sesión) [Código, sin commit] | EN CURSO | Verificar que no quede localStorage y la precedencia (PM-RECO-01/02) | Hub `recommendation_pages` | Ver `04` |
| `/recomendaciones/cuidados` y `/{slug}` | Recomendaciones → Cuidados de cirugías | Campo `recomendaciones_post` del procedimiento (Hub) [Código] | OK* parcial | «Cuidado de abdominoplastia» no tiene sus bloques (intro, antes/después, «Es normal», financiación, contáctanos, CTA, recurso inferior) (PM-RECO-04) | Hub | [Decisión], capturas |
| `/recomendaciones/revision` y `/{slug}` | Recomendaciones → Cita de revisión | Campo `recomendaciones_revision` (Hub) [Código] | OK* | **Conservar** «Revisión mamoplastia»; no tocar su campo/ruta | Hub | Regresión |
| `/recomendaciones/cita-preanestesia`, `/recomendaciones/prequirurgicas` | Recomendaciones (generales / revisión) | Páginas base de `recommendation_pages` (sembradas por `PlanmedRecommendationPagesSeeder`, no automático) [Código] | Depende de que el seeder se haya corrido en cada entorno [No verificado] | Si el seeder no corrió, el menú no las muestra | Hub | Comprobar en entorno local |

### 1.2 Navegación (`components/layout/Navbar.vue`)

| Elemento | Estado |
|---|---|
| Enlaces principales: Inicio, Procedimientos, Noticias, Recursos, Nosotros | Fijos en el código. «Procedimientos» con desplegable alimentado por Hub (PM-PROC-01); sin procedimientos o con Hub caído queda como enlace simple. |
| Desplegable NUESTROS PACIENTES (Videos, Antes y después, Programa de referidos) | Ítems fijos; la visibilidad de Videos/Antes y después viene de Hub (`publicTestimonialsService`) [Código, sin commit]. |
| Desplegable RECOMENDACIONES (generales, Cuidados, Revisión) | Se arma con procedimientos públicos con texto + páginas publicadas; en curso de pasar a Hub (PM-RECO-03). |
| Altura máxima y scroll en desplegables de escritorio | Verificado en navegador (medidas del DOM, ver `08` §6): Procedimientos y los submenús de Recomendaciones tienen `max-height` ligada al viewport + `overflow-y-auto`; el menú móvil scrollea. |
| Botones «Simular financiación» e «Iniciar sesión» (`/admin/login`) | Presentes. |

### 1.3 Administración (`/admin/*`)

| Ruta | Fuente | Estado |
|---|---|---|
| `/admin/login` | `WellezyAuthProvider` → `/api/auth/*` → Hub `/api/auth/login` [Código] | OK* |
| `/admin/procedimientos[/slug]` | Hub `/api/cms/procedures` [Código] | OK*; guardar recomendaciones por procedimiento estaba bloqueado (`HubProcedureProvider`) y está siendo modificado por otra sesión. |
| `/admin/noticias[/slug]` | Hub `/api/cms/posts` [Código] | OK* |
| `/admin/micrositios[/id]` (PRP) | Hub `/api/prp-referrers` [Código] | OK* |
| `/admin/recomendaciones` | Hub `/api/cms/recommendation-pages` (en curso) | EN CURSO |
| `/admin/testimonios` | Hub `/api/cms/{patient-section,testimonial-embeds,before-after-cases}` vía Nitro | OK* técnico; requiere permisos `pacientes_web.*` asignados al rol |
| `/admin/configuracion` | Placeholder «Pendiente de Wellezy Hub» | **INEXISTENTE** funcionalmente. Ojo: Hub ya tiene `GET/PATCH /api/cms/line-users` (`LineUserController`, middleware `line.leader`) [Código]; el texto de la página quedó desactualizado (PM-CFG-01). |

## 2. Crediestética (`Cliniplanes/cliniplanes-web`)

Solo se auditó estructura, configuración y navegación [Código]. No se auditó cada página.

| Ruta | Menú | Fuente | Estado / nota |
|---|---|---|---|
| `/` | Logo | Estático (i18n es/en/pt) | Existe |
| `/procedimientos`, `/procedimientos/[slug]` | Procedimientos | `procedureSource`: `local` (MySQL propio) por defecto o `crm` (Hub, `CrmProcedureProvider`) | Existe; **catálogo propio**, no es el de Hub por defecto |
| `/simulador` | Simulador + botón | `LeadForm` → `POST /api/v1/leads` con `X-Wellezy-Tenant` [Doc, `conexiones_crm.md`] | Existe; envía lead real al Hub [no verificado en ejecución] |
| `/recursos`, `/nosotros` | Recursos, Nosotros | Estático | Existe |
| `/login`, `/admin/*` (procedimientos, categorías, cuenta, stats) | Login | Auth vía Hub (`authApiBaseUrl`) + MySQL propio | Existe |
| Noticias, Recomendaciones, Nuestros pacientes, PRP | — | — | **INEXISTENTES** en el código; **[Decisión]**: no se sabe si la web original de Crediestética los tiene o los necesita |

Locales: `es` (por defecto), `en`, `pt` con `prefix_except_default`.

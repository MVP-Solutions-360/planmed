# 05 — Matriz de trazabilidad

`—` = no aplica o no existe todavía. Rutas relativas a `planmed-web` salvo `Hub:` (= `wellezy-hub-2`).

| Requisito (ID) | Página | Componente | API Nitro | API Hub | Tabla | Permiso | Prueba |
|---|---|---|---|---|---|---|---|
| PM-RECO-01 páginas independientes en Hub | `pages/recomendaciones/[slug].vue`, `pages/admin/recomendaciones/index.vue` | `RecommendationShell`, `AdminRichTextEditor` | `server/api/{admin,public}/recommendations/*` | `GET/POST/PUT/DELETE /cms/recommendation-pages`, `GET /v1/web/recommendation-pages[/{slug}]` | `recommendation_pages`, `media_assets` | `recomendaciones.*` | Hub: `tests/Feature/Api/Cms/RecommendationPagesCmsTest.php` ✔ · Planmed: pendiente |
| PM-RECO-02 precedencia | `components/recommendations/ProcedureRecommendation*.vue` | idem | — | — | `recommendation_pages` + `cirugias.recomendaciones_*` | — | Pendiente (requiere [Decisión]) |
| PM-RECO-03 menú sincronizado | `components/layout/Navbar.vue` | Navbar | `/api/public/recommendations` | `GET /v1/web/recommendation-pages` | `recommendation_pages` | público | Pendiente |
| PM-RECO-04 abdominoplastia | por definir | por definir | por definir | por definir | `recommendation_pages` (ampliar) | `recomendaciones.*` | Bloqueada |
| PM-RECO-05 Revisión mamoplastia | `pages/recomendaciones/revision/[slug].vue` | `ProcedureRecommendation` | `/api/public/procedures/{slug}` | `GET /v1/web/cirugias/{slug}` (`recomendaciones_revision`) | `cirugias` | público | Hub `ProcedureRecommendationsTest` ✔ |
| PM-RECO-06 texto por procedimiento | `/admin/recomendaciones` (editor B) | `AdminRichTextEditor` | `PUT /api/admin/procedures/{id}` | `PUT /cms/procedures/{id}` | `cirugias` | `cirugias.*` | Hub `ProcedureRecommendationsTest` ✔ |
| PM-PROC-01 menú dinámico | `Navbar.vue` | Navbar | `/api/public/procedures` | `GET /v1/web/cirugias` | `cirugias`, `cirugia_linea` | público | Pendiente |
| PM-PAC-01 Nuestros pacientes | `pages/testimonios/*`, `/admin/testimonios` | `TestimonialsNav`, `NewsYouTubeEmbed`, `InstagramEmbed` | `server/api/{public,admin}/patient-section*` | `/cms/{patient-section,testimonial-embeds,before-after-cases}`, `GET /v1/web/patient-section` | `patient_section_settings`, `testimonial_embeds`, `web_before_after_cases`, `media_assets` | `pacientes_web.*` | Hub `PatientSectionCmsTest` ✔ · Planmed `tests/patients/server.test.ts` ✔ (17) · E2E ✔ |
| PM-NEWS-01 Noticias | `pages/noticias/*`, `/admin/noticias` | — | `/api/{public,admin}/news*` | `/cms/posts`, `/v1/web/posts` | `posts`, `post_sections` | `blog.*` | Hub `PostCmsTest`, `PublicNewsPublicationTest` (no ejecutadas en esta fase) |
| PM-PRE-01 Preaprobado | `pages/simulador.vue` | `LeadForm`, `PrecontractualModal` | — | `POST /v1/leads` (candidato) | `leads`, `lead_requests` | público | Bloqueada (`06`) |
| PM-PAG-01 Pagos | — | — | — | propuesta Wompi | propuesta | — | Bloqueada (`06`) |
| PM-CFG-01 Configuración | `pages/admin/configuracion/index.vue` | — | `/api/admin/config/access` (existe) | `/cms/line-users` | `personnels` | líder de línea (`line.leader`) | Hub `LineUserTest` (no ejecutada) |
| CO-AISL-01 Aislamiento | — | — | — | middleware `api.context`, `LineOwnedContentPolicy` | FK compuesta `(linea_id, company_id)` | — | Hub `CmsPermissionMatrixTest`, `PersistenceIntegrityTest` (no ejecutadas en esta fase) |

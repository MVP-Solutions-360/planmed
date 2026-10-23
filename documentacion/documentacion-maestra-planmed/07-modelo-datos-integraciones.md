# 07 · Modelo de datos e integraciones

No hay base de datos propia: Planmed web es *stateless* salvo 4 archivos JSON locales. Los contratos de Hub se extraen de `server/utils/*.ts` y `shared/utils/*.ts`; el **repositorio del Hub no se inspeccionó** en esta auditoría (la documentación previa `documentacion/maestra/04` y el Hub `docs/cms/persistence-api.md` lo describen).

## 1. Entidades (modelo de Planmed ↔ contrato de Hub)
| Entidad | Modelo web | Campos principales | Hub (snake_case) |
|---|---|---|---|
| **Procedimiento** | `ProcedureDto` (`types/procedure.ts`, `server/utils/procedures.ts`) | `id, slug, name, category, shortDescription, whatIsIt(html), image, galeria[], galeriaAssets[{id,url}], destacado, activo, isMaster, editable, ficha_tecnica{tipo_anestesia,tiempo_quirurgico,tiempo_recuperacion,cicatrizacion_minima}, perfil_paciente{edad_minima,edad_maxima,imc_maximo,condiciones_medicas_compatibles}, seo{meta_title,meta_description}, recomendaciones_post/revision(html), recomendaciones{cuidados,revision:{fuente,paginaSlug}}` | `nombre, categoria_slug, descripcion_corta, procedimiento, imagen_destacada, galeria, es_maestro, activo, destacado, edad_*, imc_maximo, perfil_paciente, meta_*, recomendaciones_*` (tabla `cirugias` + `cirugia_linea`) |
| **Noticia** | `NewsArticleDto` | `id, slug, title, excerpt, content, coverImage, publishedAt, author, seo{metaTitle,metaDescription}, youtubeUrl, instagramUrl` | `posts`: `title, slug, excerpt, content, cover_url, status, published_at, author_name, meta_*, youtube_url, instagram_url` |
| **Pacientes** | `PatientContentDto` | `visibility{videos,beforeAfter}, videos[], beforeAfter[], instagram[], referral{title,content}` | `patient_section_settings` (`show_videos, show_before_after, referral_*`), `testimonial_embeds` (`platform, url, title, activo, external_id`), `web_before_after_cases` (`title, description, before_url, after_url, published`) |
| **Recomendación (árbol)** | `Tree*` (`types/recommendationTree.ts`) | Tema{slug,title,menu_label,orden,published}, Subtema{grupo,intro{content,video_url,image_url},short_url}, Sección{type,layout,image,video,cta,visible}, Recomendación{title,content,published} | `recommendation_*` |
| **Recomendación heredada** | `RecommendationPage` | `slug,title,content,group,procedureSlug,published,image` | `recommendation_pages` |
| **Micrositio PRP** | `Prp` (`types/prp.ts`) | `id,name,externalCode,slug,title,isActive` | `prp_referrers`: `name, external_code, slug, title, is_active` |
| **Usuario admin** | `AdminUser` (`types/auth.ts`) | `id,name,email,role{id,name},isAreaLeader,canEditRate` | `users` + `personnels.is_area_leader` |
| **Nosotros** | `AboutContent` (`shared/utils/aboutContent.ts`) | `hero, institutional{title,legal,paragraphs[3]}, video, faqs[≤30], contact{address,building,city,region,phone,email,schedule,socials,map}, updatedAt` | — (archivo local) |
| **Clínicas** | `ClinicsContent` | `clinics[≤100]{id,name,description,image,gallery[≤20],documents[≤10]{title,files[≤5]}}` | — (local) |
| **Página simple** | `SitePageContent` | `title, subtitle, body, updatedAt` | — (local) |
| **Tasa** | `financing-rate.json` | `rate("2.0000"), updatedAt, updatedBy, history[≤500]` | — (local) |

## 2. Capa cliente: servicios y proveedores
| Servicio (`services/`) | Proveedor (`providers/`) | Endpoint propio (`/api/…`) | Real/Mock |
|---|---|---|---|
| `PublicProcedureService` | `HubPublicProcedureProvider` | `public/procedures[/:slug]` | real |
| `ProcedureService` (admin) | `HubProcedureProvider` | `admin/procedures` | real |
| `PublicNewsService` / `NewsService` | `HubPublicNewsProvider` / `HubNewsProvider` | `public/news`, `admin/news` | real |
| `PublicTestimonialsService` / `TestimonialsService` | `HubPublic…` / `Hub…` | `public/patient-section`, `admin/patient-section` | real |
| `PublicRecommendationsService` / `RecommendationsService` | `HubPublicRecommendationsProvider` / `HubRecommendationsProvider` | `public/recommendation*`, `admin/recommendations` | real |
| (sin servicio) | `HubRecommendationTreeAdminProvider` (`recommendationTreeAdmin`) | `admin/recommendation-tree/**` | real |
| `PublicPrpService` / `PrpService` | `HubPublicPrpProvider` / `HubPrpProvider` | `public/prp/:slug`, `admin/prp` | real |
| `PrpLeadService` | `CrmPrpLeadProvider` | **CRM directo (navegador)** | real |
| `ReferralService`, `ValuationService` | fetch propio | `forms/prp-enrollment`, `forms/valuation` | real |
| `AuthService` | `WellezyAuthProvider` | `auth/*` | real |
| `AboutService`, `ClinicsService`, `SitePagesService`, `FinancingRateService`, `LineUsersService` | fetch | `admin/about`, `admin/clinics`, `admin/pages`, `admin/config/*`, `public/*` | real (local) |
| `QuotationService` | `MockQuotationProvider` | — | **Nombre «Mock» pero calcula con la tasa real configurada**; `isMock:true` es solo una marca |
| `LeadService` | `MockLeadProvider` | — | **mock real** (espera 1,5 s, `console.log`) |
| `TrackingService` | `LocalTrackingProvider` | — | **simulado** (solo consola) |
Datos estáticos: `data/clinics.ts` (respaldo de logos de la home), `data/allies.js`, `data/resources.ts` (vacío).

## 3. Integraciones
### 3.1 Wellezy Hub — autenticación (lectura/escritura de sesión)
| Aspecto | Detalle |
|---|---|
| Archivos | `server/utils/wellezy.ts`, `server/utils/auth.ts`, `server/api/auth/*` |
| Config | `NUXT_WELLEZY_API_BASE_URL`, `NUXT_WELLEZY_COMPANY_SLUG`, `NUXT_WELLEZY_LINE_SLUG`, `NUXT_PLANMED_ADMIN_ROLE_IDS`, `NUXT_SESSION_PASSWORD` |
| Endpoints | `POST /auth/login` (`{email,password,company,line}`), `GET /auth/me`, `POST /auth/logout` (Bearer) |
| Errores/timeout | timeout 10 s, sin reintentos; 0 = sin respuesta ⇒ 503; el token nunca se loguea |
| Vistas | todo el panel |
| Pruebas | `tests/security/routes.test.ts`, `tests/about/*` |

### 3.2 Wellezy Hub — lectura pública (`X-Tenant-Linea`)
`GET /v1/web/cirugias[?page]`, `/cirugias/{slug}`, `/posts?per_page=50`, `/posts/{slug}`, `/patient-section`, `/recommendation-topics`, `/recommendation-topics/{t}/{s}`, `/recommendation-pages`, `/recommendation-pages/{slug}`, `/prp/{slug}`. Línea = `NUXT_WELLEZY_LINE_SLUG` (nunca del navegador). Clasificación de fallos: `server/utils/publicErrors.ts`. Vistas: ver `02`. Pruebas: `tests/integration/hub-readonly.test.ts`, `tests/patients/*`, `tests/recommendations/*`.

### 3.3 Wellezy Hub — administración (Bearer de sesión)
`/cms/procedures` (+`/{id}/image`, `/{id}/gallery[/{asset}]`), `/cms/posts` (+`/{id}/cover`), `/cms/patient-section`, `/cms/testimonial-embeds`, `/cms/before-after-cases` (+`/{id}/images`), `/cms/recommendation-pages` (+`/{id}/image`), `/cms/recommendation-topics|subtopics|sections|items|section-types` (32 rutas), `/cms/line-users`, `/prp-referrers`. Traducción de errores (`translate`, `translateTree`): 401 ⇒ limpia sesión; 403; 404; 409 (integridad, conserva mensaje de Hub); 422 (errores por campo); 429; otros ⇒ 503. **Empresa y línea nunca se envían**: Hub las deriva del token. Subidas: multipart con timeout 30 s.

### 3.4 Wellezy Hub — escritura pública
`POST /v1/web/prp-enrollments` con `Idempotency-Key` = HMAC(`NUXT_SESSION_PASSWORD`, payload). Éxito `201/200` con `data.status ∈ {completed, received}`; 422/409/429/otros traducidos; **sin reintento automático** (el usuario puede reintentar con la misma clave). Vista: Programa de referidos.

### 3.5 CRM médico — valoración (servidor)
`POST` multipart a `NUXT_CRM_VALUATION_URL` (por defecto `https://pdtclientsolutions.com/crm-public/api/clients/forms`). Campos (`buildCrmFields`): nombres, apellidos, identificación, fecha de nacimiento, dirección (=ciudad), teléfono, email, `name_surgery`, forma de pago, aceptación. Timeout 15 s, **sin reintentos**, límite 8/10 min/IP, bloqueo de duplicado 2 min, éxito solo con confirmación (`crmConfirmed`). Prueba: `tests/valuation/valuation.test.ts`. Escribe en sistema externo ⇒ **no ejecutado** aquí.

### 3.6 CRM médico — PRP (navegador)
`POST` multipart directo a `NUXT_PUBLIC_CRM_PRP_FORM_URL` (por defecto `…/crm-public/api/forms-px-prp`) con `code_prp`. Timeout 20 s. URL expuesta al cliente. Sin límite propio.

### 3.7 Almacenamiento local
`NUXT_PLANMED_CONTENT_DIR`: `about.json`, `clinics.json`, `pages/clinicas-aliadas.json`, `financing-rate.json`, imágenes/documentos con nombre generado. Escritura atómica + `*.prev.json`; lectura corrupta ⇒ error 500 al editar y contenido inicial/vacío al leer públicamente (la tasa **no** tiene respaldo: 503).

### 3.8 Servicios de terceros incrustados
YouTube (`youtube-nocookie`/`youtube.com/embed`), Instagram (`embed.js`), Google Maps (iframe construido por `aboutMapEmbedUrl`), Google Fonts, PDFs en `planmed.com.co`, WhatsApp/Messenger (enlaces). Sin SDK de analítica ni pagos.

## 4. Variables de entorno (nombres y propósito; valores no documentados)
| Variable | Visibilidad | Propósito |
|---|---|---|
| `NUXT_WELLEZY_API_BASE_URL` | servidor | base de la API de Hub (`…/api`) |
| `NUXT_WELLEZY_COMPANY_SLUG`, `NUXT_WELLEZY_LINE_SLUG` | servidor | empresa/línea (por defecto `planmed`) |
| `NUXT_PLANMED_ADMIN_ROLE_IDS` | servidor | roles autorizados para el CMS (def. `19`) |
| `NUXT_PLANMED_RATE_EDITOR_ROLE_IDS` | servidor | roles que, además del líder, editan la tasa (def. `19`) |
| `NUXT_SESSION_PASSWORD` | servidor | secreto de cookie e idempotencia (≥32 caracteres; obligatorio) |
| `NUXT_TRUSTED_PROXY_HOPS` | servidor | proxies de confianza para la IP del cliente (0 = ignorar `X-Forwarded-For`) |
| `NUXT_PLANMED_CONTENT_DIR` | servidor | directorio persistente del contenido local |
| `NUXT_CRM_VALUATION_URL` | servidor | CRM de valoración |
| `NUXT_PUBLIC_CRM_PRP_FORM_URL` | **público** | CRM del formulario PRP |
| `NUXT_PUBLIC_SITE_URL` | público (nuxt-site-config) | dominio canónico (def. `https://planmed.com.co`) |
`.env.example` solo documenta una parte (ver `.env.example`); `.env` real **no se leyó por valor**.

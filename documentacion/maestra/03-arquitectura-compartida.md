# 03 — Arquitectura compartida y diferencias por marca

## 1. Capas en Planmed [Código]

```
Vue (páginas/componentes) → Service (services/*) → Provider (providers/*) → rutas Nitro (server/api/*) → Wellezy Hub
```
- La UI no llama a Hub directamente. Los providers `Hub*` hablan **solo** con `/api/public/*` y `/api/admin/*` de Nitro.
- Nitro reenvía a Hub con `server/utils/wellezy.ts`: `wellezyPublicGet` (cabecera `X-Tenant-Linea: <NUXT_WELLEZY_LINE_SLUG>`) y `wellezyRequest/wellezyUpload` (Bearer de la sesión; httpOnly, sellada con `NUXT_SESSION_PASSWORD`).
- `company_id`/`linea_id` **nunca** viajan desde el navegador: Hub los deriva del token (CMS) o del slug de la línea (público).
- Proveedores aún no conectados a Hub: `MockQuotationProvider`, `MockLeadProvider`, `LocalTrackingProvider`, `MockTestimonialsProvider`.
- Excepción documentada: `CrmPrpLeadProvider` envía el formulario PRP **directo del navegador** al CRM médico externo (`public.crmPrpFormUrl`), no a Hub.

## 2. Componentes y servicios reutilizables (Planmed)

| Pieza | Para qué | Nivel de reutilización (ver `07`) |
|---|---|---|
| `server/utils/wellezy.ts`, `auth.ts` (sesión, traducción de errores, `adminSession`) | Cliente Hub server-side | Configurable (cambia base URL, slugs, roles) |
| Patrón `server/utils/{procedures,news,prp,recommendations}.ts` (DTO ↔ contrato Hub, `pick*Body`, `hub*`) | Un módulo por recurso | Común (patrón) |
| `AdminRichTextEditor` (TipTap) + `utils/richText.ts` | HTML enriquecido; Hub sanitiza al guardar y leer | Común |
| `utils/imageFile.ts` (data URL optimizada) + `dataUrlToBlob` en Nitro | Subida de imágenes como multipart | Común |
| `CommonRichContent`, `RecommendationShell`, `NewsYouTubeEmbed`, `InstagramEmbed` | Presentación | Configurable (estilos de marca) |
| `useNotify` (SweetAlert2) | Avisos admin | Común |

## 3. Qué administra el Hub y qué pertenece a cada web

| Contenido | Dueño | Notas |
|---|---|---|
| Procedimientos (catálogo, categorías, galerías, ficha) | **Hub** (`cirugias`, `cirugia_linea`, `media_assets`) | Maestros (`linea_id NULL`) solo se habilitan/destacan; propios se editan. |
| Noticias | **Hub** (`posts`, `post_sections`) | |
| PRP / micrositios | **Hub** (`prp_referrers`) | Formulario PRP envía a CRM externo. |
| Recomendaciones (páginas) | **Hub** (`recommendation_pages`) | Más texto histórico por procedimiento (`cirugias.recomendaciones_*`). |
| Nuestros pacientes (videos, Instagram, casos, referidos) | **Hub** (`testimonial_embeds`, `web_before_after_cases`, `patient_section_settings`) | Aún sin conectar en Planmed. |
| Textos de marca: inicio, nosotros, recursos, copy comercial, reglas del simulador | **La web** (código) | `business_rules.md` manda; no mover al Hub sin decisión. |
| Identidad visual, navegación fija | **La web** | |
| Leads / valoraciones / pagos | **Hub (CRM)** [Doc/propuesta] | Ver `06`. |

## 4. Identificación de empresa y línea

| | Planmed | Crediestética |
|---|---|---|
| Público | `X-Tenant-Linea: planmed` (config servidor `NUXT_WELLEZY_LINE_SLUG`) | `X-Wellezy-Tenant: crediestetica` desde `NUXT_PUBLIC_TENANT_SLUG` (**público en el navegador**) [Código/Doc]; `companySlug: legalmed` |
| CMS/admin | Token Sanctum de `/api/auth/login` con contexto `company:`/`line:`; Hub deriva `api_personnel.company_id/linea_id` | Auth vía `authApiBaseUrl` (Hub) + usuarios admin en MySQL propio (`wellezy_user_id`) |
| Aislamiento en BD | FK compuesta `(linea_id, company_id) → lineas(id, company_id)` en tablas nuevas; `cirugias`/`posts` con `NULL = maestro` | n/d (catálogo local por defecto) |

⚠ Hub tiene **dos mecanismos públicos de tenant** (`X-Wellezy-Tenant` para `/v1/leads`/`web-events`; `X-Tenant-Linea` para `/v1/web/*` vía `linea.tenant`). Equivalencia exacta: **[No verificado]** — leer `ResolveLineaTenant` y `LeadController` antes de unificar (CR-TEN-01).

## 5. Autenticación y autorización

- **Planmed:** `WellezyAuthProvider` → `/api/auth/login` (Nitro) → Hub `/api/auth/login`. Acceso al admin por `user.role.id ∈ NUXT_PLANMED_ADMIN_ROLE_IDS` (por defecto `19`); middleware global `admin-auth`. Permisos finos los aplica Hub (`cirugias.*`, `blog.*`, `recomendaciones.*`, `pacientes_web.*`) mediante políticas `LineOwnedContentPolicy` + `LineContext`.
- **Crediestética:** login propio (`server/api/auth`), `admin-guard`, cambio de contraseña centralizado.
- Los permisos `recomendaciones.*` y `pacientes_web.*` los **crea** una migración pero **no se asignan** a roles automáticamente (se asignan con la UI de Roles o `ContentAdminRoleSeeder`). Un usuario sin ellos recibe 403 de Hub aunque Planmed lo deje entrar al admin.

## 6. Configuración por entorno (Planmed)

| Variable | Uso |
|---|---|
| `NUXT_WELLEZY_API_BASE_URL` | Base de la API de Hub (local `http://localhost:8000/api`) |
| `NUXT_WELLEZY_COMPANY_SLUG`, `NUXT_WELLEZY_LINE_SLUG` | Empresa/línea (por defecto `planmed`) |
| `NUXT_PLANMED_ADMIN_ROLE_IDS` | Roles autorizados al CMS |
| `NUXT_SESSION_PASSWORD` | ≥ 32 caracteres |
| `NUXT_PUBLIC_CRM_PRP_FORM_URL` | CRM externo del formulario PRP |

Crediestética exige `NUXT_PUBLIC_API_BASE_URL` y `NUXT_PUBLIC_TENANT_SLUG` (la build falla si faltan), más `NUXT_DB_*`, `NUXT_SESSION_PASSWORD`, `NUXT_AUTH_API_BASE_URL`, `NUXT_PUBLIC_PROCEDURE_SOURCE`.

## 7. Diferencias por marca (resumen)

| Aspecto | Planmed | Crediestética |
|---|---|---|
| Idiomas | Español | es / en / pt (`@nuxtjs/i18n`, `prefix_except_default`) |
| Identidad | Verde `#0C2619`, dorado `#D3A76A`, fondo `#fcf9f8` | Negro `#111`, marfil `#F7F3EE`, dorado `#CBA36B` (Libre Bodoni + Questrial) |
| Catálogo | Hub (único) | Local MySQL por defecto; Hub opcional |
| Admin | Hub vía Nitro (sin BD propia) | BD propia + Hub para auth |
| Contenido CMS (noticias, recomendaciones, pacientes, PRP) | Sí | No existe en código |
| Reglas de negocio | `business_rules.md` (tasa referencial 2 %, 50–100 %, etc.) | **[No verificado]** — no se asume igual |

No se unifican tablas ni contratos entre marcas: Hub ya separa por `company_id/linea_id`; lo que sea común se reutiliza como **código/patrón**, no como datos compartidos.

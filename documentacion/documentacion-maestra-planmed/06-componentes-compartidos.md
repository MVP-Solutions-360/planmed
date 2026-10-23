# 06 · Catálogo de componentes, composables, servicios y utilidades

59 componentes `.vue` (autoimportados por Nuxt con prefijo de carpeta: `components/common/RichContent.vue` → `<CommonRichContent>`; si el nombre ya empieza por el de la carpeta se omite el prefijo: `components/simulator/SimulatorPanel.vue` → `<SimulatorPanel>`). Uso verificado buscando la etiqueta (incluidas las de varias líneas) en `pages/ layouts/ components/ app.vue error.vue`.

## 1. Componentes **compartidos** (usados por ≥2 vistas o por el layout)
| Componente | Archivo | Función | Props / eventos | Usado en | Reglas |
|---|---|---|---|---|---|
| `SitePageShell` | `site/PageShell.vue` | Cabecera verde + cuerpo | `title`, `subtitle?`, `wide?`, `bare?`; slot `default`, slot `actions` | quienes-somos, servicios, estudio, legales, financiación, ManagedPage | `bare` = sin contenedor |
| `SiteManagedPage` | `site/ManagedPage.vue` | Página administrada por slug | `slug`, `wide?` | clínicas-aliadas | `GET /api/public/pages/:slug`; canonical y SEO |
| `CommonRichContent` | `common/RichContent.vue` | Renderiza HTML saneado (`v-html` tras `sanitizeRichHtml`) | `html?` | nosotros, noticias, procedimientos, recomendaciones, clínicas, FAQ, contacto… | clase `.rich-content` |
| `CommonHubUnavailable` | `common/HubUnavailable.vue` | Aviso 503 con reintento | `title?`, `retrying?` / emite `retry` | listados públicos, testimonios | `role="alert"` |
| `CommonShareActions` | `common/ShareActions.vue` | Copiar enlace + WhatsApp | `title`, `path`, `shortUrl?`, `tone?`, `align?` | noticia, RecommendationShell | ver `shared/utils/share.ts` |
| `NewsYouTubeEmbed` | `news/YouTubeEmbed.vue` | Iframe YouTube desde URL (watch/youtu.be/shorts/live/embed) | `url` | noticias, testimonios, recomendaciones | |
| `NewsInstagramEmbed` | `news/InstagramEmbed.vue` | Incrusta Instagram con `embed.js` global | `url` | noticias, antes-y-después | normaliza permalink |
| `AboutFaqAccordion` | `about/FaqAccordion.vue` | Acordeón WAI-ARIA | `faqs`, `idPrefix?` | nosotros, servicios, financiación | teclado ↑↓ Inicio Fin |
| `AboutContactSection` | `about/ContactSection.vue` | Contacto administrado | `contact` | nosotros, financiación | solo muestra lo guardado |
| `TestimonialsNav` / `TestimonialsSocial` | `testimonials/*` | pestañas y redes de Pacientes | — | 3 páginas / 2 páginas | visibilidad Hub |
| `AdminRichTextEditor` | `admin/RichTextEditor.vue` | Editor TipTap | `modelValue`, `minHeight?`, `readonly?`, `placeholder?` / `update:modelValue` | 12 pantallas admin | |
| `AdminRecommendationsStatusBadge` | `admin/recommendations/StatusBadge.vue` | Insignia | `label`, `tone` (green/amber/blue/gray) | 8 | |
| `AdminRecommendationsTreeBreadcrumb` | `…/TreeBreadcrumb.vue` | Migas | `crumbs[]` | 5 | |
| `AdminRecommendationsTreeNotice` | `…/TreeNotice.vue` | Aviso de error por campo | `error`, `title?`, `dismissible?`, `hideFields?` / `dismiss` | 5 | |
| `AdminRecommendationsErrorNotice` | `…/ErrorNotice.vue` | Aviso (heredado) | `error` / `dismiss` | histórico, PageEditor, SaveBar | sesión/permisos en tono ámbar |
| `AdminRecommendationsSaveBar` | `…/SaveBar.vue` | Barra de guardado | `label,dirty,saving,error,savedAt,disabled` / `save,dismiss-error` | PageEditor, LegacyTextEditor | |
| Layout: `LayoutNavbar`, `LayoutFooter`, `LayoutChatLauncher`, `FormsValuationRequest`, `CommonPrecontractualModal` | ver F10 | | | `layouts/default.vue` | |

## 2. Componentes **exclusivos** de una vista o módulo
| Componente | Vista | Notas |
|---|---|---|
| `HomeValueProposition`, `HomeProceduresSection`, `HomeProcedureCard` (`procedure: Object`), `HomeHowItWorksSection`, `HomeClinicsSection` | Inicio | F01 |
| `SimulatorPanel` | Financiación | usa `useSimulator`; abre `FormsLeadForm` |
| `FormsLeadForm` (`isOpen, procedure, amount, installments, city` / `update:isOpen`) | simulador | **mock** |
| `CreditStudyForm` | Estudio de créditos | **maqueta** |
| `PrpLeadForm` (`codePrp`) | `/prp/:slug` | envío directo al CRM |
| `ReferralForm`, `ReferralProgramContent` | Programa de referidos | `POST /api/forms/prp-enrollment` |
| `RecommendationShell`, `RecommendationSections`, `RecommendationTopicIndex`, `SectionCta` (`cta`, `variant?`), `SectionMedia`, `ProcedureRecommendation`, `ProcedureRecommendationIndex` (`kind`) | Recomendaciones públicas | F07 |
| `AdminClinicsManager` (emite `dirty`), `AdminFinancingRatePanel`, `AdminLineUsersPanel`, `AdminGuide` | Admin: clínicas, configuración | |
| `AdminRecommendationsTreeSectionForm` (`subtopicId, topicId, sectionId?` / `changed`), `…TreeItems` (`sectionId`), `…PageEditor`, `…LegacyTextEditor`, `…ProcedurePicker` | Admin: recomendaciones | |

## 3. Componentes **huérfanos** (sin uso en ninguna vista) — conservar para análisis, no eliminar
`CommonCtaSection`, `CommonMedicalLeadershipSection`, `CommonProcessSection`, `CommonResourceCard`, `CommonTrustSection`, `FormsBaseSelect`, `FormsBaseSlider`, `SimulatorNextStepsSection`, `SimulatorResultCard` (9). Parecen restos de iteraciones previas del diseño.

## 4. Composables
| Composable | Función |
|---|---|
| `useNotify()` | `success`, `warning`, `error`, `confirm` con SweetAlert2 (color de marca `#0C2619`) |
| `useServiceUnavailable(error)` | fija HTTP 503 en SSR cuando el Hub falló |
| `useSimulator()` | estado y cálculo del simulador (monto, plazo, procedimiento, ciudad, cotización, error) |
| `useTracking()` | helpers de eventos (`trackPageView`, `trackFormStart/Submit`, `trackWhatsAppClick`, `trackPolicyView`) |
| `useTreeAction()` | ejecuta una acción del árbol con `busy`/`error` normalizado (`describeTreeError`) |

## 5. Servicios y proveedores (capa de datos de cliente)
Patrón `Service` (singleton) → `Provider` (implementación). Detalle en `07` §2.

## 6. Utilidades compartidas (`shared/utils`, puras)
`aboutContent` (modelo/validación de Nosotros), `clinics`, `sitePages`, `financing` (tasa y cuota), `financingSeo`, `valuation`, `prpEnrollment`, `recommendationTree` (mapeo del Hub y rutas), `recommendationAdminApi` (rutas permitidas del proxy y mensajes de error), `share`, `clientIp`.
Utilidades de cliente (`utils/`): `navMenus` (menús), `richText` (sanear, texto plano, slug), `imageFile`, `siteError`, `adminGuide`, `recommendation*`.

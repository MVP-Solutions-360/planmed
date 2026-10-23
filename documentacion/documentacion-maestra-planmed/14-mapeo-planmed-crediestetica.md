# 14 · Matriz de mapeo Planmed ↔ Crediestética

> **Actualizado en la Fase 2 (2026-10-20).** Crediestética SÍ fue auditada (solo lectura): `C:\Users\pdtco\Desktop\Cliniplanes\cliniplanes-web\documentacion\auditoria-crediestetica\` (copia fuente de esta matriz: `07-matriz-planmed-crediestetica.md`). Evidencia COD, sin ejecución. El esqueleto de la Fase 1 se conserva al final como histórico.

**Cómo leerla.** Una fila por vista, módulo, componente, integración o flujo. Columnas: (1) ID Planmed · (2) vista/módulo/componente Planmed · (3) ruta Planmed · (4) archivo Planmed · (5) equivalente Crediestética · (6) ruta Crediestética · (7) archivo Crediestética · (8) **estado** · (9) diferencias estructurales · (10) contenido a conservar · (11) reglas de negocio a conservar · (12) integraciones · (13) permisos/auth · (14) adaptación necesaria · (15) dependencias/riesgos · (16) evidencia · (17) decisión pendiente.
**Estados:** Equivalencia directa · Equivalencia parcial · Requiere adaptación · Existe solo en Planmed · Existe solo en Crediestética · No determinado. Ninguna fila se marca «directa» por similitud de nombre: «directa» exige misma función, misma ruta o rol y datos compatibles verificados en código.
**Evidencia:** `P:` documentos Planmed (`02`, fichas F/A, `06`–`08`); `C:` archivo de Crediestética (COD). Ninguna fila tiene verificación en ejecución.
Las capas A/B/C de `13` se resumen así en cada fila: **A** = estructura reutilizable (col. 9, 14), **B** = contenido a conservar (col. 10), **C** = lógica propia (col. 11–13).

## 1. Vistas públicas
| 1 ID | 2 Planmed | 3 Ruta P | 4 Archivo P | 5 Equivalente C | 6 Ruta C | 7 Archivo C | 8 Estado | 9 Diferencias estructurales | 10 Contenido a conservar | 11 Reglas de negocio | 12 Integraciones | 13 Permisos/Auth | 14 Adaptación | 15 Dependencias / riesgos | 16 Evidencia | 17 Decisión pendiente |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P01 | Inicio | `/` | `pages/index.vue` | Inicio (C-P01) | `/` | `pages/index.vue` | Equivalencia parcial | P: secciones Home* con procedimientos del Hub y clínicas; C: héroe + proceso + seguridad clínica + aliados + financiación estáticos | marca, textos `home.*`, logos de aliados, imágenes | CTA hacia simulador | ninguna directa (aliados en `data/allies.js`) | pública | Reordenar secciones al esqueleto de Planmed sin reemplazar textos; decidir si la home lista procedimientos | enlace `#procedimientos` roto; `MedicalLeadershipSection` sin uso | P: F01; C: `pages/index.vue` | ¿La home de C muestra procedimientos destacados (como P)? |
| P02 | Financiación + simulador | `/financiacion` (`/simulador` redirige) | `pages/financiacion.vue`, `SimulatorPanel` | Simulador (C-P04) | `/simulador` | `pages/simulador.vue`, `useSimulator.js` | Requiere adaptación | P: ruta `/financiacion` con FAQ/contacto administrables y tasa configurable; C: `/simulador` cliente-solo con cuota demostrativa 2,2 % | texto `simulador.*`, plazos 12–72, rango 1M–50M, 4 ciudades | **fórmula de cuota y tasa de C son provisionales** (no oficiales); P tiene tasa/usura configurables | Hub leads (C), CRM valoración (P) | pública | Decidir ruta canónica; no portar reglas financieras de P (rango 0–5 %, 12–72, 1M–100M) sin validación de negocio | cálculo codificado en dos lugares (`useSimulator`, `LeadForm`) | P: F02, `shared/utils/financing.ts`; C: `useSimulator.js:8-22` | Tasa real, fórmula, rangos, ciudades; ¿`/financiacion` o `/simulador`? |
| P03 | Nosotros | `/nosotros` | `pages/nosotros.vue` | Nosotros (C-P06) | `/nosotros` (`/about-us`, `/sobre-nos`) | `pages/nosotros.vue` | Equivalencia parcial | P: contenido administrable (JSON local); C: estático en i18n | todo el texto, cifras, equipo | cifras «10+» y «5.000+» fijas | — | pública | Mantener plantilla de C; opcionalmente modelo `AboutContent` si se quiere admin | traducciones en 3 idiomas | P: F03/A07; C: `nosotros.vue` | ¿Contenido administrable? |
| P04 | Quiénes somos | `/quienes-somos` | `pages/quienes-somos.vue` | — | — | — | Existe solo en Planmed | página estática institucional/legal de P | — | — | — | pública | Ninguna; no crear salvo decisión | no copiar texto/NIT de P | P: F03 | ¿C necesita página legal propia? |
| P05 | Servicios | `/servicios` | `pages/servicios.vue` | — | — | — | Existe solo en Planmed | | — | — | — | pública | Ninguna | | P: F03 | ¿Se requiere? |
| P06 | Clínicas aliadas | `/clinicas-aliadas` | `pages/clinicas-aliadas.vue`, `ManagedPage` | Aliados (sección de inicio) | `/` | `data/allies.js`, `pages/index.vue` | Equivalencia parcial | P: página + admin de clínicas; C: logos en la home, sin página ni admin | logos y nombres de aliados, `images/clinics/cep` | sólo aliados `active` con logo | — | pública | Evaluar página de aliados y/o admin; hoy no hay | enlaces de aliados son `#` | P: A07; C: `allies.js` | ¿Página y admin de aliados? |
| P07 | Estudio de créditos (maqueta) | `/estudio-de-creditos` | `CreditStudyForm` | Solicitud (modal `LeadForm`) | `/simulador` | `components/forms/LeadForm.vue` | Existe solo en Planmed | P: formulario sin envío; C: solicitud **funcional** (POST al Hub) en modal | campos y validaciones del lead de C (habeas data, correo opcional) | habeas data obligatorio; monto > 0; plazo | Hub `/leads` | pública | No sustituir el flujo funcional de C por la maqueta de P | PII en navegador | P: F03; C: `LeadForm.vue` | ¿Página dedicada de estudio de crédito? |
| P08 | Información precontractual | `/informacion-precontractual` | `pages/informacion-precontractual.vue` | Modal precontractual | (todas) | `components/common/PrecontractualModal.vue` | Equivalencia parcial | P: página + modal; C: solo modal con localStorage | texto legal propio | aceptación previa; «rechazar» sale del sitio | futuro: registro en CRM | pública | Crear página solo si C la requiere | defectos P (NIT distinto, `{'@'}`) no deben heredarse | P: F03/F10; C: modal | ¿Página propia? ¿Registrar aceptación? |
| P09 | Política de datos | `/politica-datos-personales` | `pages/politica-datos-personales.vue` | Enlaces legales de Recursos | `/recursos` | `pages/recursos.vue` | Existe solo en Planmed | C: tres enlaces `href="#"` sin destino | políticas propias de C | habeas data | — | pública | Aportar contenido legal de C | enlaces rotos hoy | P: F03; C: `recursos.vue` | Documentos legales de C |
| P10 | Recursos | `/recursos` | `pages/recursos.vue`, `data/resources.ts` | Recursos (C-P05) | `/recursos` | `pages/recursos.vue` | Equivalencia parcial | P vacío; C con 4 tarjetas (2 PDF, 2 placeholder) | PDFs `AUTORIZACION-CENTRALES…` y `PAGARE…`, imágenes | documentos obligatorios | — | pública | Conservar; P no aporta datos | nombres de archivo con marca «CLINIPLANES» | P: F03; C: `recursos.vue` | Subir formulario y guía pendientes |
| P11 | Listado de procedimientos | `/procedimientos` | `pages/procedimientos/index.vue` | Catálogo (C-P02) | `/procedimientos` | `pages/procedimientos/index.vue` | Equivalencia directa | misma función y ruta; P: Hub con estado 503 y rejilla; C: MySQL/Hub con paginación `?page`, sin estado de error | catálogo, categorías, imágenes de C | publicado = activo + categoría activa; destacados primero | MySQL (C) / Hub (P) | pública | Añadir manejo de error 503 (patrón P) y filtro por categoría si se desea | contrato de datos distinto: ver fila S02 | P: F04; C: `index.vue`, `server/utils/procedures.ts` | ¿Filtro/búsqueda pública? |
| P12 | Detalle de procedimiento | `/procedimientos/:slug` | `pages/procedimientos/[slug].vue` | Detalle (C-P03) | `/procedimientos/:slug` | `pages/procedimientos/[slug].vue` | Equivalencia parcial | C muestra ficha técnica, perfil, galería, antes/después, relacionados y lightbox (P no); P enlaza `/financiacion?procedureId=` | **toda la ficha de C** | slug inmutable publicado; 404 si inactivo | MySQL/Hub | pública | Mantener la ficha completa de C; adoptar solo mejoras de error/SEO | CTA de C envía `procedureName/procedureId` que `/simulador` ignora | P: F04; C: `[slug].vue` | ¿Preseleccionar procedimiento en el simulador? |
| P13–14 | Noticias | `/noticias`, `/noticias/:slug` | `pages/noticias/*` | — | — | — | Existe solo en Planmed | | — | — | Hub posts | pública | Ninguna; no crear | | P: F05 | ¿C necesita blog/noticias? |
| P15–17 | Pacientes/testimonios, antes y después, referidos | `/testimonios/*` | `pages/testimonios/*` | Galería antes/después en detalle | `/procedimientos/:slug` | `components/procedures/BeforeAfterGallery.vue` | Equivalencia parcial | P: sección independiente del Hub; C: pares antes/después por procedimiento | fotos antes/después | — | MySQL | pública | No fusionar; evaluar sección de testimonios aparte | consentimiento de imágenes ND | P: F06; C: `BeforeAfterGallery.vue` | ¿Testimonios y referidos? |
| P18–23 | Recomendaciones (árbol, cuidados, revisión) | `/recomendaciones/**` | `pages/recomendaciones/**` | Recomendaciones post-op. por procedimiento | `/procedimientos/:slug` | campo `post_recommendations` | Equivalencia parcial | P: módulo de árbol; C: un campo HTML dentro del procedimiento | texto post-op. de C | HTML saneado | — | pública | Mantener el campo; árbol solo si se decide | | P: F07; C: `procedures.ts` | ¿Módulo de recomendaciones? |
| P24 | Micrositio PRP | `/prp/:slug` | `pages/prp/[slug].vue` | — | — | — | Existe solo en Planmed | programa de referidos de P | — | — | Hub + CRM | pública | Ninguna | | P: F08 | ¿Programa de referidos? |
| — | Error global | cualquier | `error.vue` | — (no existe) | — | — | Existe solo en Planmed | C usa el error por defecto de Nuxt | tono de marca | 404/503 diferenciados | — | pública | Crear `error.vue` con textos de C | 404 de detalle de C se lanza como fatal sin página propia | P: F09; C: ausencia (Glob) | Textos de error |
| — | Layout global (Navbar/Footer/Chat/Valoración/Precontractual) | todas | `layouts/default.vue` + `layout/*`, `ChatLauncher`, `ValuationRequest` | Layout público | todas | `layouts/default.vue`, `Navbar.vue`, `Footer.vue` | Equivalencia parcial | C: navbar transparente/oculta al bajar, selector de idioma, FAB WhatsApp, sin valoración ni chat | menú de C (Procedimientos, Simulador, Recursos, Nosotros), logo, redes (pendientes) | — | WhatsApp, i18n | pública | Mantener menú; adoptar estructura, no enlaces de P | Footer con enlaces legales redundantes | P: F10; C: layout | Estructura de menú |
| C-P07 | (A01 login) | `/admin/login` | `pages/admin/login.vue` | Acceso (C-P07) | `/login` | `pages/login.vue` | Equivalencia parcial | C fuera de `/admin`, enlazado en la barra pública; P bajo `/admin` | marca y textos de C | Hub autentica + vínculo local | Hub | pública | Alinear ruta si se desea (redirección ya existe) | enlaces externos a `/login` | P: A01; C: `login.vue` | ¿`/login` o `/admin/login`? |

## 2. Panel administrativo
| 1 ID | 2 Planmed | 3 Ruta P | 4 Archivo P | 5 Equivalente C | 6 Ruta C | 7 Archivo C | 8 Estado | 9 Diferencias estructurales | 10 Contenido | 11 Reglas | 12 Integraciones | 13 Permisos/Auth | 14 Adaptación | 15 Riesgos | 16 Evidencia | 17 Decisión |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A01 | Login | `/admin/login` | `pages/admin/login.vue` | Acceso | `/login` | `pages/login.vue` | Equivalencia parcial | ver C-P07 | marca | límite de intentos, redirect seguro | Hub | pública | — | — | P: A01; C | ruta |
| A02 | Dashboard | `/admin` | `pages/admin/index.vue` | Dashboard (C-A01) | `/admin` | `pages/admin/index.vue` | Equivalencia parcial | P: tarjetas de acceso; C: 4 contadores sin enlaces | contadores de C | — | `/api/admin/stats` | sesión | Añadir accesos conservando contadores | | P: A01; C | — |
| A03 | Procedimientos listado | `/admin/procedimientos` | `…/procedimientos/index.vue` | C-A02 | `/admin/procedimientos` | idem | Equivalencia directa | misma función; C con paginación y búsqueda servidor, borrado real | datos de C | slug inmutable publicado | MySQL | sesión | Estilo de P opcional | borrado sin papelera | P: A02; C | ¿Borrado real o desactivar? |
| A04 | Procedimiento formulario | `/admin/procedimientos/nuevo` · `/:slug` | `…/[slug].vue` | C-A03/A04 | `/admin/procedimientos/nuevo` · `/:id` | `…/[id].vue` | Equivalencia parcial | P: Hub, TipTap, categoría libre, galería ≤10; C: MySQL, textarea, categoría entidad, antes/después | todos los campos de C | zod; imagen ≤5 MB; edad/IMC | MySQL, disco | sesión | Editor enriquecido opcional (hoy textarea) | P sin antes/después | P: A02; C | ¿Editor TipTap? |
| A05–06 | Noticias admin | `/admin/noticias/**` | `pages/admin/noticias/**` | — | — | — | Existe solo en Planmed | | — | — | Hub | rol CMS | Ninguna | | P: A03 | ¿Noticias? |
| A07 | Nuestros pacientes admin | `/admin/testimonios` | `pages/admin/testimonios/index.vue` | — | — | — | Existe solo en Planmed | | — | — | Hub | rol CMS | Ninguna | | P: A04 | — |
| A08–A14 | Recomendaciones (árbol, histórico) | `/admin/recomendaciones/**` | `pages/admin/recomendaciones/**` | — | — | — | Existe solo en Planmed | C: campo post-op. dentro del procedimiento | — | — | Hub | rol CMS | Ninguna | histórico P sin enlace | P: A05–A06 | — |
| A15–16 | Nosotros / clínicas | `/admin/nosotros`, `/admin/paginas/:slug` | `pages/admin/nosotros.vue`, `paginas/[slug].vue` | — | — | — | Existe solo en Planmed | C no tiene contenido administrable | — | — | disco | rol CMS | Evaluar si C quiere administrar aliados/Nosotros | | P: A07 | ¿Admin de contenido institucional? |
| A17–18 | Micrositios PRP | `/admin/micrositios/**` | `pages/admin/micrositios/**` | — | — | — | Existe solo en Planmed | | — | — | Hub | rol CMS | Ninguna | | P: A08 | — |
| A19 | Configuración (tasa, colaboradores, guía) | `/admin/configuracion` | `pages/admin/configuracion/index.vue` | — | — | — | Existe solo en Planmed | C tasa codificada | — | tasa y usura | disco | líder/rol de tasa | Solo si C requiere tasa editable | reglas de P no aplican | P: A09 | ¿Tasa editable en C? |
| — | — | — | — | Categorías (C-A05) | `/admin/categorias` | `pages/admin/categorias.vue` | Existe solo en Crediestética | en P la categoría es texto libre | categorías de C | no borrar con procedimientos; slug único | MySQL | sesión | Mantener como ítem junto a Procedimientos | | C: `categorias.vue`, `categories.ts` | — |
| — | — | — | — | Mi cuenta (C-A06) | `/admin/cuenta` | `pages/admin/cuenta.vue` | Existe solo en Crediestética | P no cambia contraseña | — | política de contraseña del Hub | Hub | sesión | Mantener | | C: `cuenta.vue`, `password.post.ts` | — |
| — | Layout admin | `/admin/**` | `layouts/admin.vue` | Layout admin | `/admin/**` | `layouts/admin.vue` | Equivalencia parcial | C: menú móvil **funcional** (P no); P: más ítems | marca de C | — | — | sesión | Usar la versión de C del menú móvil como solución al defecto de P | | P: 04 §1; C | — |

## 3. Componentes
| 1 ID | 2 Planmed | 3 Ruta P | 4 Archivo P | 5 Equivalente C | 6 Ruta C | 7 Archivo C | 8 Estado | 9 Diferencias estructurales | 10 Contenido | 11 Reglas | 12 Integraciones | 13 Permisos/Auth | 14 Adaptación | 15 Dependencias/riesgos | 16 Evidencia | 17 Decisión pendiente |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| K01 | `LayoutNavbar`, `LayoutFooter` | — | `components/layout/*` | `layout/Navbar.vue`, `Footer.vue` | — | `layout/Navbar.vue`, `Footer.vue` | Equivalencia parcial | menús y secciones distintas | enlaces y logo de C | — | — | — | reutilizar estructura | colores hex embebidos | P: 06/F10; C | — |
| K02 | `SitePageShell`, `SiteManagedPage`, `CommonRichContent` | — | `site/*`, `common/RichContent.vue` | — | — | — | Existe solo en Planmed | C no usa páginas gestionadas ni contenido enriquecido (usa `v-html` en detalle) | — | saneado en servidor (C) | — | — | `RichContent` útil para el detalle | `v-html` de C confía en el saneado servidor | P: 06; C: `validation.ts` | — |
| K03 | `CommonHubUnavailable`, `useServiceUnavailable`, `siteError` | — | `common/HubUnavailable.vue` | — | — | — | Existe solo en Planmed | C no distingue 503/vacío | — | — | Hub | — | adoptar para Hub/MySQL caído | listado vacío silencioso | P: F09; C | — |
| K04 | `CommonShareActions` | — | `common/ShareActions.vue` | — | — | — | Existe solo en Planmed |  | — | — | — | — | opcional |  | P: 06 | — |
| K05 | `AboutFaqAccordion` / `ContactSection` | — | `about/*` | — | — | — | Existe solo en Planmed |  | — | — | — | — | opcional |  | P: 06 | — |
| K06 | `AdminRichTextEditor` | — | `admin/RichTextEditor.vue` | textarea | — | textarea | Requiere adaptación | C acepta texto/HTML plano | contenido existente | saneado servidor | — | — | añadir TipTap conservando `toSafeHtml` | cambia dependencias | P: 06; C: `[id].vue` | ¿TipTap? |
| K07 | Componentes `Tree*` | — | `admin/recommendations/*` | — | — | — | Existe solo en Planmed |  | — | — | Hub | — | no aplica sin módulo |  | P: 06 | — |
| K08 | `SimulatorPanel` | — | `simulator/Panel.vue` | `simulador.vue` + `BaseSelect/BaseSlider/ResultCard/NextSteps` | — | `simulador.vue` + `BaseSelect/BaseSlider/ResultCard/NextSteps` | Equivalencia parcial | en P los cuatro últimos son huérfanos | reglas y textos de C | cuota demostrativa | — | — | conservar componentes de C |  | P: 06; C | — |
| K09 | `FormsLeadForm` (mock) | — | `forms/LeadForm.vue` | `forms/LeadForm.vue` | — | `forms/LeadForm.vue` | Requiere adaptación | mismo nombre, **función distinta**: P simula; C envía al Hub | campos de C | habeas data, validaciones | Hub | — | **no sobrescribir con la versión de P** | pérdida de leads | P: F02; C | — |
| K10 | `ValuationRequest`, `ChatLauncher` | — | `forms/*`, `layout/ChatLauncher.vue` | FAB WhatsApp en layout | — | FAB WhatsApp en layout | Equivalencia parcial | P: modal de valoración + CRM; C: botón wa.me | número de C | — | CRM / WhatsApp | — | decidir si C adopta valoración |  | P: F10; C | ¿Valoración? |
| K11 | `Home*` (5) | — | `home/*` | secciones inline | — | secciones inline | Equivalencia parcial | C no tiene componentes de home | contenido de C | — | — | — | extraer a componentes si se rehace la home |  | P: F01 | — |
| K12 | 9 componentes huérfanos | — | `common/{Cta,MedicalLeadership,Process,ResourceCard,Trust}`, `forms/Base*`, `simulator/*` | mismos archivos | — | mismos archivos | Equivalencia directa | misma estructura; 8 en uso en C, `MedicalLeadershipSection` sin uso en ambos | contenido de C | — | — | — | usarlos como base compartida |  | P: 06 §3; C | — |
| K13 | `CommonPrecontractualModal` | — | `common/PrecontractualModal.vue` | idem | — | idem | Equivalencia parcial | C: «rechazar» redirige a google.com | texto legal de C | aceptación previa | CRM (futuro) | — | corregir salida externa |  | P: F10; C | — |
| K14 | — | — | — | `ProceduresBeforeAfterGallery`, `CommonLanguageSelector`, `AdminFeedbackHost` | — | `ProceduresBeforeAfterGallery`, `CommonLanguageSelector`, `AdminFeedbackHost` | Existe solo en Crediestética |  | conservar | — | — | — | mantener |  | C | — |
| K15 | `ReferralForm`, `PrpLeadForm`, `CreditStudyForm` | — | `referral/*`, `forms/*` | — | — | — | Existe solo en Planmed |  | — | — | CRM/Hub | — | no aplica |  | P: 06 | — |

## 4. Servicios, integraciones y datos
| 1 ID | 2 Planmed | 3 Ruta P | 4 Archivo P | 5 Equivalente C | 6 Ruta C | 7 Archivo C | 8 Estado | 9 Diferencias estructurales | 10 Contenido | 11 Reglas | 12 Integraciones | 13 Permisos/Auth | 14 Adaptación | 15 Dependencias/riesgos | 16 Evidencia | 17 Decisión pendiente |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| S01 | Auth Hub + sesión + roles | — | `server/api/auth/*`, `NUXT_PLANMED_*` | `server/api/auth/*`, `utils/auth.ts`, `hub.ts`, `admin_users` | — | `server/api/auth/*`, `utils/auth.ts`, `hub.ts`, `admin_users` | Requiere adaptación | P guarda el token y delega autorización al Hub; C descarta el token y autoriza con tabla local | — | vínculo local; cuenta activa | Hub | admin único | conservar el modelo de C; añadir roles si hace falta | no heredar variables de P | P: 08; C: 06 | ¿Roles? |
| S02 | Lecturas públicas Hub (`X-Tenant-Linea`) y `ProcedureDto` | — | `services/*`, `server/api/public/*` | `ProcedureService` + `CrmProcedureProvider` | — | `ProcedureService` + `CrmProcedureProvider` | Equivalencia parcial | C: selector local/crm con el **mismo contrato** `cirugias`; P siempre Hub vía BFF | catálogo MySQL de C | contrato `types/procedure.ts` | Hub / MySQL | — | si se migra al Hub, usar el proveedor CRM tras validar con `import-crm` | dos fuentes de verdad | P: 07; C: 05 | ¿Fuente definitiva del catálogo? |
| S03 | Escrituras CMS al Hub | — | `server/api/admin/*` | `server/api/admin/*` (MySQL) | — | `server/api/admin/*` (MySQL) | Requiere adaptación | mismas rutas API pero otra persistencia | — | — | Hub (P) / MySQL (C) | sesión | no reescribir el admin de C hacia el Hub sin decisión |  | P: 07; C | ¿Hub o MySQL? |
| S04 | CRM de valoración / PRP | — | `server/utils/valuation.ts`, `prpEnrollment.ts` | Leads al Hub | — | Leads al Hub | Requiere adaptación | contratos distintos (P: CRM de valoración/PRP; C: leads al Hub) | — | idempotencia (P) | CRM / Hub | — | mover leads de C a un BFF con validación (propuesta) | PII | P: 07; C: 05 §3 | ¿BFF para leads? |
| S05 | Persistencia local JSON (`about`, `clinics`, `pages`, `financing-rate`) | — | `NUXT_PLANMED_CONTENT_DIR` | MySQL + disco de imágenes | — | MySQL + disco de imágenes | Requiere adaptación | tecnologías distintas | — | escritura atómica (P) | disco / MySQL | — | no mezclar; usar MySQL |  | P: 07; C | — |
| S06 | Tracking (solo consola en P) | — | `useTracking` | `useTracking` → `/web-events` | — | `useTracking` → `/web-events` | Equivalencia parcial | C **envía al Hub**; P solo registra en consola | eventos de C | — | Hub | — | conservar | tráfico y PII en payload | P: 06; C | — |
| S07 | — | — | — | i18n es/en/pt, sitemap dinámico | — | i18n es/en/pt, sitemap dinámico | Existe solo en Crediestética | P sin i18n | traducciones | — | — | — | conservar; que cualquier plantilla de P sea traducible | prefijos `/en`,`/pt` | C: `nuxt.config.ts` | — |
| S08 | — | — | — | `import-crm.mjs`, `create-admin.mjs`, `migrate.mjs` | — | `import-crm.mjs`, `create-admin.mjs`, `migrate.mjs` | Existe solo en Crediestética |  | — | no pisar slugs existentes | Hub, MySQL | — | mantener | ejecución accidental | C: `scripts/*` | — |

## 5. Flujos (`10`)
| 1 ID | 2 Planmed | 3 Ruta P | 4 Archivo P | 5 Equivalente C | 6 Ruta C | 7 Archivo C | 8 Estado | 9 Diferencias estructurales | 10 Contenido | 11 Reglas | 12 Integraciones | 13 Permisos/Auth | 14 Adaptación | 15 Dependencias/riesgos | 16 Evidencia | 17 Decisión pendiente |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| F-1 | Interés → solicitud (mock/valoración) | — | `10-flujos-funcionales.md` | Simulador → modal → POST Hub → WhatsApp | — | — | Requiere adaptación | C funcional; P parcial | — | — | Hub / CRM | — | conservar el de C |  | P: 10; C | — |
| F-2 | Referidos (PRP) | — | `10-flujos-funcionales.md` | — | — | — | Existe solo en Planmed |  | — | — | CRM | — |  |  | P: 10 | — |
| F-3 | Publicar contenido | — | `10-flujos-funcionales.md` | Alta de procedimiento → publicar (`active`) | — | — | Equivalencia parcial | C valida slug inmutable al publicar | — | — | MySQL | — |  |  | P: 10; C | — |
| F-4 | Tasa configurable | — | `10-flujos-funcionales.md` | Tasa codificada | — | — | Existe solo en Planmed |  | — | — | disco | — |  |  | P: 10; C | ¿Tasa editable? |
| F-5 | Recomendaciones | — | `10-flujos-funcionales.md` | — | — | — | Existe solo en Planmed |  | — | — | Hub | — |  |  | P: 10 | — |
| F-6 | Sesión admin | — | `10-flujos-funcionales.md` | Login Hub + vínculo | — | — | Equivalencia parcial | ver S01 | — | — | Hub | — |  |  | P: 08; C | — |
| F-7 | Fallo del Hub | — | `10-flujos-funcionales.md` | Leads: mensaje de error; login: 503 | — | — | Equivalencia parcial | C no diferencia 503 en catálogo | — | — | Hub | — |  |  | P: F09; C | — |

## 6. Resumen de estados (calculado por script sobre la columna 8)
| Estado | Filas |
|---|---|
| Equivalencia directa | 3 |
| Equivalencia parcial | 24 |
| Existe solo en Crediestética | 5 |
| Existe solo en Planmed | 22 |
| Requiere adaptación | 8 |
| **Total filas** | 62 |

Una fila puede agrupar varias vistas (p. ej. P13–14, A08–A14); los totales son de **filas**, no de vistas. No hay filas «No determinado»: las limitaciones de verificación figuran en `11`.


---
## Anexo histórico: esqueleto de la Fase 1 (superado)

**Instrucciones.** Las columnas de Planmed están verificadas (ver fichas). Las columnas «Crediestética» están **PENDIENTES**: el repositorio de Crediestética no se inspeccionó. Capa propuesta: **A** reutilizable (estructura), **B** conservar de Crediestética, **C** adaptar / pendiente de análisis. Nada se marca como «no aplica» ni se elimina; los elementos sin equivalente conocido quedan **PENDIENTE DE ANÁLISIS**.

## 1. Vistas públicas
| Planmed (ruta / ficha) | Estado Planmed | Capa propuesta | Equivalente en Crediestética | Contenido propio a conservar | Notas |
|---|---|---|---|---|---|
| `/` · F01 | implementada | A estructura / B contenido | PENDIENTE | PENDIENTE | ejemplo de plan estático y textos son de marca |
| `/financiacion` · F02 | implementada (lead mock) | A estructura / B reglas / C simulador | PENDIENTE | tasa, plazos, montos, textos | revisar `shared/utils/financing.ts` |
| `/nosotros` · F03 | implementada, administrable | A | PENDIENTE | institucional/legal | modelo `AboutContent` reutilizable |
| `/quienes-somos`, `/servicios` · F03 | estáticas | B | PENDIENTE | todo el texto | |
| `/clinicas-aliadas` · F03 | administrable local | A/C | PENDIENTE | clínicas/logos | |
| `/estudio-de-creditos` · F03 | maqueta | C | PENDIENTE | formulario de crédito propio | no hay contrato de envío |
| `/informacion-precontractual`, `/politica-datos-personales` · F03 | estáticas | B | PENDIENTE | texto legal, NIT | |
| `/recursos` · F03 | vacía | A/C | PENDIENTE | documentos | |
| `/procedimientos`, `/procedimientos/:slug` · F04 | Hub | A / C modelo | PENDIENTE | catálogo | mapear `ProcedureDto` |
| `/noticias`, `/noticias/:slug` · F05 | Hub | A | PENDIENTE | PENDIENTE | |
| `/testimonios/*` · F06 | Hub | C | PENDIENTE DE ANÁLISIS | PENDIENTE | |
| `/recomendaciones/*` · F07 | Hub | C | PENDIENTE DE ANÁLISIS | PENDIENTE | |
| `/prp/:slug` · F08 | Hub + CRM | C | PENDIENTE DE ANÁLISIS | PENDIENTE | programa propio de Planmed |
| `error.vue` · F09 | implementada | A | PENDIENTE | textos | |
| Navbar/Footer/Chat/Valoración/Precontractual · F10 | implementada | A estructura / B contenido | PENDIENTE | enlaces, redes, teléfonos, NIT | corregir defectos conocidos |

## 2. Panel administrativo
| Planmed (ruta / ficha) | Operaciones | Capa | Equivalente Crediestética | Notas |
|---|---|---|---|---|
| `/admin/login`, layout, dashboard · A01 | login Hub | A | PENDIENTE | añadir menú móvil |
| Procedimientos · A02 | CRUD vía Hub | A / C | PENDIENTE (según doc previo: admin propio con BD local [Doc – sin verificar]) | no sustituir su admin sin análisis |
| Noticias · A03 | CRUD vía Hub | A | PENDIENTE | |
| Nuestros Pacientes · A04 | form único vía Hub | C | PENDIENTE DE ANÁLISIS | |
| Recomendaciones (árbol) · A05 / heredado · A06 | vía Hub | C | PENDIENTE DE ANÁLISIS | |
| Nosotros / Clínicas · A07 | local | A | PENDIENTE | |
| Micrositios PRP · A08 | vía Hub | C | PENDIENTE DE ANÁLISIS | |
| Configuración (colaboradores, tasa, guía) · A09 | local + Hub | A / B | PENDIENTE | reglas de la tasa son de negocio |

## 3. Componentes
| Planmed | Capa | Crediestética | Notas |
|---|---|---|---|
| `SitePageShell`, `ManagedPage`, `RichContent`, `HubUnavailable`, `ShareActions`, `FaqAccordion`, `YouTube/InstagramEmbed` | A | PENDIENTE | |
| `AdminRichTextEditor` y componentes `Tree*` | A / C | PENDIENTE | |
| `SimulatorPanel`, `LeadForm`, `CreditStudyForm`, `ValuationRequest`, `ReferralForm`, `PrpLeadForm` | B/C | PENDIENTE | campos propios |
| `Home*`, `ContactSection`, `Footer`, `Navbar` (enlaces) | B contenido | PENDIENTE | |
| 9 componentes huérfanos | — | PENDIENTE DE ANÁLISIS | no eliminar |

## 4. Servicios, integraciones y datos
| Planmed | Capa | Crediestética | Notas |
|---|---|---|---|
| Auth Hub + sesión + roles (`NUXT_PLANMED_*`) | A | PENDIENTE | doc previo indica auth contra Hub con BD propia [Doc – sin verificar] |
| Lecturas públicas `X-Tenant-Linea` | A | PENDIENTE | tenant puede diferir |
| Escrituras Hub (CMS) | A | PENDIENTE | |
| CRM valoración y PRP | B | PENDIENTE | contratos propios |
| Persistencia local (`about`, `clinics`, `pages`, `financing-rate`) | A | PENDIENTE | |
| Tracking (solo consola) | C | PENDIENTE | |

## 5. Flujos
| Planmed (`10`) | Capa | Crediestética |
|---|---|---|
| F-1 Interés → solicitud | B/C | PENDIENTE |
| F-2 Referidos (PRP) | C | PENDIENTE DE ANÁLISIS |
| F-3 Publicar contenido | A | PENDIENTE |
| F-4 Tasa | B | PENDIENTE |
| F-5 Recomendaciones | C | PENDIENTE DE ANÁLISIS |
| F-6 Sesión admin | A | PENDIENTE |
| F-7 Fallo del Hub | A | PENDIENTE |

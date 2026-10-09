# 07 — Reutilización en Crediestética

Regla: **no se cambia Crediestética automáticamente** por lo hecho en Planmed. Esta tabla registra qué podría reutilizarse y qué hay que comprobar antes.
Estado de Crediestética = lectura de estructura/configuración (ver `03`); **no se ejecutó ni se auditó página por página**. Nada aquí afirma que ambas webs estén alineadas.

## Niveles

### Común (patrón/arquitectura/pruebas reutilizables sin cambio funcional)
| Pieza | Origen en Planmed | Condición para reutilizar |
|---|---|---|
| Patrón UI → Service → Provider → Nitro → Hub, sin llamadas a Hub desde el navegador | `services/`, `providers/`, `server/api/` | Crediestética ya usa `services/` y `providers/` (`ProcedureService`, `CrmProcedureProvider`); falta confirmar si su `server/api` oculta el token del Hub. |
| Cliente Hub server-side con traducción de errores (`wellezy.ts`, `translate`, `adminSession` + `assertSameOrigin`) | `server/utils/` | Crediestética tiene `server/utils/hub.ts` propio; comparar antes de unificar. |
| Diff-save contra recursos de Hub (aplicar solo lo cambiado, eliminar→actualizar→crear→reordenar, validar antes de escribir) | `server/utils/patients.ts` | Aplica a cualquier módulo del CMS. |
| Estrategia de pruebas: arnés `FakeHub` + `node:test` sobre rutas Nitro reales; pruebas estáticas «sin localStorage / sin tokens en el cliente» | `tests/recommendations/harness.ts`, `tests/patients/` | Crediestética ya usa `node --test` (`tests/auth.test.mjs`); portable. |
| Lectura SSR con `useAsyncData` y misma clave compartida entre página y menú | `pages/testimonios/*`, `TestimonialsNav.vue` | Requiere Nuxt 3/4 (ambas). |

### Configurable (mismo componente, distinta marca/texto/ruta/tenant)
| Pieza | Qué cambia |
|---|---|
| `RecommendationShell`, `RichContent`, `YouTubeEmbed`, `InstagramEmbed`, `AdminRichTextEditor` | Colores/tipografía (Crediestética: Libre Bodoni/Questrial, `#111`/`#F7F3EE`/`#CBA36B`), textos de la llamada a la acción, **i18n (es/en/pt)**: Planmed tiene textos en español fijos en el código. |
| Menú dinámico de procedimientos (cuando se haga, PM-PROC-01) | Fuente: Crediestética lee `procedureSource=local|crm`; el menú solo sería equivalente si usa `crm`. |
| Nitro `patients/recommendations/news` | Slug de línea y empresa (`NUXT_WELLEZY_*` vs. `NUXT_PUBLIC_TENANT_SLUG`/`companySlug`), IDs de rol admin, permisos asignados en Hub a la línea. |

### Específico de marca (no copiar automáticamente)
| Elemento | Motivo |
|---|---|
| Textos comerciales, reglas del simulador, tasa, porcentajes de financiación, teléfonos y correos | `business_rules.md` es de Planmed; las de Crediestética **[No verificado]**. |
| Identidad visual y navegación | Distintas. |
| Formulario de preaprobado, habeas data, información precontractual | Contratos CRM distintos (Crediestética → Hub `/v1/leads`; Planmed hoy sin destino). |
| PRP / micrositios de referidores | Programa propio de Planmed. |
| Contenido de recomendaciones (abdominoplastia, mamoplastia…) | Contenido médico de Planmed; Crediestética no lo tiene en código. |
| Catálogo de procedimientos | Crediestética tiene catálogo y admin propios con BD local. |

## Registro de funcionalidades probadas en Planmed y su reutilización

| Funcionalidad probada | Evidencia | Reutilizable en Crediestética | Diferencias a comprobar antes de aplicar |
|---|---|---|---|
| Nuestros Pacientes vía Hub (PM-PAC-01) | E2E contra Hub local + 17 pruebas (`08`) | Sí, **si** Crediestética necesita la sección (CR-ALC-01 sin decidir) | Hub: crear línea/empresa y permisos `pacientes_web.*`; mecanismo de tenant público (`X-Tenant-Linea` vs. `X-Wellezy-Tenant`); i18n; que Crediestética no tenga ya estas páginas en la web original. |
| Recomendaciones (páginas vinculadas e históricas) y Regla de precedencia | Pruebas de otra sesión (tests/recommendations) + 39 de Hub | Sí, la regla de negocio y el cliente SSR | Idem; contenido propio. Crediestética puede reutilizar el modelo de precedencia (página publicada > oculta > histórico) para sus propios procedimientos. |
| Errores de listados públicos (Empty vs 503) | `tests/recommendations/listings-and-source.test.ts` (132 tests) | Sí, la distinción de HTTP 200 (vacío) vs 503 con `CommonHubUnavailable` | Requiere Nuxt 3 y que la UI adopte un estado de indisponibilidad con reintento. |
| Noticias vía Hub | Código; sin pruebas en Planmed | Igual | Idem |
| Auth del admin vía Hub | Código | Crediestética ya autentica contra Hub (`authApiBaseUrl`) | Conserva su BD de usuarios admin (`wellezy_user_id`) |

## Preguntas abiertas para Crediestética
1. ¿La web original tiene noticias, recomendaciones, pacientes y PRP? (CR-ALC-01)
2. ¿Pasa su catálogo a Hub (`procedureSource=crm`) o se mantiene local? (CR-ARQ-01)
3. ¿Qué mecanismo de tenant debe usar frente al Hub actual? (CR-TEN-01)
4. ¿Qué empresa/línea de Hub corresponde (`crediestetica` / `legalmed`)? ¿existe la línea con `slug` y `company_id`?

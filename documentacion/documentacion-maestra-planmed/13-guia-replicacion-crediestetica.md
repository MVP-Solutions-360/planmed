# 13 · Guía para usar Planmed como estructura de referencia de Crediestética

> **Alcance y honestidad.** El repositorio de Crediestética **no fue inspeccionado** en esta auditoría. Todo lo dicho sobre Planmed es verificable (ver `01`–`12`). Lo que se menciona de Crediestética proviene solo de la documentación previa (`documentacion/maestra/03` y `07`, etiquetada allí como lectura de estructura, **no auditada página por página**) y aquí se marca **[Doc – sin verificar]**. No se decide eliminar nada de Crediestética.

## 1. Tres capas

### Capa A — estructura de Planmed que puede reutilizarse
| Elemento | Dónde está en Planmed | Observación para quien implemente |
|---|---|---|
| Organización de rutas por archivos (`pages/`) con patrón público + `/admin/**` | `02` | Replicar la **forma**: listados + detalle `[slug]`; grupo informativo bajo un menú desplegable; PRP/landing sin layout global |
| Layouts `default`/`admin` y composición del layout público (navbar, footer, chat, modal flotante) | `01` §6, F10 | El layout admin necesita el menú móvil que Planmed **no** tiene |
| Navegación dinámica construida por función pura (`utils/navMenus.ts`) con datos del Hub y tolerancia a fallos | F10 | Reutilizable tal cual si hay Hub |
| Patrón `Página → Service → Provider → Nitro → Hub` y proxy admin con sesión en servidor | `01` §4, `07` | Conserva la regla «el navegador nunca ve el Bearer» |
| Autenticación contra Hub, cookie `httpOnly`, revalidación por navegación, CSRF por origen, roles por variable de entorno | `08` | Sustituir IDs de rol/empresa/línea por los de Crediestética |
| Estructura del panel: dashboard de tarjetas, sidebar con grupos, listados con búsqueda/estado, formularios en tarjetas, barra de guardado, confirmaciones | `04`, A01–A09 | |
| Componentes: `PageShell`, `ManagedPage`, `RichContent`/`RichTextEditor` (+ saneado de HTML), `HubUnavailable`, `ShareActions`, FAQ accesible, embeds | `06` | |
| Manejo de errores (404/401/403/503, `error.vue`, `describeSiteError`, 503 ≠ vacío) | F09 | |
| Persistencia local administrable con escritura atómica y control de concurrencia | A07, A09 | Útil si Crediestética necesita páginas simples sin pasar por Hub |
| Árbol de Recomendaciones (tema → subtema → sección → recomendación) y enlaces cortos | F07, A05 | **Solo si** Crediestética necesita ese módulo (pendiente de análisis) |
| Estrategia de pruebas `node:test` con arnés de Hub falso y pruebas estáticas de plantillas | `11` | |

### Capa B — contenido y lógica que debe **conservarse** de Crediestética (no copiar de Planmed)
Marca, logotipo e imágenes; textos comerciales; información institucional, legal y de contacto; **catálogo de procedimientos/servicios y categorías** (según el documento previo, Crediestética tiene catálogo y admin propios con BD local [Doc – sin verificar]); reglas de financiación, tarifas y simulador; formularios y campos propios (preaprobado, habeas data); contratos con su CRM/Hub (según el doc previo, Hub `/v1/leads` [Doc – sin verificar]); i18n si existe (doc previo: es/en/pt [Doc – sin verificar]); integraciones propias.

### Capa C — requiere adaptación (decidir con inspección de Crediestética)
| Tema | Qué adaptar |
|---|---|
| Mapeo de campos/entidades | `ProcedureDto` de Planmed (Hub `cirugias`) vs. el modelo de Crediestética |
| Rutas sin equivalencia directa | `/prp/:slug`, `/testimonios/*`, `/recomendaciones/*`, `/estudio-de-creditos`, `/clinicas-aliadas`: **pendiente de análisis**, no eliminar |
| Módulos admin | cuáles de A01–A09 aplican; qué módulos propios de Crediestética deben sumarse al menú |
| Componentes con datos específicos | tarjetas de procedimiento, ejemplo de plan de la home, `ContactSection` |
| Autenticación/permisos | roles y líder de línea (variables `NUXT_PLANMED_*`), `canEditRate`; BD de usuarios si Crediestética conserva una |
| Integraciones | tenant público (`X-Tenant-Linea` vs. otros), CRM de valoración y PRP, WhatsApp/Messenger, redes |
| Validaciones y reglas comerciales | `shared/utils/financing.ts` (rango de tasa 0–5 %, plazos 12–72, monto $1M–$100M) y textos de usura |
| Configuración y despliegue | variables de entorno (`07` §4), directorio de contenido persistente, PM2/puertos |

## 2. Estrategia sugerida (sin ejecutarla)
1. **Inspeccionar Crediestética con esta misma plantilla** (inventario → fichas → capturas) y llenar `14`.
2. Decidir por módulo (Capa A/B/C) con el responsable de negocio; no eliminar funcionalidades propias.
3. Congelar el **esqueleto**: layouts, navegación, patrón de servicios, proxy admin/sesión, componentes compartidos, `error.vue`.
4. Corregir antes de copiar los defectos de Planmed (`01` §10): menú móvil del admin, modal precontractual (texto/NIT/`{'@'}`), lead mock, número de WhatsApp marcador, página de detalle que no muestra ficha técnica/galería, reglas de ruta huérfanas, componentes huérfanos.
5. Migrar contenido de Crediestética a los modelos (Hub o local) y adaptar las vistas **sin** tocar su lógica comercial.
6. Replicar el arnés de pruebas y la matriz de seguridad de rutas admin.
7. Validar en navegador con datos reales y roles reales (pendiente también en Planmed).

## 3. Riesgos
* Copiar contenido, NIT, cuentas o números de contacto de Planmed por error (hay valores fijos en `Footer`, `ChatLauncher`, `quienes-somos`, `PrecontractualModal`, `politica-datos-personales`, `ProgramContent`, `nuxt.config.ts`).
* Depender de contratos del Hub aún no verificados (permisos, tenant público).
* Diferencias de i18n y de identidad visual (hay colores `#hex` embebidos en plantillas: cambiar marca implica barrer los componentes, no solo un tema).
* Paridad parcial: Planmed tiene módulos con [PARC] (estudio de créditos, lead, recursos).

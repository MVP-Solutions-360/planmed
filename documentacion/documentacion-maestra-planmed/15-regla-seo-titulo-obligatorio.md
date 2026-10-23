# Regla de negocio SEO obligatoria — título principal

**Estado:** documentada, **NO implementada** (2026-10-20). Esperando aprobación. No se cambió código, configuración ni metadatos.
**Valor obligatorio (exacto):** `FINANCIACION DE CIRUGIAS PLASTICAS` — mayúsculas, sin tildes, sin marca, sin sufijos, sin traducción (34 caracteres).
**Aplica a:** Planmed y Crediestética, de forma permanente durante la adaptación de Crediestética al modelo de Planmed.

## 1. Alcance y distinciones
* Es el **título SEO** (`<title>` y `og:title`; `twitter:title` si se declara), no el encabezado visible (H1) de cada vista, que puede seguir describiendo su contenido.
* No se garantiza que Google muestre ese texto ni que ambos dominios aparezcan a la vez: el buscador puede reescribir el título y depende de la indexación y de sus algoritmos.
* Las páginas de panel y `/login` (noindex) quedan **fuera**: no son páginas públicas indexables. Los errores (`error.vue`, noindex) también, salvo decisión contraria.

## 2. Inventario actual — Planmed (`planmed-web`)
| Fuente | Valor actual | Cumple |
|---|---|---|
| `nuxt.config.ts` → `app.head.title` (valor global por defecto) | `Planmed` | No |
| `pages/index.vue` | `Planmed \| Financiación Médica Directa` | No |
| `pages/financiacion.vue` + `shared/utils/financingSeo.ts` | `Financiación de cirugías plásticas \| Planmed` (title y og:title; también `name` del JSON-LD `WebPage`) | No (tildes y marca) |
| `pages/nosotros.vue` | `Nosotros \| Planmed` (title y og:title) | No |
| `pages/procedimientos/index.vue` | `Procedimientos \| Planmed` | No |
| `pages/procedimientos/[slug].vue` | `seo.meta_title` del Hub, o `<nombre> \| Planmed` | No — **editable en el CMS** |
| `pages/recursos.vue` | `Recursos \| Planmed` | No |
| `pages/servicios.vue`, `quienes-somos.vue` | `Servicios \| Planmed`, `Quiénes somos \| Planmed` | No |
| `estudio-de-creditos.vue`, `informacion-precontractual.vue`, `politica-datos-personales.vue` | `<nombre> \| Planmed` | No |
| `pages/noticias/index.vue`, `noticias/[slug].vue` | `Noticias \| Planmed`; título del artículo | No — dinámico |
| `pages/testimonios/*` (3) | `Pacientes felices`, `Antes y después`, `Programa de referidos` + ` \| Planmed` | No |
| `pages/prp/[slug].vue` | `<titular> \| Planmed` (sin indexar) | No — dinámico |
| `pages/recomendaciones/**`, `components/recommendations/*` | título del tema/subtema/procedimiento vía `useSeoMeta` (según el árbol del Hub) | No — dinámico |
| `components/site/ManagedPage.vue` (`/clinicas-aliadas`) | `<título de la página> \| Planmed` | No — dinámico |
| `error.vue` | `<título del error> \| Planmed` (noindex) | Fuera de alcance |
| `app.vue` | no fija título; `trackPageView` usa `document.title` | — |
| Pruebas | `tests/seo/financing.test.ts` **afirma** `FINANCING_SEO_TITLE === 'Financiación de cirugías plásticas \| Planmed'` y un límite de 60 caracteres | **Conflicto**: debe reescribirse |

## 3. Inventario actual — Crediestética (`cliniplanes-web`)
Los títulos salen de `i18n/locales/{es,en,pt}.json` (`seo.*`) mediante `useSeoMeta`, más textos fijos en el panel.
| Fuente | es | en | pt | Cumple |
|---|---|---|---|---|
| `pages/index.vue` (`seo.index_title` / `index_ogTitle`) | `FINANCIACION CIRUGIA PLASTICA CREDIESTETICA - INICIO` (ambos) | `Plastic Surgery Financing Crediestética` / `Plastic Surgery & Aesthetic Financing \| Crediestética` | `Financiamento para Cirurgias Estéticas na Colômbia \| Crediestética` / `Crediestética \| Financiamento para Procedimentos Estéticos` | No (en/pt además con `title` ≠ `og:title`) |
| `pages/nosotros.vue` (`seo.about_title`) | `Nosotros \| Crediestética` | `About Us \| …` | `Sobre Nós \| …` | No |
| `pages/recursos.vue` (`seo.resources_title`) | `Recursos y Documentación \| …` | `Resources and Documentation \| …` | `Recursos e Documentação \| …` | No |
| `pages/simulador.vue` (`seo.sim_title`) | `Simulador \| …` | `Simulator \| …` | `Simulador \| …` | No |
| `pages/procedimientos/index.vue` (`seo.proc_title`) | `Procedimientos \| …` | `Procedures \| …` | `Procedimentos \| …` | No |
| `pages/procedimientos/[slug].vue` | `procedures.meta_title` (MySQL, editable en el panel) o el nombre del procedimiento | igual | igual | No — **editable en el CMS** |
| `pages/login.vue`, `pages/admin/*` | `Iniciar sesión \| Crediestética`, `<módulo> \| Admin Crediestética` (noindex) | — | — | Fuera de alcance |
| `app.vue` | JSON-LD `FinancialService` con `name: Crediestética` (no es título); sin título global por defecto ni `titleTemplate` | | | — |
| `nuxt.config.ts` | `@nuxtjs/i18n` añade metadatos por idioma (`useLocaleHead`); `site.url` fija | | | — |
| Artefactos | `dist/index.html` y `.output` (build del 2026-10-06) contienen el título anterior | | | — |
| Pruebas | no existen pruebas de SEO | | | — |

## 4. Fuentes que pueden sobrescribir el título
1. Cada página (`useSeoMeta`/`useHead`) y cada componente que lo llame (Planmed: `ManagedPage`, `ProcedureRecommendation*`, `RecommendationShell`).
2. Archivos de idioma de Crediestética (`seo.*`, tres versiones) y cualquier clave nueva futura.
3. Contenido editable: `meta_title` del procedimiento (MySQL en Crediestética, Hub en Planmed), títulos de noticias, páginas, recomendaciones y PRP.
4. Valor global `app.head.title` (Planmed; no existe en Crediestética) y un posible `titleTemplate`.
5. Datos estructurados (`name` en JSON-LD) y `trackPageView` con `document.title` (analítica, no SEO).
6. Builds prerenderizados (`/`, `/nosotros`, `/recursos` en Crediestética; `dist/`) y caché de CDN/Nginx tras el despliegue.
7. Futuros módulos que añadan `useSeoMeta` sin pasar por el punto único.

## 5. Decisiones pendientes (requieren confirmación)
1. **Alcance literal:** ¿el mismo título exacto en **todas** las páginas públicas indexables (incluidos detalles de procedimiento y noticias) o solo en las principales (inicio y financiación/simulador), conservando el resto su título propio? La regla dice «metadatos SEO principales de las páginas públicas». Aplicado a todas, las páginas tendrían títulos idénticos entre sí: es técnicamente posible, pero reduce la diferenciación entre páginas en el buscador.
2. **Título editable en el CMS:** ¿se ignora `meta_title` (el campo deja de afectar el `<title>`) o se retira del formulario?
3. **Idiomas en/pt de Crediestética:** la regla exige el texto sin traducir; ¿también en `/en` y `/pt`?
4. **`twitter:title`:** hoy ninguno de los dos sitios lo declara; ¿se añade con el mismo valor?
5. **Prueba existente de Planmed** (`tests/seo/financing.test.ts`): su aserción contradice la regla; se reescribiría.

## 6. Plan de aplicación (tras aprobación)
1. **Fuente única de verdad** por repositorio: constante `SEO_TITLE = 'FINANCIACION DE CIRUGIAS PLASTICAS'` en un módulo puro (`shared/utils/seoTitle.ts`, admitido por Nuxt 4 en ambos) y un helper `usePublicSeoTitle()` que fija `title`, `ogTitle` y `twitterTitle`.
2. **Sustituir** en cada página pública los títulos propios por el helper; conservar `description`, `ogDescription`, canonical, imágenes y H1 específicos.
3. **Valor global por defecto** (`app.head.title`) igual a la constante, sin `titleTemplate`.
4. **Crediestética:** retirar o neutralizar las claves `seo.*_title`/`*_ogTitle` en los tres idiomas y aplicar la decisión 2 al `meta_title`.
5. **Datos estructurados** (`name` del `WebPage` de Planmed) alineados con la constante.
6. **Artefactos:** regenerar el build para que no queden HTML prerenderizados con el título anterior (no editar `dist/` a mano).
7. **Despliegue:** invalidar caché de CDN/Nginx si existe y verificar sobre el sitio publicado.

## 7. Plan de pruebas automatizadas
| Nivel | Qué comprueba | Dónde |
|---|---|---|
| Unitaria | la constante es exactamente `FINANCIACION DE CIRUGIAS PLASTICAS` (ASCII, mayúsculas, sin espacios extra) | `tests/seo/seo-title.test.ts` en cada repo |
| Estática | ninguna página pública declara `title:`/`ogTitle:` con literales ni claves i18n, solo el helper; las excepciones (admin, login, error) están en una lista explícita; no hay `titleTemplate` ni `app.head.title` distinto | misma prueba (lectura de `pages/**`, `components/**`, `nuxt.config.ts`) |
| Locales | (Crediestética) ningún `seo.*` de ningún idioma contiene títulos | misma prueba |
| Renderizada | para cada ruta pública, con el servidor en un entorno de prueba (Planmed: Hub simulado existente; Crediestética: Hub simulado y base aislada), el HTML final tiene un único `<title>` y un `og:title` iguales a la constante, también en `/en` y `/pt` | prueba de integración sobre el HTML servido |
| Contenido editable | un `meta_title` o título de noticia distinto no altera el `<title>` | integración con datos de prueba |
| Cobertura de rutas | la lista de rutas probadas se compara con las páginas existentes; una página nueva sin título definido falla | misma prueba |
Reescritura obligada: `tests/seo/financing.test.ts` (Planmed) pasa a afirmar la constante en vez del título con tilde y marca.

## 8. Verificación manual posterior
Con la app en el entorno aislado (Crediestética: 3200 con Hub simulado en 8012; Planmed: 3100): `curl -s <ruta>` y extraer `<title>` y `og:title` en cada ruta pública e idioma, más inspección en el navegador. Esto verifica el HTML servido, **no** lo que muestre Google.

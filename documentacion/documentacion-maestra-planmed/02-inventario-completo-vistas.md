# 02 · Inventario completo de vistas, rutas y API

Totales **derivados del recuento real** (`find pages -name '*.vue'` = 43; `find server/api -name '*.ts'` = 57; ver `12-matriz-cobertura.md`).

* **Archivos de página:** 43 → 24 públicos + 19 de admin (18 pantallas + 1 redirección).
* **Pantallas distintas por URL de patrón:** 43 patrones de ruta (algunos con variantes por parámetro, p. ej. `/admin/procedimientos/nuevo` vs `/:slug`).
* **Vistas especiales fuera de `pages/`:** `error.vue` (404/401/403/503/500), redirección `/simulador`.
* **Rutas API:** 57 archivos (36 admin, 16 públicas de lectura, 3 auth, 2 formularios).

Leyenda de **Verif.**: `EJ` = renderizada y revisada en ejecución (dev server local + **Hub simulado** con datos ficticios; capturas en `CAPTURAS/`), `COD` = solo código, `TEST` = cubierta por pruebas automáticas ejecutadas (597 pruebas, 579 OK, 18 omitidas, 0 fallos). Ver `11`. Ficha = archivo en `05-fichas-vistas/`.

## 1. Vistas públicas (layout `default`)

| # | Ruta | Archivo | Acceso | Datos / fuente | Verif. | Ficha |
|---|---|---|---|---|---|---|
| P01 | `/` | `pages/index.vue` | pública | Hub (procedimientos, SSR) + `/api/public/clinics` (local) | EJ (desktop+móvil) | [F01](05-fichas-vistas/F01-inicio.md) |
| P02 | `/financiacion` | `pages/financiacion.vue` | pública | `/api/public/about` (FAQ/contacto), tasa local, Hub (lista procedimientos en simulador) | EJ | [F02](05-fichas-vistas/F02-financiacion-simulador.md) |
| P03 | `/nosotros` | `pages/nosotros.vue` | pública | `/api/public/about` (local, administrable) | EJ | [F03](05-fichas-vistas/F03-paginas-informativas.md) |
| P04 | `/quienes-somos` | `pages/quienes-somos.vue` | pública | estática | EJ | F03 |
| P05 | `/servicios` | `pages/servicios.vue` | pública | estática + FAQ de `about` | EJ | F03 |
| P06 | `/clinicas-aliadas` | `pages/clinicas-aliadas.vue` | pública | `/api/public/pages/clinicas-aliadas` + `/api/public/clinics` (local) | EJ | F03 |
| P07 | `/estudio-de-creditos` | `pages/estudio-de-creditos.vue` | pública | **maqueta** (sin envío) | EJ | F03 |
| P08 | `/informacion-precontractual` | `pages/informacion-precontractual.vue` | pública | estática | EJ | F03 |
| P09 | `/politica-datos-personales` | `pages/politica-datos-personales.vue` | pública | estática + 4 PDF alojados en `planmed.com.co` | EJ | F03 |
| P10 | `/recursos` | `pages/recursos.vue` | pública | `data/resources.ts` (vacío) | EJ | F03 |
| P11 | `/procedimientos` | `pages/procedimientos/index.vue` | pública | Hub `/v1/web/cirugias` | EJ (+estado Hub caído) | [F04](05-fichas-vistas/F04-procedimientos.md) |
| P12 | `/procedimientos/:slug` | `pages/procedimientos/[slug].vue` | pública | Hub `/v1/web/cirugias/{slug}` | EJ (200, 404, 503) | F04 |
| P13 | `/noticias` | `pages/noticias/index.vue` | pública | Hub `/v1/web/posts` | EJ | [F05](05-fichas-vistas/F05-noticias.md) |
| P14 | `/noticias/:slug` | `pages/noticias/[slug].vue` | pública | Hub `/v1/web/posts/{slug}` | EJ | F05 |
| P15 | `/testimonios` | `pages/testimonios/index.vue` | pública | Hub `/v1/web/patient-section` | EJ | [F06](05-fichas-vistas/F06-nuestros-pacientes.md) |
| P16 | `/testimonios/antes-y-despues` | `pages/testimonios/antes-y-despues.vue` | pública | ídem | EJ | F06 |
| P17 | `/testimonios/programa-de-referidos` | `pages/testimonios/programa-de-referidos.vue` | pública | ídem + `POST /api/forms/prp-enrollment` | EJ (vista) / TEST (envío) | F06 |
| P18 | `/recomendaciones/:slug` | `pages/recomendaciones/[slug].vue` | pública | Hub árbol + página heredada | COD/TEST (EJ del tema en la ruta jerárquica) | [F07](05-fichas-vistas/F07-recomendaciones-publicas.md) |
| P19 | `/recomendaciones/:topic/:subtopic` | `pages/recomendaciones/[topic]/[subtopic].vue` | pública | Hub `/v1/web/recommendation-topics/{t}/{s}` | EJ | F07 |
| P20 | `/recomendaciones/cuidados` | `pages/recomendaciones/cuidados/index.vue` | pública | Hub (procedimientos + páginas) | EJ | F07 |
| P21 | `/recomendaciones/cuidados/:slug` | `…/cuidados/[slug].vue` | pública | Hub | TEST | F07 |
| P22 | `/recomendaciones/revision` | `…/revision/index.vue` | pública | Hub | EJ | F07 |
| P23 | `/recomendaciones/revision/:slug` | `…/revision/[slug].vue` | pública | Hub | TEST | F07 |
| P24 | `/prp/:slug` | `pages/prp/[slug].vue` | pública (sin indexar) | Hub `/v1/web/prp/{slug}`; formulario → CRM directo | EJ (200, 404, 503) | [F08](05-fichas-vistas/F08-micrositio-prp.md) |
| — | `/simulador` | `routeRules` | redirección 301 → `/financiacion` | — | COD | F02 |
| — | cualquier otra | `error.vue` | 404/401/403/5xx | `utils/siteError.ts` | EJ (404) | [F09](05-fichas-vistas/F09-errores-y-estados-transversales.md) |

Nota P18: `/recomendaciones/:slug` resuelve en este orden: (1) subtema ⇒ 301 a la URL jerárquica; (2) tema ⇒ portada del tema; (3) página heredada; si no, 404/503. No hay capturas propias de esa ruta: se verificó la ruta jerárquica y el índice de grupos.

### Componentes de vista global (aparecen en todas las rutas públicas salvo `/prp/**` donde se indica)

| Elemento | Archivo | Ficha |
|---|---|---|
| Barra de navegación (escritorio + móvil) | `components/layout/Navbar.vue` | [F10](05-fichas-vistas/F10-layout-publico-global.md) |
| Pie de página | `components/layout/Footer.vue` | F10 |
| Lanzador de chat (WhatsApp/Messenger) | `components/layout/ChatLauncher.vue` | F10 |
| Botón + modal «Pide tu cita de valoración» (no en `/prp/**`) | `components/forms/ValuationRequest.vue` | F10 |
| Modal «Información precontractual» (no en `/prp/**`) | `components/common/PrecontractualModal.vue` | F10 |

## 2. Vistas del panel administrativo (layout `admin`, salvo login)

| # | Ruta | Archivo | Acceso | Fuente de datos | Verif. | Ficha |
|---|---|---|---|---|---|---|
| A01 | `/admin/login` | `pages/admin/login.vue` (`layout:false`) | pública (redirige a `/admin` si ya hay sesión) | `POST /api/auth/login` | EJ | [A01](05-fichas-vistas/A01-acceso-y-dashboard.md) |
| A02 | `/admin` | `pages/admin/index.vue` | sesión + rol CMS | — | EJ | A01 |
| A03 | `/admin/procedimientos` | `pages/admin/procedimientos/index.vue` | sesión + rol CMS | Hub `/cms/procedures` | EJ | [A02](05-fichas-vistas/A02-procedimientos.md) |
| A04 | `/admin/procedimientos/nuevo` · `/:slug` | `pages/admin/procedimientos/[slug].vue` | ídem | ídem | EJ (nuevo) / COD (edición) | A02 |
| A05 | `/admin/noticias` | `pages/admin/noticias/index.vue` | ídem | Hub `/cms/posts` | EJ | [A03](05-fichas-vistas/A03-noticias.md) |
| A06 | `/admin/noticias/nuevo` · `/:slug` | `pages/admin/noticias/[slug].vue` | ídem | ídem | EJ (nuevo) / COD | A03 |
| A07 | `/admin/testimonios` | `pages/admin/testimonios/index.vue` | ídem | Hub `/cms/patient-section`, `testimonial-embeds`, `before-after-cases` | EJ | [A04](05-fichas-vistas/A04-nuestros-pacientes.md) |
| A08 | `/admin/recomendaciones` | `pages/admin/recomendaciones/index.vue` | ídem | redirección → `/admin/recomendaciones/temas` | COD | [A05](05-fichas-vistas/A05-recomendaciones-arbol.md) |
| A09 | `/admin/recomendaciones/temas` | `…/temas/index.vue` | ídem | Hub `/cms/recommendation-topics` | EJ | A05 |
| A10 | `/admin/recomendaciones/temas/:topic` | `…/temas/[topic]/index.vue` | ídem | Hub | EJ | A05 |
| A11 | `/admin/recomendaciones/temas/:topic/subtemas/:subtopic` | `…/subtemas/[subtopic]/index.vue` | ídem | Hub (+ enlace corto) | EJ | A05 |
| A12 | `…/subtemas/:subtopic/secciones/nueva` | `…/secciones/nueva.vue` | ídem | Hub | EJ | A05 |
| A13 | `…/subtemas/:subtopic/secciones/:section` | `…/secciones/[section].vue` | ídem | Hub | COD | A05 |
| A14 | `/admin/recomendaciones/historico` | `pages/admin/recomendaciones/historico.vue` | ídem (**sin enlace en ningún menú o pantalla**: solo accesible escribiendo la URL) | Hub `/cms/recommendation-pages` + procedimientos | EJ | [A06](05-fichas-vistas/A06-recomendaciones-historico.md) |
| A15 | `/admin/nosotros` | `pages/admin/nosotros.vue` | ídem | `/api/admin/about` (disco local) | EJ | [A07](05-fichas-vistas/A07-nosotros-y-clinicas.md) |
| A16 | `/admin/paginas/clinicas-aliadas` (`/admin/paginas/:slug`) | `pages/admin/paginas/[slug].vue` | ídem; slug no registrado ⇒ 404 | `/api/admin/pages/:slug` + `/api/admin/clinics` (disco local) | EJ | A07 |
| A17 | `/admin/micrositios` | `pages/admin/micrositios/index.vue` | ídem | Hub `/prp-referrers` | EJ | [A08](05-fichas-vistas/A08-micrositios-prp.md) |
| A18 | `/admin/micrositios/nuevo` · `/:id` | `pages/admin/micrositios/[id].vue` | ídem | ídem | EJ (nuevo) / COD | A08 |
| A19 | `/admin/configuracion` (`?tab=tasa|guia`) | `pages/admin/configuracion/index.vue` | ídem + comprobación `/api/admin/config/access` (líder o rol de tasa) | `/api/admin/config/*` | EJ | [A09](05-fichas-vistas/A09-configuracion.md) |

Rutas administrativas **no enlazadas en el menú lateral**: `A08`(redirección), `A14` (histórico: búsqueda en `pages/`, `components/` y `layouts/` no halla ningún enlace hacia ella; su aviso «Contenido heredado» enlaza hacia `temas`, no al revés), `A12/A13` (desde el subtema), `A04/A06/A18` con `nuevo`.

Categorías del encargo **no encontradas** (verificado por búsqueda en `pages/`): registro público de usuarios, recuperación de contraseña, gestión de usuarios/roles (solo lectura de «colaboradores»), página de contacto independiente, listados con paginación pública, buscador público, blog.

## 3. Rutas API (57)

### 3.1 Autenticación (3)
| Método | Ruta | Archivo | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | `server/api/auth/login.post.ts` | Login contra Hub; crea cookie de sesión |
| POST | `/api/auth/logout` | `…/logout.post.ts` | Revoca token en Hub y destruye cookie |
| GET | `/api/auth/me` | `…/me.get.ts` | Revalida sesión/rol con Hub |

### 3.2 Formularios públicos (2)
| POST | `/api/forms/valuation` | `forms/valuation.post.ts` | Valoración → CRM médico (`server/utils/valuation.ts`) |
|---|---|---|---|
| POST | `/api/forms/prp-enrollment` | `forms/prp-enrollment.post.ts` | Inscripción PRP → Hub (`server/utils/prpEnrollment.ts`) |

### 3.3 Lectura pública (16) — siempre GET, `Cache-Control: no-store`
`/api/public/` + `about`, `about/media/:name`, `clinics`, `clinics/media/:name`, `financing-rate`, `news`, `news/:slug`, `pages/:slug`, `patient-section`, `procedures`, `procedures/:slug`, `prp/:slug`, `recommendation-topics`, `recommendation-topics/:topic/:subtopic`, `recommendations`, `recommendations/:slug`.

### 3.4 Administración (36)
| Módulo | Rutas (`/api/admin/…`) | Métodos |
|---|---|---|
| Nosotros | `about` | GET, PUT |
| Clínicas aliadas | `clinics`, `clinics/upload` | GET, PUT; POST |
| Páginas simples | `pages/:slug` | GET, PUT |
| Configuración | `config/access`, `config/financing-rate`, `config/line-users` | GET; GET, PUT; GET |
| Noticias | `news`, `news/:id` | GET, POST; GET, PUT, DELETE (= despublicar) |
| Procedimientos | `procedures`, `procedures/:id` | GET, POST; GET, PUT, DELETE (= desactivar/deshabilitar) |
| Micrositios PRP | `prp`, `prp/:id` | GET, POST; GET, PUT, DELETE |
| Pacientes | `patient-section` | GET, PUT |
| Recomendaciones (árbol) | `recommendation-tree/**` (catch-all, 4 archivos por método) | GET, POST, PUT, DELETE a 32 rutas internas (`shared/utils/recommendationAdminApi.ts`) |
| Recomendaciones (heredado) | `recommendations`, `recommendations/:slug` | GET, POST; PUT, DELETE |

Detalles de contratos en [`07-modelo-datos-integraciones.md`](07-modelo-datos-integraciones.md).

## 4. Estados y variantes por ruta
Los estados (carga, vacío, error, 404, 503, validación, éxito, móvil) están documentados **dentro de cada ficha**, no como rutas independientes.

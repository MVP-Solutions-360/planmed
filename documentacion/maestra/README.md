# Documentación maestra — Planmed, Crediestética y Wellezy Hub

**Creada:** 2026-10-09 · **Alcance:** auditoría y brechas de las webs Planmed y Crediestética frente a Wellezy Hub (CMS).
**Estado:** viva. Cada afirmación lleva una etiqueta de evidencia; lo que no pudo comprobarse se dice expresamente.

Leyenda de evidencia usada en todos los archivos:

| Etiqueta | Significado |
|---|---|
| **[Código]** | Comprobado leyendo el código del repositorio indicado, en la fecha de arriba. |
| **[Doc]** | Está en documentación existente; no se re-verificó contra el código. |
| **[Prueba]** | Comprobado ejecutando una prueba (se cita el resultado). |
| **[No verificado]** | No se pudo comprobar; no tomarlo como cierto. |
| **[Decisión]** | Requiere una decisión de negocio o técnica antes de implementar. |

## Repositorios y rutas reales

| Proyecto | Ruta | Rama / último commit | Notas |
|---|---|---|---|
| Planmed web (Nuxt 4) | `C:\Users\pdtco\Desktop\planmed\planmed-web` | `main` · `d520080` | Árbol de trabajo con **cambios locales sin commit** (módulos de recomendaciones, testimonios, configuración, PRP, auth). No revertir. |
| Crediestética web (Nuxt + i18n) | `C:\Users\pdtco\Desktop\Cliniplanes\cliniplanes-web` | rama del repo `Cliniplanes` · `8a7594e` | El README dice «crediestética». Cambios locales: borrado de `dist/` y `.gitignore`. Su código es **otra arquitectura** (ver `03`). |
| Wellezy Hub (Laravel 13) con el CMS actual | `C:\xampp\htdocs\laravel\wellezy-hub-2` | `main` · `cc5aea4` | Contiene `recommendation_pages`, `testimonial_embeds`, `web_before_after_cases`, `patient_section_settings` **sin commit** (untracked). |
| Hub — rama de pagos | `C:\xampp\htdocs\laravel\wellezy-hub-wompi` | `feature/pagos-wompi` · `f42dca1` | Solo ADR y documentación de pagos; **nada implementado** (el ADR lo dice). |
| Hub — copia antigua | `C:\xampp\htdocs\laravel\wellezy-hub` | `9e7fa7e` «first commit» | Sin los módulos CMS. No usar. |

Otras sesiones de trabajo activas en la misma máquina (según el panel de sesiones): «Catálogo de cirugías independiente», «Integracion Wompi», «wellezy-hub-2-1f». **Coordinar antes de editar `server/utils/procedures.ts`, `providers/Hub*`, `Navbar.vue` y los módulos de recomendaciones de Planmed: otra sesión los estaba modificando mientras se escribió esta documentación** (archivos con marca de tiempo del mismo minuto).

## Documentación previa: qué sigue vigente

| Documento | Veredicto |
|---|---|
| `documentacion/business_rules.md` (Planmed) | **Vigente.** Reglas de simulador/financiación: no se tocan en ninguna tarea. |
| `documentacion/identidad_visual.md` (Planmed) | Vigente para Planmed (no se compara aquí). |
| `documentacion/architecture.md` (Planmed) | **Desactualizado en dos puntos**: (1) afirma que Planmed está «completamente desacoplado de Wellezy Hub» y prohíbe `X-Wellezy-Tenant`/endpoints de Wellezy, pero el código ya usa Hub para auth, procedimientos, noticias, PRP y recomendaciones [Código]; (2) lista solo Quotation/Lead/Tracking como providers. La sección «PROCEDIMIENTOS (DATA)» sí es correcta. **No se sobrescribió**; este conjunto lo reemplaza como referencia de arquitectura (ver `03`). Pendiente [Decisión]: que el equipo confirme y actualice ese archivo. |
| `documentacion/plan_implementacion_paginas_referido_y_noticias.md` (Planmed) | Plan del 2026-09-30. Parte de su «estado actual» ya cambió (noticias y PRP ya están en Hub). Útil por las decisiones de negocio del PRP (sección 1). |
| `documentacion/legacy/*` (Planmed) | `conexiones_crm.md` describe el contrato `POST /api/v1/leads` + `web-events` con `X-Wellezy-Tenant`; es el contrato de **Cliniplanes/Crediestética**. Hub aún expone esas rutas [Código], pero Planmed hoy no las usa. |
| Hub `docs/cms/persistence-api.md` | **Fuente de verdad del contrato CMS** de Pacientes y Recomendaciones; contrastado con las rutas y controladores de esta auditoría. |
| Hub `docs/architecture/adr-pagos-wompi.md`, `docs/modules/pagos/*`, `docs/modules/valoraciones/` | Propuesta **no implementada** (rama `feature/pagos-wompi`). |
| Crediestética `documentacion/{conexiones_crm,cors_config,identidad_visual}.md` | Vigentes para Crediestética; no se auditó que cada línea coincida con su código. |

## Índice

1. [`01-inventario-paginas.md`](01-inventario-paginas.md) — páginas, rutas, menús y estado de cada web.
2. [`02-catalogo-brechas.md`](02-catalogo-brechas.md) — tabla común de brechas (IDs `PM-*`, `CR-*`, `CO-*`).
3. [`03-arquitectura-compartida.md`](03-arquitectura-compartida.md) — arquitectura, diferencias por marca, tenant, auth.
4. [`04-persistencia-y-administracion.md`](04-persistencia-y-administracion.md) — por módulo: fuente de verdad, tablas, endpoints, mocks.
5. [`05-matriz-trazabilidad.md`](05-matriz-trazabilidad.md) — requisito → página → componente → API → tabla → permiso → prueba.
6. [`06-auditoria-preaprobado-y-pagos.md`](06-auditoria-preaprobado-y-pagos.md) — auditoría separada; **no implementar** aún.
7. [`07-reutilizacion-crediestetica.md`](07-reutilizacion-crediestetica.md) — común / configurable / específico de marca.
8. [`08-registro-de-pruebas-y-cambios.md`](08-registro-de-pruebas-y-cambios.md) — pruebas ejecutadas y cambios hechos en esta fase.

## Límites de esta documentación (leer antes de usarla)

- **No existe en ningún repositorio el contenido de las webs originales** (las páginas actuales de producción de Planmed y Crediestética). Las capturas a las que se refiere el encargo no están en el repositorio ni se recibieron. Por eso, la columna «contenido de la web original» del inventario solo recoge lo que está **documentado** o implícito en el código; el resto figura como **[No verificado]** y requiere capturas o acceso a la web original.
- «Estado de la página nueva» se refiere al código de este árbol de trabajo, no a producción.
- Ninguna conclusión sobre Crediestética debe leerse como «alineada con Planmed»: solo se auditó su estructura de archivos, configuración y navegación, no cada página.

## Estado tras la estabilización (comprobado)

- **Implementado y probado:** Recomendaciones (CRUD, publicación, recomendaciones por procedimiento, SSR/404/503, menú) y Nuestros Pacientes (persistencia en Hub, SSR, visibilidad, imágenes, aislamiento de línea, fallo parcial); PM-SEC-01 corregido. 92/92 `npm test`, typecheck limpio, E2E Pacientes OK y Recomendaciones 63/63 (ver `08` §5).
- **Implementado con limitaciones:** Hub caído => estado vacío con HTTP 200 en páginas de Pacientes; `procedimientos/[slug]` y `noticias/[slug]` aún confunden Hub caído con 404.
- **Pendiente de validación visual:** menús desplegables, formularios admin y avisos de guardado parcial (no se hizo recorrido en navegador).
- **Pendiente de decisión funcional:** precedencia página independiente vs. recomendación por procedimiento (`04` §2.1); desplegable de Procedimientos con altura máxima y scroll.
- **Pendiente del backoffice del CRM:** pantallas de administración de Pacientes y Recomendaciones en el CRM (los endpoints del Hub existen).
- **Pendiente de otra fase:** Preaprobado y pagos (`06`).
- **Crediestética:** solo tuvo una auditoría estructural inicial; **no debe considerarse alineada funcionalmente con Planmed**.

### Actualización: validación visual y cierre de navegación
- **Implementado y probado:** desplegable de Procedimientos con datos de Hub (altura máxima + scroll, teclado, móvil); detalles de procedimiento/noticia/recomendación responden 503 si Hub falla y 404 solo si no existe; regla de precedencia R1–R3 de Recomendaciones (`04` §2.1).
- **Implementado con limitaciones:** índices con Hub caído siguen mostrando lista vacía con HTTP 200 (PM-ERR-02); revisión visual parcial contra un Hub simulado (ver `08` §6).
- **Pendiente de decisión funcional / otra fase (Hub):** sustitución de campo histórico por página independiente (R4, PM-RECO-08) requiere vínculo `cirugia_id`+`kind` y distinguir «no publicada» de «inexistente».
- **Pendiente del backoffice del CRM:** sin cambios.

# 08 — Registro de pruebas y cambios de esta fase (2026-10-09)

No se hicieron commits, push ni despliegues. No se tocaron producción ni bases de datos reales. Las pruebas con escritura usaron **únicamente** la base local `wellezy_hub_testing` (la misma que fuerza `phpunit.xml`), y se limpió lo creado.

## 1. Cambios en el repositorio (Planmed)

**Documentación nueva:** `documentacion/maestra/` (README + 01–08). No se modificó ningún documento existente.

**Código (PM-PAC-01 — Nuestros Pacientes ahora lee/escribe Wellezy Hub):**

| Archivo | Cambio |
|---|---|
| `server/utils/patients.ts` | Nuevo. Mapeos Hub↔Planmed, validación previa, `applyContent` (diff: eliminar→actualizar→crear→reordenar). |
| `server/api/public/patient-section.get.ts` | Nuevo. `GET /v1/web/patient-section` con el tenant del servidor; 503 si Hub falla. |
| `server/api/admin/patient-section.get.ts`, `.put.ts` | Nuevos. Admin con la sesión del servidor. |
| `providers/{HubTestimonialsProvider,PublicTestimonialsProvider,HubPublicTestimonialsProvider}.ts`, `services/PublicTestimonialsService.ts` | Nuevos. |
| `services/TestimonialsService.ts` | Ahora usa `HubTestimonialsProvider`. |
| `providers/MockTestimonialsProvider.ts` | **Eliminado** (archivo sin versionar; su contenido era un mock con `localStorage` clave `planmed-mock-testimonials` y valores por defecto vacíos; no se perdió contenido de usuarios en el repo, pero lo que un navegador hubiera guardado en su localStorage ya no se lee). |
| `types/testimonials.ts` | Añadidos `active`/`published` opcionales y `title` en Instagram. |
| `pages/testimonios/{index,antes-y-despues,programa-de-referidos}.vue`, `components/testimonials/TestimonialsNav.vue`, `components/layout/Navbar.vue` (solo el import y la llamada de testimonios) | Leen del servicio público; páginas y menú con `useAsyncData` (SSR). |
| `pages/admin/testimonios/index.vue` | Casilla «Visible/Publicado» por elemento, título obligatorio en casos, manejo de error al cargar. |
| `tests/patients/server.test.ts` | Nuevo: 17 pruebas. |

Cambios locales **preexistentes de otras sesiones** que no se tocaron: módulo de recomendaciones (Nitro/providers/services), `HubProcedureProvider`, `server/utils/procedures.ts`, `package.json` (script `test`), `tests/recommendations/*`.

## 2. Pruebas ejecutadas

| Prueba | Comando | Resultado |
|---|---|---|
| Hub: recomendaciones, recomendaciones por procedimiento, Nuestros Pacientes | `php -d memory_limit=2G vendor/bin/pest tests/Feature/Api/Cms/RecommendationPagesCmsTest.php tests/Feature/Api/Cms/ProcedureRecommendationsTest.php tests/Feature/Api/Cms/PatientSectionCmsTest.php` | **39 pasan** / 244 aserciones (46 s) |
| Hub: toda `tests/Feature/Api/Cms` + seeder | `pest tests/Feature/Api/Cms tests/Feature/Seeders/PlanmedRecommendationPagesSeederTest.php` | **Falló: 3 pasan, 165 errores** (`Table departments doesn't exist`, `Deadlock found`). Causa: lancé dos ejecuciones de Pest a la vez sobre la misma BD `wellezy_hub_testing` (una quedó en segundo plano) y chocaron en `migrate:fresh`. **No es un fallo del código.** No se repitió esa suite completa; solo la tanda de 39 arriba. Pendiente: correr la suite completa de forma secuencial. |
| Planmed: unitarias de Nitro/providers | `npm test` | **55 pasan, 0 fallan** (38 de recomendaciones + 17 nuevas de pacientes) |
| Planmed: tipos | `npx nuxt typecheck` | Sin errores (código de salida 0) |
| **E2E real** Nuxt → Hub | Hub `artisan serve --port=8001` con `DB_DATABASE=wellezy_hub_testing` + Nuxt de pruebas en otro puerto y `buildDir` separado (la sesión de otra persona tenía el dev server de Planmed en ejecución) | Ver 3 |

## 3. E2E contra Hub real (BD de pruebas)

Datos creados: dos empresas/líneas (`planmed-e2e`, `otra-e2e`), usuarios, roles con `pacientes_web.*`. Resultados observados:

- Login por Nitro → Hub OK. `GET admin` vacío con valores por defecto.
- `PUT` con 2 videos YouTube (uno oculto), 1 Instagram, 1 caso con dos PNG (data URL), referidos con `<script>`: se crean; `<script>` eliminado por el sanitizador de Hub; imágenes guardadas en `media_assets` (URLs reales).
- Público: **no** muestra el video oculto; sí el visible, Instagram, caso y referidos.
- `PUT` posterior: sección de videos oculta → público devuelve `videos: []` y visibilidad `false`; caso despublicado → `before_after: []`; quitar/volver a pegar el mismo enlace OK; se conserva el elemento oculto en admin.
- Sin sesión: 401. Cuerpo inválido: 422. URL inválida: 422 con mensaje de Hub.
- **Hallazgo y corrección:** antes de añadir la validación previa, un enlace inválido hacía que el `PUT` eliminara lo existente y fallara al crear (borrado parcial). Se añadió validación previa en `parseContentBody`; repetido: 422 sin escrituras.
- **Aislamiento (directo contra Hub):** la línea `otra-e2e` lista 0 embeds; editar un embed de `planmed-e2e` → **404**; borrar un caso de `planmed-e2e` → **404**; la lectura pública con `X-Tenant-Linea: otra-e2e` no devuelve nada de `planmed-e2e`.
- SSR: `curl` de `/testimonios`, `/testimonios/antes-y-despues` y `/testimonios/programa-de-referidos` devolvió el contenido en el HTML inicial.
- Observación (no corregida, preexistente): `assertSameOrigin` acepta peticiones **sin** cabecera `Origin` (un `PUT` con `curl` sin `Origin` devolvió 200). Los navegadores siempre envían `Origin` en `PUT`/`POST`, pero conviene revisarlo (ver `02`, nueva fila PM-SEC-01).
- **Limpieza:** se eliminaron los datos de prueba (0 empresas `*-e2e`, 0 embeds, 0 casos, 0 imágenes `before`); se detuvieron el Hub del puerto 8001 y el Nuxt de pruebas; se borró la carpeta temporal `.e2e`.
- Efecto residual: la subida de imágenes escribe en el disco `public` del Hub local (`wellezy-hub-2/storage/app/public/web/before-after`); los casos se eliminaron por Eloquent (purga), por lo que los archivos también se borraron: el directorio quedó vacío (comprobado con `ls`).

## 4. Fallos y diferencias preexistentes registrados
- Suite Hub completa de `Api/Cms`: ver fila de arriba (colisión de ejecuciones, no código).
- `Planmed/architecture.md` desactualizado (ver README).
- No se pudo comparar contra una «referencia limpia» (rama sin cambios locales): el árbol de trabajo tiene cambios sin commit de varias sesiones.

## 5. Fase de estabilización (integración conjunta) — resultados comprobados
Ejecución secuencial, una sola suite a la vez sobre `wellezy_hub_testing` (verificada como base de pruebas antes de sembrar). Hub local en :8011 y Nuxt en :3100 (propios; no se tocaron :8000/:3000/:3001).

| Prueba | Resultado |
|---|---|
| `npm test` (node:test) | **92/92 pass**, 0 fail, 0 skipped |
| `npm run typecheck` | sin errores |
| E2E Pacientes + seguridad (`e2e_pat.mjs`) | **TODO OK** (incluye PM-SEC-01, SSR, visibilidad, despublicar/republicar, fallo parcial real, validación previa de imágenes, aislamiento de línea, 403 sin permisos) |
| E2E Recomendaciones (`e2e_rec.mjs`) | **63/63 pass** |
| Suites Pest del Hub | No ejecutadas en esta fase (el Hub no se modificó); resultados de fases previas siguen en este registro |
| Fallos preexistentes | Los del Hub ya documentados (§4); ninguno nuevo |
| Fallos nuevos | Ninguno |
| No ejecutadas | Recorrido visual/clics en navegador (menús desplegables, formularios); Crediestética |

### Cambios de la estabilización
- `server/utils/origin.ts` (nuevo): `assertSameOrigin` falla cerrado (corrige **PM-SEC-01**); `auth.ts` ya no lo define.
- Pacientes: validación previa de imágenes (422 antes de escribir); guardado con varias operaciones comunica fallo **parcial** (`data.partial`, contenido releído de Hub, aviso en la UI); 401 no se disfraza de parcial. Un reintento converge sin duplicados.
- Recomendaciones: error de Hub => **503** (antes se confundía con 404) en `/recomendaciones/[slug]` y `/recomendaciones/{cuidados|revision}/[slug]`.
- Navbar: lógica de menús extraída a `utils/navMenus.ts`; visibilidad de Pacientes por SSR con clave `patient-section` compartida.
- Pruebas nuevas: `tests/security/routes.test.ts` (12), `tests/patients/partial.test.ts` (8), `tests/navigation/menus.test.ts` (16).

### Comportamiento actual (documentado, sin regla de precedencia inventada)
- Página independiente publicada: 200 con SSR. Existe sin publicar: Hub público devuelve 404 => 404 en Planmed. No existe: 404 (indistinguibles para el público).
- Independientes (`/recomendaciones/<slug>`) y por procedimiento (`/recomendaciones/{cuidados|revision}/<slug>`) son rutas separadas: no hay precedencia entre ellas; propuesta en `04` §2.1 sigue **[Decisión]**.
- Hub caído: recomendaciones => 503; índices y páginas de Pacientes => estado vacío con HTTP 200; `procedimientos/[slug].vue` y `noticias/[slug].vue` mantienen el patrón antiguo (Hub caído => 404): no corregido.
- Menú Procedimientos: enlace simple. El desplegable con altura máxima y scroll interno **no está implementado**; los submenús de Recomendaciones sí tienen scroll (70vh escritorio / menú móvil).

## 6. Fase «Validación visual y cierre funcional de navegación»
### Cambios
- `utils/navMenus.ts`: `buildProcedureMenu` (slugs reales, descarta slugs/nombres inválidos). `components/layout/Navbar.vue`: desplegable de **Procedimientos** (escritorio: `max-h-[min(70vh,calc(100dvh-120px))]` + scroll; móvil: `<details>` con `max-h-[50dvh]` + scroll; foco de teclado abre, `aria-haspopup`/`aria-expanded`, Escape cierra; sin procedimientos queda el enlace simple). Reutiliza la lista pública ya cargada (sin detalle por procedimiento) y usa `Promise.allSettled` para que un fallo de la lista de páginas no borre este menú.
- `pages/procedimientos/[slug].vue`, `pages/noticias/[slug].vue`: error de Hub => 503 (antes 404). `server/api/public/news/[slug].get.ts`: tenant no resuelto => 503 (antes 404).
- Pruebas nuevas: `tests/navigation/procedures-menu.test.ts` (9), `tests/recommendations/errors-precedence.test.ts` (11 + 1 por ruta).

### Revisión visual (qué sí y qué no)
Hub **simulado** (`mockhub.mjs`, sin BD, sin migraciones ni seeders) + Nuxt dev en :3100, navegador integrado del escritorio. Verificado con medidas del DOM (las capturas del panel salieron con artefactos y el aviso precontractual las tapa):
- Procedimientos, 3 ítems: abre por foco, 4 enlaces con slugs reales, alto 180 px. 45 ítems con ventana de 600 px: alto 420 px (bottom 488 < 600), `scrollHeight` 2623 con scroll interno hasta el último. Móvil 375×812: lista de 406 px con scroll, sin desborde horizontal.
- Menús Recomendaciones y Nuestros Pacientes: contenido correcto; la página sin publicar no aparece; con lista vacía o Hub caído solo queda Nuestros Pacientes y Procedimientos como enlace simple.
- Códigos HTTP (Hub OK): detalle de procedimiento/noticia/recomendación publicada 200; inexistente o sin publicar 404. Con Hub devolviendo 503: detalles 503; índices 200 con lista vacía (PM-ERR-02).
- Administración: login (credenciales de prueba contra el Hub simulado), Nuestros Pacientes (3 pestañas con datos de Hub; la validación del formulario muestra el diálogo «Falta información») y Recomendaciones (lista por grupos con indicador verde/gris; publicar una página y guardar muestra «Cambios guardados correctamente» y la página aparece en la API pública).
- **No verificado:** captura visual completa de los menús abiertos, guardado parcial en la UI, subida de imágenes, navegación por teclado real con la ventana enfocada (se disparó `focusin`), Safari/Firefox, y nada contra el Hub real con base de datos. **No se declara revisión visual completa.**
- El aviso precontractual no se aceptó (es una aceptación legal): se retiró solo del DOM para revisar; no se guardó aceptación.

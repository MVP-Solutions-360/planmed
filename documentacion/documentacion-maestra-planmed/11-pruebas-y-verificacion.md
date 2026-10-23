# 11 · Pruebas y verificación

## 1. Pruebas automáticas existentes
`npm test` = `node --test "tests/**/*.test.ts"`. **33 archivos**, ~120 suites. Son pruebas **unitarias/de contrato/estáticas** con dobles de prueba (manejadores Nitro con globals simulados, análisis de plantillas `.vue` como texto, módulos puros). **No existen pruebas end-to-end de navegador ni de componentes montados**; las únicas «de integración real» (contra servidor y Hub vivos) están **omitidas** si faltan variables.

| Carpeta | Archivos | Cobertura |
|---|---|---|
| `tests/about` | about, clinics, guide, line-users, pages | modelo/validación de Nosotros y Clínicas, guía, colaboradores, páginas públicas |
| `tests/financing` | quote, rate-store, service-fetch | fórmula de cuota, almacén de tasa, servicio |
| `tests/integration` | error-pages, hub-readonly, procedure-recommendation-ssr | **requieren servidor/Hub vivos** |
| `tests/navigation` | menus, procedures-menu, public-layout | menús dinámicos y layout |
| `tests/patients` | partial, server | Pacientes (guardado parcial, contrato) |
| `tests/recommendations` | 12 archivos + `harness.ts` | árbol, admin UI, errores, precedencia, proveedores, SSR |
| `tests/referral`, `tests/valuation`, `tests/share`, `tests/seo`, `tests/security`, `tests/site-error.test.ts` | | formularios, compartir, SEO, matriz de seguridad de rutas admin, página de error |

## 2. Pruebas **ejecutadas** en esta auditoría
| Comando | Fecha | Resultado real |
|---|---|---|
| `npm test` (sin `.env` de integración ni `PLANMED_SITE_URL`) | 2026-10-20 | **tests 597 · suites 120 · pass 579 · fail 0 · cancelled 0 · skipped 18 · duración ≈ 6,3 s** |
Las 18 omitidas (lista exacta en la salida) son: `tests/integration/error-pages.test.ts` (5, falta `PLANMED_SITE_URL`), `hub-readonly.test.ts` (10, falta `NUXT_WELLEZY_API_BASE_URL`) y `procedure-recommendation-ssr.test.ts` (3 de 5 omitidas por `PLANMED_SITE_URL`). **No se ejecutaron**: `npm run typecheck`, `npm run build` (afectarían al servidor de desarrollo compartido y generan artefactos), pruebas de integración vivas (llamarían a Hub/CRM reales), `npm run generate`.

## 3. Verificación manual/visual realizada
* Dev server aparte (`nuxt dev --port 3100`) con **Hub simulado de solo lectura** (script temporal fuera del repositorio) y directorio de contenido temporal; **no se tocó** el Hub real que corre en `127.0.0.1:8000` ni los datos del repositorio. Sesión de administrador con credenciales de prueba **ficticias** contra el simulador.
* Navegador headless (Chromium vía skill `browser-automation`): 105 capturas PNG en `CAPTURAS/` (ver `CAPTURAS/INDICE.md`): públicas desktop/móvil, estados (menús, chat, modales, Hub caído) y panel desktop/móvil. Se confirmaron códigos HTTP: 200 en rutas válidas, **404** para `/procedimientos/no-existe`, `/prp/no-existe`, `/ruta-que-no-existe`, **503** en listados/detalles con Hub apagado, redirección `/admin/procedimientos` → `/admin/login` sin sesión.
* Consola del navegador: solo errores esperados del entorno (WebSocket del HMR bloqueado en headless, recursos externos sin internet).

## 4. Limitaciones
1. Hub real y CRM no se consultaron: contratos documentados desde el código del cliente.
2. Ninguna operación de escritura (guardar, publicar, subir, enviar formulario) se ejecutó.
3. Vistas de edición con datos (`/admin/procedimientos/:slug`, `/admin/noticias/:slug`, `/admin/micrositios/:id`, `…/secciones/:section`) y estados con datos reales de Pacientes: **no inspeccionadas visualmente** (solo código/pruebas).
4. Estado «sesión vencida» en medio de una acción: solo por código.
5. Contenido de terceros (YouTube/Instagram/Maps) sin internet.
6. Sin prueba E2E ni accesibilidad automatizada.

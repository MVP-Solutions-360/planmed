# A06 · Recomendaciones heredado (`/admin/recomendaciones/historico`)

Captura: `CAPTURAS/admin/desktop__recomendaciones-historico.png` (+ móvil).

* Archivo: `pages/admin/recomendaciones/historico.vue`; lógica `utils/recommendationsAdmin.ts` (`createAdminController`, ~560 líneas), `utils/recommendationSource.ts`; componentes `AdminRecommendations{PageEditor,LegacyTextEditor,ProcedurePicker,SaveBar,ErrorNotice,StatusBadge}`.
* API: `/api/admin/recommendations` (GET, POST) y `/:slug` (PUT, DELETE) → Hub `/cms/recommendation-pages`; imágenes `/cms/recommendation-pages/{id}/image`; y `GET /api/admin/procedures`.
* **Sin enlace desde ningún menú ni pantalla** (accesible solo por URL); su aviso «Contenido heredado» (`data-testid="legacy-notice"`) dirige a la entrada vigente (`/admin/recomendaciones/temas`).
* Pestañas: **Recomendaciones generales** (lista + «+ Agregar»: pide título con SweetAlert, nace oculta) y **Contenido por procedimiento** (selector de procedimiento con insignias por tipo —Página publicada / Página oculta / Texto / Sin contenido—, pestañas *Cuidados* y *Cita de revisión*, página vinculada o texto heredado del procedimiento; aviso `procSource` con la fuente efectiva y URL pública).
* Protección: `onBeforeRouteLeave` + `beforeunload` si hay cambios sin guardar; guardado independiente por elemento («Sin guardar» ámbar).
* Estado: [PARC] — módulo en transición, mantenido por compatibilidad con contenido previo (regla de precedencia R1–R4 en `documentacion/maestra/04`). Verif.: EJ (carga); sin escrituras. Pruebas: `tests/recommendations/{admin-ui,admin-errors,static,listings-and-source}.test.ts`.

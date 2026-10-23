# 12 · Matriz de cobertura y control de calidad

## 1. Resumen cuantificado (derivado del recuento real, 2026-10-20)
| Concepto | Total | Documentado | Con captura | Nota |
|---|---|---|---|---|
| Archivos de página (`pages/**/*.vue`) | **43** | 43 | 38 | |
| — Vistas públicas | 24 | 24 | 21 | sin captura propia: `/recomendaciones/:slug` (P18), `/recomendaciones/cuidados/:slug`, `/revision/:slug` (P21, P23) |
| — Vistas admin (pantallas) | 18 | 18 | 17 | sin captura: `…/secciones/:section` (A13); las pantallas de edición `/:slug`/`/:id` se capturaron solo en su variante `nuevo` (la edición con datos no se inspeccionó) |
| — Redirección admin | 1 (`/admin/recomendaciones`) | 1 | — | |
| Otras vistas (error global, redirección `/simulador`) | 2 | 2 | 1 (404) | |
| Rutas API (`server/api/**`) | **57** | 57 | n/a | 36 admin · 16 públicas · 3 auth · 2 formularios |
| Fichas de vista | **19** (F01–F10, A01–A09) | | | cubren los 43 archivos de página, `error.vue` y el layout |
| Componentes `.vue` | **59** | 59 | n/a | 22 catalogados como compartidos (incl. 5 de layout), el resto exclusivos; **9 huérfanos** |
| Composables | 5 | 5 | | |
| Integraciones | **8** | 8 | | Hub (auth, lectura pública, administración, escritura pública), CRM valoración, CRM PRP, disco local, terceros incrustados |
| Capturas PNG | **105** (66 públicas + 39 panel) | | | `CAPTURAS/INDICE.md` |
| Pruebas ejecutadas | 597 | | | 579 OK · 18 omitidas · 0 fallos |

**No se declara cobertura del 100 %**: ver §4.

## 2. Rutas de página → ficha → estado
Ver tabla completa en [`02`](02-inventario-completo-vistas.md) (cada fila enlaza su ficha). Control: `find pages -name '*.vue'` (43) = 24 + 19 filas de la tabla; todas con ficha.

## 3. Verificaciones de calidad realizadas
| # | Control | Resultado |
|---|---|---|
| 1 | Inventario del código vs. documentado (pages 43, api 57) | Coinciden |
| 2 | Rutas dinámicas, anidadas, pestañas, modales, vistas sin enlace | Documentadas (histórico sin enlace; PRP, cuidados/revisión, `/recomendaciones/:slug` fuera del menú) |
| 3 | Rutas admin con entrada | 19/19 |
| 4 | Cada vista con ficha o ficha compartida | 43/43 (grupos F03, F04, F05, F06, F07, A02–A08) |
| 5 | Afirmaciones respaldadas por código/prueba/ejecución | Cada ficha etiqueta EJ / COD / TEST; lo no comprobado figura como tal |
| 6 | Vistas sin inspección visual | ver §4 |
| 7 | Enlaces relativos entre documentos | Revisados con script (ver informe final) |
| 8 | Secretos / datos personales | No se incluyó ningún valor de `.env`, token ni dato de paciente; solo nombres de variables. Credenciales de prueba ficticias **no** se transcriben. Las URLs del CRM son valores por defecto de `nuxt.config.ts` (públicas en el repositorio); números de WhatsApp/NIT son los del sitio público |
| 9 | Crediestética | `13` y `14` no afirman nada sobre su código (**no se inspeccionó**) |
| 10 | Cuantificado | §1 |

## 4. Pendientes, no accesibles o no verificados
1. **Hub real y CRM**: sin acceso/permiso; todo el contrato se dedujo del cliente y de pruebas. Capturas con Hub simulado.
2. **Vistas sin captura**: P18, P21, P23; edición con datos de A04, A06 (guardado), A13 (`:section`), A18; estados de éxito tras guardar; sesión vencida durante una acción; `/simulador` (redirección) en ejecución.
3. **Escrituras**: ninguna ejercida (guardar, publicar, subir, enviar formularios, activar/desactivar).
4. **Pruebas omitidas** (18) que requieren servidor/Hub vivos; `typecheck` y `build` no ejecutados.
5. **Capturas de Hub caído** solo para 6 rutas públicas y desktop.
6. **Contenido de terceros** (videos, Instagram, Maps) no renderizado.
7. **Producción/despliegue** (PM2, puertos, Nginx): no verificado (fuera de alcance, sin SSH).
8. **Accesibilidad** automatizada y rendimiento: no medidos.
9. **Selector de procedimiento del simulador vacío** en la captura inmediata: sin diagnóstico concluyente.
10. Documentación previa en `documentacion/` no re-verificada línea a línea (se citó solo como contexto).

## 5. Lista verificable de componentes de vista transversal
Navbar ✔ · Footer ✔ · ChatLauncher ✔ · ValuationRequest ✔ · PrecontractualModal ✔ · error.vue ✔ · layout admin ✔ · layout default ✔ · login ✔ (F10, F09, A01).

# Documentación maestra de Planmed web

**Fecha:** 2026-10-20 · **Repositorio:** `planmed-web` (rama `main`, commit base `32e4947` + cambios locales sin commit) · **Autor de la auditoría:** agente de documentación (solo lectura; sin cambios de código).
**Propósito:** describir Planmed de forma verificable para replicar su estructura en Crediestética (ver `13` y `14`). No implementa ninguna adaptación.

## Índice
| Doc | Contenido |
|---|---|
| [01](01-arquitectura-general.md) | Stack, estructura del repositorio, capas, renderizado, layouts, despliegue, hallazgos técnicos |
| [02](02-inventario-completo-vistas.md) | 43 archivos de página, error global, 57 rutas API, con archivo, acceso, verificación y ficha |
| [03](03-sitio-publico.md) | Sitio público: navegación, patrones, origen del contenido |
| [04](04-panel-administrativo.md) | Panel: mapa, operaciones disponibles, qué se configura y qué no |
| [05-fichas-vistas/](05-fichas-vistas/) | 19 fichas: F01–F10 (público/transversal), A01–A09 (panel) |
| [06](06-componentes-compartidos.md) | 59 componentes, composables, servicios, utilidades |
| [07](07-modelo-datos-integraciones.md) | Entidades, servicios, Hub, CRM, almacenamiento local, variables de entorno |
| [08](08-autenticacion-permisos-sesiones.md) | Sesión, flujos, autorización, matriz de permisos |
| [09](09-diseno-visual-responsive.md) | Tokens, tipografía, layouts, breakpoints, patrones |
| [10](10-flujos-funcionales.md) | Flujos con diagramas |
| [11](11-pruebas-y-verificacion.md) | Pruebas existentes, ejecutadas y limitaciones |
| [12](12-matriz-cobertura.md) | Cobertura cuantificada, controles de calidad, pendientes |
| [13](13-guia-replicacion-crediestetica.md) | Capas A/B/C y estrategia (sin ejecutar) |
| [14](14-mapeo-planmed-crediestetica.md) | Matriz de mapeo con campos de Crediestética **pendientes** |
| [CAPTURAS/](CAPTURAS/INDICE.md) | 105 capturas PNG + índice |

## Metodología
1. Lectura del código (páginas, componentes, `server/`, `shared/`, configuración, pruebas). Fuente principal de verdad.
2. Ejecución de `npm test` (resultado real en `11`).
3. Inspección visual con navegador headless contra un dev server **propio** (puerto 3100) y un **Hub simulado de solo lectura con datos ficticios** (script temporal fuera del repositorio; no se tocó el Hub real que corre en `:8000`). Credenciales de panel ficticias, válidas solo en el simulador.
4. Contraste del inventario con `find pages` / `find server/api`.

## Leyenda de estados
| Etiqueta | Significado |
|---|---|
| **EJ** | implementada y comprobada en ejecución (contra Hub simulado) |
| **COD** | implementada según el código, **no** comprobada en ejecución |
| **TEST** | cubierta por prueba automática ejecutada con resultado OK |
| **PARC** | parcialmente implementada (maqueta, mock, sin datos) |
| **PREV** | referenciada pero no implementada (p. ej. reglas `/blog/**`) |
| **ND** | no determinado |
| **[Doc – sin verificar]** | dato tomado de documentación previa, no re-verificado |

## Límites (leer antes de usar)
* Hub real, CRM y producción **no** se consultaron. Ninguna operación de escritura se ejecutó.
* Algunos datos de capturas (nombres, contenidos) son del simulador, no de Planmed.
* Crediestética **no se inspeccionó**.
* Cobertura **no** es 100 %: ver `12` §4.
* Documentación previa del repositorio (`documentacion/maestra`, `guias`, `architecture.md`…) se conserva intacta; esta carpeta no la reemplaza ni la modifica. `documentacion/architecture.md` aparece desactualizado según `maestra/README.md`.

## Hallazgos más relevantes
Defectos y brechas detectados (detalle en `01` §10): menú móvil del admin sin acción; modal precontractual con `{'@'}` y NIT distinto; lead del simulador mock con WhatsApp `TBD`; estudio de créditos maqueta; recursos vacío; detalle de procedimiento sin ficha técnica/galería; reglas de ruta huérfanas; 9 componentes sin uso; módulo histórico de recomendaciones sin enlace; errata «Publicacin».

# F08 · Micrositio PRP (`/prp/:slug`)

Capturas: `CAPTURAS/publico/{desktop,movil}__prp-micrositio.png`, `…__prp-inexistente-404.png`, `desktop__estado-hub-caido__prp.png`.

| Campo | Valor |
|---|---|
| Archivo | `pages/prp/[slug].vue`; formulario `components/prp/PrpLeadForm.vue` |
| Lectura | `GET /api/public/prp/:slug` → Hub `/v1/web/prp/{slug}` → `{name, slug, title, externalCode}` (solo 4 campos) |
| Envío | **directo navegador → CRM médico** (`runtimeConfig.public.crmPrpFormUrl`, multipart, sin Hub), `providers/CrmPrpLeadProvider.ts` |
| Tipo | pública, **no indexada** (`robots: noindex, nofollow`) |
| Layout | `default`, pero **sin** botón de valoración ni modal precontractual (`isPrpPage`) |

## Propósito
Landing personal de un promotor/referidor (PRP): «Agenda tu valoración». El código PRP (`externalCode`) viaja oculto con cada lead para atribuirlo.

## Estructura
Dos columnas (55/45): izquierda fondo verde con título (`title` del PRP o «Agenda tu valoración») y nombre del referidor con mayúsculas normalizadas (`formatPersonName`, respeta mezcla mayúsculas/minúsculas); derecha «Déjanos tus datos» + formulario: *Nombres y apellidos*, *Teléfono*, *Ciudad*, *¿Qué cirugía te quieres realizar?* (campo libre con sugerencias `datalist` de los procedimientos de Hub), casilla de política de datos (PDF del CRM). Éxito: «¡Gracias, <nombre>!» con enlace al inicio. Esqueleto de carga (`aria-busy`) en navegación cliente.

## Reglas
* Validaciones cliente: nombre ≥3; teléfono 7–15 dígitos; ciudad y cirugía obligatorias; aceptación obligatoria.
* Contrato CRM: `nombres, telefono, direccion(=ciudad), name_surgery, state="No Contactada", origen="Formulario Web", code_prp, accept=1`; timeout 20 s; **éxito solo si el CRM devuelve JSON con `mensagge`/`message`**; 422 ⇒ validación; otros ⇒ error genérico.
* 404 (inexistente, inactivo, otro tenant) y 503 (Hub falla) ⇒ `error.vue`.

## Estados / verificación
Cargado (EJ), 404 (EJ), 503 (EJ), móvil (EJ). Envío al CRM **no ejecutado** (efecto real). Pruebas indirectas: `tests/about/pages.test.ts`; no hay prueba dedicada del proveedor [no encontrada]. Riesgo: la URL del CRM es pública en el bundle (`runtimeConfig.public`) y no hay *rate limit* propio (a diferencia de valoración/inscripción).
Administración: [A08](A08-micrositios-prp.md).

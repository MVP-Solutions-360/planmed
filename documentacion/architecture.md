# Arquitectura - Planmed

Este documento establece la arquitectura base del frontend de Planmed, destacando las reglas de aislamiento, la capa de servicios y las diferencias con los proyectos legacy.

## MODELO DE CAPAS

La aplicación sigue el modelo:

**UI (Componentes Vue) ↓ Service (Capa de Negocio) ↓ Provider (Capa de Datos/Red)**

Actualmente los servicios y proveedores implementados son:
- QuotationService -> MockQuotationProvider
- LeadService -> MockLeadProvider
- TrackingService -> LocalTrackingProvider

*Regla Estricta:* La capa de UI (Componentes, Páginas, Composables de vista) **no debe contener llamadas HTTP directas**. Todo comportamiento asíncrono o de negocio se debe abstraer a través del Service.

## DESACOPLAMIENTO DE WELLEZY HUB

Actualmente Planmed opera **completamente desacoplado de Wellezy Hub**.
No se debe utilizar ni configurar como parte de la arquitectura actual de Planmed:
- X-Wellezy-Tenant
- 	enantSlug para conexión CRM
- Endpoints de Wellezy
- API de Wellezy
- Configuración CORS de Cliniplanes
- Dominios de Cliniplanes (ej. staging.cliniplanes.com)
- hub.wellezy.com

*Nota:* Si existen referencias legacy en código (por ejemplo en 
uxt.config.ts o comentarios en LeadForm.vue), estas deben considerarse estrictamente como deuda técnica (legacy) y no forman parte activa de la arquitectura Planmed.

## PROCEDIMIENTOS (DATA)

La fuente de verdad de los procedimientos es Wellezy Hub (tablas `cirugias` y `cirugia_linea`). No hay copia local.

- Público: `PublicProcedureService` → `/api/public/procedures*` (Nitro) → Hub `GET /api/v1/web/cirugias[/{slug}]`, con el tenant de `NUXT_WELLEZY_LINE_SLUG`.
- Administración: `ProcedureService` → `/api/admin/procedures*` (Nitro, Bearer de la sesión) → Hub `/api/cms/procedures`. Hub deriva empresa/línea del token.
- Las URLs de imágenes las genera el Hub a partir de su `APP_URL`; Planmed solo las reenvía.

**Revisión Pendiente (Legacy):**
El composable composables/useCatalogo.ts fue identificado como posible remanente legacy. Debe ser revisado posteriormente para comprobar si tiene consumidores activos y, de lo contrario, eliminarse.

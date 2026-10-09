# 06 — Auditoría separada: Preaprobado, formularios y pagos

**Estado: SOLO AUDITORÍA. Nada de esto debe implementarse todavía.** No se hicieron pagos, no se tocaron credenciales de pasarelas ni se cambiaron reglas de financiación.

## 1. Formulario de preaprobado de Planmed (`components/forms/LeadForm.vue`, `pages/simulador.vue`)

| Aspecto | Hallazgo [Código] |
|---|---|
| Campos | `full_name`, `phone`, `city`, `procedure`, `requested_amount`, `installments`, `email` (opcional), `comments` (opcional), `accepted_habeas_data` (checkbox) |
| Validaciones | Cliente: nombre, teléfono, ciudad, procedimiento, monto > 0, cuotas, habeas data obligatorios. Sin formato de teléfono/correo. |
| Payload construido | `first_name` (recibe el nombre completo), `phone`, `email`, `city`, `procedure_name`, `requested_amount`, `installments`, `comments` |
| Destino real | **Ninguno.** `LeadService` → `MockLeadProvider.submit` solo hace `console.log` y espera 1,5 s. El formulario muestra «éxito» aunque no se haya enviado nada. |
| Cotización | `MockQuotationProvider` (tasa 2 % mensual referencial; ver `business_rules.md`). **Regla de financiación: no se modifica.** |
| Tracking | `useTracking` → `LocalTrackingProvider` (solo consola). El contrato Hub `web-events` existe pero Planmed no lo usa. |
| WhatsApp | Constante `TBD_WHATSAPP_NUMBER` sin valor real; los teléfonos autorizados están en `business_rules.md` pero no se conectaron. |
| Aceptación precontractual | `PrecontractualModal` guarda `planmed_precontractual_v1` en `localStorage`; el código dice «FUTURO: registrar aceptación en CRM». No hay evidencia de aceptación en servidor. |

## 2. Contrato de Hub para leads [Código/Doc]

`POST /api/v1/leads` (`LeadController` → `LeadCaptureService`), `throttle:60,1`. Validación (`StoreLeadCaptureRequest`): `first_name` (req.), `last_name`, `phone` (req.), `email`, `city`, UTM y `landing_page`, `referrer`, **`procedure_name` (req.)**, `requested_amount`, `installments`, `metadata` (array), `linea_slug` (`exists:lineas,slug`), `cirugia_id`, `visitor_uuid`. Crea/actualiza el lead por `company_id + phone`, registra `LeadRequest`, evita duplicados en 5 min, notifica y crea tarea [Doc: plan 2026-09-30].
Tenant: el contrato legado usa `X-Wellezy-Tenant`; el cuerpo admite `linea_slug`. **[No verificado]** cuál de los dos identifica empresa/línea hoy en `LeadController` — leer el controlador antes de integrar.
No hay campo «referido por» ni relación paciente↔valoración en `leads` [Doc].

## 3. CRM receptor

- Hub (`/api/v1/leads`): existe y es el candidato natural, pero **no está decidido** que sea el receptor de Planmed [Decisión]. El formulario PRP de Planmed envía a **otro CRM** (`pdtclientsolutions.com/crm-public/api/forms-px-prp`, multipart, campos `nombres, telefono, direccion, name_surgery, state='No Contactada', origen='Formulario Web', code_prp, accept=1`).
- Crediestética envía a Hub (`/api/v1/leads` + `/api/v1/web-events`, tenant `crediestetica`) [Doc].

## 4. Pagos (valoración) — estado

- ADR de Hub (`wellezy-hub-wompi`, rama `feature/pagos-wompi`, base `f42dca1`, 2026-10-09): **«Propuesta, pendiente de revisión y aprobación. No hay nada implementado.»** Módulo `Valoracion` y `OnlinePayment` propuestos; webhooks de Wompi como confirmación; una cuenta Wompi por línea.
- Hechos del código de Hub relevantes (del ADR, [Doc]): `Linea.company_id` es nullable; el slug de línea no se asigna desde la UI; `clients` sin unicidad `(document_type, document_number)`; no existe tabla de `Payment`.
- **Regla obligatoria:** un retorno del navegador desde el checkout **no confirma** el pago; solo el webhook verificado de Wompi (o consulta server-to-server) lo hace.
- Existe otra sesión de trabajo («Integracion Wompi») sobre esto. Coordinar con ella; no duplicar.

## 5. Relación pacientes ↔ valoraciones (según el diseño propuesto)

Un `Client` puede tener varias valoraciones; la valoración no es lead, ni solicitud de financiación, ni cirugía; el valor se congela al crearla. Todo **[Propuesta]**, no implementado.

## 6. Preguntas de negocio / técnicas que bloquean

1. ¿Qué CRM recibe el preaprobado de Planmed: Hub `/v1/leads` o el CRM externo del PRP?
2. ¿Preaprobado y valoración pagada son el mismo flujo o dos? (El ADR dice que no son lo mismo.)
3. Mapeo de campos del formulario (nombre completo vs. `first_name`/`last_name`, ciudad, procedimiento texto libre vs. `cirugia_id`).
4. Dónde y cómo registrar la aceptación precontractual y habeas data (hoy solo `localStorage`).
5. Número de WhatsApp oficial para el botón.
6. Aprobar o ajustar el ADR de pagos; cuentas Wompi por línea; entorno de pruebas (sandbox) autorizado.

## 7. Pruebas requeridas antes de implementar
Envío real contra Hub **local** con tenant de pruebas; duplicados en 5 min; error 422 propagado; estados de red; verificación de firma del webhook con payloads de sandbox; idempotencia; confirmación solo por webhook.

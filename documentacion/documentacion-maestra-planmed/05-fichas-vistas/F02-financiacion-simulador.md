# F02 · Financiación y simulador (`/financiacion`, `/simulador`)

[← Inventario](../02-inventario-completo-vistas.md) · Capturas: `CAPTURAS/publico/desktop__financiacion.png`, `movil__financiacion.png`, `desktop__estado-simulador.png`

## Identificación
| Campo | Valor |
|---|---|
| Vista | Financiación (contenido + simulador de cuota + FAQ + contacto) |
| URL | `/financiacion` (ancla `#calculadora`; query opcional `?procedureId=<slug>` preselecciona procedimiento). `/simulador` → **301** a `/financiacion` (`routeRules`) |
| Tipo | Pública |
| Archivos | `pages/financiacion.vue`, `components/simulator/SimulatorPanel.vue`, `composables/useSimulator.ts`, `components/forms/LeadForm.vue`, `components/about/{FaqAccordion,ContactSection}.vue`, `components/site/PageShell.vue` |
| Datos | `shared/utils/financing.ts` (fórmula), `shared/utils/financingSeo.ts` (SEO/JSON-LD), `services/QuotationService.ts` → `providers/MockQuotationProvider.ts`, `services/FinancingRateService.ts`, `GET /api/public/financing-rate`, `GET /api/public/about` |
| Layout | `default`; `SitePageShell` con `bare` (secciones de ancho completo alternando blanco / verde) |
| Protección | ninguna |

## Propósito y comportamiento
Explicar el proceso de financiación (4 pasos), los documentos requeridos y ofrecer un **simulador de cuota referencial**. La cuota se calcula en el navegador con la **tasa mensual configurada en el panel** (`/admin/configuracion`, pestaña Tasa de usura); no existe tasa de respaldo: si `GET /api/public/financing-rate` falla (503 `rate_unavailable`) el panel de resultado muestra «no disponible» con botón *Reintentar* y **ninguna cuota** (`data-testid="simulator-unavailable"`).

## Estructura visual
1. Cabecera `PageShell` verde: H1 `FINANCING_TITLE`, subtítulo y botón dorado **Simula tu financiación** (`#calculadora`, `data-testid="go-to-simulator"`).
2. **Cómo lo hacemos** (fondo blanco): 4 pasos numerados 01–04 — Asesoría, Estudio, Pre aprobación, Desembolso — con icono y texto.
3. **Qué necesitas** (verde): 3 tarjetas — Cédula de ciudadanía, Carta laboral (antigüedad mínima 1 año), Colillas de pago (3 últimas).
4. **¿Cómo financiamos?**: video de YouTube incrustado (`youtube-nocookie`).
5. **Simula tu financiación** (verde, `#calculadora`): 3 beneficios (Planes flexibles, Seguro y confiable, Asesor personal) y debajo (blanco) el **panel del simulador** dentro de `<ClientOnly>` con *fallback* esqueleto:
   * Columna izquierda «Calcula tu plan de pago»: selector **Procedimiento** (lista pública de Hub), selector **Ciudad de operación** (Medellín, Cali, Barranquilla, Por Definir), campo **Monto a financiar** (formato COP) + deslizador de **$1M a $100M**, botones de **Plazo** (12, 18, 24, 36, 48, 60, 72 meses).
   * Columna derecha (verde): «CUOTA ESTIMADA» — cuota mensual aproximada, total a financiar, plazo, aviso con la tasa mensual aplicada y la leyenda de tasa de usura, y botón dorado **SOLICITAR FINANCIACIÓN** (abre `LeadForm`). Texto de apoyo sobre centrales de riesgo.
6. **Preguntas frecuentes** (verde, si hay FAQs activas): `AboutFaqAccordion` con las FAQs de «Nosotros».
7. `AboutContactSection` con el contacto administrado.

## Datos y lógica
| Dato | Origen | Regla |
|---|---|---|
| Procedimientos del selector | `useAsyncData('procedures')` → Hub | por defecto el primero, o el de `?procedureId=` si existe en la lista |
| Tasa | `/api/public/financing-rate` | `{rate:"2.0000", updatedAt}`; formato texto de 4 decimales; validada `0 < r ≤ 5 %` |
| Cuota | `buildFinancingQuote` | `PMT = P·r·(1+r)^n / ((1+r)^n − 1)`, **sin redondeo intermedio**; `formatPesos` solo presenta |
| Monto | `handleAmountBlur` | mínimo 1 000 000, máximo 100 000 000, paso 500 000 (redondeo al paso) |
| Recalculo | `watch([amount, months, procedure, city])` | *debounce* 400 ms; cancela la petición previa (`AbortController`) |
| Evento | `trackingService.track('SIMULATOR_CALC')` | solo `console.log` |
| JSON-LD / canonical / og | `financingStructuredData(origin, faqs)` | solo con lo que la página muestra |

### Formulario «Solicitar financiación» (`LeadForm`) — **simulado**
Modal con datos de solicitud (nombre, teléfono, ciudad, procedimiento, monto, cuotas — obligatorios), secciones plegables «Datos del tomador» y «Actividad económica» (documento, nacimiento, ocupación, vivienda, tipo de actividad, ingresos/egresos, contrato, propiedad/vehículo/reportado), comentarios y casilla de autorización (`/recursos`). **El envío usa `MockLeadProvider`: espera 1,5 s y escribe en la consola; no se almacena ni se envía a ningún sistema.** Tras «éxito» ofrece *Continuar en WhatsApp* con `WHATSAPP_NUMBER = 'TBD_WHATSAPP_NUMBER'` (**marcador sin configurar**: el enlace `wa.me/TBD_WHATSAPP_NUMBER` no funciona). [PARC]

## Interacciones
| Elemento | Acción | Resultado | Error | Verif. |
|---|---|---|---|---|
| Botón «Simula tu financiación» | clic | ancla a `#calculadora` | — | COD |
| Procedimiento / ciudad | cambiar | recotiza a los 400 ms | si falla la tasa: panel «no disponible» + Reintentar | COD/TEST (`tests/financing/*`) |
| Monto (input) | escribir/blur | normaliza a rango y paso | — | COD |
| Deslizador | arrastrar | actualiza monto | — | COD |
| Plazo (7 botones) | clic | `months = n` y recotiza | — | COD |
| SOLICITAR FINANCIACIÓN | clic | abre `LeadForm` con la cotización | validación por campo (mensajes en español) | COD |
| Enviar lead | clic | **mock**, éxito simulado | `errors.api` si el mock lanzara | COD |
| FAQ | clic / ↑ ↓ Inicio Fin | acordeón accesible | — | COD/TEST (`about/pages.test.ts`) |

## Estados
| Estado | Verificado |
|---|---|
| Cuota calculada con tasa 2.0000 % (Hub simulado, tasa de arranque) | EJ — `desktop__estado-simulador.png` (cuota $793.066 para $15M/24 m) |
| Cargando (esqueleto `animate-pulse`) | COD |
| Tasa no disponible | COD/TEST |
| Selector de procedimiento | **EJ: apareció vacío en la captura inmediata**; por código se asigna cuando llega la lista; revisar si es un parpadeo de carga o un defecto [ND] |
| Móvil | EJ (`movil__financiacion.png`) |
| Hub caído | La página responde 200; el selector queda sin opciones [COD] |

## Evidencias
Pruebas: `tests/financing/{quote,rate-store,service-fetch}.test.ts`, `tests/seo/financing.test.ts`, `tests/about/pages.test.ts` (todas ejecutadas, OK). Funciones: `calculateMonthlyPayment`, `parseFinancingRate`, `buildFinancingQuote`.
Limitaciones: el lead no persiste (mock); número de WhatsApp sin configurar; el ejemplo de la home es estático.

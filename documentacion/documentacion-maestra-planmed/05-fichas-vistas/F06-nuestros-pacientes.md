# F06 · Nuestros Pacientes (`/testimonios`, `/testimonios/antes-y-despues`, `/testimonios/programa-de-referidos`)

Capturas: `CAPTURAS/publico/{desktop,movil}__testimonios-videos.png`, `…__testimonios-antes-despues.png`, `…__testimonios-programa-referidos.png`, `desktop__estado-hub-caido__testimonios.png`.

## Identificación
| Ruta | Archivo | Muestra |
|---|---|---|
| `/testimonios` («Pacientes felices») | `pages/testimonios/index.vue` | Texto SEO + citas fijas + **videos de YouTube** |
| `/testimonios/antes-y-despues` | `…/antes-y-despues.vue` | **Casos antes/después** (2 fotos) + publicaciones de Instagram |
| `/testimonios/programa-de-referidos` | `…/programa-de-referidos.vue` | Contenido del programa (Hub o texto por defecto) + **formulario de inscripción** |

Tipo: pública; layout `default`. Componentes comunes: `TestimonialsNav` (pestañas Videos · Antes y después · Programa de referidos; oculta las que Hub marque como no visibles), `TestimonialsSocial` (redes de «Nosotros» + botón al simulador), `CommonHubUnavailable`.
Datos: `publicTestimonialsService.getContent()` → `GET /api/public/patient-section` → Hub `/v1/web/patient-section` (misma clave de caché `patient-section` que el menú de la barra → una sola petición por navegación).

## Reglas de negocio
* El Hub solo entrega lo **visible**: videos si `show_videos`, casos publicados con ambas imágenes, Instagram activo, programa de referidos.
* `visibility.videos=false` ⇒ el enlace desaparece del menú y de las pestañas; `/testimonios/antes-y-despues` con `beforeAfter=false` muestra el recuadro punteado «Esta sección no está disponible por el momento.».
* Programa de referidos: si `referral.content` vacío ⇒ `ReferralProgramContent` (texto estático de «Gana beneficios recomendando Plan Médico y Quirúrgico», números WhatsApp 315 785 7783).
* Hub caído: aviso con reintento (503 en SSR); el formulario de inscripción **no se muestra** (`v-if="loaded && !error"`).

## Formulario de inscripción PRP (`ReferralForm`)
Campos: nombre completo, WhatsApp/celular, correo, fecha de cirugía, cirugía practicada, tipo y número de documento (Cédula de ciudadanía, Tarjeta de identidad, Cédula de extranjería, Pasaporte, NIT…), ¿desea control? (Sí/No), forma de pago (Efectivo / Transferencia Bancaria Bancolombia → muestra titular, cédula, cuenta), sugerencia (≤1000), aceptación del contrato de remisión (obligatoria). Validación compartida `validateEnrollment` (navegador y servidor).
Envío: `POST /api/forms/prp-enrollment` → Hub `POST /v1/web/prp-enrollments`. Reglas: origen del mismo sitio, límite 6 por 10 min por IP, **clave de idempotencia HMAC** del payload, éxito `completed` (CRM confirmó) o `received` (guardado, pendiente). Datos bancarios se vacían al cambiar a efectivo y solo viven en memoria. Verif.: TEST (`tests/referral/referral.test.ts`), vista EJ; el envío real **no se ejecutó**.

## Interacciones
| Elemento | Resultado | Verif. |
|---|---|---|
| Pestañas | navegan entre las 3 rutas | EJ (visibles) |
| Video | iframe YouTube | COD |
| Instagram | `embed.js` | COD |
| Enviar inscripción | ver arriba; estados `submitting`, `completed`, `received`, `error`; conserva datos si falla | TEST |
| Redes | enlaces externos | COD |

## Estados
Cargado (EJ con Hub simulado: 1 video, 1 caso), vacío («Pronto compartiremos aquí los videos/resultados de nuestros pacientes.», recuadro punteado, COD), oculto por visibilidad (COD), 503 (EJ), móvil (EJ).

Evidencias: `tests/patients/{server,partial}.test.ts`, `tests/navigation/menus.test.ts`, `tests/referral/referral.test.ts`. Administración: [A04](A04-nuestros-pacientes.md).

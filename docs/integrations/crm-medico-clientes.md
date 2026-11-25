# Planmed → CRM Médico: registro de pacientes desde la valoración

Documento de referencia de esta integración. Si otro documento dice algo distinto sobre este envío, prevalece este.

## 1. Estado (2026-11-25)

| Aspecto | Estado |
|---|---|
| Obtención del formulario, sesión, token CSRF y envío | **Implementado** |
| Reconocimiento de la creación (`mensagge`) | **Implementado** |
| Pruebas | Solo con CRM simulado, incluido el servidor compilado |
| Contra el CRM real | Solo lecturas (`GET`) del formulario público. **Nunca se ha enviado un paciente** desde esta integración |
| Despliegue | Ninguno. Sin commit |

La integración **no está validada contra el CRM real** hasta que se haga un envío controlado y autorizado (sección 13).

Niveles de evidencia: **Formulario** (visto en el HTML público del CRM), **Observado** (visto en una solicitud o respuesta real), **Código** (decidido en este repositorio), **Sin confirmar**.

## 2. Flujo

La web original de Planmed incrusta en un `iframe` el formulario del CRM `https://pdtclientsolutions.com/crm-public/forms/73/16`. Planmed lo reproduce desde su servidor:

| Paso | Solicitud |
|---|---|
| 1 | Navegador → Planmed: `POST /api/forms/valuation` (JSON, mismo origen) |
| 2 | Planmed valida origen, límite, campos, duplicados y configuración; si algo falla, no contacta el CRM |
| 3 | Planmed → CRM: `GET …/crm-public/forms/{usuario}/{línea}` → cookies de sesión y `_token` |
| 4 | Planmed → CRM: `POST …/crm-public/api/clients/forms` multipart con esas cookies y ese token |
| 5 | Planmed interpreta la respuesta (sección 9) |
| 6 | Solo si el CRM confirma: correo complementario en segundo plano y `200 {ok:true}` |

| Pieza | Archivo |
|---|---|
| Formulario (sin cambios) | `components/forms/ValuationRequest.vue` |
| Llamada desde el navegador | `services/ValuationService.ts` |
| Validación compartida y formas de pago | `shared/utils/valuation.ts` |
| Ruta | `server/api/forms/valuation.post.ts` |
| Reglas, duplicados, respuestas y correo | `server/utils/valuation.ts` |
| Sesión, envío y traza | `server/utils/crmClient.ts` |

## 3. Sesión y CSRF

Comprobado con un `GET` al formulario público el 2026-11-25:

| Elemento | Detalle | Evidencia |
|---|---|---|
| Respuesta | `200`, `text/html`, sin autenticación | Formulario |
| Cookies | `XSRF-TOKEN` y `laravel_session` (`httponly`), `path=/`, `Max-Age=7200` | Formulario |
| Token | Campo oculto `<input type="hidden" name="_token">`, 40 caracteres | Formulario |
| Método simulado | Campo oculto `_method` = `post` | Formulario |
| Envío | AJAX (jQuery) a `{ruta}/api/clients/forms` con `FormData`; espera JSON y muestra `respuesta.mensagge`. Sin cabeceras CSRF adicionales ni configuración global en su script `funciones.js` | Formulario |

Cómo lo hace Planmed, **en cada envío**:

1. `GET` del formulario (`Accept: text/html`, sin cookies ni datos, sin seguir redirecciones, 15 s).
2. Exige estado `200`, al menos una cookie y un `_token` con forma válida. Reúne todas las cookies recibidas como `nombre=valor`.
3. `POST` con esas cookies, el token como primer campo y las cabeceras `Accept: application/json`, `Cookie`, `X-Requested-With: XMLHttpRequest`, `Origin` y `Referer` (las que envía un navegador en ese AJAX).

Cookies y token viven solo en memoria durante ese envío: no se guardan, no se comparten entre pacientes, no se registran y no llegan al navegador. No se usa `X-XSRF-TOKEN`: el formulario original tampoco lo envía.

Si el paso 1 o 2 falla, **no se envía ningún dato del paciente**: 503 `crm_session` y se puede reintentar.

`establish_zw`, observada en la web original, pertenece al reproductor de YouTube incrustado y no interviene.

## 4. Contrato de envío

| Elemento | Valor | Evidencia |
|---|---|---|
| URL | `https://pdtclientsolutions.com/crm-public/api/clients/forms` | Formulario y observado |
| Método | `POST` | Formulario y observado |
| Formato | `multipart/form-data` (`boundary` generado por `fetch`) | Formulario y observado |
| Redirecciones | No se siguen | Código |
| Tiempo máximo | 15 s por solicitud (hasta 30 s en total), sin reintentos | Código |
| Respuesta de éxito | `{"mensagge": "Los datos fueron registrados satisfactoriamente"}` | Observado |
| Código HTTP del éxito y respuestas de error | — | Sin confirmar |

## 5. Campos y correspondencia

En el orden del formulario original:

| Campo CRM | Origen en Planmed | Evidencia |
|---|---|---|
| `_token` | El del `GET` de ese mismo envío | Formulario |
| `_method` | Fijo `post` | Formulario |
| `nombres` | «Nombres», espacios normalizados | Formulario |
| `apellidos` | «Apellidos», espacios normalizados | Formulario |
| `identificacion` | «Número de cédula» | Formulario |
| `fecha_nacimiento` | «Fecha de nacimiento», `AAAA-MM-DD` | Formulario (campo `date`) |
| `direccion` | «Ciudad» | Formulario (rótulo «Ciudad») |
| `telefono` | «Teléfono», **solo dígitos**, sin añadir ni quitar indicativo | Formulario (campo `number`) |
| `email` | «Email» | Formulario |
| `name_surgery` | Nombre visible de la cirugía elegida (lista de Hub) | Formulario (texto libre) |
| `forma_pago` | «Financiación» → `Financiacion`; «Contado» → `Contado` | Sección 6 |
| `state` | Fijo `No Contactada` | Formulario (oculto) |
| `origen` | Fijo `Formulario Web` | Formulario (oculto) |
| `id_user` | Configuración, `73` | Formulario (oculto) |
| `id_line` | Configuración, `16` | Formulario (oculto) |
| `id_user_asesora` | Configuración, `73` | Formulario (oculto) |
| `accept` | Fijo `1`; sin aceptación no se envía | Formulario (casilla) |

**Validación previa en Planmed:** nombres, apellidos y ciudad de 2 a 100 caracteres; cédula de 5 a 20 letras o números; fecha real, no futura y desde 1900; teléfono de 7 a 15 dígitos; correo de hasta 150 caracteres; cirugía de hasta 150; forma de pago de la lista; aceptación obligatoria.

## 6. Forma de pago

En el formulario del CRM `forma_pago` es un **campo de texto libre** rotulado «Forma de pago (Contado/Financiación)»: el paciente escribe lo que quiera y se envía tal cual.

- `Financiacion` (sin tilde) es lo observado en una solicitud real.
- `Contado` es la otra opción que nombra el rótulo y se envía con esa escritura.

No se ha visto una solicitud real con «Contado» ni se conoce la validación del servidor del CRM; si lo rechazara, se vería como un 422 u otro error. Los valores están en `PAYMENT_OPTIONS`.

## 7. Identificadores

| Variable | Valor | Respaldo |
|---|---|---|
| `NUXT_CRM_FORM_USER_ID` | `73` | Campo oculto `id_user` del formulario público y URL `forms/73/16` |
| `NUXT_CRM_FORM_LINE_ID` | `16` | Campo oculto `id_line` y URL |
| `NUXT_CRM_FORM_ADVISOR_ID` | `73` | Campo oculto `id_user_asesora` |

Son los valores por defecto en `nuxt.config.ts`. La línea `12` pertenecía a la integración anterior con otro endpoint (`/api/chat/create/client`) y no se usa. El script del formulario declara además una variable `id_user = 69` que no se envía.

Si el CRM cambia los campos ocultos, hay que actualizar la configuración: Planmed no los lee del formulario.

## 8. Configuración

Solo servidor.

| Variable | `runtimeConfig` | Por defecto | Regla |
|---|---|---|---|
| `NUXT_CRM_FORM_URL` | `crmFormUrl` | vacío | **Obligatoria.** `https` (`http` solo en la propia máquina), terminada en `/api/clients/forms`, sin usuario, contraseña ni parámetros |
| `NUXT_CRM_FORM_USER_ID` | `crmFormUserId` | `73` | entero positivo |
| `NUXT_CRM_FORM_LINE_ID` | `crmFormLineId` | `16` | entero positivo |
| `NUXT_CRM_FORM_ADVISOR_ID` | `crmFormAdvisorId` | `73` | entero positivo |

- La dirección del formulario se deriva de la anterior: `…/api/clients/forms` → `…/forms/{usuario}/{línea}`.
- Falta o es inválido algo: 503 `not_configured`, sin ninguna petición; el log nombra las variables, nunca sus valores.
- Una variable de identificador definida y vacía invalida la configuración: omitirla.
- En local y en pruebas, `NUXT_CRM_FORM_URL` debe quedar vacía: la URL real crea pacientes reales.
- Ya no se leen `NUXT_CRM_CLIENT_*` ni `NUXT_CRM_VALUATION_URL`.

Correo complementario: `NUXT_VALUATION_TO/CC` y `NUXT_MAIL_*`. Sale solo después de que el CRM confirma; su fallo no cambia el resultado.

## 9. Respuestas y errores

| Caso | Estado / `motivo` | Respuesta de `/api/forms/valuation` | Bloquea reenvío |
|---|---|---|---|
| 2xx, objeto JSON cuyo `mensagge` empieza por «Los datos fueron registrados satisfactoriamente» (sin distinguir mayúsculas ni espacios repetidos) | `sent` / `confirmed` | 200 `{ok:true}` | 2 min |
| Formulario inaccesible (red o tiempo) | `failed` / `session_unreachable` | 503 `crm_session` | No |
| Formulario responde distinto de 200 | `failed` / `session_rejected` | 503 `crm_session` | No |
| Formulario sin token o sin cookies | `failed` / `session_invalid` | 503 `crm_session` | No |
| Otro 2xx (otro cuerpo, vacío, no JSON, incompleto) | `unknown` / `unconfirmed_response` | 502 `unconfirmed`, `uncertain` | 24 h |
| 3xx | `unknown` / `redirect_not_followed` | 502 `crm_error`, `uncertain` | 24 h |
| 422 | `failed` / `http_rejected` | 422 `crm_validation` | No |
| 408, 429 | `failed` / `http_retryable` | 502 `crm_error` | No |
| Otros 4xx (incluido 419) | `failed` / `http_rejected` | 502 `crm_error` | No |
| 5xx | `failed` / `http_server_error` | 502 `crm_error` | 24 h (pudo guardarse antes de fallar) |
| Envío sin conexión (`ECONNREFUSED`, `ENOTFOUND`, `EAI_AGAIN`) | `failed` / `no_connection` | 503 `network` | No |
| Tiempo agotado en el envío | `unknown` / `timeout` | 504 `timeout`, `uncertain` | 24 h |
| Conexión cortada u otro error sin respuesta | `unknown` / `no_response` | 503 `network`, `uncertain` | 24 h |
| Otro código | `unknown` / `http_other` | 502 `crm_error`, `uncertain` | 24 h |
| No se pudo armar el formulario | `failed` / `internal_error` | 500 `internal_error` | No |

Antes de contactar el CRM: 403 (origen), 429 `rate_limited`, 422 `validation`, 409 `duplicate`, 503 `not_configured`.

El 502 queda reservado para respuestas del CRM al envío; los fallos propios o de sesión usan 500 o 503. **Nunca hay reintentos automáticos**, ni del envío ni de la carga del formulario.

**Limitación: un 422 del CRM puede señalar un campo que no es la causa.** `crmFieldErrors` muestra bajo cada campo el primer mensaje del CRM para el campo del mismo nombre, tal como llega (texto de menos de 200 caracteres), además de «El registro no pudo validarse. Revisa los datos ingresados.».

- Un error sobre un valor que Planmed transforma (`forma_pago`, `telefono`) puede no ser corregible por el usuario.
- Un error sobre `id_user`, `id_line`, `id_user_asesora`, `state`, `origen` o `_token` no se asigna a ningún campo, pero el aviso general también pide revisar los datos.

## 10. Seguridad

- Mismo origen obligatorio en la ruta de Planmed (independiente del CSRF del CRM).
- 8 intentos cada 10 min por IP. Usa `X-Forwarded-For` sin aplicar `NUXT_TRUSTED_PROXY_HOPS`: el proxy debe controlar esa cabecera.
- Bloqueo de reenvío por huella SHA-256 de cédula y teléfono, sin guardar los datos. En memoria: se pierde al reiniciar y no se comparte entre instancias.
- No se registran datos personales, formulario, token, cookies, cuerpos, URL ni identificadores.
- Cookies y token solo van al mismo origen del destino configurado y no se siguen redirecciones.
- El destino no tiene valor por defecto y no es público. No hay credenciales del CRM en el código.

## 11. Pruebas

Todas con CRM y correo simulados.

```powershell
node --test tests/security/valuation.test.ts tests/security/crm-client-log.test.ts
```

| Archivo | Cubre |
|---|---|
| `tests/security/valuation.test.ts` | Campos y orden, formas de pago, teléfono, fecha, configuración, secuencia GET→POST, sesión por paciente, extracción de token y cookies, fallos de sesión, `mensagge`, 2xx ambiguo, 422, 419, 5xx, red, tiempos, error interno, duplicados, correo y logs sin datos |
| `tests/security/crm-client-log.test.ts` | Contra un servidor en `127.0.0.1`: GET y multipart reales con cookies y token, clasificación y traza sin datos |

### Última validación (2026-11-25, árbol sin commit sobre `cfb4306`)

| Validación | Resultado |
|---|---|
| Pruebas del CRM | 53 de 53 |
| `npm test` | 794: 769 pasan, 15 omitidas, 10 fallan |
| Los 10 fallos | Mismo nombre, ubicación y mensaje que en `cfb4306` sin estos cambios; ajenos a la valoración |
| `nuxt typecheck` y `nuxt build` | Correctos, en copia aislada sin `.env` y con la red externa bloqueada |
| Servidor compilado contra CRM simulado que sirve el HTML del formulario real (token ficticio) y exige sesión y token | Financiación y Contado `200`; repetido `409`; respuesta ambigua `502` y reintento `409`; sin datos ni token en logs |

## 12. Diagnóstico

Cada envío escribe una línea en el log del servidor (éxitos en la salida estándar, el resto en la de error):

```text
[valuation] crm-registro id=<uuid> clasificacion=confirmado motivo=confirmed http=200 duracion_ms=812 respuesta=json claves=mensagge
```

`clasificacion`: `confirmado`, `rechazado`, `incierto`. `respuesta`: `json`, `json_no_objeto`, `no_json`, `ilegible`, `sin_respuesta` (también en fallos de sesión). `claves`: solo nombres de primer nivel (máximo 20; `[omitida]` si repite un dato enviado o no parece un campo). En los motivos `session_*`, `http` es el código de la carga del formulario. Los errores añaden `[valuation] CRM: <estado> (<motivo>, HTTP <código>)`.

| Síntoma | Revisar |
|---|---|
| 503 `not_configured` | Línea «registro en el CRM no configurado (…)». No hay traza `crm-registro` |
| `session_unreachable` | Conectividad y DNS del servidor hacia el CRM |
| `session_rejected` | Que existan los identificadores en la URL `forms/{usuario}/{línea}`; estado del CRM; bloqueo o redirección |
| `session_invalid` | El formulario del CRM cambió (token o cookies): revisar su HTML |
| `http=419` | El CRM no aceptó sesión o token: revisar si cambiaron las cookies o el mecanismo |
| 502 `unconfirmed` | 2xx sin el `mensagge` esperado; ver `claves`. **No reenviar** sin comprobar en el CRM |
| `http=422` | Un campo o identificador rechazado (sección 9) |
| `http=5xx` en el envío | Fallo del CRM; comprobar si el paciente quedó antes de reenviar |
| 502 sin ninguna línea de Planmed | Viene del proxy o el proceso no respondió. El proxy debe esperar más de 30 s |
| 504 / 503 `network` | Tiempo o conectividad; con `uncertain`, comprobar en el CRM |

Nunca repetir un envío contra el CRM real para diagnosticar sin autorización.

## 13. Pendientes para darla por operativa

1. Commit, compilación y paquete nuevo (los anteriores usan otro contrato).
2. Definir `NUXT_CRM_FORM_URL` en el entorno donde se pruebe y retirar las variables antiguas.
3. Una prueba real controlada y autorizada: confirmar que la respuesta trae el `mensagge` esperado y que el paciente aparece en el CRM con la línea y la asesora correctas.
4. En esa u otra prueba, confirmar que «Contado» se acepta.

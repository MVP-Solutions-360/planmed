# Formulario de Estudio de Crédito (`CreditStudyForm`) — Planmed

> Documento técnico de referencia para una futura integración con el CRM. Proyecto: **Planmed** (`C:\Users\pdtco\Desktop\planmed\planmed-web`). Fecha de la revisión: 2026-11-13. Revisión de **solo lectura**: no se modificó código, no se enviaron formularios y no se llamó al CRM.
>
> Hermano: `docs/CREDIT_STUDY_FORM_INTEGRATION.md` (repositorio de Crediestética). Las secciones 3–8 y 10–11 contienen la misma información histórica en ambos documentos; si alguna vez difieren, la fuente de verdad del **contrato histórico** es la sección 6 de este documento y de su hermano, y deben corregirse juntos.


## Convenciones de este documento

Cada afirmación se etiqueta así: `[Código]` = verificado leyendo el repositorio; `[Dato recibido]` = información aportada en la tarea, **no reverificada** (no se llamó al CRM); `[Inferencia]` = deducción razonable, no comprobada; `[Pendiente]` = por confirmar. No se copió ningún token, credencial, dato personal real ni archivo privado.

## 1. Resumen ejecutivo

- Planmed tiene un formulario de 6 pasos llamado «Formulario de crédito paciente», en la ruta pública `/estudio-de-creditos`. `[Código]`
- **Hoy es una maqueta**: no valida, no guarda, no envía y no sube archivos. La propia página lo avisa con un cuadro ámbar permanente (`data-testid="credit-form-not-functional"`) y el botón «Guardar» solo muestra «Aún no es funcional: no se guardó ni se envió nada». `[Código]`
- No existen servicios, composables, stores ni rutas de servidor para este formulario en Planmed. `[Código]`
- Existe una **integración histórica** con el CRM médico (`POST multipart` a `https://pdtclientsolutions.com/crm-public/api/form/credit`, controlador `FormCreditController@store`). Una prueba sobre el formulario original de Planmed llegó al endpoint y devolvió **HTTP 500** por `id_line` `NULL`. **No hay registro exitoso comprobado.** `[Dato recibido]`
- `id_line = 30` está confirmado para Crediestética. `id_credit = 16` se observó en Planmed y **su compatibilidad con Crediestética no está confirmada**.
- **Decisión vigente:** la integración con el CRM queda **aplazada**; lo inmediato es el envío por correo electrónico (§9), que aún **no está implementado**.
- Limitación de esta documentación: el listado **completo** de campos del contrato histórico no se pudo recuperar de ningún repositorio (§6.1).

## 2. Arquitectura del formulario

### 2.1 Ubicación y ruta pública

| Elemento | Valor |
|---|---|
| Ruta pública | `/estudio-de-creditos` |
| Página | `pages/estudio-de-creditos.vue` (página estática; usa `SitePageShell title="Estudio de créditos" wide`) |
| Componente | `components/credit/CreditStudyForm.vue` (se autoimporta como `CreditStudyForm`) |
| Menú | El enlace «Estudio de créditos» está en el menú (`components/layout/Navbar.vue`). |
| SEO | `useSeoMeta` con título «Estudio de créditos \| Planmed» y canonical a partir de `useSiteConfig().url` |
| Administración | La página **no** se edita desde el panel de administración |

### 2.2 Componentes, servicios y estado relacionados

- **Un solo componente** autocontenido (`CreditStudyForm.vue`). Depende únicamente de `reactive` y `ref` de Vue.
- Estado local: `values` (objeto reactivo, solo para campos condicionales y totales), `current` (paso activo), `saveClicked`, `tabs`.
- **No hay** servicio, proveedor, composable, store, ni endpoint propio asociado. **No hay tests** que cubran este componente (solo pruebas de canonical y menú en otros archivos). `[Código]`
- Lógica de interfaz: campos condicionales (`showIf`, `enabledIf`), totales calculados de ingresos y egresos y navegación por pestañas con teclado.

### 2.3 Comportamiento del botón de envío, mensajes y estado real

| Elemento | Comportamiento actual `[Código]` |
|---|---|
| `<form>` | `novalidate`; `@submit.prevent="next"` → pulsar «Siguiente» (o Enter) solo avanza al paso siguiente |
| Botón «Siguiente» (pasos 1–5) | `type="submit"`; avanza de paso |
| Botón «Guardar» (paso 6) | `type="button"`; su único efecto es `saveClicked = true`, que muestra «Aún no es funcional: no se guardó ni se envió nada.» |
| Validaciones | **Ninguna.** El atributo `required` existe en algunos campos pero no se aplica (`novalidate` + submit desviado) |
| Mensaje de éxito | **No existe** |
| Mensaje de error | **No existe** |
| Petición de red | **Ninguna** |
| Estado real | **Maqueta sin funcionalidad** |

## 3. Inventario completo de campos del formulario actual


### 3.1 Estructura de pasos (idéntica en ambos proyectos)

El componente define 6 pasos (`steps`) como pestañas WAI-ARIA (`role="tablist"`, flechas, Inicio y Fin). `[Código]`

| # | Clave (`key`) | Etiqueta visible |
|---|---|---|
| 1 | `personal` | Información personal |
| 2 | `conyuge` | Información del cónyuge |
| 3 | `actividad` | Actividad económica y localización cliente |
| 4 | `referencias` | Referencias (familiares, personales, ¿reportado?, beneficiarios voluntarios póliza Sura) |
| 5 | `ingresos` | Relación de ingresos y egresos (incluye «Información del crédito solicitado») |
| 6 | `activos` | Relación de activos (bienes raíces y vehículo) |

### 3.2 Campos del formulario ACTUAL (identificadores internos `id`, NO son los nombres del CRM)

«Oblig.» = el campo se declaró con `r(...)` en el código (atributo HTML `required`). **Ese atributo no se aplica** porque el `<form>` tiene `novalidate` y el envío está desviado a «Siguiente» (ver §2.3). `[Código]`

**Paso 1 — `personal`**

| `id` | Etiqueta | Tipo | Oblig. |
|---|---|---|---|
| `primer-nombre` | Primer nombre | texto | Sí |
| `segundo-nombre` | Segundo nombre | texto | No |
| `primer-apellido` | Primer apellido | texto | Sí |
| `segundo-apellido` | Segundo apellido | texto | No |
| `tipo-documento` | Tipo de documento | lista (`TIPOS_DOC`) | Sí |
| `numero-documento` | N° documento de identidad | texto numérico | Sí |
| `lugar-expedicion` | Lugar de expedición | texto | Sí |
| `fecha-expedicion` | Fecha de expedición | fecha | Sí |
| `fecha-nacimiento` | Fecha de nacimiento | fecha | Sí |
| `lugar-nacimiento` | Lugar de nacimiento | texto | Sí |
| `sexo` | Sexo | lista (Femenino, Masculino) | Sí |
| `estado-civil` | Estado civil | lista (Soltero(a), Casado(a), Unión libre, Separado(a), Divorciado(a), Viudo(a)) | Sí |
| `nivel-educativo` | Nivel educativo | lista (Primaria … Posgrado) | Sí |
| `profesion` | Profesión / ocupación | texto | Sí |
| `personas-a-cargo` | N° de personas a cargo | número | Sí |
| `numero-hijos` | N° de hijos | número | Sí |
| `tipo-vivienda` | Tipo de vivienda | lista (Propia, Arrendada, Familiar) | Sí |
| `nombre-arrendador` | Nombre del arrendador | texto | Sí (aunque la vivienda sea propia: regla sin condicionar) |
| `telefono-arrendador` | Teléfono del arrendador | teléfono | Sí (ídem) |
| `peso` | Peso (kg) | número decimal | Sí |
| `estatura` | Estatura (cm) | número decimal | Sí |

**Paso 2 — `conyuge`** (todos con `enabledIf`: se habilitan solo si `estado-civil` es «Casado(a)» o «Unión libre»; si no, quedan deshabilitados con «n/a». Regla marcada «provisional, por confirmar» en pantalla.)

`cy-primer-nombre`, `cy-segundo-nombre`, `cy-primer-apellido`, `cy-segundo-apellido`, `cy-tipo-documento` (lista `TIPOS_DOC`), `cy-numero-documento`, `cy-tipo-actividad` (lista `TIPOS_ACTIVIDAD`), `cy-celular`, `cy-empresa`, `cy-cargo`, `cy-ingresos` (número). Todos declarados obligatorios (`r`) cuando están habilitados.

**Paso 3 — `actividad`**

| `id` | Etiqueta | Tipo | Oblig. |
|---|---|---|---|
| `dir-residencia` | Dirección de residencia | texto | Sí |
| `barrio-residencia` | Barrio / ciudad | texto | Sí |
| `tel-residencia` | Teléfono residencia | teléfono | Sí |
| `celular` | Celular | teléfono | Sí |
| `email` | E-mail | email | Sí |
| `envio-correspondencia` | Envío de correspondencia | lista (Residencia, Trabajo, Correo electrónico) | Sí |
| `dir-correspondencia` | Dirección (correspondencia) | texto | Sí |
| `barrio-correspondencia` | Barrio / ciudad (correspondencia) | texto | Sí |
| `tel-correspondencia` | Teléfono (correspondencia) | teléfono | No |
| `tipo-actividad` | Tipo de actividad económica | lista (Empleado, Independiente, Otro) | Sí |
| `archivo-carta-laboral` | Carta laboral | archivo | Sí; visible solo si `tipo-actividad` = Empleado |
| `archivo-colillas` | Colillas de pago | archivo | Sí; visible solo si Empleado |
| `archivo-rut` | RUT | archivo | Sí; visible solo si Independiente |
| `archivo-extractos` | Extractos bancarios | archivo | Sí; visible siempre (incluye el valor vacío) |
| `otra-actividad` | ¿Cuál? (otra actividad económica) | texto | No |
| `empresa` | Nombre de la empresa | texto | No |
| `dir-trabajo` | Dirección trabajo | texto | No |
| `barrio-trabajo` | Barrio / ciudad (trabajo) | texto | Sí |
| `tel-trabajo`, `ext-trabajo`, `fax-trabajo` | Teléfono / Ext / Fax (trabajo) | texto | No |
| `dependencia` | Dependencia / área | texto | No |
| `cargo` | Cargo | texto | No |
| `tipo-contrato` | Tipo de contrato | lista (Indefinido, Fijo, Prestación de servicios, Otro) | Sí |
| `fecha-vinculacion` | Fecha de vinculación | fecha | No |

**Paso 4 — `referencias`** (todos opcionales)

- Familiar 1 y 2 (`fam-1-*`, `fam-2-*`) y Personal 1 y 2 (`per-1-*`, `per-2-*`): cada una con `nombre`, `parentesco`, `tel-residencia`, `tel-oficina`, `celular`.
- `reportado` — «¿Está reportado?» (Sí/No).
- Beneficiarios voluntarios (póliza Sura), 4 filas `ben-1-*` … `ben-4-*`: `tipo` (lista `TIPOS_DOC`), `doc`, `nombre`, `pct` (%), `parentesco`.

**Paso 5 — `ingresos`** (todos opcionales)

- Ingresos mensuales: `ing-salario`, `ing-comisiones`, `ing-arrendamientos`, `ing-otros`, `ing-cuales`; `ing-total` es calculado (solo lectura, suma de los cuatro valores).
- Egresos mensuales: `egr-vivienda`, `egr-vehiculo`, `egr-tarjeta`, `egr-arriendo`, `egr-gastos`; `egr-total` calculado.
- Crédito solicitado: casillas `proc-{nombre}` para 12 procedimientos provisionales (Mamoplastia de aumento, Mastopexia, Mentoplastia, Ritidoplastia, Mamoplastia de reducción, Lipomoldeamiento, Blefaroplastia, Rinoplastia, Implantes glúteos, Abdominoplastia, Otoplastia, Otro) y `valor-cotizado`, `numero-cuotas`, `valor-financiar`, `fecha-cirugia`.

**Paso 6 — `activos`**

- Bienes raíces: `br-tipo` (lista; **obligatorio**), `br-direccion`, `br-barrio`, `br-ciudad`, `br-valor`, `br-hipoteca`, `br-afectacion` (Sí/No; **obligatorio**).
- Vehículo: `ve-tipo` (lista; **obligatorio**), `ve-placa`, `ve-transito`, `ve-marca`, `ve-modelo`, `ve-valor`, `ve-prenda`, `ve-otro`.

> Las listas de opciones son **provisionales** (el propio componente lo dice). No hay evidencia de que coincidan con los valores que acepta el CRM.


## 4. Inventario de archivos adjuntos

| Campo del formulario actual | Nombre histórico en el CRM `[Dato recibido en la tarea]` | Se muestra cuando | El código actual lo recoge | El código actual lo transmite |
|---|---|---|---|---|
| `archivo-carta-laboral` | `carta_laboral_file` | Tipo de actividad = Empleado | **No** | **No** |
| `archivo-colillas` | `colillas_pago_file` | Empleado | **No** | **No** |
| `archivo-rut` | `rut_file` | Independiente | **No** | **No** |
| `archivo-extractos` | `extractos_bancarios_file` | Siempre | **No** | **No** |

Hechos comprobados en el código (`<input type="file">` de `CreditStudyForm.vue`): `[Código]`

- Tipos de archivo: el atributo `accept` es `.pdf,image/png,image/jpeg`. Es solo una ayuda del selector del navegador; **no hay validación** en servidor ni en cliente.
- Tamaño máximo: **no está definido** en ningún sitio del código.
- El `<input type="file">` **no tiene `v-model`, ni `name`, ni manejador de cambio**, y no se construye ningún `FormData`: el archivo seleccionado no sale del navegador. El propio aviso de la pantalla lo confirma («los archivos que se seleccionen no se suben»).
- Tamaños y tipos aceptados por el CRM: **desconocidos** `[Pendiente]`.

## 5. Endpoints y servicios

| Elemento | Estado en Planmed `[Código]` |
|---|---|
| Endpoint propio de servidor para este formulario | **No existe** |
| Servicio / proveedor del lado cliente | **No existe** |
| Llamada al CRM (`form/credit` o cualquier otra) | **No existe** |
| Llamada a Wellezy Hub | **No existe** |
| Envío por correo | **No existe** (pendiente, §9) |

Contexto: los **otros** formularios de Planmed sí tienen rutas propias (p. ej. `server/api/forms/valuation.post.ts`, `server/api/forms/prp-enrollment.post.ts`); no tienen relación con este formulario y no deben tomarse como evidencia sobre él.


## 6. Contrato histórico del CRM

> Procedencia: información aportada por quien dirige la investigación en esta tarea (prueba de un envío histórico desde el formulario original de Planmed). **No se repitió ni se verificó en esta revisión**: no se llamó al endpoint. Cada dato se rotula `[Dato recibido]` (reportado, no reverificado) o `[Código]` (verificado en el repositorio).

| Elemento | Valor | Estado |
|---|---|---|
| Endpoint histórico | `https://pdtclientsolutions.com/crm-public/api/form/credit` | `[Dato recibido]` |
| Método | `POST` | `[Dato recibido]` |
| Formato | `multipart/form-data` | `[Dato recibido]` |
| Controlador en el CRM | `App\Http\Controllers\FormCreditController@store` | `[Dato recibido]` (aparece en la traza del error) |
| `id_credit` | `16`, observado en el formulario histórico de Planmed | `[Dato recibido]`. **Compatibilidad con Crediestética NO confirmada. No asumir que `id_credit = 16` está habilitado para `id_line = 30`.** |
| `id_line` | `30` = línea de Crediestética | Confirmado por el usuario. **Sin prueba posterior del endpoint con este valor.** |
| `id_line` de Planmed | Desconocido | `[Pendiente]` (no hay ningún valor de Planmed en el código del repositorio) |
| `_token` | El formulario histórico enviaba este campo | Se desconoce si es solo un token CSRF de sesión o hay un mecanismo para integraciones externas. **No se documenta ni conserva ningún valor de token.** |
| `id_form` | `16900` aparece en el SQL del error | Valor observado durante el intento **fallido**; **no** es la confirmación de un estudio registrado. |

Hechos sobre el repositorio `[Código]`: la cadena `form/credit` y los nombres de campo históricos **no aparecen en ningún archivo** del código de Crediestética, de Planmed ni del Hub (búsqueda de texto realizada en esta tarea). El endpoint `crm-public/api/clients/forms` (valoración) está bloqueado como «heredado» en `shared/utils/crmDestination.ts`; `form/credit` **no** figura en esa lista de bloqueo. Hoy ningún código envía a ninguno de los dos.

### 6.1 Nombres de campo históricos recuperados

Respetados **exactamente** como aparecen en la solicitud original, incluidos los errores tipográficos. **No se corrigen ni normalizan.**

Nombres citados textualmente en la tarea (los únicos que se pueden documentar sin inventar):

| Nombre histórico | Grupo probable (inferencia) |
|---|---|
| `adress_client` | Contacto y correspondencia |
| `city_worck_clirnt` | Información laboral |
| `oter_activity_client` | Actividad económica |
| `parentezco1` | Referencias |
| `phone_recidencia1` | Referencias |
| `valor_comercail` | Inmuebles o vehículos |
| `carta_laboral_file`, `colillas_pago_file`, `rut_file`, `extractos_bancarios_file` | Archivos adjuntos |
| `id_credit`, `id_line`, `id_form`, `_token` | Identificación del trámite / control |

**Importante — inventario incompleto.** La tarea pidió documentar *todos* los nombres de campo de la solicitud original, agrupados en 19 categorías (solicitante, identificación, información personal, cónyuge o codeudor, vivienda, contacto, actividad, laboral, ingresos, egresos, crédito solicitado, inmuebles, vehículos, otros activos, referencias familiares y personales, reportes, beneficiarios, archivos). **El listado completo de la solicitud original no está en ningún repositorio ni en el material al que tuve acceso**; solo se pudieron recuperar los nombres de la tabla anterior. Para no inventar nombres, **el resto queda pendiente**. Hay que tomarlos de la fuente original (captura de red del navegador / HAR de la prueba, o el controlador `FormCreditController@store` y su validación en el repositorio del CRM) y completar esta sección sin normalizar.

La columna «Grupo probable» es una **inferencia a partir del nombre**, no un dato del CRM.

### 6.2 Correspondencia con los campos del formulario actual

**No existe una correspondencia verificada** entre los `id` del formulario actual (§3.2) y los nombres históricos. Establecerla es parte de la futura integración con el CRM y requiere el listado completo de §6.1.

## 7. Evidencia de la prueba fallida `[Dato recibido]`

Prueba histórica sobre el formulario original de Planmed:

1. Se realizó **un** envío de prueba.
2. La solicitud **llegó** al endpoint identificado (método `POST`).
3. El CRM respondió **HTTP 500 Internal Server Error**.
4. Se ejecutó `FormCreditController@store`.
5. La base de datos produjo:

```
SQLSTATE[23000]: Integrity constraint violation: 1048 Column 'id_line' cannot be null
```

6. La excepción ocurrió al insertar en la tabla `form_credit_actividad_economica_address_client`.
7. La columna `id_line` recibió `NULL` aunque es obligatoria.
8. El SQL del error mostraba `id_form = 16900` (ver §6).

**Conclusión (limitada a lo comprobado):** el endpoint recibió la solicitud y procesó parte de la operación, pero **no se confirmó la creación exitosa del estudio de crédito**. **No es una integración funcional ni un registro exitoso.** No se repitió el envío ni se generaron registros adicionales. No se dispone de una respuesta de éxito: **no se documenta ninguna**.

## 8. Análisis del error

- `[Hecho]` El fallo es de integridad en base de datos del CRM (columna `id_line` obligatoria con `NULL`), no de transporte ni de ruta.
- `[Hecho]` Ocurrió en la inserción de la tabla `form_credit_actividad_economica_address_client`, por lo que existe algún efecto previo o posterior en otras tablas que **no se pudo determinar** (podrían existir filas parciales en el CRM por el envío de prueba: `[Pendiente de verificar con el responsable del CRM]`).
- `[Inferencia]` El formulario original probablemente no enviaba `id_line`, o lo enviaba con un nombre que el controlador no leyó. **No está comprobado qué nombre de campo espera el controlador para `id_line`.**
- `[Inferencia]` Que el CRM acepte `id_line = 30` junto con `id_credit` válido es la hipótesis de trabajo, **sin prueba**.
- `[Pendiente]` Si `id_credit` depende de la línea, si `16` es un registro de Planmed y qué `id_credit` corresponde a Crediestética.



## 9. Diferencias entre Planmed y Crediestética — comparación Planmed ↔ Crediestética

Comparación hecha leyendo ambos repositorios (`CreditStudyForm.vue` y `pages/estudio-de-creditos.vue`) y con una comparación textual del componente, normalizando los colores de marca. `[Código]`

| Aspecto | Resultado |
|---|---|
| ¿Comparten estructura de campos? | **Sí, idéntica**: mismos 6 pasos, mismos `id`, mismas obligatoriedades, mismas listas y mismos 4 campos de archivo |
| ¿Comparten componente? | **Sí**, es el mismo archivo copiado (`components/credit/CreditStudyForm.vue`). Tras normalizar los colores, la única línea distinta es un comentario («confirmarse con Planmed» / «con Crediestética») |
| Diferencias visuales | Paleta: Planmed `#0C2619`, `#D3A76A`, `#153a28`, `#e5e2e1`, `#fcf9f8`; Crediestética `#111111`, `#CBA36B`, `#333333`, `#E7DDD1`, `#F7F3EE` |
| Diferencias en la página | Crediestética pasa `image="/images/web/estudio_creditos.png"` a `SitePageShell`; Planmed no. Título SEO: «… \| Planmed» / «… \| Crediestética» |
| ¿Mismo endpoint histórico? | El endpoint histórico es del **formulario original de Planmed** `[Dato recibido]`. Ninguno de los dos repositorios contiene hoy código que lo llame. Que Crediestética pueda usarlo **no está confirmado** |
| Identificadores | `id_credit = 16` observado en Planmed, **sin confirmar** para Crediestética; `id_line = 30` es de Crediestética; el `id_line` de Planmed se desconoce |
| ¿Campos adicionales o faltantes? | Entre los dos formularios web: ninguno. Frente al contrato histórico: **no verificable** (falta el listado completo, §6.1) |
| ¿Archivos con el mismo tratamiento? | **Sí**: los 4 `<input type="file">` son idénticos (`accept=".pdf,image/png,image/jpeg"`, sin tamaño máximo, sin `name`, sin transmisión) |
| Destino por correo | Crediestética: definido; Planmed: no indicado |
| Reutilizable | Componente, pasos, `id`, validación futura y diseño de envío por servidor; deben **adaptarse por marca**: destinatarios, textos, identificadores del CRM (`id_line`, `id_credit`) y listas de opciones |

> Las configuraciones de Planmed **no** se consideran válidas para Crediestética sin confirmación. En particular, `id_credit = 16`.

**Documentación existente que hay que leer con cuidado.** Ambos repositorios tienen en `documentacion/` (documentación maestra y guías) frases como «Formulario de crédito paciente … CRM médico» y «maqueta». Esas guías son una copia heredada de Planmed también dentro del repositorio de Crediestética; **dicen «CRM médico» como destino previsto, pero ninguna documenta el endpoint, los campos ni la prueba fallida** (esa información solo existe aquí). Este documento no las modifica.

## 10. Estado actual y pendientes

**Conocido**

- Endpoint histórico, método `POST`, formato `multipart/form-data`, controlador del CRM.
- Nombres de campo citados en §6.1 y los cuatro nombres de archivo.
- `id_credit = 16` observado en Planmed; `id_line = 30` confirmado para Crediestética.
- Error de base de datos por `id_line` `NULL` (HTTP 500).
- El formulario web actual es una maqueta y no envía nada (§2.3).

**Pendiente de confirmación**

- Compatibilidad de `id_credit = 16` con `id_line = 30`.
- Mecanismo de autenticación para integraciones externas (`_token`).
- Reglas de validación del CRM y campos obligatorios.
- Tipos y tamaños de archivo aceptados.
- Forma de la respuesta de una operación exitosa y confirmación del registro en el CRM.
- Identificadores propios de Planmed (si difieren de los observados).
- Listado completo de nombres de campo de la solicitud original (§6.1).
- Estado de las filas parciales que pudo dejar la prueba fallida.



### 10.1 Prioridad actual: envío por correo electrónico

La integración con el CRM queda **aplazada**. La prioridad inmediata es poner en funcionamiento las páginas mediante **envío del formulario por correo electrónico**, según la configuración de cada marca. **Esta tarea no implementa nada de eso.**


Destino de correo para **Planmed**: **no fue indicado** en la tarea y no consta en el código `[Pendiente]`. No se asume el de Crediestética.


Requisitos de diseño para la implementación futura (recomendaciones, aún sin decisión técnica):

- Envío **desde el servidor**; las credenciales de correo van solo en variables de entorno del servidor, nunca en el código ni en `public` de Nuxt.
- Hoy el formulario no tiene ruta de servidor, ni subida de archivos, ni validación: hay que construirlas (validación de todos los campos, y de los 4 archivos: tipo real, tamaño máximo y cantidad).
- Información personal y financiera sensible (documentos de identidad, ingresos, extractos): no registrar el contenido en logs, limitar el tamaño del cuerpo, límite de peticiones por IP y comprobación de origen (como `assertSameOrigin` en las rutas de valoración y PRP).
- Cualquier decisión sobre qué hacer con los adjuntos (se envían por correo, se almacenan, se descartan) está **pendiente de definir**.

## 11. Procedimiento recomendado para retomar la integración con el CRM

La integración con el CRM queda **aplazada**. Cuando se retome, sin repetir el trabajo ya hecho:

1. **Recuperar la evidencia original** (HAR / captura de red de la prueba de Planmed) y completar §6.1 con todos los nombres de campo, sin normalizarlos.
2. **Pedir al responsable del CRM**: código del controlador `FormCreditController@store` y su validación; autenticación admitida para integraciones externas; `id_credit` e `id_line` que corresponden a cada marca; tipos y tamaños de archivo; forma de la respuesta de éxito.
3. **Confirmar con el responsable del CRM** si quedó alguna fila parcial de la prueba fallida.
4. Diseñar el envío **desde el servidor** (no desde el navegador), con la configuración del CRM por variables de entorno sin valores por defecto, igual que el formulario de valoración (`server/utils/valuation.ts`, `shared/utils/crmDestination.ts`), validando todo antes de llamar al CRM, sin reintentos automáticos (podrían duplicar el registro) y sin registrar datos personales.
5. Hacer **una** prueba autorizada, con datos ficticios y destino de pruebas del CRM, y documentar la respuesta real en este documento.
6. No dar el estudio por registrado salvo que el CRM devuelva una confirmación explícita (patrón ya usado: `crmChatConfirmed`).

## 12. Referencias a los archivos inspeccionados

**Código de Planmed** (`C:\Users\pdtco\Desktop\planmed\planmed-web`)

- `components/credit/CreditStudyForm.vue`
- `pages/estudio-de-creditos.vue`
- `components/layout/Navbar.vue:174` (enlace de menú)
- Búsquedas de texto sin resultado (para `form/credit`, `id_credit` y los nombres de campo históricos) en el repositorio completo, excluyendo `node_modules`, `.nuxt`, `.output*`, `.git`
- Documentación existente (solo lectura): `documentacion/guias/01-guia-pagina-publica.md`, `documentacion/documentacion-maestra-planmed/05-fichas-vistas/F03-paginas-informativas.md`, `documentacion/documentacion-maestra-planmed/06-componentes-compartidos.md`, `documentacion/documentacion-maestra-planmed/14-mapeo-planmed-crediestetica.md`

**Código del otro proyecto, solo para la comparación** (`C:\Users\pdtco\Desktop\crediestetica`)

- `components/credit/CreditStudyForm.vue`, `pages/estudio-de-creditos.vue`

**Referencias cruzadas** (otros formularios de Planmed, solo contexto de patrón de envío)

- `server/utils/valuation.ts`, `shared/utils/crmDestination.ts`, `shared/utils/valuation.ts` (patrón del formulario de valoración hacia el CRM médico)

## 13. Estado de implementación: envío por correo

Implementado (sin commit ni despliegue): `POST /api/forms/credit-study` (multipart: campos + 4 archivos; validación servidor con tipo real PDF/PNG/JPEG, 5 MB por archivo, 15 MB de archivos, 16 MB por petición; límite de 5 intentos/10 min/IP; sin duplicados en 10 min; sin almacenamiento de archivos). Código en `shared/utils/creditStudy.ts`, `server/utils/creditStudy.ts`, `server/api/forms/credit-study.post.ts`, `services/CreditStudyService.ts`. Pruebas: `tests/security/credit-study.test.ts`.

**Destinatarios (Planmed): PENDIENTES.** No se inventaron ni se reutilizaron los de Crediestética. Mientras `NUXT_CREDIT_STUDY_TO` esté vacío el envío permanece bloqueado (`503 not_configured`). El negocio debe indicar los destinatarios autorizados.

### Variables de entorno (solo servidor; nunca en `public`, Git ni `.env.example` con valores)

| Variable | Obligatoria | Descripción |
|---|---|---|
| `NUXT_MAIL_HOST` | Sí | Servidor SMTP |
| `NUXT_MAIL_PORT` | Sí | `465` (TLS implícito) o `587` (STARTTLS obligatorio) |
| `NUXT_MAIL_USERNAME` | Sí | Usuario SMTP |
| `NUXT_MAIL_PASSWORD` | Sí | Contraseña o contraseña de aplicación |
| `NUXT_MAIL_FROM_ADDRESS` | Si el usuario no es un correo | Remitente (debe pertenecer a la cuenta SMTP) |
| `NUXT_MAIL_FROM_NAME` | No | Nombre visible del remitente |
| `NUXT_CREDIT_STUDY_TO` / `NUXT_CREDIT_STUDY_CC` | Ver destinatarios | Direcciones separadas por coma (máx. 5) |

Sin configuración completa el endpoint responde `503 not_configured` y el formulario no confirma recepción.

### Instrucciones para el administrador (por entorno)

1. Crear o elegir la cuenta SMTP del dominio (Gmail exige contraseña de aplicación y que el remitente coincida con la cuenta).
2. Definir las variables anteriores en el entorno del servidor de ese ambiente (no en el repositorio).
3. Reconstruir el proyecto (`npm run build`) y reiniciar el proceso. Esta tarea no ejecutó despliegues ni reinicios.
4. Enviar una solicitud de prueba autorizada y confirmar con el buzón destino; el sistema solo confirma que el proveedor SMTP aceptó el mensaje, no la entrega en bandeja.
5. Limitación: el límite de intentos y la deduplicación están en memoria (una sola instancia).

El contrato histórico del CRM (secciones 6 a 8) no se modificó; la integración con el CRM sigue pospuesta.


## 14. Formularios: destino principal (Hub/CRM) y correo de respaldo

**Regla de negocio.** El correo **no sustituye** a Wellezy Hub ni al CRM médico. Donde ya existe una integración funcional, esa integración sigue siendo el destino principal y el único que confirma el registro; el correo es un respaldo complementario que sale **después** de la confirmación y **nunca** cambia su resultado. Solo donde un formulario no tenía ningún destino funcional, el correo es el mecanismo principal.

**Arquitectura.** Núcleo compartido `server/utils/formMail.ts`: transporte SMTP con TLS, validación de la configuración, límite de intentos, huella anti-duplicados, errores sin detalles del proveedor y plantilla con marca. Añade `notifyComplementary`, que envía el correo de respaldo tras la confirmación: **no lanza** (también captura los errores al leer la configuración de correo) y devuelve `sent` / `pending` / `skipped`. El flujo principal **no espera al SMTP**: Hub/CRM responden primero y el correo se envía en segundo plano; nunca se informa como enviado mientras solo esté pendiente. Si el SMTP falla, el envío queda en una cola de reintento **en memoria** (3 reintentos a 30 s, 2 min y 10 min; máximo 200 pendientes y 30 min de antigüedad; temporizadores `unref`). De un pendiente solo se conserva el **mensaje ya construido** (con los datos bancarios enmascarados), nunca el formulario completo; de un entregado, solo su clave y la hora (24 h, máximo 5000). La clave de cada registro (clave de idempotencia de Hub, o la huella de la valoración) evita repetir el correo **dentro de este proceso y de ese plazo**.

| Formulario | Destino principal | Correo | Asunto |
|---|---|---|---|
| Estudio de crédito (`CreditStudyForm`) | Correo (sin integración previa) | Principal | `[Marca] Nueva solicitud de estudio de crédito` |
| Solicitud de financiación (`LeadForm`) | Correo (sin integración previa) | Principal | `[Marca] Nuevo prospecto de financiación` |
| Programa de referidos (`ReferralForm`) | **Wellezy Hub** (`POST /api/forms/prp-enrollment` → `/v1/web/prp-enrollments`) | Complementario tras la confirmación de Hub | `[Marca] Nueva inscripción al programa de referidos` |
| Valoración (`ValuationRequest`) | **CRM médico** (`POST /api/forms/valuation`) | Complementario tras la confirmación del CRM | `[Marca] Nueva solicitud de valoración` |
| PRP de pacientes (`PrpLeadForm`, `/prp/[slug]`) | CRM PTD | **Sin cambios y fuera de alcance** | — |

### Referidos (no confundir con el PRP de pacientes)
`ReferralService` envía a `POST /api/forms/prp-enrollment` (Hub): validaciones, firma HMAC de la clave `Idempotency-Key`, estados `completed`/`received` y errores originales intactos. La pantalla de éxito solo aparece cuando Hub confirma. Tras la confirmación, `notifyReferralByEmail` envía el correo de respaldo; si falla, la inscripción sigue registrada en Hub, el usuario no ve ningún error y el envío queda pendiente de reintento. Si Hub falla no se envía correo ni se afirma que se registró. Reenviar el mismo formulario usa la misma clave: Hub no crea otra inscripción. El correo se evita repetir solo mientras este proceso lo recuerde (ver límites). `POST /api/forms/referral` **no registra nada ni llama a Hub**: solo reintenta el correo de una inscripción que Hub ya confirmó en este proceso (si no consta, responde 409 y no envía nada).

### Datos bancarios de referidos
Hub recibe los datos completos como antes. El correo solo lleva el titular y los **últimos 4 dígitos** del documento del titular y de la cuenta; el número completo no viaja por correo ni se registra.

### Límites conocidos del correo de respaldo (sin persistencia)
No hay base de datos, disco ni migraciones, así que **no se garantiza «exactamente una vez»** ni la entrega de un correo pendiente. La idempotencia de Hub/CRM es independiente: el registro principal nunca se duplica ni se pierde por el correo.
- **Reinicio de Node:** se pierden la cola de pendientes y el registro de entregados. Un correo pendiente no se recupera, y un reenvío del mismo formulario puede enviar otro correo.
- **Varias instancias:** cada una tiene su propia memoria. Un reintento (`POST /api/forms/referral`) en otra instancia responde 409, y un reenvío allí puede duplicar el correo; la instancia original puede además reintentar su pendiente.
- **SMTP caído:** tras 4 intentos (unos 12 minutos) el correo se abandona y solo queda un aviso en el log; un nuevo reenvío del usuario reinicia la cola.
- **Pasadas 24 h** de una entrega, un reenvío puede volver a enviarla.
- **Valoración:** el bloqueo de doble envío del CRM también es de memoria (2 minutos tras un registro confirmado, 24 horas tras un resultado incierto).
- Eliminar estos límites exigiría una bandeja de salida persistente (tabla/migración), que **requiere autorización**.

**Variables:** `NUXT_VALUATION_TO/CC` y `NUXT_REFERRAL_TO/CC` (destinatarios del respaldo; varias direcciones separadas por coma, máximo 5), `NUXT_CREDIT_STUDY_TO/CC`, `NUXT_LEAD_FORM_TO/CC` y las `NUXT_MAIL_*` comunes.

### Valoración en Planmed
Desde el 2026-11-25 la valoración registra **solo al cliente** en el CRM médico (`POST` JSON a `…/api/chat/create/client`, destino `NUXT_CRM_CLIENT_URL`); sustituye al envío anterior a `clients/forms`. Payload, criterio de confirmación y pendientes: `documentacion-maestra-planmed/07-modelo-datos-integraciones.md` §3.5. El correo es una notificación complementaria que sale solo después de que el CRM confirma y es el único que lleva la solicitud completa; si el CRM no confirma no se envía correo.

**Destinatarios (Planmed): PENDIENTES de confirmación.** Ninguno tiene valor por defecto ni se reutilizan los de Crediestética. Con `NUXT_VALUATION_TO` / `NUXT_REFERRAL_TO` vacíos el correo de respaldo simplemente no se envía y Hub/CRM siguen funcionando. Estudio de crédito y financiación (sin integración previa) quedan bloqueados (503) hasta definir `NUXT_CREDIT_STUDY_TO` y `NUXT_LEAD_FORM_TO`.

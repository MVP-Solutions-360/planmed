# Plan de implementación — Noticias y páginas de referido

**Estado:** borrador para revisión del equipo · **Fecha:** 30 de septiembre de 2026
**Alcance:** portal web Planmed (Nuxt 4 + Tailwind 4) y CRM Wellezy Hub (Laravel 13).

---

## 1. Qué se quiere construir

1. **Noticias (entradas).** Módulo básico para publicar noticias, editado por funcionarios desde el admin.
2. **Páginas de referido.** Una página por cada persona del PRP, creada por un funcionario desde el CRM. Solo cambia el título; el resto y el formulario son iguales. Cada envío entra al CRM como lead identificando quién refirió.

Decisiones ya tomadas con el equipo:

| Tema | Decisión |
| :--- | :--- |
| Páginas por persona | Exactamente una |
| Quién crea y edita la página | Funcionarios que trabajan con el CRM, no el usuario final |
| Formulario | Siempre el mismo (plantilla reutilizable): nombres y apellidos, teléfono, ciudad, cirugía que desea realizarse y aceptación de la política de datos |
| Destino del formulario | El CRM, como lead nuevo |
| Arquitectura | Portal en Nuxt/Vue/TypeScript; CRM en Laravel como API |
| Dominio de producción | `planmed.com.co` |
| Personalización de la página | Solo el título (por defecto "AGENDA TU VALORACION"); el resto, incluido el formulario, es igual |
| Noticias | Alcance inicial básico (título, portada y texto); el camino queda preparado para secciones tipo Elementor más adelante |
| Permanencia de los PRP | Los PRP son permanentes: no hay flujo de baja ni despublicación |
| Situación actual | Cada PRP tiene una entrada de WordPress en `planmed.com.co` con un título y una frase fijos, y un iframe al formulario del CRM con su código al final de la URL (`.../forms-px-prp/{código}`). La URL de la entrada lleva el nombre del PRP. Hay que replicarlo en el CRM |
| Identificación del PRP | El campo "Código PRP" del cliente es suficiente; todo PRP se guarda como `Client`, se haya operado o no |
| Persona vinculada | Afiliado al PRP (Programa de Revisión de Pacientes): paciente operado en las clínicas o persona que conoce el producto. Comparte su enlace y recibe un beneficio si el referido se opera |

---

## 2. Estado actual (lo que encontré en el código)

### Portal (`planmed-web`)

- Sigue la arquitectura **UI → Service → Provider**, con la regla de no hacer llamadas HTTP desde componentes (`documentacion/architecture.md`).
- Ya existe un admin en `/admin` con login, protegido por `middleware/admin-auth.global.ts`, y un CRUD de noticias y procedimientos.
- **Los providers activos son Mock**: `MockAuthProvider`, `MockLeadProvider`, `MockNewsProvider`, `LocalTrackingProvider` (solo hace `console.log`). El login acepta cualquier contraseña si el correo existe en la lista de prueba.
- El contenido de las noticias es HTML en un textarea, renderizado con `v-html` sin sanitizar (el propio código lo marca como pendiente).
- Ya hay componentes reutilizables, útiles si las noticias necesitan secciones: `CtaSection`, `TrustSection`, `ProcessSection`, `MedicalLeadershipSection`, `YouTubeEmbed`, `InstagramEmbed`.
- `LeadForm.vue` está pensado para el simulador (procedimiento, monto, cuotas); no es el formulario de referido.

### CRM (`wellezy-hub-2`)

- **Noticias:** ya existen `posts`, `post_sections` (contenido en JSON, con `type` y `order`) y `post_authors`, con estado (`draft/review/approved/published/internal`) y visibilidad. Hay API pública de solo lectura: `GET /api/posts` y `GET /api/posts/{slug}`. No revisé si hay pantalla de administración de posts ni endpoints de escritura.
- **Leads:** `POST /api/v1/leads` (`LeadController` → `LeadCaptureService`). Crea o actualiza el lead por `company_id + phone`, registra una `LeadRequest`, evita duplicados en 5 minutos, notifica y crea una tarea. Acepta UTM, `landing_page`, `referrer` y un campo `metadata` libre.
- **No existe ningún campo de "referido por"** en `leads`.
- **Persona vinculada / PRP:** no existe una tabla de "pacientes" en el CRM. Las personas se guardan en `clients` (modelo `Client`), que ya tiene el campo `contract_number`, etiquetado en pantalla como **"Código PRP / Contrato"** (`create-client.blade.php` y `show-client.blade.php`). `BmqPatient` existe, pero pertenece al dominio BMQ, que tiene aislamiento propio y no debe reutilizarse. `CompanyClientRelation` (relaciones con comercios y aliados) tampoco encaja: no representa a una persona que refiere.
- **Autenticación para APIs:** Laravel Sanctum. Ya hay un patrón de login por API en `PortalApiController` (BMQ) que se puede seguir.
- **Analítica:** `POST /api/v1/web-events` ya existe.

---

## 3. Puntos que hay que resolver antes de codificar

1. **Contradicción documental sobre la conexión con el CRM.** `architecture.md` dice que Planmed opera desacoplado de Wellezy Hub y prohíbe usar `X-Wellezy-Tenant` y los endpoints del CRM. Pero el endpoint de leads actual **exige** ese header, y el equipo indica que el portal ya se conecta al CRM. Hay que decidir cuál documento manda y actualizar `architecture.md` y `business_rules.md` en consecuencia. Mientras tanto, este plan asume que la conexión sí es válida.
2. **El código del portal no coincide con lo que me describiste.** Lo que vi usa providers Mock, no la conexión real. Puede que la conexión esté en otra rama o en un entorno distinto; conviene confirmarlo. Si solo existe en el CRM, la Fase 0 es el primer trabajo.
3. **`procedure_name` es obligatorio** en `StoreLeadCaptureRequest`. El formulario de referido pide la cirugía, pero sin asterisco (es opcional). Si queda vacía hay que enviar un valor por defecto (por ejemplo "Referido") o volver el campo opcional para este origen.
4. **Formulario de referido:** ya está definido (sección 4.2); la cirugía es texto libre.
5. **El "Código PRP" es `clients.contract_number`.** Se confirmó que los códigos como `J0YH` son los del PRP y que son los que se agregan al formulario. Pero hoy el campo es texto libre, la migración original no lo declara único (no revisé si una posterior lo hace) y la etiqueta "Código PRP / Contrato" indica que también guarda números de contrato. Antes de usarlo como identificador hay que comprobar con una consulta que no haya repetidos ni vacíos y, si todo está bien, agregar un índice único.
6. **El formulario y las páginas viven hoy en WordPress.** Abrí una página de PRP (`planmed.com.co/shirley-cristina-rendonagenda-tu-valoracion/`): es una **entrada** de WordPress (tipo `post`), no una página de Elementor, con un iframe a `pdtclientsolutions.com/crm-public/forms-px-prp/{código}`. No encontré esa ruta en el repositorio `wellezy-hub-2` (busqué en `app`, `routes`, `resources`, `database` y `config`), así que supongo que la sirve otro despliegue; no pude verificarlo. Hay que replicarla en este CRM y decidir la transición (sección 4.6). El dominio de producción será `planmed.com.co`, y `nuxt.config.ts` todavía dice `planmed.com` (`site.url` y `localDomain`): hay que actualizarlo.

---

## 4. Diseño propuesto

### 4.1 Páginas de referido

**Decisión: plantilla fija con un solo campo editable, el título.** Las páginas actuales (sección 4.6) son idénticas salvo el nombre en la URL y el código del formulario, y se confirmó que lo único que cambia un funcionario es el título (hoy "AGENDA TU VALORACION"). Por eso no hace falta un editor de bloques ni una librería de arrastrar y soltar. Si más adelante se necesita cambiar más cosas, se agrega un campo. Suposición: la frase de introducción también es fija.

**Tabla nueva `referral_pages` (CRM):**

| Campo | Notas |
| :--- | :--- |
| `id`, `uuid` | |
| `company_id` | Planmed; alcance por empresa, igual que `Lead` |
| `client_id` | FK a `clients`; único: una página por PRP |
| `code` | Segmento de la URL. Es el código PRP del cliente (`contract_number`, como `J0YH`), normalizado (sin espacios y en mayúsculas), para que los enlaces ya compartidos sigan funcionando. Único en esta tabla |
| `title` | Texto de máximo 150 caracteres; por defecto "AGENDA TU VALORACION" |
| `status` | `draft` / `published` |
| `published_at`, `created_by`, timestamps, soft deletes | |

**Contenido fijo de la página:** el título, la frase "Recibe toda la información sobre la cirugía que deseas, métodos de pago y financiación" y el formulario (sección 4.2), con la identidad visual de Planmed (`identidad_visual.md`).

**Por qué tabla nueva y no reutilizar `posts`:** una página de referido es 1 a 1 con una persona, tiene código propio y no usa procedimiento, autores ni fecha editorial. Mezclarla en `posts` obligaría a un discriminador y acoplaría dos ciclos de vida distintos. **Alternativa más pequeña:** dos columnas en `clients` (título y fecha de publicación) sin tabla nueva; en contra, `Client` es una identidad de holding sin alcance por empresa y la página es de Planmed. Como el CRM pide evolver lo existente antes de crear algo nuevo (`AGENTS.md`), queda como decisión a confirmar (pregunta 4).

**URL pública:** `planmed.com.co/r/{code}`. Usar un código en lugar del nombre evita exponer datos personales; aun así, los códigos cortos se pueden adivinar y no son un secreto (sección 6).

### 4.2 Formulario y atribución del referido

**Formulario** (según la imagen compartida, titulado "Registrar Paciente"):

| Campo en pantalla | Campo en `POST /api/v1/leads` |
| :--- | :--- |
| Nombres y apellidos * | `first_name` (nombre completo, como hace hoy `LeadForm.vue`) |
| Teléfono * | `phone` |
| Ciudad | `city` |
| ¿Qué cirugía se quiere realizar? | `procedure_name` (texto libre, máximo 150 caracteres; "Referido" si queda vacío) |
| Acepto la política de tratamiento de datos personales | `metadata.accepted_habeas_data` (debe marcarse para enviar) |
| (oculto) código del PRP | `referral_code` |

No pide correo; `email` es opcional en el CRM, así que no hay problema.

**Atribución:**

- El formulario envía `referral_code` junto con los demás campos a `POST /api/v1/leads`.
- El CRM **valida el código en el servidor** (debe existir, pertenecer a un cliente y tener la página publicada) y guarda en `leads`: `referred_by_client_id` (FK a `clients`, `nullOnDelete`) y `referral_code` (texto indexado, para conservar el histórico).
- **Regla de primera atribución:** `LeadCaptureService` hace `updateOrCreate` por teléfono. Si el lead ya existía con un referidor, **no se sobrescribe**. Aun así, cada envío guarda su `referral_code` en `lead_requests.metadata`, para no perder información.
- El `referral_code` también viaja en el payload de los `web-events` (vista de página, inicio y envío del formulario) para medir el embudo por referidor.
- Como la página es el propio formulario, no hace falta cookie para el caso base. Solo se necesitaría si la persona navega a otras páginas (por ejemplo el simulador) antes de dejar sus datos (pregunta 6).

### 4.3 Noticias

**Alcance inicial: básico** (título, portada y texto), dejando el camino preparado para secciones tipo Elementor más adelante.

- Reutilizar `posts` y `post_sections`; no crear un módulo paralelo.
- CRM: endpoints de escritura protegidos con `auth:sanctum` y permisos; mantener los públicos de lectura que ya existen.
- Portal: un `CrmNewsProvider` que implemente la interfaz `NewsProvider` existente y reemplace al mock.
- **Cómo queda preparado el camino:**
  - El cuerpo de la noticia se guarda como **una sección de tipo `text`** en `post_sections` (contenido JSON, por ejemplo `{ "html": "..." }`) y no en una columna aparte. La portada y el resumen siguen en los campos de `posts`.
  - El tipo `NewsArticle` del portal pasa de un `content` único a una lista ordenada `sections`, y el portal dibuja cada sección según su `type`. Hoy solo existe `text`; los tipos desconocidos se ignoran sin romper la página.
  - Agregar después otros tipos (la migración de `post_sections` anota `text`, `image`, `carousel`, `before_after` y `faq`) no exige cambiar la base de datos ni la API: solo el componente de esa sección y su editor.
  - Los embeds actuales (`youtubeUrl` e `instagramUrl`) se mantienen como están y pueden pasar a secciones de video e Instagram cuando se quiera.
  - El editor de secciones, con o sin librería de arrastrar y soltar, se evalúa cuando llegue esa fase.
- Sanitizar el HTML antes de mostrarlo (DOMPurify o equivalente) y definir un solo lugar donde se hace.

### 4.4 Dónde se administran las páginas

**Recomendación:** en el CRM (Livewire y Flux UI), porque solo hay un campo editable y así se evita construir un editor en el portal.

- En la ficha del cliente (`show-client`), un bloque "Página de referido", visible solo si el cliente tiene código PRP: crear la página, editar el título, publicar o despublicar, copiar el enlace y ver los leads referidos.
- Permisos propios del CRM (`hasPermission`, middleware `permission`; patrón de la migración `add_formularios_web_permissions`), no Spatie.
- El portal solo lee la página pública y muestra el formulario; para esto no necesita login de funcionarios.
- **Noticias:** siguen en el admin del portal (`/admin`), que hoy usa un login de prueba y debe autenticarse contra el CRM (Fases 0 y 1). Las secciones al estilo Elementor quedan para una fase posterior; el camino está preparado en la sección 4.3.
- Los roles del admin del portal (Administrador, Diseñador gráfico) deben mapearse a los permisos del CRM.

### 4.5 Beneficio o comisión del PRP (fuera del alcance inicial)

- Queda posible la cadena de trazabilidad: PRP (`Client`) → lead (`leads.referred_by_client_id`) → cliente del lead (`leads.client_id`) → solicitud o servicio. La columna `leads.client_id` existe; no verifiqué en qué momento se llena.
- El CRM tiene modelos de comisión (`CommissionScheme`, `CommissionRule`, `CommissionAllocation`), pero pertenecen a la nómina de empleados. No los usaría para pagar a un PRP sin una decisión explícita.
- Falta definir qué significa "se operó" (por ejemplo, una `Solicitud` en estado `PROCESADO` o un `Servicio` en estado `PAGADO`), cuánto se paga y quién lo aprueba. Este plan solo deja el dato de atribución listo para consultarlo.

### 4.6 Transición desde WordPress

**Cómo son hoy las páginas** (revisé una en el navegador integrado):

- Son **entradas de WordPress** (tipo `post`, categoría "blog") en `planmed.com.co`, no páginas armadas con Elementor.
- Todas repiten el título "AGENDA TU VALORACION" y una frase ("Recibe toda la información sobre la cirugía que deseas, métodos de pago y financiación"), más un iframe al formulario. Solo cambian la URL, que lleva el nombre del PRP pegado a "agenda-tu-valoracion", y el código del iframe (en la página revisada, `ZNV9`).
- Son públicas e indexables: no tienen `noindex`.
- La API pública de WordPress reporta 311 entradas publicadas en total y 184 que coinciden con "AGENDA TU VALORACION". Es una cifra aproximada de PRP con página, pendiente de confirmar; no cuenta borradores ni entradas privadas.

**Objetivo:** reemplazar las dos piezas: la página (plantilla fija con título editable) y el formulario (componente nativo en Vue que envía directo a la API, sin iframe, con mejor analítica y estilos).

**Migración automatizable:** como el dato está en contenido público y con formato uniforme, se puede leer la API de WordPress (o una exportación del sitio) y extraer de cada entrada su URL y el código del iframe. Con eso se arma una tabla `URL antigua → código PRP → cliente` que sirve para crear las páginas nuevas y para las redirecciones. Antes de crear nada hay que revisar los casos irregulares: entradas sin iframe, códigos repetidos y códigos que no existan en `clients`.

**Enlaces que ya circulan** (dos vías que no se excluyen):

- **a) Ruta de compatibilidad en el CRM:** una ruta pública por código equivalente a `/crm-public/forms-px-prp/{código}`, de modo que los iframes de WordPress existentes sigan funcionando hasta apagarlos. Requiere saber qué dominio la sirve y permitir el embebido desde el dominio de WordPress (cabeceras `X-Frame-Options` o `frame-ancestors` en la política de seguridad de contenido).
- **b) Redirección 301:** como `planmed.com.co` será el dominio definitivo, el portal nuevo puede atender las URL antiguas y redirigir cada una a `/r/{código}` con una tabla generada desde WordPress; conserva el posicionamiento. Está confirmado que el portal reemplaza por completo a WordPress en ese dominio.

Las páginas nuevas deben llevar `noindex` y no aparecer en el blog.

---

## 5. Fases

### Fase 0 — Conexión real con el CRM
- Resolver la contradicción documental (sección 3, punto 1) y actualizar la documentación.
- Reemplazar `MockAuthProvider` por un provider que haga login contra el CRM con Sanctum.
- Reemplazar `MockLeadProvider` por uno que envíe a `POST /api/v1/leads`.
- Reemplazar `LocalTrackingProvider` por uno que envíe a `POST /api/v1/web-events`.
- Configurar `.env` (URL del CRM y tenant) y CORS en el CRM para los dominios de Planmed. El documento `legacy/cors_config.md` describe el procedimiento, aunque sus dominios son de otro proyecto.

### Fase 1 — Noticias
- Endpoints de escritura de posts en el CRM, con permisos.
- `CrmNewsProvider` en el portal y ajuste del admin de noticias.
- Guardar el cuerpo como sección `text` y hacer que el portal dibuje una lista de secciones (sección 4.3).
- Subida de imágenes de portada (definir dónde se almacenan; el CRM tiene `MediaAsset`, pendiente de revisar).
- Sanitización del contenido.

### Fase 2 — Modelo de datos de referidos (CRM)
- Migración de `referral_pages`.
- Migración para agregar `referred_by_client_id` y `referral_code` a `leads`.
- Modelo, relación con `Client` y generación del código.
- Script de migración desde WordPress (sección 4.6): crear la página de cada PRP con su código y armar la tabla de redirecciones.
- Nuevos permisos, siguiendo el patrón de la migración `add_formularios_web_permissions`.

### Fase 3 — API de referidos (CRM)
- Público: obtener una página publicada por `code`, con `throttle`.
- La administración de páginas se hace desde Livewire en el CRM, sin endpoints (sección 4.4).
- Extender `StoreLeadCaptureRequest` y `LeadCaptureService` con `referral_code` y la regla de primera atribución.

### Fase 4 — Administración de páginas (CRM)
- Bloque "Página de referido" en la ficha del cliente: crear, editar título, publicar o despublicar y copiar enlace.
- Permisos nuevos y validación de que el cliente tenga código PRP único.

### Fase 5 — Página pública y formulario (portal)
- Ruta `/r/[code]` con render del lado del servidor y `noindex`.
- Actualizar `nuxt.config.ts` (`site.url` y `localDomain`) a `planmed.com.co`.
- Componente del formulario de referido, con aceptación de habeas data y eventos de analítica.
- Regla en `nuxt.config.ts` para `/r/**`.
- Ruta de compatibilidad en el CRM para los iframes actuales (opción a de la sección 4.6), si se decide conservarlos durante la transición.

### Fase 6 — Integración en el CRM
- En la ficha del PRP: lista de leads referidos.
- Filtro o columna de "referido por" en la lista de leads.
- Métricas básicas por referidor: visitas, formularios iniciados, leads.

### Fase 7 — Calidad y lanzamiento
- Pruebas del flujo completo: crear página, publicar, enviar formulario, verificar el lead y su atribución.
- Pruebas de seguridad: código inexistente o despublicado, título con scripts o caracteres especiales, abuso del endpoint.
- Revisión de contenido contra `business_rules.md`.

---

## 6. Seguridad y cumplimiento

- El código se valida siempre en el servidor (existe, pertenece a un cliente y la página está publicada); nunca confiar en un identificador enviado por el cliente. Los códigos son cortos y adivinables, así que no son un secreto: el riesgo real es el fraude (leads falsos para cobrar el beneficio), que se mitiga con límite de envíos, la regla antiautorreferido y revisión antes de pagar.
- La página pública solo expone páginas publicadas y su título; no muestra datos personales del PRP.
- El título se muestra como texto, nunca como HTML.
- Límite de envíos en el endpoint público (ya hay `throttle:60,1`; evaluar uno más estricto para el formulario).
- Consentimiento de tratamiento de datos obligatorio en el formulario, como ya hace `LeadForm.vue` (`accepted_habeas_data`).
- Regla antiautorreferido (recomendada, porque hay beneficio económico de por medio): marcar o descartar un lead cuyo teléfono coincida con el de la propia persona vinculada.
- Los editores de contenido deben conocer `business_rules.md` (no publicar mecánica interna de financiación ni prometer aprobaciones).

---

## 7. Convenciones que se deben respetar

**CRM** (`CLAUDE.md` y `AGENTS.md`):
- Modificar lo mínimo y reutilizar lo existente; no crear servicios, DTOs ni abstracciones sin necesidad demostrada.
- Documentación en español; archivos en UTF-8 sin BOM, con tildes y eñes correctas.
- Un `Lead` tiene alcance por empresa (`BelongsToCompany`); `Client` no. No mezclar ambas reglas.
- Ejecutar `vendor/bin/pint --dirty --format agent` tras modificar PHP. Los tests se ejecutan solo en los casos que indica `AGENTS.md`.

**Portal** (`architecture.md`):
- Sin llamadas HTTP desde componentes o páginas; todo pasa por Service → Provider.
- Las secciones del Home marcadas como baseline visual no se modifican.
- Paleta y tipografías de `identidad_visual.md`.

---

## 8. Riesgos

| Riesgo | Mitigación |
| :--- | :--- |
| El código PRP no es único o hay clientes sin código | Consulta previa y, si está limpio, índice único |
| Los enlaces antiguos dejan de funcionar al apagar WordPress | Tabla de redirecciones 301 generada desde la API de WordPress |
| Documentación y código en contradicción sobre la conexión al CRM | Resolverlo en la Fase 0 antes de construir encima |
| `procedure_name` obligatorio rompe el envío del formulario de referido | Valor por defecto o campo opcional para este origen |
| Un lead existente es reasignado a otro referidor | Regla de primera atribución, con histórico en `metadata` |
| Un funcionario publica contenido que incumple reglas de negocio | Plantilla con textos aprobados y guía editorial |

---

## 9. Decisiones y preguntas abiertas

### Decisiones tomadas

| # | Decisión |
| :-: | :--- |
| 1 | Persona vinculada = afiliado al PRP. Todo PRP se guarda como `Client`, se haya operado o no, y se identifica por su código PRP |
| 2 | El formulario tiene nombres y apellidos, teléfono, ciudad, cirugía (texto libre) y política de datos (sección 4.2) |
| 9 | La página es una plantilla fija: solo cambia el título. La frase de introducción y el formulario son iguales para todos |
| 10 | Los PRP son permanentes: no hay flujo de baja ni despublicación automática. El estado `draft` / `published` solo sirve para preparar una página antes de compartirla |
| 19 | El funcionario solo cambia el título |
| 20 | El dominio es `planmed.com.co` y el portal reemplaza por completo a WordPress |
| 21 | Noticias básicas ahora (título, portada y texto); Elementor se revisa después, con el camino preparado (sección 4.3) |

### Preguntas abiertas

Cada una trae mi suposición por defecto; si no hay objeción, sigo con ella.

| # | Pregunta | Suposición por defecto |
| :-: | :--- | :--- |
| 3 | Si la cirugía queda vacía en el formulario, ¿qué valor va en `procedure_name`? | "Referido" |
| 4 | ¿Tabla nueva `referral_pages` o dos columnas en `clients` (título y fecha de publicación)? | Tabla nueva |
| 5 | ¿Las páginas se administran en el CRM, desde la ficha del cliente? | Sí, en el CRM (Livewire) |
| 6 | ¿Cuánto dura la atribución si la persona navega a otra página antes de enviar? ¿Gana el primer o el último referidor? | Primer referidor, ventana de 30 días |
| 7 | ¿Las páginas de referido deben indexarse en buscadores? | No (`noindex`) |
| 8 | ¿Quién revisa o aprueba una página antes de publicarla? | El mismo funcionario que la crea |
| 11 | ¿Qué significa "se operó" para pagar el beneficio (estado de solicitud o de servicio)? | Se define en una fase posterior |
| 12 | ¿El beneficio es un monto fijo o un porcentaje, y quién lo aprueba? | Fuera del alcance inicial |
| 13 | ¿Los PRP se crean solo desde el CRM o también puede afiliarse la persona por su cuenta? | Solo desde el CRM, por funcionarios |
| 14 | ¿`pdtclientsolutions.com` es el mismo despliegue que este CRM (`wellezy-hub-2`) o es otro? | Se asume otro despliegue del mismo negocio; se replica en este repositorio |
| 15 | ¿Hay códigos PRP repetidos o clientes sin código hoy en `clients.contract_number`? | Se revisa con una consulta antes de crear el índice único |
| 16 | ¿Todas las entradas de WordPress que coinciden con "AGENDA TU VALORACION" (unas 184) son de PRP? | Sí, salvo las irregulares que detecte la revisión |
| 17 | ¿Cuál es el `slug` de la empresa Planmed en el CRM (el que va en `X-Wellezy-Tenant`) y su línea? | El de la empresa Planmed ya existente |
| 18 | ¿Se conservan temporalmente los iframes de WordPress (opción a de 4.6) o se redirige directamente (opción b)? | Redirigir cuando las páginas nuevas estén publicadas |

---

## 10. Límites de esta revisión

- Leí rutas, controladores, modelos y migraciones clave del CRM, y páginas, servicios, providers y documentación del portal. No leí `routes/web.php`, todas las pantallas Livewire ni las políticas de permisos.
- No ejecuté ni probé el código del CRM ni del portal; lo descrito sobre su estado sale de leerlo.
- Busqué "PRP" en `app`, `resources`, `database`, `routes` y `docs`: solo aparece como etiqueta del campo `contract_number`. No encontré una definición del programa ni de sus beneficios en el código.
- No pude abrir el formulario de `pdtclientsolutions.com` (la consulta falló por tiempo de espera), así que lo describo a partir de la imagen que compartiste y del iframe de la página de ejemplo.
- Que `pdtclientsolutions.com` sea otro despliegue y no este mismo CRM es una suposición mía; no pude verificarla.
- Abrí una página de PRP en el navegador integrado y consulté solo los conteos de la API pública de WordPress. No extraje nombres ni códigos de los demás PRP.

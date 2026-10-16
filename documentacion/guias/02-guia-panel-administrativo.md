# Tutorial del panel administrativo de Planmed

**Fecha:** 2026-10-13 · **Para quién:** el equipo que administra el contenido de la web (no hace falta saber programar).
**Complemento:** qué ve el visitante en cada página está en [`01-guia-pagina-publica.md`](01-guia-pagina-publica.md).

## 1. Antes de empezar

### 1.1 Cómo entrar
1. Abre `https://<tu-dominio>/admin/login` (o el botón **Iniciar sesión** de la barra superior de la web).
2. Escribe el correo y la contraseña de tu usuario de **Wellezy Hub**. No hay una cuenta aparte para la web.
3. Si todo está bien entras al panel (`/admin`). La sesión dura **8 horas**; después hay que volver a entrar.
4. **Cerrar sesión** está arriba a la derecha, junto a tu nombre y rol.

**Quién puede entrar:** solo usuarios cuyo rol principal está autorizado para el panel de Planmed (se configura en el servidor). Un usuario sin rol autorizado ve «No tienes acceso al panel administrativo de Planmed».

### 1.2 Permisos (importante)
- Casi todo el contenido se guarda en **Wellezy Hub**, y es el Hub quien decide qué puedes hacer (ver, crear, editar, eliminar) en cada módulo. Si el Hub te niega una acción, el panel lo avisa con un mensaje; pídele a quien administra el Hub que ajuste tus permisos.
- **Configuración**: la gestión de usuarios de la línea es solo para el **líder de la línea**; la **tasa de usura mensual** la pueden ver y cambiar el líder y la **diseñadora**.
- Los módulos propios de la web (**Nosotros** y **Clínicas aliadas**) solo exigen que sigas autorizado como usuario del panel; la web lo vuelve a comprobar con el Hub cada vez que guardas.

### 1.3 Recorrido por la pantalla
- **Menú lateral izquierdo (fijo):** no se mueve al desplazarte por la página. Grupos: *Dashboard* · *Contenido* (Procedimientos, Noticias, Nuestros Pacientes, Recomendaciones, **Nosotros ▾** con Nosotros y Clínicas aliadas, Micrositios) · *Administración* (Configuración, líder y diseñadora).
- **Barra superior:** tu nombre, rol y «Cerrar sesión».
- **Dashboard (`/admin`):** tarjetas que llevan a cada módulo.

### 1.4 Reglas comunes que conviene conocer
| Tema | Cómo funciona |
|---|---|
| **Guardar** | Los cambios no se aplican hasta pulsar el botón de guardar. Cada pantalla tiene su propio botón (a veces fijo abajo). |
| **Cambios sin guardar** | En «Nosotros» y «Clínicas aliadas» la pantalla avisa «Cambios sin guardar» y el navegador pregunta antes de salir. |
| **Errores** | Si algo falla, el mensaje aparece junto al botón y **tus cambios siguen en pantalla**. Puedes corregir y volver a guardar. |
| **Imágenes** | JPG, PNG o WebP. Se reducen y comprimen automáticamente antes de subirse (máximo 5 MB ya optimizada). |
| **Texto enriquecido** | Barra con: **N** negrita · **K** cursiva · H2/H3 títulos · listas con viñetas y numeradas · Enlace · salto de línea. Solo se permite ese formato; lo demás (scripts, estilos) se elimina por seguridad. |
| **YouTube** | Pega el enlace tal cual (`youtube.com/watch?v=…`, `youtu.be/…` o Shorts). No se aceptan códigos de inserción ni otros sitios. |
| **Publicar / ocultar** | Ocultar no borra: el contenido se conserva y puedes volver a publicarlo. |
| **Dos personas editando** | Si otra persona guardó mientras editabas «Nosotros» o «Clínicas», verás «Otra persona guardó cambios… Recarga la página». No se pisan los cambios. |

## 2. Qué se edita desde el panel (y qué no)

| Contenido público | Dónde se edita | Se guarda en |
|---|---|---|
| Procedimientos y destacados | **Procedimientos** | Hub |
| Noticias | **Noticias** | Hub |
| Videos, antes y después, Instagram y programa de referidos | **Nuestros Pacientes** | Hub |
| Páginas de recomendaciones y cuidados por procedimiento | **Recomendaciones** | Hub |
| Micrositios de referidores (PRP) | **Micrositios** | Hub |
| Página «Nosotros» (portada, institucional, video, FAQ, contacto) | **Nosotros → Nosotros** | Servidor de la web |
| Página «Clínicas aliadas» y la sección «Red médica aliada» del inicio | **Nosotros → Clínicas aliadas** | Servidor de la web |
| Preguntas frecuentes y contacto de *Financiación* y *Servicios* | Se editan en **Nosotros → Nosotros** | Servidor de la web |
| Quiénes somos, Servicios, Financiación, Estudio de créditos, Información precontractual, Política de datos, Recursos, Inicio | **No se editan en el panel**: están en el código; para cambiarlos hay que pedírselo a desarrollo | Código |

## 3. Módulo Procedimientos
**Ruta:** `Contenido → Procedimientos` (`/admin/procedimientos`).
**Acceso directo al Hub:** [Procedimientos](https://wellezyhub.com/cirugias) · [Crear procedimiento](https://wellezyhub.com/cirugias/create) (catálogo vigente del Hub; no uses `/procedimientos` del Hub, que es un módulo antiguo).

### 3.1 La lista
Tabla con **Procedimiento** (nombre y descripción corta), **Categoría**, **Estado** (Visible/Oculto y si es «Maestro» o propio), **Destacado** y **Acciones**.
- **Destacado (estrella):** al marcarlo, el procedimiento aparece en «Procedimientos destacados» del inicio.
- **Ojo (Acciones):** oculta o muestra el procedimiento en la web de Planmed.
- **Lápiz:** abre el detalle.
- **Nuevo Procedimiento:** crea uno propio de Planmed.

### 3.2 Procedimientos «maestros» y propios
- **Maestro (global):** viene del catálogo global del Hub (no pertenece a ninguna empresa ni línea). Su contenido **no se edita** desde Planmed; solo puedes **habilitarlo/deshabilitarlo** y **destacarlo** en tu línea. La pantalla lo avisa («Procedimiento maestro…»). Un maestro nuevo no se publica en ninguna web hasta que se habilita para la línea.
- **Propio:** pertenece a una empresa y una línea (las de tu sesión) y se edita completo.
- **Administración y publicación son distintas:** crear no implica que esté visible; debe estar activo y habilitado en la línea. Planmed no guarda una copia del catálogo: lo consulta en el Hub, y no se garantiza que un cambio se vea al instante en la web pública.
- **Desactivar no elimina:** el procedimiento se conserva y puede reactivarse.

### 3.3 Crear o editar un procedimiento propio
Secciones de la ficha:
1. **Información básica:** nombre*, slug (URL)*, categoría (slug de una categoría activa del Hub), descripción corta* y «¿Qué es?»* (con formato). Cambiar el slug cambia la URL pública; «Volver a automático» lo regenera desde el nombre.
2. **Ficha técnica:** tipo de anestesia, tiempo quirúrgico, tiempo de recuperación, cicatrización mínima.
3. **Perfil del paciente:** edad mínima y máxima, IMC máximo, condiciones médicas compatibles (con formato).
4. **Visibilidad:** «Procedimiento destacado».
5. **Imagen principal** (con «Descartar» si cambias de idea) y **galería** (+ Agregar; las imágenes con borde punteado se suben al guardar).
6. **SEO:** meta title y meta description (si los dejas vacíos se generan solos: «Nombre | Planmed»).
7. **Guardar** (los campos con * son obligatorios).

## 4. Módulo Noticias
**Ruta:** `Contenido → Noticias`.
**Acceso directo al Hub:** [Noticias](https://wellezyhub.com/posts/cms) · [Crear noticia](https://wellezyhub.com/posts/cms/create).
- **Lista:** filtro *Todos / Publicados / Borradores*; columnas Artículo, Estado, Fecha, Acciones (editar, eliminar). Eliminar pide confirmación y **no se puede deshacer**.
- **Nueva noticia / Editar:**
  1. **Información principal:** título*, slug* (si lo dejas vacío al crear se genera del título), extracto*, contenido editorial* (con formato).
  2. **Multimedia integrada:** URL de un post de Instagram y/o enlace de un video de YouTube (se muestran dentro de la noticia).
  3. **Visibilidad:** «Noticia publicada» (si está apagada queda en borrador) y **fecha de publicación**.
  4. **Portada** (formato horizontal 16:9 recomendado).
  5. **SEO:** meta title y meta description.
  6. **Guardar cambios.**

## 5. Módulo Nuestros Pacientes
**Ruta:** `Contenido → Nuestros Pacientes`. Una sola pantalla con **pestañas** y un botón **Guardar cambios** que guarda todo junto.
1. **Videos:** lista de videos de YouTube. Cada uno tiene *título (opcional)*, *enlace de YouTube** y un interruptor *Visible*. **+ Agregar video**.
2. **Antes y después:** casos con *título**, *descripción (opcional)*, **foto del antes** y **foto del después** (clic para subir) y *Publicado*. **+ Agregar caso**. Solo los casos publicados con ambas fotos aparecen en la web. Al final de esta pestaña están los **Videos de Instagram** (enlaces `instagram.com/reel/…` o `/p/…`, con **+ Agregar video de Instagram**), que salen debajo de la galería de antes y después.
3. **Programa de referidos:** *título de la página* y *contenido* (con formato). Si se deja vacío, la web muestra el contenido del programa que ya viene incluido.
- **Publicar/ocultar vistas:** «Videos» y «Antes y después» tienen un interruptor **Publicado / Oculto al público**. Ocultar quita la vista del sitio **y del menú**; el contenido se conserva. Recuerda guardar.

## 6. Módulo Recomendaciones
**Ruta:** `Contenido → Recomendaciones`. Dos zonas; **cada elemento se guarda por separado** (barra «Guardar» propia).

### 6.1 Páginas generales
Páginas que no dependen de un procedimiento (por ejemplo, cita de preanestesia).
1. **+ Agregar** crea una página nueva.
2. Elige una de la lista para editarla.
3. Campos: *título** · *video de YouTube (opcional)* · *imagen (opcional)* · *contenido* (con formato; usa listas para que aparezcan con los ✓ del diseño).
4. **Estado:** *Visible en la web* u *Oculta al público*. Guarda antes de publicar u ocultar. Una página nueva necesita contenido guardado para poder publicarse.
5. **Ver en la web ↗** abre la página pública; **Eliminar página** la borra definitivamente (el slug no cambia al editar).

### 6.2 Contenido por procedimiento
Para cada procedimiento se edita su texto de **Cuidados** y de **Cita de revisión**. Elige un procedimiento con el buscador y edita. Si lo dejas vacío, ese procedimiento no aparece en ese menú ni tiene página pública. Los procedimientos maestros muestran un aviso: su contenido global no se edita desde Planmed. Si ya existe una página vinculada a un procedimiento, el texto histórico queda en solo lectura.
- Si no se pudo consultar la lista de procedimientos o de páginas, la pantalla lo dice y **bloquea la edición** (con botón *Reintentar*) para no publicar nada equivocado.

## 7. Módulo Micrositios (referidores PRP)
**Ruta:** `Contenido → Micrositios`. Cada micrositio es una página `/prp/<slug>` para un referidor.
- **Lista:** filtro *Todos / Activos / Inactivos*; columnas Nombre, Código PRP, Enlace público, Título, Estado, Acciones; paginación Anterior/Siguiente.
- **Nuevo micrositio / Editar:** *nombre**, *código PRP** (el código del PRP en el **CRM médico**: se envía con cada formulario para atribuir el lead), *slug* (minúsculas, números y guiones; vacío = automático; **si lo cambias, el enlace ya compartido deja de funcionar**), *título* y *Micrositio activo* (inactivo = no disponible al público). Debajo ves el **enlace público** que se generará. **Guardar cambios.**

## 8. Módulo Nosotros (grupo del menú)
El menú **Nosotros ▾** tiene dos pantallas. Ambas se guardan en el servidor de la web (no en el Hub).

### 8.1 Nosotros → Nosotros (`/admin/nosotros`)
Pantalla por secciones; al final, barra fija con **Guardar cambios** (se activa al haber cambios).
1. **Portada:** título; **descripción de la imagen** (accesibilidad); imagen (botón *Cambiar imagen*, máximo 5 MB).
2. **Información institucional:** título institucional, descripción legal (con formato) y **tres párrafos** (con formato).
3. **Video institucional:** enlace de YouTube; se valida y muestra vista previa. Se guarda siempre en formato `youtube.com/watch?v=…`.
4. **Preguntas frecuentes:** **Agregar pregunta**; cada una tiene pregunta, respuesta (con formato), **Activa** (si se desactiva no se muestra), **Subir/Bajar** para ordenar y **Eliminar**. Una pregunta *activa* debe tener pregunta y respuesta. Estas preguntas también salen en *Servicios* y *Financiación*.
5. **Contacto:** dirección, edificio, ciudad, departamento y país, teléfono, correo, horario (con formato; vacío = no se muestra), enlaces de Instagram, Facebook y TikTok (deben ser enlaces https del perfil) y la casilla **Mostrar mapa** (se arma solo con dirección y ciudad; necesita ambos). Este contacto también sale en *Financiación*.
- **Validaciones:** los errores se marcan en rojo bajo cada campo y no deja guardar hasta corregirlos.

### 8.2 Nosotros → Clínicas aliadas (`/admin/paginas/clinicas-aliadas`)
Dos bloques, con **dos botones de guardado distintos**:
1. **Textos de la página:** título, subtítulo y contenido introductorio. Botón fijo **Guardar textos**.
2. **Clínicas:** botón **Agregar clínica** (la clínica nueva aparece **arriba** de las existentes, ya lista para escribir). Por cada clínica:
   - **Nombre*** y **descripción*** (con formato).
   - **Imagen principal*** (botón *Subir imagen / Cambiar imagen*; se sube de inmediato).
   - **Galería de imágenes (opcional):** *Agregar imágenes* (hasta 20; puedes quitar cada una con la ✕).
   - **Documentos o certificados:** pulsa **¿Agregar documentos?** y recién entonces aparecen los campos. Cada documento exige **título*** y **al menos un archivo*** (PDF, JPG, PNG o WebP; PDF hasta 10 MB; hasta 5 archivos por documento y 10 documentos por clínica). Si no agregas documentos, no se pide nada. *Quitar todos los documentos* vuelve a ocultar los campos.
   - **Subir / Bajar / Eliminar** la clínica (el orden de la lista es el orden en la web).
   - Botón **Guardar clínicas** al final: valida todo, guarda y borra del servidor los archivos que quitaste.
- **Dónde se ven:** en `/clinicas-aliadas` (tarjeta completa) y en la sección «Red médica aliada» del **inicio** (imagen + nombre, con enlace a su tarjeta). Mientras no haya ninguna clínica guardada, el inicio muestra los logos históricos.
- **Ojo:** los archivos se suben al instante; si subes y no guardas, quedan huérfanos en el servidor (no se muestran en la web).

> **Accesos directos al Hub.** El Hub es `https://wellezyhub.com`. Solo *Procedimientos*, *Noticias* y *Usuarios* tienen pantalla propia allí; *Nuestros Pacientes*, *Recomendaciones* y *Micrositios (PRP)* se guardan en el Hub pero **se editan únicamente desde este panel**. La pestaña «Guía del panel» muestra cada acceso en su módulo.

## 9. Módulo Configuración
**Ruta:** `Administración → Configuración` (líder de la línea y diseñadora). Tiene tres pestañas; la diseñadora solo ve *Tasa de usura* y *Guía del panel*. **Acceso directo al Hub:** [Usuarios](https://wellezyhub.com/users).
- **Tasa de usura:** muestra la **tasa de interés mensual vigente** del simulador (con la fecha y quién la cambió) y permite escribir una nueva: porcentaje mensual con **punto decimal** y hasta **cuatro decimales** (`2`, `2.12`, `2.0126`; mayor que 0 y hasta 5 %). Pide confirmación, valida en el servidor y guarda un historial. Se aplica tal cual al cálculo de la cuota en el simulador de `/financiacion` y en el formulario «Solicitar financiación». En el primer despliegue arranca en 2.0000 %. Se guarda en el servidor de la web (no en Wellezy Hub). Si dos personas editan a la vez, la segunda recibe un aviso y debe recargar.
- **Configuración (solo líder):** lista de **colaboradores de la línea** (solo lectura, tomada de Wellezy Hub): nombre (con la etiqueta *Líder* si corresponde), correo, rol y estado (Activo/Inactivo). Incluye búsqueda por nombre o correo, filtro por estado y paginación (15 por página). Se listan las personas **con usuario** cuya empresa y línea son las del usuario que inició sesión; en el entorno local son los IDs de la base local y, al pasar a producción, los de la base real, sin tocar la web. Activar/desactivar usuarios aún no está disponible desde el panel.
- **Guía del panel:** el contenido descrito abajo.

Un usuario que no es líder ni tiene el rol de diseño autorizado recibe un error 403 al entrar. La diseñadora no puede abrir la pestaña de colaboradores aunque cambie la URL: el servidor se lo niega.

La pestaña **Guía del panel** contiene: (1) *Dónde se guarda cada cosa*, con la tabla de qué módulos se actualizan en **Wellezy Hub** y cuáles viven **solo en la web** (y qué páginas están en el código); (2) *Cómo usar cada opción del panel*, un acordeón por módulo con pasos y advertencias; (3) *Reglas que valen para todo el panel*. Los datos de esa guía están en `utils/adminGuide.ts`: si cambia un módulo, actualízalo ahí y en este documento.

## 10. Tutorial paso a paso: casos frecuentes

**Publicar una noticia nueva**
1. Menú → Noticias → *Nueva Noticia*. 2. Escribe título, extracto y contenido. 3. Sube la portada. 4. Activa *Noticia publicada* y elige la fecha. 5. *Guardar cambios*. 6. Verifica en `/noticias`.

**Agregar una clínica aliada con certificado**
1. Menú → Nosotros → Clínicas aliadas. 2. *Agregar clínica*. 3. Nombre, descripción e imagen principal. 4. (Opcional) galería. 5. *¿Agregar documentos?* → título y archivo PDF. 6. *Guardar clínicas*. 7. Revisa `/clinicas-aliadas` y el inicio.

**Cambiar una pregunta frecuente**
1. Menú → Nosotros → Nosotros → sección *Preguntas frecuentes*. 2. Edita la respuesta (o desactívala). 3. *Guardar cambios*. El cambio se ve en Nosotros, Servicios y Financiación.

**Ocultar temporalmente «Antes y después»**
1. Nuestros Pacientes → pestaña *Antes y después*. 2. Apaga *Publicado*. 3. *Guardar cambios*. La vista y su opción del menú desaparecen; el contenido queda guardado.

**Crear el micrositio de un referidor**
1. Micrositios → *Nuevo Micrositio*. 2. Nombre y código PRP (del CRM médico). 3. Revisa el slug y el enlace público. 4. Deja *Micrositio activo*. 5. *Guardar cambios* y comparte el enlace.

## 11. Problemas frecuentes

| Mensaje o síntoma | Qué significa | Qué hacer |
|---|---|---|
| «No autenticado» / vuelve al login | La sesión venció (8 h) o se cerró | Entra de nuevo; si tenías cambios sin guardar, repítelos |
| «No tienes acceso…» o error 403 | Tu rol/permiso del Hub no permite la acción | Pide el permiso a quien administra el Hub |
| «Otra persona guardó cambios… Recarga» | Otro administrador guardó antes que tú | Recarga la página, revisa la versión actual y vuelve a aplicar tu cambio |
| «Revisa los datos ingresados» / campo en rojo | Falta un dato obligatorio o tiene formato inválido | Corrige el campo marcado |
| «Servicio no disponible» / botón Reintentar | El Hub no responde | Espera unos segundos y reintenta; tus cambios siguen en pantalla |
| «La imagen debe ser JPG, PNG o WebP…» | Archivo de tipo o peso no permitido | Usa otro formato o una imagen más liviana |
| Una página pública no refleja lo guardado | Estaba oculta/sin publicar, o falta el segundo paso (guardar) | Revisa *Publicado/Visible* y que hayas pulsado el botón de guardar correcto (en Clínicas hay dos) |

## 12. Notas para quien administra el servidor
- El contenido propio de la web (Nosotros, Clínicas aliadas, sus imágenes y documentos) vive en el directorio indicado por `NUXT_PLANMED_CONTENT_DIR` (por defecto `.data/planmed-content` junto a la aplicación). **Debe estar fuera de `.output/`** y ser persistente: un despliegue no debe reemplazarlo. Incluirlo en el **respaldo**. Cada guardado conserva el archivo anterior como `*.prev.json`.
- Los roles autorizados para entrar al panel se definen con `NUXT_PLANMED_ADMIN_ROLE_IDS`. La cookie de sesión (`planmed-admin`, 8 h) exige `NUXT_SESSION_PASSWORD` de al menos 32 caracteres.
- Las escrituras desde el navegador solo se aceptan si el origen coincide con el dominio del sitio (detrás de un proxy debe enviarse el encabezado `X-Forwarded-Host`).
- Más detalle técnico: `documentacion/maestra/` (arquitectura, persistencia, administración y permisos).

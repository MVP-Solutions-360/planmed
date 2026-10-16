# Guía de la página pública de Planmed

**Fecha:** 2026-10-13 · **Alcance:** cada vista pública de `planmed-web` (qué contenido tiene, de dónde sale, cómo funciona y en qué estado está).
**Complemento:** cómo se edita el contenido está en [`02-guia-panel-administrativo.md`](02-guia-panel-administrativo.md).

> Esta guía describe el código del repositorio a la fecha indicada. Los textos institucionales los entregó Planmed; los datos de contacto y redes salen de lo que el sitio ya publicaba. No se inventó ningún dato (horarios, mapa, clínicas).

## 1. Cómo está construida (resumen para entender el resto)

- **Framework:** Nuxt 4 con renderizado en servidor (SSR) sobre Nitro (servidor Node). Todas las páginas públicas se generan por petición; no hay `nuxt generate`.
- **De dónde sale el contenido** (hay tres orígenes):
  | Origen | Qué incluye | Quién lo edita |
  |---|---|---|
  | **Wellezy Hub** (CRM administrativo) | Procedimientos, noticias, «Nuestros pacientes» (videos, antes y después, programa de referidos), recomendaciones, micrositios de referidores (PRP) | Panel administrativo (los datos se guardan en el Hub) |
  | **Almacenamiento local de la web** (archivos JSON en el servidor) | «Nosotros», «Clínicas aliadas» (textos y clínicas, con sus imágenes y documentos) | Panel administrativo (no usa el Hub) |
  | **Código de la web** (contenido fijo) | Inicio, Quiénes somos, Servicios, Financiación, Estudio de créditos, Información precontractual, Política de datos, Recursos | Un desarrollador (no hay pantalla de edición) |
- **Hub caído:** las páginas que dependen del Hub muestran un aviso de «servicio no disponible» con botón «Reintentar» en lugar de fallar; el menú simplemente no muestra los submenús que necesita del Hub.
- **Wellezy Hub vs. CRM médico:** el Hub es el CRM **administrativo**; el CRM médico es otro sistema. Los formularios pendientes (§5) deberán conectarse al CRM médico, no al Hub.

## 2. Elementos comunes a todas las páginas

### 2.1 Barra de navegación (escritorio y móvil)
Orden: **INICIO · PROCEDIMIENTOS ▾ · NOTICIAS · PLANMED ▾ · NUESTROS PACIENTES ▾ · RECOMENDACIONES ▾ · [SIMULAR FINANCIACIÓN] · [INICIAR SESIÓN]**.

| Elemento | Qué hace |
|---|---|
| **PROCEDIMIENTOS ▾** | Desplegable con «Ver todos» y un enlace por procedimiento activo del Hub. Sin procedimientos (o Hub caído) queda como enlace simple a `/procedimientos`. |
| **PLANMED ▾** | Agrupa: Nosotros · ¿Quiénes somos? · Servicios · Clínicas aliadas · Estudio de créditos · Información precontractual y advertencias al consumidor · Políticas y protección de datos personales · Recursos. |
| **NUESTROS PACIENTES ▾** | Videos · Antes y después · Programa de referidos. «Videos» y «Antes y después» desaparecen si se ocultan desde el panel. |
| **RECOMENDACIONES ▾** | Se arma con las páginas de recomendaciones publicadas en el Hub y los procedimientos que tienen texto de «Cuidados» y «Cita de revisión». Si no hay nada publicado, el menú no se muestra. |
| **SIMULAR FINANCIACIÓN** | Lleva a `/financiacion#calculadora` (el simulador). |
| **INICIAR SESIÓN** | Lleva a `/admin/login` (panel administrativo). |

En pantallas menores a 1360 px aparece el botón de menú (hamburguesa): los desplegables pasan a acordeones y el menú tiene su propio scroll.

### 2.2 Pie de página
Descripción de Planmed («Financiamos directamente… desde el 50% hasta el 100% de su valor»), redes sociales (Instagram, Facebook, TikTok, WhatsApp y Messenger; YouTube está oculto temporalmente), y enlaces «Documentos legales» y «Sobre Planmed».

### 2.3 Botones flotantes
- **Chat (abajo a la derecha, círculo negro):** abre dos botones, WhatsApp (`573157857783`) y Messenger. Solo íconos; se cierra con clic fuera o Esc.
- **«Pide tu cita» (encima del chat):** abre la ventana «Pide tu cita de valoración» (formulario **maquetado, no funcional**; ver §5). No aparece en los micrositios `/prp/**`.

### 2.4 Aviso precontractual
Al entrar por primera vez se muestra una ventana «Información precontractual» que bloquea la página hasta aceptar (se recuerda en el navegador). Rechazar saca al visitante del sitio. No se muestra en `/prp/**`. Su texto es independiente del de la página `/informacion-precontractual` (ver §6, pendiente de unificar).

### 2.5 Página de error
Si una ruta no existe o hay un fallo, se muestra una página de error con la identidad de Planmed: «Ir al inicio», «Iniciar sesión»/«Ir al panel», «Reintentar» y «Volver atrás». En desarrollo muestra además el detalle técnico.

## 3. Vistas, una por una

### 3.1 Inicio — `/`
**Fuente:** contenido fijo + procedimientos destacados y clínicas desde la administración.
Secciones, en orden:
1. **Portada:** «Tu próxima etapa empieza con un plan», botón *Simular financiación*, y una tarjeta «Ejemplo de plan» ($10M de procedimiento, $8M a financiar, 48 meses) con nota de tasa referencial.
2. **Propuesta de valor:** «Financia tu procedimiento directamente» («Sin intermediarios innecesarios»).
3. **Procedimientos destacados:** tarjetas de los procedimientos marcados como destacados en el Hub + botón «Ver todos los procedimientos».
4. **El proceso:** tres pasos (Simulación y solicitud · Estudio de perfil · Aprobación y procedimiento) y botón *Iniciar tu plan*.
5. **Red médica aliada:** cuadrícula con las **clínicas administradas** (imagen principal + nombre, clicables hacia su tarjeta en `/clinicas-aliadas#<clínica>`). Mientras no haya clínicas guardadas en el panel, muestra los logos históricos sin enlace.

### 3.2 Procedimientos — `/procedimientos` y `/procedimientos/[slug]`
**Fuente:** Wellezy Hub (lista pública de la línea Planmed).
- **Listado:** «Nuestros procedimientos», una tarjeta por procedimiento (imagen, nombre, descripción corta, «Conocer más») y un bloque final «Diseña tu plan de pago» → *Ir al simulador*.
- **Detalle:** nombre, imagen principal, descripción corta y «¿Qué es?», ficha técnica (anestesia, tiempo quirúrgico, recuperación, cicatrización), perfil del paciente (edades, IMC, condiciones médicas compatibles), galería, aviso de que la viabilidad la determina un profesional certificado y botón **Simular financiación**, que abre el simulador con ese procedimiento ya seleccionado.
- Si un procedimiento está deshabilitado en la línea, no aparece.

### 3.3 Noticias — `/noticias` y `/noticias/[slug]`
**Fuente:** Wellezy Hub (solo noticias publicadas).
- **Listado:** «Noticias Planmed» con tarjetas (portada, título, extracto, «Leer más»).
- **Detalle:** portada, título, fecha, contenido con formato (títulos, listas, negrita, enlaces), y opcionalmente un video de YouTube y un post de Instagram incrustados. Botón «Volver a noticias».

### 3.4 Recursos — `/recursos`
**Fuente:** contenido fijo. Hoy solo dice «Próximamente encontrarás aquí los documentos y requisitos oficiales para tu proceso». *Pendiente de contenido.*

### 3.5 Nosotros — `/nosotros`
**Fuente:** almacenamiento local, **editable** en el panel (`Nosotros → Nosotros`).
1. **Portada:** título «NUESTRO EQUIPO» sobre una imagen corporativa.
2. **Información institucional:** título («Plan Médico y Quirúrgico S.A.S.»), descripción legal (Ley 1480 de 2011, Decreto 1368 de 2014, Superintendencia de Industria y Comercio) y tres párrafos descriptivos.
3. **Video institucional** de YouTube (solo con clic, sin autoplay).
4. **Preguntas frecuentes** (acordeón accesible por teclado): cinco preguntas iniciales; las inactivas no se muestran.
5. **Contacto:** dirección (Av. El Poblado #5A-113, Edificio One Plaza, Medellín, Antioquia), teléfono, correo, horario (vacío por ahora: no se muestra), redes y mapa (apagado por defecto; si se enciende se arma solo con la dirección guardada).

### 3.6 ¿Quiénes somos? — `/quienes-somos`
**Fuente:** contenido fijo (sin administración). Estructura: introducción «Una nueva forma de acceder a la cirugía plástica en Colombia» + primer video; «¿Qué es Planmed?» y «¿Por qué existe Planmed?»; «¿Qué hace diferente a Planmed?» junto a una publicación de Instagram incrustada; «Trabajo con clínicas y especialistas certificados» con segundo video; «Más que financiación: acompañamiento»; «¿A quién está dirigido?», «Una solución para dejar de posponer», «La importancia de tomar una decisión informada», «Empieza tu proceso con información, no con dinero» y el botón **Financia aquí** (WhatsApp); cierre «Da el primer paso hoy».

### 3.7 Servicios — `/servicios`
**Fuente:** contenido fijo + preguntas frecuentes compartidas con «Nosotros». «Asesoría y financiación de cirugía plástica estética» (con foto del equipo), video, «Casa de recuperación post quirúrgica» (con segundo video) y preguntas frecuentes.

### 3.8 Financiación (con simulador) — `/financiacion`
**Fuente:** contenido fijo + simulador + preguntas frecuentes y contacto compartidos con «Nosotros». Reemplaza a la antigua página `/simulador` (que ahora redirige aquí con código 301).
La página alterna fondos blanco/verde para marcar cada sección:
1. **Cabecera** «Financiación» con el botón **Simula tu financiación** (baja al simulador).
2. **Cómo lo hacemos** (blanco): Asesoría → Estudio → Pre aprobación → Desembolso.
3. **Qué necesitas** (verde): cédula de ciudadanía, carta laboral (antigüedad mínima de 1 año; no expedida con más de 1 mes) y últimas 3 colillas de pago.
4. **¿Cómo financiamos?** (blanco): video.
5. **Simula tu financiación** (verde): título y ventajas (Planes flexibles, Seguro y confiable, Asesor personal).
6. **Simulador** (blanco): elegir procedimiento, ciudad (Medellín, Cali, Barranquilla, Por definir), monto ($1 M a $100 M, de a $500 mil) y plazo (12, 18, 24, 36, 48, 60 o 72 meses). Muestra la **cuota mensual estimada**, el total a financiar y el plazo, y el botón *Solicitar financiación* que abre la ventana «Inicia tu proceso ahora».
   - ⚠ **Estado:** la cotización usa la **tasa de usura mensual configurada en el panel** (Configuración → Tasa de usura; arranca en 2 %) y, si no puede leerse, muestra «Simulación no disponible» en lugar de una cuota. La solicitud de la ventana **no se envía a ningún sistema** (solo se registra en la consola del navegador). La cuota es la fórmula exacta de cuota fija, sin redondeo a centenas. Ver §5.
7. **Preguntas frecuentes** (verde, acordeón sobre tarjeta blanca) y 8. **Contacto** (claro), los mismos de «Nosotros».
- Si se llega desde un procedimiento (`/financiacion?procedureId=…#calculadora`) el simulador abre con ese procedimiento elegido.

### 3.9 Clínicas aliadas — `/clinicas-aliadas`
**Fuente:** almacenamiento local, **editable** (`Nosotros → Clínicas aliadas`). Título, subtítulo y texto de introducción editables, y debajo una **tarjeta por clínica**: imagen principal, nombre, descripción, galería de imágenes (clic para ver en grande) y, si existen, documentos o certificados (título y archivos PDF o imagen). Cada tarjeta tiene un identificador para enlazarla desde el inicio (`/clinicas-aliadas#clinica-1`). Sin clínicas guardadas no se muestra la lista.

### 3.10 Estudio de créditos — `/estudio-de-creditos`
**Fuente:** contenido fijo. Contiene el **«Formulario de crédito paciente»** en seis pasos (Información personal · Información del cónyuge · Actividad económica y localización · Referencias y beneficiarios · Relación de ingresos y egresos y crédito solicitado · Relación de activos), con campos condicionales (cónyuge según estado civil, archivos según tipo de actividad económica) y totales que se suman solos. ⚠ **Maquetado, no funcional** (aviso visible arriba; ver §5).

### 3.11 Información precontractual — `/informacion-precontractual`
**Fuente:** contenido fijo. Texto completo de información precontractual y advertencias al consumidor (PLAN MÉDICO Y QUIRÚRGICO S.A.S., NIT 900.794.105-6, créditos con recursos propios, no es entidad financiera ni IPS, derecho a abonos sin penalidad, reportes a centrales de riesgo, etc.).

### 3.12 Política y protección de datos personales — `/politica-datos-personales`
**Fuente:** contenido fijo. Declaración (Ley 1581 de 2012) y cuatro documentos en PDF (alojados en `planmed.com.co`): Políticas de Tratamiento de Datos Personales, Aviso de Privacidad, Formato de Autorización y Formato de Reclamación.

### 3.13 Nuestros pacientes
**Fuente:** Wellezy Hub (sección «Nuestros pacientes»). Las dos primeras vistas pueden ocultarse desde el panel (y desaparecen también del menú).
- **Videos — `/testimonios`:** «Pacientes felices»: texto introductorio fijo y la lista de videos de YouTube cargados.
- **Antes y después — `/testimonios/antes-y-despues`:** casos publicados con foto del antes y del después, título y descripción; texto fijo sobre financiación flexible. Solo se muestran los casos con ambas imágenes. Debajo de la galería aparecen los videos de Instagram cargados.
- **Programa de referidos — `/testimonios/programa-de-referidos`:** si el panel tiene texto guardado se muestra ese; si no, se muestra el contenido del programa entregado por Planmed (¿En qué consiste?, ¿Cómo participar?, ¿Cuándo recibes tu bono?, nota «Importante»). Debajo, el **formulario de registro** (⚠ maquetado, no funcional; destino futuro: CRM médico) y las tres notas legales. Los dos números de atención abren WhatsApp (`wa.me/573157857783`).

### 3.14 Recomendaciones
**Fuente:** Wellezy Hub. Cada página muestra título, video de YouTube (opcional), imagen (opcional), contenido con formato y un bloque final «En Planmed te acompañamos» con botones *Simular financiación* y *Ver procedimientos*.
- **`/recomendaciones/[slug]`:** páginas generales (por ejemplo cita de preanestesia y prequirúrgicas) y páginas independientes de cuidados o revisión.
- **`/recomendaciones/cuidados` y `/recomendaciones/cuidados/[slug]`:** cuidados post operatorios por procedimiento.
- **`/recomendaciones/revision` y `/recomendaciones/revision/[slug]`:** indicaciones para la cita de revisión por procedimiento.
- Solo se muestran las páginas publicadas y los procedimientos con texto; las ocultas no aparecen ni en el menú.

### 3.15 Micrositios de referidores — `/prp/[slug]`
**Fuente:** Wellezy Hub (datos del micrositio) + envío directo al CRM del referidor. Página por referidor: «Referido por <título>», mensaje de bienvenida y formulario «Déjanos tus datos» (nombres y apellidos, teléfono, ciudad, cirugía de interés y aceptación de la política de datos). Al enviar muestra «¡Gracias!…» y vuelve al inicio. Es **funcional** (envía el lead con el código PRP). No muestra el aviso precontractual, ni el botón «Pide tu cita». Un micrositio inactivo no está disponible.

### 3.16 Redirección y rutas antiguas
`/simulador` → redirige (301) a `/financiacion`. Ningún enlace interno apunta ya a `/simulador`.

## 4. Mapa de rutas públicas

| Ruta | Menú | Fuente | Editable en el panel |
|---|---|---|---|
| `/` | Inicio | Código + Hub + local (clínicas) | Procedimientos destacados y clínicas |
| `/procedimientos`, `/procedimientos/[slug]` | Procedimientos | Hub | Sí (módulo Procedimientos) |
| `/noticias`, `/noticias/[slug]` | Noticias | Hub | Sí (módulo Noticias) |
| `/recursos` | Planmed | Código | No |
| `/nosotros` | Planmed | Local | Sí |
| `/quienes-somos` | Planmed | Código | No |
| `/servicios` | Planmed | Código (+ FAQ de Nosotros) | Solo las FAQ |
| `/clinicas-aliadas` | Planmed | Local | Sí |
| `/estudio-de-creditos` | Planmed | Código | No |
| `/informacion-precontractual` | Planmed | Código | No |
| `/politica-datos-personales` | Planmed | Código | No |
| `/financiacion` | Botón «Simular financiación» | Código (+ FAQ y contacto de Nosotros) | Solo FAQ y contacto |
| `/testimonios`, `/testimonios/antes-y-despues`, `/testimonios/programa-de-referidos` | Nuestros pacientes | Hub | Sí (módulo Nuestros pacientes) |
| `/recomendaciones/**` | Recomendaciones | Hub | Sí (módulo Recomendaciones) |
| `/prp/[slug]` | — (enlace del referidor) | Hub | Sí (módulo Micrositios) |
| `/admin/**` | Iniciar sesión | — | Panel administrativo |

## 5. Formularios: qué funciona y qué no

| Formulario | Dónde | Estado | Destino previsto |
|---|---|---|---|
| Lead del micrositio PRP | `/prp/[slug]` | **Funcional** | CRM del referidor (envío directo) |
| Solicitud de financiación (ventana «Inicia tu proceso ahora») | Simulador | **No envía**: solo `console.log` | Por definir |
| Cotización del simulador | `/financiacion` | **Tasa de ejemplo** (2 % mensual), no es la real | Por definir (regla de negocio, no modificar sin decisión) |
| Pide tu cita de valoración | Botón flotante | **Maqueta**, con aviso en pantalla | Por definir |
| Formulario de crédito paciente | `/estudio-de-creditos` | **Maqueta**, con aviso en pantalla | CRM médico |
| Registro del Programa de referidos | `/testimonios/programa-de-referidos` | **Maqueta**, con aviso en pantalla | CRM médico |

Pendientes comunes a los formularios no funcionales: definir el destino (CRM médico, no Wellezy Hub), validaciones, consentimiento de datos personales, protección de datos sensibles (cédula, cuenta bancaria, ingresos) y confirmar las opciones de las listas desplegables (hoy son provisionales).

## 6. Pendientes conocidos de contenido
- `/recursos` sin contenido (solo «Próximamente»).
- El **NIT** del aviso emergente (901532790) difiere del de `/informacion-precontractual` (900.794.105-6): confirmar cuál es el correcto y unificar.
- Fotos de la web anterior no incluidas en Servicios (casa de recuperación) y Financiación (cabecera).
- Horario de atención, mapa y YouTube del pie de página sin datos verificados.
- Números de WhatsApp antiguos (`573014746735`) todavía en `CtaSection`, `NextStepsSection` y `error.vue`; el chat y el footer usan `573157857783`.

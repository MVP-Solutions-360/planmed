# F10 · Layout público global (barra, pie, chat, valoración, precontractual)

Capturas: `CAPTURAS/publico/desktop__estado-menu-procedimientos.png`, `…__estado-menu-planmed.png`, `movil__estado-menu-abierto.png`, `desktop__estado-chat-abierto.png`, `desktop__estado-modal-valoracion.png`, `…__estado-valoracion-validacion.png`, `…__estado-modal-precontractual.png`.

Archivo de composición: `layouts/default.vue`.

## Navbar (`components/layout/Navbar.vue`)
* **Escritorio** (≥1360 px): logo (`/images/branding/logo.jpg`) · INICIO · **PROCEDIMIENTOS** (desplegable con una entrada por procedimiento de Hub, alto máx. 70 vh con scroll; sin Hub queda enlace simple) · NOTICIAS · **PLANMED** (desplegable fijo: Nosotros, ¿Quiénes somos?, Servicios, Clínicas aliadas, Estudio de créditos, Información precontractual y advertencias al consumidor, Políticas y protección de datos personales, Recursos) · **NUESTROS PACIENTES** (Videos, Antes y después, Programa de referidos; según visibilidad de Hub) · **RECOMENDACIONES** (temas publicados con subtemas anidados; solo si el Hub los entrega) · botón verde **SIMULAR FINANCIACIÓN** · botón **INICIAR SESIÓN** (`/admin/login`).
* **Móvil**: botón hamburguesa (`aria-label` Abrir/Cerrar menú); panel con `<details>` por grupo, subgrupos para subtemas, «Ver todos/Ver todo», CTA y acceso al admin. Se cierra al navegar, con Escape (devuelve foco) y al pasar a escritorio.
* Datos: `useAsyncData('patient-section')` y `useAsyncData('nav-recommendations')`; se **refrescan en cada cambio de ruta**. Construcción pura y probada: `utils/navMenus.ts` (`buildMenus`, `buildProcedureMenu`): un subtema nunca se repite; un tema sin subtemas utilizables no genera entrada; un menú vacío no se muestra.
* Accesibilidad: `aria-haspopup`, `aria-expanded`, `focusin/focusout`, Escape.
* Pruebas: `tests/navigation/{menus,procedures-menu,public-layout}.test.ts`. Verif.: EJ.

## Footer (`Footer.vue`)
Fondo verde: redes (Instagram, Facebook, TikTok, YouTube), WhatsApp (573157857783) y Messenger; enlaces «Documentos Legales» (`/recursos`) y «Sobre Planmed» (`/nosotros`); logo blanco. Las URLs de redes están **fijas en el componente** (a diferencia de «Contacto», que es administrable).

## ChatLauncher (`ChatLauncher.vue`)
Botón flotante inferior derecho (`<details>` nativo): al abrirse ofrece WhatsApp (`573157857783`) y Messenger. Cierra con Escape o clic fuera. EJ.

## Botón y modal «Pide tu cita de valoración» (`forms/ValuationRequest.vue`)
Botón flotante `PIDE TU CITA` (`data-testid="valuation-fab"`); diálogo accesible (foco atrapado, Escape, bloqueo de scroll). Campos obligatorios: Nombres, Apellidos, Número de cédula, Fecha de nacimiento, Ciudad, Teléfono, Email, ¿Qué cirugía? (lista de procedimientos de Hub), Forma de pago (Contado / Financiación) + aceptación de política de datos. Envío `POST /api/forms/valuation` → **CRM médico** (multipart, `crmValuationUrl`). Reglas del servidor: mismo origen, **8 intentos/10 min por IP**, bloqueo de duplicado 2 min (huella SHA-256 de cédula+teléfono+cirugía), timeout 15 s, **sin reintentos**, éxito solo si el CRM confirma, sin logs de datos personales. Estados `idle|submitting|success|error`; errores por campo. **Envío real no ejecutado.** Pruebas: `tests/valuation/valuation.test.ts`. EJ (apertura, validación vacía).

## Modal precontractual (`common/PrecontractualModal.vue`)
Primer acceso: modal bloqueante «INFORMACIÓN PRECONTRACTUAL» (scroll bloqueado) con botones **No acepto** (redirige a `https://google.com`) y **Acepto y continuar** (guarda `planmed_precontractual_v1=accepted` en `localStorage`). No se monta en `/prp/**`. La aceptación **no se registra en ningún sistema** (hay comentarios «FUTURO» en el código). **Defectos**: muestra literalmente `pqrs.institucional{'@'}gmail.com` y NIT 901532790, distinto al de la página `/informacion-precontractual` (900.794.105-6). EJ.

## Cabeceras de documento (`app.vue`)
`lang="es"`, fuentes Google (Playfair Display + Inter), `trackPageView` en cada cambio de ruta (solo consola).

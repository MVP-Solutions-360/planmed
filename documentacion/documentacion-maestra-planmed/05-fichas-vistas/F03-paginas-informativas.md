# F03 · Páginas informativas (grupo)

[← Inventario](../02-inventario-completo-vistas.md) · Ocho páginas que comparten el patrón «cabecera verde + contenido»; **no son iguales**: difieren en origen del contenido y administración.

| Ruta | Archivo | Contenido | ¿Administrable? | Layout interno | Capturas |
|---|---|---|---|---|---|
| `/nosotros` | `pages/nosotros.vue` | Hero con imagen, institucional (legal + hasta 3 párrafos), video YouTube, FAQ, contacto | **Sí** → `/admin/nosotros` (disco local) | propio (sin `PageShell`) | `desktop/movil__nosotros.png` |
| `/quienes-somos` | `pages/quienes-somos.vue` | Texto largo estático, 3 videos YouTube, 1 Instagram embed, botón WhatsApp «Financia aquí» | No | `SitePageShell title="¿Quiénes somos?" wide` | `…__quienes-somos.png` |
| `/servicios` | `pages/servicios.vue` | Asesoría y financiación (imagen equipo), casa de recuperación (2 videos), FAQ compartida con Nosotros | Solo las FAQ (vía Nosotros) | `SitePageShell wide` | `…__servicios.png` |
| `/clinicas-aliadas` | `pages/clinicas-aliadas.vue` | Texto de página + lista de clínicas (imagen, descripción, galería, documentos) | **Sí** → `/admin/paginas/clinicas-aliadas` | `SiteManagedPage` + `SiteClinicsList` | `…__clinicas-aliadas.png` |
| `/estudio-de-creditos` | `pages/estudio-de-creditos.vue` | `CreditStudyForm`: formulario de 6 pasos | No | `SitePageShell wide` | `…__estudio-de-creditos.png` |
| `/informacion-precontractual` | `pages/informacion-precontractual.vue` | Texto legal (NIT 900.794.105-6) | No | `SitePageShell` | `…__informacion-precontractual.png` |
| `/politica-datos-personales` | `pages/politica-datos-personales.vue` | Texto Ley 1581 + 4 enlaces a PDF en `planmed.com.co` | No | `SitePageShell` | `…__politica-datos-personales.png` |
| `/recursos` | `pages/recursos.vue` | Hero editorial + estado «Próximamente…» (lista `documents` vacía) | No (archivo de datos `data/resources.ts`) | propio | `…__recursos.png` |

Todas: tipo **pública**, layout `default`, sin protección. SEO con `useSeoMeta`; canonical en nosotros, quienes-somos, servicios, estudio-de-creditos y clínicas aliadas (vía `ManagedPage`).

## `/nosotros` (detalle)
* **Datos**: `useFetch('/api/public/about', {key:'about-page', default: contenido inicial validado})`: si el archivo local no se lee, se muestra el contenido inicial (nunca vacío). `aboutPublicView` filtra FAQs inactivas.
* **Secciones**: (1) portada `content.hero.{image,imageAlt,title}`; (2) institucional (`legal` en caja con borde dorado + párrafos); (3) video (solo si la URL es de YouTube válida; `youtube-nocookie`); (4) FAQ (si hay); (5) `AboutContactSection` (solo lo guardado: dirección, teléfono, correo, horario, redes, mapa si está habilitado).
* **Mapa**: iframe construido con `aboutMapEmbedUrl` solo si hay dirección+ciudad y `map.enabled`.
* **Estados**: contenido guardado / inicial; sin FAQs → sección oculta. Verif.: EJ. Pruebas: `tests/about/about.test.ts`, `pages.test.ts`.

## `/clinicas-aliadas` (detalle)
* `SiteManagedPage slug="clinicas-aliadas"`: `GET /api/public/pages/clinicas-aliadas` → título/subtítulo/cuerpo (HTML saneado). Sin cuerpo guardado muestra la cabecera sin texto; el comentario del componente habla de «Contenido próximamente» pero el código solo renderiza el cuerpo si existe (`v-if="page.body"`) [COD].
* `SiteClinicsList` (`GET /api/public/clinics`): cada clínica es un `<article id=…>` con imagen, nombre, descripción, **Galería** (enlaces a imagen a tamaño completo) y **Documentos y certificados** (archivos PDF/imagen). Sin clínicas no se renderiza nada. Imágenes servidas por `/api/public/clinics/media/:name`.
* Las mismas clínicas alimentan la sección de logos de la home (`#id` ancla).

## `/estudio-de-creditos` (detalle) — **maqueta**
* `CreditStudyForm`: pestañas WAI-ARIA con flechas/Inicio/Fin: 1 Información personal, 2 Información del cónyuge, 3 Actividad económica y localización, 4 Referencias (familiar, personal, ¿reportado?, beneficiarios voluntarios póliza Sura), 5 Relación de ingresos y egresos (+ crédito solicitado), 6 Relación de activos (bienes raíces y vehículo).
* Reglas locales: campos del cónyuge se **habilitan** si estado civil = Casado(a)/Unión libre; archivos requeridos varían por tipo de actividad (carta laboral + colillas / RUT / extractos); totales de ingresos y egresos se suman.
* **No valida ni envía** (`novalidate`, botón *Guardar* solo muestra «Aún no es funcional»); aviso ámbar permanente (`data-testid="credit-form-not-functional"`). Las listas de opciones son **provisionales**. Estado: [PARC] maqueta. Verif.: EJ (vista). 

## `/recursos`
`documents` está vacío (`export const documents: Document[] = []`) ⇒ siempre se ve «Próximamente encontrarás aquí los documentos y requisitos oficiales…». El pie y el `LeadForm` enlazan a esta página como «Documentos legales»/habeas data. [PARC]

## `/politica-datos-personales`, `/informacion-precontractual`
Texto fijo en la plantilla. **Inconsistencia conocida**: el modal precontractual global usa otro NIT y texto (ver F10).

## Interacciones comunes
| Elemento | Resultado | Verif. |
|---|---|---|
| Enlaces PDF (política) | abren en pestaña nueva (`rel=noopener`) | COD |
| FAQ (nosotros/servicios/financiacion) | acordeón con teclado | COD/TEST |
| Botón «Financia aquí» (quienes-somos) | abre WhatsApp `573188043382` | COD |
| Videos/Instagram | iframes `loading=lazy`; en el entorno de captura sin internet salen negros | EJ parcial |

## Estados
Cargado: EJ (todas). Móvil: EJ (todas). Sin datos: nosotros (contenido inicial), clínicas (nada), recursos («Próximamente»). Error de lectura local: nosotros/clínicas devuelven contenido inicial/vacío, sin 5xx (código de `server/api/public/*`).

## Evidencias
`tests/about/{about,clinics,pages,guide}.test.ts`, `tests/navigation/public-layout.test.ts`. Limitación: textos y videos son contenido de Planmed (no reutilizable para Crediestética).

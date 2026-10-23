# A07 · Nosotros y Clínicas aliadas (admin) — contenido en disco local

Capturas: `CAPTURAS/admin/{desktop,movil}__nosotros.png`, `…__pagina-clinicas-aliadas.png`.

**Persistencia local, no Hub.** Archivos JSON bajo `NUXT_PLANMED_CONTENT_DIR` (por defecto `<cwd>/.data/planmed-content`): `about.json` (+ imágenes `hero-*.{jpg,png,webp}`), `clinics.json` (+ `img-*`/`doc-*`), `pages/clinicas-aliadas.json`. Escritura atómica (`tmp` + `rename`) con copia `*.prev.json`; revalidación del rol CMS contra Hub en **cada guardado** (`requireAboutEditor`).

## `/admin/nosotros` (`pages/admin/nosotros.vue`; API `GET/PUT /api/admin/about`)
Cabecera «Página Nosotros» + enlace «Ver página pública» (nueva pestaña). Formulario con tarjetas:
| Tarjeta | Campos (límites de `ABOUT_LIMITS`) |
|---|---|
| Portada | Título (≤200), Descripción de la imagen (accesibilidad), imagen (JPG/PNG/WebP ≤10 MB → 2000 px; en el servidor se guarda como archivo `hero-*`; la anterior se elimina) |
| Información institucional | Título institucional, Descripción legal (editor, ≤4000), **3 párrafos** (editor, ≤6000 c/u) |
| Video institucional | Enlace de YouTube (se normaliza a `watch?v=`; vista previa) |
| Preguntas frecuentes | hasta **30**; cada una: pregunta (≤300), respuesta (editor, ≤4000), *Activa* (las inactivas no se publican), Subir/Bajar/Eliminar; «Agregar» |
| Contacto | Dirección, Edificio, Ciudad, Departamento y país, Teléfono, Correo, Horario (editor; vacío = no se muestra), enlaces https de Instagram/Facebook/TikTok (se valida el dominio), casilla de **mapa** |
Barra inferior fija: estado («Sin cambios» / «Cambios sin guardar» / «Hay N campo(s) por corregir» / «Guardado a las HH:MM. Ya es visible en la página pública.») + botón **Guardar** (deshabilitado sin cambios). Validación cliente y servidor idénticas (`validateAboutContent`); errores por campo bajo cada input (`aria-invalid`). **Control de concurrencia**: el cuerpo lleva `updatedAt`; si otro guardó antes ⇒ 409 «Otra persona guardó cambios mientras editabas. Recarga…». `beforeunload` con cambios sin guardar. Estados: cargando, error de carga con *Reintentar*, formulario. HTML siempre saneado en servidor (`sanitizeRichHtml`: `p, br, strong, em, h2, h3, ul, ol, li, a`).
Verif.: EJ (vista); guardado por TEST (`tests/about/about.test.ts`).

## `/admin/paginas/:slug` (`pages/admin/paginas/[slug].vue`)
Registro `SITE_PAGES` contiene **solo** `clinicas-aliadas` (otro slug ⇒ 404). Formulario: Título (≤200), Subtítulo (≤300), Contenido (editor, ≤20000), barra de guardado con el mismo patrón. Debajo, **`AdminClinicsManager`** (`clinics.json`; API `GET/PUT /api/admin/clinics`, `POST /api/admin/clinics/upload`):
* «Agregar clínica» (se inserta **arriba**, recibe foco), por clínica: Nombre \* (≤200), Descripción \* (editor ≤6000), imagen principal, **Galería** (hasta 20 imágenes), **Documentos** (hasta 10, cada uno con Título \* y hasta 5 archivos PDF/JPG/PNG/WebP; PDF ≤10 MB, imágenes ≤15 MB y se comprimen a 1800 px), Subir/Bajar/Eliminar (confirmación). Máx. 100 clínicas.
* Subidas: se envían inmediatamente como data URL a `/api/admin/clinics/upload` y devuelven una URL pública `/api/public/clinics/media/<nombre>`; solo queda en uso al guardar. Botón Guardar deshabilitado mientras sube.
Verif.: EJ (vista); `tests/about/clinics.test.ts`, `pages.test.ts`.

## Interacciones clave
| Elemento | Resultado | Verif. |
|---|---|---|
| Guardar | PUT; éxito ⇒ toast «… guardada» y datos devueltos por el servidor | TEST |
| Subir/Bajar FAQ o clínica | reordena en memoria (se guarda con *Guardar*) | COD |
| Quitar todos los documentos | confirmación | COD |

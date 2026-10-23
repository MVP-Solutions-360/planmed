# A04 · Nuestros Pacientes (admin) — `/admin/testimonios`

Capturas: `CAPTURAS/admin/{desktop,movil}__pacientes.png`.

| Archivo | API | Hub |
|---|---|---|
| `pages/admin/testimonios/index.vue` | `GET/PUT /api/admin/patient-section` | `/cms/patient-section`, `/cms/testimonial-embeds`, `/cms/before-after-cases` (+ `/cms/before-after-cases/{id}/images` multipart) |

## Estructura
Título, botón **Guardar** (guarda las tres pestañas a la vez), pestañas **Videos · Antes y después · Programa de referidos**; un interruptor «visibilidad» por pestaña (Videos y Antes y después) que controla el menú y la página pública.
* **Videos**: tarjetas con *Título (opcional)*, *Enlace de YouTube \** (solo `youtube.com/youtu.be`), casilla *Visible*, botones ↑ ↓ ✕ (orden, eliminar con confirmación «¿Eliminar este video? Se aplicará al guardar los cambios.»), «+ Agregar video».
* **Antes y después**: tarjetas con **Foto antes** y **Foto después** (subida, ≤10 MB, `fileToOptimizedDataUrl`), *Título \**, *Descripción*, casilla *Publicado*, ↑ ↓ ✕; «+ Agregar caso»; subsección **Videos de Instagram** (enlace a `/p/`, `/reel/`, `/tv/`, visible, ↑ ↓ ✕, «+ Agregar video de Instagram»).
* **Programa de referidos**: *Título de la página* + *Contenido* (editor enriquecido). Sin contenido ⇒ la página pública usa el texto por defecto.

## Reglas
Validación cliente: enlaces no vacíos y válidos; cada caso necesita título; un caso publicado necesita ambas fotos. El servidor revalida y rechaza antes de escribir (`parseContentBody`). **Guardado parcial**: `applyContent` no es transaccional (elimina → crea/actualiza → sube imágenes); si falla a la mitad se devuelve el estado guardado y se muestra una **advertencia** (6 s) «Hub conservó parte de los cambios», sincronizando ids reales para que un reintento no duplique (`tests/patients/partial.test.ts`). Máximo 100 elementos. `applyContent` aplica los cambios en el orden eliminar → actualizar → crear → reordenar.
Carga: `onMounted`; error ⇒ modal; hasta cargar, «Cargando...». Verif.: EJ (vista con contenido vacío en Hub simulado); guardado por TEST (`tests/patients/server.test.ts`, `partial.test.ts`).

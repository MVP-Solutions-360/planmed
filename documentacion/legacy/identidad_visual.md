> **LEGACY / HISTÓRICO — NO APLICABLE A PLANMED ACTUAL**

# Documentación de Identidad Visual y Diseño (UI)
**Proyecto:** Crediestética
**Versión:** 1.0 (Refactorización Premium/Editorial - Fases 1A y 1B)

Este documento centraliza el registro de la paleta de colores y la arquitectura tipográfica implementada a través de las distintas vistas del portal web de Crediestética, garantizando un punto de consulta único para mantener la consistencia visual (Single Source of Truth).

---

## 1. Paleta de Colores Oficial

La identidad cromática se construyó bajo un concepto de "Clínica Boutique / Lujo Institucional", abandonando los colores genéricos (blancos absolutos, grises web y negros `#000`) para adoptar tonos cálidos, profundos y editoriales.

| Nombre | Hexadecimal | Uso Principal |
| :--- | :--- | :--- |
| **Negro Obsidiana** | `#111111` | Textos primarios, fondos de tarjetas premium, botones principales, superposiciones (Overlays). |
| **Marfil Editorial** | `#F7F3EE` | Fondo universal del lienzo (Canvas), fondos de secciones de descanso. Reemplaza al `#FFFFFF`. |
| **Beige Arquitectónico** | `#E7DDD1` | Superficies, tarjetas de catálogos, contenedores del simulador, áreas que requieren elevación sutil sin sombras. |
| **Dorado Suave** | `#CBA36B` | Acentos, *hover states*, botones secundarios, píldoras informativas e íconos. |
| **Gris Piedra** | `#BBB2AA` | Textos secundarios, párrafos descriptivos (sobre fondos oscuros), bordes sutiles (`border-[#BBB2AA]/30`) y divisores. |

---

## 2. Sistema Tipográfico Global

Se eliminó la dependencia de fuentes genéricas (Sans-Serif gruesas para títulos) en favor de una combinación que transmita elegancia, rigurosidad médica y accesibilidad.

*   **Títulos (`font-serif`): Libre Bodoni** (Google Fonts).
    *   *Uso:* Exclusivamente para la jerarquía dominante (H1, H2) y H3 de suma importancia (Nombres de procedimientos, Pilares de Garantía).
    *   *Comportamiento:* Genera autoridad y evoca editoriales de moda/salud premium.
*   **Cuerpos de Texto (`font-sans`): Questrial** (Google Fonts).
    *   *Uso:* Párrafos, botones, etiquetas, navegación, FAQs, menús desplegables y micro-copys.
    *   *Comportamiento:* Fuente geométrica, limpia, altamente legible en pantallas pequeñas y excelente contraste técnico contra la majestuosidad de Bodoni.

---

## 3. Registro por Vistas (Páginas)

A continuación, se detalla la aplicación exacta de estas reglas en cada una de las páginas principales del proyecto:

### 3.1. Home (`pages/index.vue`)
*   **Fondos:** El lienzo general es Marfil (`#F7F3EE`). La sección de Financiación Transparente reposa sobre un contenedor Beige (`#E7DDD1`). El Hero utiliza una imagen cubierta con fondos Oscuros (`#111111`).
*   **Tipografía:** 
    *   *Libre Bodoni:* El título masivo del Hero ("El respaldo médico..."), el título de Aliados Médicos y Financiación.
    *   *Questrial:* El botón del CTA, las descripciones del hero, y los textos base de la financiación.
*   *(Nota: Componentes heredados como `ProcessSection` o `TrustSection` mantienen reglas aisladas hasta su futura refactorización).*

### 3.2. Nosotros (`pages/nosotros.vue`)
*   **Fondos:** Lienzo Marfil (`#F7F3EE`). La tarjeta de promesa anclada al Hero es Negro Obsidiana (`#111111`).
*   **Garantía Crediestética:** Los contenedores principales ("Especialistas", "Instituciones") usan Beige (`#E7DDD1`) con bordes Gris Piedra. Los contenedores secundarios usan Marfil con bordes tenues.
*   **Tipografía:**
    *   *Libre Bodoni:* Hero H1, "La Garantía Crediestética" (H2), H3 de Especialistas e Instituciones.
    *   *Questrial:* H3 de "Estudio de Perfil" y "Acompañamiento Integral" (para generar contraste jerárquico), párrafos y etiquetas.

### 3.3. Simulador Financiero (`pages/simulador.vue`)
*   **Fondos:** Hero en Marfil (`#F7F3EE`). El envoltorio del simulador (Premium Dark Section) es Negro Obsidiana (`#111111`). La calculadora interactiva (controles) reposa sobre Beige (`#E7DDD1`).
*   **Tipografía:**
    *   *Libre Bodoni:* Título del Hero ("Simula la financiación..."), Título de la calculadora ("Calcula tu cuota").
    *   *Questrial:* Etiquetas de los inputs ("Procedimiento", "Ciudad"), números de los meses (12, 24, 36), y textos descriptivos.

### 3.4. Catálogo de Procedimientos (`pages/procedimientos/index.vue`)
*   **Fondos:** Lienzo Marfil (`#F7F3EE`). Tarjetas de cada procedimiento en Beige (`#E7DDD1`). CTA Inferior Premium en Negro Obsidiana (`#111111`).
*   **Tipografía:**
    *   *Libre Bodoni:* Título Hero H1, Transición H2 ("Encuentra el procedimiento..."), Nombres de los procedimientos en las tarjetas (H3), Título del CTA final.
    *   *Questrial:* Píldoras de categoría ("CORPORAL"), descripciones de las tarjetas, botones.

### 3.5. Detalle de Procedimiento (`pages/procedimientos/[slug].vue`)
*   **Fondos:** Lienzo Marfil (`#F7F3EE`). En Desktop, el Hero se divide: mitad contenedor Beige (`#E7DDD1`) y mitad fotografía. Las tarjetas de Beneficios son Beige. La tarjeta final de financiación Premium es Negro Obsidiana (`#111111`).
*   **Tipografía:**
    *   *Libre Bodoni:* El nombre masivo del procedimiento (Hero H1), "¿En qué consiste?" (H2), "Beneficios Principales" (H2), Títulos individuales de los Beneficios (H3), "¿Es para ti?" (H2), "Preguntas Frecuentes" (H2).
    *   *Questrial:* Píldora superior (ej. "CORPORAL"), descripciones de los beneficios, viñetas de "¿Es para ti?", y las preguntas/respuestas del acordeón FAQ.

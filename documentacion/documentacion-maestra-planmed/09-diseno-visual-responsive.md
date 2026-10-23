# 09 · Diseño visual, layouts y responsive

## 1. Tokens y tipografía
| Token | Valor | Uso |
|---|---|---|
| Verde corporativo | `#0C2619` (`--color-accent`) | fondos de héroe/cabeceras/sidebar, botones primarios |
| Dorado | `#D3A76A` (hover `#e0b97f`, texto `#9a7a45`) | acentos, botones secundarios, ítem activo del panel |
| Fondo cálido | `#fcf9f8` | cuerpo de páginas y navbar |
| Bordes / grises | `#e5e2e1`, `#cfc4c5`, `#848484`, `#4c4546` | divisores, texto secundario |
| Texto | `#1c1b1b`, negro `#000` | |
| Fuentes | **Playfair Display** (serif, títulos en mayúsculas) y **Inter** (sans) — Google Fonts desde `app.vue`; `--font-serif/--font-sans` en `assets/css/theme.css` | |
Los colores están **codificados como valores arbitrarios de Tailwind** (`bg-[#0C2619]`) en las plantillas; solo `--color-accent`, `primary`, `secondary`, `background` y las fuentes son tokens. No hay modo oscuro. Estilos globales: `assets/css/tailwind.css` (`@import "tailwindcss"`, tema, y clase `.rich-content` para el HTML saneado; las recomendaciones usan además clases `.reco-*` locales).
Logo e imágenes: `public/images/{branding,web,team,procedures,allies,clinics}`; favicon `logo-ico.ico`.

## 2. Layouts
| Layout | Estructura | Notas |
|---|---|---|
| `default` | `flex-col min-h-screen`: Navbar sticky (z-50, `bg-[#fcf9f8]`), `<main flex-grow>`, Footer, botones flotantes (chat abajo-derecha, «Pide tu cita» encima), modales | `/prp/**` omite valoración y precontractual |
| `admin` | `h-screen overflow-hidden flex`: sidebar `w-64` verde (solo ≥md), columna con topbar `h-20` y `main` con scroll interno `p-8` y contenedor `max-w-6xl` | sin menú móvil funcional |
| `login` | sin layout | tarjeta centrada |

## 3. Breakpoints
Tailwind 4 por defecto: `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`. Particularidades: menú de escritorio del sitio desde **1360 px** (JS `onResize` y clases condicionales); admin cambia de móvil a escritorio en `md`; grillas de formularios `grid-cols-1 → md:/lg:grid-cols-N`.
Capturas de referencia: **1440×900 (desktop)** y **390×844 (móvil)**, página completa (`fullPage`).

## 4. Patrones de interfaz
| Patrón | Detalle |
|---|---|
| Títulos | serif, mayúsculas, interlineado ~1.05, tamaños responsivos 34–84 px |
| Botones primarios | verde `#0C2619`, texto blanco, mayúsculas, `tracking-widest` 10–12 px, radios 0–4 px (sitio) / `rounded-lg` (admin) |
| Tarjetas | borde `#e5e2e1`, sin sombra (sitio) / `shadow-sm rounded-xl` (admin) |
| Formularios públicos | campos con borde fino, etiquetas en mayúsculas 11 px, errores rojos `text-xs` bajo el campo, casilla de política obligatoria |
| Formularios admin | `bg-gray-50 border rounded-lg focus:ring-[#0C2619]`, etiquetas `text-xs font-bold uppercase`, secciones en tarjetas con `h3` de 12 px y línea inferior |
| Tablas admin | `overflow-x-auto`, cabecera gris, acciones como botones de icono |
| Estados vacíos | recuadro punteado con texto gris |
| Avisos | rojo (error), ámbar (advertencia/heredado), verde (éxito); `role="alert"/"status"` |
| Accesibilidad | pestañas ARIA, acordeón ARIA, diálogos `aria-modal`, foco visible, `sr-only`, saltos con `focus-visible` |

## 5. Hallazgos visuales/responsive
1. Admin móvil sin navegación (ver `01` H2).
2. En el hero de la home la imagen es en escala de grises hasta pasar el cursor (efecto dependiente de hover; en táctil queda gris).
3. Mezcla de dos lenguajes de estilo: sitio «editorial» (esquinas rectas, serif) y admin «dashboard» (esquinas redondeadas).
4. Selector «Procedimiento» del simulador apareció vacío en la captura inmediata (ver F02).
5. Videos incrustados salen en negro sin internet (no es defecto de la app).

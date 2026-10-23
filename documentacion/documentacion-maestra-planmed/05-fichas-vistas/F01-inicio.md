# F01 · Inicio (`/`)

[← Inventario](../02-inventario-completo-vistas.md) · Capturas: `../CAPTURAS/publico/desktop__inicio.png`, `movil__inicio.png`, `desktop__estado-hub-caido__inicio.png`

## Identificación
| Campo | Valor |
|---|---|
| Nombre funcional | Página de inicio |
| URL | `/` |
| Tipo | Pública |
| Archivos | `pages/index.vue`; secciones: `components/home/{ValueProposition,ProceduresSection,ProcedureCard,HowItWorksSection,ClinicsSection}.vue` |
| Layout | `default` (Navbar, Footer, ChatLauncher, botón de valoración, modal precontractual) |
| Protección | Ninguna. Regla de ruta `ssr: true` |
| Dependencias | `publicProcedureService` (Hub), `/api/public/clinics` (disco local), `data/clinics.ts` (respaldo estático) |
| SEO | `useSeoMeta` título «Planmed \| Financiación Médica Directa»; sin canonical |

## Propósito y comportamiento
Presentar la propuesta de valor («Tu próxima etapa empieza con un plan»), mostrar un **ejemplo estático** de plan de pago ($10.000.000 → $8M a 48 meses → cuota $235,123 — cifras fijas en la plantilla, **no** calculadas con la tasa configurable; la nota al pie aclara que es referencial) y llevar al simulador (`/financiacion#calculadora`), a los procedimientos y a las clínicas. Usuario: visitante/paciente potencial.

Salidas: `SIMULAR FINANCIACIÓN` (×2) → `/financiacion#calculadora`; «Ver todos» → `/procedimientos`; tarjetas de procedimiento → detalle; «Cómo funciona» CTA → simulador; tarjetas de clínica → `/clinicas-aliadas#<id>` (si administradas).

## Estructura visual (arriba → abajo)
1. **Hero** (2 columnas desde `lg`): izquierda fondo verde corporativo `#0C2619` con H1 serif en mayúsculas («TU PRÓXIMA ETAPA EMPIEZA CON UN **PLAN.**», acento dorado `#D3A76A`), párrafo con borde izquierdo blanco y botón blanco `SIMULAR FINANCIACIÓN`; derecha imagen `/images/web/home.png` (4:5, escala de grises que se colorea al hover) con **tarjeta flotante** «EJEMPLO DE PLAN».
2. **«No necesitas tenerlo todo hoy»**: tres bloques (Valor procedimiento → Monto a financiar → Cuota mensual estimada), nota de tasa referencial y botón verde `SIMULAR FINANCIACIÓN`.
3. `HomeValueProposition` (presentacional, H2 dorado).
4. `HomeProceduresSection`: lista de procedimientos desde Hub como `HomeProcedureCard`.
5. `HomeHowItWorksSection`: 3 pasos (Simulación y Solicitud · Estudio de Perfil · Aprobación y Procedimiento) + enlace al simulador.
6. `HomeClinicsSection`: rejilla 2/5 columnas con logos; usa las clínicas administradas; si no hay, cae a `data/clinics.ts`.
Responsive: el hero apila (texto → imagen); tarjeta flotante se desplaza (`-left-4` móvil). Tipografía escalada `44px → 84px`.

## Componentes
| Componente | Compartido | Notas |
|---|---|---|
| `HomeProcedureCard` | solo Home | prop `procedure: Object` (requerida); imagen + nombre |
| `HomeProceduresSection` | solo Home | `useAsyncData('home-procedures')`; **si el Hub falla muestra lista vacía sin aviso** (default `[]`; no usa `HubUnavailable`) |
| `HomeClinicsSection` | solo Home | `useFetch('/api/public/clinics', {key:'clinics-public'})` comparte caché con `/clinicas-aliadas` |
| `HomeValueProposition`, `HomeHowItWorksSection` | solo Home | estáticos |

## Datos y lógica
* Procedimientos: `GET /api/public/procedures` (paginación interna de hasta 20 páginas contra Hub).
* Clínicas: `GET /api/public/clinics` → JSON local (`clinics.json`); si el archivo no se puede leer devuelve lista vacía (la sección usa el respaldo estático).
* Sin escritura ni efectos secundarios (salvo `trackPageView` → consola).

## Interacciones
| Elemento | Acción | Resultado | Errores | Verif. |
|---|---|---|---|---|
| `SIMULAR FINANCIACIÓN` (hero y sección 2) | clic | navega a `/financiacion#calculadora` | — | COD |
| Tarjeta de procedimiento | clic | `/procedimientos/:slug` | — | COD |
| «Ver todos» | clic | `/procedimientos` | — | COD |
| Logo de clínica | clic | `/clinicas-aliadas#id` | — | COD |

## Estados
| Estado | Descripción | Verif. |
|---|---|---|
| Datos cargados | Hero + secciones + procedimientos del Hub simulado | EJ |
| Sin datos | Sección de procedimientos vacía (sin mensaje) | EJ parcial: con el Hub apagado la página responde **HTTP 200** y el hero se ve normal (`desktop__estado-hub-caido__inicio.png`); la sección de procedimientos bajo el pliegue no se inspeccionó (por código queda vacía) |
| Error de Hub | No hay aviso; HTTP 200 | EJ |
| Móvil | Una columna; tarjeta flotante encima de la imagen | EJ |
| Modal precontractual | Aparece en la primera visita (ver F10) | EJ |

## Evidencias
Archivos: `pages/index.vue`, `components/home/*`. Pruebas relacionadas: `tests/navigation/public-layout.test.ts` (layout). No hay prueba específica de la home. Limitación: las cifras del ejemplo están codificadas; hay que decidir en el proyecto de destino si deben salir de la tasa configurada.

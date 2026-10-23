# A01 · Acceso, layout del panel y dashboard (`/admin/login`, `/admin`)

Capturas: `CAPTURAS/admin/{desktop,movil}__login.png`, `…__dashboard.png`, `desktop__redireccion-sin-sesion.png`.

## Identificación
| Campo | `/admin/login` | `/admin` |
|---|---|---|
| Archivo | `pages/admin/login.vue` | `pages/admin/index.vue` |
| Layout | ninguno (`layout:false`, diseño propio) | `admin` (`layouts/admin.vue`) |
| Protección | `admin-auth.global.ts`: con sesión → redirige a `/admin` | sesión válida; sin sesión → `/admin/login` |
| Servicios | `authService.login` → `WellezyAuthProvider` → `POST /api/auth/login` | `authService.getUser()` |
| `<title>` | «Iniciar sesión \| Admin Planmed» | «Dashboard \| Admin Planmed» |

## Login
**Visual**: tarjeta centrada con «Planmed.», formulario (correo, contraseña con placeholder `••••••••`), alerta roja con borde izquierdo si hay error, botón «Iniciar sesión» (texto cambia a «Iniciando sesión...» y se deshabilita). 
**Flujo**: `onSubmit` → `authService.login` → `navigateTo('/admin')`. Errores (mensajes del servidor, `server/api/auth/login.post.ts`): 422 «Ingresa un correo electrónico y una contraseña válidos.», 401 «Correo electrónico o contraseña incorrectos.», 403 «No tienes acceso al panel administrativo de Planmed.» (también si el rol no está en `NUXT_PLANMED_ADMIN_ROLE_IDS`: se revoca el token recién emitido), 429 «Demasiados intentos…», 503 «No fue posible conectar con el servicio de autenticación…». No hay registro, «olvidé mi contraseña» ni enlace de retorno al sitio (el sitio público enlaza al login desde el menú). Verif.: EJ (login con credenciales de prueba contra Hub simulado; errores por TEST: `tests/security/routes.test.ts`).

## Layout del panel (`layouts/admin.vue`)
| Zona | Contenido |
|---|---|
| Barra lateral (`w-64`, solo ≥`md`) | «PLANMED / PANEL ADMINISTRATIVO»; **Dashboard**; grupo *Contenido*: Procedimientos, Noticias, Nuestros Pacientes, Recomendaciones (→ `/admin/recomendaciones/temas`), **Nosotros** (submenú plegable: «Nosotros» → `/admin/nosotros`, «Clínicas aliadas» → `/admin/paginas/clinicas-aliadas`), Micrositios; grupo *Administración* (solo si `isAreaLeader` o `canEditRate`): Configuración. Ítem activo: fondo dorado `#D3A76A`. |
| Barra superior (h-20) | botón hamburguesa (solo móvil, **sin acción**), nombre y rol del usuario (`user.role.name`), «Cerrar sesión» (`authService.logout()` → login) |
| Contenido | `max-w-6xl`, scroll interno; el layout ocupa `h-screen overflow-hidden` |
**Móvil**: la barra lateral **no existe** y la hamburguesa no abre nada; la navegación solo es posible desde las tarjetas del dashboard o por URL (EJ `movil__dashboard.png`). Defecto de usabilidad.

## Dashboard
Saludo «Bienvenido a Planmed» + 6 tarjetas de acceso (Procedimientos, Noticias, Nuestros Pacientes, Recomendaciones, Micrositios, Configuración [`v-if` líder/tasa]) con icono, título y descripción. Sin métricas ni datos remotos. Verif.: EJ.

## Estados
Login: reposo, enviando, error (EJ parcial). Dashboard: usuario con/sin acceso a Configuración (el usuario simulado era líder, se vio la tarjeta). Sesión vencida: el middleware recarga `/api/auth/me` (401 ⇒ login) (EJ al abrir `/admin/procedimientos` sin cookie).

## Evidencias
`tests/security/routes.test.ts`, `tests/about/line-users.test.ts`. Ver [`../08-autenticacion-permisos-sesiones.md`](../08-autenticacion-permisos-sesiones.md).

# Planmed: administración, permisos y navegación

**Documento de traspaso para Claude --- Crediestética**\
**Fecha:** 10 de octubre de 2026\
**UAT Planmed:** https://planmed.wellezyhub.com/

## 1. Estado validado

La administración web de Planmed funciona por ahora. Se confirmó
visualmente que `/` y `/testimonios` cargan, pero el encabezado superior
cambia entre vistas: en una captura no aparece "Recomendaciones" y en
otra sí aparece ese menú desplegable. Hay que investigar la causa en el
código; las capturas no permiten saber si son layouts diferentes,
componentes duplicados o condiciones por ruta.

Objetivo inmediato: consolidar el header/nav para que sea consistente en
todas las páginas públicas, salvo diferencias expresamente aprobadas.
Probar desktop, móvil, navegación interna, URL directa y recarga.

Rutas observadas: - `https://planmed.wellezyhub.com/` -
`https://planmed.wellezyhub.com/testimonios`

## 2. Permisos habilitados en Wellezy Hub

Se asignaron directamente en la base de datos `wellezy` del Hub, sin
ejecutar el seeder. La aplicación reporta `APP_ENV=production`, por lo
que estos cambios son persistentes en el entorno productivo del Hub,
aunque el objetivo funcional sea probar Planmed UAT.

Usuario: - `users.id = 20` - `disenadoraplanmed@gmail.com` -
`personnel.id = 17` - `linea_id = 3`, `company_id = 3` -
`is_superadmin = false`

Rol agregado: - `Administrador de contenido de línea`, `roles.id = 20` -
Se conservó el rol `Diseñador gráfico`; no se reemplazaron los roles
existentes. - Los 16 permisos efectivos fueron comprobados con
`User::hasPermission()` y todos devolvieron `true`.

Permisos asignados: - `cirugias.ver`, `cirugias.crear`,
`cirugias.editar`, `cirugias.eliminar` - `blog.ver`, `blog.crear`,
`blog.editar`, `blog.eliminar` - `pacientes_web.ver`,
`pacientes_web.crear`, `pacientes_web.editar`,
`pacientes_web.eliminar` - `recomendaciones.ver`,
`recomendaciones.crear`, `recomendaciones.editar`,
`recomendaciones.eliminar`

Implementación propia del Hub: - Modelos `App\Models\Role`,
`App\Models\Permission`. - Tablas `role_user(user_id, role_id)` y
`permission_role(role_id, permission_id)`. - Servicio de permisos:
`App\Services\RolePermissionService::syncPermissions()`. - Caché:
`App\Services\PermissionService`, clave `user_permissions_{id}`. -
Existe `database/seeders/ContentAdminRoleSeeder.php`, pero no se
ejecutó. - No se otorgó superadministrador ni permisos de gestión de
usuarios/roles. - Las políticas del Hub deben seguir restringiendo
operaciones a la línea correspondiente.

No volver a ejecutar escrituras/seeders en el Hub sin verificar la base
y el estado actuales. No modificar el rol `Diseñador gráfico`.

## 3. Incidencia de "Nuestros Pacientes"

Error inicial observado:
`PUT https://planmed.wellezyhub.com/api/admin/patient-section` → `403`,
con mensaje genérico "No tienes permiso para realizar esta acción.
Algunos cambios sí se guardaron...".

La operación de frontend `applyContent()` coordina lectura/actualización
de `patient-section`, `testimonial-embeds` y `before-after-cases`,
incluyendo crear, editar, eliminar y reordenar. Al usuario le faltaban
permisos de creación y eliminación; el rol nuevo contiene
`pacientes_web.crear` y `pacientes_web.eliminar`, además de los permisos
CRUD de los otros módulos.

Después de la asignación se confirmó visualmente que `/testimonios`
carga y presenta "Pacientes felices" con las opciones "Videos", "Antes y
después" y "Programa de referidos". Esto no sustituye las pruebas CRUD
reales: probar crear, editar, eliminar, guardar y recargar.

## 4. Entornos conocidos

-   Planmed producción: `/var/www/planmed-web`, PM2 `planmed-web`,
    puerto `3003`.
-   Planmed UAT: `/var/www/planmed-web-next`, PM2 `planmed-web-next`,
    puerto `3004`.
-   UAT público: `https://planmed.wellezyhub.com/`.
-   Hub: `/var/www/wellezy-hub-2`.
-   Crediestética Nuxt: `/var/www/crediestetica-web/cliniplanes-web`,
    PM2 `crediestetica-web`, puerto `3001`.
-   VPS compartido con Nginx Proxy Manager en Docker.

**Regla:** trabajar y validar primero en UAT. No tocar
`/var/www/planmed-web` ni `https://planmed.com.co/` sin aceptación de
UAT y autorización expresa.

## 5. Replicar en Crediestética: diferencias obligatorias

Planmed sirve como referencia de UX, pero no debe copiarse sin adaptar
las decisiones aprobadas:

-   Replicar la experiencia administrativa de Planmed en Crediestética,
    **sin incluir Noticias**.
-   Conservar el login integrado de Crediestética con Wellezy Hub/CRM.
-   No romper la integración existente con el CRM.
-   En el catálogo de procedimientos, preservar la arquitectura y
    permitir habilitar procedimientos desde CRM o directamente en el
    panel según lo aprobado.
-   Para la fase aprobada de Crediestética se permite un catálogo local
    temporal; la conexión CRM se conserva, pero puede quedar desactivada
    de forma reversible.
-   No introducir `origin`, `owner_linea` ni sincronización en esa fase
    si no existe nueva aprobación.
-   Desactivar procedimientos en vez de borrarlos.

### Patrón de login Crediestética → Hub ya identificado

1.  Endpoint Nuxt server `POST /api/auth/login`.
2.  Llamada server-side a `https://wellezyhub.com/api/auth/login` con
    email, contraseña, compañía y línea.
3.  El Hub valida usuario, Personal, Empresa y Línea.
4.  Nuxt crea sesión local `HttpOnly`; el token Hub no debe exponerse al
    navegador.
5.  Archivos/patrones existentes a revisar antes de copiar:
    `server/api/auth/{login,logout,me,password}`,
    `server/utils/{hub,auth,validation}`, `composables/useAuth.ts`,
    `middleware/admin-auth.ts`, `pages/login.vue`,
    `pages/admin/cuenta.vue`.

En Crediestética ya existe integración web/CRM con `useTenantApi`,
headers de tenant y endpoints `/web/cirugias` y
`/web/categorias-cirugias`. Planmed ha utilizado catálogo mock en
`data/procedures.ts`; no asumir que ambas fuentes son equivalentes.
Mantener la separación UI → Service → Provider y no eliminar el
proveedor CRM.

## 6. Plan para corregir el menú de Planmed

1.  Identificar el layout público y todos los componentes que renderizan
    el header.
2.  Comparar `/`, `/testimonios`, `/procedimientos`, `/noticias`,
    `/recursos` y `/nosotros`.
3.  Detectar headers duplicados, layouts alternos y condiciones por
    ruta/estado.
4.  Centralizar el header en componente/layout compartido cuando
    corresponda.
5.  Mantener diseño, colores, tipografía, enlaces y comportamiento
    responsive aprobados.
6.  Validar desktop y móvil; navegación interna, URL directa y recarga.
7.  No modificar reglas del simulador ni el catálogo como parte de este
    arreglo.

## 7. Lista de aceptación

### Planmed

-   [ ] Corregir la inconsistencia del header en UAT.
-   [ ] Probar desktop y móvil en varias rutas.
-   [ ] Probar CRUD real de Cirugías, Nuestros Pacientes y
    Recomendaciones.
-   [ ] Probar Noticias solo donde corresponda en Planmed.
-   [ ] Recargar y comprobar persistencia.
-   [ ] Diagnosticar cualquier `403` por endpoint y permiso; no ampliar
    privilegios indiscriminadamente.
-   [ ] Ejecutar lint/build/tests disponibles antes de considerar el
    cambio terminado.

### Crediestética

-   [ ] Auditar el repositorio actual antes de editar.
-   [ ] Replicar UX administrativa sin Noticias.
-   [ ] Preservar el login con Wellezy Hub y la sesión local `HttpOnly`.
-   [ ] Preservar la integración CRM y la opción de catálogo local
    temporal reversible.
-   [ ] Desactivar procedimientos en vez de eliminarlos.
-   [ ] No añadir `origin`, `owner_linea` o sincronización sin
    aprobación.
-   [ ] Verificar permisos y restricciones por línea; no usar
    superadministrador.
-   [ ] Informar archivos modificados, pruebas y riesgos.
-   [ ] No desplegar a producción sin autorización.

## 8. Prompt inicial para Claude

> Lee este documento completo antes de modificar el proyecto. Primero
> audita el estado real del repositorio de Crediestética y del de
> Planmed si está disponible. No supongas que comparten componentes ni
> sobrescribas autenticación o integración CRM. Primero corrige la
> inconsistencia del menú entre páginas de Planmed, valida en UAT y
> documenta el header/layout compartido. Después usa Planmed como
> referencia UX para la administración de Crediestética, sin Noticias,
> preservando el login integrado con Wellezy Hub y el comportamiento
> aprobado del catálogo. Haz cambios mínimos, explica el plan antes de
> editar y no despliegues a producción sin autorización.

## 9. Pendientes

-   Investigar la causa exacta de la variación del menú entre `/` y
    `/testimonios`.
-   Completar pruebas CRUD reales de administración.
-   Comprobar si persisten otros `403`.
-   Recordar que los permisos se modificaron en la base `wellezy` del
    Hub con `APP_ENV=production`.

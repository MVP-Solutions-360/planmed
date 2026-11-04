# 17 · IMPORTANTE — Asesoras financieras sin acceso al panel: `linea_id` NULL en Wellezy Hub (2026-11-04)

> Corrección crítica hecha en el repo del Hub (`C:\xampp\htdocs\laravel\wellezy-hub-2`), no en planmed-web. Detalle completo:
> `docs/cambios-importantes/2026-11-04-personnel-linea-id-se-perdia.md` (en el Hub).

**Síntoma:** `POST /api/auth/login` → 403 «No tienes acceso al panel administrativo de Planmed» para asesoras financieras y cualquier usuario nuevo;
solo entraban el superadmin y la diseñadora.

**Cómo se aprueba el acceso (verificado en código):** Hub `ApiAccessService::validateAccess` exige Personnel **activo** con `company_id` y `linea_id` de
`planmed/planmed` (o `users.is_superadmin`). Después planmed-web (`server/utils/auth.ts`, `isAuthorizedUser`) exige que `company.slug`/`line.slug` devueltos sean
`planmed`/`planmed`. El rol no interviene; `NUXT_PLANMED_ADMIN_ROLE_IDS` no decide el acceso.

**Causa:** el formulario de Personal del Hub borraba `linea_id` (`updatedCompanyId()` → null) al reenviarse la Empresa; el Personnel quedaba con línea NULL.
Local: personnels.id 18 (asesor.prueba) con `linea_id` NULL; los que entran tienen `linea_id = 3`.

**Estado:** corregido en el Hub (trait `KeepsCompanyScopedSelections`, sin commit, sin desplegar). Verificado solo con Livewire en memoria.
**Pendiente:** desplegar en el Hub de producción; asignar la línea a los Personnel afectados; auditar `personnels.linea_id IS NULL` en PD; prueba de regresión.
No se tocó planmed-web para este arreglo.

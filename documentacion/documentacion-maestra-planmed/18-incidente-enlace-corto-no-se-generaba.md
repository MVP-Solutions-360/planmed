# 18 · IMPORTANTE — «Copiar enlace» copiaba la URL larga: el Hub no generaba enlaces cortos (2026-11-04)

> El arreglo fue de DATOS en el Hub local, no de código de planmed-web. Detalle completo:
> `docs/cambios-importantes/2026-11-04-enlaces-cortos-sin-dominio-primario.md` en `C:\xampp\htdocs\laravel\wellezy-hub-2`.

**Cómo funciona (verificado):** `components/common/ShareActions.vue` + `shared/utils/share.ts` usan SOLO el `short_url` que devuelve el Hub; sin él copian la URL de la página
y muestran «Copiar enlace» (con enlace corto: «Copiar enlace corto»). La web nunca construye el enlace corto.

**Causa:** el Hub solo genera enlaces si la línea tiene un dominio primario activo en `linea_domains`; estaba vacía → `short_links` vacía → `short_url = null`.

**Aplicado en local:** dominio `localhost:3000` para la línea `planmed` y `short-links:backfill --linea=planmed` (14 enlaces creados). Cadena probada: `go.localhost:8000/{código}` → 302 →
`/recomendaciones/{slug}` → 301 → `/recomendaciones/{tema}/{slug}` → 200. Sin probar el clic en navegador.

**Pendiente en producción:** dominio primario real de la línea, dominio neutral del acortador (`SHORT_LINKS_DOMAIN`), backfill, con autorización. Plantilla jerárquica de subtemas sigue desactivada
(funciona con un 301 extra). Crediestética sigue sin enlaces cortos a propósito.

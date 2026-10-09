import type { H3Event } from 'h3'

// Defensa CSRF adicional a SameSite=Lax: toda mutación (POST/PUT/PATCH/DELETE) debe demostrar que viene del mismo origen.
// Falla CERRADO: una mutación sin ninguna señal de origen se rechaza (PM-SEC-01). Los navegadores siempre envían `Origin` en
// POST/PUT/PATCH/DELETE (y `Sec-Fetch-Site` y `Referer` como respaldo), así que el uso legítimo no se ve afectado.
//
// Orden de decisión:
//  1. `Origin` presente => su host debe coincidir con el host de la petición (`Origin: null` y orígenes inválidos se rechazan).
//  2. Sin `Origin`, `Sec-Fetch-Site` presente => solo `same-origin`.
//  3. Sin ambos, `Referer` presente => su host debe coincidir.
//  4. Sin ninguna señal => 403.
export function assertSameOrigin(event: H3Event) {
  const method = event.method
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return

  const host = getRequestHeader(event, 'x-forwarded-host') || getRequestHeader(event, 'host')
  const denied = () => authError(403, 'Origen no permitido')
  const hostOf = (url: string) => { try { return new URL(url).host } catch { return '' } }

  const origin = getRequestHeader(event, 'origin')
  if (origin) {
    if (!host || hostOf(origin) !== host) throw denied()
    return
  }

  const site = getRequestHeader(event, 'sec-fetch-site')
  if (site) {
    if (site !== 'same-origin') throw denied()
    return
  }

  const referer = getRequestHeader(event, 'referer')
  if (referer) {
    if (!host || hostOf(referer) !== host) throw denied()
    return
  }

  throw denied()
}

// IP del cliente para los límites de peticiones. Módulo PURO (sin imports): lo usa la ruta de Nitro y las pruebas.
//
// `X-Forwarded-For` lo escribe cualquiera: el navegador puede enviarlo con valores inventados y un proxy bien configurado SOLO AÑADE al final
// la dirección que él vio (Nginx Proxy Manager / Nginx: `$proxy_add_x_forwarded_for`). Por eso nunca se usa la primera entrada. Con
// `trustedProxyHops` = N proxies de confianza delante de la aplicación, la IP del cliente es la N-ésima entrada CONTANDO DESDE EL FINAL
// (las anteriores las controla el cliente). Con 0 (valor por defecto, seguro) la cabecera se IGNORA y se usa la dirección del socket.
//
// Supuesto NO verificado desde el código: cuántos proxies hay realmente delante y si el servidor Node solo es alcanzable a través de ellos
// (si fuera alcanzable directamente, cualquiera podría forjar la última entrada). Confirmar la infraestructura antes de subir el valor.

const IP_RE = /^[0-9a-f:.]{2,45}$/i

export function resolveClientIp(peer: string | undefined | null, forwardedFor: string | undefined | null, trustedProxyHops: number): string {
  const socket = peer && IP_RE.test(peer) ? peer : 'unknown'
  const hops = Number.isInteger(trustedProxyHops) && trustedProxyHops > 0 ? Math.min(trustedProxyHops, 5) : 0
  if (!hops || typeof forwardedFor !== 'string' || forwardedFor.length === 0 || forwardedFor.length > 512) return socket

  const chain = forwardedFor.split(',').map(p => p.trim()).filter(Boolean)
  if (chain.length < hops) return socket
  const candidate = chain[chain.length - hops]!
  return IP_RE.test(candidate) ? candidate : socket
}

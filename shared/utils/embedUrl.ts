// Validación de enlaces de YouTube e Instagram para los bloques de las secciones de noticias. Módulo PURO. Espejo de la regla del Hub
// (App\Support\Embeds\EmbedUrl): host en lista blanca + identificador reconocible; devuelve la URL canónica (siempre https). Planmed lo
// vuelve a aplicar al recibir el contrato público: no confía en que una respuesta remota traiga una URL o un embed seguros.

const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com', 'youtu.be']
const INSTAGRAM_HOSTS = ['instagram.com', 'www.instagram.com']

export interface ParsedEmbed { platform: 'youtube' | 'instagram', id: string, url: string }

function youtubeId(host: string, path: string, query: string): string | null {
  let id: string | null = null
  if (host === 'youtu.be') id = path.replace(/^\/+/, '')
  else if (path === '/watch') id = new URLSearchParams(query).get('v')
  else {
    const m = /^\/(?:embed|shorts|live|v)\/([^/?]+)\/?$/.exec(path)
    if (m) id = m[1]!
  }
  return id !== null && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null
}

export function parseEmbedUrl(value: unknown): ParsedEmbed | null {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (raw === '' || raw.length > 2048 || /[\u0000- \u007f]/.test(raw)) return null
  let u: URL
  try { u = new URL(raw) } catch { return null }
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) return null
  if (u.port && !['80', '443'].includes(u.port)) return null

  const host = u.hostname.toLowerCase()
  if (YOUTUBE_HOSTS.includes(host)) {
    const id = youtubeId(host, u.pathname, u.search)
    return id ? { platform: 'youtube', id, url: `https://www.youtube.com/watch?v=${id}` } : null
  }
  if (INSTAGRAM_HOSTS.includes(host)) {
    const m = /^\/(?:[A-Za-z0-9._]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]{5,40})\/?$/.exec(u.pathname)
    if (m) return { platform: 'instagram', id: m[2]!, url: `https://www.instagram.com/${m[1] === 'reels' ? 'reel' : m[1]}/${m[2]}/` }
  }
  return null
}

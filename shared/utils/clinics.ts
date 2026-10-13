// «Clínicas aliadas»: modelo, normalización y validación. Módulo PURO (sin imports), compartido por el navegador (administración),
// el servidor Nitro (rutas /api/{admin,public}/clinics) y las pruebas. Se administra SOLO en la web de Planmed (no en Wellezy Hub).
// Los archivos se suben aparte (POST /api/admin/clinics/upload) y aquí solo se guardan sus URLs públicas.

export interface ClinicFile { url: string, name: string }
export interface ClinicDocument { id: string, title: string, files: ClinicFile[] }
export interface Clinic {
  id: string
  name: string
  /** Texto enriquecido (HTML saneado en el servidor con la lista blanca de utils/richText.ts). */
  description: string
  image: string
  gallery: string[]
  documents: ClinicDocument[]
}
export interface ClinicsContent { clinics: Clinic[], updatedAt: string }
export type ClinicErrors = Record<string, string>

export const CLINIC_MEDIA_PREFIX = '/api/public/clinics/media/'
export const CLINIC_MEDIA_NAME_RE = /^(img|doc)-[a-z0-9-]{6,60}\.(jpg|png|webp|pdf)$/
export const CLINIC_LIMITS = { clinics: 100, name: 200, description: 6000, gallery: 20, documents: 10, filesPerDocument: 5, docTitle: 200, fileName: 120 } as const
// (el export siguiente a un `as const` no lo detecta el auto-import de Nitro: no poner aquí nada que use el servidor)
export const CLINIC_IMAGE_EXT = ['jpg', 'png', 'webp']

export function clinicsDefault(): ClinicsContent { return { clinics: [], updatedAt: '' } }

// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const text = (v: unknown) => (typeof v === 'string' ? v.replace(CONTROL_RE, '').replace(/\r\n?/g, '\n').trim() : '')
const ID_RE = /^[a-z0-9-]{1,40}$/

export function isClinicMediaUrl(v: unknown, kinds: ('img' | 'doc')[] = ['img', 'doc']): boolean {
  if (typeof v !== 'string' || !v.startsWith(CLINIC_MEDIA_PREFIX)) return false
  const name = v.slice(CLINIC_MEDIA_PREFIX.length)
  return CLINIC_MEDIA_NAME_RE.test(name) && kinds.includes(name.slice(0, 3) as 'img' | 'doc')
}
const isImageUrl = (v: unknown) => isClinicMediaUrl(v, ['img'])

function uniqueId(raw: unknown, i: number, seen: Set<string>, prefix: string) {
  let id = typeof raw === 'string' && ID_RE.test(raw) ? raw : `${prefix}-${i + 1}`
  while (seen.has(id)) id = `${id}-${i + 1}`.slice(0, 40)
  seen.add(id)
  return id
}

/** Convierte cualquier entrada en un ClinicsContent bien formado (sin conservar valores ajenos). */
export function normalizeClinics(raw: any, fallback: ClinicsContent = clinicsDefault()): ClinicsContent {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  const source: any[] | null = Array.isArray(r.clinics) ? r.clinics : null
  const seen = new Set<string>()
  const clinics: Clinic[] = source
    ? source.filter(c => c && typeof c === 'object').map((c, i) => {
        const dseen = new Set<string>()
        return {
          id: uniqueId(c.id, i, seen, 'clinica'),
          name: text(c.name),
          description: typeof c.description === 'string' ? c.description.replace(CONTROL_RE, '').trim() : '',
          image: text(c.image),
          gallery: (Array.isArray(c.gallery) ? c.gallery : []).map(text).filter(Boolean),
          documents: (Array.isArray(c.documents) ? c.documents : []).filter((d: any) => d && typeof d === 'object').map((d: any, j: number) => ({
            id: uniqueId(d.id, j, dseen, 'doc'),
            title: text(d.title),
            files: (Array.isArray(d.files) ? d.files : []).filter((x: any) => x && typeof x === 'object').map((x: any) => ({ url: text(x.url), name: text(x.name).slice(0, CLINIC_LIMITS.fileName) }))
          }))
        }
      })
    : fallback.clinics.map(c => structuredClone(c))
  return { clinics, updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : fallback.updatedAt }
}

/** Validación: { 'clinics.0.name': mensaje }. Un documento (título + archivos) solo es obligatorio si existe. */
export function validateClinics(c: ClinicsContent): ClinicErrors {
  const e: ClinicErrors = {}
  if (c.clinics.length > CLINIC_LIMITS.clinics) e.clinics = `Máximo ${CLINIC_LIMITS.clinics} clínicas.`
  c.clinics.forEach((cl, i) => {
    const k = `clinics.${i}`, n = i + 1
    if (!cl.name) e[`${k}.name`] = `Clínica ${n}: el nombre es obligatorio.`
    else if (cl.name.length > CLINIC_LIMITS.name) e[`${k}.name`] = `Clínica ${n}: el nombre admite máximo ${CLINIC_LIMITS.name} caracteres.`
    if (!cl.description.replace(/<[^>]*>/g, '').trim()) e[`${k}.description`] = `Clínica ${n}: la descripción es obligatoria.`
    else if (cl.description.length > CLINIC_LIMITS.description) e[`${k}.description`] = `Clínica ${n}: la descripción admite máximo ${CLINIC_LIMITS.description} caracteres.`
    if (!cl.image) e[`${k}.image`] = `Clínica ${n}: la imagen principal es obligatoria.`
    else if (!isImageUrl(cl.image)) e[`${k}.image`] = `Clínica ${n}: la imagen principal no es válida.`
    if (cl.gallery.length > CLINIC_LIMITS.gallery) e[`${k}.gallery`] = `Clínica ${n}: máximo ${CLINIC_LIMITS.gallery} imágenes en la galería.`
    if (cl.gallery.some(g => !isImageUrl(g))) e[`${k}.gallery`] = `Clínica ${n}: hay una imagen de la galería no válida.`
    if (cl.documents.length > CLINIC_LIMITS.documents) e[`${k}.documents`] = `Clínica ${n}: máximo ${CLINIC_LIMITS.documents} documentos.`
    cl.documents.forEach((d, j) => {
      const dk = `${k}.documents.${j}`, dn = j + 1
      if (!d.title) e[`${dk}.title`] = `Clínica ${n}, documento ${dn}: el título es obligatorio.`
      else if (d.title.length > CLINIC_LIMITS.docTitle) e[`${dk}.title`] = `Clínica ${n}, documento ${dn}: el título admite máximo ${CLINIC_LIMITS.docTitle} caracteres.`
      if (!d.files.length) e[`${dk}.files`] = `Clínica ${n}, documento ${dn}: carga al menos un archivo (PDF o imagen).`
      else if (d.files.length > CLINIC_LIMITS.filesPerDocument) e[`${dk}.files`] = `Clínica ${n}, documento ${dn}: máximo ${CLINIC_LIMITS.filesPerDocument} archivos.`
      else if (d.files.some(x => !isClinicMediaUrl(x.url))) e[`${dk}.files`] = `Clínica ${n}, documento ${dn}: hay un archivo no válido.`
    })
  })
  return e
}

/** Todas las URLs de archivos propios referenciadas por el contenido (para limpiar los que dejan de usarse). */
export function clinicMediaUrls(c: ClinicsContent): string[] {
  const out: string[] = []
  for (const cl of c.clinics) {
    out.push(cl.image, ...cl.gallery)
    for (const d of cl.documents) out.push(...d.files.map(f => f.url))
  }
  return out.filter(u => isClinicMediaUrl(u))
}

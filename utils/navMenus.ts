// Menús desplegables de la barra de navegación (NUESTROS PACIENTES y RECOMENDACIONES), como función pura para poder probarla.
// Las entradas salen SOLO de lo que Wellezy Hub entrega públicamente para la línea de Planmed:
//  - RECOMENDACIONES: ÚNICAMENTE el árbol vigente (temas principales publicados con sus subtemas publicados, en el orden del Hub): cada
//    tema es una entrada y sus subtemas cuelgan de él; un subtema NUNCA aparece como entrada suelta ni repetido. Las páginas del
//    contrato histórico y los grupos por procedimiento («cuidados»/«revisión») YA NO construyen este menú: con el árbol convivían con
//    los temas y los duplicaban (mismos textos, otra fuente). Siguen existiendo como rutas (/recomendaciones/cuidados/…) y en los
//    listados por procedimiento, pero no en el menú,
//  - visibilidad de videos y de antes/después de «Nuestros Pacientes».
// Un tema sin subtemas utilizables no genera entrada y un menú sin entradas no se muestra.

export interface MenuItem { to: string, label: string, children?: MenuItem[] }
export interface Menu { label: string, to: string, items: MenuItem[], flip?: boolean }

export interface MenuInput {
  visibility: { videos: boolean, beforeAfter: boolean }
  /** Árbol de recomendaciones de la API pública (`recommendation-topics`). */
  topics?: Array<{ slug: string, menuLabel: string, subtopics: Array<{ slug: string, menuLabel: string }> }>
}

const PATIENTS_ITEMS = [
  { to: '/testimonios', label: 'Videos', key: 'videos' },
  { to: '/testimonios/antes-y-despues', label: 'Antes y después', key: 'beforeAfter' },
  { to: '/testimonios/programa-de-referidos', label: 'Programa de referidos', key: null }
] as const

export function buildMenus(input: MenuInput): Menu[] {
  // Una entrada sin texto o sin slug no genera enlace (sin enlaces vacíos).
  const usable = (x: { slug?: string, menuLabel?: string }) => typeof x.slug === 'string' && x.slug !== '' && typeof x.menuLabel === 'string' && x.menuLabel.trim() !== ''
  const seen = new Set<string>()
  const topicItems: MenuItem[] = (input.topics ?? []).filter(usable).flatMap((t) => {
    const children: MenuItem[] = []
    for (const s of t.subtopics.filter(usable)) {
      if (seen.has(s.slug)) continue // el mismo subtema no se incorpora dos veces
      seen.add(s.slug)
      children.push({ to: `/recomendaciones/${t.slug}/${s.slug}`, label: s.menuLabel.trim() })
    }
    return children.length ? [{ to: `/recomendaciones/${t.slug}`, label: t.menuLabel.trim(), children }] : []
  })

  const menus: Menu[] = [
    {
      label: 'NUESTROS PACIENTES',
      to: '/testimonios',
      items: PATIENTS_ITEMS.filter(i => !i.key || input.visibility[i.key]).map(i => ({ to: i.to, label: i.label }))
    },
    {
      label: 'RECOMENDACIONES',
      to: topicItems[0]?.to ?? '/recomendaciones',
      flip: true,
      items: topicItems
    }
  ]
  return menus.filter(m => m.items.length)
}

// Desplegable de PROCEDIMIENTOS: una entrada por procedimiento de la lista pública de Hub (activos y habilitados para la línea),
// con el slug real en el enlace. Sin procedimientos (lista vacía o Hub caído) no hay desplegable: queda el enlace simple.
export function buildProcedureMenu(procedures: Array<{ slug: string, name: string }>): MenuItem[] {
  return procedures
    .filter(p => typeof p.slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug) && typeof p.name === 'string' && p.name.trim() !== '')
    .map(p => ({ to: `/procedimientos/${p.slug}`, label: p.name.trim() }))
}

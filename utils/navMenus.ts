// Menús desplegables de la barra de navegación (NUESTROS PACIENTES y RECOMENDACIONES), como función pura para poder probarla.
// Las entradas salen SOLO de lo que Wellezy Hub entrega públicamente para la línea de Planmed:
//  - páginas de recomendaciones publicadas (el Hub no entrega las ocultas),
//  - procedimientos activos y habilitados en la línea (la lista pública) con el indicador de que tienen ese texto,
//  - visibilidad de videos y de antes/después de «Nuestros Pacientes».
// Un grupo sin entradas no genera submenú, y un menú sin entradas no se muestra.

export interface MenuItem { to: string, label: string, children?: MenuItem[] }
export interface Menu { label: string, to: string, items: MenuItem[], flip?: boolean }

export interface MenuInput {
  visibility: { videos: boolean, beforeAfter: boolean }
  pages: Array<{ slug: string, group: string, menuLabel: string, procedureSlug?: string | null }>
  procedures: Array<{ slug: string, name: string, [flag: string]: unknown }>
}

export interface MenuKind { menuLabel: string, flag: string, itemLabel: (name: string) => string }

const PATIENTS_ITEMS = [
  { to: '/testimonios', label: 'Videos', key: 'videos' },
  { to: '/testimonios/antes-y-despues', label: 'Antes y después', key: 'beforeAfter' },
  { to: '/testimonios/programa-de-referidos', label: 'Programa de referidos', key: null }
] as const

export function buildMenus(input: MenuInput, kinds: Record<'cuidados' | 'revision', MenuKind>): Menu[] {
  const pageLink = (p: { slug: string, menuLabel: string }): MenuItem => ({ to: `/recomendaciones/${p.slug}`, label: p.menuLabel })

  // Cuidados y revisión: una entrada por procedimiento con ese texto + las páginas independientes de ese grupo.
  const procedureGroup = (kind: 'cuidados' | 'revision'): MenuItem[] => {
    const meta = kinds[kind]
    const children: MenuItem[] = [
      ...input.procedures.filter(p => p[meta.flag] === true).map(p => ({ to: `/recomendaciones/${kind}/${p.slug}`, label: meta.itemLabel(p.name) })),
      // Una página vinculada a un procedimiento ya está representada por la entrada de ese procedimiento (que apunta a su contenido).
      ...input.pages.filter(p => p.group === kind && !p.procedureSlug).map(pageLink)
    ]
    return children.length ? [{ to: `/recomendaciones/${kind}`, label: meta.menuLabel, children }] : []
  }

  const menus: Menu[] = [
    {
      label: 'NUESTROS PACIENTES',
      to: '/testimonios',
      items: PATIENTS_ITEMS.filter(i => !i.key || input.visibility[i.key]).map(i => ({ to: i.to, label: i.label }))
    },
    {
      label: 'RECOMENDACIONES',
      to: '/recomendaciones/cita-preanestesia',
      flip: true,
      items: [
        ...input.pages.filter(p => p.group === 'general' && !p.procedureSlug).map(pageLink),
        ...procedureGroup('cuidados'),
        ...procedureGroup('revision')
      ]
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

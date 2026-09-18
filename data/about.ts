export interface AboutSection {
  id: string;
  title: string;
  content: string[];
}

export const aboutData: AboutSection[] = [
  {
    id: 'nuestra-trayectoria',
    title: '5 Años de Experiencia',
    content: [
      'Con aproximadamente 5 años en el mercado, Planmed nació con el objetivo de facilitar el acceso a financiación para procedimientos médicos y estéticos.',
      'A lo largo de nuestra trayectoria, nos hemos consolidado como un aliado humano y profesional, permitiendo que miles de personas accedan a sus procedimientos sin fricciones.'
    ]
  },
  {
    id: 'financiacion-directa',
    title: 'Financiación Directa',
    content: [
      'Nuestra principal ventaja es que financiamos directamente sin depender de intermediarios bancarios complejos.',
      'Podemos financiar desde el 50% hasta el 100% del valor de tu procedimiento directamente, para que tu proceso sea lo más fluido posible.'
    ]
  },
  {
    id: 'acompanamiento',
    title: 'Acompañamiento Real',
    content: [
      'Entendemos que cada situación es única. Por eso, evaluamos cada caso de manera personalizada durante nuestro estudio de crédito.',
      'Hacemos que el proceso sea claro y cercano, acompañándote desde la simulación de tu cuota hasta la aprobación y el desembolso directo a tu especialista.'
    ]
  }
];

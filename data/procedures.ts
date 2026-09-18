import type { Procedure } from '~/types/procedure'

export const procedures: Procedure[] = [
  {
    id: '1',
    slug: 'mamoplastia',
    name: 'Mamoplastia',
    category: 'cirugia-corporal',
    shortDescription: 'Procedimiento de contorno corporal orientado a la armonización del área mamaria.',
    whatIsIt: 'La mamoplastia es una intervención estética que debe ser evaluada y ejecutada por profesionales certificados. En Planmed facilitamos el acceso a este procedimiento a través de herramientas de financiación diseñadas para brindarte tranquilidad durante tu proceso.',
    image: '/images/procedures/mamoplastia.jpeg',
    destacado: true,
    galeria: [],
    ficha_tecnica: {
      tipo_anestesia: 'General',
      tiempo_quirurgico: '2 a 3 horas',
      tiempo_recuperacion: '1 a 2 semanas',
      cicatrizacion_minima: false
    },
    perfil_paciente: {
      edad_minima: 18,
      condiciones_medicas_compatibles: 'Buena salud general, sin enfermedades autoinmunes activas'
    },
    seo: {
      meta_title: 'Mamoplastia | Planmed',
      meta_description: 'Financia tu procedimiento de mamoplastia con Planmed.'
    }
  },
  {
    id: '2',
    slug: 'liposuccion',
    name: 'Liposucción',
    category: 'cirugia-corporal',
    shortDescription: 'Procedimiento quirúrgico enfocado en el contorno y la definición corporal.',
    whatIsIt: 'Este procedimiento estético requiere la valoración de un cirujano plástico acreditado para determinar su viabilidad. Nuestro objetivo en Planmed es proporcionarte opciones de pago estructuradas para que puedas concentrarte en tu bienestar.',
    image: '/images/procedures/liposuccion.jpeg',
    destacado: false,
    galeria: [],
    ficha_tecnica: {},
    perfil_paciente: {}
  },
  {
    id: '3',
    slug: 'lipoabdominoplastia',
    name: 'Lipoabdominoplastia',
    category: 'cirugia-corporal',
    shortDescription: 'Procedimiento integral del contorno abdominal para fines estéticos.',
    whatIsIt: 'La lipoabdominoplastia es una cirugía mayor que requiere indicaciones precisas por parte del equipo médico tratante. A través de nuestra plataforma, puedes explorar escenarios de financiación para planificar tu intervención de manera informada.',
    image: '/images/procedures/lipoabdominoplastia.png',
    destacado: true,
    galeria: [],
    ficha_tecnica: {},
    perfil_paciente: {}
  },
  {
    id: '4',
    slug: 'mastopexia',
    name: 'Mastopexia',
    category: 'cirugia-corporal',
    shortDescription: 'Procedimiento quirúrgico de elevación y reposicionamiento mamario.',
    whatIsIt: 'La viabilidad y técnica de esta intervención deben ser establecidas en consulta médica especializada. Utiliza nuestro simulador para proyectar las cuotas mensuales y organizar responsablemente la financiación de tu procedimiento.',
    image: '/images/procedures/mastopexia.jpeg',
    destacado: false,
    galeria: [],
    ficha_tecnica: {},
    perfil_paciente: {}
  }
];
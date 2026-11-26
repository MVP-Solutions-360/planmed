// Documentos legales de /recursos: contenido ESTÁTICO (sin administración) transcrito de los PDF oficiales de `public/images/web/pdf/`.
// El texto es el de cada PDF (solo se dio formato: títulos, listas y párrafos; se corrigieron las marcas de acento que se rompieron
// al extraer el texto). No se reescribe ni se completa el contenido jurídico, tampoco sus erratas. Cada vista ofrece además la descarga del PDF.
// Cuando cambie un documento, se actualiza aquí el texto, se reemplaza el PDF con el MISMO nombre de archivo y, si cambia, el enlace de Drive.

export type ResourceBlock = { p: string } | { list: string[] }
export interface ResourceSection { label: string | null, heading: string | null, blocks: ResourceBlock[] }
export interface ResourceDocument {
  slug: string
  /** Nombre del documento en listas y cabeceras. */
  title: string
  /** Frase descriptiva para la lista de /recursos (no es texto jurídico). */
  description: string
  /** Encabezado tal como aparece en el PDF. */
  documentTitle: string
  /** Ruta pública del PDF (se sirve desde el propio sitio). */
  file: string
  /** Copia del documento en Google Drive. */
  driveUrl: string
  /** Datos de identificación del responsable, tal como figuran en el PDF. */
  facts: [string, string][]
  intro: ResourceBlock[]
  sections: ResourceSection[]
  /** Campos del formato para diligenciar (por filas). */
  fields: string[][]
  closing: string | null
}

export const resourceDocuments: ResourceDocument[] = [
  {
    "slug": "politica-tratamiento-datos",
    "title": "Política de tratamiento de datos personales",
    "description": "Cómo se recolectan, usan y protegen tus datos personales, y cómo ejercer tus derechos como titular.",
    "documentTitle": "POLITICA DE TRATAMIENTO DE DATOS PERSONALES - PLAN MEDICO Y QUIRUGICO SAS",
    "file": "/images/web/pdf/politica-tratamiento-datos.pdf",
    "driveUrl": "https://drive.google.com/file/d/1bVJ_3MyaSR-_1V7ShLXXG-byhj1f_Ic1/view?usp=sharing",
    "facts": [
      [
        "Razón social",
        "PLAN MEDICO Y QUIRUGICO SAS"
      ],
      [
        "Nit",
        "900794105-6"
      ],
      [
        "Dirección",
        "Carrera 43 A Nro. 5 A 113 Oficina 702"
      ],
      [
        "Domicilio",
        "Medellín"
      ],
      [
        "Teléfono",
        "3164821047"
      ],
      [
        "Correo electrónico",
        "linaochoaf@gmail.com"
      ],
      [
        "Página web",
        "http://planmed.com.co/"
      ]
    ],
    "intro": [
      {
        "p": "A continuación, en cumplimiento de la Ley 1581 de 2012, la PLAN MEDICO Y QUIRUGICO SAS, da a conocer sus políticas de tratamiento de datos personales, en los siguientes términos."
      }
    ],
    "sections": [
      {
        "label": "Primero",
        "heading": "Normatividad legal y ámbito de aplicación",
        "blocks": [
          {
            "p": "La presente política de Tratamiento de datos personales es elaborada de conformidad con lo dispuesto en la Constitución Política, la Ley 1581 de 2012, el Decreto Reglamentario 1377 de 2013 y demás disposiciones complementarias y será aplicada por PLAN MEDICO Y QUIRUGICO SAS respecto de la recolección, almacenamiento, uso, circulación, supresión y de todas aquellas actividades que constituyan tratamiento de datos personales."
          }
        ]
      },
      {
        "label": "Segundo",
        "heading": "Definiciones",
        "blocks": [
          {
            "p": "Para efectos de la ejecución de la presente política y de conformidad con la normatividad legal, serán aplicables las siguientes definiciones:"
          },
          {
            "list": [
              "a) Autorización: Consentimiento previo, expreso e informado del Titular para llevar a cabo el Tratamiento de datos personales;",
              "b) Aviso de privacidad: Documento físico, electrónico o en cualquier otro formato generado por el Responsable que se pone a disposición del Titular para el tratamiento de sus datos personales. En el Aviso de Privacidad se comunica al Titular la información relativa a la existencia de las políticas de tratamiento de información que le serán aplicables, la forma de acceder a las mismas y la finalidad del tratamiento que se pretende dar a los datos personales;",
              "c) Base de Datos: Conjunto organizado de datos personales que sea objeto de Tratamiento;",
              "d) Dato personal: Cualquier información vinculada o que pueda asociarse a una o varias personas naturales determinadas o determinables;",
              "e) Dato público: Es el dato calificado como tal según los mandatos de la ley o de la Constitución Política y aquel que no sea semiprivado, privado o sensible. Son públicos, entre otros, los datos relativos al estado civil de las personas, a su profesión u oficio, a su calidad de comerciante o de servidor público y aquellos que puedan obtenerse sin reserva alguna. Por su naturaleza, los datos públicos pueden estar contenidos, entre otros, en registros públicos, documentos públicos, gacetas y boletines oficiales;",
              "f) Dato privado: Es el dato que por su naturaleza intima o reservada solo es relevante para el titular)Datos sensibles: Se entiende por datos sensibles aquellos que afectan la intimidad del Titular o cuyo uso indebido puede generar su discriminación, tales como aquellos que revelen el origen racial o étnico, la orientación política, las convicciones religiosas o filosóficas, la pertenencia a sindicatos, organizaciones sociales, de derechos humanos o que promueva intereses de cualquier partido político o que garanticen los derechos y garantías de partidos políticos de oposición, así como los datos relativos a la salud, a la vida sexual y los datos biométricos;",
              "h) Encargado del Tratamiento: Persona natural o jurídica, pública o privada, que por sí misma o en asocio con otros, realice el Tratamiento de datos personales por cuenta del Responsable del Tratamiento;",
              "i) Responsable del Tratamiento: Persona natural o jurídica, pública o privada, que por sí misma o en asocio con otros, decida sobre la base de datos y/o el Tratamiento de los datos;",
              "j) Titular: Persona natural cuyos datos personales sean objeto de Tratamiento;",
              "k) Tratamiento: Cualquier operación o conjunto de operaciones sobre datos personales, tales como la recolección, almacenamiento, uso, circulación o supresión de estos."
            ]
          }
        ]
      },
      {
        "label": "Tercero",
        "heading": "Finalidad con la que se efectúa la recolección de datos personales y tratamiento de los mismos",
        "blocks": [
          {
            "p": "PLAN MEDICO Y QUIRUGICO SAS podrá hacer uso de los datos personales para:"
          },
          {
            "list": [
              "a) Ejecutar la relación contractual existente con sus clientes, proveedores y trabajadores, incluida el pago de obligaciones contractuales;",
              "b) Proveer los servicios requeridos por sus usuarios;",
              "c) Informar sobre nuevos productos o servicios y/o sobre cambios en los mismos;",
              "d) Evaluar la calidad del servicio;",
              "e) Enviar al correo físico, electrónico, celular o dispositivo móvil, vía mensajes de texto (SMS y/o MMS) o a través de cualquier otro medio análogo y/o digital de comunicación creado o por crearse, información comercial, publicitaria o promocional sobre los productos, eventos y/o promociones de tipo comercial o no de estas, con el fin de impulsar, invitar, dirigir, ejecutar, informar y de manera general, llevar a cabo campañas o promociones de carácter comercial o publicitario, adelantados por PLAN MEDICO Y QUIRUGICO SAS y/o por terceras personas;",
              "f) Desarrollar el proceso de selección, evaluación, y vinculación laboral;",
              "g) Soportar procesos de auditoría interna o externa;",
              "h) Registrar la información de empleados y/o pensionados (activos e inactivos) en las bases de datos de PLAN MEDICO Y QUIRUGICO SAS ]:",
              "i) Los indicados en la autorización otorgada por el titular del dato o descritos en el aviso de privacidad respectivo, según sea el caso;",
              "j) Suministrar, compartir, enviar o entregar sus datos personales a empresas filiales, vinculadas, o subordinadas de PLAN MEDICO Y QUIRUGICO SAS . ubicadas en Colombia o cualquier otro país en el evento que dichas compañías requieran la información para los fines aquí indicados."
            ]
          },
          {
            "p": "Respecto de los datos (i) recolectados directamente en los puntos de seguridad, (ii) tomados de los documentos que suministran las personas al personal de seguridad o de entrada y (iii) obtenidos de las videograbaciones que se realizan dentro o fuera de las instalaciones de PLAN MEDICO Y QUIRUGICO SAS, estos se utilizarán para fines de seguridad de las personas, los bienes e instalaciones de PLAN MEDICO Y QUIRUGICO SAS y podrán ser utilizados como prueba en cualquier tipo de proceso."
          },
          {
            "p": "Si un dato personal es proporcionado, dicha información será utilizada solo para los propósitos aquí señalados, y por tanto, PLAN MEDICO Y QUIRUGICO SAS no procederá a vender, licenciar, transmitir, o divulgar la misma, salvo que:"
          },
          {
            "list": [
              "(i) exista autorización expresa para hacerlo;",
              "(ii) sea necesario para permitir a los contratistas o agentes prestar los servicios encomendados;",
              "(iii) sea necesario con el fin de proveer nuestros servicios y/o productos;",
              "(iv) sea necesario divulgarla a las entidades que prestan servicios de mercadeo en nombre de PLAN MEDICO Y QUIRUGICO SAS o a otras entidades con las cuales se tengan acuerdos de mercado conjunto;",
              "(v) la información tenga relación con una fusión, consolidación, adquisición, desinversión, u otro proceso de restructuración de la sociedad;",
              "(vi) que sea requerido o permitido por la ley."
            ]
          },
          {
            "p": "PLAN MEDICO Y QUIRUGICO SAS podrá subcontratar a terceros para el procesamiento de determinadas funciones o información. Cuando efectivamente se subcontrate con terceros el procesamiento de información personal o se proporcione información personal a terceros prestadores de servicios, PLAN MEDICO Y QUIRUGICO SAS advierte a dichos terceros sobre la necesidad de proteger dicha información personal con medidas de seguridad apropiadas, se prohíbe el uso de la información para fines propios y se solicita que no se divulgue la información personal a otros."
          }
        ]
      },
      {
        "label": "Cuarto",
        "heading": "Principios aplicables al tratamiento de datos personales",
        "blocks": [
          {
            "p": "El tratamiento de datos personales en PLAN MEDICO Y QUIRUGICO SAS se regirá por los siguientes principios:"
          },
          {
            "list": [
              "a) Principio de finalidad: El Tratamiento de los datos personales recogidos debe obedecer a una finalidad legitima, la cual debe ser informada al Titular;",
              "b) Principio de libertad: El Tratamiento solo puede llevarse a cabo con el consentimiento, previo, expreso e informado del Titular. Los datos personales no podrán ser obtenidos o divulgados sin previa autorización, o en ausencia de mandato legal o judicial que releve el consentimiento;",
              "c) Principio de veracidad o calidad: La información sujeta a Tratamiento debe ser veraz, completa, exacta, actualizada, comprobable y comprensible. No será efectuado el Tratamiento de datos parciales, incompletos, fraccionados o que induzcan a error;",
              "d) Principio de transparencia: En el Tratamiento debe garantizarse el derecho del Titular a obtener de PLAN MEDICO Y QUIRUGICO SAS en cualquier momento y sin restricciones, información acerca de la existencia de datos que le conciernan;",
              "e) Principio de acceso y circulación restringida: que se derivan de la naturaleza de los datos personales, de las disposiciones de la Ley 1581 de 2012 y la Constitución. Los datos personales, salvo la información pública, y lo dispuesto en la autorización El Tratamiento se sujeta a los limites otorgada por el titular del dato, no podrán estar disponibles en Internet u otros medios de divulgación o comunicación masiva, salvo que el acceso sea técnicamente controlable para brindar un conocimiento restringido solo a los Titulares o terceros autorizados;",
              "f) Principio de seguridad: La información sujeta a Tratamiento por parte de PLAN MEDICO Y QUIRUGICO SAS se deberá proteger mediante el uso de las medidas técnicas, humanas y administrativas que sean necesarias para otorgar seguridad a los registros evitando su adulteración, perdida, consulta, uso o acceso no autorizado o fraudulento;",
              "g) Principio de confidencialidad: Todas las personas que intervengan en el Tratamiento de datos personales están obligadas a garantizar la reserva de la información, inclusive después de finalizada su relación con alguna de las labores que comprende el Tratamiento."
            ]
          },
          {
            "p": "Nota: En el evento que se recolecten datos personales sensibles, el Titular podrá negarse a autorizar su Tratamiento."
          }
        ]
      },
      {
        "label": "Quinto",
        "heading": "Derechos de los titulares de datos personales objeto de tratamiento por parte de PLAN MEDICO Y QUIRUGICO SAS",
        "blocks": [
          {
            "p": "Los titulares de datos personales por sí o por intermedio de su representante y/o apoderado o su causahabiente podrán ejercer los siguientes derechos, respecto de los datos personales que sean objeto de tratamiento por parte de PLAN MEDICO Y QUIRUGICO SAS :"
          },
          {
            "list": [
              "a) Derecho de acceso: En virtud del cual podrá acceder a los datos personales que estén bajo el control de PLAN MEDICO Y QUIRUGICO SAS , para efectos de consultarlos de manera gratuita al menos una vez cada mes calendario, y cada vez que existan modificaciones sustanciales de las Políticas de Tratamiento de la información que motiven nuevas consultas;",
              "b) Derecho de actualización, rectificación y supresión: En virtud del cual podrá solicitar la actualización, rectificación y/o supresión de los datos personales objeto de tratamiento, de tal manera que se satisfagan los propósitos del tratamiento;",
              "c) Derecho a solicitar prueba de la autorización: salvo en los eventos en los cuales, según las normas legales vigentes, no se requiera de la autorización para realizar el tratamiento;",
              "d) Derecho a ser informado respecto del uso del dato personal;",
              "e) Derecho a presentar quejas ante la Superintendencia de Industria y Comercio: por infracciones a lo dispuesto en la normatividad vigente sobre tratamiento de datos personales;",
              "f) Derecho a requerir el cumplimiento de las ordenes emitidas por la Superintendencia de Industria y Comercio."
            ]
          },
          {
            "p": "PARÁGRAFO PRIMERO: Para efectos del ejercicio de los derechos antes descritos tanto el titular como la persona que lo represente deberá demostrar su identidad y, de ser el caso, la calidad en virtud de la cual representa al titular."
          },
          {
            "p": "PARÁGRAFO SEGUNDO: Los derechos de los menores de edad serán ejercidos por medio de las personas que estén facultadas para representarlos."
          }
        ]
      },
      {
        "label": "Sexto",
        "heading": "Deberes de PLAN MEDICO Y QUIRUGICO SAS",
        "blocks": [
          {
            "p": "Todos los obligados a cumplir esta política deben tener presente que PLAN MEDICO Y QUIRUGICO SAS. está obligada a cumplir los deberes que al respecto imponga la ley. En consecuencia, se deben cumplir las siguientes obligaciones:"
          },
          {
            "p": "A. Deberes cuando actúa como Responsable:"
          },
          {
            "list": [
              "(i) Solicitar y conservar, en las condiciones previstas en esta política, copia de la respectiva autorización otorgada por el titular.",
              "(ii) Informar de manera clara y suficiente al titular sobre la finalidad de la recolección y los derechos que le asisten por virtud de la autorización otorgada.",
              "(iii) Informar a solicitud del titular sobre el uso dado a sus datos personales",
              "(iv) Tramitar las consultas y reclamos formulados en los términos señalados en la presente política",
              "(v) Procurar que los principios de veracidad, calidad, seguridad y confidencialidad en los términos establecidos en la siguiente política",
              "(vi) -Conservar la información bajo las condiciones de seguridad necesarias para impedir su adulteración, perdida, consulta, uso o acceso no autorizado o fraudulento.",
              "(vii) Actualizar la información cuando sea necesario.",
              "(viii) Rectificar los datos personales cuando ello sea procedente."
            ]
          },
          {
            "p": "B. Deberes cuando obra como Encargado del tratamiento de datos personales. Si realiza el tratamiento de datos en nombre de otra entidad u organización (Responsable del tratamiento) deberá cumplir los siguientes deberes:"
          },
          {
            "list": [
              "(i) Establecer que el Responsable del tratamiento esté autorizado para suministrar los datos personales que tratará como Encargado",
              "(ii) Garantizar al titular, en todo tiempo, el pleno y efectivo ejercicio del derecho de hábeas data.",
              "(iii) Conservar la información bajo las condiciones de seguridad necesarias para impedir su adulteración, pérdida, consulta, uso o acceso no autorizado o fraudulento.",
              "(iv) Realizar oportunamente la actualización, rectificación o supresión de los datos.",
              "(v) Actualizar la información reportada por los Responsables del tratamiento dentro de los cinco (5) días hábiles contados a partir de su recibo.",
              "(vi) Tramitar las consultas y los reclamos formulados por los titulares en los términos señalados en la presente política.",
              "(vii) Registrar en la base de datos la leyenda “reclamo en trámite” en la forma en que se establece en la presente política.",
              "(ix) Insertar en la base de datos la leyenda “información en discusión judicial” una vez notificado por parte de la autoridad competente sobre procesos judiciales relacionados con la calidad del dato personal.",
              "(x) Abstenerse de circular información que esté siendo controvertida por el titular y cuyo bloqueo haya sido ordenado por la Superintendencia de Industria y Comercio.",
              "(xi) Permitir el acceso a la información únicamente a las personas autorizadas por el titular o facultadas por la ley para dicho efecto.",
              "(xii) Informar a la Superintendencia de Industria y Comercio cuando se presenten violaciones a los códigos de seguridad y existan riesgos en la administración de la información de los titulares.",
              "(xiii) Cumplir las instrucciones y requerimientos que imparta la Superintendencia de Industria y Comercio."
            ]
          },
          {
            "p": "C. Deberes cuando realiza el tratamiento a través de un Encargado"
          },
          {
            "list": [
              "(i) Suministrar al Encargado del tratamiento únicamente los datos personales cuyo tratamiento esté previamente autorizado. Para efectos de la transmisión nacional o internacional de los datos se deberá suscribir un contrato de transmisión de datos personales o pactar cláusulas contractuales según lo establecido en el artículo 25 del decreto 1377 de 2013.",
              "(ii) Garantizar que la información que se suministre al Encargado del tratamiento sea veraz, completa, exacta, actualizada, comprobable y comprensible.",
              "(iii) Comunicar de forma oportuna al Encargado del tratamiento todas las novedades respecto de los datos que previamente le haya suministrado y adoptar las demás medidas necesarias para que la información suministrada a este se mantenga actualizada.",
              "(iv) Informar de manera oportuna al Encargado del tratamiento las rectificaciones realizadas sobre los datos personales para que éste proceda a realizar los ajustes pertinentes.",
              "(v) Exigir al Encargado del tratamiento, en todo momento, el respeto a las condiciones de seguridad y privacidad de la información del titular.",
              "(vi) Informar al Encargado del tratamiento cuando determinada información se encuentre en discusión por parte del titular, una vez se haya presentado la reclamación y no haya finalizado el tramite respectivo."
            ]
          },
          {
            "p": "D. Deberes respecto de la Superintendencia de Industria y Comercio"
          },
          {
            "list": [
              "(i) Informarle las eventuales violaciones a los códigos de seguridad y la existencia de riesgos en la administración de la información de los titulares.",
              "(ii) Cumplir las instrucciones y requerimientos que imparta la Superintendencia de Industria y Comercio."
            ]
          }
        ]
      },
      {
        "label": "Séptimo",
        "heading": "Solicitud de autorización al titular del dato personal",
        "blocks": [
          {
            "p": "Con antelación y/o al momento de efectuar la recolección del dato personal, PLAN MEDICO Y QUIRUGICO SAS solicitará al titular del dato su autorización para efectuar su recolección y tratamiento, indicando la finalidad para la cual se solicita el dato, utilizando para esos efectos medios técnicos automatizados, escritos u orales, que permitan conservar prueba de la autorización y/o de la conducta inequívoca descrita en el articulo 7 del Decreto 1377 de 2013. Dicha autorización se solicitará por el tiempo que sea razonable y necesario para satisfacer las necesidades que dieron origen a la solicitud del dato y, en todo caso, con observancia de las disposiciones legales que rigen sobre la materia."
          }
        ]
      },
      {
        "label": "Octavo",
        "heading": "Aviso de privacidad",
        "blocks": [
          {
            "p": "En el evento en el que PLAN MEDICO Y QUIRUGICO SAS no pueda poner a disposición del titular del dato personal la presente política de tratamiento de la información, publicará el aviso de privacidad que se adjunta al presente documento, cuyo texto conservará para consulta posterior por parte del titular del dato y/o de la Superintendencia de Industria y Comercio."
          }
        ]
      },
      {
        "label": "Noveno",
        "heading": "Limitaciones temporales al tratamiento de los datos personales",
        "blocks": [
          {
            "p": "PLAN MEDICO Y QUIRUGICO SAS solo podrá recolectar, almacenar, usar o circular los datos personales durante el tiempo que sea razonable y necesario, de acuerdo con las finalidades que justificaron el tratamiento, atendiendo a las disposiciones aplicables a la materia de que se trate y a los aspectos administrativos, contables, fiscales, jurídicos e históricos de la información. Una vez cumplida la o las finalidades del tratamiento y sin perjuicio de normas legales que dispongan lo contrario, procederá a la supresión de los datos personales en su posesión. No obstante, lo anterior, los datos personales deberán ser conservados cuando así se requiera para el cumplimiento de una obligación legal o contractual."
          }
        ]
      },
      {
        "label": "Décimo",
        "heading": "Área responsable y procedimiento para el ejercicio de los derechos de los titulares del dato personal",
        "blocks": [
          {
            "p": "El Gerente de PLAN MEDICO Y QUIRUGICO SAS será la Responsable de atender las peticiones, quejas y reclamos que formule el titular del dato en ejercicio de los derechos contemplados en el numeral 5 de la presente política, a excepción del descrito en su literal e). Para tales efectos, el titular del dato personal o quien ejerza su representación podrá enviar su petición, queja o reclamo de lunes a viernes de 8:00 a.m. a 5:00 p.m. al correo electrónico linaochoaf@gmail.com, llamar a la línea telefónica de PLAN MEDICO Y QUIRUGICO SAS, o radicarla en la siguiente dirección Av. El Poblado #5A-113, El Poblado, Medellín, oficina 702."
          },
          {
            "p": "La petición, queja o reclamo deberá contener la identificación del Titular, la descripción de los hechos que dan lugar al reclamo, la dirección, y acompañando los documentos que se quiera hacer valer. Si el reclamo resulta incompleto, se requerirá al interesado dentro de los cinco (5) días siguientes a la recepción del reclamo para que subsane las fallas. Transcurridos dos (2) meses desde la fecha del requerimiento, sin que el solicitante presente la información requerida, se entenderá que ha desistido del reclamo. En caso de que quien reciba el reclamo no sea competente para resolverlo, dará traslado a quien corresponda en un término máximo de dos (2) días hábiles e informará de la situación al interesado. Una vez recibido el reclamo completo, se incluirá en la base de datos una leyenda que diga “reclamo en trámite” y el motivo de este, en un término no mayor a dos (2) días hábiles. Dicha leyenda deberá mantenerse hasta que el reclamo sea decidido. El termino máximo para atender el reclamo será de quince (15) días hábiles contados a partir del día siguiente a la fecha de su recibo. Cuando no fuere posible atender el reclamo dentro de dicho termino, se informará al interesado los motivos de la demora y la fecha en que se atenderá su reclamo, la cual en ningún caso podrá superar los ocho (8) días hábiles siguientes al vencimiento del primer término."
          }
        ]
      },
      {
        "label": "Décimo primero",
        "heading": "Datos recolectados antes de la expedición del Decreto 1377 de 2013",
        "blocks": [
          {
            "p": "De conformidad con lo dispuesto en el numeral 3 del artículo 10 del Decreto Reglamentario 1377 de 2013 PLAN MEDICO Y QUIRUGICO SAS procederá a publicar un aviso en su página web oficial http://planmed.com.co/ dirigido a los titulares de datos personales para efectos de dar a conocer la presente política de tratamiento de información y el modo de ejercer sus derechos como titulares de datos personales alojados en las bases de datos de PLAN MEDICO Y QUIRUGICO SAS ."
          }
        ]
      },
      {
        "label": "Décimo segundo",
        "heading": "Medidas de seguridad",
        "blocks": [
          {
            "p": "En desarrollo del principio de seguridad establecido en la Ley 1581 de 2012, PLAN MEDICO Y QUIRUGICO SAS adoptará las medidas técnicas, humanas y administrativas"
          }
        ]
      },
      {
        "label": "Décimo tercero",
        "heading": "Fecha de entrada en vigencia",
        "blocks": [
          {
            "p": "La presente Política de Datos Personales fue creada el día 1 de agosto de 2016 y entra en vigencia a partir del 15 de agosto de 2016. Cualquier cambio que se presente respecto de la presente política, se informará a través de la dirección electrónica: http://planmed.com.co/politicas-y-proteccion-de-datos- personales/"
          }
        ]
      }
    ],
    "fields": [],
    "closing": "Atentamente, PLANMED SAS"
  },
  {
    "slug": "aviso-privacidad-autorizacion",
    "title": "Aviso de privacidad y autorización expresa para el tratamiento de datos personales",
    "description": "Aviso de privacidad y autorización del titular, con formato para diligenciar y firmar.",
    "documentTitle": "AVISO DE PRIVACIDAD Y AUTORIZACIÓN EXPRESA PARA EL TRATAMIENTO DE DATOS PERSONALES",
    "file": "/images/web/pdf/aviso-privacidad-autorizacion.pdf",
    "driveUrl": "https://drive.google.com/file/d/1yuRgtCXRxt7b5zE3indlG9woqky48D82/view?usp=sharing",
    "facts": [],
    "intro": [],
    "sections": [
      {
        "label": null,
        "heading": null,
        "blocks": [
          {
            "p": "La PLAN MÉDICO Y QUIRÚRGICO en cumplimiento de lo definido en la Ley 1581 de 2012, el Decreto Reglamentario 1377 de 2013 y la Política de protección de datos personales de nuestra entidad, le informa que los datos personales que usted suministre a la PLAN MÉDICO Y QUIRÚRGICO en virtud de las operaciones, tramites que solicite o celebre, serán tratados mediante el uso y mantenimiento de medidas de seguridad físicas, técnicas y administrativas a fin de impedir que terceros no autorizados accedan a los mismos, lo anterior de conformidad a lo definido en la Ley, el desarrollo de las funciones públicas delegadas por el Estado y aquellas propias de su actividad privada y gremial."
          },
          {
            "p": "El responsable del tratamiento de sus datos personales es la PLAN MÉDICO Y QUIRÚRGICO identificada con NIT 900794105-6, domicilio en Carrera 43 A Nro. 5ª 113 Oficina 702 Teléfono: 3164821047 Correo electrónico: linaochoaf@gmail.com, quien los recogerá a través de sus diferentes canales y serán usados para:"
          },
          {
            "list": [
              "a) Ejecutar la relación contractual existente con sus clientes, proveedores;",
              "b) Proveer los servicios requeridos por sus usuarios;",
              "c) Informar sobre nuevos productos o servicios y/o sobre cambios en los mismos;",
              "d) Evaluar la calidad del servicio;",
              "e) Enviar al correo físico, electrónico, celular o dispositivo móvil, vía mensajes de texto (SMS y/o MMS) o a través de cualquier otro medio análogo y/o digital de comunicación creado o por crearse, información comercial, publicitaria o promocional sobre los productos, eventos y/o promociones de tipo comercial o no de estas, con el fin de impulsar, invitar, dirigir, ejecutar, informar y de manera general, llevar a cabo campañas o promociones de carácter comercial o publicitario, adelantados por PLAN MÉDICO Y QUIRÚRGICO y/o por terceras personas;",
              "f) cumplir las funciones establecidas en el Código de Comercio Colombiano, en el artículo 10 del Decreto 898 de 2002 y en las demás normas que complementen su marco jurídico operacional."
            ]
          },
          {
            "p": "Usted podrá ejercer los derechos que la Ley prevé, siguiendo los procedimientos que la PLAN MÉDICO Y QUIRÚRGICO proporciona para tales efectos, los cuales puede conocer en nuestras políticas de tratamiento de datos personales publicado en nuestra página https://crediestetica.com / para dudas e inquietudes relacionadas con estos temas puede escribirnos a: linaochoaf@gmail.com. Es importante mencionar que el ejercicio de sus derechos no es requisito previo ni impide el ejercicio de otro derecho y que cualquier modificación al presente aviso le será notificado a través de los medios que disponga la PLAN MÉDICO Y QUIRÚRGICO para tal fin."
          },
          {
            "p": "Leído la anterior autorizo de manera previa, explicita e inequívoca a la PLAN MÉDICO Y QUIRÚRGICO para el tratamiento de los datos personales suministrados por mí, dentro de las finalidades legales, contractuales, comerciales y las aqú i contempladas. Declaro que soy el titular de la información reportada en este formulario para autorizar el tratamiento de mis datos personales, que he suministrado de forma voluntaria y es completa, confiable, veraz, exacta y verídica:"
          }
        ]
      }
    ],
    "fields": [
      [
        "Nombre(s) y apellido",
        "Fecha de nacimiento"
      ],
      [
        "Identificación",
        "Correo electrónico"
      ],
      [
        "Teléfono",
        "Fecha"
      ],
      [
        "Firma"
      ]
    ],
    "closing": null
  },
  {
    "slug": "aviso-privacidad",
    "title": "Aviso de privacidad",
    "description": "Resumen de las finalidades del tratamiento de tus datos, tus derechos y los canales de atención.",
    "documentTitle": "AVISO DE PRIVACIDAD - PLAN MÉDICO Y QUIRÚRGICO SAS",
    "file": "/images/web/pdf/aviso-privacidad.pdf",
    "driveUrl": "https://drive.google.com/file/d/1CfePYOtVBOJtC0JqCcW8KAKyzJUCm2_n/view?usp=sharing",
    "facts": [
      [
        "Razón social",
        "PLAN MÉDICO Y QUIRÚRGICO SAS"
      ],
      [
        "NIT",
        "900794105-6"
      ],
      [
        "Dirección",
        "Carrea 43 A Nro. 5 A 113 Oficina 702"
      ],
      [
        "Domicilio",
        "Medellín"
      ],
      [
        "Teléfono",
        "3164821047"
      ],
      [
        "Correo electrónico",
        "linaochoaf@gmail.com"
      ],
      [
        "Página web",
        "https://planmed.com.co/"
      ]
    ],
    "intro": [],
    "sections": [
      {
        "label": null,
        "heading": "Finalidad con la que se efectúa la recolección de datos personales y tratamiento de los mismos",
        "blocks": [
          {
            "p": "PLAN MÉDICO Y QUIRÚRGICO SAS podrá hacer uso de los datos personales para:"
          },
          {
            "list": [
              "a) Ejecutar la relación contractual existente con sus clientes, proveedores y trabajadores, incluida el pago de obligaciones contractuales;",
              "b) Proveer los servicios y/o los productos requeridos por sus usuarios;",
              "c) Informar sobre nuevos productos o servicios y/o sobre cambios en los mismos;",
              "d) Evaluar la calidad del servicio;",
              "e) Realizar estudios internos sobre hábitos de consumo;",
              "f) Enviar al correo físico, electrónico, celular o dispositivo móvil, vía mensajes de texto (SMS y/o MMS) o a través de cualquier otro medio análogo y/o digital de comunicación creado o por crearse, información comercial, publicitaria o promocional sobre los productos y/o servicios, eventos y/o promociones de tipo comercial o no de estas, con el fin de impulsar, invitar, dirigir, ejecutar, informar y de manera general, llevar a cabo campañas, promociones o concursos de carácter comercial o publicitario, adelantados por PLAN MÉDICO Y QUIRÚRGICO SAS y/o por terceras personas;",
              "g) Desarrollar el proceso de selección, evaluación, y vinculación laboral;",
              "h) Soportar procesos de auditoría interna o externa;",
              "i) Registrar la información de empleados y/o jubilados (activos e inactivos) en las bases de datos de PLAN MÉDICO Y QUIRÚRGICO SAS :",
              "i) Los indicados en la autorización otorgada por el titular del dato o descritos en el aviso de privacidad respectivo, según sea el caso;",
              "j) Suministrar, compartir, enviar o entregar sus datos personales a empresas filiales, vinculadas, o subordinadas de PLAN MÉDICO Y QUIRÚRGICO SAS . ubicadas en Colombia o cualquier otro país en el evento que dichas compañías requieran la información para los fines aquí indicados."
            ]
          },
          {
            "p": "Respecto de los datos (i) recolectados directamente en los puntos de seguridad, (ii) tomados de los documentos que suministran las personas al personal de seguridad y (iii) obtenidos de las videograbaciones que se realizan dentro o fuera de las instalaciones de PLAN MÉDICO Y QUIRÚRGICO SAS, éstos se utilizarán para fines de seguridad de las personas, los bienes e instalaciones de PLAN MÉDICO Y QUIRÚRGICO SAS y podrán ser utilizados como prueba en cualquier tipo de proceso."
          },
          {
            "p": "Si un dato personal es proporcionado, dicha información será utilizada sólo para los propósitos aquí señalados, y por tanto, PLAN MÉDICO Y QUIRÚRGICO SAS no procederá a vender, licenciar, transmitir, o divulgar la misma, salvo que:"
          },
          {
            "list": [
              "(i) exista autorización expresa para hacerlo;",
              "(ii) sea necesario para permitir a los contratistas o agentes prestar los servicios encomendados;",
              "(iii) sea necesario con el fin de proveer nuestros servicios y/o productos;",
              "(iv) sea necesario divulgarla a las entidades que prestan servicios de mercadeo en nombre de PLAN MÉDICO Y QUIRÚRGICO SAS o a otras entidades con las cuales se tengan acuerdos de mercado conjunto;",
              "(v) la información tenga relación con una fusión, consolidación, adquisición, desinversión, u otro proceso de restructuración de la sociedad;",
              "(vi) que sea requerido o permitido por la ley."
            ]
          },
          {
            "p": "PLAN MÉDICO Y QUIRÚRGICO SAS podrá subcontratar a terceros para el procesamiento de determinadas funciones o información. Cuando efectivamente se subcontrate con terceros el procesamiento de información personal o se proporcione información personal a terceros prestadores de servicios, PLAN MÉDICO Y QUIRÚRGICO SAS advierte a dichos terceros sobre la necesidad de proteger dicha información personal con medidas de seguridad apropiadas, se prohíbe el uso de la información para fines propios y se solicita que no se divulgue la información personal a otros."
          }
        ]
      },
      {
        "label": null,
        "heading": "Derechos de los titulares de datos personales",
        "blocks": [
          {
            "p": "Los titulares de datos personales por sí o por intermedio de su representante y/o apoderado o su causahabiente podrán ejercer los siguientes derechos, respecto de los datos personales que sean objeto de tratamiento por parte de PLAN MÉDICO Y QUIRÚRGICO SAS :"
          },
          {
            "list": [
              "a) Derecho de acceso: En virtud del cual podrá acceder a los datos personales que estén bajo el control de PLAN MÉDICO Y QUIRÚRGICO SAS , para efectos de consultarlos de manera gratuita al menos una vez cada mes calendario, y cada vez que existan modificaciones sustanciales de las Políticas de Tratamiento de la información que motiven nuevas consultas;",
              "b) Derecho de actualización, rectificación y supresión: En virtud del cual podrá solicitar la actualización, rectificación y/o supresión de los datos personales objeto de tratamiento, de tal manera que se satisfagan los propósitos del tratamiento;",
              "c) Derecho a solicitar prueba de la autorización: salvo en los eventos en los cuales, según las normas legales vigentes, no se requiera de la autorización para realizar el tratamiento;",
              "d) Derecho a ser informado respecto del uso del dato personal;",
              "e) Derecho a presentar quejas ante la Superintendencia de Industria y Comercio: por infracciones a lo dispuesto en la normatividad vigente sobre tratamiento de datos personales;",
              "f) Derecho a requerir el cumplimiento de las ordenes emitidas por la Superintendencia de Industria y Comercio."
            ]
          }
        ]
      },
      {
        "label": null,
        "heading": "Política de tratamiento de datos personales",
        "blocks": [
          {
            "p": "Podrá ser consultada en la siguiente dirección: https://planmed.com.co/. Cualquier cambio que se presente respecto de la presente política, se informará a través de la dirección electrónica: https://planmed.com.co/. En el evento que se recolecten datos personales sensibles, el Titular podrá negarse a autorizar su Tratamiento."
          },
          {
            "p": "El ÁREA DE SERVICIO AL CLIENTE o GERENCIA de PLAN MÉDICO Y QUIRÚRGICO SAS será la responsable de atender las peticiones, quejas y reclamos que formule el titular del dato en ejercicio de los derechos contemplados en el numeral 5 de la política de tratamiento de datos personales, a excepción del descrito en su literal e). Para tales efectos, el titular del dato personal o quien ejerza su representación podrá enviar su petición, queja o reclamo de lunes a viernes de 8:00 a.m. a 5:00 p.m. al correo electrónico linaochoaf@gmail.com, o comunicarse con los siguientes teléfonos: 3164821047 o radicarla en la siguiente dirección Carrea 43 A Nro. 5 A 113 Oficina 702"
          }
        ]
      }
    ],
    "fields": [],
    "closing": "Atentamente, PLAN MÉDICO Y QUIRÚRGICO SAS."
  },
  {
    "slug": "autorizacion-tratamiento-datos",
    "title": "Autorización de tratamiento de datos personales",
    "description": "Formato de autorización expresa para el tratamiento de tus datos, para diligenciar y firmar.",
    "documentTitle": "AVISO DE PRIVACIDAD Y AUTORIZACIÓN EXPRESA PARA EL TRATAMIENTO DE DATOS PERSONALES",
    "file": "/images/web/pdf/autorizacion-tratamiento-datos.pdf",
    "driveUrl": "https://drive.google.com/file/d/1qYMrTKoZElYmiWIYG2hKMOqkziWzxe59/view?usp=sharing",
    "facts": [],
    "intro": [],
    "sections": [
      {
        "label": null,
        "heading": null,
        "blocks": [
          {
            "p": "La PLAN MÉDICO Y QUIRÚRGICO en cumplimiento de lo definido en la Ley 1581 de 2012, el Decreto Reglamentario 1377 de 2013 y la Política de protección de datos personales de nuestra entidad, le informa que los datos personales que usted suministre a la PLAN MÉDICO Y QUIRÚRGICO en virtud de las operaciones, tramites que solicite o celebre, serán tratados mediante el uso y mantenimiento de medidas de seguridad físicas, técnicas y administrativas a fin de impedir que terceros no autorizados accedan a los mismos, lo anterior de conformidad a lo definido en la Ley, el desarrollo de las funciones públicas delegadas por el Estado y aquellas propias de su actividad privada y gremial."
          },
          {
            "p": "El responsable del tratamiento de sus datos personales es la PLAN MÉDICO Y QUIRÚRGICO identificada con NIT 900794105-6, domicilio en Carrera 43 A nro 5ª 113 Oficina 702 Correo electrónico: linaochoaf@gmail.com, quien los recogerá a través de sus diferentes canales y serán usados para:"
          },
          {
            "list": [
              "a) Ejecutar la relación contractual existente con sus clientes, proveedores;",
              "b) Proveer los servicios requeridos por sus usuarios;",
              "c) Informar sobre nuevos productos o servicios y/o sobre cambios en los mismos;",
              "d) Evaluar la calidad del servicio;",
              "e) Enviar al correo físico, electrónico, celular o dispositivo móvil, vía mensajes de texto (SMS y/o MMS) o a través de cualquier otro medio análogo y/o digital de comunicación creado o por crearse, información comercial, publicitaria o promocional sobre los productos, eventos y/o promociones de tipo comercial o no de estas, con el fin de impulsar, invitar, dirigir, ejecutar, informar y de manera general, llevar a cabo campañas o promociones de carácter comercial o publicitario, adelantados por PLAN MÉDICO Y QUIRÚRGICO y/o por terceras personas;",
              "f) cumplir las funciones establecidas en el Código de Comercio Colombiano, en el artículo 10 del Decreto 898 de 2002 y en las demás normas que complementen su marco jurídico operacional."
            ]
          },
          {
            "p": "Usted podrá ejercer los derechos que la Ley prevé, siguiendo los procedimientos que la PLAN MÉDICO Y QUIRÚRGICO proporciona para tales efectos, los cuales puede conocer en nuestras políticas de tratamiento de datos personales publicado en nuestra página http://planmed.com.co/ para dudas e inquietudes relacionadas con estos temas puede escribirnos a: linaochoaf@gmail.com. Es importante mencionar que el ejercicio de sus derechos no es requisito previo ni impide el ejercicio de otro derecho y que cualquier modificación al presente aviso le será notificado a través de los medios que disponga la PLAN MÉDICO Y QUIRÚRGICO para tal fin."
          },
          {
            "p": "Leído la anterior autorizo de manera previa, explicita e inequívoca a la PLAN MÉDICO Y QUIRÚRGICO para el tratamiento de los datos personales suministrados por mí, dentro de las finalidades legales, contractuales, comerciales y las aquí contempladas. Declaro que soy el titular de la información reportada en este formulario para autorizar el tratamiento de mis datos personales, que he suministrado de forma voluntaria y es completa, confiable, veraz, exacta y verídica."
          }
        ]
      }
    ],
    "fields": [
      [
        "Firma"
      ],
      [
        "Nombre"
      ]
    ],
    "closing": null
  }
]

export const resourceDocumentBySlug = (slug: string): ResourceDocument | undefined => resourceDocuments.find(d => d.slug === slug)

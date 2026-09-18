const fs = require('fs');
const path = require('path');

const localesPath = 'C:/Users/pdtco/Desktop/Cliniplanes/cliniplanes-web/i18n/locales';

const proceduresEs = {
  mamoplastia: {
    name: 'Mamoplastia',
    category: 'Corporal',
    whatIsIt: 'La mamoplastia es un procedimiento quirúrgico estético que permite aumentar, reducir o remodelar el tamaño de los senos. Su objetivo principal es mejorar la proporción y simetría del contorno corporal, adaptándose a las expectativas y anatomía de cada paciente mediante técnicas avanzadas y seguras.',
    benefits: [
      { title: 'Mejora la autoestima', desc: 'Aporta seguridad y confianza al lograr un contorno corporal más armónico y equilibrado.' },
      { title: 'Proporción ideal', desc: 'Permite equilibrar el tamaño de los senos con el resto de la figura.' },
      { title: 'Rápida recuperación', desc: 'Técnicas modernas minimizan el tiempo de inactividad, permitiendo retomar actividades cotidianas pronto.' },
      { title: 'Resultados naturales', desc: 'Se utilizan implantes o técnicas que aseguran un aspecto y tacto natural.' }
    ],
    isForYou: [
      'Deseas aumentar el volumen y mejorar la forma de tus senos.',
      'Sientes que tus senos son asimétricos o han perdido volumen.',
      'Buscas reducir el tamaño por incomodidad física o dolores de espalda.',
      'Deseas restaurar la apariencia de tus senos tras pérdida de peso o lactancia.'
    ],
    faqs: [
      { q: '¿Cuánto tiempo dura la recuperación?', a: 'La recuperación inicial toma entre 1 y 2 semanas. Podrás retomar actividades ligeras en pocos días, pero se recomienda esperar al menos un mes para ejercicio intenso.' },
      { q: '¿Las cicatrices serán muy visibles?', a: 'Los especialistas utilizan técnicas avanzadas para que las incisiones sean lo más discretas posible, generalmente ocultas en los pliegues naturales.' },
      { q: '¿Cuándo veré los resultados finales?', a: 'Aunque notarás un cambio inmediato, el resultado final se apreciará completamente después de 3 a 6 meses, cuando baje la inflamación.' }
    ]
  },
  lipoabdominoplastia: {
    name: 'Lipoabdominoplastia',
    category: 'Corporal',
    whatIsIt: 'La lipoabdominoplastia es un procedimiento integral que combina dos técnicas: la liposucción para eliminar grasa localizada y la abdominoplastia para tensar los músculos abdominales y retirar el exceso de piel. El resultado es un abdomen plano, una cintura definida y un contorno corporal más firme.',
    benefits: [
      { title: 'Remodelación completa', desc: 'Transforma el abdomen y la cintura en una sola intervención.' },
      { title: 'Eliminación de flacidez', desc: 'Retira el exceso de piel que no desaparece con dieta o ejercicio.' },
      { title: 'Músculos tonificados', desc: 'Repara y tensa la pared abdominal para un vientre más plano.' },
      { title: 'Resultados duraderos', desc: 'Si se mantiene un estilo de vida saludable, los resultados son prolongados.' }
    ],
    isForYou: [
      'Tienes flacidez abdominal severa o piel sobrante.',
      'Has pasado por múltiples embarazos y tus músculos abdominales se han separado.',
      'Has perdido mucho peso y buscas eliminar los excesos de piel.',
      'Deseas definir tu cintura y lograr un abdomen firme.'
    ],
    faqs: [
      { q: '¿Quedará una cicatriz muy grande?', a: 'La cicatriz se ubica en la parte baja del abdomen, diseñada para quedar oculta bajo la ropa interior o traje de baño.' },
      { q: '¿Puedo tener hijos después del procedimiento?', a: 'Sí, aunque se recomienda realizar la cirugía cuando no se planeen futuros embarazos para no alterar los resultados.' },
      { q: '¿Cuánto dura el proceso de recuperación?', a: 'Es un procedimiento mayor, por lo que se requiere reposo relativo durante 2 a 3 semanas antes de volver al trabajo.' }
    ]
  },
  mastopexia: {
    name: 'Mastopexia',
    category: 'Corporal',
    whatIsIt: 'La mastopexia, o levantamiento de senos, es una cirugía diseñada para elevar y remodelar los senos caídos. Este procedimiento devuelve a los senos una posición más juvenil y firme, reubicando la areola y el pezón, y eliminando el exceso de piel para mejorar su contorno.',
    benefits: [
      { title: 'Rejuvenecimiento del busto', desc: 'Restaura una posición más alta y juvenil de los senos.' },
      { title: 'Firmeza recuperada', desc: 'Elimina la flacidez y mejora la tensión de la piel.' },
      { title: 'Mejora en la simetría', desc: 'Permite corregir asimetrías tanto en posición como en forma.' },
      { title: 'Posibilidad de implantes', desc: 'Puede combinarse con implantes si también se desea aumentar el volumen.' }
    ],
    isForYou: [
      'Sientes que tus senos han perdido firmeza y tienen un aspecto caído.',
      'Tus pezones apuntan hacia abajo o están por debajo del pliegue del seno.',
      'Has experimentado cambios en tus senos tras lactancia o pérdida de peso.',
      'Tus senos son asimétricos o han perdido su contorno juvenil.'
    ],
    faqs: [
      { q: '¿Perderé la sensibilidad en los pezones?', a: 'Es normal experimentar cambios temporales en la sensibilidad, pero en la mayoría de los casos se recupera con el tiempo.' },
      { q: '¿Necesito implantes con la mastopexia?', a: 'No es obligatorio. Si solo buscas levantar y afirmar, se utiliza tu propio tejido. Si además quieres más volumen, se recomienda usar implantes.' },
      { q: '¿Las cicatrices desaparecen?', a: 'Las cicatrices no desaparecen, pero se desvanecen significativamente con el tiempo y los cuidados adecuados.' }
    ]
  },
  liposuccion: {
    name: 'Liposucción',
    category: 'Corporal',
    whatIsIt: 'La liposucción es un procedimiento quirúrgico destinado a extraer depósitos de grasa localizada que son resistentes a la dieta y el ejercicio. Mediante técnicas especializadas, se esculpe la figura, mejorando las proporciones del cuerpo y afinando el contorno en áreas específicas como abdomen, espalda, brazos o muslos.',
    benefits: [
      { title: 'Contorno definido', desc: 'Esculpe y mejora la forma natural de tu cuerpo.' },
      { title: 'Tratamiento localizado', desc: 'Permite atacar zonas específicas donde la grasa es difícil de eliminar.' },
      { title: 'Mejora de la proporción', desc: 'Logra un equilibrio visual más armonioso de la figura.' },
      { title: 'Aumento de confianza', desc: 'La ropa ajustará mejor y te sentirás más cómodo con tu cuerpo.' }
    ],
    isForYou: [
      'Tienes un peso cercano a tu ideal pero con zonas de grasa rebelde.',
      'Buscas afinar tu contorno corporal, no una solución para la obesidad.',
      'Tu piel tiene buena elasticidad para adaptarse al nuevo contorno.',
      'Tienes expectativas realistas sobre los resultados de remodelación.'
    ],
    faqs: [
      { q: '¿La liposucción sirve para bajar de peso?', a: 'No, es un procedimiento de remodelación corporal. Se recomienda estar cerca del peso ideal antes de la cirugía.' },
      { q: '¿La grasa puede volver a aparecer?', a: 'Las células de grasa extraídas no regresan. Sin embargo, si aumentas de peso, las células restantes pueden agrandarse, por lo que es vital mantener hábitos saludables.' },
      { q: '¿Es un procedimiento doloroso?', a: 'El procedimiento se realiza bajo anestesia. En el postoperatorio es normal sentir molestias similares a las agujetas intensas, controlables con medicación.' }
    ]
  }
};

const proceduresEn = {
  mamoplastia: {
    name: 'Breast Augmentation',
    category: 'Body',
    whatIsIt: 'Breast augmentation is an aesthetic surgical procedure that allows increasing, reducing, or reshaping the size of the breasts. Its main objective is to improve the proportion and symmetry of the body contour, adapting to the expectations and anatomy of each patient through advanced and safe techniques.',
    benefits: [
      { title: 'Improves self-esteem', desc: 'Provides security and confidence by achieving a more harmonious and balanced body contour.' },
      { title: 'Ideal proportion', desc: 'Allows balancing breast size with the rest of the figure.' },
      { title: 'Fast recovery', desc: 'Modern techniques minimize downtime, allowing a quick return to daily activities.' },
      { title: 'Natural results', desc: 'Implants or techniques are used to ensure a natural look and feel.' }
    ],
    isForYou: [
      'You want to increase the volume and improve the shape of your breasts.',
      'You feel your breasts are asymmetrical or have lost volume.',
      'You are looking to reduce the size due to physical discomfort or back pain.',
      'You want to restore the appearance of your breasts after weight loss or breastfeeding.'
    ],
    faqs: [
      { q: 'How long does the recovery take?', a: 'Initial recovery takes 1 to 2 weeks. You can resume light activities in a few days, but it is recommended to wait at least a month for intense exercise.' },
      { q: 'Will the scars be very visible?', a: 'Specialists use advanced techniques to make incisions as discreet as possible, usually hidden in natural folds.' },
      { q: 'When will I see the final results?', a: 'Although you will notice an immediate change, the final result will be fully appreciated after 3 to 6 months, when swelling subsides.' }
    ]
  },
  lipoabdominoplastia: {
    name: 'Lipoabdominoplasty',
    category: 'Body',
    whatIsIt: 'Lipoabdominoplasty is a comprehensive procedure that combines two techniques: liposuction to remove localized fat and abdominoplasty to tighten abdominal muscles and remove excess skin. The result is a flat abdomen, a defined waist, and a firmer body contour.',
    benefits: [
      { title: 'Complete remodeling', desc: 'Transforms the abdomen and waist in a single intervention.' },
      { title: 'Elimination of flaccidity', desc: 'Removes excess skin that does not disappear with diet or exercise.' },
      { title: 'Toned muscles', desc: 'Repairs and tightens the abdominal wall for a flatter belly.' },
      { title: 'Long-lasting results', desc: 'If a healthy lifestyle is maintained, the results are prolonged.' }
    ],
    isForYou: [
      'You have severe abdominal flaccidity or excess skin.',
      'You have gone through multiple pregnancies and your abdominal muscles have separated.',
      'You have lost a lot of weight and are looking to eliminate excess skin.',
      'You want to define your waist and achieve a firm abdomen.'
    ],
    faqs: [
      { q: 'Will there be a very large scar?', a: 'The scar is located in the lower abdomen, designed to be hidden under underwear or swimwear.' },
      { q: 'Can I have children after the procedure?', a: 'Yes, although it is recommended to undergo the surgery when no future pregnancies are planned so as not to alter the results.' },
      { q: 'How long is the recovery process?', a: 'It is a major procedure, so relative rest is required for 2 to 3 weeks before returning to work.' }
    ]
  },
  mastopexia: {
    name: 'Mastopexy',
    category: 'Body',
    whatIsIt: 'Mastopexy, or breast lift, is a surgery designed to lift and reshape sagging breasts. This procedure restores the breasts to a more youthful and firm position, relocating the areola and nipple, and removing excess skin to improve its contour.',
    benefits: [
      { title: 'Bust rejuvenation', desc: 'Restores a higher and more youthful position of the breasts.' },
      { title: 'Recovered firmness', desc: 'Eliminates flaccidity and improves skin tension.' },
      { title: 'Improved symmetry', desc: 'Allows correcting asymmetries in both position and shape.' },
      { title: 'Possibility of implants', desc: 'It can be combined with implants if an increase in volume is also desired.' }
    ],
    isForYou: [
      'You feel your breasts have lost firmness and look sagging.',
      'Your nipples point downward or are below the breast crease.',
      'You have experienced changes in your breasts after breastfeeding or weight loss.',
      'Your breasts are asymmetrical or have lost their youthful contour.'
    ],
    faqs: [
      { q: 'Will I lose sensitivity in my nipples?', a: 'It is normal to experience temporary changes in sensitivity, but in most cases it recovers over time.' },
      { q: 'Do I need implants with a mastopexy?', a: 'It is not mandatory. If you only want to lift and firm, your own tissue is used. If you also want more volume, implants are recommended.' },
      { q: 'Do scars disappear?', a: 'Scars do not disappear, but they fade significantly over time with proper care.' }
    ]
  },
  liposuccion: {
    name: 'Liposuction',
    category: 'Body',
    whatIsIt: 'Liposuction is a surgical procedure aimed at removing localized fat deposits that are resistant to diet and exercise. Through specialized techniques, the figure is sculpted, improving body proportions and refining the contour in specific areas such as the abdomen, back, arms, or thighs.',
    benefits: [
      { title: 'Defined contour', desc: 'Sculpts and improves the natural shape of your body.' },
      { title: 'Localized treatment', desc: 'Allows targeting specific areas where fat is difficult to eliminate.' },
      { title: 'Improved proportion', desc: 'Achieves a more harmonious visual balance of the figure.' },
      { title: 'Increased confidence', desc: 'Clothes will fit better and you will feel more comfortable with your body.' }
    ],
    isForYou: [
      'You are close to your ideal weight but have stubborn fat areas.',
      'You are looking to refine your body contour, not a solution for obesity.',
      'Your skin has good elasticity to adapt to the new contour.',
      'You have realistic expectations about the remodeling results.'
    ],
    faqs: [
      { q: 'Is liposuction for weight loss?', a: 'No, it is a body remodeling procedure. It is recommended to be close to your ideal weight before surgery.' },
      { q: 'Can fat reappear?', a: 'Extracted fat cells do not return. However, if you gain weight, the remaining cells can enlarge, so maintaining healthy habits is vital.' },
      { q: 'Is it a painful procedure?', a: 'The procedure is performed under anesthesia. Postoperatively, it is normal to feel discomfort similar to intense muscle soreness, controllable with medication.' }
    ]
  }
};

const proceduresPt = {
  mamoplastia: {
    name: 'Mamoplastia',
    category: 'Corporal',
    whatIsIt: 'A mamoplastia é um procedimento cirúrgico estético que permite aumentar, reduzir ou remodelar o tamanho dos seios. Seu principal objetivo é melhorar a proporção e a simetria do contorno corporal, adaptando-se às expectativas e à anatomia de cada paciente por meio de técnicas avançadas e seguras.',
    benefits: [
      { title: 'Melhora a autoestima', desc: 'Proporciona segurança e confiança ao alcançar um contorno corporal mais harmonioso e equilibrado.' },
      { title: 'Proporção ideal', desc: 'Permite equilibrar o tamanho dos seios com o resto da figura.' },
      { title: 'Recuperação rápida', desc: 'Técnicas modernas minimizam o tempo de inatividade, permitindo um retorno rápido às atividades diárias.' },
      { title: 'Resultados naturais', desc: 'São utilizados implantes ou técnicas que garantem uma aparência e sensação naturais.' }
    ],
    isForYou: [
      'Você deseja aumentar o volume e melhorar a forma dos seus seios.',
      'Você sente que seus seios são assimétricos ou perderam volume.',
      'Você deseja reduzir o tamanho devido a desconforto físico ou dores nas costas.',
      'Você deseja restaurar a aparência dos seus seios após perda de peso ou amamentação.'
    ],
    faqs: [
      { q: 'Quanto tempo dura a recuperação?', a: 'A recuperação inicial leva de 1 a 2 semanas. Você pode retomar atividades leves em poucos dias, mas é recomendável esperar pelo menos um mês para exercícios intensos.' },
      { q: 'As cicatrizes ficarão muito visíveis?', a: 'Os especialistas usam técnicas avançadas para tornar as incisões o mais discretas possível, geralmente escondidas nas dobras naturais.' },
      { q: 'Quando verei os resultados finais?', a: 'Embora você note uma mudança imediata, o resultado final será totalmente apreciado após 3 a 6 meses, quando o inchaço diminuir.' }
    ]
  },
  lipoabdominoplastia: {
    name: 'Lipoabdominoplastia',
    category: 'Corporal',
    whatIsIt: 'A lipoabdominoplastia é um procedimento abrangente que combina duas técnicas: lipoaspiração para remover gordura localizada e abdominoplastia para apertar os músculos abdominais e remover o excesso de pele. O resultado é um abdômen plano, cintura definida e contorno corporal mais firme.',
    benefits: [
      { title: 'Remodelação completa', desc: 'Transforma o abdômen e a cintura em uma única intervenção.' },
      { title: 'Eliminação da flacidez', desc: 'Remove o excesso de pele que não desaparece com dieta ou exercícios.' },
      { title: 'Músculos tonificados', desc: 'Repara e tensiona a parede abdominal para uma barriga mais lisa.' },
      { title: 'Resultados duradouros', desc: 'Se um estilo de vida saudável for mantido, os resultados são prolongados.' }
    ],
    isForYou: [
      'Você tem flacidez abdominal grave ou excesso de pele.',
      'Você passou por várias gestações e seus músculos abdominais se separaram.',
      'Você perdeu muito peso e quer eliminar o excesso de pele.',
      'Você deseja definir sua cintura e alcançar um abdômen firme.'
    ],
    faqs: [
      { q: 'Haverá uma cicatriz muito grande?', a: 'A cicatriz está localizada na parte inferior do abdômen, projetada para ser escondida sob roupas íntimas ou trajes de banho.' },
      { q: 'Posso ter filhos após o procedimento?', a: 'Sim, embora seja recomendável fazer a cirurgia quando não houver planos de gravidez para não alterar os resultados.' },
      { q: 'Quanto tempo dura o processo de recuperação?', a: 'É um procedimento de grande porte, por isso é necessário repouso relativo por 2 a 3 semanas antes de voltar ao trabalho.' }
    ]
  },
  mastopexia: {
    name: 'Mastopexia',
    category: 'Corporal',
    whatIsIt: 'A mastopexia, ou lifting de mama, é uma cirurgia projetada para elevar e remodelar seios caídos. Este procedimento devolve aos seios uma posição mais jovem e firme, realocando a aréola e o mamilo, e removendo o excesso de pele para melhorar seu contorno.',
    benefits: [
      { title: 'Rejuvenescimento do busto', desc: 'Restaura uma posição mais alta e jovem dos seios.' },
      { title: 'Firmeza recuperada', desc: 'Elimina a flacidez e melhora a tensão da pele.' },
      { title: 'Melhora da simetria', desc: 'Permite corrigir assimetrias de posição e forma.' },
      { title: 'Possibilidade de implantes', desc: 'Pode ser combinada com implantes se também houver desejo de aumento de volume.' }
    ],
    isForYou: [
      'Você sente que seus seios perderam a firmeza e parecem caídos.',
      'Seus mamilos apontam para baixo ou estão abaixo da dobra do seio.',
      'Você sofreu alterações nos seios após a amamentação ou perda de peso.',
      'Seus seios são assimétricos ou perderam o contorno jovem.'
    ],
    faqs: [
      { q: 'Vou perder a sensibilidade nos mamilos?', a: 'É normal sentir alterações temporárias na sensibilidade, mas na maioria dos casos ela é recuperada com o tempo.' },
      { q: 'Preciso de implantes com uma mastopexia?', a: 'Não é obrigatório. Se você quer apenas levantar e firmar, usa-se seu próprio tecido. Se você também quer mais volume, recomenda-se usar implantes.' },
      { q: 'As cicatrizes desaparecem?', a: 'As cicatrizes não desaparecem, mas desbotam significativamente com o tempo e os cuidados adequados.' }
    ]
  },
  liposuccion: {
    name: 'Lipoaspiração',
    category: 'Corporal',
    whatIsIt: 'A lipoaspiração é um procedimento cirúrgico destinado a remover depósitos de gordura localizada que são resistentes à dieta e exercícios. Através de técnicas especializadas, a figura é esculpida, melhorando as proporções do corpo e refinando o contorno em áreas específicas como abdômen, costas, braços ou coxas.',
    benefits: [
      { title: 'Contorno definido', desc: 'Esculpe e melhora a forma natural do seu corpo.' },
      { title: 'Tratamento localizado', desc: 'Permite focar em áreas específicas onde a gordura é difícil de eliminar.' },
      { title: 'Proporção aprimorada', desc: 'Alcança um equilíbrio visual mais harmonioso da figura.' },
      { title: 'Aumento da confiança', desc: 'As roupas cairão melhor e você se sentirá mais confortável com seu corpo.' }
    ],
    isForYou: [
      'Você está perto do seu peso ideal, mas tem áreas de gordura teimosa.',
      'Você quer refinar o contorno do seu corpo, não uma solução para obesidade.',
      'Sua pele tem boa elasticidade para se adaptar ao novo contorno.',
      'Você tem expectativas realistas sobre os resultados da remodelação.'
    ],
    faqs: [
      { q: 'A lipoaspiração serve para perder peso?', a: 'Não, é um procedimento de remodelação corporal. Recomenda-se estar próximo ao peso ideal antes da cirurgia.' },
      { q: 'A gordura pode reaparecer?', a: 'As células de gordura extraídas não retornam. No entanto, se você ganhar peso, as células restantes podem aumentar, por isso manter hábitos saudáveis é vital.' },
      { q: 'É um procedimento doloroso?', a: 'O procedimento é realizado sob anestesia. No pós-operatório, é normal sentir desconforto semelhante a dores musculares intensas, controláveis com medicação.' }
    ]
  }
};

const updateFile = (lang, data) => {
  const filePath = path.join(localesPath, `${lang}.json`);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  content.procedimientos_data = data;
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
};

updateFile('es', proceduresEs);
updateFile('en', proceduresEn);
updateFile('pt', proceduresPt);

console.log('Successfully updated translations!');

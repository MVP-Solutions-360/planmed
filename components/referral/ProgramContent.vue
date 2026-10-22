<template>
  <div class="space-y-12 text-gray-700">
    <section aria-labelledby="ref-intro">
      <h2 id="ref-intro" class="h2">Gana beneficios recomendando Plan Médico y Quirúrgico</h2>
      <div class="prose-p mt-4">
        <p>En Plan Médico y Quirúrgico valoramos profundamente la confianza que cada paciente deposita en nosotros. Por eso, creamos nuestro <strong>Programa de Remisión de Pacientes</strong>, como una forma de agradecerte por recomendarnos con tus familiares, amig@s, conocidos y personas interesadas en vivir una experiencia segura, profesional y transformadora.</p>
      </div>
    </section>

    <section aria-labelledby="ref-consiste">
      <h2 id="ref-consiste" class="h2">¿En qué consiste el programa?</h2>
      <div class="prose-p mt-4">
        <p>Cada vez que refieras a alguien y esa persona se opere con nosotros, recibirás una <strong>bonificación especial</strong>. Esta bonificación podrá redimirse de tres formas:</p>
        <ul class="bullets">
          <li>En efectivo o transferencia bancaria.</li>
          <li>Como abono a las cuotas de tu crédito con nosotros.</li>
          <li>Como saldo a favor para una futura cirugía estética o procedimiento médico.</li>
        </ul>
      </div>
    </section>

    <section aria-labelledby="ref-participar">
      <h2 id="ref-participar" class="h2">¿Cómo participar?</h2>
      <ol class="steps prose-p mt-4">
        <li><span><strong>Diligencia el formulario</strong> que encontrarás al final de esta página, o visítanos en cualquiera de nuestras sedes para llenarlo de forma presencial.</span></li>
        <li><span>Una vez registrado, recibirás un <strong>código personal de remisión</strong>.</span></li>
        <li>
          <span>Puedes referirnos de las siguientes maneras:</span>
          <ul class="bullets mt-3">
            <li>Entregándole a tu referida nuestro número de atención: <a href="https://wa.me/573188043382" target="_blank" rel="noopener noreferrer" class="num">318 804 3382</a> y recordarle que mencione tu nombre o código al contactarnos.</li>
            <li>Compartiendo el número de tu referida con nuestras asesoras vía WhatsApp al <a href="https://wa.me/573188043382" target="_blank" rel="noopener noreferrer" class="num">318 804 3382</a>. Nuestro equipo se encargará del resto.</li>
          </ul>
        </li>
      </ol>
    </section>

    <section aria-labelledby="ref-bono">
      <h2 id="ref-bono" class="h2">¿Cuándo recibes tu bono?</h2>
      <div class="prose-p mt-4">
        <p>Una vez que la persona referida se opere con nosotros, te contactaremos en un plazo de <strong>hasta 10 días hábiles</strong> después de la cirugía para informarte el valor de tu bono (el monto varía según el tipo de procedimiento realizado).</p>
      </div>
      <aside class="mt-6 border border-[#D3A76A]/50 border-l-4 border-l-[#D3A76A] bg-[#D3A76A]/10 px-5 py-4 text-[15px] leading-relaxed text-[#0C2619]" role="note">
        <p><strong>Importante:</strong> Si la cirugía fue financiada mediante nuestro crédito directo, el bono se pagará después de 4 meses, sujeto al cumplimiento de pagos por parte de la paciente referida.</p>
      </aside>
    </section>
  </div>
</template>

<style scoped>
.h2 { font-family: var(--font-serif, serif); font-size: 1.5rem; line-height: 1.25; font-weight: 500; color: #0C2619; }
.prose-p { color: #4b5563; font-weight: 300; font-size: 1.0625rem; line-height: 1.75; }
.prose-p > * + * { margin-top: 1rem; }
.prose-p strong { color: #0C2619; font-weight: 600; }
.bullets { list-style: none; padding: 0; }
.bullets li { position: relative; padding-left: 1.25rem; margin-top: .5rem; }
.bullets li::before { content: ''; position: absolute; left: 0; top: .72em; width: 6px; height: 6px; background: #D3A76A; border-radius: 9999px; }
.steps { list-style: none; padding: 0; counter-reset: step; }
.steps > li { position: relative; padding-left: 2.75rem; margin-top: 1.25rem; counter-increment: step; }
.steps > li::before { content: counter(step); position: absolute; left: 0; top: 0; width: 1.875rem; height: 1.875rem; border: 1.5px solid #D3A76A; border-radius: 9999px; color: #0C2619; font-size: .8125rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.num { color: #0C2619; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
</style>

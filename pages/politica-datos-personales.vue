<template>
  <SitePageShell title="Política y protección de datos personales">
    <div class="space-y-6 text-base md:text-[17px] font-light text-gray-700 leading-relaxed">
      <p><strong class="font-semibold text-[#0C2619]">PLAN MÉDICO QUIRÚRGICO</strong> es responsable del uso de la información de nuestro público, por lo anterior, en cumplimiento de la Ley 1581 de 2012, ponemos a su disposición las Políticas de Tratamiento de Datos Personales.</p>
      <p>Para PLAN MÉDICO QUIRÚRGICO es de vital importancia el adecuado tratamiento de los datos personales de sus públicos de interés. Velamos por la confidencialidad de la información de nuestros públicos, gracias a que contamos con el apoyo de las herramientas idóneas tanto técnicas como humanas para el almacenamiento y buen uso de ésta en función de las actividades para las cuales esta información ha sido entregada.</p>
      <p>Usted puede ejercer su derecho a la protección y tratamiento de sus datos personales, tales como a conocerlos o suprimirlos diligenciando el formato de autorización o reclamo de tratamiento de datos personales y entregándolo en nuestra sede.</p>

      <ul class="grid gap-3 pt-4" aria-label="Documentos de protección de datos personales">
        <li v-for="d in documents" :key="d.href">
          <a :href="d.href" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between gap-4 bg-white border border-[#e5e2e1] border-l-[3px] border-l-[#D3A76A] px-5 py-4 text-[#0C2619] font-medium hover:bg-[#0C2619] hover:text-white transition-colors">
            <span>{{ d.label }}</span>
            <svg class="w-4 h-4 shrink-0 text-[#D3A76A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            <span class="sr-only">(abre un documento PDF en una pestaña nueva)</span>
          </a>
        </li>
      </ul>
    </div>
  </SitePageShell>
</template>

<script setup lang="ts">
// Página estática (sin administración). Texto y documentos entregados por Planmed (los PDF siguen alojados en planmed.com.co).
import { useSeoMeta } from '#imports'

const documents = [
  { label: 'Políticas de Tratamiento de Datos Personales', href: 'https://planmed.com.co/wp-content/uploads/2021/01/Politica-de-Tratamiento-Personal-3-1.pdf' },
  { label: 'Aviso de Privacidad', href: 'https://planmed.com.co/wp-content/uploads/2019/03/AVISO-DE-PRIVACIDAD-PLANMED.pdf' },
  { label: 'Formato de Autorización de Tratamiento de Datos Personales', href: 'https://planmed.com.co/wp-content/uploads/2019/03/AVISO-DE-PRIVACIDAD-Y-AUTORIZACI%C3%93N-EXPRESA-PARA-EL-TRATAMIENTO-DE-DATOS-PERSONALES-PLANMED.pdf' },
  { label: 'Formato de Reclamación de Tratamiento de Datos Personales', href: 'https://planmed.com.co/wp-content/uploads/2019/03/RECLAMACIONES-DATOS-PERSONALES.docx.pdf' }
]

useSeoMeta({ title: 'Política y protección de datos personales | Planmed', ogTitle: 'Política y protección de datos personales | Planmed', ogType: 'website' })
</script>

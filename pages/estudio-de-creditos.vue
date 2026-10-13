<template>
  <!-- Página estática (sin administración en este panel): solo el formulario, que aún es maqueta. -->
  <SitePageShell title="Estudio de créditos" wide>
    <CreditStudyForm class="!mt-0" />
  </SitePageShell>
</template>

<script setup lang="ts">
import { useSeoMeta, useHead } from '#imports'

useSeoMeta({ title: 'Estudio de créditos | Planmed', ogTitle: 'Estudio de créditos | Planmed', ogType: 'website' })
useHead({ link: [{ rel: 'canonical', href: 'https://planmed.com/estudio-de-creditos' }] })
</script>

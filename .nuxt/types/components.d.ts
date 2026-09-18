
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T> = DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>> & T

type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }> & T

interface _GlobalComponents {
  CommonCtaSection: typeof import("../../components/common/CtaSection.vue")['default']
  CommonMedicalLeadershipSection: typeof import("../../components/common/MedicalLeadershipSection.vue")['default']
  CommonPrecontractualModal: typeof import("../../components/common/PrecontractualModal.vue")['default']
  CommonProcessSection: typeof import("../../components/common/ProcessSection.vue")['default']
  CommonResourceCard: typeof import("../../components/common/ResourceCard.vue")['default']
  CommonTrustSection: typeof import("../../components/common/TrustSection.vue")['default']
  FormsBaseSelect: typeof import("../../components/forms/BaseSelect.vue")['default']
  FormsBaseSlider: typeof import("../../components/forms/BaseSlider.vue")['default']
  FormsLeadForm: typeof import("../../components/forms/LeadForm.vue")['default']
  HomeClinicsSection: typeof import("../../components/home/ClinicsSection.vue")['default']
  HomeHowItWorksSection: typeof import("../../components/home/HowItWorksSection.vue")['default']
  HomeProcedureCard: typeof import("../../components/home/ProcedureCard.vue")['default']
  HomeProceduresSection: typeof import("../../components/home/ProceduresSection.vue")['default']
  HomeValueProposition: typeof import("../../components/home/ValueProposition.vue")['default']
  LayoutFooter: typeof import("../../components/layout/Footer.vue")['default']
  LayoutNavbar: typeof import("../../components/layout/Navbar.vue")['default']
  NewsInstagramEmbed: typeof import("../../components/news/InstagramEmbed.vue")['default']
  NewsYouTubeEmbed: typeof import("../../components/news/YouTubeEmbed.vue")['default']
  SimulatorNextStepsSection: typeof import("../../components/simulator/NextStepsSection.vue")['default']
  SimulatorResultCard: typeof import("../../components/simulator/ResultCard.vue")['default']
  NuxtWelcome: typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue")['default']
  NuxtLayout: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
  NuxtErrorBoundary: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
  ClientOnly: typeof import("../../node_modules/nuxt/dist/app/components/client-only")['default']
  DevOnly: typeof import("../../node_modules/nuxt/dist/app/components/dev-only")['default']
  ServerPlaceholder: typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']
  NuxtLink: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link")['default']
  NuxtLoadingIndicator: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
  NuxtTime: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
  NuxtRouteAnnouncer: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
  NuxtAnnouncer: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-announcer")['default']
  NuxtImg: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
  NuxtPicture: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
  NuxtPage: typeof import("../../node_modules/nuxt/dist/pages/runtime/page")['default']
  NoScript: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['NoScript']
  Link: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Link']
  Base: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Base']
  Title: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Title']
  Meta: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Meta']
  Style: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Style']
  Head: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Head']
  Html: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Html']
  Body: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Body']
  NuxtIsland: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island")['default']
  LazyCommonCtaSection: LazyComponent<typeof import("../../components/common/CtaSection.vue")['default']>
  LazyCommonMedicalLeadershipSection: LazyComponent<typeof import("../../components/common/MedicalLeadershipSection.vue")['default']>
  LazyCommonPrecontractualModal: LazyComponent<typeof import("../../components/common/PrecontractualModal.vue")['default']>
  LazyCommonProcessSection: LazyComponent<typeof import("../../components/common/ProcessSection.vue")['default']>
  LazyCommonResourceCard: LazyComponent<typeof import("../../components/common/ResourceCard.vue")['default']>
  LazyCommonTrustSection: LazyComponent<typeof import("../../components/common/TrustSection.vue")['default']>
  LazyFormsBaseSelect: LazyComponent<typeof import("../../components/forms/BaseSelect.vue")['default']>
  LazyFormsBaseSlider: LazyComponent<typeof import("../../components/forms/BaseSlider.vue")['default']>
  LazyFormsLeadForm: LazyComponent<typeof import("../../components/forms/LeadForm.vue")['default']>
  LazyHomeClinicsSection: LazyComponent<typeof import("../../components/home/ClinicsSection.vue")['default']>
  LazyHomeHowItWorksSection: LazyComponent<typeof import("../../components/home/HowItWorksSection.vue")['default']>
  LazyHomeProcedureCard: LazyComponent<typeof import("../../components/home/ProcedureCard.vue")['default']>
  LazyHomeProceduresSection: LazyComponent<typeof import("../../components/home/ProceduresSection.vue")['default']>
  LazyHomeValueProposition: LazyComponent<typeof import("../../components/home/ValueProposition.vue")['default']>
  LazyLayoutFooter: LazyComponent<typeof import("../../components/layout/Footer.vue")['default']>
  LazyLayoutNavbar: LazyComponent<typeof import("../../components/layout/Navbar.vue")['default']>
  LazyNewsInstagramEmbed: LazyComponent<typeof import("../../components/news/InstagramEmbed.vue")['default']>
  LazyNewsYouTubeEmbed: LazyComponent<typeof import("../../components/news/YouTubeEmbed.vue")['default']>
  LazySimulatorNextStepsSection: LazyComponent<typeof import("../../components/simulator/NextStepsSection.vue")['default']>
  LazySimulatorResultCard: LazyComponent<typeof import("../../components/simulator/ResultCard.vue")['default']>
  LazyNuxtWelcome: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
  LazyNuxtLayout: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
  LazyNuxtErrorBoundary: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
  LazyClientOnly: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/client-only")['default']>
  LazyDevOnly: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/dev-only")['default']>
  LazyServerPlaceholder: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
  LazyNuxtLink: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
  LazyNuxtLoadingIndicator: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
  LazyNuxtTime: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
  LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
  LazyNuxtAnnouncer: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-announcer")['default']>
  LazyNuxtImg: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
  LazyNuxtPicture: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
  LazyNuxtPage: LazyComponent<typeof import("../../node_modules/nuxt/dist/pages/runtime/page")['default']>
  LazyNoScript: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
  LazyLink: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Link']>
  LazyBase: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Base']>
  LazyTitle: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Title']>
  LazyMeta: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Meta']>
  LazyStyle: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Style']>
  LazyHead: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Head']>
  LazyHtml: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Html']>
  LazyBody: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Body']>
  LazyNuxtIsland: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island")['default']>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export {}

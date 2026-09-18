
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


export const CommonCtaSection: typeof import("../components/common/CtaSection.vue")['default']
export const CommonMedicalLeadershipSection: typeof import("../components/common/MedicalLeadershipSection.vue")['default']
export const CommonPrecontractualModal: typeof import("../components/common/PrecontractualModal.vue")['default']
export const CommonProcessSection: typeof import("../components/common/ProcessSection.vue")['default']
export const CommonResourceCard: typeof import("../components/common/ResourceCard.vue")['default']
export const CommonTrustSection: typeof import("../components/common/TrustSection.vue")['default']
export const FormsBaseSelect: typeof import("../components/forms/BaseSelect.vue")['default']
export const FormsBaseSlider: typeof import("../components/forms/BaseSlider.vue")['default']
export const FormsLeadForm: typeof import("../components/forms/LeadForm.vue")['default']
export const HomeClinicsSection: typeof import("../components/home/ClinicsSection.vue")['default']
export const HomeHowItWorksSection: typeof import("../components/home/HowItWorksSection.vue")['default']
export const HomeProcedureCard: typeof import("../components/home/ProcedureCard.vue")['default']
export const HomeProceduresSection: typeof import("../components/home/ProceduresSection.vue")['default']
export const HomeValueProposition: typeof import("../components/home/ValueProposition.vue")['default']
export const LayoutFooter: typeof import("../components/layout/Footer.vue")['default']
export const LayoutNavbar: typeof import("../components/layout/Navbar.vue")['default']
export const NewsInstagramEmbed: typeof import("../components/news/InstagramEmbed.vue")['default']
export const NewsYouTubeEmbed: typeof import("../components/news/YouTubeEmbed.vue")['default']
export const SimulatorNextStepsSection: typeof import("../components/simulator/NextStepsSection.vue")['default']
export const SimulatorResultCard: typeof import("../components/simulator/ResultCard.vue")['default']
export const NuxtWelcome: typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']
export const NuxtLayout: typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
export const NuxtErrorBoundary: typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
export const ClientOnly: typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']
export const DevOnly: typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']
export const ServerPlaceholder: typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const NuxtLink: typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']
export const NuxtLoadingIndicator: typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
export const NuxtTime: typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
export const NuxtAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/nuxt-announcer")['default']
export const NuxtImg: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
export const NuxtPicture: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
export const NuxtPage: typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']
export const NoScript: typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']
export const Link: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']
export const Base: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']
export const Title: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']
export const Meta: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']
export const Style: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']
export const Head: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']
export const Html: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']
export const Body: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']
export const NuxtIsland: typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']
export const LazyCommonCtaSection: LazyComponent<typeof import("../components/common/CtaSection.vue")['default']>
export const LazyCommonMedicalLeadershipSection: LazyComponent<typeof import("../components/common/MedicalLeadershipSection.vue")['default']>
export const LazyCommonPrecontractualModal: LazyComponent<typeof import("../components/common/PrecontractualModal.vue")['default']>
export const LazyCommonProcessSection: LazyComponent<typeof import("../components/common/ProcessSection.vue")['default']>
export const LazyCommonResourceCard: LazyComponent<typeof import("../components/common/ResourceCard.vue")['default']>
export const LazyCommonTrustSection: LazyComponent<typeof import("../components/common/TrustSection.vue")['default']>
export const LazyFormsBaseSelect: LazyComponent<typeof import("../components/forms/BaseSelect.vue")['default']>
export const LazyFormsBaseSlider: LazyComponent<typeof import("../components/forms/BaseSlider.vue")['default']>
export const LazyFormsLeadForm: LazyComponent<typeof import("../components/forms/LeadForm.vue")['default']>
export const LazyHomeClinicsSection: LazyComponent<typeof import("../components/home/ClinicsSection.vue")['default']>
export const LazyHomeHowItWorksSection: LazyComponent<typeof import("../components/home/HowItWorksSection.vue")['default']>
export const LazyHomeProcedureCard: LazyComponent<typeof import("../components/home/ProcedureCard.vue")['default']>
export const LazyHomeProceduresSection: LazyComponent<typeof import("../components/home/ProceduresSection.vue")['default']>
export const LazyHomeValueProposition: LazyComponent<typeof import("../components/home/ValueProposition.vue")['default']>
export const LazyLayoutFooter: LazyComponent<typeof import("../components/layout/Footer.vue")['default']>
export const LazyLayoutNavbar: LazyComponent<typeof import("../components/layout/Navbar.vue")['default']>
export const LazyNewsInstagramEmbed: LazyComponent<typeof import("../components/news/InstagramEmbed.vue")['default']>
export const LazyNewsYouTubeEmbed: LazyComponent<typeof import("../components/news/YouTubeEmbed.vue")['default']>
export const LazySimulatorNextStepsSection: LazyComponent<typeof import("../components/simulator/NextStepsSection.vue")['default']>
export const LazySimulatorResultCard: LazyComponent<typeof import("../components/simulator/ResultCard.vue")['default']>
export const LazyNuxtWelcome: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
export const LazyNuxtLayout: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
export const LazyNuxtErrorBoundary: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
export const LazyClientOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']>
export const LazyDevOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']>
export const LazyServerPlaceholder: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
export const LazyNuxtLink: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
export const LazyNuxtLoadingIndicator: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
export const LazyNuxtTime: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
export const LazyNuxtAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-announcer")['default']>
export const LazyNuxtImg: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
export const LazyNuxtPicture: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
export const LazyNuxtPage: LazyComponent<typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']>
export const LazyNoScript: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
export const LazyLink: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']>
export const LazyBase: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']>
export const LazyTitle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']>
export const LazyMeta: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']>
export const LazyStyle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']>
export const LazyHead: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']>
export const LazyHtml: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']>
export const LazyBody: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']>
export const LazyNuxtIsland: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']>

export const componentNames: string[]

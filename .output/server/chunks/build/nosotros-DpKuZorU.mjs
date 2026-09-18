import { _ as __nuxt_component_0 } from './nuxt-link-kALotrp4.mjs';
import { mergeProps, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrInterpolate, ssrRenderComponent } from 'vue/server-renderer';
import { e as useSeoMeta, u as useHead } from './server.mjs';
import '../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'consola';
import 'nuxtseo-shared/utils';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';
import 'vue-router';
import '@vue/shared';

const aboutData = [
  {
    id: "nuestra-trayectoria",
    title: "5 Años de Experiencia",
    content: [
      "Con aproximadamente 5 años en el mercado, Planmed nació con el objetivo de facilitar el acceso a financiación para procedimientos médicos y estéticos.",
      "A lo largo de nuestra trayectoria, nos hemos consolidado como un aliado humano y profesional, permitiendo que miles de personas accedan a sus procedimientos sin fricciones."
    ]
  },
  {
    id: "financiacion-directa",
    title: "Financiación Directa",
    content: [
      "Nuestra principal ventaja es que financiamos directamente sin depender de intermediarios bancarios complejos.",
      "Podemos financiar desde el 50% hasta el 100% del valor de tu procedimiento directamente, para que tu proceso sea lo más fluido posible."
    ]
  },
  {
    id: "acompanamiento",
    title: "Acompañamiento Real",
    content: [
      "Entendemos que cada situación es única. Por eso, evaluamos cada caso de manera personalizada durante nuestro estudio de crédito.",
      "Hacemos que el proceso sea claro y cercano, acompañándote desde la simulación de tu cuota hasta la aprobación y el desembolso directo a tu especialista."
    ]
  }
];
const _sfc_main = {
  __name: "nosotros",
  __ssrInlineRender: true,
  setup(__props) {
    useSeoMeta({
      title: "Nosotros | Planmed",
      description: "Conoce la filosofía de Planmed y cómo facilitamos el acceso a procedimientos estéticos a través de soluciones claras.",
      ogTitle: "Nosotros | Planmed",
      ogDescription: "Conoce la filosofía de Planmed y cómo facilitamos el acceso a procedimientos estéticos a través de soluciones claras.",
      ogImage: "/images/branding/logo_fondo_transparente.png",
      ogType: "website"
    });
    useHead({
      link: [
        { rel: "canonical", href: "https://planmed.com/nosotros" }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-white min-h-screen font-sans selection:bg-[#0C2619] selection:text-white pt-24 md:pt-32 pb-24" }, _attrs))}><div class="max-w-[1000px] mx-auto px-6"><div class="mb-24 text-center md:text-left border-t border-black pt-8"><p class="text-[11px] font-bold tracking-[0.15em] text-[#848484] uppercase mb-4 flex items-center justify-center md:justify-start gap-3"><span class="w-2 h-2 rounded-full bg-[#0C2619]"></span> SOBRE PLANMED </p><h1 class="font-serif text-[40px] md:text-[56px] lg:text-[72px] font-medium leading-[1.05] tracking-[-0.02em] text-black uppercase max-w-4xl mt-12 mb-8"> EL ACCESO A TU<br> BIENESTAR,<br> SIMPLIFICADO. </h1></div><div class="flex flex-col gap-20 md:gap-32 mb-32"><!--[-->`);
      ssrRenderList(unref(aboutData), (section) => {
        _push(`<section class="flex flex-col md:flex-row items-start gap-8 md:gap-16 border-t border-gray-100 pt-12 md:pt-16"><div class="w-full md:w-1/3 flex-shrink-0"><h2 class="font-serif text-2xl md:text-3xl font-medium text-black tracking-tight leading-snug">${ssrInterpolate(section.title)}</h2></div><div class="w-full md:w-2/3 flex flex-col gap-6"><!--[-->`);
        ssrRenderList(section.content, (paragraph, index) => {
          _push(`<p class="text-gray-600 font-light text-lg md:text-xl leading-relaxed">${ssrInterpolate(paragraph)}</p>`);
        });
        _push(`<!--]--></div></section>`);
      });
      _push(`<!--]--></div><div class="bg-[#0C2619] text-white rounded-none p-12 md:p-24 flex flex-col items-center text-center"><p class="text-[11px] font-bold tracking-[0.15em] text-white/60 uppercase mb-4"> DA EL PRIMER PASO </p><h2 class="font-serif text-3xl md:text-5xl font-medium leading-[1.1] tracking-[-0.02em] mb-6 max-w-2xl mx-auto"> PLANIFICA TU PROCEDIMIENTO HOY. </h2><p class="text-white/80 font-light leading-relaxed mb-12 max-w-xl mx-auto"> Conoce tus opciones de cuotas y descubre cómo Planmed puede facilitar tu acceso. </p>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/simulador",
        class: "bg-white text-[#0C2619] px-10 py-5 font-bold text-xs tracking-widest uppercase hover:bg-gray-100 transition-colors active:scale-95 w-full sm:w-auto"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Ir al Simulador `);
          } else {
            return [
              createTextVNode(" Ir al Simulador ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/nosotros.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=nosotros-DpKuZorU.mjs.map

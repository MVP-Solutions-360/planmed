import { _ as __nuxt_component_0 } from './nuxt-link-kALotrp4.mjs';
import { mergeProps, withCtx, createTextVNode, openBlock, createBlock, createVNode, withAsyncContext, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrRenderList, ssrInterpolate } from 'vue/server-renderer';
import { p as publicAssetsURL } from '../routes/renderer.mjs';
import { p as procedureService } from './ProcedureService-C1UHPNuV.mjs';
import { e as useSeoMeta, c as useAsyncData } from './server.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
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
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';
import 'vue-router';
import '@vue/shared';

const _imports_0 = publicAssetsURL("/images/web/home.png");
const _sfc_main$5 = {
  __name: "HomeValueProposition",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "bg-[#0C2619] py-24 md:py-32 px-6" }, _attrs))}><div class="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 items-center"><div class="md:col-span-7 pr-0 md:pr-12"><h2 class="font-serif text-[40px] md:text-[56px] lg:text-[72px] font-medium leading-[1.05] tracking-[-0.02em] text-[#D3A76A]"> FINANCIA TU<br> PROCEDIMIENTO<br><span class="text-[#D3A76A]/80">DIRECTAMENTE.</span></h2></div><div class="md:col-span-5 flex flex-col gap-8 md:pl-12 md:border-l border-[#D3A76A]/30"><p class="text-[16px] md:text-[18px] text-[#D3A76A]/90 font-normal leading-[1.7]"> Nuestro equipo está aquí para ayudarte a explorar diferentes planes de pago, encontrar la mejor opción para ti y garantizar que puedas realizar tu transformación sin preocupaciones financieras. </p><div class="flex items-center gap-4"><div class="w-12 h-[1px] bg-[#D3A76A]"></div><p class="text-[11px] font-bold tracking-[0.15em] text-[#D3A76A] uppercase">Sin intermediarios innecesarios</p></div></div></div></section>`);
    };
  }
};
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/home/ValueProposition.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const _sfc_main$4 = {
  __name: "HomeProcedureCard",
  __ssrInlineRender: true,
  props: {
    procedure: {
      type: Object,
      required: true
    }
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "group flex flex-col gap-6 cursor-pointer" }, _attrs))}><div class="relative w-full aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-[#e5e2e1]"><img${ssrRenderAttr("src", __props.procedure.image)}${ssrRenderAttr("alt", __props.procedure.name)} class="w-full h-full object-cover grayscale contrast-125 brightness-95 transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"><div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 z-10"></div></div><div class="flex flex-col gap-3"><div class="flex justify-between items-center"><h3 class="font-serif text-[24px] md:text-[28px] text-black transition-colors duration-300">${ssrInterpolate(__props.procedure.name)}</h3><span class="w-8 h-8 rounded-full border border-[#e5e2e1] flex items-center justify-center text-[#848484] group-hover:border-black group-hover:bg-black group-hover:text-white transition-all duration-300"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></span></div><p class="text-[14px] text-[#4c4546] font-normal leading-[1.6] max-w-[95%]">${ssrInterpolate(__props.procedure.shortDescription)}</p></div></div>`);
    };
  }
};
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/home/ProcedureCard.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const _sfc_main$3 = {
  __name: "HomeProceduresSection",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { data: procedures } = ([__temp, __restore] = withAsyncContext(() => useAsyncData("home-procedures", () => procedureService.getProcedures(), {
      default: () => []
    })), __temp = await __temp, __restore(), __temp);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_HomeProcedureCard = _sfc_main$4;
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "bg-white py-24 md:py-32 px-6" }, _attrs))}><div class="max-w-[1200px] mx-auto"><div class="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 md:mb-24 border-t border-[#0C2619] pt-8"><div class="max-w-xl"><p class="text-[11px] font-bold tracking-[0.15em] text-[#848484] uppercase mb-6 flex items-center gap-3"><span class="w-2 h-2 rounded-full bg-[#0C2619]"></span> PORTAFOLIO MÉDICO </p><h2 class="font-serif text-[40px] md:text-[56px] lg:text-[64px] font-medium leading-[1.05] tracking-[-0.02em] text-[#0C2619] uppercase mb-4"> PROCEDIMIENTOS<br> DESTACADOS. </h2><p class="text-[14px] text-[#4c4546] font-medium">Estamos ampliando progresivamente nuestra oferta de procedimientos financiables.</p></div><div class="hidden md:block">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/procedimientos",
        class: "text-[11px] font-bold tracking-[0.15em] text-[#0C2619] border-b border-[#0C2619] pb-2 uppercase hover:text-[#848484] hover:border-[#848484] transition-colors"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` VER TODOS LOS PROCEDIMIENTOS `);
          } else {
            return [
              createTextVNode(" VER TODOS LOS PROCEDIMIENTOS ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-24 gap-y-16"><!--[-->`);
      ssrRenderList(unref(procedures), (proc, index) => {
        _push(ssrRenderComponent(_component_HomeProcedureCard, {
          key: proc.id,
          procedure: proc,
          class: { "md:mt-24": index % 2 !== 0 }
        }, null, _parent));
      });
      _push(`<!--]--></div><div class="mt-16 md:hidden text-center border-t border-[#e5e2e1] pt-8">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/procedimientos",
        class: "text-[11px] font-bold tracking-[0.15em] text-[#0C2619] uppercase border-b border-[#0C2619] pb-1"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` VER TODOS LOS PROCEDIMIENTOS `);
          } else {
            return [
              createTextVNode(" VER TODOS LOS PROCEDIMIENTOS ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div></section>`);
    };
  }
};
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/home/ProceduresSection.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const _sfc_main$2 = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  const _component_NuxtLink = __nuxt_component_0;
  _push(`<section${ssrRenderAttrs(mergeProps({
    class: "py-24 md:py-32 px-6 bg-white border-t border-[#e5e2e1]",
    id: "como-funciona"
  }, _attrs))}><div class="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24"><div class="w-full lg:w-1/3 flex flex-col items-start lg:sticky lg:top-32 h-fit"><p class="text-[11px] font-bold tracking-[0.15em] text-[#848484] uppercase mb-6">EL PROCESO</p><h2 class="font-serif text-[40px] md:text-[56px] font-medium leading-[1.05] tracking-[-0.02em] text-black mb-8 uppercase"> DISEÑADO PARA TU TRANQUILIDAD. </h2><div class="w-12 h-[1px] bg-[#0C2619]"></div></div><div class="w-full lg:w-2/3 flex flex-col"><div class="border-t border-[#e5e2e1]"><div class="group flex flex-col md:flex-row gap-6 md:gap-12 py-10 md:py-16 border-b border-[#e5e2e1] hover:bg-[#fcf9f8] transition-colors -mx-6 px-6 md:mx-0 md:px-0"><div class="md:w-1/4"><span class="font-serif text-[48px] md:text-[64px] font-normal leading-none text-[#e5e2e1] group-hover:text-[#0C2619] transition-colors">01.</span></div><div class="md:w-3/4 flex flex-col gap-4"><h3 class="text-[20px] md:text-[24px] font-medium text-black tracking-[-0.01em]">Simulación y Solicitud</h3><p class="text-[14px] text-[#4c4546] font-normal leading-[1.6] max-w-lg"> El proceso es 100% virtual. Utiliza nuestro simulador para estructurar un plan a tu medida. Elige el procedimiento, monto y plazo estimado, y envía tu solicitud en minutos. </p></div></div><div class="group flex flex-col md:flex-row gap-6 md:gap-12 py-10 md:py-16 border-b border-[#e5e2e1] hover:bg-[#fcf9f8] transition-colors -mx-6 px-6 md:mx-0 md:px-0"><div class="md:w-1/4"><span class="font-serif text-[48px] md:text-[64px] font-normal leading-none text-[#e5e2e1] group-hover:text-[#0C2619] transition-colors">02.</span></div><div class="md:w-3/4 flex flex-col gap-4"><h3 class="text-[20px] md:text-[24px] font-medium text-black tracking-[-0.01em]">Estudio de Perfil</h3><p class="text-[14px] text-[#4c4546] font-normal leading-[1.6] max-w-lg"> Nuestro equipo analiza cuidadosamente cada solicitud de manera individual. ¿Tienes reportes en centrales de riesgo? Tu caso también puede ser estudiado. </p></div></div><div class="group flex flex-col md:flex-row gap-6 md:gap-12 py-10 md:py-16 border-b border-[#e5e2e1] hover:bg-[#fcf9f8] transition-colors -mx-6 px-6 md:mx-0 md:px-0"><div class="md:w-1/4"><span class="font-serif text-[48px] md:text-[64px] font-normal leading-none text-[#e5e2e1] group-hover:text-[#0C2619] transition-colors">03.</span></div><div class="md:w-3/4 flex flex-col gap-4"><h3 class="text-[20px] md:text-[24px] font-medium text-black tracking-[-0.01em]">Aprobación y Procedimiento</h3><p class="text-[14px] text-[#4c4546] font-normal leading-[1.6] max-w-lg"> Al recibir respuesta favorable, podrás avanzar con tu procedimiento en nuestra red médica aliada. Nosotros nos encargamos del respaldo financiero. </p></div></div></div><div class="mt-16">`);
  _push(ssrRenderComponent(_component_NuxtLink, {
    to: "/simulador",
    class: "inline-flex items-center gap-4 text-[11px] font-bold tracking-[0.15em] text-[#0C2619] uppercase hover:text-black transition-colors group"
  }, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(` INICIAR TU PLAN <span class="w-8 h-8 rounded-full border border-[#0C2619] group-hover:border-black flex items-center justify-center transition-colors"${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"${_scopeId}></path></svg></span>`);
      } else {
        return [
          createTextVNode(" INICIAR TU PLAN "),
          createVNode("span", { class: "w-8 h-8 rounded-full border border-[#0C2619] group-hover:border-black flex items-center justify-center transition-colors" }, [
            (openBlock(), createBlock("svg", {
              xmlns: "http://www.w3.org/2000/svg",
              class: "h-4 w-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform",
              fill: "none",
              viewBox: "0 0 24 24",
              stroke: "currentColor"
            }, [
              createVNode("path", {
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
                "stroke-width": "2",
                d: "M14 5l7 7m0 0l-7 7m7-7H3"
              })
            ]))
          ])
        ];
      }
    }),
    _: 1
  }, _parent));
  _push(`</div></div></div></section>`);
}
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/home/HowItWorksSection.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const HomeHowItWorksSection = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$2, [["ssrRender", _sfc_ssrRender]]), { __name: "HomeHowItWorksSection" });
const clinics = [
  {
    id: 1,
    name: "CEP",
    logo: "/images/allies/CEP.png",
    website: "#"
  },
  {
    id: 2,
    name: "Laser",
    logo: "/images/allies/Laser.png",
    website: "#"
  },
  {
    id: 3,
    name: "Multiestética",
    logo: "/images/allies/multiestetica.png",
    website: "#"
  },
  {
    id: 4,
    name: "Resurlaser",
    logo: "/images/allies/resurlaser.png",
    website: "#"
  },
  {
    id: 5,
    name: "Telesalud",
    logo: "/images/allies/telesalud.png",
    website: "#"
  }
];
const _sfc_main$1 = {
  __name: "HomeClinicsSection",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "py-24 md:py-32 px-6 bg-[#fcf9f8] border-t border-[#e5e2e1]" }, _attrs))}><div class="max-w-[1200px] mx-auto"><div class="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-16 md:mb-24"><div class="max-w-2xl"><p class="text-[11px] font-bold tracking-[0.15em] text-[#848484] uppercase mb-6">INSTITUCIONES Y PROFESIONALES</p><h2 class="font-serif text-[40px] md:text-[56px] font-medium leading-[1.05] tracking-[-0.02em] text-black uppercase"> RED MÉDICA ALIADA </h2><div class="w-12 h-[1px] bg-[#0C2619] mt-8"></div></div><div class="lg:w-1/3 lg:pb-4"><p class="text-[14px] text-[#4c4546] font-normal leading-[1.6]"> Puedes financiar tu procedimiento con Planmed a través de nuestra red de instituciones médicas aliadas en Medellín, Cali y Barranquilla. Atendemos pacientes de cualquier parte del mundo. </p></div></div><div class="grid grid-cols-2 lg:grid-cols-5 border-t border-l border-[#e5e2e1]"><!--[-->`);
      ssrRenderList(unref(clinics), (clinic, index) => {
        _push(`<div class="group relative aspect-square lg:aspect-auto lg:h-56 border-b border-r border-[#e5e2e1] flex flex-col items-center justify-center p-8 hover:bg-white transition-colors cursor-pointer"><span class="absolute top-4 left-5 text-[10px] font-bold tracking-widest text-[#e5e2e1] group-hover:text-[#0C2619] transition-colors"> 0${ssrInterpolate(index + 1)}</span><img${ssrRenderAttr("src", clinic.logo)}${ssrRenderAttr("alt", clinic.name)} class="max-w-[70%] max-h-[50%] object-contain grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 ease-out"></div>`);
      });
      _push(`<!--]--></div></div></section>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/home/ClinicsSection.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useSeoMeta({
      title: "Planmed | Financiación Médica Directa",
      description: "Financiamos desde el 50% hasta el 100% de tu procedimiento médico o estético directamente."
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-[#fcf9f8] text-[#1c1b1b] font-sans selection:bg-[#0C2619] selection:text-white" }, _attrs))}><div class="relative"><div class="absolute inset-y-0 left-0 w-full lg:w-[55%] bg-[#0C2619] z-0"></div><section class="relative z-10 max-w-[1440px] mx-auto px-6 pt-12 pb-24 md:pt-20 lg:flex lg:items-center lg:justify-between gap-12 min-h-[calc(100vh-88px)]"><div class="lg:w-1/2 max-w-[650px] flex flex-col items-start z-10 relative py-12"><h1 class="font-serif text-[44px] md:text-[64px] lg:text-[84px] font-semibold leading-[1.05] tracking-[-0.02em] text-white mb-8 uppercase break-words drop-shadow-sm"> TU<br> PROXIMA<br> ETAPA<br> EMPIEZA<br> CON UN<br><span class="text-[#D3A76A] font-black">PLAN.</span></h1><div class="pl-6 md:pl-8 border-l-2 border-white mb-12"><p class="text-[16px] md:text-[18px] text-white/90 font-normal leading-[1.6]"> Financia tu procedimiento estético con opciones pensadas para adaptarse a tus posibilidades, sin comprometer tu estilo de vida. </p></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/simulador",
        class: "bg-white text-[#0C2619] px-8 py-4 font-bold text-[12px] tracking-[0.1em] uppercase hover:bg-[#D3A76A] transition-colors rounded-[4px] flex items-center gap-3 shadow-md"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` SIMULAR FINANCIACIÓN <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"${_scopeId}></path></svg>`);
          } else {
            return [
              createTextVNode(" SIMULAR FINANCIACIÓN "),
              (openBlock(), createBlock("svg", {
                xmlns: "http://www.w3.org/2000/svg",
                class: "h-5 w-5",
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor"
              }, [
                createVNode("path", {
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                  "stroke-width": "2",
                  d: "M14 5l7 7m0 0l-7 7m7-7H3"
                })
              ]))
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="lg:w-1/2 mt-16 lg:mt-0 relative w-full"><div class="relative w-full aspect-[4/5] overflow-hidden bg-[#e5e2e1]"><img${ssrRenderAttr("src", _imports_0)} alt="Aesthetic Planmed" class="w-full h-full object-cover grayscale contrast-125 brightness-95 transition-all duration-500 hover:grayscale-0"></div><div class="absolute -left-4 bottom-12 md:-left-16 md:bottom-24 bg-[#fcf9f8] p-8 md:p-10 border border-[#e5e2e1] shadow-2xl max-w-[320px]"><p class="text-[11px] font-bold tracking-[0.1em] text-[#4c4546] uppercase mb-4">EJEMPLO DE PLAN</p><p class="text-[28px] md:text-[32px] font-medium text-black tracking-[-0.01em] mb-6">$10.000.000</p><hr class="border-[#e5e2e1] mb-6"><p class="text-[13px] md:text-[14px] font-normal text-[#4c4546] mb-4"> Plazo estimado <span class="font-semibold text-black">48 MESES</span></p><p class="text-[#0C2619] font-semibold text-[13px] md:text-[14px] flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg> Sujeto a estudio </p></div></div></section></div><section class="bg-white text-[#0C2619] py-24 md:py-32 px-6"><div class="max-w-[1200px] mx-auto"><h2 class="font-serif text-[40px] md:text-[56px] lg:text-[64px] font-medium leading-[1.1] text-center mb-24 max-w-[900px] mx-auto uppercase text-[#0C2619]"> NO NECESITAS TENERLO TODO HOY. </h2><hr class="border-[#cfc4c5] mb-12"><div class="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 items-center text-left"><div class="flex flex-col gap-3"><p class="text-[11px] font-bold tracking-[0.1em] text-[#848484] uppercase">VALOR PROCEDIMIENTO</p><p class="text-[24px] font-medium text-[#0C2619]">$10M</p></div><div class="flex flex-col md:flex-row md:items-center gap-8 md:gap-12 relative md:-ml-8"><div class="hidden md:flex text-[#4c4546]"><svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></div><div class="flex flex-col gap-3"><p class="text-[11px] font-bold tracking-[0.1em] text-[#848484] uppercase">MONTO A FINANCIAR</p><p class="text-[24px] font-medium text-[#0C2619]">$8M</p><p class="text-[14px] text-[#848484]">Con 48 meses de plazo</p></div></div><div class="flex flex-col gap-3 md:border-l md:border-[#cfc4c5] md:pl-12"><p class="text-[11px] font-bold tracking-[0.1em] text-[#848484] uppercase">CUOTA MENSUAL ESTIMADA</p><p class="text-[24px] font-medium text-[#0C2619]">$235,123</p></div></div><div class="mt-8 text-center text-[12px] text-[#848484] max-w-[800px] mx-auto"> *El ejemplo utiliza una tasa referencial que puede variar de acuerdo con la tasa de usura vigente, fijada mensualmente. </div><div class="mt-12 flex justify-center">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/simulador",
        class: "bg-[#0C2619] text-white px-8 py-4 font-bold text-[12px] tracking-[0.1em] uppercase hover:bg-black transition-colors rounded-[4px] flex items-center justify-center gap-3 shadow-md w-full md:w-auto"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` SIMULAR FINANCIACIÓN <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"${_scopeId}></path></svg>`);
          } else {
            return [
              createTextVNode(" SIMULAR FINANCIACIÓN "),
              (openBlock(), createBlock("svg", {
                xmlns: "http://www.w3.org/2000/svg",
                class: "h-5 w-5",
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor"
              }, [
                createVNode("path", {
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                  "stroke-width": "2",
                  d: "M14 5l7 7m0 0l-7 7m7-7H3"
                })
              ]))
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div></section>`);
      _push(ssrRenderComponent(_sfc_main$5, null, null, _parent));
      _push(ssrRenderComponent(_sfc_main$3, null, null, _parent));
      _push(ssrRenderComponent(HomeHowItWorksSection, null, null, _parent));
      _push(ssrRenderComponent(_sfc_main$1, null, null, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-BvyCtVRX.mjs.map

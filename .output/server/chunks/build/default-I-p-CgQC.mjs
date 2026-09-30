import { _ as __nuxt_component_0 } from './nuxt-link-kALotrp4.mjs';
import { useSSRContext, mergeProps, withCtx, createTextVNode, ref, createVNode, openBlock, createBlock } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrRenderSlot, ssrInterpolate } from 'vue/server-renderer';
import { p as publicAssetsURL } from '../routes/renderer.mjs';
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
import './server.mjs';
import 'vue-router';
import '@vue/shared';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';

const _imports_0$1 = publicAssetsURL("/images/branding/logo.jpg");
const _sfc_main$3 = {
  __name: "LayoutNavbar",
  __ssrInlineRender: true,
  setup(__props) {
    const isMobileMenuOpen = ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<nav${ssrRenderAttrs(mergeProps({ class: "w-full bg-[#fcf9f8] border-b border-[#e5e2e1] sticky top-0 z-50" }, _attrs))}><div class="max-w-[1440px] mx-auto px-6 h-[88px] flex justify-between items-center">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "block"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<img${ssrRenderAttr("src", _imports_0$1)} alt="Planmed" class="h-10 md:h-14 lg:h-16 w-auto object-contain"${_scopeId}>`);
          } else {
            return [
              createVNode("img", {
                src: _imports_0$1,
                alt: "Planmed",
                class: "h-10 md:h-14 lg:h-16 w-auto object-contain"
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="hidden lg:flex items-center gap-4 xl:gap-8">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "text-[11px] font-bold tracking-[0.1em] text-black border-b-2 border-black pb-1 uppercase"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`INICIO`);
          } else {
            return [
              createTextVNode("INICIO")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/procedimientos",
        class: "text-[11px] font-bold tracking-[0.1em] text-[#4c4546] hover:text-black transition-colors uppercase"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`PROCEDIMIENTOS`);
          } else {
            return [
              createTextVNode("PROCEDIMIENTOS")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/noticias",
        class: "text-[11px] font-bold tracking-[0.1em] text-[#4c4546] hover:text-black transition-colors uppercase"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`NOTICIAS`);
          } else {
            return [
              createTextVNode("NOTICIAS")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/recursos",
        class: "text-[11px] font-bold tracking-[0.1em] text-[#4c4546] hover:text-black transition-colors uppercase"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`RECURSOS`);
          } else {
            return [
              createTextVNode("RECURSOS")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/nosotros",
        class: "text-[11px] font-bold tracking-[0.1em] text-[#4c4546] hover:text-black transition-colors uppercase"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`NOSOTROS`);
          } else {
            return [
              createTextVNode("NOSOTROS")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/simulador",
        class: "bg-[#0C2619] text-white px-4 py-2.5 font-bold text-[10px] tracking-[0.15em] uppercase hover:bg-black transition-colors rounded-[2px] shadow-sm ml-4 border border-[#0C2619]"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` SIMULAR FINANCIACIÓN `);
          } else {
            return [
              createTextVNode(" SIMULAR FINANCIACIÓN ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/admin/login",
        class: "text-[11px] font-bold tracking-[0.1em] text-[#0C2619] hover:text-black transition-colors uppercase ml-4 flex items-center gap-1 border border-[#0C2619] px-3 py-2 rounded-[2px]"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"${_scopeId}></path></svg> INICIAR SESIÓN `);
          } else {
            return [
              (openBlock(), createBlock("svg", {
                xmlns: "http://www.w3.org/2000/svg",
                class: "h-3 w-3",
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor"
              }, [
                createVNode("path", {
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                  "stroke-width": "2",
                  d: "M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                })
              ])),
              createTextVNode(" INICIAR SESIÓN ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><button class="lg:hidden p-2 text-[#1c1b1b]" aria-label="Toggle menu">`);
      if (!isMobileMenuOpen.value) {
        _push(`<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>`);
      } else {
        _push(`<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>`);
      }
      _push(`</button></div>`);
      if (isMobileMenuOpen.value) {
        _push(`<div class="lg:hidden absolute top-[88px] left-0 w-full bg-[#fcf9f8] border-b border-[#cfc4c5] shadow-lg flex flex-col items-center py-10 gap-8 z-[100]">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/procedimientos",
          onClick: ($event) => isMobileMenuOpen.value = false,
          class: "text-[#4c4546] font-bold text-sm tracking-widest uppercase"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`PROCEDIMIENTOS`);
            } else {
              return [
                createTextVNode("PROCEDIMIENTOS")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/noticias",
          onClick: ($event) => isMobileMenuOpen.value = false,
          class: "text-[#4c4546] font-bold text-sm tracking-widest uppercase"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`NOTICIAS`);
            } else {
              return [
                createTextVNode("NOTICIAS")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/recursos",
          onClick: ($event) => isMobileMenuOpen.value = false,
          class: "text-[#4c4546] font-bold text-sm tracking-widest uppercase"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`RECURSOS`);
            } else {
              return [
                createTextVNode("RECURSOS")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/nosotros",
          onClick: ($event) => isMobileMenuOpen.value = false,
          class: "text-[#4c4546] font-bold text-sm tracking-widest uppercase"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`NOSOTROS`);
            } else {
              return [
                createTextVNode("NOSOTROS")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/simulador",
          onClick: ($event) => isMobileMenuOpen.value = false,
          class: "bg-[#0C2619] text-white px-8 py-3 mt-4 font-bold text-xs tracking-widest uppercase shadow-md border border-[#0C2619]"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` SIMULAR FINANCIACIÓN `);
            } else {
              return [
                createTextVNode(" SIMULAR FINANCIACIÓN ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/admin/login",
          onClick: ($event) => isMobileMenuOpen.value = false,
          class: "text-[#0C2619] font-bold text-sm tracking-widest uppercase"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` INICIAR SESIÓN `);
            } else {
              return [
                createTextVNode(" INICIAR SESIÓN ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</nav>`);
    };
  }
};
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/layout/Navbar.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const _imports_0 = publicAssetsURL("/images/branding/logo-blanco-transparente.png");
const _sfc_main$2 = {};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs) {
  const _component_NuxtLink = __nuxt_component_0;
  _push(`<footer${ssrRenderAttrs(mergeProps({ class: "font-sans w-full py-16 md:py-24 bg-[#0C2619] text-[#D3A76A] mt-auto" }, _attrs))}><div class="max-w-[1200px] mx-auto px-4 md:px-12 flex flex-col md:flex-row justify-between gap-10 md:gap-12"><div class="mb-6 md:mb-0 max-w-xs text-center md:text-left mx-auto md:mx-0"><p class="text-[#D3A76A] text-sm mb-6 leading-relaxed"> Financiamos directamente tus procedimientos médicos y estéticos, desde el 50% hasta el 100% de su valor. </p><div class="flex items-center justify-center md:justify-start gap-5 text-[#D3A76A]"><a href="#" target="_blank" rel="noopener noreferrer" class="hover:opacity-80 transition-opacity duration-300" title="Instagram"><svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"></path></svg></a><a href="#" target="_blank" rel="noopener noreferrer" class="hover:opacity-80 transition-opacity duration-300" title="Facebook"><svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path></svg></a><a href="#" target="_blank" rel="noopener noreferrer" class="hover:opacity-80 transition-opacity duration-300" title="TikTok"><svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.24-2.37.59-4.84 2.27-6.52 1.71-1.7 4.2-2.47 6.55-1.97v4.12c-1.64-.53-3.64-.17-4.88 1.09-1.24 1.25-1.55 3.32-.73 4.88.82 1.55 2.62 2.5 4.39 2.18 1.77-.32 3.12-1.85 3.12-3.64 0-4.99-.02-9.98.02-14.97z"></path></svg></a><a href="#" target="_blank" rel="noopener noreferrer" class="hover:opacity-80 transition-opacity duration-300" title="WhatsApp"><svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"></path></svg></a></div></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-16 text-center sm:text-left mx-auto md:mx-0"><div class="flex flex-col gap-3 md:gap-4"><span class="text-[#D3A76A] text-xs uppercase tracking-widest font-bold mb-2">Legal</span>`);
  _push(ssrRenderComponent(_component_NuxtLink, {
    to: "/recursos",
    class: "text-[#D3A76A] hover:opacity-80 transition-opacity text-sm"
  }, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(`Documentos Legales`);
      } else {
        return [
          createTextVNode("Documentos Legales")
        ];
      }
    }),
    _: 1
  }, _parent));
  _push(`</div><div class="flex flex-col gap-3 md:gap-4"><span class="text-[#D3A76A] text-xs uppercase tracking-widest font-bold mb-2">Compañía</span>`);
  _push(ssrRenderComponent(_component_NuxtLink, {
    to: "/nosotros",
    class: "text-[#D3A76A] hover:opacity-80 transition-opacity text-sm"
  }, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(`Sobre Planmed`);
      } else {
        return [
          createTextVNode("Sobre Planmed")
        ];
      }
    }),
    _: 1
  }, _parent));
  _push(`</div></div></div><div class="max-w-[1200px] mx-auto px-4 md:px-12 mt-12 md:mt-16 pt-8 border-t border-[#D3A76A]/20 flex flex-col md:flex-row items-center justify-between gap-6"><div class="w-full md:flex-1 flex justify-center md:justify-start"><img${ssrRenderAttr("src", _imports_0)} alt="Planmed" class="h-12 md:h-16 w-auto object-contain"></div><div class="w-full md:flex-[2] text-center"><p class="text-[#D3A76A]/80 text-xs leading-relaxed"> © 2026 Planmed. Todos los derechos reservados. </p></div><div class="hidden md:block md:flex-1"></div></div></footer>`);
}
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/layout/Footer.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$2, [["ssrRender", _sfc_ssrRender$1]]), { __name: "LayoutFooter" });
const _sfc_main$1 = {
  __name: "CommonPrecontractualModal",
  __ssrInlineRender: true,
  setup(__props) {
    const isOpen = ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      if (isOpen.value) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" }, _attrs))}><div class="bg-white text-black w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"><div class="px-8 py-6 border-b border-gray-100 flex-shrink-0"><h2 class="text-xl font-extrabold text-black uppercase tracking-wide">${ssrInterpolate("Información Precontractual")}</h2></div><div class="p-4 md:p-8 overflow-y-auto space-y-6 text-gray-700 leading-relaxed text-sm"><p>${`El presente documento es suministrado por <strong>PLANMED S.A.S.</strong>, sociedad identificada con <strong>NIT. 901532790</strong>, con domicilio principal en la ciudad de Medellín y cuyos canales oficiales para la atención de Peticiones, Quejas y Reclamos se encuentran disponibles en el correo electrónico institucional: <a href="mailto:pqrs.institucional{'@'}gmail.com" class="text-primary hover:underline font-semibold">pqrs.institucional{'@'}gmail.com</a>.`}</p><p>${"Al continuar con este proceso, usted reconoce y acepta que <strong>PLANMED S.A.S.</strong> es una sociedad comercial que otorga créditos exclusivamente con recursos propios y que su actividad no es la de una entidad financiera regulada, ni la de una Institución Prestadora de Servicios de Salud (IPS) o clínica."}</p><p>${"En consecuencia, la labor de la compañía se limita al financiamiento y no garantiza resultados médicos o quirúrgicos, los cuales son responsabilidad exclusiva del profesional que usted elija."}</p><p>${"Asimismo, comprende que el envío de su solicitud no implica una aprobación automática, pues el otorgamiento del crédito está sujeto a un riguroso análisis de riesgo por parte de nuestro departamento de cartera, el cual se reserva el derecho de negar la financiación según sus políticas internas."}</p><p>${"El consumidor tiene el derecho de realizar el pago total o parcial de su deuda en cualquier momento, abonando únicamente los intereses corrientes o de mora que se hayan causado efectivamente hasta la fecha en que se realice el abono. En ningún caso se impondrán penalidades, multas ni sanciones por concepto de pagos anticipados."}</p><p>${"Asimismo, mediante la aceptación de estas condiciones, usted declara entender que esta operación de crédito genera obligaciones civiles de pago y la causación de intereses corrientes y de mora a la tasa máxima legal establecida por la Superintendencia Financiera de Colombia, lo que implica que el incumplimiento en el pago de las cuotas podrá derivar en reportes negativos ante centrales de riesgo como Datacrédito o CIFIN, así como en el inicio de gestiones de cobro administrativo o judicial para la recuperación de la obligación."}</p><p>${"De igual forma, acepta que toda la publicidad visualizada en redes sociales o canales de mensería tiene un carácter meramente informativo y comercial, por lo que no constituye una promesa de aprobación ni una garantía sobre los resultados del procedimiento a financiar."}</p><p>${"Al hacer clic en el botón de aceptación o continuar con el formulario, usted confirma que ha recibido información suficiente, veraz y oportuna, y que acepta estas condiciones de manera voluntaria antes de cualquier desembolso, entendiendo que para la formalización final se requerirá su firma física o digital certificada en el documento oficial de advertencias."}</p><p class="font-semibold text-black">${ssrInterpolate("Si acepta continuar, manifiesta que conoce y acepta los términos, condiciones y advertencias aquí descritas.")}</p></div><div class="px-4 md:px-8 py-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-4 flex-shrink-0"><button class="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-bold hover:bg-gray-100 transition-colors text-center text-sm active:scale-95"><span class="font-bold">${ssrInterpolate("No acepto")}</span></button><button class="w-full sm:w-auto px-8 py-3 bg-black text-white rounded-full font-bold hover:bg-primary hover:text-black transition-all text-center text-sm active:scale-95 shadow-md flex items-center justify-center">${ssrInterpolate("Acepto y continuar")} <span class="ml-2">➔</span></button></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/common/PrecontractualModal.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  const _component_LayoutNavbar = _sfc_main$3;
  const _component_LayoutFooter = __nuxt_component_1;
  const _component_CommonPrecontractualModal = _sfc_main$1;
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-white text-black flex flex-col font-sans" }, _attrs))}>`);
  _push(ssrRenderComponent(_component_LayoutNavbar, null, null, _parent));
  _push(`<main class="flex-grow">`);
  ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
  _push(`</main>`);
  _push(ssrRenderComponent(_component_LayoutFooter, null, null, _parent));
  _push(`<a href="https://wa.me/573014746735?text=Estuve revisando la página y me gustaría más información acerca de las opciones de financiación." target="_blank" class="fixed bottom-4 right-4 md:bottom-8 md:right-8 bg-black text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 hover:bg-primary active:scale-95 transition-all z-40 group"><svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.388 0 12.035c0 2.124.551 4.195 1.6 6.012L.15 23.518l5.63-1.478a11.956 11.956 0 006.25 1.761h.005c6.645 0 12.03-5.389 12.03-12.036C24.062 5.388 18.674 0 12.031 0zm0 21.8A9.97 9.97 0 016.924 20.4l-.364-.216-3.791.993.996-3.69-.236-.376C2.391 15.352 1.8 13.722 1.8 12.035 1.8 6.4 6.386 1.82 12.033 1.82c5.645 0 10.231 4.582 10.231 10.215 0 5.634-4.585 10.216-10.231 10.216v-.451zm5.61-7.66c-.308-.154-1.822-.9-2.105-1.002-.284-.102-.49-.154-.698.154-.207.308-.797 1.003-.975 1.208-.18.205-.357.23-.665.077-1.348-.675-2.45-1.428-3.39-2.784-.243-.346.242-.32.836-1.503.076-.153.037-.282-.02-.435-.056-.154-.698-1.684-.956-2.308-.25-.608-.507-.525-.698-.534-.18-.009-.387-.01-.595-.01-.207 0-.542.077-.826.385C7.26 7.42 6.4 8.243 6.4 9.914c0 1.671 1.293 3.29 1.474 3.533.18.244 2.404 3.674 5.82 5.148 2.298.989 3.226 1.05 4.354.887 1.267-.183 3.864-1.579 4.405-3.107.542-1.527.542-2.836.38-3.107-.164-.27-.595-.425-.903-.58z"></path></svg><span class="hidden md:block absolute right-16 bg-black text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">${ssrInterpolate("Hablar con un asesor")}</span></a>`);
  _push(ssrRenderComponent(_component_CommonPrecontractualModal, null, null, _parent));
  _push(`</div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/default.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _default = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);

export { _default as default };
//# sourceMappingURL=default-I-p-CgQC.mjs.map

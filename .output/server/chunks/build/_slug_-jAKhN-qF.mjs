import { _ as __nuxt_component_0 } from './nuxt-link-kALotrp4.mjs';
import { withAsyncContext, mergeProps, withCtx, openBlock, createBlock, createVNode, createTextVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr } from 'vue/server-renderer';
import { useRoute, useRouter } from 'vue-router';
import { p as procedureService } from './ProcedureService-C1UHPNuV.mjs';
import { c as useAsyncData, d as createError, e as useSeoMeta } from './server.mjs';
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
import '@vue/shared';

const _sfc_main = {
  __name: "[slug]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    useRouter();
    const { data: procedure } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      "procedure-" + route.params.slug,
      () => procedureService.getProcedureBySlug(route.params.slug),
      "$BpxBR4FLxo"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    if (!procedure.value) {
      throw createError({
        statusCode: 404,
        statusMessage: "Procedimiento no encontrado",
        fatal: true
      });
    }
    useSeoMeta({
      title: `${procedure.value.name} | Planmed`,
      description: procedure.value.description
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-white min-h-screen text-black font-sans selection:bg-[#0C2619] selection:text-white pt-24 md:pt-32 pb-24" }, _attrs))}><div class="max-w-[1200px] mx-auto px-6">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/procedimientos",
        class: "inline-flex items-center gap-3 text-[11px] font-bold tracking-[0.15em] text-[#848484] hover:text-black transition-colors uppercase mb-12"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"${_scopeId}></path></svg> VOLVER AL PORTAFOLIO `);
          } else {
            return [
              (openBlock(), createBlock("svg", {
                xmlns: "http://www.w3.org/2000/svg",
                class: "h-4 w-4",
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor"
              }, [
                createVNode("path", {
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                  "stroke-width": "2",
                  d: "M10 19l-7-7m0 0l7-7m-7 7h18"
                })
              ])),
              createTextVNode(" VOLVER AL PORTAFOLIO ")
            ];
          }
        }),
        _: 1
      }, _parent));
      if (unref(procedure)) {
        _push(`<div class="flex flex-col lg:flex-row gap-16 lg:gap-24"><div class="w-full lg:w-1/2 flex flex-col items-start pt-4"><p class="text-[11px] font-bold tracking-[0.15em] text-[#0C2619] uppercase mb-4">${ssrInterpolate(unref(procedure).category || "PROCEDIMIENTO")}</p><h1 class="font-serif text-[40px] md:text-[56px] lg:text-[72px] font-medium leading-[1.05] tracking-[-0.02em] text-black mb-8 uppercase">${ssrInterpolate(unref(procedure).name)}</h1><div class="space-y-6 text-[#4c4546] font-light leading-relaxed text-lg md:text-xl"><p>${ssrInterpolate(unref(procedure).shortDescription)}</p>`);
        if (unref(procedure).whatIsIt) {
          _push(`<p class="text-base text-gray-500">${ssrInterpolate(unref(procedure).whatIsIt)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><hr class="w-12 border-black my-12"><div class="bg-[#fcf9f8] p-8 md:p-10 border border-[#e5e2e1] w-full"><h3 class="font-serif text-2xl font-medium mb-4 text-black">Inicia tu plan.</h3><p class="text-sm text-[#4c4546] mb-8 leading-relaxed"> La viabilidad de esta intervención médica será determinada por un profesional certificado. Nuestro rol es brindarte la tranquilidad financiera para que puedas enfocarte en tu bienestar. </p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: { path: "/simulador", query: { procedureId: unref(procedure).id } },
          class: "w-full sm:w-auto inline-flex justify-center bg-[#0C2619] text-white px-8 py-4 font-bold text-[11px] tracking-[0.15em] uppercase hover:bg-black transition-colors"
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
        _push(`</div></div><div class="w-full lg:w-1/2"><div class="relative w-full aspect-[3/4] overflow-hidden bg-gray-100 sticky top-32">`);
        if (unref(procedure).image) {
          _push(`<img${ssrRenderAttr("src", unref(procedure).image)}${ssrRenderAttr("alt", unref(procedure).name)} class="w-full h-full object-cover grayscale-[10%]">`);
        } else {
          _push(`<div class="absolute inset-0 flex items-center justify-center text-[#848484] text-sm tracking-widest uppercase"> IMAGEN EN PRODUCCIÓN </div>`);
        }
        _push(`</div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/procedimientos/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_slug_-jAKhN-qF.mjs.map

import { _ as __nuxt_component_0 } from './nuxt-link-kALotrp4.mjs';
import { defineComponent, withCtx, createVNode, openBlock, createBlock, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent } from 'vue/server-renderer';
import { u as useHead } from './server.mjs';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "Dashboard | Admin Planmed"
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="mb-10"><h2 class="text-3xl font-serif text-[#0C2619] mb-2 uppercase">Bienvenido a Planmed</h2><p class="text-gray-500 font-light">Panel de control administrativo</p></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/admin/procedimientos",
        class: "bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="w-12 h-12 bg-[#0C2619]/5 rounded-lg flex items-center justify-center mb-6 text-[#0C2619] group-hover:scale-110 transition-transform"${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"${_scopeId}></path></svg></div><h3 class="text-lg font-bold text-gray-900 mb-2"${_scopeId}>Procedimientos</h3><p class="text-sm text-gray-500 leading-relaxed"${_scopeId}> Gestiona el contenido del catálogo de procedimientos de Planmed. </p>`);
          } else {
            return [
              createVNode("div", { class: "w-12 h-12 bg-[#0C2619]/5 rounded-lg flex items-center justify-center mb-6 text-[#0C2619] group-hover:scale-110 transition-transform" }, [
                (openBlock(), createBlock("svg", {
                  xmlns: "http://www.w3.org/2000/svg",
                  class: "h-6 w-6",
                  fill: "none",
                  viewBox: "0 0 24 24",
                  stroke: "currentColor"
                }, [
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "stroke-width": "1.5",
                    d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  })
                ]))
              ]),
              createVNode("h3", { class: "text-lg font-bold text-gray-900 mb-2" }, "Procedimientos"),
              createVNode("p", { class: "text-sm text-gray-500 leading-relaxed" }, " Gestiona el contenido del catálogo de procedimientos de Planmed. ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/admin/noticias",
        class: "bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="w-12 h-12 bg-[#0C2619]/5 rounded-lg flex items-center justify-center mb-6 text-[#0C2619] group-hover:scale-110 transition-transform"${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15M9 11l3 3L22 4"${_scopeId}></path></svg></div><h3 class="text-lg font-bold text-gray-900 mb-2"${_scopeId}>Noticias</h3><p class="text-sm text-gray-500 leading-relaxed"${_scopeId}> Gestiona artículos, casos de éxito y contenido editorial. </p>`);
          } else {
            return [
              createVNode("div", { class: "w-12 h-12 bg-[#0C2619]/5 rounded-lg flex items-center justify-center mb-6 text-[#0C2619] group-hover:scale-110 transition-transform" }, [
                (openBlock(), createBlock("svg", {
                  xmlns: "http://www.w3.org/2000/svg",
                  class: "h-6 w-6",
                  fill: "none",
                  viewBox: "0 0 24 24",
                  stroke: "currentColor"
                }, [
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "stroke-width": "1.5",
                    d: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15M9 11l3 3L22 4"
                  })
                ]))
              ]),
              createVNode("h3", { class: "text-lg font-bold text-gray-900 mb-2" }, "Noticias"),
              createVNode("p", { class: "text-sm text-gray-500 leading-relaxed" }, " Gestiona artículos, casos de éxito y contenido editorial. ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm opacity-60 cursor-not-allowed"><div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6 text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div><h3 class="text-lg font-bold text-gray-500 mb-2">Configuración</h3><p class="text-sm text-gray-400 leading-relaxed"> Ajustes globales del sitio (Próximamente). </p></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-CJP6ND5L.mjs.map

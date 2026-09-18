import { defineComponent, ref, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { u as useHead, b as useRouter } from './server.mjs';
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
  __name: "login",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "Iniciar sesión | Admin Planmed"
    });
    useRouter();
    const email = ref("");
    const password = ref("");
    const error = ref("");
    const loading = ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-[#fcf9f8] flex items-center justify-center p-6 font-sans selection:bg-[#0C2619] selection:text-white" }, _attrs))}><div class="w-full max-w-md"><div class="text-center mb-10"><h1 class="font-serif text-[40px] font-medium text-[#0C2619] tracking-tight uppercase">Planmed.</h1><p class="mt-3 text-[11px] font-bold tracking-[0.2em] text-[#D3A76A] uppercase"> Panel Administrativo </p></div><div class="bg-white rounded-xl shadow-2xl shadow-black/5 p-8 md:p-10 border border-[#e5e2e1]"><form class="space-y-6">`);
      if (error.value) {
        _push(`<div class="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 text-sm">${ssrInterpolate(error.value)}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div><label for="email" class="block text-xs font-bold tracking-wider text-gray-700 uppercase mb-2"> Correo electrónico </label><input id="email"${ssrRenderAttr("value", email.value)} type="email" required class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent transition-all" placeholder="admin@planmed.com.co"></div><div><label for="password" class="block text-xs font-bold tracking-wider text-gray-700 uppercase mb-2"> Contraseña </label><input id="password"${ssrRenderAttr("value", password.value)} type="password" required class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent transition-all" placeholder="••••••••"></div><button type="submit"${ssrIncludeBooleanAttr(loading.value) ? " disabled" : ""} class="w-full bg-[#0C2619] text-white font-bold text-xs tracking-[0.15em] uppercase py-4 px-6 rounded-lg hover:bg-[#153a28] transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-4">`);
      if (loading.value) {
        _push(`<span>Iniciando sesión...</span>`);
      } else {
        _push(`<span>Iniciar sesión</span>`);
      }
      _push(`</button></form></div><div class="mt-8 text-center text-xs text-gray-400 font-medium"><p>Roles de prueba:</p><p class="mt-1">admin@planmed.com.co | diseno@planmed.com.co</p><p class="mt-1">Cualquier contraseña es válida en el entorno de desarrollo.</p></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/login.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=login-BDA1EAyR.mjs.map

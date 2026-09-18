import { mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs } from 'vue/server-renderer';
import { e as useSeoMeta } from './server.mjs';
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

const documents = [];
const _sfc_main = {
  __name: "recursos",
  __ssrInlineRender: true,
  setup(__props) {
    useSeoMeta({
      title: "Recursos | Planmed",
      description: "Documentos e información importante para tu proceso en Planmed."
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-[#fcf9f8] min-h-screen font-sans selection:bg-[#0C2619] selection:text-white pt-24 md:pt-32 pb-24" }, _attrs))}><div class="max-w-[1000px] mx-auto px-6"><div class="mb-24 text-center md:text-left border-t border-black pt-8"><p class="text-[11px] font-bold tracking-[0.15em] text-[#848484] uppercase mb-4 flex items-center justify-center md:justify-start gap-3"><span class="w-2 h-2 rounded-full bg-[#0C2619]"></span> RECURSOS PLANMED </p><h1 class="font-serif text-[40px] md:text-[56px] lg:text-[72px] font-medium leading-[1.05] tracking-[-0.02em] text-black uppercase max-w-4xl"> INFORMACIÓN Y DOCUMENTOS<br> IMPORTANTES PARA TU PROCESO. </h1></div><div class="mb-24">`);
      if (unref(documents).length === 0) {
        _push(`<div class="border border-[#e5e2e1] p-12 text-center bg-white"><p class="text-[14px] text-[#4c4546]">Próximamente encontrarás aquí los documentos y requisitos oficiales para tu proceso.</p></div>`);
      } else {
        _push(`<div class="flex flex-col gap-4"></div>`);
      }
      _push(`</div></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/recursos.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=recursos-DZ103m3I.mjs.map

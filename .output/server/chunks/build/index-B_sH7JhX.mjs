import { _ as __nuxt_component_0 } from './nuxt-link-kALotrp4.mjs';
import { defineComponent, withAsyncContext, mergeProps, unref, withCtx, createVNode, openBlock, createBlock, createCommentVNode, toDisplayString, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderComponent, ssrRenderAttr, ssrInterpolate } from 'vue/server-renderer';
import { n as newsService } from './NewsService-Bc9lP8_0.mjs';
import { c as useAsyncData, e as useSeoMeta } from './server.mjs';
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
  async setup(__props) {
    let __temp, __restore;
    const { data: news } = ([__temp, __restore] = withAsyncContext(async () => useAsyncData("news-list", async () => {
      const all = await newsService.getNews();
      return all.filter((n) => n.publishedAt !== null && n.publishedAt !== void 0);
    }, {
      default: () => []
    })), __temp = await __temp, __restore(), __temp);
    useSeoMeta({
      title: "Noticias | Planmed",
      description: "Descubre las últimas novedades, casos de éxito y requisitos para financiar tu cirugía plástica en Colombia.",
      ogTitle: "Noticias | Planmed",
      ogDescription: "Descubre las últimas novedades, casos de éxito y requisitos para financiar tu cirugía plástica en Colombia."
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-[#fcf9f8] min-h-screen font-sans selection:bg-[#0C2619] selection:text-white pt-24 md:pt-32 pb-24" }, _attrs))}><div class="max-w-[1200px] mx-auto px-6"><div class="mb-16 md:mb-24 text-center md:text-left border-t border-black pt-8"><p class="text-[11px] font-bold tracking-[0.15em] text-[#848484] uppercase mb-4 flex items-center justify-center md:justify-start gap-3"><span class="w-2 h-2 rounded-full bg-[#0C2619]"></span> ACTUALIDAD Y RECURSOS </p><h1 class="font-serif text-[40px] md:text-[56px] lg:text-[72px] font-medium leading-[1.05] tracking-[-0.02em] text-black uppercase max-w-4xl"> NOTICIAS<br> PLANMED. </h1><p class="mt-8 text-lg text-gray-600 font-light max-w-2xl leading-relaxed mx-auto md:mx-0"> Descubre las últimas novedades, casos de éxito y requisitos para financiar tu cirugía plástica en Colombia. </p></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 mb-24"><!--[-->`);
      ssrRenderList(unref(news), (article) => {
        _push(ssrRenderComponent(_component_NuxtLink, {
          key: article.id,
          to: /noticias/ + article.slug,
          class: "group cursor-pointer flex flex-col h-full bg-white border border-[#e5e2e1] hover:shadow-xl transition-all duration-300"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<div class="relative w-full aspect-[16/9] overflow-hidden bg-gray-100"${_scopeId}>`);
              if (article.coverImage) {
                _push2(`<img${ssrRenderAttr("src", article.coverImage)}${ssrRenderAttr("alt", article.title)} class="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-700 ease-out group-hover:scale-105"${_scopeId}>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="flex-grow flex flex-col p-8"${_scopeId}><div class="text-[10px] font-bold tracking-widest text-[#848484] uppercase mb-3"${_scopeId}>${ssrInterpolate(new Date(article.publishedAt).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }))}</div><h3 class="font-serif text-2xl font-medium text-black mb-4 group-hover:text-[#0C2619] transition-colors leading-snug"${_scopeId}>${ssrInterpolate(article.title)}</h3><p class="text-gray-600 text-sm leading-relaxed font-light mb-6 flex-grow"${_scopeId}>${ssrInterpolate(article.excerpt)}</p><div class="inline-flex items-center text-xs font-bold tracking-widest uppercase text-black group-hover:text-[#0C2619] transition-colors self-start"${_scopeId}> Leer más <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"${_scopeId}></path></svg></div></div>`);
            } else {
              return [
                createVNode("div", { class: "relative w-full aspect-[16/9] overflow-hidden bg-gray-100" }, [
                  article.coverImage ? (openBlock(), createBlock("img", {
                    key: 0,
                    src: article.coverImage,
                    alt: article.title,
                    class: "w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-700 ease-out group-hover:scale-105"
                  }, null, 8, ["src", "alt"])) : createCommentVNode("", true)
                ]),
                createVNode("div", { class: "flex-grow flex flex-col p-8" }, [
                  createVNode("div", { class: "text-[10px] font-bold tracking-widest text-[#848484] uppercase mb-3" }, toDisplayString(new Date(article.publishedAt).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })), 1),
                  createVNode("h3", { class: "font-serif text-2xl font-medium text-black mb-4 group-hover:text-[#0C2619] transition-colors leading-snug" }, toDisplayString(article.title), 1),
                  createVNode("p", { class: "text-gray-600 text-sm leading-relaxed font-light mb-6 flex-grow" }, toDisplayString(article.excerpt), 1),
                  createVNode("div", { class: "inline-flex items-center text-xs font-bold tracking-widest uppercase text-black group-hover:text-[#0C2619] transition-colors self-start" }, [
                    createTextVNode(" Leer más "),
                    (openBlock(), createBlock("svg", {
                      xmlns: "http://www.w3.org/2000/svg",
                      class: "h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform",
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
                ])
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/noticias/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-B_sH7JhX.mjs.map

import { _ as __nuxt_component_0 } from './nuxt-link-kALotrp4.mjs';
import { defineComponent, withAsyncContext, mergeProps, withCtx, openBlock, createBlock, createVNode, createTextVNode, unref, computed, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrInterpolate, ssrRenderStyle } from 'vue/server-renderer';
import { n as newsService } from './NewsService-4acd-4xp.mjs';
import { a as useRoute, b as useRouter, c as useAsyncData, d as createError, e as useSeoMeta } from './server.mjs';
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

const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "YouTubeEmbed",
  __ssrInlineRender: true,
  props: {
    url: {}
  },
  setup(__props) {
    const props = __props;
    const embedUrl = computed(() => {
      if (props.url.includes("/embed/")) return props.url;
      try {
        const urlObj = new URL(props.url);
        if (urlObj.hostname.includes("youtube.com")) {
          const v = urlObj.searchParams.get("v");
          if (v) return "https://www.youtube.com/embed/" + v;
        } else if (urlObj.hostname.includes("youtu.be")) {
          const v = urlObj.pathname.slice(1);
          if (v) return "https://www.youtube.com/embed/" + v;
        }
      } catch (e) {
      }
      return props.url;
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "my-8" }, _attrs))}><div class="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden"><iframe${ssrRenderAttr("src", embedUrl.value)} class="absolute inset-0 w-full h-full" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div></div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/news/YouTubeEmbed.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main$2, { __name: "NewsYouTubeEmbed" });
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "InstagramEmbed",
  __ssrInlineRender: true,
  props: {
    url: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "my-8 flex justify-center w-full" }, _attrs))}><div class="w-full max-w-[540px]"><blockquote class="instagram-media"${ssrRenderAttr("data-instgrm-permalink", __props.url)} data-instgrm-version="13" style="${ssrRenderStyle({ "background": "#FFF", "border": "0", "border-radius": "3px", "box-shadow": "0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)", "margin": "1px", "max-width": "540px", "min-width": "326px", "padding": "0", "width": "calc(100% - 2px)" })}"><div style="${ssrRenderStyle({ "padding": "16px", "text-align": "center" })}"><a${ssrRenderAttr("href", __props.url)} target="_blank" rel="noopener" class="text-sm text-gray-500 hover:text-gray-800"> Ver publicación en Instagram </a></div></blockquote></div></div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/news/InstagramEmbed.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$1, { __name: "NewsInstagramEmbed" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[slug]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    useRouter();
    const slug = route.params.slug;
    const { data: article } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      "news-" + slug,
      () => newsService.getNewsBySlug(slug),
      "$MCgz80eRaa"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    if (!article.value) {
      throw createError({
        statusCode: 404,
        statusMessage: "Noticia no encontrada",
        fatal: true
      });
    }
    useSeoMeta({
      title: article.value.seo?.metaTitle || article.value.title + " | Planmed Noticias",
      description: article.value.seo?.metaDescription || article.value.excerpt,
      ogTitle: article.value.title,
      ogDescription: article.value.excerpt,
      ogImage: article.value.coverImage,
      ogType: "article",
      articlePublishedTime: article.value.publishedAt,
      articleAuthor: article.value.author
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_NewsYouTubeEmbed = __nuxt_component_1;
      const _component_NewsInstagramEmbed = __nuxt_component_2;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-white min-h-screen text-black font-sans selection:bg-[#0C2619] selection:text-white pt-24 md:pt-32 pb-24" }, _attrs))}><div class="max-w-[800px] mx-auto px-6">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/noticias",
        class: "inline-flex items-center gap-3 text-[11px] font-bold tracking-[0.15em] text-[#848484] hover:text-black transition-colors uppercase mb-12"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"${_scopeId}></path></svg> VOLVER A NOTICIAS `);
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
              createTextVNode(" VOLVER A NOTICIAS ")
            ];
          }
        }),
        _: 1
      }, _parent));
      if (unref(article)) {
        _push(`<div><header class="mb-12"><div class="flex items-center gap-4 text-[11px] font-bold tracking-[0.15em] text-[#0C2619] uppercase mb-6"><time${ssrRenderAttr("datetime", unref(article).publishedAt)}>${ssrInterpolate(new Date(unref(article).publishedAt).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }))}</time>`);
        if (unref(article).author) {
          _push(`<span class="w-1 h-1 rounded-full bg-[#D3A76A]"></span>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(article).author) {
          _push(`<span class="text-[#848484]">${ssrInterpolate(unref(article).author)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><h1 class="font-serif text-[40px] md:text-[56px] font-medium leading-[1.1] tracking-[-0.02em] text-black uppercase">${ssrInterpolate(unref(article).title)}</h1></header>`);
        if (unref(article).coverImage) {
          _push(`<div class="relative w-full aspect-video bg-gray-100 mb-12"><img${ssrRenderAttr("src", unref(article).coverImage)}${ssrRenderAttr("alt", unref(article).title)} class="w-full h-full object-cover"></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="prose prose-lg prose-headings:font-serif prose-headings:font-medium prose-headings:uppercase prose-headings:tracking-[-0.01em] prose-a:text-[#0C2619] prose-a:font-bold prose-img:rounded-lg max-w-none text-[#4c4546] font-light leading-relaxed">${unref(article).content ?? ""}</div>`);
        if (unref(article).youtubeUrl) {
          _push(ssrRenderComponent(_component_NewsYouTubeEmbed, {
            url: unref(article).youtubeUrl
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        if (unref(article).instagramUrl) {
          _push(ssrRenderComponent(_component_NewsInstagramEmbed, {
            url: unref(article).instagramUrl
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/noticias/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_slug_-CFzi--7u.mjs.map

import { _ as __nuxt_component_0 } from './nuxt-link-kALotrp4.mjs';
import { defineComponent, ref, withAsyncContext, computed, withCtx, openBlock, createBlock, createVNode, createTextVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrInterpolate, ssrRenderClass } from 'vue/server-renderer';
import { u as useHead, c as useAsyncData } from './server.mjs';
import { n as newsService } from './NewsService-Bc9lP8_0.mjs';
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
    useHead({
      title: "Noticias | Admin Planmed"
    });
    const searchQuery = ref("");
    const statusFilter = ref("all");
    const deletingNews = ref(null);
    const { data: newsList, pending } = ([__temp, __restore] = withAsyncContext(() => useAsyncData("admin-news-list", () => newsService.getNews(), { default: () => [] })), __temp = await __temp, __restore(), __temp);
    const filteredNews = computed(() => {
      if (!newsList.value) return [];
      return newsList.value.filter((n) => {
        const q = searchQuery.value.toLowerCase();
        const matchSearch = n.title.toLowerCase().includes(q) || n.slug.toLowerCase().includes(q) || n.excerpt.toLowerCase().includes(q);
        let matchStatus = true;
        if (statusFilter.value === "published") {
          matchStatus = !!n.publishedAt;
        } else if (statusFilter.value === "draft") {
          matchStatus = !n.publishedAt;
        }
        return matchSearch && matchStatus;
      });
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"><div><h2 class="text-3xl font-serif text-[#0C2619] mb-2 uppercase">Noticias</h2><p class="text-gray-500 font-light">Gestiona los artículos del blog y contenido editorial.</p></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/admin/noticias/nuevo",
        class: "bg-[#D3A76A] hover:bg-[#c29659] text-white px-6 py-3 rounded-lg font-bold text-xs tracking-widest uppercase transition-colors inline-flex items-center gap-2"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"${_scopeId}></path></svg> Nueva Noticia `);
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
                  d: "M12 4v16m8-8H4"
                })
              ])),
              createTextVNode(" Nueva Noticia ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4"><div class="relative flex-grow"><div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div><input${ssrRenderAttr("value", searchQuery.value)} type="text" placeholder="Buscar por ttulo o extracto..." class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent transition-all"></div><select class="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] text-sm text-gray-700 md:w-48"><option value="all"${ssrIncludeBooleanAttr(Array.isArray(statusFilter.value) ? ssrLooseContain(statusFilter.value, "all") : ssrLooseEqual(statusFilter.value, "all")) ? " selected" : ""}>Todos los estados</option><option value="published"${ssrIncludeBooleanAttr(Array.isArray(statusFilter.value) ? ssrLooseContain(statusFilter.value, "published") : ssrLooseEqual(statusFilter.value, "published")) ? " selected" : ""}>Publicados</option><option value="draft"${ssrIncludeBooleanAttr(Array.isArray(statusFilter.value) ? ssrLooseContain(statusFilter.value, "draft") : ssrLooseEqual(statusFilter.value, "draft")) ? " selected" : ""}>Borradores</option></select></div><div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">`);
      if (unref(pending)) {
        _push(`<div class="p-12 text-center text-gray-500"> Cargando noticias... </div>`);
      } else if (filteredNews.value.length === 0) {
        _push(`<div class="p-12 text-center text-gray-500"> No se encontraron noticias. </div>`);
      } else {
        _push(`<div class="overflow-x-auto"><table class="w-full text-left border-collapse"><thead><tr class="bg-gray-50 border-b border-gray-200 text-[10px] font-bold tracking-widest text-gray-500 uppercase"><th class="p-4 font-medium">Artculo</th><th class="p-4 font-medium text-center">Estado</th><th class="p-4 font-medium text-center">Fecha</th><th class="p-4 font-medium text-right">Acciones</th></tr></thead><tbody class="divide-y divide-gray-100"><!--[-->`);
        ssrRenderList(filteredNews.value, (item) => {
          _push(`<tr class="hover:bg-gray-50/50 transition-colors"><td class="p-4"><div class="flex items-center gap-4">`);
          if (item.coverImage) {
            _push(`<img${ssrRenderAttr("src", item.coverImage)}${ssrRenderAttr("alt", item.title)} class="w-16 h-12 rounded-lg object-cover bg-gray-100 border border-gray-200">`);
          } else {
            _push(`<div class="w-16 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>`);
          }
          _push(`<div><h3 class="font-bold text-gray-900 text-sm line-clamp-1"${ssrRenderAttr("title", item.title)}>${ssrInterpolate(item.title)}</h3><p class="text-xs text-gray-500 line-clamp-1 max-w-[300px]"${ssrRenderAttr("title", item.excerpt)}>${ssrInterpolate(item.excerpt)}</p></div></div></td><td class="p-4 text-center"><button class="${ssrRenderClass([item.publishedAt ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200", "inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors"])}"${ssrRenderAttr("title", item.publishedAt ? "Despublicar" : "Publicar")}>${ssrInterpolate(item.publishedAt ? "Publicado" : "Borrador")}</button></td><td class="p-4 text-center"><span class="text-xs text-gray-500 font-medium">${ssrInterpolate(item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "---")}</span></td><td class="p-4 text-right"><div class="flex items-center justify-end gap-2">`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/admin/noticias/${item.slug}`,
            class: "p-2 text-gray-400 hover:text-[#0C2619] transition-colors bg-gray-50 hover:bg-gray-100 rounded-lg",
            title: "Editar"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"${_scopeId}></path></svg>`);
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
                      d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    })
                  ]))
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`<button class="p-2 text-gray-400 hover:text-red-600 transition-colors bg-gray-50 hover:bg-red-50 rounded-lg" title="Eliminar"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div></td></tr>`);
        });
        _push(`<!--]--></tbody></table></div>`);
      }
      _push(`</div>`);
      if (deletingNews.value) {
        _push(`<div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"><div class="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6"><h3 class="text-xl font-bold text-gray-900 mb-2">Eliminar noticia</h3><p class="text-gray-500 text-sm mb-6"> Ests a punto de eliminar <strong>${ssrInterpolate(deletingNews.value.title)}</strong>. Esta acción no se puede deshacer. </p><div class="flex justify-end gap-3"><button class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"> Cancelar </button><button class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"> Eliminar </button></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/noticias/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-D_QrQE4d.mjs.map

import { _ as __nuxt_component_0 } from './nuxt-link-kALotrp4.mjs';
import { defineComponent, ref, watch, mergeProps, withCtx, openBlock, createBlock, createVNode, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrIncludeBooleanAttr, ssrRenderAttr, ssrLooseContain } from 'vue/server-renderer';
import { u as useHead, a as useRoute, b as useRouter } from './server.mjs';
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
  __name: "[slug]",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "Editor de Noticias | Admin Planmed"
    });
    const route = useRoute();
    useRouter();
    const slugParam = route.params.slug;
    const isNew = slugParam === "nuevo";
    const isSubmitting = ref(false);
    const isPublished = ref(false);
    const form = ref({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImage: "",
      author: "",
      publishedAtStr: "",
      instagramUrl: "",
      youtubeUrl: "",
      seo: {
        metaTitle: "",
        metaDescription: ""
      }
    });
    watch(isPublished, (val) => {
      if (val && !form.value.publishedAtStr) {
        const d = /* @__PURE__ */ new Date();
        const tzOffset = d.getTimezoneOffset() * 6e4;
        form.value.publishedAtStr = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "pb-24" }, _attrs))}><div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"><div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/admin/noticias",
        class: "text-[11px] font-bold tracking-[0.15em] text-[#848484] hover:text-[#0C2619] uppercase flex items-center gap-2 mb-4 transition-colors"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"${_scopeId}></path></svg> Volver a Noticias `);
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
              createTextVNode(" Volver a Noticias ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<h2 class="text-3xl font-serif text-[#0C2619] mb-1 uppercase">${ssrInterpolate(isNew ? "Nueva Noticia" : "Editar Noticia")}</h2><p class="text-gray-500 font-light">${ssrInterpolate(isNew ? "Redacta un nuevo" : "Modifica este")} artculo editorial.</p></div><div class="flex items-center gap-3"><button${ssrIncludeBooleanAttr(isSubmitting.value) ? " disabled" : ""} class="bg-[#0C2619] hover:bg-[#153a28] text-white px-8 py-3 rounded-lg font-bold text-xs tracking-widest uppercase transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg">`);
      if (isSubmitting.value) {
        _push(`<span>Guardando...</span>`);
      } else {
        _push(`<span>Guardar Cambios</span>`);
      }
      _push(`</button></div></div><form class="grid grid-cols-1 lg:grid-cols-3 gap-8"><div class="lg:col-span-2 space-y-6"><div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8"><h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Informacin Principal</h3><div class="space-y-6"><div><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Ttulo *</label><input${ssrRenderAttr("value", form.value.title)} required type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="Ttulo del artculo"></div><div><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Slug *</label><input${ssrRenderAttr("value", form.value.slug)}${ssrIncludeBooleanAttr(!isNew) ? " required" : ""} type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent font-mono text-sm" placeholder="se-generara-automaticamente-si-lo-dejas-vacio"><p class="text-[10px] text-gray-500 mt-1">Identificador de la URL. Si se deja vaco al crear, se generar desde el ttulo.</p></div><div><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Autor</label><input${ssrRenderAttr("value", form.value.author)} type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="Ej: Equipo Planmed"></div><div><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Extracto (Excerpt) *</label><textarea required rows="3" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent resize-none" placeholder="Breve resumen que aparece en las listas de noticias...">${ssrInterpolate(form.value.excerpt)}</textarea></div></div></div><div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8"><h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Contenido Editorial *</h3><div><textarea required rows="15" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent font-mono text-sm leading-relaxed" placeholder="&lt;p&gt;Escribe tu contenido aqu...&lt;/p&gt;">${ssrInterpolate(form.value.content)}</textarea><p class="text-[10px] text-gray-500 mt-2">En esta fase, puedes usar etiquetas HTML bsicas (p, h2, ul, li) para estructurar el contenido.</p></div></div><div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8"><h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Multimedia Integrada</h3><div class="space-y-6"><div><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#E1306C]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"></path></svg> Post de Instagram (URL) </label><input${ssrRenderAttr("value", form.value.instagramUrl)} type="url" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C] focus:border-transparent" placeholder="https://www.instagram.com/p/CL7pTzuLxg4/"><p class="text-[10px] text-gray-500 mt-1">Pega el link directo al post. El componente lo embeber de forma segura.</p></div><div><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#FF0000]" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path></svg> Video de YouTube (URL de Embebido) </label><input${ssrRenderAttr("value", form.value.youtubeUrl)} type="url" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF0000] focus:border-transparent" placeholder="https://www.youtube.com/embed/tPAVprOsJF0"><p class="text-[10px] text-gray-500 mt-1">Usa la URL de &#39;embed&#39;, no la del reproductor normal.</p></div></div></div></div><div class="space-y-6"><div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8"><h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Visibilidad</h3><label class="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#0C2619] transition-colors mb-4"><input${ssrIncludeBooleanAttr(Array.isArray(isPublished.value) ? ssrLooseContain(isPublished.value, null) : isPublished.value) ? " checked" : ""} type="checkbox" class="w-5 h-5 mt-0.5 text-[#0C2619] focus:ring-[#0C2619] border-gray-300 rounded"><div class="flex flex-col"><span class="text-sm font-bold text-gray-900">Noticia Publicada</span><span class="text-[10px] text-gray-500 mt-1">Los cambios se aplican al guardar la noticia.</span></div></label>`);
      if (isPublished.value) {
        _push(`<div><label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Fecha de Publicacin</label><input${ssrRenderAttr("value", form.value.publishedAtStr)} type="datetime-local" class="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#0C2619]"></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8"><h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Portada</h3>`);
      if (form.value.coverImage) {
        _push(`<div class="w-full aspect-[4/3] rounded-lg overflow-hidden mb-4 border border-gray-200"><img${ssrRenderAttr("src", form.value.coverImage)} alt="Cover" class="w-full h-full object-cover"></div>`);
      } else {
        _push(`<div class="w-full aspect-[4/3] rounded-lg mb-4 border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-sm"> Sin portada </div>`);
      }
      _push(`<div><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">URL de la Imagen *</label><input${ssrRenderAttr("value", form.value.coverImage)} required type="url" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent text-sm" placeholder="/images/..."></div></div><div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8"><h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">SEO</h3><div class="space-y-4"><div><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Meta Title</label><input${ssrRenderAttr("value", form.value.seo.metaTitle)} type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent text-sm" placeholder="Ttulo para Google"></div><div><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Meta Description</label><textarea rows="4" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent text-sm resize-none" placeholder="Extracto persuasivo de mx 160 caracteres">${ssrInterpolate(form.value.seo.metaDescription)}</textarea></div></div></div></div></form></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/noticias/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_slug_-CiUFYo0n.mjs.map

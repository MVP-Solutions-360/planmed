import { _ as __nuxt_component_0 } from './nuxt-link-kALotrp4.mjs';
import { defineComponent, ref, mergeProps, withCtx, openBlock, createBlock, createVNode, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrIncludeBooleanAttr, ssrRenderAttr, ssrLooseContain, ssrRenderList } from 'vue/server-renderer';
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
      title: "Editar Procedimiento | Admin Planmed"
    });
    const route = useRoute();
    useRouter();
    const slugParam = route.params.slug;
    const isNew = slugParam === "nuevo";
    const isSubmitting = ref(false);
    const form = ref({
      name: "",
      category: "",
      shortDescription: "",
      whatIsIt: "",
      image: "",
      destacado: false,
      galeria: [],
      ficha_tecnica: {
        tipo_anestesia: "",
        tiempo_quirurgico: "",
        tiempo_recuperacion: "",
        cicatrizacion_minima: false
      },
      perfil_paciente: {
        edad_minima: null,
        edad_maxima: null,
        imc_maximo: null,
        condiciones_medicas_compatibles: ""
      },
      seo: {
        meta_title: "",
        meta_description: ""
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "pb-24" }, _attrs))}><div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"><div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/admin/procedimientos",
        class: "text-[11px] font-bold tracking-[0.15em] text-[#848484] hover:text-[#0C2619] uppercase flex items-center gap-2 mb-4 transition-colors"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"${_scopeId}></path></svg> Volver a Procedimientos `);
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
              createTextVNode(" Volver a Procedimientos ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<h2 class="text-3xl font-serif text-[#0C2619] mb-1 uppercase">${ssrInterpolate(isNew ? "Nuevo Procedimiento" : "Editar Procedimiento")}</h2><p class="text-gray-500 font-light">${ssrInterpolate(isNew ? "Crea un nuevo" : "Modifica este")} procedimiento en el catálogo.</p></div><div class="flex items-center gap-3"><button${ssrIncludeBooleanAttr(isSubmitting.value) ? " disabled" : ""} class="bg-[#0C2619] hover:bg-[#153a28] text-white px-8 py-3 rounded-lg font-bold text-xs tracking-widest uppercase transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg">`);
      if (isSubmitting.value) {
        _push(`<span>Guardando...</span>`);
      } else {
        _push(`<span>Guardar Cambios</span>`);
      }
      _push(`</button></div></div><form class="grid grid-cols-1 lg:grid-cols-3 gap-8"><div class="lg:col-span-2 space-y-6"><div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8"><h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Información Básica</h3><div class="space-y-6"><div><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nombre del Procedimiento *</label><input${ssrRenderAttr("value", form.value.name)} required type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="Ej: Mamoplastia de Aumento"></div><div><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Categoría (Slug) *</label><input${ssrRenderAttr("value", form.value.category)} required type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="Ej: cirugia-corporal"></div><div><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Descripción Corta *</label><textarea required rows="3" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent resize-none" placeholder="Breve resumen para listados...">${ssrInterpolate(form.value.shortDescription)}</textarea></div><div><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">¿Qué es? (Descripción detallada) *</label><textarea required rows="6" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="Descripción completa del procedimiento...">${ssrInterpolate(form.value.whatIsIt)}</textarea></div></div></div><div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8"><h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Ficha Técnica</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Tipo de Anestesia</label><input${ssrRenderAttr("value", form.value.ficha_tecnica.tipo_anestesia)} type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="Ej: General"></div><div><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Tiempo Quirúrgico</label><input${ssrRenderAttr("value", form.value.ficha_tecnica.tiempo_quirurgico)} type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="Ej: 2 a 3 horas"></div><div><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Tiempo de Recuperación</label><input${ssrRenderAttr("value", form.value.ficha_tecnica.tiempo_recuperacion)} type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="Ej: 10 a 15 días"></div><div class="flex items-center mt-6 md:mt-8"><label class="flex items-center gap-3 cursor-pointer"><input${ssrIncludeBooleanAttr(Array.isArray(form.value.ficha_tecnica.cicatrizacion_minima) ? ssrLooseContain(form.value.ficha_tecnica.cicatrizacion_minima, null) : form.value.ficha_tecnica.cicatrizacion_minima) ? " checked" : ""} type="checkbox" class="w-5 h-5 text-[#0C2619] focus:ring-[#0C2619] border-gray-300 rounded"><span class="text-sm font-medium text-gray-700">Cicatrización Mínima</span></label></div></div></div><div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8"><h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Perfil del Paciente</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Edad Mínima</label><input${ssrRenderAttr("value", form.value.perfil_paciente.edad_minima)} type="number" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="18"></div><div><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Edad Máxima</label><input${ssrRenderAttr("value", form.value.perfil_paciente.edad_maxima)} type="number" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="65"></div><div><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">IMC Máximo</label><input${ssrRenderAttr("value", form.value.perfil_paciente.imc_maximo)} type="number" step="0.1" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="29.9"></div><div class="md:col-span-2"><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Condiciones Médicas Compatibles</label><textarea rows="2" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent" placeholder="Buen estado de salud general...">${ssrInterpolate(form.value.perfil_paciente.condiciones_medicas_compatibles)}</textarea></div></div></div></div><div class="space-y-6"><div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8"><h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Visibilidad</h3><label class="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#0C2619] transition-colors"><input${ssrIncludeBooleanAttr(Array.isArray(form.value.destacado) ? ssrLooseContain(form.value.destacado, null) : form.value.destacado) ? " checked" : ""} type="checkbox" class="w-5 h-5 text-[#D3A76A] focus:ring-[#D3A76A] border-gray-300 rounded"><span class="text-sm font-bold text-gray-900">Procedimiento Destacado</span></label></div><div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8"><h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">Imagen Principal</h3>`);
      if (form.value.image) {
        _push(`<div class="w-full aspect-video rounded-lg overflow-hidden mb-4 border border-gray-200 relative group"><img${ssrRenderAttr("src", form.value.image)} alt="Preview" class="w-full h-full object-cover"></div>`);
      } else {
        _push(`<div class="w-full aspect-video rounded-lg mb-4 border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400"> Sin imagen </div>`);
      }
      _push(`<div><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">URL de la Imagen *</label><input${ssrRenderAttr("value", form.value.image)} required type="url" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent text-sm" placeholder="https://..."><p class="text-[10px] text-gray-500 mt-2">(En esta fase usamos URLs de imágenes directamente)</p></div></div><div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8"><div class="flex items-center justify-between mb-6 border-b border-gray-100 pb-4"><h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase">Galería</h3><button type="button" class="text-xs font-bold text-[#D3A76A] hover:text-[#b38b55]">+ Agregar</button></div><div class="space-y-3"><!--[-->`);
      ssrRenderList(form.value.galeria, (item, index) => {
        _push(`<div class="flex gap-2"><input${ssrRenderAttr("value", form.value.galeria[index])} type="url" class="flex-grow px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] text-sm" placeholder="URL de la imagen"><button type="button" class="p-2 text-gray-400 hover:text-red-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div>`);
      });
      _push(`<!--]-->`);
      if (form.value.galeria.length === 0) {
        _push(`<p class="text-xs text-gray-400 text-center italic">No hay imágenes en la galería</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8"><h3 class="text-xs font-bold tracking-widest text-[#0C2619] uppercase mb-6 border-b border-gray-100 pb-4">SEO</h3><div class="space-y-4"><div><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Meta Title</label><input${ssrRenderAttr("value", form.value.seo.meta_title)} type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent text-sm" placeholder="Título para buscadores"></div><div><label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Meta Description</label><textarea rows="3" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2619] focus:border-transparent text-sm resize-none" placeholder="Descripción para buscadores">${ssrInterpolate(form.value.seo.meta_description)}</textarea></div></div></div></div></form></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/procedimientos/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_slug_-BFZubzQv.mjs.map

import { ref, watch, mergeProps, unref, computed, reactive, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrRenderList, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrInterpolate, ssrRenderClass, ssrRenderComponent } from 'vue/server-renderer';
import { useRoute } from 'vue-router';
import { p as publicAssetsURL } from '../routes/renderer.mjs';
import { p as procedureService } from './ProcedureService-C1UHPNuV.mjs';
import { e as useSeoMeta, c as useAsyncData } from './server.mjs';
import 'vue-bundle-renderer/runtime';
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
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';
import '@vue/shared';

class LocalTrackingProvider {
  trackEvent(eventType, pagePath, payload = null) {
    return;
  }
}
class TrackingService {
  constructor() {
    this.provider = new LocalTrackingProvider();
  }
  getVisitorUuid() {
    return null;
  }
  track(eventType, pagePath, payload = null) {
    this.provider.trackEvent(eventType, pagePath, {
      ...payload,
      visitorId: this.getVisitorUuid()
    });
  }
}
const trackingService = new TrackingService();
const useTracking = () => {
  const getVisitorUuid = () => {
    return trackingService.getVisitorUuid();
  };
  const trackPageView = (path, title) => {
    trackingService.track("PAGE_VIEW", path, { context: { page_title: title } });
  };
  const trackFormStart = (path, procedureName, amount, installments, monthlyPayment) => {
    trackingService.track("FORM_START", path, {
      intent: {
        item_name: procedureName || "General",
        financial_amount: amount,
        financial_installments: installments,
        estimated_monthly_payment: monthlyPayment
      }
    });
  };
  const trackFormSubmit = (path, procedureName, amount, installments, monthlyPayment) => {
    trackingService.track("FORM_SUBMIT", path, {
      intent: {
        item_name: procedureName,
        financial_amount: amount,
        financial_installments: installments,
        estimated_monthly_payment: monthlyPayment
      }
    });
  };
  const trackWhatsAppClick = (path) => {
    trackingService.track("WHATSAPP_CLICK", path);
  };
  const trackSimulatorCalc = (path, procedureName, amount, installments, clinic) => {
    trackingService.track("SIMULATOR_CALC", path, {
      intent: {
        item_name: procedureName,
        financial_amount: amount,
        financial_installments: installments,
        target_location: clinic
      }
    });
  };
  const trackPolicyView = (path, policyType, version) => {
    trackingService.track("POLICY_VIEW", path, {
      legal: {
        policy_type: policyType,
        version
      }
    });
  };
  return {
    getVisitorUuid,
    trackPageView,
    trackFormStart,
    trackFormSubmit,
    trackWhatsAppClick,
    trackSimulatorCalc,
    trackPolicyView
  };
};
class MockQuotationProvider {
  async getQuote(amount, months, procedure, signal) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    const rate = 0.02;
    const factor = Math.pow(1 + rate, months);
    let calculatedPayment = amount * rate * factor / (factor - 1);
    calculatedPayment = Math.ceil(calculatedPayment / 100) * 100;
    return {
      monthlyPayment: calculatedPayment,
      totalAmount: calculatedPayment * months,
      isMock: true,
      disclaimer: "Esta simulación es una estimación preliminar utilizando una tasa referencial que puede variar de acuerdo con la tasa de usura vigente, fijada mensualmente. Las condiciones definitivas estarán sujetas al estudio y aprobación de la solicitud."
    };
  }
}
class QuotationService {
  constructor() {
    this.provider = new MockQuotationProvider();
  }
  async calculateQuotation(amount, months, procedure, signal) {
    return await this.provider.getQuote(amount, months, procedure, signal);
  }
}
const quotationService = new QuotationService();
const _sfc_main$1 = {
  __name: "FormsLeadForm",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean, default: false },
    procedure: { type: String, default: "" },
    amount: { type: Number, default: null },
    installments: { type: Number, default: null },
    city: { type: String, default: "" }
  },
  emits: ["update:isOpen"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const route = useRoute();
    const { trackFormStart } = useTracking();
    const isSubmitting = ref(false);
    const isSuccess = ref(false);
    const currentQuote = ref(null);
    const form = reactive({
      full_name: "",
      phone: "",
      city: "",
      procedure: "",
      requested_amount: null,
      installments: null,
      email: "",
      comments: "",
      accepted_habeas_data: false
    });
    const errors = reactive({});
    watch(() => props.isOpen, async (newVal) => {
      if (newVal) {
        (void 0).body.style.overflow = "hidden";
        form.procedure = props.procedure || "";
        form.requested_amount = props.amount || null;
        form.installments = props.installments || null;
        form.city = props.city || "";
        if (form.requested_amount && form.installments) {
          currentQuote.value = await quotationService.calculateQuotation(form.requested_amount, form.installments, form.procedure);
        }
        trackFormStart(route.fullPath, form.procedure, form.requested_amount, form.installments, currentQuote.value?.monthlyPayment || null);
      } else {
        (void 0).body.style.overflow = "";
        isSuccess.value = false;
      }
    });
    watch([() => form.requested_amount, () => form.installments], async () => {
      if (form.requested_amount && form.installments) {
        currentQuote.value = await quotationService.calculateQuotation(form.requested_amount, form.installments, form.procedure);
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      if (__props.isOpen) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" }, _attrs))}><div class="bg-white text-black w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 relative"><button class="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"> ✕ </button>`);
        if (!isSuccess.value) {
          _push(`<div class="flex flex-col h-full overflow-hidden"><div class="px-8 py-6 border-b border-gray-100 flex-shrink-0"><h2 class="text-2xl font-extrabold text-black">${ssrInterpolate("Inicia tu proceso ahora")}</h2><p class="text-sm text-gray-600 mt-1">${ssrInterpolate("Déjanos tus datos para enviarte los requisitos completos y conectarte con un asesor experto.")}</p></div><div class="p-4 md:p-8 overflow-y-auto space-y-5"><div><label class="block text-sm font-bold text-gray-700 mb-1">${ssrInterpolate("Nombre Completo *")}</label><input${ssrRenderAttr("value", form.full_name)} type="text" class="${ssrRenderClass(["w-full p-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all", errors.full_name ? "border-red-500" : "border-gray-200"])}">`);
          if (errors.full_name) {
            _push(`<p class="text-red-500 text-xs mt-1">${ssrInterpolate(errors.full_name)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="grid grid-cols-1 md:grid-cols-2 gap-5"><div><label class="block text-sm font-bold text-gray-700 mb-1">${ssrInterpolate("Teléfono Celular *")}</label><input${ssrRenderAttr("value", form.phone)} type="tel" class="${ssrRenderClass(["w-full p-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all", errors.phone ? "border-red-500" : "border-gray-200"])}">`);
          if (errors.phone) {
            _push(`<p class="text-red-500 text-xs mt-1">${ssrInterpolate(errors.phone)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div><label class="block text-sm font-bold text-gray-700 mb-1">${ssrInterpolate("Ciudad *")}</label><select class="${ssrRenderClass(["w-full p-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all", errors.city ? "border-red-500" : "border-gray-200"])}"><option value="" disabled${ssrIncludeBooleanAttr(Array.isArray(form.city) ? ssrLooseContain(form.city, "") : ssrLooseEqual(form.city, "")) ? " selected" : ""}>${ssrInterpolate("Selecciona tu ciudad")}</option><option${ssrRenderAttr("value", "Medellín")}${ssrIncludeBooleanAttr(Array.isArray(form.city) ? ssrLooseContain(form.city, "Medellín") : ssrLooseEqual(form.city, "Medellín")) ? " selected" : ""}>${ssrInterpolate("Medellín")}</option><option${ssrRenderAttr("value", "Cali")}${ssrIncludeBooleanAttr(Array.isArray(form.city) ? ssrLooseContain(form.city, "Cali") : ssrLooseEqual(form.city, "Cali")) ? " selected" : ""}>${ssrInterpolate("Cali")}</option><option${ssrRenderAttr("value", "Barranquilla")}${ssrIncludeBooleanAttr(Array.isArray(form.city) ? ssrLooseContain(form.city, "Barranquilla") : ssrLooseEqual(form.city, "Barranquilla")) ? " selected" : ""}>${ssrInterpolate("Barranquilla")}</option><option${ssrRenderAttr("value", "Por Definir")}${ssrIncludeBooleanAttr(Array.isArray(form.city) ? ssrLooseContain(form.city, "Por Definir") : ssrLooseEqual(form.city, "Por Definir")) ? " selected" : ""}>${ssrInterpolate("Por Definir")}</option></select>`);
          if (errors.city) {
            _push(`<p class="text-red-500 text-xs mt-1">${ssrInterpolate(errors.city)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div><div><label class="block text-sm font-bold text-gray-700 mb-1">${ssrInterpolate("Procedimiento de Interés *")}</label><input${ssrRenderAttr("value", form.procedure)} type="text" class="${ssrRenderClass(["w-full p-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all", errors.procedure ? "border-red-500" : "border-gray-200"])}">`);
          if (errors.procedure) {
            _push(`<p class="text-red-500 text-xs mt-1">${ssrInterpolate(errors.procedure)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="grid grid-cols-1 md:grid-cols-2 gap-5"><div><label class="block text-sm font-bold text-gray-700 mb-1">${ssrInterpolate("Monto Solicitado (COP) *")}</label><input${ssrRenderAttr("value", form.requested_amount)} type="number" class="${ssrRenderClass(["w-full p-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all", errors.requested_amount ? "border-red-500" : "border-gray-200"])}">`);
          if (errors.requested_amount) {
            _push(`<p class="text-red-500 text-xs mt-1">${ssrInterpolate(errors.requested_amount)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div><label class="block text-sm font-bold text-gray-700 mb-1">Plazo (Cuotas)</label><select class="${ssrRenderClass(["w-full p-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all", errors.installments ? "border-red-500" : "border-gray-200"])}"><option${ssrRenderAttr("value", null)} disabled${ssrIncludeBooleanAttr(Array.isArray(form.installments) ? ssrLooseContain(form.installments, null) : ssrLooseEqual(form.installments, null)) ? " selected" : ""}>Selecciona el plazo</option><option${ssrRenderAttr("value", 12)}${ssrIncludeBooleanAttr(Array.isArray(form.installments) ? ssrLooseContain(form.installments, 12) : ssrLooseEqual(form.installments, 12)) ? " selected" : ""}>12 Meses</option><option${ssrRenderAttr("value", 18)}${ssrIncludeBooleanAttr(Array.isArray(form.installments) ? ssrLooseContain(form.installments, 18) : ssrLooseEqual(form.installments, 18)) ? " selected" : ""}>18 Meses</option><option${ssrRenderAttr("value", 24)}${ssrIncludeBooleanAttr(Array.isArray(form.installments) ? ssrLooseContain(form.installments, 24) : ssrLooseEqual(form.installments, 24)) ? " selected" : ""}>24 Meses</option><option${ssrRenderAttr("value", 36)}${ssrIncludeBooleanAttr(Array.isArray(form.installments) ? ssrLooseContain(form.installments, 36) : ssrLooseEqual(form.installments, 36)) ? " selected" : ""}>36 Meses</option><option${ssrRenderAttr("value", 48)}${ssrIncludeBooleanAttr(Array.isArray(form.installments) ? ssrLooseContain(form.installments, 48) : ssrLooseEqual(form.installments, 48)) ? " selected" : ""}>48 Meses</option><option${ssrRenderAttr("value", 60)}${ssrIncludeBooleanAttr(Array.isArray(form.installments) ? ssrLooseContain(form.installments, 60) : ssrLooseEqual(form.installments, 60)) ? " selected" : ""}>60 Meses</option><option${ssrRenderAttr("value", 72)}${ssrIncludeBooleanAttr(Array.isArray(form.installments) ? ssrLooseContain(form.installments, 72) : ssrLooseEqual(form.installments, 72)) ? " selected" : ""}>72 Meses</option></select>`);
          if (errors.installments) {
            _push(`<p class="text-red-500 text-xs mt-1">${ssrInterpolate(errors.installments)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
          if (currentQuote.value) {
            _push(`<div class="bg-gray-100 border border-gray-200 p-4 rounded-xl flex justify-between items-center"><span class="text-sm font-bold text-gray-900">Cuota Mensual Estimada:</span><span class="text-xl font-extrabold text-black"> $${ssrInterpolate(currentQuote.value.monthlyPayment?.toLocaleString("es-CO") || 0)}* </span></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div><label class="block text-sm font-bold text-gray-700 mb-1">${"Correo Electrónico (Opcional)"}</label><input${ssrRenderAttr("value", form.email)} type="email" class="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"></div><div><label class="block text-sm font-bold text-gray-700 mb-1">${"Comentarios (Opcional)"}</label><textarea rows="2" class="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none">${ssrInterpolate(form.comments)}</textarea></div><div class="flex items-start gap-3 mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100"><div class="pt-0.5"><input${ssrIncludeBooleanAttr(Array.isArray(form.accepted_habeas_data) ? ssrLooseContain(form.accepted_habeas_data, null) : form.accepted_habeas_data) ? " checked" : ""} type="checkbox" id="habeas" class="w-5 h-5 accent-primary border-gray-300 rounded cursor-pointer"></div><div class="flex-1"><label for="habeas" class="text-xs text-gray-600 cursor-pointer select-none">${'Acepto la <a href="/recursos" target="_blank" class="text-primary font-bold hover:underline">política de tratamiento de datos personales</a> y autorizo ser contactado para recibir información sobre opciones de financiación. *'}</label>`);
          if (errors.accepted_habeas_data) {
            _push(`<p class="text-red-500 text-xs mt-1 font-bold">${ssrInterpolate(errors.accepted_habeas_data)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div></div><div class="px-4 md:px-8 py-6 bg-gray-50 border-t border-gray-100 flex-shrink-0">`);
          if (errors.api) {
            _push(`<div class="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-200 flex items-center gap-2"><span>⚠</span> ${ssrInterpolate(errors.api)}</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<button${ssrIncludeBooleanAttr(isSubmitting.value) ? " disabled" : ""} class="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2">`);
          if (isSubmitting.value) {
            _push(`<span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>`);
          } else {
            _push(`<!---->`);
          }
          _push(` ${ssrInterpolate(isSubmitting.value ? "Enviando..." : "Solicitar Financiación")}</button></div></div>`);
        } else {
          _push(`<div class="flex flex-col items-center justify-center p-12 text-center h-[500px]"><div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm border border-green-200"> ✓ </div><h2 class="text-2xl font-bold text-black mb-2">${ssrInterpolate("¡Solicitud recibida!")}</h2><p class="text-gray-600 mb-8 max-w-sm">${ssrInterpolate("Hemos procesado tu información. Para darte una respuesta prioritaria, continúa tu proceso directamente en WhatsApp con un asesor experto.")}</p><button class="w-full py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#128C7E] transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-3"><svg class="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path></svg> ${ssrInterpolate("Continuar en WhatsApp")}</button><button class="mt-4 text-sm font-bold text-gray-500 hover:text-black transition-colors">${ssrInterpolate("Cerrar")}</button></div>`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/forms/LeadForm.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _imports_0 = publicAssetsURL("/images/web/portada_simulador.png");
function useSimulator() {
  const route = useRoute();
  const STEP_AMOUNT = 5e5;
  const MIN_AMOUNT = 1e6;
  const MAX_AMOUNT = 1e8;
  const amount = ref(15e6);
  const months = ref(24);
  const procedure = ref("");
  const city = ref("Medellín");
  const currentQuote = ref(null);
  const isLoading = ref(false);
  let abortController = null;
  const { data: availableProcedures } = useAsyncData("procedures", () => procedureService.getProcedures(), {
    default: () => []
  });
  watch(availableProcedures, (newProcs) => {
    if (newProcs && newProcs.length > 0 && !procedure.value) {
      const queryProcedureId = route.query.procedureId;
      if (queryProcedureId && newProcs.some((p) => p.id === queryProcedureId)) {
        procedure.value = queryProcedureId;
      } else {
        procedure.value = newProcs[0].id;
      }
    }
  }, { immediate: true });
  const formatCurrency = (value) => {
    if (!value) return "$ 0";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(value);
  };
  const displayAmount = computed({
    get: () => {
      if (!amount.value || isNaN(amount.value)) return "";
      return new Intl.NumberFormat("es-CO").format(amount.value);
    },
    set: (val) => {
      const parsed = parseInt(val.replace(/\D/g, ""));
      if (!isNaN(parsed)) {
        amount.value = parsed;
      } else {
        amount.value = 0;
      }
    }
  });
  const handleAmountBlur = () => {
    if (!amount.value) amount.value = MIN_AMOUNT;
    if (amount.value < MIN_AMOUNT) amount.value = MIN_AMOUNT;
    if (amount.value > MAX_AMOUNT) amount.value = MAX_AMOUNT;
    amount.value = Math.round(amount.value / STEP_AMOUNT) * STEP_AMOUNT;
  };
  const submitSimulation = async () => {
    if (amount.value < MIN_AMOUNT) return;
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();
    const signal = abortController.signal;
    isLoading.value = true;
    try {
      const quote = await quotationService.calculateQuotation(amount.value, months.value, procedure.value, signal);
      if (signal.aborted) return;
      currentQuote.value = quote;
      trackingService.track("SIMULATOR_CALC", "/simulador", {
        intent: {
          item_name: procedure.value,
          financial_amount: amount.value,
          financial_installments: months.value,
          target_location: city.value
        }
      });
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error("Error al simular cotizacion:", e);
      }
    } finally {
      if (!signal.aborted) {
        isLoading.value = false;
      }
    }
  };
  return {
    amount,
    months,
    procedure,
    city,
    currentQuote,
    isLoading,
    formatCurrency,
    displayAmount,
    handleAmountBlur,
    submitSimulation,
    availableProcedures,
    MIN_AMOUNT,
    MAX_AMOUNT,
    STEP_AMOUNT
  };
}
const _sfc_main = {
  __name: "simulador",
  __ssrInlineRender: true,
  setup(__props) {
    useSeoMeta({
      title: "Simulador | Planmed",
      description: "Estima tu plan de pago con el simulador financiero de Planmed."
    });
    const isLeadFormOpen = ref(false);
    const {
      amount,
      months,
      procedure,
      city,
      currentQuote,
      isLoading,
      formatCurrency,
      displayAmount,
      submitSimulation,
      availableProcedures,
      MIN_AMOUNT,
      MAX_AMOUNT,
      STEP_AMOUNT
    } = useSimulator();
    let simulatorDebounceTimer = null;
    watch([amount, months, procedure, city], () => {
      if (simulatorDebounceTimer) clearTimeout(simulatorDebounceTimer);
      simulatorDebounceTimer = setTimeout(() => {
        submitSimulation();
      }, 400);
    }, { deep: true });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_FormsLeadForm = _sfc_main$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-[#F7F3EE] min-h-screen flex flex-col" }, _attrs))}><section class="relative w-full flex flex-col md:flex-row min-h-[calc(100vh-88px)] bg-[#fcf9f8]"><div class="w-full md:w-[55%] lg:w-1/2 flex flex-col justify-center px-6 md:pl-12 lg:pl-24 xl:pl-32 py-16 md:py-24 z-10 relative"><p class="text-[11px] font-bold tracking-[0.15em] text-[#0C2619] uppercase mb-4 flex items-center gap-3"><span class="w-2 h-2 rounded-full bg-[#0C2619]"></span> SIMULADOR FINANCIERO </p><h1 class="font-serif text-[40px] md:text-[56px] lg:text-[72px] font-medium leading-[1.05] tracking-[-0.02em] text-[#0C2619] uppercase mb-6 max-w-lg drop-shadow-sm"> DISEÑA TU<br> PLAN DE PAGO. </h1><div class="w-12 border-t-2 border-[#D3A76A] mb-8"></div><p class="text-[15px] md:text-[16px] text-[#4c4546] font-normal leading-[1.6] max-w-[360px] mb-12"> Explora opciones de financiación flexibles y encuentra el plan que se adapta a ti. </p><div class="flex gap-4 md:gap-6 mb-12 max-w-2xl text-left"><div class="flex-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#1c1b1b] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg><h4 class="text-[9px] md:text-[10px] font-bold text-[#1c1b1b] uppercase tracking-widest mb-1">PLANES FLEXIBLES</h4><p class="text-[11px] text-[#4c4546] leading-relaxed">Elige el plazo que<br>mejor se ajuste a ti.</p></div><div class="flex-1 border-l border-[#cfc4c5] pl-4 md:pl-6"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#1c1b1b] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg><h4 class="text-[9px] md:text-[10px] font-bold text-[#1c1b1b] uppercase tracking-widest mb-1">SEGURO Y CONFIABLE</h4><p class="text-[11px] text-[#4c4546] leading-relaxed">Tus datos están<br>protegidos.</p></div><div class="flex-1 border-l border-[#cfc4c5] pl-4 md:pl-6"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#1c1b1b] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg><h4 class="text-[9px] md:text-[10px] font-bold text-[#1c1b1b] uppercase tracking-widest mb-1">ASESOR PERSONAL</h4><p class="text-[11px] text-[#4c4546] leading-relaxed">Un asesor te acompaña<br>en cada paso.</p></div></div></div><div class="w-full md:w-[45%] lg:w-1/2 md:absolute md:top-0 md:right-0 md:bottom-0 h-[400px] md:h-auto overflow-hidden relative"><img${ssrRenderAttr("src", _imports_0)} alt="Diseña tu plan de pago" class="w-full h-full object-cover object-[center_20%]"><div class="hidden md:block absolute inset-y-0 left-0 w-32 lg:w-48 bg-gradient-to-r from-[#fcf9f8] to-transparent"></div><div class="md:hidden absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#fcf9f8] to-transparent"></div></div></section><div class="bg-white py-20 md:py-24 w-full flex-grow"><div class="max-w-[1200px] mx-auto px-4 md:px-12"><section class="grid grid-cols-1 lg:grid-cols-3 gap-8"><div class="lg:col-span-2 bg-[#E7DDD1] p-8 md:p-12 rounded-[2rem] shadow-sm border border-[#BBB2AA]/30"><h2 class="font-serif text-3xl font-bold text-[#111111] mb-10">Calcula tu plan de pago</h2><div class="space-y-12"><div class="grid grid-cols-1 md:grid-cols-2 gap-8"><div class="flex flex-col gap-4"><label class="font-bold text-sm text-[#111111]">Procedimiento</label><select class="w-full bg-white border border-[#BBB2AA]/30 p-4 rounded-xl text-lg focus:outline-none focus:border-[#D3A76A] transition-colors"><!--[-->`);
      ssrRenderList(unref(availableProcedures), (proc) => {
        _push(`<option${ssrRenderAttr("value", proc.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(procedure)) ? ssrLooseContain(unref(procedure), proc.id) : ssrLooseEqual(unref(procedure), proc.id)) ? " selected" : ""}>${ssrInterpolate(proc.name)}</option>`);
      });
      _push(`<!--]--></select></div><div class="flex flex-col gap-4"><label class="font-bold text-sm text-[#111111]">Ciudad de Operación</label><select class="w-full bg-white border border-[#BBB2AA]/30 p-4 rounded-xl text-lg focus:outline-none focus:border-[#D3A76A] transition-colors"><option value="Medellín"${ssrIncludeBooleanAttr(Array.isArray(unref(city)) ? ssrLooseContain(unref(city), "Medellín") : ssrLooseEqual(unref(city), "Medellín")) ? " selected" : ""}>Medellín</option><option value="Cali"${ssrIncludeBooleanAttr(Array.isArray(unref(city)) ? ssrLooseContain(unref(city), "Cali") : ssrLooseEqual(unref(city), "Cali")) ? " selected" : ""}>Cali</option><option value="Barranquilla"${ssrIncludeBooleanAttr(Array.isArray(unref(city)) ? ssrLooseContain(unref(city), "Barranquilla") : ssrLooseEqual(unref(city), "Barranquilla")) ? " selected" : ""}>Barranquilla</option><option value="Por Definir"${ssrIncludeBooleanAttr(Array.isArray(unref(city)) ? ssrLooseContain(unref(city), "Por Definir") : ssrLooseEqual(unref(city), "Por Definir")) ? " selected" : ""}>Por Definir</option></select></div></div><div class="space-y-4"><div class="flex justify-between items-end"><label class="font-bold text-sm text-[#111111]">Monto a financiar</label><div class="relative"><span class="absolute left-2 top-1/2 -translate-y-1/2 text-2xl font-bold text-[#111111]">$</span><input type="text"${ssrRenderAttr("value", unref(displayAmount))} class="bg-transparent pl-8 text-2xl md:text-3xl font-bold text-[#111111] w-[180px] md:w-[220px] text-right focus:outline-none border-b border-transparent focus:border-[#0C2619] transition-colors"></div></div><input type="range"${ssrRenderAttr("value", unref(amount))}${ssrRenderAttr("min", unref(MIN_AMOUNT))}${ssrRenderAttr("max", unref(MAX_AMOUNT))}${ssrRenderAttr("step", unref(STEP_AMOUNT))} class="w-full h-2 bg-[#BBB2AA]/30 rounded-lg appearance-none cursor-pointer accent-[#D3A76A]"><div class="flex justify-between text-xs text-[#111111]/60 font-bold mt-2"><span>$${ssrInterpolate(unref(MIN_AMOUNT) / 1e6)}M</span><span>$${ssrInterpolate(unref(MAX_AMOUNT) / 1e6)}M</span></div></div><div class="space-y-4"><label class="font-bold text-sm text-[#111111]">Plazo estimado (Meses)</label><div class="grid grid-cols-3 md:grid-cols-7 gap-3 md:gap-4"><!--[-->`);
      ssrRenderList([12, 18, 24, 36, 48, 60, 72], (term) => {
        _push(`<button class="${ssrRenderClass([
          "p-4 rounded-xl font-bold text-lg transition-all",
          unref(months) === term ? "border-2 border-[#D3A76A] bg-[#D3A76A]/20 text-[#D3A76A]" : "border border-[#BBB2AA]/30 text-[#111111]/80 hover:bg-white hover:border-[#BBB2AA]"
        ])}">${ssrInterpolate(term)}</button>`);
      });
      _push(`<!--]--></div></div></div></div><div class="w-full"><div class="bg-[#0C2619] text-white p-8 md:p-10 rounded-[2rem] shadow-2xl sticky top-32"><h3 class="text-xs font-bold tracking-widest text-[#848484] uppercase mb-8">CUOTA ESTIMADA</h3>`);
      if (unref(isLoading) && !unref(currentQuote)) {
        _push(`<div class="flex flex-col gap-4 animate-pulse"><div class="h-12 bg-[#313030] rounded w-3/4 mb-4"></div><div class="h-6 bg-[#313030] rounded w-1/2"></div></div>`);
      } else if (unref(currentQuote)) {
        _push(`<div class="${ssrRenderClass({ "opacity-50 transition-opacity": unref(isLoading) })}"><div class="flex flex-col gap-2 mb-10"><span class="text-sm text-[#848484]">Cuota mensual aproximada</span><span class="text-4xl md:text-5xl font-medium text-white tracking-tight leading-none">${ssrInterpolate(unref(formatCurrency)(unref(currentQuote).monthlyPayment))}</span></div><hr class="border-[#313030] mb-8"><div class="flex flex-col gap-4 mb-8"><div class="flex justify-between items-center text-sm"><span class="text-[#848484]">Total a financiar</span><span class="font-medium text-white">${ssrInterpolate(unref(formatCurrency)(unref(amount)))}</span></div><div class="flex justify-between items-center text-sm"><span class="text-[#848484]">Plazo seleccionado</span><span class="font-medium text-white">${ssrInterpolate(unref(months))} meses</span></div><div class="flex items-start gap-3 mt-4 p-4 rounded-xl bg-black/40 border border-[#313030]"><p class="text-xs text-[#848484] leading-relaxed">${ssrInterpolate(unref(currentQuote).disclaimer)}</p></div></div><div class="flex flex-col gap-4"><button class="w-full bg-white text-[#0C2619] py-4 rounded-xl font-bold text-xs tracking-widest uppercase hover:bg-white transition-colors flex justify-center items-center gap-3"> SOLICITAR FINANCIACIÓN </button><p class="text-[11px] text-[#848484] text-center leading-relaxed"> ¿Tienes alguna situación en centrales de riesgo? Puedes realizar tu solicitud. La viabilidad será determinada durante el estudio de crédito con un asesor. </p></div></div>`);
      } else {
        _push(`<div class="text-[#848484] text-sm"> Modifica los valores para generar tu estimación. </div>`);
      }
      _push(`</div></div></section></div></div>`);
      _push(ssrRenderComponent(_component_FormsLeadForm, {
        isOpen: isLeadFormOpen.value,
        "onUpdate:isOpen": ($event) => isLeadFormOpen.value = $event,
        procedure: unref(procedure),
        amount: unref(amount),
        installments: unref(months),
        city: unref(city)
      }, null, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/simulador.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=simulador-Ct9lAfbk.mjs.map

import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { quotationService } from '~/services/QuotationService'
import type { QuotationResult } from '~/providers/MockQuotationProvider'
import { trackingService } from '~/services/TrackingService'
import { publicProcedureService } from '~/services/PublicProcedureService'
import type { Procedure } from '~/types/procedure'
import { useAsyncData } from '#imports'

export function useSimulator() {
  const route = useRoute()
  
  const STEP_AMOUNT = 500000
  const MIN_AMOUNT = 1000000
  const MAX_AMOUNT = 100000000
  
  const amount = ref(15000000)
  
  const months = ref(24)
  const procedure = ref('')
  const city = ref('Medellín')
  
  const currentQuote = ref<QuotationResult | null>(null)
  const isLoading = ref(false)
  let abortController: AbortController | null = null

  const { data: availableProcedures } = useAsyncData('procedures', () => publicProcedureService.getProcedures(), {
    default: () => [] as Procedure[]
  })
  
  watch(availableProcedures, (newProcs) => {
    if (newProcs && newProcs.length > 0 && !procedure.value) {
      const queryProcedureId = route.query.procedureId as string
      if (queryProcedureId && newProcs.some(p => p.id === queryProcedureId)) {
        procedure.value = queryProcedureId
      } else {
        procedure.value = newProcs[0]!.id
      }
    }
  }, { immediate: true })

  const formatCurrency = (value: number) => {
    if (!value) return '$ 0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(value)
  }

  const displayAmount = computed({
    get: () => {
      if (!amount.value || isNaN(amount.value)) return '';
      return new Intl.NumberFormat('es-CO').format(amount.value);
    },
    set: (val: string) => {
      const parsed = parseInt(val.replace(/\D/g, ''))
      if (!isNaN(parsed)) {
        amount.value = parsed
      } else {
        amount.value = 0
      }
    }
  })

  const handleAmountBlur = () => {
    if (!amount.value) amount.value = MIN_AMOUNT;
    if (amount.value < MIN_AMOUNT) amount.value = MIN_AMOUNT
    if (amount.value > MAX_AMOUNT) amount.value = MAX_AMOUNT
    amount.value = Math.round(amount.value / STEP_AMOUNT) * STEP_AMOUNT
  }

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
      
      trackingService.track('SIMULATOR_CALC', '/financiacion', {
        intent: {
          item_name: procedure.value,
          financial_amount: amount.value,
          financial_installments: months.value,
          target_location: city.value
        }
      });
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error('Error al simular cotizacion:', e);
      }
    } finally {
      if (!signal.aborted) {
        isLoading.value = false;
      }
    }
  }

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
  }
}

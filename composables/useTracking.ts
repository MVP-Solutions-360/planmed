import { trackingService } from '~/services/TrackingService'

export const useTracking = () => {
  const getVisitorUuid = () => {
    return trackingService.getVisitorUuid()
  }

  const trackPageView = (path: string, title: string) => {
    trackingService.track('PAGE_VIEW', path, { context: { page_title: title } })
  }

  const trackFormStart = (path: string, procedureName: string, amount: number | null, installments: number | null, monthlyPayment: number | null) => {
    trackingService.track('FORM_START', path, { 
      intent: { 
        item_name: procedureName || 'General',
        financial_amount: amount,
        financial_installments: installments,
        estimated_monthly_payment: monthlyPayment
      } 
    })
  }

  const trackFormSubmit = (path: string, procedureName: string, amount: number, installments: number, monthlyPayment: number | null) => {
    trackingService.track('FORM_SUBMIT', path, {
      intent: {
        item_name: procedureName,
        financial_amount: amount,
        financial_installments: installments,
        estimated_monthly_payment: monthlyPayment
      }
    })
  }

  const trackWhatsAppClick = (path: string) => {
    trackingService.track('WHATSAPP_CLICK', path)
  }

  const trackSimulatorCalc = (path: string, procedureName: string, amount: number, installments: number, clinic: string) => {
    trackingService.track('SIMULATOR_CALC', path, {
      intent: {
        item_name: procedureName,
        financial_amount: amount,
        financial_installments: installments,
        target_location: clinic
      }
    })
  }

  const trackPolicyView = (path: string, policyType: string, version: string) => {
    trackingService.track('POLICY_VIEW', path, {
      legal: {
        policy_type: policyType,
        version: version
      }
    })
  }

  return {
    getVisitorUuid,
    trackPageView,
    trackFormStart,
    trackFormSubmit,
    trackWhatsAppClick,
    trackSimulatorCalc,
    trackPolicyView
  }
}

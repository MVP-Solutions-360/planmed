export class LocalTrackingProvider {
  trackEvent(eventType: string, pagePath: string, payload: any = null) {
    if (!import.meta.client) return;
    
    const event = {
      timestamp: new Date().toISOString(),
      eventType,
      pagePath,
      payload
    };
    
    console.log('[TRACKING PROVIDER] Evento registrado:', event);
    // Para persistencia en desarrollo (MOCK) podríamos usar localStorage,
    // pero console.log es suficiente para verificar desacoplamiento de Wellezy.
  }
}

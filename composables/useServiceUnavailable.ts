import type { Ref } from 'vue'
import { useRequestEvent, setResponseStatus } from '#imports'

/**
 * Si un listado se renderiza en el servidor y el Hub falló (`error`), responde HTTP 503 aunque la página se muestre con su aviso
 * de reintento: evita que un buscador o una caché guarde una lista vacía como si fuera la página real. Una lista vacía válida
 * (sin error) conserva HTTP 200. En el navegador no hace nada.
 */
export function useServiceUnavailable(error: Ref<unknown>) {
  if (import.meta.server && error.value) {
    const event = useRequestEvent()
    if (event) setResponseStatus(event, 503, 'Service Unavailable')
  }
}

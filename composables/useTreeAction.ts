import { ref } from 'vue'
import { describeTreeError, type TreeErrorInfo } from '#shared/utils/recommendationAdminApi'

/**
 * Ejecuta UNA acción del panel de Recomendaciones a la vez: evita envíos duplicados (mientras corre, otra llamada se ignora), conserva
 * el error clasificado junto a la acción que falló y nunca lo interpreta como éxito. No reintenta: una escritura repetida podría duplicar
 * contenido en Hub.
 */
export function useTreeAction() {
  const busy = ref(false)
  const error = ref<TreeErrorInfo | null>(null)

  async function run<T>(fn: () => Promise<T>): Promise<{ ok: true, value: T } | { ok: false }> {
    if (busy.value) return { ok: false }
    busy.value = true
    error.value = null
    try {
      return { ok: true, value: await fn() }
    } catch (e) {
      error.value = describeTreeError(e)
      return { ok: false }
    } finally {
      busy.value = false
    }
  }

  const clear = () => { error.value = null }

  return { busy, error, run, clear }
}

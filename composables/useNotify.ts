import Swal from 'sweetalert2'

const base = Swal.mixin({
  confirmButtonColor: '#0C2619',
  cancelButtonColor: '#6b7280',
  buttonsStyling: true,
  customClass: {
    popup: 'rounded-2xl',
    confirmButton: 'rounded-lg',
    cancelButton: 'rounded-lg'
  }
})

const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true
})

export function useNotify() {
  return {
    success: (title: string) => toast.fire({ icon: 'success', title }),
    error: (text: string, title = 'Ocurrió un error') => base.fire({ icon: 'error', title, text }),
    confirm: async (title: string, text = '', confirmText = 'Sí, continuar') => {
      const res = await base.fire({
        icon: 'warning',
        title,
        text,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: 'Cancelar'
      })
      return res.isConfirmed
    }
  }
}

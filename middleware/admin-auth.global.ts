import { defineNuxtRouteMiddleware, navigateTo, useRequestFetch, createError } from '#imports'
import { authService } from '~/services/AuthService'

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only protect /admin routes
  if (!to.path.startsWith('/admin')) {
    return
  }

  // Ensure session is loaded (especially important on SSR and first load)
  await authService.loadUserSession()
  
  const isAuth = authService.isAuthenticated()

  if (to.path === '/admin/login') {
    if (isAuth) {
      return navigateTo('/admin')
    }
    return
  }

  if (!isAuth) {
    return navigateTo('/admin/login')
  }

  // Nosotros / Clínicas / páginas: solo perfiles editores de contenido. La UI solo lo refleja; el servidor lo impone en cada escritura (403).
  if (to.path.startsWith('/admin/nosotros') || to.path.startsWith('/admin/paginas')) {
    if (authService.getUser().value?.canEditContent !== true) {
      throw createError({ statusCode: 403, statusMessage: 'No tienes permiso para editar este contenido.', fatal: true })
    }
  }

  // Configuración: solo el líder de la línea. El servidor decide (403); la UI solo lo refleja.
  if (to.path.startsWith('/admin/configuracion')) {
    try {
      await useRequestFetch()('/api/admin/config/access')
    } catch (e: any) {
      if ((e?.statusCode ?? e?.response?.status) === 401) return navigateTo('/admin/login')
      throw createError({ statusCode: 403, statusMessage: 'Solo el líder de la línea puede acceder a la configuración.', fatal: true })
    }
  }
})
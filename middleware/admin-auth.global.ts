import { defineNuxtRouteMiddleware, navigateTo } from '#imports'
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
})
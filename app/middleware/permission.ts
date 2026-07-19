export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    authStore.initAuth()
  }

  if (!authStore.isAuthenticated) {
    if (to.path.startsWith('/admin')) {
      return navigateTo('/admin/login')
    }

    return navigateTo('/login')
  }

  if (!authStore.user && authStore.token) {
    try {
      await authStore.fetchUser()
    } catch {
      if (to.path.startsWith('/admin')) return navigateTo('/admin/login')
      return navigateTo('/login')
    }
  }

  const hasAdminAccess = authStore.hasPermission('dashboard.view')
  const requiredPermission = typeof to.meta?.permission === 'string'
    ? to.meta.permission
    : null

  if (to.path.startsWith('/admin') && !hasAdminAccess) {
    return navigateTo('/app')
  }

  if (requiredPermission && !authStore.hasPermission(requiredPermission)) {
    if (hasAdminAccess) {
      return navigateTo('/admin/dashboard')
    }

    if (to.path.startsWith('/app')) {
      return navigateTo('/')
    }

    return navigateTo('/app')
  }
})

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    authStore.initAuth()
  }

  if (!authStore.isAuthenticated) {
    if (to.path.startsWith('/admin')) {
      return navigateTo('/admin/login')
    }

    if (to.path.startsWith('/vendor')) {
      return navigateTo('/vendor/login')
    }

    return navigateTo('/login')
  }

  if (!authStore.user && authStore.token) {
    try {
      await authStore.fetchUser()
    } catch {
      if (to.path.startsWith('/admin')) return navigateTo('/admin/login')
      if (to.path.startsWith('/vendor')) return navigateTo('/vendor/login')
      return navigateTo('/login')
    }
  }

  const hasAdminAccess = authStore.hasPermission('dashboard.view')
  const isVendor = authStore.hasRole('Vendor') || authStore.hasPermission('vendor.view')
  const requiredPermission = typeof to.meta?.permission === 'string'
    ? to.meta.permission
    : null

  if (to.path.startsWith('/admin') && !hasAdminAccess) {
    return navigateTo(isVendor ? '/vendor/dashboard' : '/app')
  }

  if (to.path.startsWith('/vendor') && !isVendor) {
    return navigateTo(hasAdminAccess ? '/admin/dashboard' : '/app')
  }

  if (requiredPermission && !authStore.hasPermission(requiredPermission)) {
    if (hasAdminAccess) {
      return navigateTo('/admin/dashboard')
    }

    if (isVendor) {
      return navigateTo('/vendor/dashboard')
    }

    if (to.path.startsWith('/app')) {
      return navigateTo('/')
    }

    return navigateTo('/app')
  }
})

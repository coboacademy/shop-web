export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    authStore.initAuth()
  }

  if (authStore.token && !authStore.user) {
    try {
      await authStore.fetchUser()
    } catch {
      return
    }
  }

  if (authStore.isAuthenticated) {
    const isAdmin = authStore.hasPermission('dashboard.view')
    const isVendor = authStore.hasRole('Vendor') || authStore.hasPermission('vendor.view')

    if (to.path.startsWith('/admin')) {
      return navigateTo(isAdmin ? '/admin/dashboard' : isVendor ? '/vendor/dashboard' : '/app')
    }

    if (to.path.startsWith('/vendor')) {
      return navigateTo(isVendor ? '/vendor/dashboard' : isAdmin ? '/admin/dashboard' : '/app')
    }

    return navigateTo(isAdmin ? '/admin/dashboard' : isVendor ? '/vendor/dashboard' : '/app')
  }
})

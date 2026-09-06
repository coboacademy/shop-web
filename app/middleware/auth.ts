export default defineNuxtRouteMiddleware((to) => {
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
})

export default defineNuxtRouteMiddleware((to) => {
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
})

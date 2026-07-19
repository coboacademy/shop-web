export const useAuth = () => {
  const authStore = useAuthStore()

  const login = async (payload: { email: string; password: string }) => {
    const res = await authStore.login(payload)
    try {
      if (authStore.isAuthenticated) {
        const menuStore = useMenuStore()
        await menuStore.fetchMenus()
      }
    } catch (e) {
      // ignore menu load errors
    }

    return res
  }

  const register = async (payload: {
    name: string
    email: string
    password: string
    password_confirmation: string
  }) => {
    const res = await authStore.register(payload)
    try {
      if (authStore.isAuthenticated) {
        const menuStore = useMenuStore()
        await menuStore.fetchMenus()
      }
    } catch (e) {
      // ignore menu load errors
    }

    return res
  }

  const logout = async () => {
    const res = await authStore.logout()
    try {
      const menuStore = useMenuStore()
      menuStore.clearMenus()
    } catch (e) {
      // ignore
    }
    return res
  }

  const logoutAll = async () => {
    const res = await authStore.logoutAll()
    try {
      const menuStore = useMenuStore()
      menuStore.clearMenus()
    } catch (e) {
      // ignore
    }
    return res
  }
  const fetchUser = async () => {
    const res = await authStore.fetchUser()
    try {
      const menuStore = useMenuStore()
      await menuStore.fetchMenus()
    } catch (e) {
      // ignore menu load errors
    }
    return res
  }
  

  return {
    user: computed(() => authStore.user),
    token: computed(() => authStore.token),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    loading: computed(() => authStore.loading),
    login,
    register,
    logout,
    logoutAll,
    fetchUser,
  }
}
import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { useAppCacheStore } from '~/stores/appCache'

interface User {
  id: number
  name: string
  email: string
  email_verified_at?: string | null
  is_email_verified?: boolean
  role?: string | null
  roles?: string[]
  permissions?: string[]
  status?: string
  created_at?: string
  updated_at?: string
}

interface AuthPayloadResponse {
  status: string
  message: string
  data?: {
    user: User
    token: string
    token_type: string
    redirect_to?: string
  }
}

interface ValidationErrors {
  [key: string]: string[]
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: null as string | null,
    loading: false,
    initialized: false,
  }),

  getters: {

    isAuthenticated: (state) => !!state.token,
    
    hasPermission: (state) => {
      return (permission: string) => {
        const permissions = state.user?.permissions || []

        return permissions.some((item: any) => {
          if (typeof item === 'string') {
            return item === permission
          }

          return item?.name === permission
        })
      }
    },

    hasAnyPermission: (state) => {
      return (permissions: string[]) => {
        const userPermissions = state.user?.permissions || []

        return permissions.some((permission) => {
          return userPermissions.some((item: any) => {
            if (typeof item === 'string') {
              return item === permission
            }

            return item?.name === permission
          })
        })
      }
    },

    hasRole: (state) => {
      return (role: string) => {
        return state.user?.roles?.includes(role) || false
      }
    },
  },

  actions: {
    redirectPath() {
      if (this.hasPermission('dashboard.view')) {
        return '/admin/dashboard'
      }

      if (this.hasPermission('account.view')) {
        return '/app'
      }

      return '/'
    },

    initAuth() {
      if (process.client) {
        const savedToken = localStorage.getItem('auth_token')
        const savedUser = localStorage.getItem('auth_user')

        if (savedToken) this.token = savedToken
        if (savedUser) this.user = JSON.parse(savedUser)
      }

      this.initialized = true
    },

    setAuth(user: User, token: string) {
      this.user = user
      this.token = token

      if (process.client) {
        localStorage.setItem('auth_token', token)
        localStorage.setItem('auth_user', JSON.stringify(user))
      }
    },

    clearAuth() {
      this.user = null
      this.token = null

      if (process.client) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    },

    async register(payload: {
      name: string
      email: string
      password: string
      password_confirmation: string
    }) {
      const api = useApi()
      this.loading = true

      try {
        const response = await api.post<AuthPayloadResponse>('/register', payload)

        if (response.data.data) {
          this.setAuth(response.data.data.user, response.data.data.token)
        }

        return response.data
      } catch (error: any) {
        throw {
          message: error.response?.data?.message || 'Registration failed',
          errors: error.response?.data?.errors || {},
          status: error.response?.status || 500,
        }
      } finally {
        this.loading = false
      }
    },

    async login(payload: { email: string; password: string }) {
      const api = useApi()
      this.loading = true

      try {
        const response = await api.post<AuthPayloadResponse>('/login', payload)
        const data = response.data.data

        if (!data) {
          return '/'
        }

        this.setAuth(data.user, data.token)
        await this.fetchUser()

        return data.redirect_to || this.redirectPath()
      } catch (error: any) {
        throw {
          message: error.response?.data?.message || 'Login failed',
          errors: error.response?.data?.errors || {},
          status: error.response?.status || 500,
        }
      } finally {
        this.loading = false
      }
    },

    async fetchUser() {
      if (!this.token) return null

      const api = useApi()
      api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`

      try {
        const response = await api.get('/user')
        this.user = response.data.data.user

        if (process.client) {
          localStorage.setItem('auth_user', JSON.stringify(this.user))
        }

        return response.data
      } catch (error: any) {
        this.clearAuth()
        throw {
          message: error.response?.data?.message || 'Failed to fetch user',
          errors: error.response?.data?.errors || {},
          status: error.response?.status || 500,
        }
      }
    },

    async logout() {
      const api = useApi()

      try {
        await api.post('/logout')
      } catch (error) {
        // optional
      } finally {
        this.user = null
        this.token = null

        const appCache = useAppCacheStore()
        appCache.clearAll()

        if (import.meta.client) {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
        }

        await navigateTo('/login')
      }
    },

    async logoutAll() {
      if (!this.token) return

      const api = useApi()
      api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`

      try {
        await api.post('/logout-all')
      } finally {
        this.clearAuth()
      }
    },
  },
})

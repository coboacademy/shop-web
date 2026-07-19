import { defineStore } from 'pinia'
import type { RoleItem, RolePagination } from '~/composables/useRole'

export interface RoleFilters {
  search?: string
  guard_name?: string
  page?: number
  per_page?: number
}

export interface RoleStats {
  total_roles: number
  protected_roles: number
}

interface RoleListResponse {
  status: string
  message: string
  data: {
    roles: RoleItem[]
    pagination: RolePagination
    stats?: RoleStats
  }
}

const defaultPagination = (): RolePagination => ({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
})

const defaultStats = (): RoleStats => ({
  total_roles: 0,
  protected_roles: 0,
})

export const useRoleManagementStore = defineStore('management-role', {
  state: () => ({
    roles: [] as RoleItem[],
    pagination: defaultPagination(),
    stats: defaultStats(),

    loading: false,
    refreshing: false,
    errorMessage: '',

    lastFilters: {
      search: '',
      guard_name: '',
      page: 1,
      per_page: 10,
    } as Required<RoleFilters>,
  }),

  getters: {
    hasData: (state) => state.roles.length > 0,

    currentPage: (state) => state.pagination?.current_page ?? 1,
    lastPage: (state) => state.pagination?.last_page ?? 1,
    totalItems: (state) => state.pagination?.total ?? 0,

    totalRoles: (state) => state.stats?.total_roles ?? state.roles.length ?? 0,
    protectedRoles: (state) => state.stats?.protected_roles ?? 0,
  },

  actions: {
    normalizeFilters(filters: RoleFilters = {}) {
      return {
        search: filters.search || '',
        guard_name: filters.guard_name || '',
        page: filters.page || 1,
        per_page: filters.per_page || 10,
      }
    },

    applyResponse(response: RoleListResponse | any) {
      const data = response?.data || {}

      this.roles = Array.isArray(data.roles) ? data.roles : []

      this.pagination = {
        ...defaultPagination(),
        ...(data.pagination || {}),
      }

      this.stats = {
        ...defaultStats(),
        ...(data.stats || {}),
        total_roles:
          data.stats?.total_roles ??
          data.pagination?.total ??
          this.roles.length ??
          0,
      }
    },

    async fetchRoles(
      filters: RoleFilters = {},
      options: {
        force?: boolean
        silent?: boolean
      } = {}
    ) {
      const { getRoles } = useRole()
      const { cachedRequest } = useCachedRequest()

      const normalizedFilters = this.normalizeFilters(filters)

      this.lastFilters = normalizedFilters
      this.errorMessage = ''

      if (this.hasData || options.silent) {
        this.refreshing = true
      } else {
        this.loading = true
      }

      try {
        await cachedRequest<RoleListResponse>({
          module: 'roles',
          filters: normalizedFilters,
          ttl: 1000 * 60 * 10,
          force: options.force,
          request: () => getRoles(normalizedFilters),
          onCached: (response) => this.applyResponse(response),
          onFresh: (response) => this.applyResponse(response),
        })
      } catch (error: any) {
        this.errorMessage =
          error.response?.data?.message ||
          error.message ||
          'Failed to load roles'
      } finally {
        this.loading = false
        this.refreshing = false
      }
    },

    async refreshRoles() {
      await this.fetchRoles(this.lastFilters, {
        force: true,
        silent: true,
      })
    },

    clearCache() {
      const appCache = useAppCacheStore()
      appCache.forgetByPrefix('roles:')
    },

    async invalidateAndRefresh() {
      this.clearCache()

      await this.fetchRoles(this.lastFilters, {
        force: true,
        silent: true,
      })
    },

    resetState() {
      this.roles = []
      this.pagination = defaultPagination()
      this.stats = defaultStats()
      this.loading = false
      this.refreshing = false
      this.errorMessage = ''
      this.lastFilters = {
        search: '',
        guard_name: '',
        page: 1,
        per_page: 10,
      }
    },
  },
})
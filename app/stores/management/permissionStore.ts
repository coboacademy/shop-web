import { defineStore } from 'pinia'
import type {
  PermissionItem,
  PermissionPagination,
} from '~/composables/usePermission'

export interface PermissionFilters {
  search?: string
  module?: string
  guard_name?: string
  page?: number
  per_page?: number
}

export interface PermissionStats {
  total_permissions: number
  protected_permissions: number
}

interface PermissionListResponse {
  status: string
  message: string
  data: {
    permissions: PermissionItem[]
    pagination: PermissionPagination
    stats: PermissionStats
  }
}

const defaultPagination = (): PermissionPagination => ({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
})

const defaultStats = (): PermissionStats => ({
  total_permissions: 0,
  protected_permissions: 0,
})

export const usePermissionManagementStore = defineStore('management-permission', {
  state: () => ({
    permissions: [] as PermissionItem[],
    pagination: defaultPagination(),
    stats: defaultStats(),

    loading: false,
    refreshing: false,
    errorMessage: '',

    lastFilters: {
      search: '',
      module: '',
      guard_name: '',
      page: 1,
      per_page: 10,
    } as Required<PermissionFilters>,
  }),

  getters: {
    hasData: (state) => state.permissions.length > 0,

    currentPage: (state) => state.pagination?.current_page ?? 1,
    lastPage: (state) => state.pagination?.last_page ?? 1,
    totalItems: (state) => state.pagination?.total ?? 0,

    totalPermissions: (state) => state.stats?.total_permissions ?? 0,
    protectedPermissions: (state) => state.stats?.protected_permissions ?? 0,
  },

  actions: {
    normalizeFilters(filters: PermissionFilters = {}) {
      return {
        search: filters.search || '',
        module: filters.module || '',
        guard_name: filters.guard_name || '',
        page: filters.page || 1,
        per_page: filters.per_page || 10,
      }
    },

    applyResponse(response: PermissionListResponse | any) {
      const data = response?.data || {}

      this.permissions = Array.isArray(data.permissions) ? data.permissions : []

      this.pagination = {
        ...defaultPagination(),
        ...(data.pagination || {}),
      }

      this.stats = {
        ...defaultStats(),
        ...(data.stats || {}),
      }
    },

    async fetchPermissions(
      filters: PermissionFilters = {},
      options: {
        force?: boolean
        silent?: boolean
      } = {}
    ) {
      const { getPermissions } = usePermission()
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
        await cachedRequest<PermissionListResponse>({
          module: 'permissions',
          filters: normalizedFilters,
          ttl: 1000 * 60 * 10,
          force: options.force,
          request: () => getPermissions(normalizedFilters),
          onCached: (response) => this.applyResponse(response),
          onFresh: (response) => this.applyResponse(response),
        })
      } catch (error: any) {
        this.errorMessage =
          error.response?.data?.message ||
          error.message ||
          'Failed to load permissions'
      } finally {
        this.loading = false
        this.refreshing = false
      }
    },

    async refreshPermissions() {
      await this.fetchPermissions(this.lastFilters, {
        force: true,
        silent: true,
      })
    },

    clearCache() {
      const appCache = useAppCacheStore()
      appCache.forgetByPrefix('permissions:')
    },

    async invalidateAndRefresh() {
      this.clearCache()

      await this.fetchPermissions(this.lastFilters, {
        force: true,
        silent: true,
      })
    },

    resetState() {
      this.permissions = []
      this.pagination = defaultPagination()
      this.stats = defaultStats()
      this.loading = false
      this.refreshing = false
      this.errorMessage = ''
      this.lastFilters = {
        search: '',
        module: '',
        guard_name: '',
        page: 1,
        per_page: 10,
      }
    },
  },
})
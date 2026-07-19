import { defineStore } from 'pinia'
import type {
  ProductFilters,
  ProductItem,
  ProductListResponse,
  ProductPagination,
  ProductStats,
} from '~/composables/useProduct'


const defaultPagination = (): ProductPagination => ({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
})

const defaultStats = (): ProductStats => ({
  total_products: 0,
  active_products: 0,
  inactive_products: 0,
  draft_products: 0,
  low_stock_products: 0,
})

export const useProductManagementStore = defineStore('inventory-product', {
    state: () => ({
    products: [] as ProductItem[],

    pagination: defaultPagination(),
    stats: defaultStats(),

    loading: false,
    refreshing: false,
    errorMessage: '',

    lastFilters: {
      search: '',
      status: '',
      page: 1,
      per_page: 10,
    } as Required<ProductFilters>,
  }),

  getters: {
    hasData: (state) => state.products.length > 0,

    currentPage: (state) => state.pagination?.current_page ?? 1,
    lastPage: (state) => state.pagination?.last_page ?? 1,
    totalItems: (state) => state.pagination?.total ?? 0,
    perPageValue: (state) => state.pagination?.per_page ?? 10,

    totalProducts: (state) => state.stats?.total_products ?? 0,
    activeProducts: (state) => state.stats?.active_products ?? 0,
    inactiveProducts: (state) => state.stats?.inactive_products ?? 0,
    draftProducts: (state) => state.stats?.draft_products ?? 0,
    lowStockProducts: (state) => state.stats?.low_stock_products ?? 0,
  },

  actions: {
    normalizeFilters(filters: ProductFilters = {}) {
      return {
        search: filters.search || '',
        status: filters.status || '',
        page: filters.page || 1,
        per_page: filters.per_page || 10,
      }
    },

    applyResponse(response: ProductListResponse | any) {
      const data = response?.data || {}

      this.products = Array.isArray(data.products) ? data.products : []

      this.pagination = {
        ...defaultPagination(),
        ...(data.pagination || {}),
      }

      this.stats = {
        ...defaultStats(),
        ...(data.stats || {}),
      }
    },

    async fetchProducts(
      filters: ProductFilters = {},
      options: {
        force?: boolean
        silent?: boolean
      } = {}
    ) {
      const { getProducts } = useProduct()
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
        await cachedRequest<ProductListResponse>({
          module: 'products',
          filters: normalizedFilters,
          ttl: 1000 * 60 * 5,
          force: options.force,
          request: () => getProducts(normalizedFilters),
          onCached: (response) => {
            this.applyResponse(response)
          },
          onFresh: (response) => {
            this.applyResponse(response)
          },
        })
      } catch (error: any) {
        this.errorMessage =
          error.response?.data?.message ||
          error.message ||
          'Failed to load products'
      } finally {
        this.loading = false
        this.refreshing = false
      }
    },

    async refreshProducts() {
      await this.fetchProducts(this.lastFilters, {
        force: true,
        silent: true,
      })
    },

    clearCache() {
      const appCache = useAppCacheStore()
      appCache.forgetByPrefix('products:')
    },

    async invalidateAndRefresh() {
      this.clearCache()

      await this.fetchProducts(this.lastFilters, {
        force: true,
        silent: true,
      })
    },

    resetState() {
      this.products = []
      this.pagination = defaultPagination()
      this.stats = defaultStats()

      this.loading = false
      this.refreshing = false
      this.errorMessage = ''

      this.lastFilters = {
        search: '',
        status: '',
        page: 1,
        per_page: 10,
      }
    },
  },
})
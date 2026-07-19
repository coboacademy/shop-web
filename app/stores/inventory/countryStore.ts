import { defineStore } from "pinia";
import type {
  CountryFilters,
  CountryItem,
  CountryListResponse,
  CountryPagination,
  CountryStats,
} from "~/composables/useCountry";

const defaultPagination = (): CountryPagination => ({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
});

const defaultStats = (): CountryStats => ({
  total_countries: 0,
});

export const useCountryManagementStore = defineStore("inventory-country", {
  state: () => ({
    countries: [] as CountryItem[],
    pagination: defaultPagination(),
    stats: defaultStats(),

    loading: false,
    refreshing: false,
    errorMessage: "",

    lastFilters: {
      search: "",
      page: 1,
      per_page: 10,
    } as Required<CountryFilters>,
  }),

  getters: {
    hasData: (state) => state.countries.length > 0,

    currentPage: (state) => state.pagination?.current_page ?? 1,
    lastPage: (state) => state.pagination?.last_page ?? 1,
    totalItems: (state) => state.pagination?.total ?? 0,

    totalCountries: (state) => {
      return state.stats?.total_countries ?? state.pagination?.total ?? 0;
    },
  },

  actions: {
    normalizeFilters(filters: CountryFilters = {}) {
      return {
        search: filters.search || "",
        page: filters.page || 1,
        per_page: filters.per_page || 10,
      };
    },

    applyResponse(response: CountryListResponse | any) {
      const data = response?.data || {};

      this.countries = Array.isArray(data.countries) ? data.countries : [];

      this.pagination = {
        ...defaultPagination(),
        ...(data.pagination || {}),
      };

      this.stats = {
        ...defaultStats(),
        ...(data.stats || {}),
        total_countries:
          data.stats?.total_countries ??
          data.pagination?.total ??
          this.countries.length ??
          0,
      };
    },

    async fetchCountries(
      filters: CountryFilters = {},
      options: {
        force?: boolean;
        silent?: boolean;
      } = {}
    ) {
      const { getCountries } = useCountry();
      const { cachedRequest } = useCachedRequest();

      const normalizedFilters = this.normalizeFilters(filters);

      this.lastFilters = normalizedFilters;
      this.errorMessage = "";

      if (this.hasData || options.silent) {
        this.refreshing = true;
      } else {
        this.loading = true;
      }

      try {
        await cachedRequest<CountryListResponse>({
          module: "countries",
          filters: normalizedFilters,
          ttl: 1000 * 60 * 10,
          force: options.force,
          request: () => getCountries(normalizedFilters),
          onCached: (response) => this.applyResponse(response),
          onFresh: (response) => this.applyResponse(response),
        });
      } catch (error: any) {
        this.errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to load countries";
      } finally {
        this.loading = false;
        this.refreshing = false;
      }
    },

    async refreshCountries() {
      await this.fetchCountries(this.lastFilters, {
        force: true,
        silent: true,
      });
    },

    clearCache() {
      const appCache = useAppCacheStore();

      appCache.forgetByPrefix("countries:");
    },

    async invalidateAndRefresh() {
      this.clearCache();

      await this.fetchCountries(this.lastFilters, {
        force: true,
        silent: true,
      });
    },

    resetState() {
      this.countries = [];
      this.pagination = defaultPagination();
      this.stats = defaultStats();
      this.loading = false;
      this.refreshing = false;
      this.errorMessage = "";
      this.lastFilters = {
        search: "",
        page: 1,
        per_page: 10,
      };
    },
  },
});
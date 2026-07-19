import { defineStore } from "pinia";
import type {
  AuditLogItem,
  AuditLogPagination,
} from "~/composables/useAuditLog";

export interface AuditLogFilters {
  search?: string;
  module?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

interface AuditLogListResponse {
  status: string;
  message: string;
  data: {
    logs: AuditLogItem[];
    pagination: AuditLogPagination;
  };
}

const defaultPagination = (): AuditLogPagination => ({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
});

export const useAuditLogManagementStore = defineStore("system-audit-log", {
  state: () => ({
    logs: [] as AuditLogItem[],
    pagination: defaultPagination(),

    loading: false,
    refreshing: false,
    errorMessage: "",

    lastFilters: {
      search: "",
      module: "",
      action: "",
      date_from: "",
      date_to: "",
      page: 1,
      per_page: 10,
    } as Required<AuditLogFilters>,
  }),

  getters: {
    hasData: (state) => state.logs.length > 0,

    currentPage: (state) => state.pagination?.current_page ?? 1,
    lastPage: (state) => state.pagination?.last_page ?? 1,
    totalItems: (state) => state.pagination?.total ?? 0,
  },

  actions: {
    normalizeFilters(filters: AuditLogFilters = {}) {
      return {
        search: filters.search || "",
        module: filters.module || "",
        action: filters.action || "",
        date_from: filters.date_from || "",
        date_to: filters.date_to || "",
        page: filters.page || 1,
        per_page: filters.per_page || 10,
      };
    },

    applyResponse(response: AuditLogListResponse | any) {
      const data = response?.data || {};

      this.logs = Array.isArray(data.logs) ? data.logs : [];

      this.pagination = {
        ...defaultPagination(),
        ...(data.pagination || {}),
      };
    },

    async fetchLogs(
      filters: AuditLogFilters = {},
      options: {
        force?: boolean;
        silent?: boolean;
      } = {}
    ) {
      const { getAuditLogs } = useAuditLog();
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
        await cachedRequest<AuditLogListResponse>({
          module: "audit-logs",
          filters: normalizedFilters,
          ttl: 1000 * 60 * 2,
          force: options.force,
          request: () => getAuditLogs(normalizedFilters),
          onCached: (response) => this.applyResponse(response),
          onFresh: (response) => this.applyResponse(response),
        });
      } catch (error: any) {
        this.errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to load audit logs";
      } finally {
        this.loading = false;
        this.refreshing = false;
      }
    },

    async refreshLogs() {
      await this.fetchLogs(this.lastFilters, {
        force: true,
        silent: true,
      });
    },

    clearCache() {
      const appCache = useAppCacheStore();
      appCache.forgetByPrefix("audit-logs:");
    },

    async invalidateAndRefresh() {
      this.clearCache();

      await this.fetchLogs(this.lastFilters, {
        force: true,
        silent: true,
      });
    },

    resetState() {
      this.logs = [];
      this.pagination = defaultPagination();
      this.loading = false;
      this.refreshing = false;
      this.errorMessage = "";
      this.lastFilters = {
        search: "",
        module: "",
        action: "",
        date_from: "",
        date_to: "",
        page: 1,
        per_page: 10,
      };
    },
  },
});
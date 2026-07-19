import { defineStore } from "pinia";
import type {
  UserItem,
  UserPagination,
  UserStats,
} from "~/composables/useUser";

export interface UserFilters {
  search?: string;
  status?: string;
  email_verified?: string;
  role?: string;
  page?: number;
  per_page?: number;
}

interface UserListResponse {
  status: string;
  message: string;
  data: {
    users: UserItem[];
    pagination: UserPagination;
    stats: UserStats;
  };
}

const defaultPagination = (): UserPagination => ({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
});

const defaultStats = (): UserStats => ({
  total_users: 0,
  active_users: 0,
  pending_users: 0,
  inactive_users: 0,
  verified_users: 0,
  unverified_users: 0,
});

export const useUserManagementStore = defineStore("management-user", {
  state: () => ({
    users: [] as UserItem[],
    pagination: defaultPagination(),
    stats: defaultStats(),

    loading: false,
    refreshing: false,
    errorMessage: "",

    lastFilters: {
      search: "",
      status: "",
      email_verified: "",
      role: "",
      page: 1,
      per_page: 10,
    } as Required<UserFilters>,
  }),

  getters: {
    hasData: (state) => state.users.length > 0,

    currentPage: (state) => state.pagination?.current_page ?? 1,
    lastPage: (state) => state.pagination?.last_page ?? 1,
    totalItems: (state) => state.pagination?.total ?? 0,

    totalUsers: (state) => state.stats?.total_users ?? 0,
    activeUsers: (state) => state.stats?.active_users ?? 0,
    pendingUsers: (state) => state.stats?.pending_users ?? 0,
    inactiveUsers: (state) => state.stats?.inactive_users ?? 0,
    verifiedUsers: (state) => state.stats?.verified_users ?? 0,
    unverifiedUsers: (state) => state.stats?.unverified_users ?? 0,
  },

  actions: {
    normalizeFilters(filters: UserFilters = {}) {
      return {
        search: filters.search || "",
        status: filters.status || "",
        email_verified: filters.email_verified || "",
        role: filters.role || "",
        page: filters.page || 1,
        per_page: filters.per_page || 10,
      };
    },

    applyResponse(response: UserListResponse | any) {
      const data = response?.data || {};

      this.users = Array.isArray(data.users) ? data.users : [];

      this.pagination = {
        ...defaultPagination(),
        ...(data.pagination || {}),
      };

      this.stats = {
        ...defaultStats(),
        ...(data.stats || {}),
      };
    },

    async fetchUsers(
      filters: UserFilters = {},
      options: {
        force?: boolean;
        silent?: boolean;
      } = {}
    ) {
      const { getUsers } = useUser();
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
        await cachedRequest<UserListResponse>({
          module: "users",
          filters: normalizedFilters,
          ttl: 1000 * 60 * 5,
          force: options.force,
          request: () => getUsers(normalizedFilters),
          onCached: (response) => this.applyResponse(response),
          onFresh: (response) => this.applyResponse(response),
        });
      } catch (error: any) {
        this.errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to load users";
      } finally {
        this.loading = false;
        this.refreshing = false;
      }
    },

    async refreshUsers() {
      await this.fetchUsers(this.lastFilters, {
        force: true,
        silent: true,
      });
    },

    clearCache() {
      const appCache = useAppCacheStore();
      appCache.forgetByPrefix("users:");
    },

    async invalidateAndRefresh() {
      this.clearCache();

      await this.fetchUsers(this.lastFilters, {
        force: true,
        silent: true,
      });
    },

    resetState() {
      this.users = [];
      this.pagination = defaultPagination();
      this.stats = defaultStats();
      this.loading = false;
      this.refreshing = false;
      this.errorMessage = "";
      this.lastFilters = {
        search: "",
        status: "",
        email_verified: "",
        role: "",
        page: 1,
        per_page: 10,
      };
    },
  },
});
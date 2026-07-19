import { defineStore } from "pinia";
import type {
  DashboardStats,
  DashboardRecentUser,
  DashboardRecentAuditLog,
  DashboardRoleDistribution,
  DashboardSystem,
} from "~/composables/useDashboard";

const defaultStats = (): DashboardStats & { total_products?: number } => ({
  total_users: 0,
  active_users: 0,
  pending_users: 0,
  inactive_users: 0,
  total_roles: 0,
  total_permissions: 0,
  total_audit_logs: 0,
  total_products: 0,
});

const defaultSystem = (): DashboardSystem => ({
  status: "Unknown",
  environment: "-",
  timezone: "-",
});

export const useDashboardManagementStore = defineStore("dashboard-management", {
  state: () => ({
    stats: defaultStats(),
    recentUsers: [] as DashboardRecentUser[],
    recentAuditLogs: [] as DashboardRecentAuditLog[],
    roleDistribution: [] as DashboardRoleDistribution[],
    system: defaultSystem(),

    loading: false,
    refreshing: false,
    errorMessage: "",
  }),

  getters: {
    totalUsers: (state) => state.stats?.total_users ?? 0,
    activeUsers: (state) => state.stats?.active_users ?? 0,
    pendingUsers: (state) => state.stats?.pending_users ?? 0,
    inactiveUsers: (state) => state.stats?.inactive_users ?? 0,
    totalRoles: (state) => state.stats?.total_roles ?? 0,
    totalPermissions: (state) => state.stats?.total_permissions ?? 0,
    totalAuditLogs: (state) => state.stats?.total_audit_logs ?? 0,
    totalProducts: (state) => state.stats?.total_products ?? 0,
  },

  actions: {
    applyResponse(response: any) {
      const data = response?.data || {};

      this.stats = {
        ...defaultStats(),
        ...(data.stats || {}),
      };

      this.recentUsers = Array.isArray(data.recent_users)
        ? data.recent_users
        : [];

      this.recentAuditLogs = Array.isArray(data.recent_audit_logs)
        ? data.recent_audit_logs
        : [];

      this.roleDistribution = Array.isArray(data.role_distribution)
        ? data.role_distribution
        : [];

      this.system = {
        ...defaultSystem(),
        ...(data.system || {}),
      };
    },

    async fetchDashboard(
      options: {
        force?: boolean;
        silent?: boolean;
      } = {}
    ) {
      const { getDashboardSummary } = useDashboard();
      const { cachedRequest } = useCachedRequest();

      this.errorMessage = "";

      if (options.silent) {
        this.refreshing = true;
      } else {
        this.loading = true;
      }

      try {
        await cachedRequest({
          module: "dashboard",
          filters: {
            summary: "main",
          },
          ttl: 1000 * 60,
          force: options.force,
          request: () => getDashboardSummary(),
          onCached: (response) => this.applyResponse(response),
          onFresh: (response) => this.applyResponse(response),
        });
      } catch (error: any) {
        this.errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to load dashboard";
      } finally {
        this.loading = false;
        this.refreshing = false;
      }
    },

    async refreshDashboard() {
      await this.fetchDashboard({
        force: true,
        silent: true,
      });
    },

    clearCache() {
      const appCache = useAppCacheStore();
      appCache.forgetByPrefix("dashboard:");
    },

    async invalidateAndRefresh() {
      this.clearCache();

      await this.fetchDashboard({
        force: true,
        silent: true,
      });
    },

    resetState() {
      this.stats = defaultStats();
      this.recentUsers = [];
      this.recentAuditLogs = [];
      this.roleDistribution = [];
      this.system = defaultSystem();
      this.loading = false;
      this.refreshing = false;
      this.errorMessage = "";
    },
  },
});
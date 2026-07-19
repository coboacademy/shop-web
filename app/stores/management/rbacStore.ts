import { defineStore } from "pinia";
import type {
  RbacStats,
  RbacRoleOverview,
  PermissionModuleOverview,
} from "~/composables/useRbac";

const defaultStats = (): RbacStats => ({
  total_users: 0,
  active_users: 0,
  inactive_users: 0,
  pending_users: 0,
  total_roles: 0,
  total_permissions: 0,
});

interface RbacDashboardResponse {
  status: string;
  message: string;
  data: {
    stats: RbacStats;
    roles: RbacRoleOverview[];
    permission_modules: PermissionModuleOverview[];
  };
}

export const useRbacManagementStore = defineStore("management-rbac", {
  state: () => ({
    stats: defaultStats(),
    roles: [] as RbacRoleOverview[],
    permissionModules: [] as PermissionModuleOverview[],

    loading: false,
    refreshing: false,
    errorMessage: "",
  }),

  getters: {
    totalUsers: (state) => state.stats?.total_users ?? 0,
    activeUsers: (state) => state.stats?.active_users ?? 0,
    inactiveUsers: (state) => state.stats?.inactive_users ?? 0,
    pendingUsers: (state) => state.stats?.pending_users ?? 0,
    totalRoles: (state) => state.stats?.total_roles ?? 0,
    totalPermissions: (state) => state.stats?.total_permissions ?? 0,

    topRoles: (state) => {
      const roles = Array.isArray(state.roles) ? state.roles : [];

      return [...roles]
        .sort((a, b) => (b.permissions_count || 0) - (a.permissions_count || 0))
        .slice(0, 5);
    },

    totalAssignedPermissions: (state) => {
      const roles = Array.isArray(state.roles) ? state.roles : [];

      return roles.reduce((total, role) => {
        return total + (role.permissions_count || 0);
      }, 0);
    },
  },

  actions: {
    applyResponse(response: RbacDashboardResponse | any) {
      const data = response?.data || {};

      this.stats = {
        ...defaultStats(),
        ...(data.stats || {}),
      };

      this.roles = Array.isArray(data.roles) ? data.roles : [];

      this.permissionModules = Array.isArray(data.permission_modules)
        ? data.permission_modules
        : [];
    },

    async fetchRbacDashboard(
      options: {
        force?: boolean;
        silent?: boolean;
      } = {}
    ) {
      const { getRbacDashboard } = useRbac();
      const { cachedRequest } = useCachedRequest();

      this.errorMessage = "";

      if (this.roles.length > 0 || options.silent) {
        this.refreshing = true;
      } else {
        this.loading = true;
      }

      try {
        await cachedRequest<RbacDashboardResponse>({
          module: "rbac",
          filters: {
            dashboard: "summary",
          },
          ttl: 1000 * 60 * 5,
          force: options.force,
          request: () => getRbacDashboard(),
          onCached: (response) => this.applyResponse(response),
          onFresh: (response) => this.applyResponse(response),
        });
      } catch (error: any) {
        this.errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to load RBAC dashboard";
      } finally {
        this.loading = false;
        this.refreshing = false;
      }
    },

    async refreshRbacDashboard() {
      await this.fetchRbacDashboard({
        force: true,
        silent: true,
      });
    },

    clearCache() {
      const appCache = useAppCacheStore();
      appCache.forgetByPrefix("rbac:");
    },

    async invalidateAndRefresh() {
      this.clearCache();

      await this.fetchRbacDashboard({
        force: true,
        silent: true,
      });
    },

    resetState() {
      this.stats = defaultStats();
      this.roles = [];
      this.permissionModules = [];
      this.loading = false;
      this.refreshing = false;
      this.errorMessage = "";
    },
  },
});
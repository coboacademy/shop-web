import { defineStore } from "pinia";
import type { MenuItem } from "~/composables/useMenu";

interface MenuListResponse {
  status: string;
  message: string;
  data: {
    menus: MenuItem[];
  };
}

export const useSystemMenuStore = defineStore("system-menu", {
  state: () => ({
    menus: [] as MenuItem[],
    myMenus: [] as MenuItem[],

    loading: false,
    refreshing: false,
    errorMessage: "",
  }),

  getters: {
    hasMenus: (state) => state.menus.length > 0,
    hasMyMenus: (state) => state.myMenus.length > 0,
  },

  actions: {
    applyMenusResponse(response: MenuListResponse | any) {
      const data = response?.data || {};

      this.menus = Array.isArray(data.menus) ? data.menus : [];
    },

    applyMyMenusResponse(response: MenuListResponse | any) {
      const data = response?.data || {};

      this.myMenus = Array.isArray(data.menus) ? data.menus : [];
    },

    async fetchMenus(
      options: {
        force?: boolean;
        silent?: boolean;
      } = {}
    ) {
      const { getMenus } = useMenu();
      const { cachedRequest } = useCachedRequest();

      this.errorMessage = "";

      if (this.hasMenus || options.silent) {
        this.refreshing = true;
      } else {
        this.loading = true;
      }

      try {
        await cachedRequest<MenuListResponse>({
          module: "menus",
          filters: {
            type: "admin",
          },
          ttl: 1000 * 60 * 10,
          force: options.force,
          request: () => getMenus(),
          onCached: (response) => this.applyMenusResponse(response),
          onFresh: (response) => this.applyMenusResponse(response),
        });
      } catch (error: any) {
        this.errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to load menus";
      } finally {
        this.loading = false;
        this.refreshing = false;
      }
    },

    async fetchMyMenus(
      options: {
        force?: boolean;
        silent?: boolean;
      } = {}
    ) {
      const { getMyMenus } = useMenu();
      const { cachedRequest } = useCachedRequest();

      this.errorMessage = "";

      if (this.hasMyMenus || options.silent) {
        this.refreshing = true;
      } else {
        this.loading = true;
      }

      try {
        await cachedRequest<MenuListResponse>({
          module: "my-menus",
          filters: {
            type: "sidebar",
          },
          ttl: 1000 * 60 * 10,
          force: options.force,
          request: () => getMyMenus(),
          onCached: (response) => this.applyMyMenusResponse(response),
          onFresh: (response) => this.applyMyMenusResponse(response),
        });
      } catch (error: any) {
        this.errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to load sidebar menus";
      } finally {
        this.loading = false;
        this.refreshing = false;
      }
    },

    clearMenusCache() {
      const appCache = useAppCacheStore();

      appCache.forgetByPrefix("menus:");
      appCache.forgetByPrefix("my-menus:");
    },

    async invalidateAndRefreshMenus() {
      this.clearMenusCache();

      await Promise.allSettled([
        this.fetchMenus({
          force: true,
          silent: true,
        }),
        this.fetchMyMenus({
          force: true,
          silent: true,
        }),
      ]);
    },

    resetState() {
      this.menus = [];
      this.myMenus = [];
      this.loading = false;
      this.refreshing = false;
      this.errorMessage = "";
    },
  },
});
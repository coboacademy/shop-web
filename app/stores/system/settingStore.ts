import { defineStore } from "pinia";

export interface SettingItem {
  key: string;
  value: any;
}

interface SettingsResponse {
  status: string;
  message: string;
  data: {
    settings: SettingItem[];
  };
}

export const useSettingManagementStore = defineStore("system-setting", {
  state: () => ({
    settings: [] as SettingItem[],

    loading: false,
    refreshing: false,
    errorMessage: "",
  }),

  getters: {
    hasData: (state) => state.settings.length > 0,

    settingsMap: (state) => {
      return Object.fromEntries(
        (state.settings || []).map((item) => [item.key, item.value])
      ) as Record<string, any>;
    },
  },

  actions: {
    applyResponse(response: SettingsResponse | any) {
      const data = response?.data || {};

      this.settings = Array.isArray(data.settings) ? data.settings : [];
    },

    async fetchSettings(
      options: {
        force?: boolean;
        silent?: boolean;
      } = {}
    ) {
      const { getSettings } = useSettings();
      const { cachedRequest } = useCachedRequest();

      this.errorMessage = "";

      if (this.hasData || options.silent) {
        this.refreshing = true;
      } else {
        this.loading = true;
      }

      try {
        await cachedRequest<SettingsResponse>({
          module: "settings",
          filters: {
            type: "global",
          },
          ttl: 1000 * 60 * 15,
          force: options.force,
          request: () => getSettings(),
          onCached: (response) => this.applyResponse(response),
          onFresh: (response) => this.applyResponse(response),
        });
      } catch (error: any) {
        this.errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to load settings";
      } finally {
        this.loading = false;
        this.refreshing = false;
      }
    },

    clearCache() {
      const appCache = useAppCacheStore();

      appCache.forgetByPrefix("settings:");
    },

    async invalidateAndRefresh() {
      this.clearCache();

      await this.fetchSettings({
        force: true,
        silent: true,
      });
    },

    resetState() {
      this.settings = [];
      this.loading = false;
      this.refreshing = false;
      this.errorMessage = "";
    },
  },
});
import { defineStore } from "pinia";
import type { MenuItem } from "~/composables/useMenu";
import { useSystemMenuStore } from "~/stores/system/menuStore";

export const useMenuStore = defineStore("menu", {
  state: () => ({
    menus: [] as MenuItem[],
    loading: false,
    initialized: false,
  }),

  getters: {
    hasMenus: (state) => state.menus.length > 0,
  },

  actions: {
    async fetchMenus(options: { force?: boolean; silent?: boolean } = {}) {
      if (this.loading) return;

      const systemMenuStore = useSystemMenuStore();

      this.loading = true;

      try {
        await systemMenuStore.fetchMyMenus({
          force: options.force,
          silent: options.silent ?? this.initialized,
        });

        this.menus = Array.isArray(systemMenuStore.myMenus)
          ? systemMenuStore.myMenus
          : [];

        this.initialized = true;
      } finally {
        this.loading = false;
      }
    },

    async refreshMenus() {
      await this.fetchMenus({
        force: true,
        silent: true,
      });
    },

    clearMenus() {
      this.menus = [];
      this.initialized = false;
    },
  },
});
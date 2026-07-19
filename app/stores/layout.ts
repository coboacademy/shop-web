import { defineStore } from 'pinia'

export const useLayoutStore = defineStore('layout', {
  state: () => ({
    sidebarCollapsed: false,
  }),

  actions: {
    toggleSidebarCollapsed() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },

    setSidebarCollapsed(value: boolean) {
      this.sidebarCollapsed = value
    },
  },
})
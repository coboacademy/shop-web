import { defineStore } from 'pinia'

export const useLoadingStore = defineStore('loading', {
  state: () => ({
    routeLoading: false,
    progress: 0,
    timer: null as ReturnType<typeof setInterval> | null,
  }),

  actions: {
    start() {
      this.routeLoading = true
      this.progress = 10

      if (this.timer) {
        clearInterval(this.timer)
      }

      this.timer = setInterval(() => {
        if (this.progress < 90) {
          this.progress += Math.random() * 10
        }
      }, 200)
    },

    finish() {
      this.progress = 100

      setTimeout(() => {
        this.routeLoading = false
        this.progress = 0

        if (this.timer) {
          clearInterval(this.timer)
          this.timer = null
        }
      }, 250)
    },

    fail() {
      this.progress = 100

      setTimeout(() => {
        this.routeLoading = false
        this.progress = 0

        if (this.timer) {
          clearInterval(this.timer)
          this.timer = null
        }
      }, 350)
    },
  },
})
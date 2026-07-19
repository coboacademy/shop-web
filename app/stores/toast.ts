import { defineStore } from 'pinia'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: number
  type: ToastType
  title: string
  message?: string
  timeout?: number
}

export const useToastStore = defineStore('toast', {
  state: () => ({
    items: [] as ToastItem[],
  }),

  actions: {
    add(toast: Omit<ToastItem, 'id'>) {
      const id = Date.now() + Math.floor(Math.random() * 1000)

      const item: ToastItem = {
        id,
        timeout: 3000,
        ...toast,
      }

      this.items.push(item)

      if (item.timeout && item.timeout > 0) {
        setTimeout(() => {
          this.remove(id)
        }, item.timeout)
      }
    },

    remove(id: number) {
      this.items = this.items.filter((item) => item.id !== id)
    },

    success(title: string, message?: string) {
      this.add({
        type: 'success',
        title,
        message,
      })
    },

    error(title: string, message?: string) {
      this.add({
        type: 'error',
        title,
        message,
        timeout: 5000,
      })
    },

    info(title: string, message?: string) {
      this.add({
        type: 'info',
        title,
        message,
      })
    },

    warning(title: string, message?: string) {
      this.add({
        type: 'warning',
        title,
        message,
        timeout: 4000,
      })
    },
  },
})
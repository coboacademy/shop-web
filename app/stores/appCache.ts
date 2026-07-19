import { defineStore } from 'pinia'
import type { CacheEntry } from '~/utils/cache'

const MAX_CACHE_ITEMS = 80

export const useAppCacheStore = defineStore('app-cache', {
  state: () => ({
    cache: {} as Record<string, CacheEntry<any>>,
  }),

  getters: {
    size: (state) => Object.keys(state.cache).length,
  },

  actions: {
    get<T>(key: string): CacheEntry<T> | null {
      return this.cache[key] || null
    },

    set<T>(key: string, data: T) {
      this.cache[key] = {
        data,
        savedAt: Date.now(),
      }

      this.prune()
    },

    forget(key: string) {
      delete this.cache[key]
    },

    forgetByPrefix(prefix: string) {
      Object.keys(this.cache).forEach((key) => {
        if (key.startsWith(prefix)) {
          delete this.cache[key]
        }
      })
    },

    clearAll() {
      this.cache = {}
    },

    prune() {
      const keys = Object.keys(this.cache)

      if (keys.length <= MAX_CACHE_ITEMS) return

      const sortedKeys = keys.sort((a, b) => {
        return this.cache[a].savedAt - this.cache[b].savedAt
      })

      const removeCount = keys.length - MAX_CACHE_ITEMS

      sortedKeys.slice(0, removeCount).forEach((key) => {
        delete this.cache[key]
      })
    },
  },
})
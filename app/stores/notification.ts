import { defineStore } from 'pinia'
import type {
  NotificationItem,
  NotificationPagination,
} from '~/composables/useNotification'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [] as NotificationItem[],
    unreadCount: 0,
    pagination: null as NotificationPagination | null,
    loading: false,
    actionLoading: false,
    initialized: false,
    error: '',
  }),

  getters: {
    hasUnread: (state) => state.unreadCount > 0,
    hasNotifications: (state) => state.notifications.length > 0,
  },

  actions: {
    async fetchNotifications(force = false) {
      if (this.loading) return

      if (this.initialized && !force) return

      this.loading = true
      this.error = ''

      try {
        const { getNotifications } = useNotification()

        const response = await getNotifications({
          page: 1,
          per_page: 10,
        })

        this.notifications = response.data.notifications || []
        this.unreadCount = response.data.unread_count || 0
        this.pagination = response.data.pagination || null
        this.initialized = true
      } catch (error: any) {
        this.error = error.message || 'Failed to load notifications'
      } finally {
        this.loading = false
      }
    },

    async refreshNotifications() {
      await this.fetchNotifications(true)
    },

    async markAsRead(id: number) {
      this.actionLoading = true

      try {
        const { markNotificationAsRead } = useNotification()
        const response = await markNotificationAsRead(id)

        const updatedNotification = response.data.notification

        if (updatedNotification) {
          this.notifications = this.notifications.map((item) =>
            item.id === updatedNotification.id ? updatedNotification : item
          )
        } else {
          this.notifications = this.notifications.map((item) =>
            item.id === id ? { ...item, read: true } : item
          )
        }

        this.unreadCount = response.data.unread_count || 0
      } finally {
        this.actionLoading = false
      }
    },

    async markAllAsRead() {
      if (!this.notifications.length) return

      this.actionLoading = true

      try {
        const { markAllNotificationsAsRead } = useNotification()
        const response = await markAllNotificationsAsRead()

        this.notifications = this.notifications.map((item) => ({
          ...item,
          read: true,
          read_at: item.read_at || new Date().toISOString(),
        }))

        this.unreadCount = response.data.unread_count || 0
      } finally {
        this.actionLoading = false
      }
    },

    async clearAll() {
      if (!this.notifications.length) return

      this.actionLoading = true

      try {
        const { clearNotifications } = useNotification()
        const response = await clearNotifications()

        this.notifications = []
        this.unreadCount = response.data.unread_count || 0
        this.pagination = null
      } finally {
        this.actionLoading = false
      }
    },

    clearLocal() {
      this.notifications = []
      this.unreadCount = 0
      this.pagination = null
      this.loading = false
      this.actionLoading = false
      this.initialized = false
      this.error = ''
    },
  },
})
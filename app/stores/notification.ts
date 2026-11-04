import { defineStore } from "pinia";
import type {
  NotificationItem,
  NotificationPagination,
} from "~/composables/useNotification";

const emptyPagination = (): NotificationPagination => ({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
});

export const useNotificationStore = defineStore("notification", {
  state: () => ({
    notifications: [] as NotificationItem[],
    unreadCount: 0,
    pagination: emptyPagination(),
    notificationUserId: null as number | null,
    requestSequence: 0,
    actionSequence: 0,
    loading: false,
    actionLoading: false,
    initialized: false,
    error: "",
  }),

  getters: {
    hasUnread: (state) => state.unreadCount > 0,
    hasNotifications: (state) => state.notifications.length > 0,
  },

  actions: {
    resetForUser(userId: number | null) {
      this.requestSequence += 1;
      this.actionSequence += 1;
      this.notifications = [];
      this.unreadCount = 0;
      this.pagination = emptyPagination();
      this.notificationUserId = userId;
      this.loading = false;
      this.actionLoading = false;
      this.initialized = false;
      this.error = "";
    },

    syncFromPageData(
      notifications: NotificationItem[],
      pagination: NotificationPagination,
      unreadCount: number,
      userId: number,
    ) {
      const authStore = useAuthStore();
      if (authStore.user?.id !== userId) return;

      if (this.notificationUserId !== userId) this.resetForUser(userId);
      this.notifications = notifications;
      this.pagination = pagination;
      this.unreadCount = unreadCount;
      this.initialized = true;
      this.error = "";
    },

    setUnreadCount(unreadCount: number, userId: number) {
      const authStore = useAuthStore();
      if (authStore.user?.id !== userId) return;

      if (this.notificationUserId !== userId) this.resetForUser(userId);
      this.unreadCount = unreadCount;
    },

    async fetchNotifications(force = false) {
      const authStore = useAuthStore();
      const currentUserId = authStore.user?.id ?? null;

      if (this.notificationUserId !== currentUserId) {
        this.resetForUser(currentUserId);
      }

      if (this.loading || (this.initialized && !force)) return;

      const requestSequence = ++this.requestSequence;
      this.loading = true;
      this.error = "";

      try {
        const { getNotifications } = useNotification();
        const response = await getNotifications({ page: 1, per_page: 10 });

        if (
          this.requestSequence === requestSequence &&
          authStore.user?.id === currentUserId
        ) {
          this.notifications = response.data.notifications;
          this.unreadCount = response.data.unread_count;
          this.pagination = response.data.pagination;
          this.initialized = true;
        }
      } catch (error: unknown) {
        if (
          this.requestSequence === requestSequence &&
          authStore.user?.id === currentUserId
        ) {
          this.error =
            error instanceof Error ? error.message : "Failed to load notifications";
        }
      } finally {
        if (this.requestSequence === requestSequence) this.loading = false;
      }
    },

    async refreshNotifications() {
      await this.fetchNotifications(true);
    },

    async markAsRead(id: number) {
      if (this.actionLoading) throw new Error("A notification action is already running.");

      const authStore = useAuthStore();
      const currentUserId = authStore.user?.id ?? null;
      const actionSequence = ++this.actionSequence;
      this.actionLoading = true;

      try {
        const { markNotificationAsRead } = useNotification();
        const response = await markNotificationAsRead(id);

        if (
          this.actionSequence === actionSequence &&
          authStore.user?.id === currentUserId
        ) {
          this.notifications = this.notifications.map((item) =>
            item.id === response.data.notification.id
              ? response.data.notification
              : item,
          );
          this.unreadCount = response.data.unread_count;
        }

        return response;
      } finally {
        if (this.actionSequence === actionSequence) this.actionLoading = false;
      }
    },

    async markAllAsRead() {
      if (this.actionLoading) throw new Error("A notification action is already running.");

      const authStore = useAuthStore();
      const currentUserId = authStore.user?.id ?? null;
      const actionSequence = ++this.actionSequence;
      this.actionLoading = true;

      try {
        const { markAllNotificationsAsRead } = useNotification();
        const response = await markAllNotificationsAsRead();

        if (
          this.actionSequence === actionSequence &&
          authStore.user?.id === currentUserId
        ) {
          this.notifications = this.notifications.map((item) => ({
            ...item,
            read: true,
          }));
          this.unreadCount = response.data.unread_count;
        }

        return response;
      } finally {
        if (this.actionSequence === actionSequence) this.actionLoading = false;
      }
    },

    async clearAll() {
      if (this.actionLoading) throw new Error("A notification action is already running.");

      const authStore = useAuthStore();
      const currentUserId = authStore.user?.id ?? null;
      const actionSequence = ++this.actionSequence;
      this.actionLoading = true;

      try {
        const { clearNotifications } = useNotification();
        const response = await clearNotifications();

        if (
          this.actionSequence === actionSequence &&
          authStore.user?.id === currentUserId
        ) {
          this.notifications = [];
          this.unreadCount = response.data.unread_count;
          this.pagination = emptyPagination();
        }

        return response;
      } finally {
        if (this.actionSequence === actionSequence) this.actionLoading = false;
      }
    },

    clearLocal() {
      this.resetForUser(null);
    },
  },
});

import { defineStore } from "pinia";
import type {
  NotificationItem,
  NotificationListResponse,
  NotificationPagination,
} from "~/composables/useNotification";

export interface NotificationFilters {
  page?: number;
  per_page?: number;
  read?: "all" | "read" | "unread";
}

const defaultPagination = (): NotificationPagination => ({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
});

export const useNotificationPageStore = defineStore("system-notification-page", {
  state: () => ({
    notifications: [] as NotificationItem[],
    pagination: defaultPagination(),
    unreadCount: 0,
    notificationUserId: null as number | null,
    requestSequence: 0,

    loading: false,
    refreshing: false,
    errorMessage: "",

    lastFilters: {
      page: 1,
      per_page: 10,
      read: "all",
    } as Required<NotificationFilters>,
  }),

  getters: {
    hasData: (state) => state.notifications.length > 0,

    currentPage: (state) => state.pagination.current_page,
    lastPage: (state) => state.pagination.last_page,
    totalItems: (state) => state.pagination.total,

    shownItems: (state) => state.notifications.length,
  },

  actions: {
    normalizeFilters(filters: NotificationFilters = {}) {
      return {
        page: filters.page || 1,
        per_page: filters.per_page || 10,
        read: filters.read || "all",
      };
    },

    applyResponse(response: NotificationListResponse) {
      this.notifications = response.data.notifications;
      this.pagination = response.data.pagination;
      this.unreadCount = response.data.unread_count;
    },

    async fetchNotifications(
      filters: NotificationFilters = {},
      options: {
        silent?: boolean;
      } = {},
    ): Promise<boolean> {
      const { getNotifications } = useNotification();
      const authStore = useAuthStore();
      const normalizedFilters = this.normalizeFilters(filters);
      const currentUserId = authStore.user?.id ?? null;

      if (this.notificationUserId !== currentUserId) {
        this.requestSequence += 1;
        this.notifications = [];
        this.pagination = defaultPagination();
        this.unreadCount = 0;
        this.notificationUserId = currentUserId;
      }

      this.lastFilters = normalizedFilters;
      this.errorMessage = "";
      const requestSequence = ++this.requestSequence;

      if (this.hasData || options.silent) {
        this.refreshing = true;
      } else {
        this.loading = true;
      }

      try {
        const response = await getNotifications({
          page: normalizedFilters.page,
          per_page: normalizedFilters.per_page,
          ...(normalizedFilters.read === "all"
            ? {}
            : { read: normalizedFilters.read }),
        });

        if (
          this.requestSequence === requestSequence &&
          authStore.user?.id === currentUserId
        ) {
          this.applyResponse(response);
          return true;
        }
        return false;
      } catch (error: unknown) {
        if (
          this.requestSequence === requestSequence &&
          authStore.user?.id === currentUserId
        ) {
          this.errorMessage =
            error instanceof Error ? error.message : "Failed to load notifications";
        }
        return false;
      } finally {
        if (this.requestSequence === requestSequence) {
          this.loading = false;
          this.refreshing = false;
        }
      }
    },

    clearLocalNotifications() {
      this.requestSequence += 1;
      this.notifications = [];
      this.pagination = defaultPagination();
      this.unreadCount = 0;
      this.loading = false;
      this.refreshing = false;
      this.errorMessage = "";
    },

    resetState() {
      this.requestSequence += 1;
      this.notifications = [];
      this.pagination = defaultPagination();
      this.unreadCount = 0;
      this.notificationUserId = null;
      this.loading = false;
      this.refreshing = false;
      this.errorMessage = "";
      this.lastFilters = {
        page: 1,
        per_page: 10,
        read: "all",
      };
    },
  },
});

import { defineStore } from "pinia";
import type {
  NotificationItem,
  NotificationPagination,
} from "~/composables/useNotification";

export interface NotificationFilters {
  page?: number;
  per_page?: number;
  read?: "all" | "read" | "unread";
}

interface NotificationListResponse {
  status: string;
  message: string;
  data: {
    notifications: NotificationItem[];
    pagination: NotificationPagination;
    unread_count: number;
  };
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

    currentPage: (state) => state.pagination?.current_page ?? 1,
    lastPage: (state) => state.pagination?.last_page ?? 1,
    totalItems: (state) => state.pagination?.total ?? 0,

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

    applyResponse(response: NotificationListResponse | any) {
      const data = response?.data || {};

      this.notifications = Array.isArray(data.notifications)
        ? data.notifications
        : [];

      this.pagination = {
        ...defaultPagination(),
        ...(data.pagination || {}),
      };

      this.unreadCount = data.unread_count ?? 0;
    },

    async fetchNotifications(
      filters: NotificationFilters = {},
      options: {
        force?: boolean;
        silent?: boolean;
      } = {}
    ) {
      const { getNotifications } = useNotification();
      const { cachedRequest } = useCachedRequest();

      const normalizedFilters = this.normalizeFilters(filters);

      this.lastFilters = normalizedFilters;
      this.errorMessage = "";

      if (this.hasData || options.silent) {
        this.refreshing = true;
      } else {
        this.loading = true;
      }

      try {
        await cachedRequest<NotificationListResponse>({
          module: "notifications",
          filters: normalizedFilters,
          ttl: 1000 * 30,
          force: options.force,
          request: () => getNotifications(normalizedFilters),
          onCached: (response) => this.applyResponse(response),
          onFresh: (response) => this.applyResponse(response),
        });
      } catch (error: any) {
        this.errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to load notifications";
      } finally {
        this.loading = false;
        this.refreshing = false;
      }
    },

    async refreshNotifications() {
      await this.fetchNotifications(this.lastFilters, {
        force: true,
        silent: true,
      });
    },

    clearCache() {
      const appCache = useAppCacheStore();

      appCache.forgetByPrefix("notifications:");
    },

    async invalidateAndRefresh() {
      this.clearCache();

      await this.fetchNotifications(this.lastFilters, {
        force: true,
        silent: true,
      });
    },

    markLocalAsRead(notificationId: number) {
      this.notifications = this.notifications.map((item) => {
        if (item.id !== notificationId) return item;

        return {
          ...item,
          read: true,
          read_at: item.read_at || new Date().toISOString(),
        };
      });

      this.unreadCount = Math.max(this.unreadCount - 1, 0);
    },

    markAllLocalAsRead() {
      this.notifications = this.notifications.map((item) => ({
        ...item,
        read: true,
        read_at: item.read_at || new Date().toISOString(),
      }));

      this.unreadCount = 0;
    },

    clearLocalNotifications() {
      this.notifications = [];
      this.pagination = defaultPagination();
      this.unreadCount = 0;
    },

    resetState() {
      this.notifications = [];
      this.pagination = defaultPagination();
      this.unreadCount = 0;
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
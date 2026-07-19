<script setup lang="ts">
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Info,
  Loader2,
  RefreshCcw,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-vue-next";
import type { NotificationItem, NotificationType } from "~/composables/useNotification";

const notificationStore = useNotificationStore();
const toast = useToast();

const open = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const iconMap = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: AlertCircle,
};

const notifications = computed<NotificationItem[]>(() => {
  return Array.isArray(notificationStore.notifications)
    ? notificationStore.notifications
    : [];
});

const notificationCount = computed(() => notifications.value.length);

const unreadCount = computed(() => {
  return Number(notificationStore.unreadCount || 0);
});

const loading = computed(() => Boolean(notificationStore.loading));
const actionLoading = computed(() => Boolean(notificationStore.actionLoading));

const errorMessage = computed(() => {
  return notificationStore.error || notificationStore.errorMessage || "";
});

const typeVariant = (type: NotificationType) => {
  const variants = {
    info: "info",
    success: "success",
    warning: "warning",
    error: "danger",
  } as const;

  return variants[type] || "default";
};

const close = () => {
  open.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  if (!open.value) return;

  const target = event.target as Node | null;

  if (dropdownRef.value && target && !dropdownRef.value.contains(target)) {
    close();
  }
};

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    close();
  }
};

const safeRefreshNotifications = async () => {
  if (typeof notificationStore.refreshNotifications === "function") {
    await notificationStore.refreshNotifications();
    return;
  }

  if (typeof notificationStore.fetchNotifications === "function") {
    await notificationStore.fetchNotifications();
  }
};

const toggleDropdown = async () => {
  open.value = !open.value;

  if (open.value) {
    await safeRefreshNotifications();
  }
};

const handleRefresh = async () => {
  try {
    await safeRefreshNotifications();
  } catch (error: any) {
    toast.error(
      "Failed to refresh notifications",
      error.response?.data?.message || error.message || "Please try again."
    );
  }
};

const handleNotificationClick = async (notification: NotificationItem) => {
  try {
    if (!notification.read && typeof notificationStore.markAsRead === "function") {
      await notificationStore.markAsRead(notification.id);
    }

    if (notification.action_url) {
      close();
      await navigateTo(notification.action_url);
    }
  } catch (error: any) {
    toast.error(
      "Action failed",
      error.response?.data?.message || error.message || "Failed to open notification."
    );
  }
};

const handleMarkAllAsRead = async () => {
  try {
    if (typeof notificationStore.markAllAsRead !== "function") return;

    await notificationStore.markAllAsRead();
  } catch (error: any) {
    toast.error(
      "Action failed",
      error.response?.data?.message ||
        error.message ||
        "Failed to mark notifications as read."
    );
  }
};

const handleClearAll = async () => {
  try {
    if (typeof notificationStore.clearAll !== "function") return;

    await notificationStore.clearAll();
  } catch (error: any) {
    toast.error(
      "Action failed",
      error.response?.data?.message || error.message || "Failed to clear notifications."
    );
  }
};

onMounted(async () => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleEscape);

  try {
    if (!notificationStore.initialized) {
      await safeRefreshNotifications();
    }
  } catch {
    // Do not crash the app header if notifications fail.
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleEscape);
});
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <button
      type="button"
      class="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-card-foreground shadow-sm transition transform hover:scale-105 hover:bg-muted"
      aria-label="Open notifications"
      @click="toggleDropdown"
    >
      <Bell class="h-5 w-5" />

      <span
        v-if="unreadCount > 0"
        class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white ring-2 ring-background"
      >
        {{ unreadCount > 99 ? "99+" : unreadCount }}
      </span>
    </button>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="open"
        class="origin-top-right absolute right-0 z-50 mt-2 w-[360px] overflow-hidden rounded-2xl border border-border bg-white text-slate-950 shadow-2xl ring-1 ring-black/10 dark:bg-slate-950 dark:text-slate-50 dark:ring-white/10 sm:w-96"
      >
        <div class="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h3 class="text-sm font-bold text-popover-foreground">Notifications</h3>

            <p class="mt-1 text-xs text-muted-foreground">
              {{ unreadCount }} unread notification(s)
            </p>
          </div>

          <div class="flex items-center gap-1">
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-card-foreground disabled:opacity-50"
              :disabled="loading"
              aria-label="Refresh notifications"
              @click="handleRefresh"
            >
              <RefreshCcw class="h-4 w-4" :class="loading ? 'animate-spin' : ''" />
            </button>

            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-card-foreground"
              aria-label="Close notifications"
              @click="close"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
        </div>

        <div v-if="loading && notificationCount === 0" class="space-y-2 p-2">
          <div v-for="i in 4" :key="i" class="flex gap-3 rounded-xl px-3 py-3">
            <div class="h-10 w-10 animate-pulse rounded-xl bg-muted" />

            <div class="flex-1 space-y-2">
              <div class="h-4 w-32 animate-pulse rounded bg-muted" />
              <div class="h-3 w-full animate-pulse rounded bg-muted" />
              <div class="h-3 w-20 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>

        <div v-else-if="errorMessage" class="px-4 py-5">
          <AlertMessage
            type="error"
            title="Failed to load notifications"
            :message="errorMessage"
          />

          <AppButton class="mt-4 w-full" variant="secondary" @click="handleRefresh">
            <RefreshCcw class="mr-2 h-4 w-4" />
            Try Again
          </AppButton>
        </div>

        <div v-else-if="notificationCount > 0" class="max-h-[420px] overflow-y-auto p-2">
          <button
            v-for="notification in notifications"
            :key="notification.id"
            type="button"
            class="group flex w-full gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-150 hover:bg-sky-600/20 dark:hover:bg-sky-500/20 group-focus:bg-sky-600/20"
            :class="!notification.read ? 'bg-muted/60' : ''"
            @click="handleNotificationClick(notification)"
          >
            <AppBadge :variant="typeVariant(notification.type)" shape="square" size="md">
              <component :is="iconMap[notification.type]" class="h-4 w-4" />
            </AppBadge>

            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-3">
                <p
                  class="relative line-clamp-1 text-sm font-semibold text-card-foreground group-hover:text-accent-foreground"
                >
                  {{ notification.title }}

                  <template
                    v-if="
                      notification.data?.profession || notification.data?.user?.profession
                    "
                  >
                    <span
                      class="absolute left-full top-1/2 ml-3 -translate-y-1/2 hidden whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium shadow transition-opacity duration-150 opacity-0 group-hover:opacity-100 group-hover:block group-focus:opacity-100 group-focus:block bg-sky-600/90 text-white dark:bg-sky-500/90"
                    >
                      {{
                        notification.data?.profession ||
                        notification.data?.user?.profession
                      }}
                    </span>
                  </template>
                </p>

                <span
                  v-if="!notification.read"
                  class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-600 dark:bg-sky-400"
                />
              </div>

              <p
                class="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground group-hover:text-accent-foreground/80"
              >
                {{ notification.message }}
              </p>

              <div class="mt-2 flex items-center justify-between gap-3">
                <p
                  class="text-xs text-muted-foreground group-hover:text-accent-foreground/70"
                >
                  {{ notification.created_at }}
                </p>

                <span
                  v-if="notification.action_url"
                  class="text-xs font-semibold text-sky-600 dark:text-sky-400"
                >
                  Open
                </span>
              </div>
            </div>
          </button>
        </div>

        <div v-else class="px-6 py-12 text-center">
          <Bell class="mx-auto h-10 w-10 text-muted-foreground/50" />

          <p class="mt-4 text-sm font-semibold text-card-foreground">No notifications</p>

          <p class="mt-1 text-sm text-muted-foreground">You are all caught up.</p>
        </div>

        <div
          v-if="notificationCount > 0"
          class="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-3"
        >
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-sky-600 transition hover:bg-sky-50 hover:text-sky-700 disabled:opacity-50 dark:text-sky-400 dark:hover:bg-sky-950/40 dark:hover:text-sky-300"
            :disabled="actionLoading || unreadCount === 0"
            @click="handleMarkAllAsRead"
          >
            <Loader2 v-if="actionLoading" class="h-3.5 w-3.5 animate-spin" />
            Mark all as read
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
            :disabled="actionLoading"
            @click="handleClearAll"
          >
            <Trash2 class="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<!-- Transition classes applied on the component; no scoped CSS needed -->

<script setup lang="ts">
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Eye,
  Info,
  RefreshCcw,
  Trash2,
  TriangleAlert,
} from "lucide-vue-next";
import type { NotificationItem, NotificationType } from "~/composables/useNotification";
import { useNotificationPageStore } from "~/stores/system/notificationPageStore";

definePageMeta({
  layout: "admin",
  middleware: ["auth"],
  title: "Notifications",
});

const {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
} = useNotification();

const notificationPageStore = useNotificationPageStore();
const headerNotificationStore = useNotificationStore();
const toast = useToast();

const page = ref(1);
const perPage = ref(10);
const readFilter = ref<"all" | "read" | "unread">("all");

const actionLoading = ref(false);
const clearConfirmOpen = ref(false);
const pageErrorMessage = ref("");

const notifications = computed(() => {
  return Array.isArray(notificationPageStore.notifications)
    ? notificationPageStore.notifications
    : [];
});

const notificationCount = computed(() => notifications.value.length);

const currentPage = computed(() => notificationPageStore.currentPage);
const lastPage = computed(() => notificationPageStore.lastPage);
const totalItems = computed(() => notificationPageStore.totalItems);

const loading = computed(() => notificationPageStore.loading);
const refreshing = computed(() => notificationPageStore.refreshing);
const errorMessage = computed(
  () => notificationPageStore.errorMessage || pageErrorMessage.value
);

const unreadCount = computed(() => {
  return headerNotificationStore.unreadCount ?? notificationPageStore.unreadCount ?? 0;
});

const stats = computed(() => {
  return {
    total: totalItems.value,
    unread: unreadCount.value,
    shown: notificationCount.value,
  };
});

const iconMap = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: AlertCircle,
};

const typeVariant = (type: NotificationType) => {
  const variants = {
    info: "info",
    success: "success",
    warning: "warning",
    error: "danger",
  } as const;

  return variants[type];
};

const fetchNotifications = async (
  options: {
    force?: boolean;
    silent?: boolean;
  } = {}
) => {
  pageErrorMessage.value = "";

  await notificationPageStore.fetchNotifications(
    {
      page: page.value,
      per_page: perPage.value,
      read: readFilter.value,
    },
    options
  );

  headerNotificationStore.unreadCount = notificationPageStore.unreadCount;

  if (notificationPageStore.errorMessage) {
    toast.error("Failed to load notifications", notificationPageStore.errorMessage);
  }
};

const handleRefresh = async () => {
  await fetchNotifications({
    force: true,
    silent: true,
  });

  await headerNotificationStore.refreshNotifications();
};

const handleOpenNotification = async (notification: NotificationItem) => {
  try {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);

      notificationPageStore.markLocalAsRead(notification.id);
      notificationPageStore.clearCache();

      await headerNotificationStore.refreshNotifications();
    }

    if (notification.action_url) {
      await navigateTo(notification.action_url);
    }
  } catch (error: any) {
    toast.error(
      "Action failed",
      error.response?.data?.message || error.message || "Failed to open notification"
    );
  }
};

const handleMarkAllAsRead = async () => {
  actionLoading.value = true;

  try {
    const response = await markAllNotificationsAsRead();

    notificationPageStore.markAllLocalAsRead();
    notificationPageStore.clearCache();

    headerNotificationStore.unreadCount = response.data?.unread_count || 0;
    await headerNotificationStore.refreshNotifications();

    toast.success("Notifications updated", "All notifications were marked as read.");
  } catch (error: any) {
    toast.error(
      "Action failed",
      error.response?.data?.message || error.message || "Failed to mark all as read"
    );
  } finally {
    actionLoading.value = false;
  }
};

const openClearConfirm = () => {
  clearConfirmOpen.value = true;
};

const closeClearConfirm = () => {
  if (actionLoading.value) return;

  clearConfirmOpen.value = false;
};

const handleClearAll = async () => {
  actionLoading.value = true;

  try {
    const response = await clearNotifications();

    page.value = 1;

    notificationPageStore.clearLocalNotifications();
    notificationPageStore.clearCache();

    headerNotificationStore.unreadCount = response.data?.unread_count || 0;
    await headerNotificationStore.refreshNotifications();

    toast.success("Notifications cleared", "All notifications were removed.");

    closeClearConfirm();
  } catch (error: any) {
    toast.error(
      "Action failed",
      error.response?.data?.message || error.message || "Failed to clear notifications"
    );
  } finally {
    actionLoading.value = false;
  }
};

const goPrevious = async () => {
  if (page.value <= 1) return;

  page.value--;
  await fetchNotifications();
};

const goNext = async () => {
  if (page.value >= lastPage.value) return;

  page.value++;
  await fetchNotifications();
};

const goToPage = async (targetPage: number) => {
  if (targetPage < 1) return;
  if (targetPage > lastPage.value) return;

  page.value = targetPage;
  await fetchNotifications();
};

watch(readFilter, async () => {
  page.value = 1;
  await fetchNotifications();
});

onMounted(async () => {
  await fetchNotifications({
    silent: notificationPageStore.hasData,
  });
});
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Notifications"
      subtitle="View system updates, admin actions, account events, and security messages."
    >
      <template #actions>
        <AppButton variant="secondary" :loading="refreshing" @click="handleRefresh">
          <RefreshCcw class="h-4 w-4" />
          Refresh
        </AppButton>

        <AppButton
          variant="secondary"
          :loading="actionLoading"
          :disabled="unreadCount === 0"
          @click="handleMarkAllAsRead"
        >
          <Eye class="h-4 w-4" />
          Mark All Read
        </AppButton>

        <AppButton
          variant="danger"
          :loading="actionLoading"
          :disabled="notificationCount === 0"
          @click="openClearConfirm"
        >
          <Trash2 class="h-4 w-4" />
          Clear
        </AppButton>
      </template>
    </PageHeader>

    <AlertMessage
      v-if="errorMessage"
      type="error"
      title="Unable to load notifications"
      :message="errorMessage"
    />

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatsCard
        title="Total Notifications"
        :value="stats.total"
        subtitle="All notification history"
        tone="info"
      >
        <template #badge>
          <AppBadge variant="info" shape="square" size="md">
            <Bell class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard
        title="Unread"
        :value="stats.unread"
        subtitle="Need your attention"
        tone="warning"
      >
        <template #badge>
          <AppBadge variant="warning" shape="square" size="md">
            <TriangleAlert class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard
        title="Showing"
        :value="stats.shown"
        subtitle="Current page items"
        tone="success"
      >
        <template #badge>
          <AppBadge variant="success" shape="square" size="md">
            <CheckCircle2 class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>
    </div>

    <FilterBar
      title="Filters"
      subtitle="Filter notification history by read status."
      columns="2"
    >
      <AppSelect
        v-model="readFilter"
        label="Read Status"
        placeholder="All"
        :options="[
          { label: 'All', value: 'all' },
          { label: 'Unread', value: 'unread' },
          { label: 'Read', value: 'read' },
        ]"
      />
    </FilterBar>

    <div v-if="loading && notificationCount === 0" class="space-y-3">
      <div
        v-for="i in 5"
        :key="i"
        class="rounded-3xl border border-border bg-card p-5 shadow-sm"
      >
        <div class="flex gap-4">
          <div class="h-12 w-12 animate-pulse rounded-2xl bg-muted" />

          <div class="flex-1 space-y-3">
            <div class="h-4 w-48 animate-pulse rounded bg-muted" />
            <div class="h-3 w-full animate-pulse rounded bg-muted" />
            <div class="h-3 w-28 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="notificationCount > 0" class="space-y-3">
      <button
        v-for="notification in notifications"
        :key="notification.id"
        type="button"
        class="w-full rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors duration-150 hover:bg-sky-600/20 focus:bg-sky-600/20 focus:outline-none focus:ring-2 focus:ring-sky-200"
        :class="!notification.read ? 'border-l-4 border-sky-600' : ''"
        @click="handleOpenNotification(notification)"
      >
        <div class="flex gap-3">
          <AppBadge :variant="typeVariant(notification.type)" shape="square" size="md">
            <component :is="iconMap[notification.type]" class="h-5 w-5" />
          </AppBadge>

          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="truncate text-sm font-semibold text-card-foreground">
                    {{ notification.title }}
                  </h3>

                  <AppBadge
                    v-if="!notification.read"
                    variant="info"
                    class="px-2 py-0.5 text-xs"
                    >New</AppBadge
                  >
                </div>

                <p class="mt-1 text-sm text-muted-foreground truncate">
                  {{ notification.message }}
                </p>
              </div>

              <div class="shrink-0 text-right">
                <div class="text-xs font-medium text-muted-foreground">
                  {{ notification.created_at }}
                </div>
                <div v-if="notification.action_url" class="mt-2">
                  <span class="text-sm font-semibold text-sky-600 dark:text-sky-400"
                    >Open →</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>

    <EmptyState
      v-else
      title="No notifications found"
      message="There are no notifications for the selected filter."
    >
      <template #icon>
        <Bell class="h-6 w-6" />
      </template>
      <div class="mt-4">
        <AppButton variant="secondary" @click="handleRefresh">Refresh</AppButton>
      </div>
    </EmptyState>

    <TablePagination
      v-if="totalItems > 0"
      :current-page="currentPage"
      :last-page="lastPage"
      :total="totalItems"
      :per-page="perPage"
      :loading="loading && notificationCount === 0"
      @previous="goPrevious"
      @next="goNext"
      @page="goToPage"
      label="notifications"
    />

    <ConfirmDialog
      :open="clearConfirmOpen"
      title="Clear Notifications"
      message="Are you sure you want to clear all notifications? This action cannot be undone."
      confirm-label="Clear All"
      variant="danger"
      :loading="actionLoading"
      @close="closeClearConfirm"
      @confirm="handleClearAll"
    />

    <AppRefreshingIndicator :show="refreshing" />
  </div>
</template>

<script setup lang="ts">
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Info,
  RefreshCw,
  Trash2,
  TriangleAlert,
} from "lucide-vue-next";
import {
  type NotificationItem,
  type NotificationType,
  useNotification,
} from "~/composables/useNotification";
import { useNotificationPageStore } from "~/stores/system/notificationPageStore";

definePageMeta({
  layout: "user",
  middleware: ["auth", "permission"],
  permission: "account.view",
  title: "Notifications",
});

const {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
} = useNotification();
const pageStore = useNotificationPageStore();
const headerStore = useNotificationStore();
const toast = useToast();

const page = ref(1);
const readFilter = ref<"all" | "read" | "unread">("all");
const actionLoading = ref(false);
const clearing = ref(false);
const clearConfirmOpen = ref(false);

const notifications = computed(() => pageStore.notifications);
const loading = computed(() => pageStore.loading);
const refreshing = computed(() => pageStore.refreshing);
const errorMessage = computed(() => pageStore.errorMessage);
const unreadCount = computed(() => headerStore.unreadCount ?? pageStore.unreadCount);

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
  return variants[type] || "default";
};

const errorMessageOf = (error: unknown, fallback: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return fallback;
};

const refreshHeader = async () => {
  await headerStore.refreshNotifications();
};

const fetchNotifications = async (force = false) => {
  await pageStore.fetchNotifications(
    {
      page: page.value,
      per_page: 10,
      read: readFilter.value,
    },
    { force, silent: pageStore.hasData },
  );
  headerStore.unreadCount = pageStore.unreadCount;
};

const handleRefresh = async () => {
  await fetchNotifications(true);
  await refreshHeader();
};

const safeActionUrl = (actionUrl: string | null | undefined) => {
  if (!actionUrl || !actionUrl.startsWith("/") || actionUrl.startsWith("//")) {
    return null;
  }
  return actionUrl;
};

const handleOpenNotification = async (notification: NotificationItem) => {
  try {
    if (!notification.read) {
      const response = await markNotificationAsRead(notification.id);
      pageStore.clearCache();
      headerStore.unreadCount = response.data.unread_count ?? 0;
      await fetchNotifications(true);
      await refreshHeader();
    }

    const actionUrl = safeActionUrl(notification.action_url);
    if (actionUrl) await navigateTo(actionUrl);
  } catch (error: unknown) {
    toast.error(
      "Could not open notification",
      errorMessageOf(error, "Please try again."),
    );
  }
};

const handleMarkAllAsRead = async () => {
  if (actionLoading.value || unreadCount.value === 0) return;
  actionLoading.value = true;
  try {
    const response = await markAllNotificationsAsRead();
    pageStore.clearCache();
    headerStore.unreadCount = response.data.unread_count ?? 0;
    await fetchNotifications(true);
    await refreshHeader();
    toast.success("Notifications updated", "All notifications were marked as read.");
  } catch (error: unknown) {
    toast.error(
      "Could not update notifications",
      errorMessageOf(error, "Please try again."),
    );
  } finally {
    actionLoading.value = false;
  }
};

const closeClearConfirm = () => {
  if (!clearing.value) clearConfirmOpen.value = false;
};

const handleClearAll = async () => {
  if (clearing.value) return;
  clearing.value = true;
  try {
    const response = await clearNotifications();
    page.value = 1;
    pageStore.clearLocalNotifications();
    pageStore.clearCache();
    headerStore.unreadCount = response.data.unread_count ?? 0;
    await refreshHeader();
    clearConfirmOpen.value = false;
    toast.success("Notifications cleared", "All notifications were removed.");
  } catch (error: unknown) {
    toast.error(
      "Could not clear notifications",
      errorMessageOf(error, "Please try again."),
    );
  } finally {
    clearing.value = false;
  }
};

const goToPage = async (targetPage: number) => {
  if (loading.value || targetPage < 1 || targetPage > pageStore.lastPage) return;
  page.value = targetPage;
  await fetchNotifications();
};

watch(readFilter, async () => {
  page.value = 1;
  await fetchNotifications();
});

onMounted(() => fetchNotifications());
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Notifications"
      subtitle="Stay up to date with account activity and important updates."
    >
      <template #actions>
        <AppButton
          variant="secondary"
          :loading="refreshing"
          :disabled="loading"
          @click="handleRefresh"
        >
          <RefreshCw class="h-4 w-4" />
          Refresh
        </AppButton>
        <AppButton
          variant="secondary"
          :loading="actionLoading"
          :disabled="unreadCount === 0 || actionLoading"
          @click="handleMarkAllAsRead"
        >
          <CheckCircle2 class="h-4 w-4" />
          Mark all read
        </AppButton>
        <AppButton
          variant="danger"
          :disabled="clearing"
          @click="clearConfirmOpen = true"
        >
          <Trash2 class="h-4 w-4" />
          Clear all
        </AppButton>
      </template>
    </PageHeader>

    <AlertMessage
      v-if="errorMessage"
      type="error"
      title="Unable to load notifications"
      :message="errorMessage"
    >
      <AppButton variant="secondary" size="sm" @click="handleRefresh">
        Try again
      </AppButton>
    </AlertMessage>

    <div class="grid gap-4 sm:grid-cols-3">
      <StatsCard
        title="Matching notifications"
        :value="pageStore.totalItems"
        subtitle="Across all pages for this filter"
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
        :value="unreadCount"
        subtitle="Across all notifications"
        tone="warning"
      >
        <template #badge>
          <AppBadge variant="warning" shape="square" size="md">
            <TriangleAlert class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>
      <StatsCard
        title="On this page"
        :value="notifications.length"
        subtitle="10 per page"
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
      title="Filter notifications"
      subtitle="Choose which read states to show."
      columns="2"
    >
      <AppSelect
        v-model="readFilter"
        label="Read status"
        placeholder="All notifications"
        :options="[
          { label: 'All notifications', value: 'all' },
          { label: 'Unread', value: 'unread' },
          { label: 'Read', value: 'read' },
        ]"
      />
    </FilterBar>

    <div v-if="loading && !notifications.length" class="space-y-3">
      <div
        v-for="index in 5"
        :key="index"
        class="h-28 animate-pulse rounded-2xl bg-muted"
      />
    </div>

    <section v-else-if="notifications.length" class="space-y-3" aria-label="Notifications">
      <article
        v-for="notification in notifications"
        :key="notification.id"
        class="flex items-start gap-4 rounded-2xl border bg-card p-4 transition hover:border-primary/30 hover:bg-muted/20 sm:p-5"
        :class="notification.read ? 'border-border' : 'border-primary/30 bg-primary/[0.03]'"
      >
        <AppBadge :variant="typeVariant(notification.type)" shape="square" size="md">
          <component :is="iconMap[notification.type]" class="h-5 w-5" />
        </AppBadge>
        <div class="min-w-0 flex-1">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="font-semibold text-card-foreground">
                  {{ notification.title }}
                </h2>
                <AppBadge v-if="!notification.read" variant="info">Unread</AppBadge>
              </div>
              <p class="mt-1 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {{ notification.message }}
              </p>
            </div>
            <time
              v-if="notification.created_at"
              class="shrink-0 text-xs text-muted-foreground sm:text-right"
              :datetime="notification.created_at_raw || undefined"
            >
              {{ notification.created_at }}
            </time>
          </div>
          <div class="mt-4 flex flex-wrap items-center gap-3">
            <button
              v-if="safeActionUrl(notification.action_url)"
              type="button"
              class="text-sm font-semibold text-primary underline-offset-4 hover:underline"
              @click="handleOpenNotification(notification)"
            >
              {{ notification.read ? "Open" : "Mark read and open" }}
            </button>
            <button
              v-else-if="!notification.read"
              type="button"
              class="text-sm font-semibold text-primary underline-offset-4 hover:underline"
              @click="handleOpenNotification(notification)"
            >
              Mark as read
            </button>
            <span v-if="notification.read_at" class="text-xs text-muted-foreground">
              Read {{ notification.read_at }}
            </span>
          </div>
        </div>
      </article>
    </section>

    <EmptyState
      v-else-if="!loading && !errorMessage"
      title="No notifications found"
      message="There are no notifications for the selected read status."
    >
      <template #icon>
        <Bell class="h-6 w-6" />
      </template>
    </EmptyState>

    <TablePagination
      v-if="pageStore.totalItems > 0"
      :current-page="pageStore.currentPage"
      :last-page="pageStore.lastPage"
      :total="pageStore.totalItems"
      :per-page="pageStore.pagination.per_page"
      :loading="loading"
      label="notifications"
      @previous="goToPage(pageStore.currentPage - 1)"
      @next="goToPage(pageStore.currentPage + 1)"
      @page="goToPage"
    />

    <ConfirmDialog
      :open="clearConfirmOpen"
      title="Clear all notifications?"
      message="This permanently deletes all your read and unread notifications. This action cannot be undone."
      confirm-label="Clear notifications"
      variant="danger"
      :loading="clearing"
      @close="closeClearConfirm"
      @confirm="handleClearAll"
    />
  </div>
</template>

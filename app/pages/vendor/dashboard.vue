<script setup lang="ts">
import {
  ArrowUpRight,
  Boxes,
  PackagePlus,
  RefreshCw,
  ShoppingCart,
  ShieldCheck,
  Store as StoreIcon,
  Users,
} from "lucide-vue-next";
import type {
  VendorDashboardOrder,
  VendorDashboardSummaryResponse,
  VendorProfile,
} from "~/composables/useVendor";

definePageMeta({
  layout: "vendor",
  middleware: ["auth", "permission"],
  permission: "vendor.view",
  title: "Vendor Dashboard",
});

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const { getProfile, getDashboardSummary } = useVendor();

const user = computed(() => authStore.user);
const vendor = ref<VendorProfile | null>(null);
const vendorProfileLoaded = ref(false);
const vendorProfileError = ref("");
const loadingOverview = ref(true);
const overviewLoaded = ref(false);
const refreshing = ref(false);
const loadingSummary = ref(true);
const dashboardSummary = ref<VendorDashboardSummaryResponse["data"] | null>(null);
const summaryError = ref("");
const recentOrders = computed(() => dashboardSummary.value?.recent_orders ?? []);

const vendorStatus = computed(() => String(vendor.value?.status ?? "").trim().toLowerCase());

const latestRejectedReason = computed(() => {
  if (vendorStatus.value !== "rejected") return "";

  const rejectedNotification = [...notificationStore.notifications].find((item) => {
    const status = String(item.data?.status ?? "").trim().toLowerCase();
    const title = item.title.toLowerCase();
    const message = item.message.toLowerCase();

    return status === "rejected" || title.includes("rejected") || message.includes("rejected");
  });

  if (!rejectedNotification) return "";

  const reason = rejectedNotification.data?.reason;
  return typeof reason === "string" && reason.trim() ? reason.trim() : "";
});

const kycAlert = computed(() => {
  if (!vendor.value) {
    return {
      type: "warning" as const,
      title: "Complete your business verification",
      message:
        "Submit your business information and required documents to begin the verification process.",
      actionLabel: "Submit KYC",
      actionTo: "/vendor/kyc",
    };
  }

  if (vendorStatus.value === "pending") {
    return {
      type: "info" as const,
      title: "Your application is being reviewed",
      message:
        "Your KYC information has been submitted successfully. Please wait while our administration team reviews your application. We will notify you when the review is complete.",
    };
  }

  if (vendorStatus.value === "rejected") {
    const reason = latestRejectedReason.value;
    return {
      type: "warning" as const,
      title: "Your application needs attention",
      message: reason
        ? `Your KYC application was rejected. Please review the rejection reason, update your information, and submit it again. Rejection reason: ${reason}`
        : "Your KYC application was rejected. Please review the rejection reason, update your information, and submit it again.",
      actionLabel: "Review and Resubmit",
      actionTo: "/vendor/kyc",
    };
  }

  if (vendorStatus.value === "approved") {
    return {
      type: "success" as const,
      title: "Your vendor account is verified!",
      message:
        "Your KYC application has been approved. You can now continue using the vendor features available to your account.",
    };
  }

  if (vendorStatus.value === "suspended") {
    return {
      type: "warning" as const,
      title: "Your vendor account is suspended",
      message:
        "Your vendor account has been suspended. Please review your notifications for more information or instructions from the platform.",
    };
  }

  return null;
});

const quickActions = [
  { title: "Create product", to: "/vendor/products/create", icon: PackagePlus, tone: "info" },
  { title: "View products", to: "/vendor/products", icon: StoreIcon, tone: "info" },
  { title: "Manage inventory", to: "/vendor/inventories", icon: Boxes, tone: "warning" },
  { title: "View orders", to: "/vendor/orders", icon: ShoppingCart, tone: "success" },
  { title: "Manage stores", to: "/vendor/stores", icon: StoreIcon, tone: "info" },
  { title: "Vendor profile", to: "/vendor/profile", icon: Users, tone: "warning" },
] as const;

const summaryMetrics = computed(() => {
  const summary = dashboardSummary.value?.summary;

  return [
    {
      title: "Total orders",
      value: summary?.orders.total ?? null,
      subtitle: "All vendor orders",
      icon: ShoppingCart,
      tone: "info" as const,
      variant: "info" as const,
    },
    {
      title: "Pending orders",
      value: summary?.orders.pending ?? null,
      subtitle: "Awaiting confirmation",
      icon: ShoppingCart,
      tone: "warning" as const,
      variant: "warning" as const,
    },
    {
      title: "Confirmed orders",
      value: summary?.orders.confirmed ?? null,
      subtitle: "Confirmed by your store",
      icon: ShoppingCart,
      tone: "info" as const,
      variant: "info" as const,
    },
    {
      title: "Processing orders",
      value: summary?.orders.processing ?? null,
      subtitle: "Currently processing",
      icon: ShoppingCart,
      tone: "info" as const,
      variant: "info" as const,
    },
    {
      title: "Delivered orders",
      value: summary?.orders.delivered ?? null,
      subtitle: "Successfully delivered",
      icon: ShoppingCart,
      tone: "success" as const,
      variant: "success" as const,
    },
    {
      title: "Cancelled orders",
      value: summary?.orders.cancelled ?? null,
      subtitle: "Cancelled orders",
      icon: ShoppingCart,
      tone: "danger" as const,
      variant: "danger" as const,
    },
    {
      title: "Total products",
      value: summary?.products.total ?? null,
      subtitle: "Across all your stores",
      icon: Boxes,
      tone: "success" as const,
      variant: "success" as const,
    },
    {
      title: "Stores",
      value: summary?.stores.total ?? null,
      subtitle: "All vendor stores",
      icon: StoreIcon,
      tone: "default" as const,
      variant: "default" as const,
    },
    {
      title: "Active stores",
      value: summary?.stores.active ?? null,
      subtitle: "Currently active",
      icon: ShieldCheck,
      tone: "warning" as const,
      variant: "warning" as const,
    },
  ] as const;
});

const fetchVendorProfile = async () => {
  vendorProfileLoaded.value = false;
  vendor.value = null;
  vendorProfileError.value = "";

  try {
    const response = await getProfile();
    vendor.value = response.data.vendor;

    if (String(vendor.value.status ?? "").trim().toLowerCase() === "rejected") {
      await notificationStore.fetchNotifications();
    }
  } catch (error: any) {
    if (error.status === 404) {
      vendor.value = null;
    } else {
      vendorProfileError.value = error.message || "Could not load your vendor profile.";
    }
  } finally {
    vendorProfileLoaded.value = true;
  }
};

const refreshDashboard = async () => {
  if (refreshing.value) return;
  refreshing.value = true;
  loadingOverview.value = true;
  overviewLoaded.value = false;
  loadingSummary.value = true;
  dashboardSummary.value = null;
  summaryError.value = "";

  try {
    await fetchVendorProfile();

    if (vendor.value) {
      try {
        const response = await getDashboardSummary();
        dashboardSummary.value = response.data;
      } catch (error: any) {
        summaryError.value =
          error.message || "Could not load the vendor dashboard summary.";
      }
    }

    overviewLoaded.value = true;
  } finally {
    loadingOverview.value = false;
    loadingSummary.value = false;
    refreshing.value = false;
  }
};

onMounted(() => refreshDashboard());

const formatOrderAmount = (value: string) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "—";
};

const formatOrderDate = (value: string) => {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(timestamp)
    : value;
};

const displayStat = (value: number | null) => value ?? "—";

const orderStatusLabel = (status: VendorDashboardOrder["status"]) =>
  status.replaceAll("_", " ");

const statusVariant = (status: VendorDashboardOrder["status"]) => {
  if (status === "delivered") return "success";
  if (status === "cancelled") return "danger";
  if (status === "confirmed" || status === "processing") return "info";
  return "warning";
};
</script>

<template>
  <div class="space-y-6">
    <AlertMessage
      v-if="vendorProfileLoaded && !vendorProfileError && kycAlert"
      :type="kycAlert.type"
      :title="kycAlert.title"
      :message="kycAlert.message"
    >
      <div v-if="kycAlert.actionTo" class="flex flex-wrap gap-3">
        <NuxtLink
          :to="kycAlert.actionTo"
          class="inline-flex items-center rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-500"
        >
          {{ kycAlert.actionLabel }}
        </NuxtLink>
      </div>
    </AlertMessage>

    <AlertMessage
      v-if="vendorProfileError"
      type="error"
      title="Vendor profile unavailable"
      :message="vendorProfileError"
    />

    <PageHeader
      :title="`Welcome back, ${user?.name || 'Vendor'}`"
      subtitle="Track your products, orders, and store performance from one place."
    >
      <template #actions>
        <AppButton variant="secondary" :loading="refreshing" @click="refreshDashboard">
          <RefreshCw class="h-4 w-4" />
          Refresh
        </AppButton>
      </template>
    </PageHeader>

    <div
      v-if="loadingOverview && !overviewLoaded"
      class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Loading dashboard overview"
    >
      <div
        v-for="index in 9"
        :key="index"
        class="h-32 animate-pulse rounded-3xl border border-border bg-card"
      />
    </div>
    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        v-for="metric in summaryMetrics"
        :key="metric.title"
        :title="metric.title"
        :value="displayStat(metric.value)"
        :subtitle="metric.subtitle"
        :tone="metric.tone"
      >
        <template #badge>
          <AppBadge :variant="metric.variant" shape="square" size="md">
            <component :is="metric.icon" class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>
    </div>

    <div
      v-if="summaryError"
      class="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <span>{{ summaryError }}</span>
      <AppButton variant="secondary" :loading="refreshing" @click="refreshDashboard">
        Retry
      </AppButton>
    </div>

    <div
      v-if="dashboardSummary?.summary.products.total === 0"
      class="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p class="font-semibold text-card-foreground">
          {{
            dashboardSummary.summary.stores.total === 0
              ? "Create your first store"
              : "No products yet"
          }}
        </p>
        <p class="mt-1 text-sm text-muted-foreground">
          {{
            dashboardSummary.summary.stores.total === 0
              ? "Create a store before adding products to your catalog."
              : "Add a product to start building your catalog."
          }}
        </p>
      </div>
      <NuxtLink
        :to="
          dashboardSummary.summary.stores.total === 0
            ? '/vendor/stores'
            : '/vendor/products/create'
        "
        class="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
      >
        {{ dashboardSummary.summary.stores.total === 0 ? "Create store" : "Create product" }}
      </NuxtLink>
    </div>

    <div class="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
      <AppCard title="Recent orders" subtitle="Latest orders containing your products">
        <div v-if="loadingSummary" class="space-y-3">
          <div v-for="index in 3" :key="index" class="h-16 animate-pulse rounded-2xl bg-muted" />
        </div>
        <p
          v-else-if="summaryError || vendorProfileError"
          class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          role="status"
        >
          Recent orders are unavailable until the dashboard data loads successfully.
        </p>
        <div v-else-if="recentOrders.length" class="space-y-3">
          <div
            v-for="order in recentOrders"
            :key="order.id"
            class="flex flex-col gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <p class="font-semibold text-card-foreground">{{ order.order_number }}</p>
              <p class="mt-1 truncate text-sm text-muted-foreground">
                {{ formatOrderDate(order.created_at) }}
              </p>
              <ul
                v-if="order.items.length"
                class="mt-1 max-h-20 space-y-0.5 overflow-y-auto text-xs text-muted-foreground"
              >
                <li v-for="item in order.items" :key="item.id" class="truncate">
                  {{ item.quantity }} × {{ item.product_name }}
                  <span v-if="item.variant_name"> · {{ item.variant_name }}</span>
                </li>
              </ul>
            </div>

            <div class="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
              <div class="sm:text-right">
                <p class="font-semibold text-card-foreground">
                  {{ formatOrderAmount(order.vendor_item_subtotal) }}
                </p>
                <p class="text-xs text-muted-foreground">Vendor total</p>
              </div>
              <div class="flex flex-wrap gap-2 sm:justify-end">
                <AppBadge :variant="statusVariant(order.status)" size="sm">
                  {{ orderStatusLabel(order.status) }}
                </AppBadge>
                <AppBadge v-if="order.payment_status" variant="default" size="sm">
                  Payment: {{ order.payment_status.replaceAll("_", " ") }}
                </AppBadge>
              </div>
            </div>
          </div>
        </div>
        <EmptyState
          v-else-if="vendor"
          title="No orders yet"
          message="Orders containing your products will appear here."
        />
        <p v-else class="text-sm text-muted-foreground">
          Complete your vendor profile to view orders.
        </p>
        <template #footer>
          <NuxtLink
            to="/vendor/orders"
            class="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            View all orders
            <ArrowUpRight class="h-4 w-4" />
          </NuxtLink>
        </template>
      </AppCard>

      <AppCard title="Quick actions" subtitle="Common operations">
        <div class="space-y-3">
          <NuxtLink
            v-for="action in quickActions"
            :key="action.title"
            :to="action.to"
            class="flex items-center justify-between rounded-2xl border border-border bg-muted/40 px-4 py-3 transition hover:bg-muted/60"
          >
            <div class="flex items-center gap-3">
              <AppBadge :variant="action.tone" shape="square" size="sm">
                <component :is="action.icon" class="h-4 w-4" />
              </AppBadge>
              <span class="font-medium text-card-foreground">{{ action.title }}</span>
            </div>
            <ArrowUpRight class="h-4 w-4 text-muted-foreground" />
          </NuxtLink>
        </div>
      </AppCard>
    </div>
  </div>
</template>

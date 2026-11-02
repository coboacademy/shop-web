<script setup lang="ts">
import {
  ArrowUpRight,
  CreditCard,
  Clock3,
  ShoppingCart,
  ShieldCheck,
  Store,
  Truck,
  Users,
} from "lucide-vue-next";
import { useVendorOrder, type VendorOrder } from "~/composables/useVendorOrder";

definePageMeta({
  layout: "vendor",
  middleware: ["auth", "permission"],
  permission: "vendor.view",
  title: "Vendor Dashboard",
});

const authStore = useAuthStore();
const { getProfile } = useVendor();
const { getOrders } = useVendorOrder();
const user = computed(() => authStore.user);
const vendor = ref<any>(null);
const loadingVendor = ref(false);
const showKycWarning = computed(() => !vendor.value);
const latestPageOrders = ref<VendorOrder[]>([]);
const recentOrders = ref<VendorOrder[]>([]);
const orderTotal = ref(0);
const loadingOrders = ref(false);
const ordersError = ref("");
const orderStats = computed(() => ({
  pending: latestPageOrders.value.filter((order) => order.status === "pending").length,
  fulfilling: latestPageOrders.value.filter(
    (order) => order.status === "confirmed" || order.status === "processing",
  ).length,
}));

const quickActions = [
  { title: "Manage products", to: "/vendor/products", icon: Store, tone: "info" },
  { title: "Create a store", to: "/vendor/stores", icon: Store, tone: "info" },
  { title: "Orders center", to: "/vendor/orders", icon: CreditCard, tone: "success" },
  { title: "Manage KYC", to: "/vendor/profile", icon: ShieldCheck, tone: "warning" },
  { title: "Vendor profile", to: "/vendor/profile", icon: Users, tone: "warning" },
];

const fetchVendorProfile = async () => {
  loadingVendor.value = true;

  try {
    const response = await getProfile();
    vendor.value = response.data.vendor;
  } catch (error: any) {
    if (error.status === 404) {
      vendor.value = null;
    }
  } finally {
    loadingVendor.value = false;
  }
};

const fetchRecentOrders = async () => {
  loadingOrders.value = true;
  ordersError.value = "";

  try {
    const response = await getOrders(1);
    latestPageOrders.value = response.data.orders.data;
    recentOrders.value = latestPageOrders.value.slice(0, 3);
    orderTotal.value = response.data.orders.meta.total;
  } catch (error: any) {
    ordersError.value = error.message || "Could not load recent orders.";
  } finally {
    loadingOrders.value = false;
  }
};

onMounted(() => Promise.all([fetchVendorProfile(), fetchRecentOrders()]));

const formatOrderAmount = (value: string) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : value;
};

const statusVariant = (status: VendorOrder["status"]) => {
  if (status === "delivered") return "success";
  if (status === "cancelled") return "danger";
  if (status === "confirmed" || status === "processing") return "info";
  return "warning";
};
</script>

<template>
  <div class="space-y-6">
    <AlertMessage
      v-if="!loadingVendor && showKycWarning"
      type="warning"
      title="Submit your KYC"
      message="Your vendor profile is not complete yet. Complete your business details to submit KYC and unlock full vendor features."
    >
      <div class="flex flex-wrap gap-3">
        <NuxtLink
          to="/vendor/kyc"
          class="inline-flex items-center rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-500"
        >
          Submit KYC
        </NuxtLink>
      </div>
    </AlertMessage>

    <PageHeader
      :title="`Welcome back, ${user?.name || 'Vendor'}`"
      subtitle="Track your products, orders, and store performance from one place."
    >
      <template #actions>
        <AppButton variant="secondary">
          <ArrowUpRight class="h-4 w-4" />
          View storefront
        </AppButton>
      </template>
    </PageHeader>

    <div class="grid gap-4 sm:grid-cols-3">
      <StatsCard title="Total orders" :value="orderTotal" subtitle="All vendor orders" tone="info">
        <template #badge>
          <AppBadge variant="info" shape="square" size="md">
            <ShoppingCart class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>
      <StatsCard
        title="Pending"
        :value="orderStats.pending"
        subtitle="On latest page"
        tone="warning"
      >
        <template #badge>
          <AppBadge variant="warning" shape="square" size="md">
            <Clock3 class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>
      <StatsCard
        title="In fulfillment"
        :value="orderStats.fulfilling"
        subtitle="Confirmed or processing · latest page"
        tone="success"
      >
        <template #badge>
          <AppBadge variant="success" shape="square" size="md">
            <Truck class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>
    </div>

    <div class="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
      <AppCard title="Recent orders" subtitle="Latest orders containing your products">
        <div v-if="ordersError" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {{ ordersError }}
        </div>
        <div v-else-if="loadingOrders" class="space-y-3">
          <div v-for="index in 3" :key="index" class="h-16 animate-pulse rounded-2xl bg-muted" />
        </div>
        <div v-else-if="recentOrders.length" class="space-y-3">
          <div
            v-for="order in recentOrders"
            :key="order.id"
            class="flex items-center justify-between rounded-2xl border border-border bg-muted/40 px-4 py-3"
          >
            <div>
              <p class="font-semibold text-card-foreground">{{ order.order_number }}</p>
              <p class="text-sm text-muted-foreground">{{ order.shipping.name }}</p>
            </div>

            <div class="text-right">
              <p class="font-semibold text-card-foreground">
                {{ formatOrderAmount(order.items.reduce((total, item) => total + Number(item.total || 0), 0)) }}
              </p>
              <AppBadge
                :variant="statusVariant(order.status)"
                size="sm"
              >
                {{ order.status }}
              </AppBadge>
            </div>
          </div>
        </div>
        <EmptyState
          v-else
          title="No orders yet"
          message="Orders containing your products will appear here."
        />
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
              <AppBadge :variant="action.tone as any" shape="square" size="sm">
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

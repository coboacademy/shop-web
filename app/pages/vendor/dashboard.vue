<script setup lang="ts">
import {
  ArrowUpRight,
  CreditCard,
  Package,
  ShoppingCart,
  ShieldCheck,
  Store,
  TrendingUp,
  Users,
} from "lucide-vue-next";

definePageMeta({
  layout: "vendor",
  middleware: ["auth", "permission"],
  permission: "vendor.view",
  title: "Vendor Dashboard",
});

const authStore = useAuthStore();
const { getProfile } = useVendor();
const user = computed(() => authStore.user);
const vendor = ref<any>(null);
const loadingVendor = ref(false);
const showKycWarning = computed(() => !vendor.value);

const stats = [
  {
    title: "Products",
    value: 18,
    subtitle: "Active listings",
    icon: Package,
    tone: "info",
  },
  {
    title: "Orders",
    value: 42,
    subtitle: "This month",
    icon: ShoppingCart,
    tone: "success",
  },
  {
    title: "Revenue",
    value: "$4.8K",
    subtitle: "Gross sales",
    icon: TrendingUp,
    tone: "warning",
  },
  {
    title: "Customers",
    value: 128,
    subtitle: "Returning buyers",
    icon: Users,
    tone: "default",
  },
];

const recentOrders = [
  { id: "#1042", customer: "Lina Brooks", total: "$128.00", status: "Paid" },
  { id: "#1041", customer: "Derek Park", total: "$84.50", status: "Processing" },
  { id: "#1040", customer: "Maya Scott", total: "$240.00", status: "Shipped" },
];

const quickActions = [
  { title: "Manage products", to: "/vendor/products", icon: Store, tone: "info" },
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

onMounted(async () => {
  await fetchVendorProfile();
});
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

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        v-for="item in stats"
        :key="item.title"
        :title="item.title"
        :value="item.value"
        :subtitle="item.subtitle"
        :tone="item.tone as any"
      >
        <template #badge>
          <AppBadge :variant="item.tone as any" shape="square" size="md">
            <component :is="item.icon" class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>
    </div>

    <div class="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
      <AppCard title="Recent orders" subtitle="Latest customer purchases">
        <div class="space-y-3">
          <div
            v-for="order in recentOrders"
            :key="order.id"
            class="flex items-center justify-between rounded-2xl border border-border bg-muted/40 px-4 py-3"
          >
            <div>
              <p class="font-semibold text-card-foreground">{{ order.id }}</p>
              <p class="text-sm text-muted-foreground">{{ order.customer }}</p>
            </div>

            <div class="text-right">
              <p class="font-semibold text-card-foreground">{{ order.total }}</p>
              <AppBadge
                :variant="order.status === 'Paid' ? 'success' : order.status === 'Shipped' ? 'info' : 'warning'"
                size="sm"
              >
                {{ order.status }}
              </AppBadge>
            </div>
          </div>
        </div>
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

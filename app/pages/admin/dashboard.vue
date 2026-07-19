<script setup lang="ts">
import {
  Activity,
  Clock,
  Database,
  CheckCircle2,
  Archive,
  TriangleAlert,
  Package,
  KeyRound,
  RefreshCcw,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-vue-next";

import { useDashboardManagementStore } from "~/stores/dashboard/dashboardStore";
import { useProductManagementStore } from "~/stores/inventory/productStore";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth", "permission"],
  permission: "dashboard.view",
  title: "Dashboard",
});

const dashboardStore = useDashboardManagementStore();
const productStore = useProductManagementStore();
const toast = useToast();

const loading = computed(() => dashboardStore.loading);
const refreshing = computed(() => dashboardStore.refreshing || productStore.refreshing);
const errorMessage = computed(() => dashboardStore.errorMessage);

const totalUsers = computed(() => dashboardStore.totalUsers);
const activeUsers = computed(() => dashboardStore.activeUsers);
const pendingUsers = computed(() => dashboardStore.pendingUsers);
const inactiveUsers = computed(() => dashboardStore.inactiveUsers);
const totalRoles = computed(() => dashboardStore.totalRoles);
const totalPermissions = computed(() => dashboardStore.totalPermissions);
const totalAuditLogs = computed(() => dashboardStore.totalAuditLogs);

const totalProducts = computed(() => productStore.totalProducts);
const activeProducts = computed(() => productStore.activeProducts);
const draftProducts = computed(() => productStore.draftProducts);
const lowStockProducts = computed(() => productStore.lowStockProducts);

const system = computed(() => dashboardStore.system);

const recentUsers = computed(() => {
  return Array.isArray(dashboardStore.recentUsers) ? dashboardStore.recentUsers : [];
});

const recentAuditLogs = computed(() => {
  return Array.isArray(dashboardStore.recentAuditLogs)
    ? dashboardStore.recentAuditLogs
    : [];
});

const roleDistribution = computed(() => {
  return Array.isArray(dashboardStore.roleDistribution)
    ? dashboardStore.roleDistribution
    : [];
});

const recentProducts = computed(() => {
  return Array.isArray(productStore.products) ? productStore.products.slice(0, 5) : [];
});

const fetchDashboard = async (
  options: {
    force?: boolean;
    silent?: boolean;
  } = {}
) => {
  try {
    await Promise.allSettled([
      dashboardStore.fetchDashboard(options),
      productStore.fetchProducts(
        {
          page: 1,
          per_page: 5,
        },
        options
      ),
    ]);
  } catch (error: any) {
    toast.error(
      "Dashboard failed",
      error.response?.data?.message || error.message || "Failed to load dashboard"
    );
  }
};

const handleRefresh = async () => {
  await fetchDashboard({
    force: true,
    silent: true,
  });
};

const rolePercent = (count: number) => {
  if (!totalUsers.value) return 0;

  return Math.min(Math.round((count / totalUsers.value) * 100), 100);
};

onMounted(async () => {
  await fetchDashboard({
    silent: dashboardStore.totalUsers > 0 || productStore.hasData,
  });
});
</script>
<template>
  <div class="space-y-6">
    <PageHeader
      title="Dashboard"
      subtitle="Overview of users, roles, permissions, and recent system activity."
    >
      <template #actions>
        <AppButton variant="secondary" :loading="refreshing" @click="handleRefresh">
          <RefreshCcw class="h-4 w-4" />
          Refresh
        </AppButton>
      </template>
    </PageHeader>

    <AlertMessage
      v-if="errorMessage"
      type="error"
      title="Dashboard error"
      :message="errorMessage"
    />

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        title="Total Users"
        :value="totalUsers"
        :subtitle="`${activeUsers} active users`"
        tone="info"
      >
        <template #badge>
          <AppBadge variant="info" shape="square" size="md">
            <Users class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard
        title="Roles"
        :value="totalRoles"
        subtitle="System access groups"
        tone="default"
      >
        <template #badge>
          <AppBadge variant="default" shape="square" size="md">
            <ShieldCheck class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard
        title="Permissions"
        :value="totalPermissions"
        subtitle="Fine-grained controls"
        tone="success"
      >
        <template #badge>
          <AppBadge variant="success" shape="square" size="md">
            <KeyRound class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard
        title="Audit Logs"
        :value="totalAuditLogs"
        subtitle="Recorded system actions"
        tone="warning"
      >
        <template #badge>
          <AppBadge variant="warning" shape="square" size="md">
            <Workflow class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>
    </div>

    <!-- Product Stats -->
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        title="Total Products"
        :value="totalProducts"
        subtitle="All inventory items"
        tone="info"
      >
        <template #badge>
          <AppBadge variant="info" shape="square" size="md">
            <Database class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard
        title="Active Products"
        :value="activeProducts"
        subtitle="Published products"
        tone="success"
      >
        <template #badge>
          <AppBadge variant="success" shape="square" size="md">
            <CheckCircle2 class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard
        title="Draft Products"
        :value="draftProducts"
        subtitle="Not published yet"
        tone="warning"
      >
        <template #badge>
          <AppBadge variant="warning" shape="square" size="md">
            <Archive class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard
        title="Low Stock"
        :value="lowStockProducts"
        subtitle="Stock ≤ 5"
        tone="danger"
      >
        <template #badge>
          <AppBadge variant="danger" shape="square" size="md">
            <TriangleAlert class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>
    </div>

    <div v-if="loading" class="grid gap-4 lg:grid-cols-3">
      <div
        v-for="i in 3"
        :key="i"
        class="rounded-3xl border border-border bg-card p-6 shadow-sm"
      >
        <div class="h-5 w-40 animate-pulse rounded-full bg-muted" />

        <div class="mt-5 space-y-3">
          <div v-for="j in 3" :key="j" class="h-14 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    </div>

    <template v-else>
      <div class="grid gap-4 lg:grid-cols-3">
        <AppCard title="System Status" subtitle="Current application health.">
          <div class="space-y-3">
            <div
              class="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3"
            >
              <div class="flex items-center gap-3">
                <AppBadge variant="success" shape="square" size="sm">
                  <Activity class="h-4 w-4" />
                </AppBadge>

                <span class="text-sm font-semibold text-muted-foreground"> Status </span>
              </div>

              <AppBadge :variant="system.status === 'Healthy' ? 'success' : 'warning'">
                {{ system.status }}
              </AppBadge>
            </div>

            <div
              class="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3"
            >
              <div class="flex items-center gap-3">
                <AppBadge variant="info" shape="square" size="sm">
                  <Database class="h-4 w-4" />
                </AppBadge>

                <span class="text-sm font-semibold text-muted-foreground">
                  Environment
                </span>
              </div>

              <span class="text-sm font-bold text-card-foreground">
                {{ system.environment }}
              </span>
            </div>

            <div
              class="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3"
            >
              <div class="flex items-center gap-3">
                <AppBadge variant="warning" shape="square" size="sm">
                  <Clock class="h-4 w-4" />
                </AppBadge>

                <span class="text-sm font-semibold text-muted-foreground">
                  Timezone
                </span>
              </div>

              <span class="text-sm font-bold text-card-foreground">
                {{ system.timezone }}
              </span>
            </div>
          </div>
        </AppCard>

        <AppCard title="User Status" subtitle="Account status summary.">
          <div class="space-y-3">
            <div
              class="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 dark:bg-emerald-950/30"
            >
              <span class="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Active
              </span>

              <AppBadge variant="success">
                {{ activeUsers }}
              </AppBadge>
            </div>

            <div
              class="flex items-center justify-between rounded-2xl bg-orange-50 px-4 py-3 dark:bg-orange-950/30"
            >
              <span class="text-sm font-semibold text-orange-700 dark:text-orange-300">
                Pending
              </span>

              <AppBadge variant="warning">
                {{ pendingUsers }}
              </AppBadge>
            </div>

            <div
              class="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3"
            >
              <span class="text-sm font-semibold text-muted-foreground"> Inactive </span>

              <AppBadge variant="default">
                {{ inactiveUsers }}
              </AppBadge>
            </div>
          </div>
        </AppCard>

        <AppCard title="Role Distribution" subtitle="Users grouped by role.">
          <div v-if="roleDistribution.length > 0" class="space-y-4">
            <div
              v-for="role in roleDistribution"
              :key="role.id"
              class="rounded-2xl border border-border bg-muted/40 px-4 py-3"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-bold text-card-foreground">
                    {{ role.name }}
                  </p>

                  <p class="mt-0.5 text-xs text-muted-foreground">
                    {{ role.users_count }} users
                  </p>
                </div>

                <AppBadge variant="info"> {{ rolePercent(role.users_count) }}% </AppBadge>
              </div>

              <div class="mt-3 h-2 overflow-hidden rounded-full bg-background">
                <div
                  class="h-full rounded-full bg-sky-600 dark:bg-sky-400"
                  :style="{ width: `${rolePercent(role.users_count)}%` }"
                />
              </div>
            </div>
          </div>

          <EmptyState
            v-else
            title="No role data"
            message="Assign roles to users to see distribution."
          />
        </AppCard>
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <AppCard title="Recent Users" subtitle="Latest registered accounts.">
          <div v-if="recentUsers.length > 0" class="space-y-3">
            <div
              v-for="user in recentUsers"
              :key="user.id"
              class="flex items-center justify-between gap-4 rounded-2xl border border-border bg-muted/40 px-4 py-3 hover:bg-muted"
            >
              <div class="flex min-w-0 items-center gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background text-sm font-bold text-card-foreground"
                >
                  {{ user.name?.charAt(0)?.toUpperCase() || "U" }}
                </div>

                <div class="min-w-0">
                  <p class="truncate text-sm font-bold text-card-foreground">
                    {{ user.name }}
                  </p>

                  <p class="truncate text-xs text-muted-foreground">
                    {{ user.email }}
                  </p>
                </div>
              </div>

              <AppBadge
                :variant="
                  user.status === 'active'
                    ? 'success'
                    : user.status === 'pending'
                    ? 'warning'
                    : 'default'
                "
              >
                {{ user.status }}
              </AppBadge>
            </div>
          </div>

          <EmptyState v-else title="No users yet" message="New users will appear here." />
        </AppCard>

        <AppCard title="Recent Audit Logs" subtitle="Latest recorded system actions.">
          <div v-if="recentAuditLogs.length > 0" class="space-y-3">
            <div
              v-for="log in recentAuditLogs"
              :key="log.id"
              class="rounded-2xl border border-border bg-muted/40 px-4 py-3 hover:bg-muted"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <AppBadge variant="default">
                    {{ log.action }}
                  </AppBadge>

                  <p class="mt-2 truncate text-xs text-muted-foreground">
                    {{ log.user?.name || "System" }} · {{ log.created_at }}
                  </p>
                </div>

                <span class="shrink-0 text-xs font-semibold text-muted-foreground">
                  {{ log.module || "-" }}
                </span>
              </div>
            </div>
          </div>

          <EmptyState
            v-else
            title="No audit logs yet"
            message="System actions will appear here."
          />
        </AppCard>

        <AppCard title="Recent Products" subtitle="Latest added or updated products.">
          <div v-if="recentProducts.length > 0" class="space-y-3">
            <div
              v-for="product in recentProducts"
              :key="product.id"
              class="flex items-center justify-between gap-4 rounded-2xl border border-border bg-muted/40 px-4 py-3 hover:bg-muted"
            >
              <div class="flex min-w-0 items-center gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background text-sm font-bold text-card-foreground"
                >
                  <img
                    v-if="product.image_url"
                    :src="product.image_url"
                    :alt="product.name"
                    class="h-full w-full object-cover"
                  />
                  <Package v-else class="h-5 w-5 text-muted-foreground" />
                </div>

                <div class="min-w-0">
                  <p class="truncate text-sm font-bold text-card-foreground">
                    {{ product.name }}
                  </p>
                  <p class="truncate text-xs text-muted-foreground">
                    ${{ Number(product.price).toFixed(2) }}
                  </p>
                </div>
              </div>

              <AppBadge
                :variant="
                  product.status === 'active'
                    ? 'success'
                    : product.status === 'draft'
                    ? 'warning'
                    : 'default'
                "
              >
                {{ product.status }}
              </AppBadge>
            </div>
          </div>

          <EmptyState
            v-else
            title="No products yet"
            message="Products will appear here."
          />
        </AppCard>
      </div>
    </template>

    <AppRefreshingIndicator :show="refreshing" />
  </div>
</template>

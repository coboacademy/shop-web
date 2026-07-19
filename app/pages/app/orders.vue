<script setup lang="ts">
import { Eye, Package, RefreshCcw, Search, ShoppingBag } from "lucide-vue-next";

definePageMeta({
  layout: "user",
  middleware: ["auth", "permission"],
  permission: "order.view",
  title: "My Orders",
});

interface OrderItem {
  id: number;
  order_number: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  total: number;
  created_at: string;
}

const loading = ref(false);
const search = ref("");
const status = ref("");

const orders = ref<OrderItem[]>([
  {
    id: 1,
    order_number: "ORD-0001",
    status: "pending",
    total: 25.5,
    created_at: "2026-01-01 10:00",
  },
  {
    id: 2,
    order_number: "ORD-0002",
    status: "completed",
    total: 49.99,
    created_at: "2026-01-02 14:30",
  },
]);

const filteredOrders = computed(() => {
  const keyword = search.value.trim().toLowerCase();

  return orders.value.filter((order) => {
    const matchesSearch = !keyword || order.order_number.toLowerCase().includes(keyword);

    const matchesStatus = !status.value || order.status === status.value;

    return matchesSearch && matchesStatus;
  });
});

const stats = computed(() => {
  return {
    total: orders.value.length,
    pending: orders.value.filter((item) => item.status === "pending").length,
    completed: orders.value.filter((item) => item.status === "completed").length,
  };
});

const columns = [
  { key: "order", label: "Order" },
  { key: "status", label: "Status" },
  { key: "total", label: "Total" },
  { key: "created_at", label: "Created" },
  { key: "actions", label: "Actions", align: "right" as const },
];

const handleRefresh = async () => {
  loading.value = true;

  setTimeout(() => {
    loading.value = false;
  }, 500);
};

const statusVariant = (value: OrderItem["status"]) => {
  if (value === "completed") return "success";
  if (value === "pending") return "warning";
  if (value === "processing") return "info";
  if (value === "cancelled") return "danger";

  return "default";
};
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="My Orders"
      subtitle="View your order history and current order status."
    >
      <template #actions>
        <AppButton variant="secondary" :loading="loading" @click="handleRefresh">
          <RefreshCcw class="h-4 w-4" />
          Refresh
        </AppButton>
      </template>
    </PageHeader>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatsCard
        title="Total Orders"
        :value="stats.total"
        subtitle="All orders"
        tone="info"
      >
        <template #badge>
          <AppBadge variant="info" shape="square" size="md">
            <ShoppingBag class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard
        title="Pending"
        :value="stats.pending"
        subtitle="Waiting process"
        tone="warning"
      >
        <template #badge>
          <AppBadge variant="warning" shape="square" size="md">
            <Package class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard
        title="Completed"
        :value="stats.completed"
        subtitle="Finished orders"
        tone="success"
      >
        <template #badge>
          <AppBadge variant="success" shape="square" size="md">
            <Package class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>
    </div>

    <FilterBar title="Filters" subtitle="Search and filter your orders.">
      <AppInput v-model="search" label="Search" placeholder="Search order number...">
        <template #icon>
          <Search class="h-5 w-5" />
        </template>
      </AppInput>

      <AppSelect
        v-model="status"
        label="Status"
        placeholder="All Status"
        :options="[
          { label: 'Pending', value: 'pending' },
          { label: 'Processing', value: 'processing' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' },
        ]"
      />
    </FilterBar>

    <DataTable
      :columns="columns"
      :rows="filteredOrders"
      :loading="loading"
      empty-title="No orders found"
      empty-message="Your orders will appear here."
    >
      <template #cell-order="{ row }">
        <div class="flex items-center gap-3">
          <AppBadge variant="info" shape="square" size="md">
            <Package class="h-5 w-5" />
          </AppBadge>

          <div>
            <p class="text-sm font-bold text-card-foreground">
              {{ row.order_number }}
            </p>
            <p class="text-xs text-muted-foreground">Order ID #{{ row.id }}</p>
          </div>
        </div>
      </template>

      <template #cell-status="{ row }">
        <AppBadge :variant="statusVariant(row.status)">
          {{ row.status }}
        </AppBadge>
      </template>

      <template #cell-total="{ row }">
        <span class="text-sm font-bold text-card-foreground">
          ${{ Number(row.total).toFixed(2) }}
        </span>
      </template>

      <template #cell-created_at="{ row }">
        <span class="text-sm text-muted-foreground">
          {{ row.created_at }}
        </span>
      </template>

      <template #cell-actions>
        <AppButton variant="secondary" size="sm">
          <Eye class="h-4 w-4" />
          View
        </AppButton>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import {
  ClipboardList,
  Eye,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Truck,
} from "lucide-vue-next";
import {
  useVendorOrder,
  type VendorOrder,
  type VendorOrderStatus,
} from "~/composables/useVendorOrder";

definePageMeta({
  layout: "vendor",
  middleware: ["auth", "permission"],
  permission: "vendor.view",
  title: "Order Management",
});

const ORDER_STATUSES: VendorOrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "cancelled",
  "delivered",
];

const { getOrders, getOrder, updateOrderStatus } = useVendorOrder();
const toast = useToast();
const orders = ref<VendorOrder[]>([]);
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
  from: null as number | null,
  to: null as number | null,
});
const page = ref(1);
const search = ref("");
const statusFilter = ref("");
const loading = ref(true);
const errorMessage = ref("");
const paginationNotice = ref("");
const isDetailOpen = ref(false);
const detailLoading = ref(false);
const detailError = ref("");
const selectedOrder = ref<VendorOrder | null>(null);
const selectedStatus = ref<VendorOrderStatus>("pending");
const statusError = ref("");
const updatingStatus = ref(false);

const filteredOrders = computed(() => {
  const query = search.value.trim().toLowerCase();

  return orders.value.filter((order) => {
    const matchesSearch =
      !query ||
      order.order_number.toLowerCase().includes(query) ||
      order.shipping.name.toLowerCase().includes(query);
    const matchesStatus = !statusFilter.value || order.status === statusFilter.value;

    return matchesSearch && matchesStatus;
  });
});

const pageStats = computed(() => ({
  total: orders.value.length,
  needsAction: orders.value.filter((order) => order.status === "pending").length,
  inProgress: orders.value.filter(
    (order) => order.status === "confirmed" || order.status === "processing",
  ).length,
  delivered: orders.value.filter((order) => order.status === "delivered").length,
}));

const columns = [
  { key: "order", label: "Order" },
  { key: "customer", label: "Ship to" },
  { key: "items", label: "Items" },
  { key: "payment", label: "Payment" },
  { key: "status", label: "Status" },
  { key: "created", label: "Placed" },
  { key: "actions", label: "Actions", align: "right" as const },
];

const statusVariant = (status: VendorOrderStatus) => {
  if (status === "delivered") return "success";
  if (status === "cancelled") return "danger";
  if (status === "processing" || status === "confirmed") return "info";
  return "warning";
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const formatAmount = (value: string | number) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : String(value);
};

const loadOrders = async (requestedPage = page.value) => {
  loading.value = true;
  errorMessage.value = "";
  paginationNotice.value = "";

  try {
    const response = await getOrders(requestedPage);
    const result = response.data.orders;
    if (!result || !Array.isArray(result.data)) {
      throw new Error("The orders API returned an invalid order list.");
    }

    const meta = result.meta ?? result.pagination;
    const currentPage = meta?.current_page ?? result.current_page;
    const lastPage = meta?.last_page ?? result.last_page;
    const perPage = meta?.per_page ?? result.per_page;
    const total = meta?.total ?? result.total;

    orders.value = result.data;
    if (
      Number.isInteger(currentPage) &&
      Number.isInteger(lastPage) &&
      Number.isInteger(perPage) &&
      Number.isInteger(total)
    ) {
      pagination.value = {
        current_page: currentPage!,
        last_page: lastPage!,
        per_page: perPage!,
        total: total!,
        from: meta?.from ?? result.from ?? null,
        to: meta?.to ?? result.to ?? null,
      };
      page.value = pagination.value.current_page;
    } else {
      pagination.value = {
        current_page: requestedPage,
        last_page: requestedPage,
        per_page: 15,
        total: result.data.length,
        from: result.data.length ? 1 : null,
        to: result.data.length || null,
      };
      page.value = requestedPage;
      paginationNotice.value =
        "Orders loaded, but the API did not return pagination metadata. Page navigation is unavailable.";
    }
  } catch (error: any) {
    errorMessage.value = error.message || "Could not load vendor orders.";
    orders.value = [];
    pagination.value = {
      current_page: requestedPage,
      last_page: 1,
      per_page: 15,
      total: 0,
      from: null,
      to: null,
    };
  } finally { 
    loading.value = false;
  }
};

const openOrder = async (order: VendorOrder) => {
  selectedOrder.value = order;
  selectedStatus.value = order.status;
  isDetailOpen.value = true;
  detailLoading.value = true;
  detailError.value = "";
  statusError.value = "";

  try {
    const response = await getOrder(order.id);
    selectedOrder.value = response.data.order;
    selectedStatus.value = response.data.order.status;
  } catch (error: any) {
    detailError.value = error.message || "Could not load order details.";
  } finally {
    detailLoading.value = false;
  }
};

const saveStatus = async () => {
  if (!selectedOrder.value || updatingStatus.value) return;

  updatingStatus.value = true;
  statusError.value = "";

  try {
    const response = await updateOrderStatus(selectedOrder.value.id, selectedStatus.value);
    selectedOrder.value = response.data.order;
    selectedStatus.value = response.data.order.status;
    toast.success("Order updated", response.message);
    await loadOrders(page.value);
  } catch (error: any) {
    statusError.value =
      error.errors?.status?.[0] || error.message || "Could not update order status.";
    toast.error("Update failed", statusError.value);
  } finally {
    updatingStatus.value = false;
  }
};

const setPage = async (nextPage: number) => {
  await loadOrders(nextPage);
};

onMounted(() => loadOrders(1));
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Order management"
      subtitle="Review orders containing your products and keep fulfillment status up to date."
    >
      <template #actions>
        <AppButton variant="secondary" :loading="loading" @click="loadOrders(page)">
          <RefreshCw class="h-4 w-4" />
          Refresh
        </AppButton>
      </template>
    </PageHeader>

    <AlertMessage v-if="errorMessage" type="error" :message="errorMessage">
      <AppButton variant="secondary" size="sm" @click="loadOrders(page)">
        Try again
      </AppButton>
    </AlertMessage>
    <AlertMessage
      v-if="paginationNotice"
      type="warning"
      :message="paginationNotice"
    />

    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Current page order summary">
      <StatsCard
        title="Orders on page"
        :value="pageStats.total"
        subtitle="From the current results page"
        tone="info"
      >
        <template #badge>
          <AppBadge variant="info" shape="square" size="md"><ClipboardList class="h-5 w-5" /></AppBadge>
        </template>
      </StatsCard>
      <StatsCard
        title="Pending"
        :value="pageStats.needsAction"
        subtitle="Awaiting vendor action"
        tone="warning"
      >
        <template #badge>
          <AppBadge variant="warning" shape="square" size="md"><Package class="h-5 w-5" /></AppBadge>
        </template>
      </StatsCard>
      <StatsCard
        title="In progress"
        :value="pageStats.inProgress"
        subtitle="Confirmed or processing"
        tone="info"
      >
        <template #badge>
          <AppBadge variant="info" shape="square" size="md"><Truck class="h-5 w-5" /></AppBadge>
        </template>
      </StatsCard>
      <StatsCard
        title="Delivered"
        :value="pageStats.delivered"
        subtitle="On the current page"
        tone="success"
      >
        <template #badge>
          <AppBadge variant="success" shape="square" size="md"><MapPin class="h-5 w-5" /></AppBadge>
        </template>
      </StatsCard>
    </section>

    <FilterBar
      title="Orders"
      subtitle="Search and status filters apply to the currently loaded page."
      columns="2"
    >
      <AppInput v-model="search" label="Search" placeholder="Order number or recipient">
        <template #icon><Search class="h-5 w-5" /></template>
      </AppInput>
      <AppSelect
        v-model="statusFilter"
        label="Order status"
        placeholder="All statuses"
        :options="ORDER_STATUSES.map((value) => ({ label: value[0].toUpperCase() + value.slice(1), value }))"
      />
      <template #actions>
        <button
          v-if="search || statusFilter"
          type="button"
          class="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-card-foreground"
          @click="search = ''; statusFilter = ''"
        >
          Clear filters
        </button>
      </template>
    </FilterBar>

    <p
      v-if="search || statusFilter"
      class="text-sm text-muted-foreground"
      aria-live="polite"
    >
      {{ filteredOrders.length }} matching
      {{ filteredOrders.length === 1 ? "order" : "orders" }} on page
      {{ pagination.current_page }} of {{ pagination.last_page }}. Pagination below covers
      all vendor orders.
    </p>

    <DataTable
      :columns="columns"
      :rows="filteredOrders"
      :loading="loading"
      empty-title="No orders found"
      :empty-message="
        orders.length
          ? 'No orders on this page match your search or status filter.'
          : 'Orders containing your products will appear here.'
      "
    >
      <template #cell-order="{ row }">
        <div class="flex items-center gap-3">
          <AppBadge variant="info" shape="square" size="md"><Package class="h-5 w-5" /></AppBadge>
          <div>
            <p class="font-bold text-card-foreground">{{ row.order_number }}</p>
            <p class="text-xs text-muted-foreground">Order #{{ row.id }}</p>
          </div>
        </div>
      </template>
      <template #cell-customer="{ row }">
        <div>
          <p class="font-semibold text-card-foreground">{{ row.shipping.name }}</p>
          <p class="text-xs text-muted-foreground">
            {{ [row.shipping.city, row.shipping.country].filter(Boolean).join(", ") || "Address unavailable" }}
          </p>
        </div>
      </template>
      <template #cell-items="{ row }">
        <div>
          <p class="font-semibold text-card-foreground">
            {{ row.items.reduce((quantity, item) => quantity + item.quantity, 0) }}
            units
          </p>
          <p class="text-xs text-muted-foreground">
            {{ row.items.length }} {{ row.items.length === 1 ? "product" : "products" }}
          </p>
        </div>
      </template>
      <template #cell-payment="{ row }">
        <AppBadge variant="default">{{ row.payment_status }}</AppBadge>
      </template>
      <template #cell-status="{ row }">
        <AppBadge :variant="statusVariant(row.status)">{{ row.status }}</AppBadge>
      </template>
      <template #cell-created="{ row }">
        <span class="text-sm text-muted-foreground">{{ formatDate(row.created_at) }}</span>
      </template>
      <template #cell-actions="{ row }">
        <AppButton variant="secondary" size="sm" @click="openOrder(row)">
          <Eye class="h-4 w-4" />
          View
        </AppButton>
      </template>
    </DataTable>

    <TablePagination
      :current-page="pagination.current_page"
      :last-page="pagination.last_page"
      :total="pagination.total"
      :per-page="pagination.per_page"
      :loading="loading"
      label="orders"
      @previous="setPage(page - 1)"
      @next="setPage(page + 1)"
      @page="setPage"
    />

    <AppModal
      :open="isDetailOpen"
      :title="selectedOrder?.order_number || 'Order details'"
      :subtitle="selectedOrder ? `Order #${selectedOrder.id} · Placed ${formatDate(selectedOrder.created_at)}` : ''"
      size="lg"
      @close="isDetailOpen = false"
    >
      <div v-if="detailLoading" class="space-y-4">
        <div class="h-5 w-1/3 animate-pulse rounded bg-muted" />
        <div class="h-24 animate-pulse rounded-2xl bg-muted" />
        <div class="h-32 animate-pulse rounded-2xl bg-muted" />
      </div>
      <AlertMessage v-else-if="detailError" type="error" :message="detailError">
        <AppButton variant="secondary" size="sm" @click="selectedOrder && openOrder(selectedOrder)">
          Retry
        </AppButton>
      </AlertMessage>
      <div v-else-if="selectedOrder" class="space-y-6">
        <div class="grid gap-4 sm:grid-cols-2">
          <section class="rounded-2xl border border-border bg-muted/30 p-4">
            <h3 class="text-sm font-bold text-card-foreground">Order status</h3>
            <div class="mt-3 flex items-center gap-2">
              <AppBadge :variant="statusVariant(selectedOrder.status)">
                {{ selectedOrder.status }}
              </AppBadge>
              <AppBadge variant="default">{{ selectedOrder.payment_status }}</AppBadge>
            </div>
            <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div class="flex-1">
                <AppSelect
                  :model-value="selectedStatus"
                  label="Update order status"
                  placeholder="Choose status"
                  :options="ORDER_STATUSES.map((value) => ({ label: value[0].toUpperCase() + value.slice(1), value }))"
                  @update:model-value="(value) => { if (ORDER_STATUSES.includes(value as VendorOrderStatus)) selectedStatus = value as VendorOrderStatus }"
                />
              </div>
              <AppButton
                variant="primary"
                :loading="updatingStatus"
                :disabled="selectedStatus === selectedOrder.status"
                @click="saveStatus"
              >
                Save status
              </AppButton>
            </div>
            <p v-if="statusError" class="mt-2 text-sm text-red-600 dark:text-red-400">
              {{ statusError }}
            </p>
          </section>
          <section class="rounded-2xl border border-border bg-muted/30 p-4">
            <h3 class="text-sm font-bold text-card-foreground">Ship to</h3>
            <p class="mt-3 font-semibold text-card-foreground">{{ selectedOrder.shipping.name }}</p>
            <p class="text-sm text-muted-foreground">{{ selectedOrder.shipping.phone }}</p>
            <p class="mt-2 text-sm text-muted-foreground">
              {{ selectedOrder.shipping.address }}<br />
              {{ [selectedOrder.shipping.city, selectedOrder.shipping.province, selectedOrder.shipping.postal_code].filter(Boolean).join(", ") }}<br />
              {{ selectedOrder.shipping.country }}
            </p>
          </section>
        </div>

        <section>
          <h3 class="mb-3 text-sm font-bold text-card-foreground">Your items in this order</h3>
          <div class="overflow-x-auto rounded-2xl border border-border">
            <table class="min-w-full divide-y divide-border text-sm">
              <thead class="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th class="px-4 py-3">Product</th>
                  <th class="px-4 py-3">SKU</th>
                  <th class="px-4 py-3 text-right">Qty</th>
                  <th class="px-4 py-3 text-right">Unit price</th>
                  <th class="px-4 py-3 text-right">Line total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="item in selectedOrder.items" :key="item.id">
                  <td class="px-4 py-3 font-medium text-card-foreground">
                    {{ item.product_name }}
                    <span v-if="item.variant_name" class="block text-xs text-muted-foreground">
                      {{ item.variant_name }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-muted-foreground">{{ item.sku || "—" }}</td>
                  <td class="px-4 py-3 text-right text-card-foreground">{{ item.quantity }}</td>
                  <td class="px-4 py-3 text-right text-card-foreground">{{ formatAmount(item.unit_price) }}</td>
                  <td class="px-4 py-3 text-right font-semibold text-card-foreground">{{ formatAmount(item.total) }}</td>
                </tr>
              </tbody>
              <tfoot class="bg-muted/30">
                <tr>
                  <td colspan="4" class="px-4 py-3 text-right font-semibold text-muted-foreground">
                    Your items subtotal
                  </td>
                  <td class="px-4 py-3 text-right font-bold text-card-foreground">
                    {{ formatAmount(selectedOrder.items.reduce((total, item) => total + Number(item.total || 0), 0)) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p class="mt-2 text-xs text-muted-foreground">
            Shows only items associated with your vendor account. Amounts follow the API’s decimal values.
          </p>
        </section>
      </div>
    </AppModal>
  </div>
</template>

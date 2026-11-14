<script setup lang="ts">
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Eye,
  LockKeyhole,
  MapPin,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
} from "lucide-vue-next";
import {
  useUserOrder,
  type UserOrder,
  type UserOrderApiError,
  type UserOrderListItem,
} from "~/composables/useUserOrder";
import {
  useUserPayment,
  type UserPaymentApiError,
} from "~/composables/useUserPayment";

definePageMeta({
  layout: "user",
  middleware: ["auth", "permission"],
  permission: "order.view",
  title: "My Orders",
});

const ORDERS_PER_PAGE = 15;
type BadgeVariant = "default" | "success" | "danger" | "warning" | "info";

const { getOrders, getOrder } = useUserOrder();
const { createPayment } = useUserPayment();
const notificationStore = useNotificationStore();
const orders = ref<UserOrderListItem[]>([]);
const page = ref(1);
const search = ref("");
const statusFilter = ref("");
const loading = ref(true);
const errorMessage = ref("");
const isDetailOpen = ref(false);
const detailLoading = ref(false);
const detailError = ref("");
const selectedOrder = ref<UserOrder | null>(null);
const selectedOrderId = ref<number | null>(null);
const paymentLoading = ref<Record<number, boolean>>({});
const paymentErrors = ref<Record<number, string>>({});
const paymentUrls = ref<Record<number, string>>({});

const isOrderApiError = (error: unknown): error is UserOrderApiError =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof error.message === "string" &&
  "status" in error &&
  typeof error.status === "number" &&
  "errors" in error;

const isUserPaymentApiError = (
  error: unknown,
): error is UserPaymentApiError =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof error.message === "string" &&
  "status" in error &&
  typeof error.status === "number";

const isOnlinePaymentRetryEligible = (
  order: Pick<UserOrderListItem, "status" | "payment_status">,
) =>
  typeof order.status === "string" &&
  typeof order.payment_status === "string" &&
  order.status.toLowerCase() !== "cancelled" &&
  ["unpaid", "pending"].includes(order.payment_status.toLowerCase());

const isHttpPaymentUrl = (value: unknown): value is string => {
  if (typeof value !== "string" || !value.trim() || value !== value.trim()) {
    return false;
  }
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
};

const visibleOrders = computed(() => {
  const query = search.value.trim().toLowerCase();
  return orders.value.filter((order) => {
    const matchesSearch =
      !query || order.order_number.toLowerCase().includes(query);
    const matchesStatus = !statusFilter.value || order.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

const statusOptions = computed(() =>
  [...new Set(orders.value.map((order) => order.status))]
    .sort()
    .map((value) => ({
      label: value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
      value,
    })),
);

const pageStats = computed(() => ({
  orders: orders.value.length,
  pending: orders.value.filter((order) => order.status === "pending").length,
  unpaid: orders.value.filter(
    (order) => ["unpaid", "pending"].includes(order.payment_status.toLowerCase()),
  ).length,
}));

const hasNextPage = computed(() => orders.value.length === ORDERS_PER_PAGE);

const columns = [
  { key: "order", label: "Order" },
  { key: "delivery", label: "Deliver to" },
  { key: "payment", label: "Payment" },
  { key: "status", label: "Status" },
  { key: "total", label: "Total", align: "right" as const },
  { key: "created_at", label: "Placed" },
  { key: "actions", label: "", align: "right" as const },
];

const formatLabel = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatPrice = (value: string | number | null | undefined) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
    : "—";
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
};

const statusVariant = (status: string): BadgeVariant => {
  switch (status.toLowerCase()) {
    case "completed":
    case "delivered":
      return "success";
    case "cancelled":
    case "refunded":
      return "danger";
    case "processing":
    case "confirmed":
    case "shipped":
      return "info";
    case "pending":
      return "warning";
    default:
      return "default";
  }
};

const paymentVariant = (status: string): BadgeVariant => {
  switch (status.toLowerCase()) {
    case "paid":
    case "completed":
      return "success";
    case "failed":
    case "refunded":
      return "danger";
    case "pending":
    case "unpaid":
      return "warning";
    default:
      return "default";
  }
};

const handleUnauthorized = async (error: unknown) => {
  if (
    (isOrderApiError(error) || isUserPaymentApiError(error)) &&
    error.status === 401
  ) {
    await navigateTo({
      path: "/login",
      query: { redirect: "/app/orders" },
    });
    return true;
  }
  return false;
};

const loadOrders = async (requestedPage = page.value) => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const response = await getOrders(requestedPage);
    if (!Array.isArray(response.data.orders)) {
      throw new Error("The orders API returned an invalid order list.");
    }
    orders.value = response.data.orders;
    page.value = requestedPage;
  } catch (error: unknown) {
    if (await handleUnauthorized(error)) return;
    errorMessage.value = isOrderApiError(error)
      ? error.message
      : error instanceof Error
        ? error.message
        : "Could not load your orders.";
    orders.value = [];
  } finally {
    loading.value = false;
  }
};

const openOrder = async (order: UserOrderListItem) => {
  selectedOrderId.value = order.id;
  selectedOrder.value = null;
  isDetailOpen.value = true;
  await loadOrderDetails(order.id);
};

const loadOrderDetails = async (orderId: number) => {
  detailLoading.value = true;
  detailError.value = "";
  try {
    const response = await getOrder(orderId);
    selectedOrder.value = response.data.order;
  } catch (error: unknown) {
    if (await handleUnauthorized(error)) return;
    detailError.value = isOrderApiError(error)
      ? error.message
      : error instanceof Error
        ? error.message
        : "Could not load order details.";
  } finally {
    detailLoading.value = false;
  }
};

const refreshAfterHistoryRestore = async (
  event: Pick<PageTransitionEvent, "persisted">,
) => {
  if (!event.persisted) return;

  await loadOrders();
  if (isDetailOpen.value && selectedOrderId.value !== null) {
    await loadOrderDetails(selectedOrderId.value);
  }
  await notificationStore.refreshNotifications();
};

const retryOnlinePayment = async (order: UserOrderListItem | UserOrder) => {
  if (
    !isOnlinePaymentRetryEligible(order) ||
    paymentLoading.value[order.id]
  ) {
    return;
  }

  paymentLoading.value[order.id] = true;
  paymentErrors.value[order.id] = "";
  try {
    let paymentUrl = paymentUrls.value[order.id];
    if (!paymentUrl) {
      const response = await createPayment({
        order_id: order.id,
        method: "online",
      });
      if (!isHttpPaymentUrl(response?.data?.payment_url)) {
        paymentErrors.value[order.id] =
          "The payment service returned an invalid link. Select Retry payment to request another link.";
        return;
      }
      paymentUrl = response.data.payment_url;
      paymentUrls.value[order.id] = paymentUrl;
    }

    try {
      const navigationResult = await navigateTo(paymentUrl, { external: true });
      if (navigationResult !== undefined) {
        throw new Error("Payment navigation was not completed.");
      }
    } catch {
      paymentErrors.value[order.id] =
        "The payment link is ready, but could not be opened. Select Retry payment to try again.";
    }
  } catch (error: unknown) {
    if (await handleUnauthorized(error)) return;
    paymentErrors.value[order.id] = isUserPaymentApiError(error)
      ? error.message
      : error instanceof Error
        ? error.message
        : "Could not prepare the payment link. Select Retry payment to try again.";
  } finally {
    paymentLoading.value[order.id] = false;
  }
};

const closeDetails = () => {
  isDetailOpen.value = false;
  selectedOrder.value = null;
  selectedOrderId.value = null;
  detailError.value = "";
};

const changePage = async (nextPage: number) => {
  if (loading.value || nextPage < 1 || nextPage === page.value) return;
  await loadOrders(nextPage);
};

watch([search, statusFilter], () => {
  if (page.value !== 1) void changePage(1);
});

onMounted(() => {
  void loadOrders(1);
  window.addEventListener("pageshow", refreshAfterHistoryRestore);
});

onBeforeUnmount(() => {
  window.removeEventListener("pageshow", refreshAfterHistoryRestore);
});
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="My orders"
      subtitle="Track your purchases, payment status, and delivery details."
    >
      <template #actions>
        <AppButton
          variant="secondary"
          :loading="loading"
          :disabled="loading"
          @click="loadOrders()"
        >
          <RefreshCw class="h-4 w-4" />
          Refresh
        </AppButton>
      </template>
    </PageHeader>

    <AlertMessage v-if="errorMessage" type="error" :message="errorMessage">
      <AppButton
        variant="secondary"
        size="sm"
        :loading="loading"
        @click="loadOrders()"
      >
        Try again
      </AppButton>
    </AlertMessage>

    <div class="grid gap-4 sm:grid-cols-3">
      <StatsCard
        title="Orders on this page"
        :value="pageStats.orders"
        subtitle="Up to 15 orders per page"
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
        :value="pageStats.pending"
        subtitle="On this page"
        tone="warning"
      >
        <template #badge>
          <AppBadge variant="warning" shape="square" size="md">
            <Clock3 class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>
      <StatsCard
        title="Payment pending"
        :value="pageStats.unpaid"
        subtitle="On this page"
        tone="default"
      >
        <template #badge>
          <AppBadge variant="default" shape="square" size="md">
            <CreditCard class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>
    </div>

    <FilterBar title="Find an order" subtitle="Search and filter the orders on this page.">
      <AppInput
        v-model="search"
        label="Order number"
        placeholder="Search order number..."
      >
        <template #icon>
          <Search class="h-5 w-5" />
        </template>
      </AppInput>

      <AppSelect
        v-model="statusFilter"
        label="Order status"
        placeholder="All statuses"
        :options="statusOptions"
      />
      <template #actions>
        <button
          v-if="search || statusFilter"
          type="button"
          class="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-card-foreground"
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
      {{ visibleOrders.length }} matching
      {{ visibleOrders.length === 1 ? "order" : "orders" }} on page {{ page }}.
      Search and status filters apply to this page only.
    </p>

    <DataTable
      :columns="columns"
      :rows="visibleOrders"
      :loading="loading"
      empty-title="No orders found"
      :empty-message="
        orders.length
          ? 'No orders on this page match your filters.'
          : page > 1
            ? 'There are no more orders on this page.'
            : 'Your orders will appear here after you place an order.'
      "
    >
      <template #cell-order="{ row }">
        <div class="flex items-center gap-3">
          <AppBadge variant="info" shape="square" size="md">
            <Package class="h-5 w-5" />
          </AppBadge>
          <div>
            <p class="font-bold text-card-foreground">{{ row.order_number }}</p>
            <p class="text-xs text-muted-foreground">Order #{{ row.id }}</p>
          </div>
        </div>
      </template>
      <template #cell-delivery="{ row }">
        <div class="max-w-48">
          <p class="truncate font-semibold text-card-foreground">
            {{ row.shipping?.name || "Recipient unavailable" }}
          </p>
          <p class="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin class="h-3 w-3 shrink-0" />
            {{ [row.shipping?.city, row.shipping?.country].filter(Boolean).join(", ") || "Address unavailable" }}
          </p>
        </div>
      </template>
      <template #cell-payment="{ row }">
        <AppBadge :variant="paymentVariant(row.payment_status)">
          {{ formatLabel(row.payment_status) }}
        </AppBadge>
      </template>
      <template #cell-status="{ row }">
        <AppBadge :variant="statusVariant(row.status)">
          {{ formatLabel(row.status) }}
        </AppBadge>
      </template>
      <template #cell-total="{ row }">
        <span class="font-bold text-card-foreground">
          {{ formatPrice(row.total) }}
        </span>
      </template>
      <template #cell-created_at="{ row }">
        <span class="text-sm text-muted-foreground">{{ formatDate(row.created_at) }}</span>
      </template>
      <template #cell-actions="{ row }">
        <div class="flex flex-col items-end gap-2">
          <div class="flex flex-wrap justify-end gap-2">
            <AppButton
              v-if="isOnlinePaymentRetryEligible(row)"
              size="sm"
              :loading="paymentLoading[row.id]"
              :disabled="paymentLoading[row.id]"
              @click="retryOnlinePayment(row)"
            >
              <LockKeyhole class="h-4 w-4" />
              Retry payment
            </AppButton>
            <AppButton variant="secondary" size="sm" @click="openOrder(row)">
              <Eye class="h-4 w-4" />
              Details
            </AppButton>
          </div>
          <AlertMessage
            v-if="paymentErrors[row.id]"
            type="error"
            :message="paymentErrors[row.id]"
          />
        </div>
      </template>
    </DataTable>

    <nav
      class="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Order pages"
    >
      <p class="text-sm text-muted-foreground">
        Page {{ page }} <span class="hidden sm:inline">· 15 orders per API page</span>
      </p>
      <div class="flex items-center justify-between gap-2 sm:justify-end">
        <AppButton
          variant="secondary"
          size="sm"
          :disabled="loading || page <= 1"
          @click="changePage(page - 1)"
        >
          <ChevronLeft class="h-4 w-4" />
          Previous
        </AppButton>
        <AppButton
          variant="secondary"
          size="sm"
          :disabled="loading || !hasNextPage"
          @click="changePage(page + 1)"
        >
          Next
          <ChevronRight class="h-4 w-4" />
        </AppButton>
      </div>
    </nav>
    <p class="text-xs text-muted-foreground">
      The orders API returns up to 15 records per page without total-count metadata.
      Next is available when the current page is full.
    </p>

    <AppModal
      :open="isDetailOpen"
      :title="selectedOrder?.order_number || 'Order details'"
      :subtitle="
        selectedOrder
          ? `Order #${selectedOrder.id} · Placed ${formatDate(selectedOrder.created_at)}`
          : 'Loading order information'
      "
      size="lg"
      @close="closeDetails"
    >
      <div v-if="detailLoading" class="space-y-4">
        <div class="h-5 w-1/3 animate-pulse rounded bg-muted" />
        <div class="h-24 animate-pulse rounded-2xl bg-muted" />
        <div class="h-32 animate-pulse rounded-2xl bg-muted" />
      </div>
      <AlertMessage v-else-if="detailError" type="error" :message="detailError">
        <AppButton
          v-if="selectedOrderId"
          variant="secondary"
          size="sm"
          @click="loadOrderDetails(selectedOrderId)"
        >
          Try again
        </AppButton>
      </AlertMessage>
      <div v-else-if="selectedOrder" class="space-y-6">
        <div class="grid gap-4 sm:grid-cols-2">
          <section class="rounded-2xl border border-border bg-muted/30 p-4">
            <h3 class="text-sm font-bold text-card-foreground">Order status</h3>
            <div class="mt-3 flex flex-wrap gap-2">
              <AppBadge :variant="statusVariant(selectedOrder.status)">
                {{ formatLabel(selectedOrder.status) }}
              </AppBadge>
              <AppBadge :variant="paymentVariant(selectedOrder.payment_status)">
                {{ formatLabel(selectedOrder.payment_status) }}
              </AppBadge>
            </div>
            <p class="mt-4 text-xs text-muted-foreground">
              Last updated {{ formatDate(selectedOrder.updated_at) }}
            </p>
          </section>
          <section class="rounded-2xl border border-border bg-muted/30 p-4">
            <h3 class="flex items-center gap-2 text-sm font-bold text-card-foreground">
              <Truck class="h-4 w-4" />
              Shipping address
            </h3>
            <p class="mt-3 font-semibold text-card-foreground">
              {{ selectedOrder.shipping.name }}
            </p>
            <p class="text-sm text-muted-foreground">{{ selectedOrder.shipping.phone }}</p>
            <p class="mt-2 text-sm leading-5 text-muted-foreground">
              {{ selectedOrder.shipping.address }}<br />
              {{
                [
                  selectedOrder.shipping.city,
                  selectedOrder.shipping.province,
                  selectedOrder.shipping.postal_code,
                ]
                  .filter(Boolean)
                  .join(", ")
              }}<br />
              {{ selectedOrder.shipping.country }}
            </p>
          </section>
        </div>

        <section>
          <h3 class="mb-3 text-sm font-bold text-card-foreground">Items in this order</h3>
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
                    <span
                      v-if="item.variant_name"
                      class="block text-xs text-muted-foreground"
                    >
                      {{ item.variant_name }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-muted-foreground">{{ item.sku || "—" }}</td>
                  <td class="px-4 py-3 text-right text-card-foreground">{{ item.quantity }}</td>
                  <td class="px-4 py-3 text-right text-card-foreground">
                    {{ formatPrice(item.unit_price) }}
                  </td>
                  <td class="px-4 py-3 text-right font-semibold text-card-foreground">
                    {{ formatPrice(item.total) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div
          v-if="selectedOrder.customer_note"
          class="rounded-2xl border border-border bg-muted/30 p-4"
        >
          <h3 class="text-sm font-bold text-card-foreground">Note for this order</h3>
          <p class="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
            {{ selectedOrder.customer_note }}
          </p>
        </div>

        <section class="ml-auto max-w-sm space-y-3 border-t border-border pt-4 text-sm">
          <div class="flex justify-between gap-4">
            <span class="text-muted-foreground">Subtotal</span>
            <span>{{ formatPrice(selectedOrder.subtotal) }}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-muted-foreground">Shipping</span>
            <span>{{ formatPrice(selectedOrder.shipping_fee) }}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-muted-foreground">Discount</span>
            <span>−{{ formatPrice(selectedOrder.discount) }}</span>
          </div>
          <div class="flex justify-between gap-4 border-t border-border pt-3 text-base font-bold text-card-foreground">
            <span>Total</span>
            <span>{{ formatPrice(selectedOrder.total) }}</span>
          </div>
        </section>

        <div
          v-if="isOnlinePaymentRetryEligible(selectedOrder)"
          class="ml-auto max-w-sm space-y-3"
        >
          <AppButton
            :loading="paymentLoading[selectedOrder.id]"
            :disabled="paymentLoading[selectedOrder.id]"
            @click="retryOnlinePayment(selectedOrder)"
          >
            <LockKeyhole class="h-4 w-4" />
            Retry payment
          </AppButton>
          <AlertMessage
            v-if="paymentErrors[selectedOrder.id]"
            type="error"
            :message="paymentErrors[selectedOrder.id]"
          />
        </div>
      </div>
    </AppModal>
  </div>
</template>

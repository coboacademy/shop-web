<script setup lang="ts">
import {
  ArrowDownRight,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Truck,
} from "lucide-vue-next";
import {
  useUserOrder,
  type UserOrderApiError,
  type UserOrderListItem,
} from "~/composables/useUserOrder";
import {
  useUserShipment,
  type UserShipment,
  type UserShipmentApiError,
} from "~/composables/useUserShipment";

definePageMeta({
  layout: "user",
  middleware: ["auth", "permission"],
  permission: "order.view",
  title: "My Shipments",
});

const ORDERS_PER_PAGE = 15;
type BadgeVariant = "default" | "success" | "danger" | "warning" | "info";

const { getOrders } = useUserOrder();
const { getOrderShipments } = useUserShipment();
const orders = ref<UserOrderListItem[]>([]);
const selectedOrder = ref<UserOrderListItem | null>(null);
const shipments = ref<UserShipment[]>([]);
const page = ref(1);
const search = ref("");
const loadingOrders = ref(true);
const loadingShipments = ref(false);
const orderError = ref("");
const shipmentError = ref("");

const isApiError = (
  error: unknown,
): error is UserOrderApiError | UserShipmentApiError =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof error.message === "string" &&
  "status" in error &&
  typeof error.status === "number" &&
  "errors" in error;

const visibleOrders = computed(() => {
  const query = search.value.trim().toLowerCase();
  return orders.value.filter((order) => {
    if (!query) return true;
    return (
      order.order_number.toLowerCase().includes(query) ||
      String(order.id).includes(query)
    );
  });
});

const hasNextPage = computed(() => orders.value.length === ORDERS_PER_PAGE);

const shipmentStats = computed(() => ({
  total: shipments.value.length,
  inTransit: shipments.value.filter((shipment) =>
    ["shipped", "in_transit"].includes(shipment.status.toLowerCase()),
  ).length,
  delivered: shipments.value.filter(
    (shipment) => shipment.status.toLowerCase() === "delivered",
  ).length,
}));

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

const formatDate = (value: string | null | undefined) => {
  if (!value) return "";
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
    case "delivered":
      return "success";
    case "cancelled":
      return "danger";
    case "shipped":
    case "in_transit":
      return "info";
    case "processing":
      return "warning";
    default:
      return "default";
  }
};

const handleUnauthorized = async (error: unknown) => {
  if (isApiError(error) && error.status === 401) {
    await navigateTo({
      path: "/login",
      query: { redirect: "/app/shipments" },
    });
    return true;
  }
  return false;
};

const loadOrders = async (requestedPage = page.value) => {
  loadingOrders.value = true;
  orderError.value = "";
  selectedOrder.value = null;
  shipments.value = [];
  shipmentError.value = "";

  try {
    const response = await getOrders(requestedPage);
    if (!Array.isArray(response.data.orders)) {
      throw new Error("The orders API returned an invalid order list.");
    }
    orders.value = response.data.orders;
    page.value = requestedPage;
  } catch (error: unknown) {
    if (await handleUnauthorized(error)) return;
    orderError.value = isApiError(error)
      ? error.message
      : error instanceof Error
        ? error.message
        : "Could not load your orders.";
    orders.value = [];
  } finally {
    loadingOrders.value = false;
  }
};

const selectOrder = async (order: UserOrderListItem) => {
  selectedOrder.value = order;
  shipments.value = [];
  shipmentError.value = "";
  loadingShipments.value = true;

  try {
    const response = await getOrderShipments(order.id);
    if (selectedOrder.value?.id !== order.id) return;
    if (!Array.isArray(response.data.shipments)) {
      throw new Error("The shipments API returned an invalid shipment list.");
    }
    shipments.value = response.data.shipments;
  } catch (error: unknown) {
    if (selectedOrder.value?.id !== order.id) return;
    if (await handleUnauthorized(error)) return;
    shipmentError.value = isApiError(error)
      ? error.message
      : error instanceof Error
        ? error.message
        : "Could not load shipments for this order.";
  } finally {
    if (selectedOrder.value?.id === order.id) loadingShipments.value = false;
  }
};

const changePage = async (nextPage: number) => {
  if (loadingOrders.value || nextPage < 1 || nextPage === page.value) return;
  await loadOrders(nextPage);
};

const refreshSelectedOrder = async () => {
  if (selectedOrder.value) await selectOrder(selectedOrder.value);
  else await loadOrders();
};

const deliverySteps = [
  { status: "pending", label: "Shipment created" },
  { status: "processing", label: "Processing" },
  { status: "shipped", label: "Shipped" },
  { status: "in_transit", label: "In transit" },
  { status: "delivered", label: "Delivered" },
];

const stepReached = (shipment: UserShipment, stepIndex: number) => {
  const currentStatus = shipment.status.toLowerCase();
  if (currentStatus === "cancelled") return false;
  const currentIndex = deliverySteps.findIndex(
    (step) => step.status === currentStatus,
  );
  return currentIndex >= stepIndex;
};

const milestoneDate = (shipment: UserShipment, status: string) => {
  if (status === "shipped") return shipment.shipped_at;
  if (status === "delivered") return shipment.delivered_at;
  if (status === "cancelled") return shipment.cancelled_at;
  if (status === "pending") return shipment.created_at;
  return null;
};

onMounted(() => loadOrders(1));
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="My shipments"
      subtitle="Track delivery progress for orders you have placed."
    >
      <template #actions>
        <AppButton
          variant="secondary"
          :loading="loadingOrders || loadingShipments"
          :disabled="loadingOrders || loadingShipments"
          @click="refreshSelectedOrder"
        >
          <RefreshCw class="h-4 w-4" />
          Refresh
        </AppButton>
      </template>
    </PageHeader>

    <AlertMessage v-if="orderError" type="error" :message="orderError">
      <AppButton
        variant="secondary"
        size="sm"
        :loading="loadingOrders"
        @click="loadOrders()"
      >
        Try again
      </AppButton>
    </AlertMessage>

    <section class="rounded-3xl border border-border bg-card p-5 sm:p-7">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Track an order
          </p>
          <h2 class="mt-2 text-xl font-bold text-card-foreground">
            Select one of your orders
          </h2>
          <p class="mt-1 text-sm text-muted-foreground">
            Shipments are listed for the selected order.
          </p>
        </div>
        <div class="w-full sm:max-w-xs">
          <AppInput
            v-model="search"
            label="Search this page"
            placeholder="Order number or ID"
          >
            <template #icon>
              <Search class="h-5 w-5" />
            </template>
          </AppInput>
        </div>
      </div>

      <div
        v-if="loadingOrders"
        class="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
        aria-label="Loading orders"
      >
        <div
          v-for="index in 3"
          :key="index"
          class="h-28 animate-pulse rounded-2xl bg-muted"
        />
      </div>

      <div
        v-else-if="!orderError && !orders.length"
        class="mt-6 rounded-2xl border border-dashed border-border px-6 py-10 text-center"
      >
        <Package class="mx-auto h-8 w-8 text-muted-foreground" />
        <p class="mt-3 font-semibold text-card-foreground">No orders yet</p>
        <p class="mt-1 text-sm text-muted-foreground">
          Once you place an order, its shipment tracking will be available here.
        </p>
        <NuxtLink
          to="/app/orders"
          class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          View orders
          <ArrowDownRight class="h-4 w-4" />
        </NuxtLink>
      </div>

      <div
        v-else-if="!visibleOrders.length"
        class="mt-6 rounded-2xl border border-dashed border-border px-6 py-8 text-center text-sm text-muted-foreground"
      >
        No orders on this page match your search.
      </div>

      <div v-else class="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <button
          v-for="order in visibleOrders"
          :key="order.id"
          type="button"
          :aria-pressed="selectedOrder?.id === order.id"
          :disabled="loadingShipments"
          class="group rounded-2xl border p-4 text-left transition hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-70"
          :class="
            selectedOrder?.id === order.id
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-border bg-background'
          "
          @click="selectOrder(order)"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-center gap-3">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Package class="h-5 w-5" />
              </span>
              <div class="min-w-0">
                <p class="truncate font-bold text-card-foreground">
                  {{ order.order_number }}
                </p>
                <p class="text-xs text-muted-foreground">Order #{{ order.id }}</p>
              </div>
            </div>
            <Check
              v-if="selectedOrder?.id === order.id"
              class="h-5 w-5 shrink-0 text-primary"
            />
          </div>
          <div class="mt-4 flex items-center justify-between gap-3">
            <p class="flex min-w-0 items-center gap-1.5 truncate text-xs text-muted-foreground">
              <MapPin class="h-3.5 w-3.5 shrink-0" />
              {{ [order.shipping?.city, order.shipping?.country].filter(Boolean).join(", ") || "Delivery address" }}
            </p>
            <p class="shrink-0 text-sm font-bold text-card-foreground">
              {{ formatPrice(order.total) }}
            </p>
          </div>
        </button>
      </div>

      <div
        v-if="!loadingOrders && orders.length"
        class="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <p class="text-xs text-muted-foreground">
          Page {{ page }} · Orders API returns up to 15 orders per page.
        </p>
        <div class="flex items-center justify-between gap-2 sm:justify-end">
          <AppButton
            variant="secondary"
            size="sm"
            :disabled="loadingOrders || page <= 1"
            @click="changePage(page - 1)"
          >
            <ChevronLeft class="h-4 w-4" />
            Previous
          </AppButton>
          <AppButton
            variant="secondary"
            size="sm"
            :disabled="loadingOrders || !hasNextPage"
            @click="changePage(page + 1)"
          >
            Next
            <ChevronRight class="h-4 w-4" />
          </AppButton>
        </div>
      </div>
    </section>

    <section v-if="selectedOrder" class="space-y-5">
      <div class="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div class="flex items-start gap-3">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Truck class="h-5 w-5" />
          </span>
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Shipments for
            </p>
            <h2 class="mt-1 text-lg font-bold text-card-foreground">
              {{ selectedOrder.order_number }}
            </h2>
            <p class="mt-1 text-sm text-muted-foreground">
              Order placed {{ formatDate(selectedOrder.created_at) }}
            </p>
          </div>
        </div>
        <div v-if="!loadingShipments && !shipmentError" class="grid grid-cols-3 gap-3 sm:min-w-72">
          <div class="rounded-xl bg-muted/50 px-3 py-2 text-center">
            <p class="text-lg font-bold text-card-foreground">{{ shipmentStats.total }}</p>
            <p class="text-[11px] text-muted-foreground">Shipments</p>
          </div>
          <div class="rounded-xl bg-muted/50 px-3 py-2 text-center">
            <p class="text-lg font-bold text-card-foreground">{{ shipmentStats.inTransit }}</p>
            <p class="text-[11px] text-muted-foreground">In transit</p>
          </div>
          <div class="rounded-xl bg-muted/50 px-3 py-2 text-center">
            <p class="text-lg font-bold text-card-foreground">{{ shipmentStats.delivered }}</p>
            <p class="text-[11px] text-muted-foreground">Delivered</p>
          </div>
        </div>
      </div>

      <AlertMessage
        v-if="shipmentError"
        type="error"
        :message="shipmentError"
      >
        <AppButton
          variant="secondary"
          size="sm"
          :loading="loadingShipments"
          @click="refreshSelectedOrder"
        >
          Try again
        </AppButton>
      </AlertMessage>

      <div v-else-if="loadingShipments" class="space-y-4" aria-label="Loading shipments">
        <div v-for="index in 2" :key="index" class="h-64 animate-pulse rounded-3xl bg-muted" />
      </div>

      <div
        v-else-if="!shipments.length"
        class="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center"
      >
        <Clock3 class="mx-auto h-8 w-8 text-muted-foreground" />
        <h3 class="mt-3 font-bold text-card-foreground">No shipment created yet</h3>
        <p class="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
          There are no shipments associated with this order at the moment. Check back later for tracking updates.
        </p>
      </div>

      <article
        v-for="shipment in shipments"
        v-else
        :key="shipment.id"
        class="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
      >
        <div class="flex flex-col gap-4 border-b border-border bg-muted/20 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div class="flex items-start gap-3">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Truck class="h-5 w-5" />
            </span>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="font-bold text-card-foreground">
                  Shipment #{{ shipment.id }}
                </h3>
                <AppBadge :variant="statusVariant(shipment.status)" dot>
                  {{ formatLabel(shipment.status) }}
                </AppBadge>
              </div>
              <p class="mt-1 text-sm text-muted-foreground">
                Created {{ formatDate(shipment.created_at) }}
              </p>
            </div>
          </div>
          <div class="rounded-2xl border border-border bg-background px-4 py-3 sm:min-w-64">
            <p class="text-xs font-medium text-muted-foreground">Tracking number</p>
            <p class="mt-1 break-all font-mono text-sm font-bold text-card-foreground">
              {{ shipment.tracking_number || "Not assigned" }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              {{ shipment.carrier || "Carrier not specified" }}
            </p>
          </div>
        </div>

        <div class="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section>
            <h4 class="text-sm font-bold text-card-foreground">Delivery progress</h4>
            <div
              v-if="shipment.status.toLowerCase() === 'cancelled'"
              class="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"
            >
              <CircleHelp class="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p class="text-sm font-semibold">This shipment was cancelled</p>
                <p v-if="shipment.cancelled_at" class="mt-1 text-xs opacity-80">
                  {{ formatDate(shipment.cancelled_at) }}
                </p>
              </div>
            </div>
            <ol v-else class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
              <li
                v-for="(step, index) in deliverySteps"
                :key="step.status"
                class="relative flex items-start gap-3 sm:block"
              >
                <span
                  class="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
                  :class="
                    stepReached(shipment, index)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground'
                  "
                >
                  <Check v-if="stepReached(shipment, index)" class="h-4 w-4" />
                  <span v-else class="h-2 w-2 rounded-full bg-current" />
                </span>
                <span
                  v-if="index < deliverySteps.length - 1"
                  class="absolute left-4 top-8 hidden h-0.5 w-[calc(100%-1rem)] sm:block"
                  :class="stepReached(shipment, index + 1) ? 'bg-primary' : 'bg-border'"
                />
                <div class="sm:mt-3">
                  <p
                    class="text-xs font-semibold"
                    :class="stepReached(shipment, index) ? 'text-card-foreground' : 'text-muted-foreground'"
                  >
                    {{ step.label }}
                  </p>
                  <p
                    v-if="milestoneDate(shipment, step.status)"
                    class="mt-1 text-[11px] text-muted-foreground"
                  >
                    {{ formatDate(milestoneDate(shipment, step.status)) }}
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <aside class="space-y-4">
            <div class="rounded-2xl border border-border bg-muted/30 p-4">
              <h4 class="text-sm font-bold text-card-foreground">Shipment summary</h4>
              <dl class="mt-3 space-y-3 text-sm">
                <div class="flex justify-between gap-3">
                  <dt class="text-muted-foreground">Shipping fee</dt>
                  <dd class="font-semibold text-card-foreground">
                    {{ formatPrice(shipment.shipping_fee) }}
                  </dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-muted-foreground">Last updated</dt>
                  <dd class="text-right text-xs text-card-foreground">
                    {{ formatDate(shipment.updated_at) }}
                  </dd>
                </div>
              </dl>
            </div>
            <div
              v-if="shipment.notes"
              class="rounded-2xl border border-border bg-muted/30 p-4"
            >
              <h4 class="text-sm font-bold text-card-foreground">Shipment note</h4>
              <p class="mt-2 whitespace-pre-wrap text-sm leading-5 text-muted-foreground">
                {{ shipment.notes }}
              </p>
            </div>
          </aside>

          <section class="lg:col-span-2">
            <h4 class="mb-3 text-sm font-bold text-card-foreground">
              Items in this shipment
            </h4>
            <div class="divide-y divide-border rounded-2xl border border-border">
              <div
                v-for="item in shipment.items"
                :key="item.id"
                class="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div class="flex min-w-0 items-start gap-3">
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Package class="h-4 w-4" />
                  </span>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-card-foreground">
                      {{ item.product_name || "Product" }}
                    </p>
                    <p class="mt-0.5 text-xs text-muted-foreground">
                      <span v-if="item.variant_name">{{ item.variant_name }} · </span>
                      SKU {{ item.sku || "—" }}
                    </p>
                  </div>
                </div>
                <p class="shrink-0 text-sm font-semibold text-card-foreground">
                  Qty {{ item.quantity }}
                </p>
              </div>
              <p
                v-if="!shipment.items.length"
                class="px-4 py-5 text-sm text-muted-foreground"
              >
                Item information is unavailable for this shipment.
              </p>
            </div>
          </section>
        </div>
      </article>
    </section>

    <div
      v-else
      class="flex items-start gap-3 rounded-2xl border border-border bg-muted/30 p-4"
    >
      <CircleHelp class="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      <p class="text-sm leading-5 text-muted-foreground">
        Choose an order above to view its shipment tracking and included items.
      </p>
    </div>

    <NuxtLink
      to="/app/orders"
      class="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
    >
      <ArrowLeft class="h-4 w-4" />
      Back to my orders
    </NuxtLink>
  </div>
</template>

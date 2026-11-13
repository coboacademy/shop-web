<script setup lang="ts">
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  Info,
  RefreshCw,
  WalletCards,
} from "lucide-vue-next";
import {
  useUserOrder,
  type UserOrderApiError,
  type UserOrderListItem,
} from "~/composables/useUserOrder";
import {
  useUserPayment,
  type UserPayment,
  type UserPaymentApiError,
  type UserPaymentMethod,
} from "~/composables/useUserPayment";

definePageMeta({
  layout: "user",
  middleware: ["auth", "permission"],
  permission: "order.view",
  title: "Payments",
});

type BadgeVariant = "default" | "success" | "danger" | "warning" | "info";

const { getOrders } = useUserOrder();
const { createPayment, getPayment } = useUserPayment();
const toast = useToast();
const orders = ref<UserOrderListItem[]>([]);
const payments = ref<Record<number, UserPayment>>({});
const paymentErrors = ref<Record<number, string>>({});
const paymentLoading = ref<Record<number, boolean>>({});
const loading = ref(true);
const page = ref(1);
const errorMessage = ref("");
const selectedOrder = ref<UserOrderListItem | null>(null);
const selectedMethod = ref<UserPaymentMethod>("online");
const provider = ref("");
const creatingPayment = ref(false);
const modalError = ref("");
const createdPayment = ref<UserPayment | null>(null);
const isPaymentModalOpen = ref(false);

const isPaymentApiError = (
  error: unknown,
): error is UserOrderApiError | UserPaymentApiError =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof error.message === "string" &&
  "status" in error &&
  typeof error.status === "number" &&
  "errors" in error;

const pageStats = computed(() => ({
  orders: orders.value.length,
  pending: orders.value.filter(
    (order) => payments.value[order.id]?.status.toLowerCase() === "pending",
  ).length,
  recorded: orders.value.filter((order) => Boolean(payments.value[order.id])).length,
}));

const hasNextPage = computed(() => orders.value.length === 15);

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
    case "paid":
    case "completed":
      return "success";
    case "failed":
    case "refunded":
      return "danger";
    case "pending":
      return "warning";
    default:
      return "default";
  }
};

const paymentMethodOptions: Array<{ label: string; value: UserPaymentMethod }> = [
  { label: "Online", value: "online" },
  { label: "Bank transfer", value: "bank_transfer" },
  { label: "Cash on delivery", value: "cash_on_delivery" },
];

const handleUnauthorized = async (error: unknown) => {
  if (isPaymentApiError(error) && error.status === 401) {
    await navigateTo({
      path: "/login",
      query: { redirect: "/app/payments" },
    });
    return true;
  }
  return false;
};

const loadOrders = async (requestedPage = page.value) => {
  loading.value = true;
  errorMessage.value = "";
  paymentErrors.value = {};
  paymentLoading.value = {};
  try {
    const response = await getOrders(requestedPage);
    if (!Array.isArray(response.data.orders)) {
      throw new Error("The orders API returned an invalid order list.");
    }
    orders.value = response.data.orders;
    page.value = requestedPage;
  } catch (error: unknown) {
    if (await handleUnauthorized(error)) return;
    errorMessage.value = isPaymentApiError(error)
      ? error.message
      : error instanceof Error
        ? error.message
        : "Could not load your orders.";
    orders.value = [];
  } finally {
    loading.value = false;
  }
};

const openPaymentForm = (order: UserOrderListItem) => {
  selectedOrder.value = order;
  selectedMethod.value = "online";
  provider.value = "";
  createdPayment.value = null;
  modalError.value = "";
  isPaymentModalOpen.value = true;
};

const submitPayment = async () => {
  if (!selectedOrder.value || creatingPayment.value) return;
  creatingPayment.value = true;
  modalError.value = "";

  try {
    const response = await createPayment({
      order_id: selectedOrder.value.id,
      method: selectedMethod.value,
      provider: provider.value.trim() || null,
    });
    const payment = response.data.payment;
    payments.value[selectedOrder.value.id] = payment;
    createdPayment.value = payment;
    toast.success("Payment record saved", response.message);
  } catch (error: unknown) {
    if (await handleUnauthorized(error)) return;
    modalError.value = isPaymentApiError(error)
      ? error.message
      : error instanceof Error
        ? error.message
        : "Could not create a payment record.";
    toast.error("Payment request failed", modalError.value);
  } finally {
    creatingPayment.value = false;
  }
};

const loadPaymentDetails = async (order: UserOrderListItem) => {
  const payment = payments.value[order.id];
  if (!payment || paymentLoading.value[order.id]) return;

  paymentLoading.value[order.id] = true;
  paymentErrors.value[order.id] = "";
  try {
    const response = await getPayment(payment.id);
    payments.value[order.id] = response.data.payment;
  } catch (error: unknown) {
    if (await handleUnauthorized(error)) return;
    paymentErrors.value[order.id] = isPaymentApiError(error)
      ? error.message
      : error instanceof Error
        ? error.message
        : "Could not refresh payment details.";
  } finally {
    paymentLoading.value[order.id] = false;
  }
};

const changePage = async (nextPage: number) => {
  if (loading.value || nextPage < 1 || nextPage === page.value) return;
  await loadOrders(nextPage);
};

const closePaymentModal = () => {
  if (creatingPayment.value) return;
  isPaymentModalOpen.value = false;
  selectedOrder.value = null;
  createdPayment.value = null;
  modalError.value = "";
};

onMounted(() => loadOrders(1));
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Payments"
      subtitle="Review payment status for your orders and record a payment method."
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
            <WalletCards class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>
      <StatsCard
        title="Records viewed"
        :value="pageStats.recorded"
        subtitle="During this visit"
        tone="success"
      >
        <template #badge>
          <AppBadge variant="success" shape="square" size="md">
            <CreditCard class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>
      <StatsCard
        title="Pending records"
        :value="pageStats.pending"
        subtitle="Payment not confirmed"
        tone="warning"
      >
        <template #badge>
          <AppBadge variant="warning" shape="square" size="md">
            <Clock3 class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>
    </div>

    <div
      class="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200"
    >
      <Info class="mt-0.5 h-5 w-5 shrink-0" />
      <p class="text-sm leading-5">
        The payment API records a method and creates a pending payment record. It does
        not charge a payment provider or confirm that payment was received. There is
        no payment-list endpoint, so this page uses your orders' payment status and
        displays payment details only when a record is returned by the API.
      </p>
    </div>

    <section class="overflow-hidden rounded-3xl border border-border bg-card">
      <div class="border-b border-border px-5 py-4 sm:px-6">
        <h2 class="font-bold text-card-foreground">Payments by order</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          Review order payment status or request a payment record.
        </p>
      </div>

      <div v-if="loading" class="space-y-3 p-5" aria-label="Loading payments">
        <div v-for="index in 4" :key="index" class="h-24 animate-pulse rounded-2xl bg-muted" />
      </div>

      <div
        v-else-if="!orders.length && !errorMessage"
        class="px-6 py-14 text-center"
      >
        <CreditCard class="mx-auto h-9 w-9 text-muted-foreground" />
        <h3 class="mt-3 font-bold text-card-foreground">No orders to pay</h3>
        <p class="mt-1 text-sm text-muted-foreground">
          Your payment records will appear here alongside your orders.
        </p>
        <NuxtLink
          to="/products"
          class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          Browse products
          <ArrowUpRight class="h-4 w-4" />
        </NuxtLink>
      </div>

      <div v-else class="divide-y divide-border">
        <article
          v-for="order in orders"
          :key="order.id"
          class="p-5 transition hover:bg-muted/20 sm:px-6"
        >
          <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div class="flex min-w-0 items-start gap-3">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <CreditCard class="h-5 w-5" />
              </span>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="font-bold text-card-foreground">
                    {{ order.order_number }}
                  </h3>
                  <AppBadge :variant="statusVariant(order.payment_status)">
                    {{ formatLabel(order.payment_status) }}
                  </AppBadge>
                  <AppBadge v-if="payments[order.id]" :variant="statusVariant(payments[order.id].status)">
                    {{ formatLabel(payments[order.id].status) }}
                  </AppBadge>
                </div>
                <p class="mt-1 text-xs text-muted-foreground">
                  Order #{{ order.id }} · Placed {{ formatDate(order.created_at) }}
                </p>
                <p class="mt-2 text-lg font-bold text-card-foreground">
                  {{ formatPrice(order.total) }}
                </p>
              </div>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div
                v-if="payments[order.id]"
                class="min-w-48 rounded-xl border border-border bg-background px-3 py-2"
              >
                <p class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Payment method
                </p>
                <p class="mt-0.5 text-sm font-semibold text-card-foreground">
                  {{ formatLabel(payments[order.id].method) }}
                  <span v-if="payments[order.id].provider" class="font-normal text-muted-foreground">
                    · {{ payments[order.id].provider }}
                  </span>
                </p>
              </div>

              <AppButton
                v-if="payments[order.id]"
                variant="secondary"
                size="sm"
                :loading="paymentLoading[order.id]"
                :disabled="paymentLoading[order.id]"
                @click="loadPaymentDetails(order)"
              >
                <RefreshCw class="h-4 w-4" />
                Refresh details
              </AppButton>
              <AppButton
                v-else-if="!['paid', 'cancelled'].includes(order.payment_status.toLowerCase()) && !['cancelled'].includes(order.status.toLowerCase())"
                :loading="paymentLoading[order.id]"
                :disabled="paymentLoading[order.id]"
                @click="openPaymentForm(order)"
              >
                <CreditCard class="h-4 w-4" />
                Create or view payment record
              </AppButton>
              <p
                v-else-if="order.payment_status.toLowerCase() === 'paid'"
                class="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300"
              >
                <CheckCircle2 class="h-4 w-4" />
                Paid
              </p>
              <p v-else class="text-sm text-muted-foreground">
                Payment unavailable for this order
              </p>
            </div>
          </div>

          <AlertMessage
            v-if="paymentErrors[order.id]"
            class="mt-4"
            type="error"
            :message="paymentErrors[order.id]"
          >
            <AppButton
              variant="secondary"
              size="sm"
              :loading="paymentLoading[order.id]"
              @click="payments[order.id] ? loadPaymentDetails(order) : openPaymentForm(order)"
            >
              Try again
            </AppButton>
          </AlertMessage>

          <div
            v-if="payments[order.id]"
            class="mt-4 grid gap-3 rounded-2xl bg-muted/40 p-4 text-sm sm:grid-cols-2 xl:grid-cols-4"
          >
            <div>
              <p class="text-xs text-muted-foreground">Payment record</p>
              <p class="mt-1 font-semibold text-card-foreground">#{{ payments[order.id].id }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Amount</p>
              <p class="mt-1 font-semibold text-card-foreground">{{ formatPrice(payments[order.id].amount) }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Transaction ID</p>
              <p class="mt-1 break-all font-medium text-card-foreground">
                {{ payments[order.id].transaction_id || "Not assigned" }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">
                {{ payments[order.id].paid_at ? "Paid at" : payments[order.id].failed_at ? "Failed at" : "Record created" }}
              </p>
              <p class="mt-1 font-medium text-card-foreground">
                {{ formatDate(payments[order.id].paid_at || payments[order.id].failed_at || payments[order.id].created_at) }}
              </p>
            </div>
            <p
              v-if="payments[order.id].failure_reason"
              class="flex items-start gap-2 text-sm text-destructive sm:col-span-2 xl:col-span-4"
            >
              <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
              {{ payments[order.id].failure_reason }}
            </p>
          </div>
        </article>
      </div>

      <div
        v-if="!loading && orders.length"
        class="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <p class="text-xs text-muted-foreground">
          Page {{ page }} · Orders API returns up to 15 orders per page.
        </p>
        <div class="flex items-center justify-between gap-2 sm:justify-end">
          <AppButton
            variant="secondary"
            size="sm"
            :disabled="loading || page <= 1"
            @click="changePage(page - 1)"
          >
            Previous
          </AppButton>
          <AppButton
            variant="secondary"
            size="sm"
            :disabled="loading || !hasNextPage"
            @click="changePage(page + 1)"
          >
            Next
          </AppButton>
        </div>
      </div>
    </section>

    <AppModal
      :open="isPaymentModalOpen"
      :title="createdPayment ? 'Payment record created' : 'Record payment method'"
      :subtitle="
        selectedOrder
          ? `${selectedOrder.order_number} · ${formatPrice(selectedOrder.total)}`
          : ''
      "
      size="md"
      @close="closePaymentModal"
    >
      <div v-if="createdPayment" class="space-y-5">
        <div class="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <Clock3 class="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p class="font-semibold">Payment is pending</p>
            <p class="mt-1 text-sm leading-5">
              A payment record has been saved. No charge was made and the API has
              not confirmed receipt of payment.
            </p>
          </div>
        </div>
        <dl class="grid gap-3 rounded-2xl bg-muted/40 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt class="text-xs text-muted-foreground">Payment record</dt>
            <dd class="mt-1 font-semibold">#{{ createdPayment.id }}</dd>
          </div>
          <div>
            <dt class="text-xs text-muted-foreground">Status</dt>
            <dd class="mt-1"><AppBadge :variant="statusVariant(createdPayment.status)">{{ formatLabel(createdPayment.status) }}</AppBadge></dd>
          </div>
          <div>
            <dt class="text-xs text-muted-foreground">Method</dt>
            <dd class="mt-1 font-semibold">{{ formatLabel(createdPayment.method) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-muted-foreground">Amount</dt>
            <dd class="mt-1 font-semibold">{{ formatPrice(createdPayment.amount) }}</dd>
          </div>
        </dl>
        <div class="flex justify-end">
          <AppButton @click="closePaymentModal">Done</AppButton>
        </div>
      </div>

      <form v-else class="space-y-5" @submit.prevent="submitPayment">
        <AlertMessage
          type="warning"
          message="This creates a pending payment record only; it will not charge you or contact a payment provider. If a record already exists for this order, the API returns that record and ignores any new method or provider values."
        />
        <label class="block">
          <span class="mb-2 block text-sm font-medium">Payment method</span>
          <select
            v-model="selectedMethod"
            required
            class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option
              v-for="option in paymentMethodOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="mb-2 block text-sm font-medium">Provider (optional)</span>
          <input
            v-model="provider"
            maxlength="100"
            class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Provider name, if applicable"
          />
        </label>
        <AlertMessage v-if="modalError" type="error" :message="modalError" />
        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <AppButton
            variant="secondary"
            :disabled="creatingPayment"
            @click="closePaymentModal"
          >
            Cancel
          </AppButton>
          <AppButton type="submit" :loading="creatingPayment">
            Save payment method
          </AppButton>
        </div>
      </form>
    </AppModal>
  </div>
</template>

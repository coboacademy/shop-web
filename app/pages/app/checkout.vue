<script setup lang="ts">
import {
  ArrowLeft,
  CheckCircle2,
  LockKeyhole,
  PackageCheck,
  ShoppingBag,
  Truck,
} from "lucide-vue-next";
import {
  useCheckout,
  type CheckoutApiError,
  type CheckoutPayload,
  type CheckoutSummary,
  type CreatedOrder,
} from "~/composables/useCheckout";
import {
  useUserPayment,
  type UserPayment,
  type UserPaymentApiError,
} from "~/composables/useUserPayment";

definePageMeta({
  layout: "user",
  middleware: ["auth", "permission"],
  permission: "account.view",
  title: "Checkout",
});

const { getCheckout, validateCheckout, createOrder } = useCheckout();
const { createPayment } = useUserPayment();
const toast = useToast();
const checkout = ref<CheckoutSummary | null>(null);
const validatedCheckout = ref<CheckoutSummary | null>(null);
const completedOrder = ref<CreatedOrder | null>(null);
const onlineOrder = ref<CreatedOrder | null>(null);
const onlinePayment = ref<UserPayment | null>(null);
const paymentUrl = ref<string | null>(null);
const paymentPreparationError = ref("");
const loading = ref(true);
const submitting = ref(false);
const emptyCart = ref(false);
const errorMessage = ref("");
const cartError = ref("");
const fieldErrors = reactive<Record<string, string>>({});

const form = reactive({
  shipping_name: "",
  shipping_phone: "",
  shipping_country: "",
  shipping_province: "",
  shipping_city: "",
  shipping_address: "",
  shipping_postal_code: "",
  customer_note: "",
});

const isCheckoutApiError = (error: unknown): error is CheckoutApiError =>
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

const isHttpPaymentUrl = (value: unknown): value is string => {
  if (typeof value !== "string" || !value.trim()) return false;
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

const formatPrice = (price: string | number | null | undefined) => {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const payloadFromForm = (): CheckoutPayload => ({
  shipping_name: form.shipping_name.trim(),
  shipping_phone: form.shipping_phone.trim(),
  shipping_country: form.shipping_country.trim(),
  shipping_province: form.shipping_province.trim(),
  shipping_city: form.shipping_city.trim(),
  shipping_address: form.shipping_address.trim(),
  shipping_postal_code: form.shipping_postal_code.trim() || null,
});

const applyApiErrors = (error: CheckoutApiError) => {
  for (const [field, messages] of Object.entries(error.errors)) {
    if (field === "items") {
      cartError.value = messages[0] || error.message;
    } else {
      fieldErrors[field] = messages[0] || "";
    }
  }
};

const handleUnauthorized = async (error: unknown) => {
  if (isCheckoutApiError(error) && error.status === 401) {
    await navigateTo({
      path: "/login",
      query: { redirect: "/app/checkout" },
    });
    return true;
  }
  return false;
};

const loadCheckout = async () => {
  loading.value = true;
  errorMessage.value = "";
  emptyCart.value = false;
  try {
    const response = await getCheckout();
    checkout.value = response.data.checkout;
    emptyCart.value = !response.data.checkout.items.length;
  } catch (error: unknown) {
    if (await handleUnauthorized(error)) return;
    if (isCheckoutApiError(error) && error.status === 404) {
      emptyCart.value = true;
    } else {
      errorMessage.value = isCheckoutApiError(error)
        ? error.message
        : "Could not load checkout.";
    }
  } finally {
    loading.value = false;
  }
};

const openPaymentLink = async () => {
  if (!paymentUrl.value) return;

  try {
    const result = await navigateTo(paymentUrl.value, { external: true });
    if (result !== undefined) {
      throw new Error("Payment navigation was not completed.");
    }
    paymentPreparationError.value = "";
  } catch {
    paymentPreparationError.value =
      "Your order and payment link are ready, but we could not open the link. Select Continue to payment to try again.";
  }
};

const prepareOnlinePayment = async (order: CreatedOrder) => {
  paymentPreparationError.value = "";

  let response: Awaited<ReturnType<typeof createPayment>>;
  try {
    response = await createPayment({
      order_id: order.id,
      method: "online",
    });
  } catch (error: unknown) {
    const reason = isUserPaymentApiError(error)
      ? error.message
      : "Please try again.";
    paymentPreparationError.value =
      `Order ${order.order_number} was created, but the payment link could not be prepared. ${reason}`;
    return;
  }

  onlinePayment.value = response.data.payment;
  if (!isHttpPaymentUrl(response.data.payment_url)) {
    paymentUrl.value = null;
    paymentPreparationError.value =
      `Order ${order.order_number} was created, but the payment service returned an invalid link. Retry payment setup without recreating the order.`;
    return;
  }

  paymentUrl.value = response.data.payment_url;
  await openPaymentLink();
};

const retryOnlinePayment = async () => {
  if (submitting.value || !onlineOrder.value) return;

  submitting.value = true;
  try {
    if (paymentUrl.value) {
      await openPaymentLink();
    } else {
      await prepareOnlinePayment(onlineOrder.value);
    }
  } finally {
    submitting.value = false;
  }
};

const submitCheckout = async (mode: "order" | "online" = "order") => {
  if (
    submitting.value ||
    onlineOrder.value ||
    !checkout.value?.items.length
  ) {
    return;
  }

  submitting.value = true;
  errorMessage.value = "";
  cartError.value = "";
  for (const field of Object.keys(fieldErrors)) delete fieldErrors[field];

  try {
    if (!validatedCheckout.value) {
      const response = await validateCheckout(payloadFromForm());
      checkout.value = response.data.checkout;
      validatedCheckout.value = response.data.checkout;
      toast.success("Details verified", "Your shipping details and cart are valid.");
      return;
    }

    const response = await createOrder({
      ...payloadFromForm(),
      customer_note: form.customer_note.trim() || null,
    });
    if (mode === "online") {
      onlineOrder.value = response.data.order;
      checkout.value = null;
      await prepareOnlinePayment(response.data.order);
    } else {
      completedOrder.value = response.data.order;
      checkout.value = null;
      toast.success("Order placed", response.message);
    }
  } catch (error: unknown) {
    if (await handleUnauthorized(error)) return;
    if (isCheckoutApiError(error)) {
      applyApiErrors(error);
      errorMessage.value = error.message;
    } else {
      errorMessage.value = "Could not complete checkout. Please try again.";
    }
  } finally {
    submitting.value = false;
  }
};

watch(
  form,
  () => {
    validatedCheckout.value = null;
    cartError.value = "";
    for (const field of Object.keys(fieldErrors)) delete fieldErrors[field];
  },
  { deep: true },
);

onMounted(loadCheckout);
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Checkout"
      subtitle="Add your delivery details and review your order."
    >
      <template #actions>
        <NuxtLink
          to="/app/cart"
          class="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft class="h-4 w-4" />
          Back to cart
        </NuxtLink>
      </template>
    </PageHeader>

    <div
      v-if="onlineOrder"
      class="rounded-3xl border border-sky-200 bg-sky-50 p-6 dark:border-sky-900 dark:bg-sky-950/30 sm:p-10"
    >
      <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-200">
        <LockKeyhole class="h-7 w-7" />
      </span>
      <p class="mt-5 text-sm font-semibold uppercase tracking-wide text-sky-800 dark:text-sky-300">
        Order created — payment required
      </p>
      <h2 class="mt-2 text-2xl font-bold text-sky-950 dark:text-sky-100">
        Continue to demo payment
      </h2>
      <p class="mt-2 text-sm text-sky-900 dark:text-sky-200">
        Order {{ onlineOrder.order_number }} is ready. Complete the demo payment
        to have the backend confirm your order. No real money is transferred.
      </p>
      <p class="mt-4 text-xl font-bold text-sky-950 dark:text-sky-100">
        {{ formatPrice(onlineOrder.total) }}
      </p>
      <p v-if="onlinePayment" class="mt-2 text-sm text-sky-900 dark:text-sky-200">
        Payment attempt status: {{ onlinePayment.status }}.
      </p>
      <AlertMessage
        v-if="paymentPreparationError"
        class="mt-5"
        type="error"
        title="Payment link needs attention"
        :message="paymentPreparationError"
      />
      <AppButton
        class="mt-6"
        :loading="submitting"
        :disabled="submitting"
        @click="retryOnlinePayment"
      >
        <LockKeyhole class="h-4 w-4" />
        {{ paymentUrl ? "Continue to payment" : "Retry payment setup" }}
      </AppButton>
      <p class="mt-3 text-xs text-sky-900 dark:text-sky-200">
        This recovery action will not create another order.
      </p>
    </div>

    <div
      v-else-if="completedOrder"
      class="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/30 sm:p-10"
    >
      <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
        <CheckCircle2 class="h-7 w-7" />
      </span>
      <p class="mt-5 text-sm font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
        Order confirmed
      </p>
      <h2 class="mt-2 text-2xl font-bold text-emerald-950 dark:text-emerald-100">
        Thank you for your order
      </h2>
      <p class="mt-2 text-sm text-emerald-900 dark:text-emerald-200">
        Order {{ completedOrder.order_number }} has been created and is
        {{ completedOrder.status }}.
      </p>
      <p class="mt-4 text-xl font-bold text-emerald-950 dark:text-emerald-100">
        {{ formatPrice(completedOrder.total) }}
      </p>
      <NuxtLink
        to="/products"
        class="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
      >
        <PackageCheck class="h-4 w-4" />
        Continue shopping
      </NuxtLink>
    </div>

    <div v-else-if="loading" class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div class="h-[34rem] animate-pulse rounded-2xl bg-muted" />
      <div class="h-80 animate-pulse rounded-2xl bg-muted" />
    </div>

    <AlertMessage
      v-else-if="errorMessage && !checkout"
      type="error"
      :message="errorMessage"
    >
      <AppButton variant="secondary" size="sm" :loading="loading" @click="loadCheckout">
        Try again
      </AppButton>
    </AlertMessage>

    <section
      v-else-if="emptyCart || !checkout?.items.length"
      class="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center"
    >
      <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <ShoppingBag class="h-7 w-7" />
      </span>
      <h2 class="mt-5 text-xl font-bold">Your cart is empty</h2>
      <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Add items to your cart before continuing to checkout.
      </p>
      <NuxtLink
        to="/app/cart"
        class="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
      >
        <ShoppingBag class="h-4 w-4" />
        Return to cart
      </NuxtLink>
    </section>

    <div v-else-if="checkout" class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form class="space-y-6" @submit.prevent="submitCheckout">
        <section class="rounded-2xl border border-border bg-card p-5 sm:p-7">
          <div class="mb-6 flex items-start gap-3">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Truck class="h-5 w-5" />
            </span>
            <div>
              <h2 class="text-lg font-bold">Shipping details</h2>
              <p class="mt-1 text-sm text-muted-foreground">
                Where should we deliver your order?
              </p>
            </div>
          </div>

          <AlertMessage
            v-if="cartError"
            class="mb-5"
            type="error"
            :message="cartError"
          />

          <div class="grid gap-5 sm:grid-cols-2">
            <label class="block sm:col-span-2">
              <span class="mb-2 block text-sm font-medium">Recipient name <span class="text-destructive">*</span></span>
              <input
                v-model="form.shipping_name"
                required
                maxlength="100"
                autocomplete="name"
                :aria-invalid="Boolean(fieldErrors.shipping_name)"
                class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 aria-[invalid=true]:border-destructive"
                placeholder="Full name"
              />
              <span v-if="fieldErrors.shipping_name" class="mt-1 block text-sm text-destructive">{{ fieldErrors.shipping_name }}</span>
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-medium">Phone number <span class="text-destructive">*</span></span>
              <input
                v-model="form.shipping_phone"
                required
                maxlength="30"
                type="tel"
                autocomplete="tel"
                :aria-invalid="Boolean(fieldErrors.shipping_phone)"
                class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 aria-[invalid=true]:border-destructive"
                placeholder="+1 555 0100"
              />
              <span v-if="fieldErrors.shipping_phone" class="mt-1 block text-sm text-destructive">{{ fieldErrors.shipping_phone }}</span>
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-medium">Country <span class="text-destructive">*</span></span>
              <input
                v-model="form.shipping_country"
                required
                maxlength="100"
                autocomplete="country-name"
                :aria-invalid="Boolean(fieldErrors.shipping_country)"
                class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 aria-[invalid=true]:border-destructive"
                placeholder="Country"
              />
              <span v-if="fieldErrors.shipping_country" class="mt-1 block text-sm text-destructive">{{ fieldErrors.shipping_country }}</span>
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-medium">Province / region <span class="text-destructive">*</span></span>
              <input
                v-model="form.shipping_province"
                required
                maxlength="100"
                autocomplete="address-level1"
                :aria-invalid="Boolean(fieldErrors.shipping_province)"
                class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 aria-[invalid=true]:border-destructive"
                placeholder="Province or region"
              />
              <span v-if="fieldErrors.shipping_province" class="mt-1 block text-sm text-destructive">{{ fieldErrors.shipping_province }}</span>
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-medium">City <span class="text-destructive">*</span></span>
              <input
                v-model="form.shipping_city"
                required
                maxlength="100"
                autocomplete="address-level2"
                :aria-invalid="Boolean(fieldErrors.shipping_city)"
                class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 aria-[invalid=true]:border-destructive"
                placeholder="City"
              />
              <span v-if="fieldErrors.shipping_city" class="mt-1 block text-sm text-destructive">{{ fieldErrors.shipping_city }}</span>
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-medium">Postal code</span>
              <input
                v-model="form.shipping_postal_code"
                maxlength="30"
                autocomplete="postal-code"
                :aria-invalid="Boolean(fieldErrors.shipping_postal_code)"
                class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 aria-[invalid=true]:border-destructive"
                placeholder="Postal code (optional)"
              />
              <span v-if="fieldErrors.shipping_postal_code" class="mt-1 block text-sm text-destructive">{{ fieldErrors.shipping_postal_code }}</span>
            </label>

            <label class="block sm:col-span-2">
              <span class="mb-2 block text-sm font-medium">Street address <span class="text-destructive">*</span></span>
              <textarea
                v-model="form.shipping_address"
                required
                maxlength="500"
                rows="3"
                autocomplete="street-address"
                :aria-invalid="Boolean(fieldErrors.shipping_address)"
                class="w-full resize-y rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 aria-[invalid=true]:border-destructive"
                placeholder="House number, street, apartment, etc."
              />
              <span v-if="fieldErrors.shipping_address" class="mt-1 block text-sm text-destructive">{{ fieldErrors.shipping_address }}</span>
            </label>

            <label class="block sm:col-span-2">
              <span class="mb-2 block text-sm font-medium">Delivery note</span>
              <textarea
                v-model="form.customer_note"
                maxlength="1000"
                rows="3"
                class="w-full resize-y rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Optional instructions for your order"
              />
              <span v-if="fieldErrors.customer_note" class="mt-1 block text-sm text-destructive">{{ fieldErrors.customer_note }}</span>
            </label>
          </div>
        </section>

        <AlertMessage v-if="errorMessage && checkout" type="error" :message="errorMessage" />

        <div
          v-if="validatedCheckout"
          class="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
        >
          <CheckCircle2 class="mt-0.5 h-5 w-5 shrink-0" />
          <p>Shipping details and cart availability are verified. Place your order, or choose online payment.</p>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <NuxtLink
            to="/app/cart"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold transition hover:bg-muted"
          >
            <ArrowLeft class="h-4 w-4" />
            Back to cart
          </NuxtLink>
          <div class="flex flex-col gap-3 sm:flex-row">
            <AppButton
              type="submit"
              :loading="submitting"
              :disabled="submitting || !checkout.items.length"
              class="sm:min-w-48"
            >
              <LockKeyhole class="h-4 w-4" />
              {{ validatedCheckout ? "Place order" : "Review order" }}
            </AppButton>
            <AppButton
              v-if="validatedCheckout"
              type="button"
              variant="secondary"
              :loading="submitting"
              :disabled="submitting || !checkout.items.length"
              class="sm:min-w-48"
              @click="submitCheckout('online')"
            >
              <LockKeyhole class="h-4 w-4" />
              Pay online
            </AppButton>
          </div>
        </div>
        <p class="text-center text-xs text-muted-foreground">
          Your order is revalidated by the server before it is created.
        </p>
      </form>

      <aside class="space-y-4 lg:sticky lg:top-6">
        <section class="rounded-2xl border border-border bg-card p-5">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold">Order summary</h2>
            <span class="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              {{ checkout.items.length }} {{ checkout.items.length === 1 ? "item" : "items" }}
            </span>
          </div>

          <div class="mt-5 max-h-80 space-y-4 overflow-y-auto">
            <div
              v-for="item in checkout.items"
              :key="item.id"
              class="flex justify-between gap-4 border-b border-border pb-4 last:border-0"
            >
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold">{{ item.product.name }}</p>
                <p class="mt-1 text-xs text-muted-foreground">
                  {{ item.variant?.sku || item.product.sku }} · Qty {{ item.quantity }}
                </p>
              </div>
              <p class="shrink-0 text-sm font-semibold">{{ formatPrice(item.line_total) }}</p>
            </div>
          </div>

          <dl class="mt-2 space-y-3 border-t border-border pt-4 text-sm">
            <div class="flex justify-between gap-4">
              <dt class="text-muted-foreground">Subtotal</dt>
              <dd class="font-medium">{{ formatPrice(validatedCheckout?.subtotal ?? checkout.subtotal) }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted-foreground">Shipping</dt>
              <dd class="font-medium">{{ formatPrice(validatedCheckout?.shipping_fee ?? checkout.shipping_fee) }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted-foreground">Discount</dt>
              <dd class="font-medium">−{{ formatPrice(validatedCheckout?.discount ?? checkout.discount) }}</dd>
            </div>
            <div class="flex justify-between gap-4 border-t border-border pt-4 text-base">
              <dt class="font-bold">Total</dt>
              <dd class="font-bold">{{ formatPrice(validatedCheckout?.total ?? checkout.total) }}</dd>
            </div>
          </dl>
          <p class="mt-4 text-xs leading-5 text-muted-foreground">
            Shipping and discounts reflect the current API summary and may be recalculated when your order is placed.
          </p>
        </section>

        <div class="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4">
          <LockKeyhole class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p class="text-xs leading-5 text-muted-foreground">
            Your shipping details are sent securely to create this order. The order API does not include payment selection.
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  ShieldCheck,
} from "lucide-vue-next";
import {
  useUserPayment,
  type DemoPayment,
  type UserPaymentApiError,
} from "~/composables/useUserPayment";

definePageMeta({
  layout: "public",
  title: "Demo Payment",
});

const route = useRoute();
const { getDemoPayment, succeedDemoPayment, failDemoPayment } =
  useUserPayment();

const payment = ref<DemoPayment | null>(null);
const loading = ref(true);
const submitting = ref(false);
const unavailable = ref(false);
const errorMessage = ref("");
const lookupError = ref(false);

const token = computed(() =>
  typeof route.params.token === "string" ? route.params.token : "",
);

const isPaymentApiError = (error: unknown): error is UserPaymentApiError =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof error.message === "string" &&
  "status" in error &&
  typeof error.status === "number";

const formatExpiration = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
};

const loadPayment = async () => {
  if (!token.value) {
    unavailable.value = true;
    loading.value = false;
    return;
  }

  loading.value = true;
  unavailable.value = false;
  errorMessage.value = "";
  lookupError.value = false;

  try {
    const response = await getDemoPayment(token.value);
    payment.value = response.data.payment;
  } catch (error: unknown) {
    payment.value = null;
    if (isPaymentApiError(error) && error.status === 404) {
      unavailable.value = true;
    } else {
      errorMessage.value = isPaymentApiError(error)
        ? error.message
        : "Could not load this demo payment. Please try again.";
      lookupError.value = true;
    }
  } finally {
    loading.value = false;
  }
};

const submitAction = async (action: "success" | "failure") => {
  if (
    submitting.value ||
    payment.value?.status !== "pending" ||
    unavailable.value ||
    !token.value
  ) {
    return;
  }

  submitting.value = true;
  errorMessage.value = "";
  lookupError.value = false;

  try {
    const response =
      action === "success"
        ? await succeedDemoPayment(token.value)
        : await failDemoPayment(token.value);
    payment.value = response.data.payment;
  } catch (error: unknown) {
    if (isPaymentApiError(error) && error.status === 404) {
      payment.value = null;
      unavailable.value = true;
    } else {
      errorMessage.value = isPaymentApiError(error)
        ? error.message
        : action === "success"
          ? "Could not complete the demo payment. You can try again."
          : "Could not record the demo payment failure. You can try again.";
    }
  } finally {
    submitting.value = false;
  }
};

onMounted(loadPayment);
</script>

<template>
  <main class="min-h-[70vh] bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 sm:py-16">
    <div class="mx-auto max-w-3xl">
      <header class="mb-6 flex items-center justify-between gap-4">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
        >
          <ArrowLeft class="h-4 w-4" />
          Cobo Shop
        </NuxtLink>
        <AppBadge variant="info" size="md">
          <CreditCard class="h-3.5 w-3.5" />
          Demo Payment
        </AppBadge>
      </header>

      <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
        <div class="border-b border-slate-100 px-6 py-7 dark:border-slate-800 sm:px-10 sm:py-9">
          <p class="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">
            Simulated checkout
          </p>
          <h1 class="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Demo payment
          </h1>
          <p class="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            This is a demonstration only. No real bank transaction or payment
            transfer will take place.
          </p>
        </div>

        <div class="space-y-6 px-6 py-7 sm:px-10 sm:py-9">
          <div
            v-if="loading"
            class="space-y-4"
            role="status"
            aria-label="Loading demo payment"
          >
            <div class="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            <div class="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            <p class="text-sm text-slate-500 dark:text-slate-400">
              Loading payment details…
            </p>
          </div>

          <section
            v-else-if="unavailable"
            class="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/30"
            role="status"
          >
            <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200">
              <AlertCircle class="h-6 w-6" />
            </span>
            <h2 class="mt-4 text-xl font-bold">Payment unavailable</h2>
            <p class="mt-2 text-sm leading-6 text-amber-950 dark:text-amber-100">
              This payment link is unavailable. It may have expired or may no
              longer be valid. Return to your account to review your orders.
            </p>
            <NuxtLink
              to="/app/orders"
              class="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Go to my orders
            </NuxtLink>
          </section>

          <section
            v-else-if="errorMessage && lookupError"
            class="space-y-4"
          >
            <AlertMessage
              type="error"
              title="Unable to load payment"
              :message="errorMessage"
            />
            <AppButton
              variant="secondary"
              :loading="loading"
              :disabled="loading"
              @click="loadPayment"
            >
              Try again
            </AppButton>
          </section>

          <template v-else-if="payment">
            <section
              v-if="payment.status === 'paid'"
              class="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/30 sm:p-8"
              role="status"
            >
              <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                <CheckCircle2 class="h-6 w-6" />
              </span>
              <h2 class="mt-4 text-xl font-bold">Demo payment successful</h2>
              <p class="mt-2 text-sm leading-6 text-emerald-950 dark:text-emerald-100">
                The backend has confirmed this simulated payment. No real
                transfer occurred.
              </p>
              <NuxtLink
                to="/app/orders"
                class="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Continue to my orders
              </NuxtLink>
            </section>

            <section
              v-else-if="payment.status === 'failed'"
              class="rounded-2xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-900 dark:bg-rose-950/30 sm:p-8"
              role="status"
            >
              <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200">
                <AlertCircle class="h-6 w-6" />
              </span>
              <h2 class="mt-4 text-xl font-bold">This payment attempt failed</h2>
              <p class="mt-2 text-sm leading-6 text-rose-950 dark:text-rose-100">
                Your order remains available for payment. Return to payment
                selection and choose this same order to try again.
              </p>
              <NuxtLink
                to="/app/payments"
                class="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Return to payment selection
              </NuxtLink>
            </section>

            <template v-else>
              <AlertMessage
                v-if="errorMessage"
                type="error"
                title="Payment action not completed"
                :message="errorMessage"
              />

              <div class="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/70 sm:p-6">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Amount
                    </p>
                    <p class="mt-1 text-3xl font-bold tracking-tight">
                      {{ payment.amount }}
                    </p>
                  </div>
                  <AppBadge variant="warning" size="md" dot>
                    {{ payment.status }}
                  </AppBadge>
                </div>
                <dl class="mt-5 grid gap-4 border-t border-slate-200 pt-5 text-sm dark:border-slate-700 sm:grid-cols-2">
                  <div>
                    <dt class="text-slate-500 dark:text-slate-400">
                      Order reference
                    </dt>
                    <dd class="mt-1 font-semibold">{{ payment.order_reference }}</dd>
                  </div>
                  <div>
                    <dt class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Clock3 class="h-3.5 w-3.5" />
                      Expires
                    </dt>
                    <dd class="mt-1 font-semibold">
                      {{ formatExpiration(payment.expires_at) }}
                    </dd>
                  </div>
                </dl>
              </div>

              <div class="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
                <ShieldCheck class="mt-0.5 h-5 w-5 shrink-0" />
                <p>
                  Choose a simulated result below. The backend decides whether
                  this payment is still eligible and records the result.
                </p>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <AppButton
                  variant="success"
                  :loading="submitting"
                  :disabled="submitting"
                  @click="submitAction('success')"
                >
                  Simulate successful payment
                </AppButton>
                <AppButton
                  variant="danger"
                  :loading="submitting"
                  :disabled="submitting"
                  @click="submitAction('failure')"
                >
                  Simulate failed payment
                </AppButton>
              </div>
            </template>
          </template>
        </div>
      </section>
    </div>
  </main>
</template>

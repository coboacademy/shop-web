<script setup lang="ts">
import {
  ArrowLeft,
  Package,
  ShoppingBag,
  Trash2,
} from "lucide-vue-next";
import {
  useCart,
  type CartApiError,
  type CartItem,
  type UserCart,
} from "~/composables/useCart";

definePageMeta({
  layout: "user",
  middleware: ["auth", "permission"],
  permission: "account.view",
  title: "Shopping cart",
});

const { getCart, updateItem, removeItem, clearCart } = useCart();
const toast = useToast();
const cart = ref<UserCart | null>(null);
const loading = ref(true);
const errorMessage = ref("");
const actionError = ref("");
const quantityDrafts = reactive<Record<number, number>>({});
const itemErrors = reactive<Record<number, string>>({});
const busyItemId = ref<number | null>(null);
const actionLoading = ref(false);
const confirmAction = ref<{
  type: "remove" | "clear";
  item: CartItem | null;
} | null>(null);

const isCartApiError = (error: unknown): error is CartApiError =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof error.message === "string" &&
  "status" in error &&
  typeof error.status === "number";

const formatPrice = (price: string | number | null | undefined) => {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const applyCart = (updatedCart: UserCart) => {
  cart.value = updatedCart;
  for (const item of updatedCart.items) {
    quantityDrafts[item.id] = item.quantity;
    delete itemErrors[item.id];
  }
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (isCartApiError(error)) return error.message;
  return fallback;
};

const handleUnauthorized = async (error: unknown) => {
  if (isCartApiError(error) && error.status === 401) {
    await navigateTo({
      path: "/login",
      query: { redirect: "/app/cart" },
    });
    return true;
  }
  return false;
};

const loadCart = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await getCart();
    applyCart(response.data.cart);
  } catch (error: unknown) {
    if (await handleUnauthorized(error)) return;
    errorMessage.value = getApiErrorMessage(error, "Could not load your cart.");
  } finally {
    loading.value = false;
  }
};

const updateQuantity = async (item: CartItem) => {
  const quantity = quantityDrafts[item.id];
  delete itemErrors[item.id];

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999) {
    itemErrors[item.id] = "Enter a whole quantity from 1 to 9,999.";
    return;
  }
  if (quantity === item.quantity) return;

  busyItemId.value = item.id;
  actionError.value = "";
  try {
    const response = await updateItem(item.id, quantity);
    applyCart(response.data.cart);
    toast.success("Cart updated", response.message);
  } catch (error: unknown) {
    if (await handleUnauthorized(error)) return;
    const apiError = isCartApiError(error) ? error : null;
    itemErrors[item.id] =
      apiError?.errors.quantity?.[0] ||
      getApiErrorMessage(error, "Could not update this item.");
    toast.error("Update failed", itemErrors[item.id]);
  } finally {
    busyItemId.value = null;
  }
};

const requestRemoveItem = (item: CartItem) => {
  confirmAction.value = { type: "remove", item };
};

const requestClearCart = () => {
  confirmAction.value = { type: "clear", item: null };
};

const closeConfirmation = () => {
  if (actionLoading.value) return;
  confirmAction.value = null;
};

const confirmCartAction = async () => {
  const action = confirmAction.value;
  if (!action) return;
  if (action.type === "remove" && !action.item) return;

  actionError.value = "";
  actionLoading.value = true;
  try {
    const response =
      action.type === "clear"
        ? await clearCart()
        : await removeItem(action.item.id);
    applyCart(response.data.cart);
    toast.success(
      action.type === "clear" ? "Cart cleared" : "Item removed",
      response.message,
    );
    confirmAction.value = null;
  } catch (error: unknown) {
    if (await handleUnauthorized(error)) return;
    actionError.value = getApiErrorMessage(
      error,
      action.type === "clear"
        ? "Could not clear your cart."
        : "Could not remove this item.",
    );
    toast.error("Cart update failed", actionError.value);
  } finally {
    actionLoading.value = false;
  }
};

onMounted(loadCart);
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Your cart"
      subtitle="Review the products you’ve added to your cart."
    >
      <template #actions>
        <div class="flex flex-wrap items-center gap-2">
          <AppButton
            v-if="cart?.items.length"
            variant="danger"
            :disabled="loading || actionLoading"
            @click="requestClearCart"
          >
            <Trash2 class="h-4 w-4" />
            Clear cart
          </AppButton>
          <NuxtLink
            to="/products"
            class="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ArrowLeft class="h-4 w-4" />
            Continue shopping
          </NuxtLink>
        </div>
      </template>
    </PageHeader>

    <AlertMessage v-if="errorMessage" type="error" :message="errorMessage">
      <AppButton variant="secondary" size="sm" :loading="loading" @click="loadCart">
        Try again
      </AppButton>
    </AlertMessage>
    <AlertMessage v-if="actionError" type="error" :message="actionError" />

    <div v-if="loading" class="space-y-4" aria-label="Loading cart">
      <div v-for="index in 3" :key="index" class="h-28 animate-pulse rounded-2xl bg-muted" />
    </div>

    <section
      v-else-if="!errorMessage && cart && !cart.items.length"
      class="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center"
    >
      <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <ShoppingBag class="h-7 w-7" />
      </span>
      <h2 class="mt-5 text-xl font-bold">Your cart is empty</h2>
      <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Browse the shop and add products to see them here.
      </p>
      <NuxtLink
        to="/products"
        class="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
      >
        <Package class="h-4 w-4" />
        Browse products
      </NuxtLink>
    </section>

    <div v-else-if="cart" class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section class="space-y-3" aria-label="Cart items">
        <article
          v-for="item in cart.items"
          :key="item.id"
          class="rounded-2xl border border-border bg-card p-4 sm:p-5"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <NuxtLink
                :to="`/products/${encodeURIComponent(item.product_id)}`"
                class="font-semibold text-card-foreground transition hover:text-primary"
              >
                {{ item.product.name }}
              </NuxtLink>
              <p class="mt-1 text-xs text-muted-foreground">
                SKU {{ item.variant?.sku || item.product.sku }}
                <span v-if="item.variant_id"> · Variant</span>
              </p>
              <p class="mt-2 text-sm text-muted-foreground">
                {{ formatPrice(item.unit_price) }} per item
              </p>
            </div>
            <p class="shrink-0 text-lg font-bold">{{ formatPrice(item.line_total) }}</p>
          </div>

          <div class="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end sm:justify-between">
            <div class="flex items-end gap-3">
              <label class="block">
                <span class="mb-1.5 block text-xs font-medium text-muted-foreground">Quantity</span>
                <input
                  v-model.number="quantityDrafts[item.id]"
                  type="number"
                  min="1"
                  max="9999"
                  step="1"
                  :aria-label="`Quantity for ${item.product.name}`"
                  :aria-invalid="Boolean(itemErrors[item.id])"
                  :disabled="busyItemId === item.id || actionLoading"
                  class="h-10 w-24 rounded-xl border border-border bg-background px-3 text-center text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                />
              </label>
              <AppButton
                variant="secondary"
                size="sm"
                :loading="busyItemId === item.id"
                :disabled="actionLoading || busyItemId !== null || quantityDrafts[item.id] === item.quantity"
                @click="updateQuantity(item)"
              >
                Update quantity
              </AppButton>
            </div>
            <AppButton
              variant="danger"
              size="sm"
              :disabled="actionLoading || busyItemId !== null"
              @click="requestRemoveItem(item)"
            >
              <Trash2 class="h-4 w-4" />
              Remove
            </AppButton>
          </div>
          <p v-if="itemErrors[item.id]" class="mt-2 text-sm text-destructive" role="alert">
            {{ itemErrors[item.id] }}
          </p>
        </article>
      </section>

      <aside class="h-fit rounded-2xl border border-border bg-card p-5">
        <h2 class="text-lg font-bold">Order summary</h2>
        <div class="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm">
          <span class="text-muted-foreground">Items</span>
          <span class="font-medium">{{ cart.total_items }}</span>
        </div>
        <div class="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span class="font-semibold">Subtotal</span>
          <span class="text-xl font-bold">{{ formatPrice(cart.subtotal) }}</span>
        </div>
        <p class="mt-3 text-xs leading-5 text-muted-foreground">
          Shipping and discounts are not included. Availability and item prices may be revalidated during checkout.
        </p>
        <NuxtLink
          to="/app/checkout"
          class="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Continue to checkout
        </NuxtLink>
        <NuxtLink
          to="/products"
          class="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold transition hover:bg-muted"
        >
          Continue shopping
        </NuxtLink>
      </aside>
    </div>

    <ConfirmDialog
      :open="Boolean(confirmAction)"
      :title="confirmAction?.type === 'clear' ? 'Clear your cart?' : 'Remove this item?'"
      :message="
        confirmAction?.type === 'clear'
          ? 'This will remove every item from your cart. This action cannot be undone.'
          : `Remove ${confirmAction?.item?.product.name || 'this item'} from your cart?`
      "
      :confirm-label="confirmAction?.type === 'clear' ? 'Clear cart' : 'Remove item'"
      variant="danger"
      :loading="actionLoading"
      @close="closeConfirmation"
      @confirm="confirmCartAction"
    />
  </div>
</template>

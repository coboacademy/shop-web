<script setup lang="ts">
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  HeartOff,
  Package,
  RefreshCw,
  ShoppingBag,
  Trash2,
} from "lucide-vue-next";
import {
  useWishlist,
  type WishlistApiError,
  type WishlistItem,
} from "~/composables/useWishlist";

definePageMeta({
  layout: "user",
  middleware: ["auth", "permission"],
  permission: "account.view",
  title: "My Wishlist",
});

const { getWishlist, removeItem, clearWishlist } = useWishlist();
const toast = useToast();
const items = ref<WishlistItem[]>([]);
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
  from: null as number | null,
  to: null as number | null,
});
const page = ref(1);
const loading = ref(true);
const errorMessage = ref("");
const actionError = ref("");
const busyProductId = ref<string | null>(null);
const clearing = ref(false);
const confirmAction = ref<"clear" | WishlistItem | null>(null);
const confirmTitle = computed(() =>
  confirmAction.value === "clear" ? "Clear your wishlist?" : "Remove this product?",
);
const confirmMessage = computed(() =>
  confirmAction.value === "clear"
    ? "This removes all saved items from your wishlist. It will not delete the products."
    : `Remove ${
        confirmAction.value && confirmAction.value !== "clear"
          ? confirmAction.value.product.name
          : "this product"
      } from your wishlist?`,
);
const confirmLabel = computed(() =>
  confirmAction.value === "clear" ? "Clear wishlist" : "Remove product",
);

const isWishlistApiError = (error: unknown): error is WishlistApiError =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof error.message === "string" &&
  "status" in error &&
  typeof error.status === "number" &&
  "errors" in error;

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
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
};

const handleUnauthorized = async (error: unknown) => {
  if (isWishlistApiError(error) && error.status === 401) {
    await navigateTo({
      path: "/login",
      query: { redirect: "/app/wishlist" },
    });
    return true;
  }
  return false;
};

const loadWishlist = async (requestedPage = page.value) => {
  loading.value = true;
  errorMessage.value = "";
  actionError.value = "";

  try {
    const response = await getWishlist(requestedPage);
    const result = response.data.wishlist;
    if (!result || !Array.isArray(result.data) || !result.meta) {
      throw new Error("The wishlist API returned an invalid response.");
    }

    items.value = result.data;
    pagination.value = {
      current_page: result.meta.current_page,
      last_page: result.meta.last_page,
      per_page: result.meta.per_page,
      total: result.meta.total,
      from: result.meta.from,
      to: result.meta.to,
    };
    page.value = result.meta.current_page;
  } catch (error: unknown) {
    if (await handleUnauthorized(error)) return;
    errorMessage.value = isWishlistApiError(error)
      ? error.message
      : error instanceof Error
        ? error.message
        : "Could not load your wishlist.";
    items.value = [];
  } finally {
    loading.value = false;
  }
};

const requestRemove = (item: WishlistItem) => {
  confirmAction.value = item;
};

const requestClear = () => {
  confirmAction.value = "clear";
};

const closeConfirmation = () => {
  if (clearing.value || busyProductId.value) return;
  confirmAction.value = null;
};

const confirmWishlistAction = async () => {
  const action = confirmAction.value;
  if (!action) return;

  actionError.value = "";
  if (action === "clear") {
    clearing.value = true;
    try {
      const response = await clearWishlist();
      items.value = [];
      pagination.value = {
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
        from: null,
        to: null,
      };
      page.value = 1;
      confirmAction.value = null;
      toast.success("Wishlist cleared", response.message);
    } catch (error: unknown) {
      if (await handleUnauthorized(error)) return;
      actionError.value = isWishlistApiError(error)
        ? error.message
        : error instanceof Error
          ? error.message
          : "Could not clear your wishlist.";
      toast.error("Could not clear wishlist", actionError.value);
    } finally {
      clearing.value = false;
    }
    return;
  }

  busyProductId.value = action.product_id;
  try {
    const response = await removeItem(action.product_id);
    confirmAction.value = null;
    toast.success("Removed from wishlist", response.message);
    const nextPage =
      items.value.length === 1 && page.value > 1 ? page.value - 1 : page.value;
    await loadWishlist(nextPage);
  } catch (error: unknown) {
    if (await handleUnauthorized(error)) return;
    actionError.value = isWishlistApiError(error)
      ? error.message
      : error instanceof Error
        ? error.message
        : "Could not remove this product.";
    toast.error("Could not remove product", actionError.value);
  } finally {
    busyProductId.value = null;
  }
};

const changePage = async (nextPage: number) => {
  if (loading.value || nextPage < 1 || nextPage > pagination.value.last_page) return;
  await loadWishlist(nextPage);
};

onMounted(() => loadWishlist(1));
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="My wishlist"
      subtitle="Keep the products you love together and come back to them anytime."
    >
      <template #actions>
        <div class="flex flex-wrap items-center gap-2">
          <AppButton
            v-if="pagination.total"
            variant="danger"
            :disabled="loading || clearing || busyProductId !== null"
            @click="requestClear"
          >
            <Trash2 class="h-4 w-4" />
            Clear wishlist
          </AppButton>
          <AppButton
            variant="secondary"
            :loading="loading"
            :disabled="loading"
            @click="loadWishlist()"
          >
            <RefreshCw class="h-4 w-4" />
            Refresh
          </AppButton>
        </div>
      </template>
    </PageHeader>

    <AlertMessage v-if="errorMessage" type="error" :message="errorMessage">
      <AppButton
        variant="secondary"
        size="sm"
        :loading="loading"
        @click="loadWishlist()"
      >
        Try again
      </AppButton>
    </AlertMessage>
    <AlertMessage v-if="actionError" type="error" :message="actionError" />

    <section
      v-if="loading && !items.length"
      class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
      aria-label="Loading wishlist"
    >
      <div
        v-for="index in 6"
        :key="index"
        class="h-72 animate-pulse rounded-3xl bg-muted"
      />
    </section>

    <section
      v-else-if="!loading && !errorMessage && !items.length"
      class="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center"
    >
      <span class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <HeartOff class="h-7 w-7" />
      </span>
      <h2 class="mt-5 text-xl font-bold text-card-foreground">Your wishlist is empty</h2>
      <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Explore the shop and save products here so they’re easy to find later.
      </p>
      <NuxtLink
        to="/products"
        class="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
      >
        <ShoppingBag class="h-4 w-4" />
        Browse products
        <ArrowRight class="h-4 w-4" />
      </NuxtLink>
    </section>

    <template v-else-if="items.length">
      <div class="flex items-center justify-between gap-4">
        <p class="text-sm text-muted-foreground" aria-live="polite">
          Showing {{ pagination.from ?? 0 }}–{{ pagination.to ?? 0 }} of
          {{ pagination.total }} saved
          {{ pagination.total === 1 ? "product" : "products" }}
        </p>
        <p v-if="loading" class="text-xs text-muted-foreground" role="status">
          Updating…
        </p>
      </div>

      <section class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Wishlist products">
        <article
          v-for="item in items"
          :key="item.id"
          class="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
        >
          <NuxtLink
            :to="`/products/${encodeURIComponent(item.product_id)}`"
            class="flex flex-1 flex-col p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
          >
            <div class="flex items-start justify-between gap-4">
              <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Package class="h-6 w-6" />
              </span>
              <span class="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                Saved {{ formatDate(item.created_at) }}
              </span>
            </div>
            <p class="mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {{ item.product.sku || "Product" }}
            </p>
            <h2 class="mt-1 line-clamp-2 text-lg font-bold text-card-foreground transition group-hover:text-primary">
              {{ item.product.name }}
            </h2>
            <p class="mt-2 line-clamp-3 min-h-[3.75rem] text-sm leading-5 text-muted-foreground">
              {{ item.product.short_description || item.product.description || "Discover more details about this product." }}
            </p>
            <div class="mt-auto flex items-end justify-between gap-4 pt-5">
              <div>
                <p class="text-xl font-bold text-card-foreground">
                  {{ formatPrice(item.product.price) }}
                </p>
                <p
                  v-if="item.product.compare_at_price && Number(item.product.compare_at_price) > Number(item.product.price)"
                  class="text-xs text-muted-foreground line-through"
                >
                  {{ formatPrice(item.product.compare_at_price) }}
                </p>
              </div>
              <span class="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                View product
                <ArrowRight class="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </div>
          </NuxtLink>
          <div class="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-3">
            <span class="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Heart class="h-4 w-4 fill-rose-500 text-rose-500" />
              Saved to wishlist
            </span>
            <AppButton
              variant="secondary"
              size="sm"
              :loading="busyProductId === item.product_id"
              :disabled="busyProductId !== null || clearing"
              @click="requestRemove(item)"
            >
              <Trash2 class="h-4 w-4" />
              Remove
            </AppButton>
          </div>
        </article>
      </section>

      <nav
        v-if="pagination.last_page > 1"
        class="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3"
        aria-label="Wishlist pages"
      >
        <p class="text-sm text-muted-foreground">
          Page {{ pagination.current_page }} of {{ pagination.last_page }}
        </p>
        <div class="flex items-center gap-2">
          <AppButton
            variant="secondary"
            size="sm"
            :disabled="loading || pagination.current_page <= 1"
            @click="changePage(pagination.current_page - 1)"
          >
            <ArrowLeft class="h-4 w-4" />
            Previous
          </AppButton>
          <AppButton
            variant="secondary"
            size="sm"
            :disabled="loading || pagination.current_page >= pagination.last_page"
            @click="changePage(pagination.current_page + 1)"
          >
            Next
            <ArrowRight class="h-4 w-4" />
          </AppButton>
        </div>
      </nav>
    </template>

    <ConfirmDialog
      :open="Boolean(confirmAction)"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-label="confirmLabel"
      variant="danger"
      :loading="clearing || busyProductId !== null"
      @close="closeConfirmation"
      @confirm="confirmWishlistAction"
    />
  </div>
</template>

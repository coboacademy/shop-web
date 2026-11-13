<script setup lang="ts">
import {
  ArrowRight,
  ImageOff,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Tag,
} from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import StorefrontProductCard from "~/components/storefront/StorefrontProductCard.vue";
import { usePublicProducts, type PublicProduct } from "~/composables/usePublicProducts";
import { useToast } from "~/composables/useToast";
import { useWishlist } from "~/composables/useWishlist";
import { useAuthStore } from "~/stores/auth";
import {
  getStorefrontCategories,
  isStorefrontSpecialOffer,
} from "~/utils/storefrontCatalog";

definePageMeta({
  layout: "public",
  title: "Home",
});

const { getProducts } = usePublicProducts();
const { toggleProduct } = useWishlist();
const toast = useToast();
const authStore = useAuthStore();

const products = ref<PublicProduct[]>([]);
const loading = ref(true);
const loadError = ref("");
const selectedCategoryId = ref<string | null>(null);
const wishlistedProducts = ref<Record<string, boolean>>({});
const wishlistPendingIds = ref(new Set<string>());
const failedImageUrls = ref(new Set<string>());

const isCustomer = computed(
  () =>
    authStore.initialized &&
    authStore.isAuthenticated &&
    authStore.hasPermission("account.view") &&
    !authStore.hasPermission("dashboard.view") &&
    !authStore.hasRole("Vendor") &&
    !authStore.hasPermission("vendor.view"),
);

const categories = computed(() => getStorefrontCategories(products.value));
const selectedCategory = computed(
  () =>
    categories.value.find(
      (category) => String(category.id) === selectedCategoryId.value,
    ) ?? null,
);
const visibleProducts = computed(() =>
  selectedCategoryId.value
    ? products.value.filter((product) =>
        product.categories.some(
          (category) => String(category.id) === selectedCategoryId.value,
        ),
      )
    : products.value,
);
const newArrivals = computed(() => visibleProducts.value.slice(0, 8));
const specialOffers = computed(() =>
  visibleProducts.value.filter(isStorefrontSpecialOffer).slice(0, 4),
);
const heroProduct = computed(() => products.value[0] ?? null);

const productImage = (product: PublicProduct) =>
  product.images.find((image) => image.is_primary)?.url ||
  product.images[0]?.url ||
  "";

const heroImage = computed(() => {
  const url = heroProduct.value ? productImage(heroProduct.value) : "";
  return failedImageUrls.value.has(url) ? "" : url;
});

const getCategoryImage = (categoryId: number | string) => {
  const product = products.value.find(
    (item) =>
      item.categories.some((category) => String(category.id) === String(categoryId)) &&
      productImage(item) &&
      !failedImageUrls.value.has(productImage(item)),
  );
  return product ? productImage(product) : "";
};

const markImageFailed = (url: string) => {
  failedImageUrls.value = new Set(failedImageUrls.value).add(url);
};

const loadProducts = async () => {
  loading.value = true;
  loadError.value = "";

  try {
    const response = await getProducts({ page: 1, per_page: 100 });
    if (!Array.isArray(response.data?.products)) {
      throw new Error("The product service returned an invalid response.");
    }

    products.value = response.data.products;
  } catch (error: unknown) {
    loadError.value =
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
        ? error.message
        : "We couldn’t load products right now. Please try again.";
  } finally {
    loading.value = false;
  }
};

const getErrorStatus = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "status" in error &&
  typeof error.status === "number"
    ? error.status
    : null;

const getErrorMessage = (error: unknown, fallback: string) =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof error.message === "string"
    ? error.message
    : fallback;

const handleWishlist = async (product: PublicProduct) => {
  if (!isCustomer.value) {
    if (!authStore.isAuthenticated) {
      await navigateTo({
        path: "/login",
        query: { redirect: "/" },
      });
      return;
    }

    toast.info("Customer account required", "Sign in with a customer account to save products.");
    return;
  }

  if (wishlistPendingIds.value.has(product.id)) return;
  wishlistPendingIds.value = new Set(wishlistPendingIds.value).add(product.id);

  try {
    const response = await toggleProduct(product.id);
    const added = response.data?.added;
    if (typeof added !== "boolean") {
      throw new Error("The wishlist service returned an invalid response.");
    }

    wishlistedProducts.value = {
      ...wishlistedProducts.value,
      [product.id]: added,
    };
    toast.success(
      added ? "Saved to wishlist" : "Removed from wishlist",
      response.message,
    );
  } catch (error: unknown) {
    if (getErrorStatus(error) === 401) {
      await navigateTo({
        path: "/login",
        query: { redirect: "/" },
      });
    } else {
      toast.error(
        "Could not update wishlist",
        getErrorMessage(error, "Please try again."),
      );
    }
  } finally {
    const pending = new Set(wishlistPendingIds.value);
    pending.delete(product.id);
    wishlistPendingIds.value = pending;
  }
};

const formatPrice = (price: string) => {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return "";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

onMounted(() => {
  void loadProducts();
});
</script>

<template>
  <div class="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
    <main>
      <section class="px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-8 lg:px-8">
        <div
          class="relative mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-[#0F172A] shadow-xl shadow-slate-900/10 lg:min-h-[470px] lg:grid-cols-[1.05fr_0.95fr]"
        >
          <div
            class="pointer-events-none absolute -right-20 -top-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"
            aria-hidden="true"
          />
          <div class="relative z-10 flex flex-col items-start justify-center px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
            <p class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold tracking-wide text-blue-100 sm:text-sm">
              <Sparkles class="h-4 w-4 text-blue-300" aria-hidden="true" />
              A marketplace made for discovery
            </p>
            <h1 class="mt-6 max-w-xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Good finds start
              <span class="text-blue-300">right here.</span>
            </h1>
            <p class="mt-5 max-w-lg text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Explore products from Cobo Shop stores, find something you love, and make it yours.
            </p>
            <div class="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#new-arrivals"
                class="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A]"
              >
                Shop now
                <ArrowRight class="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#categories"
                class="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A]"
              >
                Browse categories
              </a>
            </div>
          </div>

          <div class="relative min-h-72 overflow-hidden px-6 pb-8 sm:px-10 lg:min-h-full lg:px-8 lg:py-10">
            <div
              class="absolute inset-x-8 bottom-7 top-6 rotate-3 rounded-[2rem] bg-blue-500/20 sm:inset-x-14 lg:inset-x-10"
              aria-hidden="true"
            />
            <div class="relative mx-auto flex h-full max-w-lg items-center justify-center">
              <div
                v-if="heroProduct && heroImage"
                class="relative w-full overflow-hidden rounded-[1.75rem] border border-white/20 bg-white p-3 shadow-2xl shadow-black/30 sm:p-4"
              >
                <div class="aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-slate-100">
                  <img
                    :src="heroImage"
                    :alt="heroProduct.name"
                    class="h-full w-full object-cover"
                    decoding="async"
                    @error="markImageFailed(heroImage)"
                  />
                </div>
                <div class="flex items-center justify-between gap-4 px-1 pb-1 pt-4 sm:px-2">
                  <div class="min-w-0">
                    <p class="text-xs font-medium text-[#64748B]">A find from the marketplace</p>
                    <p class="mt-1 truncate text-sm font-bold text-[#0F172A] sm:text-base">
                      {{ heroProduct.name }}
                    </p>
                    <p v-if="heroProduct.store" class="mt-1 truncate text-xs text-[#64748B]">
                      {{ heroProduct.store.name }}
                    </p>
                  </div>
                  <p class="shrink-0 text-sm font-extrabold text-[#2563EB] sm:text-base">
                    {{ formatPrice(heroProduct.price) }}
                  </p>
                </div>
              </div>
              <div
                v-else
                class="relative flex aspect-[4/3] w-full max-w-lg flex-col items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/[0.08] text-center"
                aria-hidden="true"
              >
                <div class="absolute -left-8 top-8 h-32 w-32 rounded-full bg-blue-400/20 blur-2xl" />
                <div class="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-[#2563EB] text-white shadow-xl shadow-blue-950/30">
                  <ShoppingBag class="h-11 w-11" />
                </div>
                <p class="relative mt-5 text-sm font-semibold tracking-wide text-blue-100">
                  Your next great find awaits
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div
        v-if="loadError"
        role="alert"
        class="mx-auto mb-4 flex max-w-7xl flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:mb-8 lg:px-8"
      >
        <p>{{ loadError }}</p>
        <button
          type="button"
          class="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-red-200 bg-white px-4 font-semibold text-red-800 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 sm:self-auto"
          :disabled="loading"
          @click="loadProducts"
        >
          <RefreshCw class="h-4 w-4" :class="loading ? 'animate-spin' : ''" aria-hidden="true" />
          Try again
        </button>
      </div>

      <section
        id="categories"
        aria-labelledby="categories-heading"
        class="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8"
      >
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.16em] text-[#2563EB]">Find your fit</p>
            <h2 id="categories-heading" class="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Shop by category
            </h2>
          </div>
          <button
            v-if="selectedCategoryId"
            type="button"
            class="rounded-lg px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            @click="selectedCategoryId = null"
          >
            View all categories
          </button>
        </div>

        <div v-if="loading" class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <div
            v-for="item in 6"
            :key="`category-skeleton-${item}`"
            class="h-36 animate-pulse rounded-2xl border border-[#E2E8F0] bg-white sm:h-40"
            aria-hidden="true"
          />
        </div>
        <div v-else-if="categories.length" class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <button
            v-for="category in categories"
            :key="category.id"
            type="button"
            class="group overflow-hidden rounded-2xl border bg-white text-left shadow-sm shadow-slate-900/[0.03] transition-colors hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
            :class="selectedCategoryId === String(category.id) ? 'border-[#2563EB] ring-2 ring-blue-100' : 'border-[#E2E8F0]'"
            :aria-pressed="selectedCategoryId === String(category.id)"
            @click="selectedCategoryId = selectedCategoryId === String(category.id) ? null : String(category.id)"
          >
            <div class="relative aspect-[2/1] overflow-hidden bg-blue-50">
              <img
                v-if="getCategoryImage(category.id)"
                :src="getCategoryImage(category.id)"
                :alt="`${category.name} products`"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
                loading="lazy"
                decoding="async"
                @error="markImageFailed(getCategoryImage(category.id))"
              />
              <div v-else class="flex h-full items-center justify-center text-[#2563EB]">
                <Tag class="h-7 w-7" aria-hidden="true" />
              </div>
            </div>
            <span class="flex items-center justify-between gap-2 px-3 py-3 text-sm font-bold text-[#0F172A] sm:px-4">
              <span class="truncate">{{ category.name }}</span>
              <ArrowRight class="h-4 w-4 shrink-0 text-[#64748B] transition-transform group-hover:translate-x-0.5 group-hover:text-[#2563EB]" aria-hidden="true" />
            </span>
          </button>
        </div>
        <p v-else-if="!loadError" class="mt-6 rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-5 py-8 text-center text-sm text-[#64748B]">
          Categories will appear here as products are added to the marketplace.
        </p>
      </section>

      <section
        aria-labelledby="offers-heading"
        class="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8"
      >
        <div class="mb-6 flex items-end justify-between gap-4">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.16em] text-[#2563EB]">Worth a look</p>
            <h2 id="offers-heading" class="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Special offers
            </h2>
          </div>
          <span class="hidden rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 sm:inline-flex">
            Compare-at pricing
          </span>
        </div>

        <div v-if="loading" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <div
            v-for="item in 4"
            :key="`offer-skeleton-${item}`"
            class="h-[340px] animate-pulse rounded-2xl border border-[#E2E8F0] bg-white"
            aria-hidden="true"
          />
        </div>
        <div v-else-if="specialOffers.length" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StorefrontProductCard
            v-for="product in specialOffers"
            :key="product.id"
            :product="product"
            :wishlisted="wishlistedProducts[product.id]"
            :wishlist-pending="wishlistPendingIds.has(product.id)"
            @wishlist="handleWishlist"
          />
        </div>
        <p v-else-if="!loadError" class="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-5 py-8 text-center text-sm text-[#64748B]">
          No special offers are available right now. Check back soon.
        </p>
      </section>

      <section
        id="new-arrivals"
        aria-labelledby="new-arrivals-heading"
        class="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8"
      >
        <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.16em] text-[#2563EB]">Fresh from our stores</p>
            <h2 id="new-arrivals-heading" class="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {{ selectedCategory ? `Latest in ${selectedCategory.name}` : "New arrivals" }}
            </h2>
          </div>
          <button
            v-if="selectedCategoryId"
            type="button"
            class="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:border-blue-200 hover:text-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            @click="selectedCategoryId = null"
          >
            Clear category
          </button>
          <a
            v-else
            href="#categories"
            class="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:border-blue-200 hover:text-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            Explore categories
            <ArrowRight class="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        <div v-if="loading" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <div
            v-for="item in 8"
            :key="`arrival-skeleton-${item}`"
            class="h-[340px] animate-pulse rounded-2xl border border-[#E2E8F0] bg-white"
            aria-hidden="true"
          />
        </div>
        <div v-else-if="newArrivals.length" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StorefrontProductCard
            v-for="product in newArrivals"
            :key="product.id"
            :product="product"
            :wishlisted="wishlistedProducts[product.id]"
            :wishlist-pending="wishlistPendingIds.has(product.id)"
            @wishlist="handleWishlist"
          />
        </div>
        <div v-else-if="!loadError" class="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-5 py-10 text-center">
          <ImageOff class="mx-auto h-8 w-8 text-[#64748B]" aria-hidden="true" />
          <p class="mt-3 font-semibold text-[#0F172A]">
            {{ selectedCategory ? "No products in this category yet" : "No products to show just yet" }}
          </p>
          <p class="mt-1 text-sm text-[#64748B]">
            Try another category or check back later.
          </p>
          <button
            v-if="selectedCategoryId"
            type="button"
            class="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            @click="selectedCategoryId = null"
          >
            View all new arrivals
          </button>
        </div>
      </section>

      <section class="mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 sm:pb-20 lg:px-8">
        <div class="flex flex-col items-start justify-between gap-6 rounded-3xl border border-blue-100 bg-blue-50 p-6 sm:flex-row sm:items-center sm:p-9">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.16em] text-[#2563EB]">Keep exploring</p>
            <h2 class="mt-2 text-2xl font-extrabold tracking-tight text-[#0F172A] sm:text-3xl">
              A great find could be next.
            </h2>
            <p class="mt-2 max-w-xl text-sm leading-6 text-[#64748B] sm:text-base">
              Browse the latest products and discover what Cobo Shop stores have to offer.
            </p>
          </div>
          <a
            href="#new-arrivals"
            class="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
          >
            Explore products
            <ArrowRight class="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>
    </main>
  </div>
</template>

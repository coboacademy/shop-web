<script setup lang="ts">
import { ArrowRight, Search, SlidersHorizontal, X } from "lucide-vue-next";
import {
  usePublicProducts,
  type PublicProduct,
  type PublicProductPagination,
} from "~/composables/usePublicProducts";

definePageMeta({
  layout: "public",
  title: "Shop products",
});

const { getProducts } = usePublicProducts();
const route = useRoute();
const router = useRouter();
const products = ref<PublicProduct[]>([]);
const pagination = ref<PublicProductPagination | null>(null);
const loading = ref(false);
const errorMessage = ref("");
const filterError = ref("");
const failedImageUrls = ref(new Set<string>());
const searchInput = ref("");
const minPriceInput = ref("");
const maxPriceInput = ref("");
const appliedFilters = reactive({
  search: "",
  min_price: undefined as number | undefined,
  max_price: undefined as number | undefined,
});

const searchQueryFromRoute = () =>
  typeof route.query.search === "string" ? route.query.search.slice(0, 100) : "";

const getErrorMessage = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof error.message === "string"
    ? error.message
    : "Unable to load products. Please try again.";

const formatPrice = (price: string | number | null | undefined) => {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return "Price unavailable";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const primaryImage = (product: PublicProduct) => {
  const image =
    product.images?.find((item) => item.is_primary)?.url ||
    product.images?.[0]?.url ||
    "";
  return failedImageUrls.value.has(image) ? "" : image;
};

const handleImageError = (url: string) => {
  failedImageUrls.value.add(url);
};

const loadProducts = async (page = 1) => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await getProducts({
      ...appliedFilters,
      page,
      per_page: 20,
    });
    products.value = response.data.products;
    pagination.value = response.data.pagination;
  } catch (error: unknown) {
    errorMessage.value = getErrorMessage(error);
    products.value = [];
    pagination.value = null;
  } finally {
    loading.value = false;
  }
};

const applyFilters = async () => {
  filterError.value = "";
  const search = searchInput.value.trim();
  const minPrice = minPriceInput.value === "" ? undefined : Number(minPriceInput.value);
  const maxPrice = maxPriceInput.value === "" ? undefined : Number(maxPriceInput.value);

  if (search.length > 100) {
    filterError.value = "Search must be 100 characters or fewer.";
    return;
  }
  if (
    (minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) ||
    (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0))
  ) {
    filterError.value = "Enter valid prices of 0 or greater.";
    return;
  }
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    filterError.value = "Minimum price cannot exceed maximum price.";
    return;
  }

  appliedFilters.search = search;
  // The documented repository ignores zero-valued bounds, so omit them.
  appliedFilters.min_price = minPrice || undefined;
  appliedFilters.max_price = maxPrice || undefined;
  await router.replace({
    query: { ...route.query, search: search || undefined },
  });
  await loadProducts(1);
};

const clearFilters = async () => {
  searchInput.value = "";
  minPriceInput.value = "";
  maxPriceInput.value = "";
  appliedFilters.search = "";
  appliedFilters.min_price = undefined;
  appliedFilters.max_price = undefined;
  filterError.value = "";
  await router.replace({
    query: { ...route.query, search: undefined },
  });
  await loadProducts(1);
};

const changePage = async (page: number) => {
  if (!pagination.value || loading.value) return;
  if (page < 1 || page > pagination.value.last_page) return;
  await loadProducts(page);
};

watch(
  () => route.query.search,
  (value) => {
    const search = typeof value === "string" ? value.slice(0, 100) : "";
    if (search === appliedFilters.search) return;

    searchInput.value = search;
    appliedFilters.search = search;
    void loadProducts(1);
  },
);

onMounted(() => {
  const search = searchQueryFromRoute();
  searchInput.value = search;
  appliedFilters.search = search;
  void loadProducts();
});
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <section class="border-b border-border bg-card">
      <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Cobo Shop</p>
        <div class="mt-3 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div class="max-w-2xl">
            <h1 class="text-4xl font-bold tracking-tight sm:text-5xl">Find something you’ll love.</h1>
            <p class="mt-4 text-base leading-7 text-muted-foreground">
              Explore products from our stores and discover something new.
            </p>
          </div>
          <div v-if="pagination" class="text-sm text-muted-foreground">
            {{ pagination.total }} {{ pagination.total === 1 ? "product" : "products" }}
          </div>
        </div>
      </div>
    </section>

    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <form
        class="mb-8 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
        @submit.prevent="applyFilters"
      >
        <div class="mb-4 flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal class="h-4 w-4 text-primary" />
          Search and filters
        </div>
        <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_160px_auto_auto]">
          <label class="relative">
            <span class="sr-only">Search products</span>
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              v-model="searchInput"
              type="search"
              maxlength="100"
              placeholder="Search products"
              class="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label>
            <span class="sr-only">Minimum price</span>
            <input
              v-model="minPriceInput"
              type="number"
              min="0"
              step="0.01"
              placeholder="Min price"
              class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label>
            <span class="sr-only">Maximum price</span>
            <input
              v-model="maxPriceInput"
              type="number"
              min="0"
              step="0.01"
              placeholder="Max price"
              class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <button
            type="submit"
            :disabled="loading"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Search class="h-4 w-4" />
            Search
          </button>
          <button
            type="button"
            :disabled="loading"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            @click="clearFilters"
          >
            <X class="h-4 w-4" />
            Clear
          </button>
        </div>
        <p v-if="filterError" class="mt-3 text-sm text-destructive" role="alert">{{ filterError }}</p>
      </form>

      <div v-if="errorMessage" class="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
        <p class="font-semibold text-destructive">We couldn’t load products.</p>
        <p class="mt-1 text-muted-foreground">{{ errorMessage }}</p>
        <button
          class="mt-3 font-semibold text-primary underline-offset-4 hover:underline"
          @click="loadProducts(pagination?.current_page || 1)"
        >
          Try again
        </button>
      </div>

      <div v-else-if="loading && !products.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div v-for="index in 8" :key="index" class="overflow-hidden rounded-2xl border border-border bg-card">
          <div class="aspect-[4/3] animate-pulse bg-muted" />
          <div class="space-y-3 p-4">
            <div class="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div class="h-4 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>

      <div v-else-if="!products.length" class="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <h2 class="text-xl font-semibold">No products found</h2>
        <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Try a different search or remove one of the price filters.
        </p>
        <button
          class="mt-5 rounded-xl border border-border px-4 py-2 text-sm font-semibold transition hover:bg-muted"
          @click="clearFilters"
        >
          Clear filters
        </button>
      </div>

      <div v-else class="space-y-6">
        <div class="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {{ pagination?.current_page || 1 }} of {{ pagination?.last_page || 1 }}
          </span>
          <span v-if="loading" role="status">Updating products…</span>
        </div>

        <section class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Products">
          <NuxtLink
            v-for="product in products"
            :key="product.id"
            :to="`/products/${encodeURIComponent(product.id)}`"
            class="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <div class="relative aspect-[4/3] overflow-hidden bg-muted">
              <img
                v-if="primaryImage(product)"
                :src="primaryImage(product)"
                :alt="product.name"
                class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
                @error="handleImageError(primaryImage(product))"
              />
              <div v-else class="flex h-full items-center justify-center text-sm text-muted-foreground">
                Image unavailable
              </div>
              <span
                v-if="product.categories?.[0]"
                class="absolute left-3 top-3 rounded-full border border-border/70 bg-background/90 px-3 py-1 text-xs font-medium backdrop-blur"
              >
                {{ product.categories[0].name }}
              </span>
            </div>
            <div class="p-4">
              <p v-if="product.store" class="text-xs font-medium text-muted-foreground">
                {{ product.store.name }}
              </p>
              <h2 class="mt-1 line-clamp-2 min-h-12 text-base font-semibold leading-6 group-hover:text-primary">
                {{ product.name }}
              </h2>
              <p v-if="product.description" class="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
                {{ product.description }}
              </p>
              <div class="mt-4 flex items-center justify-between gap-3">
                <div>
                  <p class="font-bold">{{ formatPrice(product.price) }}</p>
                  <p
                    v-if="product.compare_at_price && Number(product.compare_at_price) > Number(product.price)"
                    class="text-xs text-muted-foreground line-through"
                  >
                    {{ formatPrice(product.compare_at_price) }}
                  </p>
                </div>
                <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <ArrowRight class="h-4 w-4" />
                </span>
              </div>
            </div>
          </NuxtLink>
        </section>

        <nav
          v-if="pagination && pagination.last_page > 1"
          class="flex items-center justify-between border-t border-border pt-5"
          aria-label="Product pages"
        >
          <button
            class="rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="loading || pagination.current_page <= 1"
            @click="changePage(pagination.current_page - 1)"
          >
            Previous
          </button>
          <span class="text-sm text-muted-foreground">
            {{ pagination.current_page }} / {{ pagination.last_page }}
          </span>
          <button
            class="rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="loading || pagination.current_page >= pagination.last_page"
            @click="changePage(pagination.current_page + 1)"
          >
            Next
          </button>
        </nav>
      </div>
    </main>
  </div>
</template>

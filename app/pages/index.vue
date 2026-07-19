<script setup lang="ts">
import type { ProductItem } from "~/composables/useProduct";
import { ShoppingCart, Star, TrendingUp, Zap } from "lucide-vue-next";

definePageMeta({
  layout: "public",
  title: "Home - Shop All Products",
});

const { getProducts } = useProduct();
const cartStore = useCartStore();
const toast = useToast();

const products = ref<ProductItem[]>([]);
const loading = ref(false);
const error = ref("");
const search = ref("");
const sortBy = ref("newest");
const page = ref(1);
const perPage = ref(12);

const stats = ref({
  total: 0,
  active: 0,
  inStock: 0,
});

const filteredProducts = computed(() => {
  let filtered = [...products.value];

  // Filter by search
  if (search.value) {
    const query = search.value.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
    );
  }

  // Sort
  if (sortBy.value === "price-low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy.value === "price-high") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortBy.value === "newest") {
    filtered.sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    );
  }

  return filtered;
});

const paginatedProducts = computed(() => {
  const start = (page.value - 1) * perPage.value;
  const end = start + perPage.value;
  return filteredProducts.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / perPage.value);
});

const fetchProducts = async () => {
  loading.value = true;
  error.value = "";

  try {
    const response = await getProducts({
      status: "active",
      per_page: 100,
    });

    products.value = response.data.products || [];
    stats.value = {
      total: response.data.stats?.total_products || 0,
      active: response.data.stats?.active_products || 0,
      inStock: products.value.filter((p) => p.stock > 0).length,
    };
  } catch (err: any) {
    error.value =
      err.response?.data?.message ||
      "Failed to load products. Please try again later.";
  } finally {
    loading.value = false;
  }
};

const addToCart = (product: ProductItem) => {
  if (product.stock <= 0) {
    toast.warning("Out of Stock", "This product is currently unavailable.");
    return;
  }

  cartStore.addItem({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image_url || product.image || "",
    quantity: 1,
  });

  toast.success(
    "Added to Cart",
    `${product.name} has been added to your cart.`
  );
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

watch(search, () => {
  page.value = 1;
});

watch(sortBy, () => {
  page.value = 1;
});

onMounted(() => {
  fetchProducts();
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
    <!-- Hero Section -->
    <section
      class="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-4 py-20 sm:px-6 lg:px-8"
    >
      <div class="absolute inset-0 opacity-20">
        <div class="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-white/10"></div>
      </div>

      <div class="relative mx-auto max-w-7xl">
        <div class="text-center">
          <h1 class="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Welcome to Our Store
          </h1>

          <p class="mx-auto mt-4 max-w-2xl text-lg text-blue-100 sm:text-xl">
            Discover premium products with exclusive deals and fast delivery
          </p>

          <div class="mt-8 flex flex-wrap justify-center gap-4">
            <NuxtLink to="/products">
              <AppButton size="lg" class="bg-white text-blue-600 hover:bg-blue-50">
                <ShoppingCart class="h-5 w-5" />
                Shop Now
              </AppButton>
            </NuxtLink>

            <AppButton size="lg" variant="secondary" class="border-white text-white hover:bg-white/10">
              Learn More
            </AppButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-lg bg-white p-6 shadow-md dark:bg-slate-800">
          <div class="flex items-center gap-4">
            <div class="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
              <TrendingUp class="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p class="text-sm text-slate-600 dark:text-slate-400">Total Products</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {{ stats.total }}
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-white p-6 shadow-md dark:bg-slate-800">
          <div class="flex items-center gap-4">
            <div class="rounded-lg bg-green-100 p-3 dark:bg-green-900">
              <Zap class="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p class="text-sm text-slate-600 dark:text-slate-400">In Stock</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {{ stats.inStock }}
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-white p-6 shadow-md dark:bg-slate-800">
          <div class="flex items-center gap-4">
            <div class="rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900">
              <Star class="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p class="text-sm text-slate-600 dark:text-slate-400">Active Products</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {{ stats.active }}
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-white p-6 shadow-md dark:bg-slate-800">
          <div class="flex items-center gap-4">
            <div class="rounded-lg bg-purple-100 p-3 dark:bg-purple-900">
              <ShoppingCart class="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p class="text-sm text-slate-600 dark:text-slate-400">Cart Items</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {{ cartStore.items.length }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Products Section -->
    <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="mb-8">
        <h2 class="text-3xl font-bold text-slate-900 dark:text-white">
          Featured Products
        </h2>
        <p class="mt-2 text-slate-600 dark:text-slate-400">
          Browse our collection of premium products
        </p>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mb-6 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
        <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
      </div>

      <!-- Filters and Sort -->
      <div
        class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div class="flex-1">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Search Products
          </label>
          <input
            v-model="search"
            type="text"
            placeholder="Search by name or description..."
            class="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Sort By
          </label>
          <select
            v-model="sortBy"
            class="mt-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div
          v-for="i in 6"
          :key="i"
          class="animate-pulse rounded-lg bg-white p-4 dark:bg-slate-800"
        >
          <div class="mb-4 h-48 rounded-lg bg-slate-200 dark:bg-slate-700"></div>
          <div class="mb-2 h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700"></div>
          <div class="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700"></div>
        </div>
      </div>

      <!-- Products Grid -->
      <div
        v-else-if="paginatedProducts.length > 0"
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <div
          v-for="product in paginatedProducts"
          :key="product.id"
          class="group flex flex-col overflow-hidden rounded-lg bg-white shadow-md transition-all duration-300 hover:shadow-xl dark:bg-slate-800"
        >
          <!-- Product Image -->
          <div
            class="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-700"
          >
            <img
              v-if="product.image_url || product.image"
              :src="product.image_url || product.image"
              :alt="product.name"
              class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div v-else class="flex h-full items-center justify-center">
              <ShoppingCart class="h-12 w-12 text-slate-300 dark:text-slate-600" />
            </div>

            <!-- Stock Badge -->
            <div class="absolute right-0 top-0 p-3">
              <span
                :class="[
                  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                  product.stock > 0
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                ]"
              >
                {{ product.stock > 0 ? `${product.stock} in stock` : "Out of Stock" }}
              </span>
            </div>
          </div>

          <!-- Product Info -->
          <div class="flex flex-1 flex-col p-4">
            <h3
              class="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2"
            >
              {{ product.name }}
            </h3>

            <p
              v-if="product.description"
              class="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2"
            >
              {{ product.description }}
            </p>

            <div class="mt-2 flex flex-wrap gap-2">
              <span class="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {{ product.sku }}
              </span>
            </div>

            <!-- Price and Action -->
            <div class="mt-auto flex items-end justify-between pt-4">
              <div>
                <p
                  class="text-2xl font-bold text-slate-900 dark:text-white"
                >
                  {{ formatPrice(product.price) }}
                </p>
              </div>

              <AppButton
                size="sm"
                :disabled="product.stock <= 0"
                @click="addToCart(product)"
              >
                <ShoppingCart class="h-4 w-4" />
              </AppButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="rounded-lg bg-white p-12 text-center dark:bg-slate-800"
      >
        <ShoppingCart class="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
        <h3 class="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
          No products found
        </h3>
        <p class="mt-2 text-slate-600 dark:text-slate-400">
          Try adjusting your search or filters
        </p>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-8 flex items-center justify-between">
        <p class="text-sm text-slate-600 dark:text-slate-400">
          Showing {{ (page - 1) * perPage + 1 }} to
          {{ Math.min(page * perPage, filteredProducts.length) }} of
          {{ filteredProducts.length }} products
        </p>

        <div class="flex gap-2">
          <AppButton
            variant="secondary"
            size="sm"
            :disabled="page === 1"
            @click="page--"
          >
            Previous
          </AppButton>

          <div class="flex items-center gap-1">
            <button
              v-for="p in Math.min(totalPages, 5)"
              :key="p"
              :class="[
                'rounded px-3 py-2 text-sm font-medium transition',
                p === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700',
              ]"
              @click="page = p"
            >
              {{ p }}
            </button>
          </div>

          <AppButton
            variant="secondary"
            size="sm"
            :disabled="page === totalPages"
            @click="page++"
          >
            Next
          </AppButton>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div
        class="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center text-white sm:p-12"
      >
        <h2 class="text-3xl font-bold">Ready to Shop?</h2>
        <p class="mt-2 text-lg text-blue-100">
          Browse our complete collection and find what you're looking for
        </p>
        <NuxtLink to="/products" class="mt-6 inline-block">
          <AppButton size="lg" class="bg-white text-blue-600 hover:bg-blue-50">
            View All Products
          </AppButton>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

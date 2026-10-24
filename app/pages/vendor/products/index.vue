<script setup lang="ts">
import { Box, Package, Plus, RefreshCcw, Store as StoreIcon } from "lucide-vue-next";
import type { Product, ProductInventory, ProductPagination } from "~/composables/useProduct";
import type { Store } from "~/composables/useVendor";

definePageMeta({
  layout: "vendor",
  middleware: ["auth", "permission"],
  permission: "vendor.view",
  title: "Product Management",
});

const router = useRouter();
const { getStores } = useVendor();
const {
  getStoreProducts,
  getStoreProductVariants,
  getProductInventory,
  setStoreProductActive,
  deleteStoreProduct,
} = useProduct();
const toast = useToast();

const stores = ref<Store[]>([]);
const selectedStoreId = ref("");
const products = ref<Product[]>([]);
const pagination = ref<ProductPagination | null>(null);
const variantSummaries = ref<
  Record<
    string,
    {
      variantCount: number | null;
      inventory: Pick<ProductInventory, "quantity" | "reserved_quantity" | "available_quantity"> | null;
      stockLabel: string;
    }
  >
>({});
const summaryRequestId = ref(0);
const page = ref(1);
const perPage = ref(15);
const search = ref("");
const statusFilter = ref("");
const loadingStores = ref(true);
const loadingProducts = ref(false);
const storeError = ref("");
const productError = ref("");
const productActionId = ref("");
const productToDelete = ref<Product | null>(null);
const deleteDialogOpen = ref(false);
const deletingProduct = ref(false);

const storeOptions = computed(() =>
  stores.value.map((store) => ({ label: store.name, value: store.id })),
);
const availableStatuses = computed(() =>
  [...new Set(products.value.map((product) => product.status).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second)),
);
const filteredProducts = computed(() => {
  const query = search.value.trim().toLowerCase();
  return products.value.filter((product) => {
    const matchesSearch =
      !query ||
      [product.name, product.sku].some((value) => value.toLowerCase().includes(query));
    const matchesStatus =
      !statusFilter.value ||
      product.status.toLowerCase() === statusFilter.value.toLowerCase();
    return matchesSearch && matchesStatus;
  });
});
const productRows = computed(() =>
  filteredProducts.value.map((product) => ({
    ...product,
    variant_count: variantSummaries.value[product.id]?.variantCount ?? null,
    inventory: variantSummaries.value[product.id]?.inventory ?? null,
    stock_label: variantSummaries.value[product.id]?.stockLabel || "Loading…",
  })),
);
const productTotal = computed(() => pagination.value?.total);
const activeProducts = computed(
  () =>
    products.value.filter((product) =>
      ["active", "published", "live"].includes(product.status.toLowerCase()),
    ).length,
);
const draftProducts = computed(
  () => products.value.filter((product) => product.status.toLowerCase() === "draft").length,
);
const currentPage = computed(() => pagination.value?.current_page ?? page.value);
const currentPerPage = computed(() => pagination.value?.per_page ?? perPage.value);
const lastPage = computed(
  () =>
    pagination.value?.last_page ??
    (productTotal.value === undefined
      ? undefined
      : Math.max(1, Math.ceil(productTotal.value / currentPerPage.value))),
);
const hasPaginationMetadata = computed(
  () => productTotal.value !== undefined && lastPage.value !== undefined,
);
const canGoNext = computed(() => {
  if (loadingProducts.value) return false;
  if (lastPage.value !== undefined) return currentPage.value < lastPage.value;
  return products.value.length === perPage.value;
});

const fetchVariantSummaries = async (productList: Product[], requestId: number) => {
  let index = 0;
  let failed = 0;
  const worker = async () => {
    while (index < productList.length) {
      const product = productList[index++];
      const [variantsResult, inventoryResult] = await Promise.allSettled([
        getStoreProductVariants(product.id),
        getProductInventory(product.id),
      ]);
      if (requestId !== summaryRequestId.value) return;

      const variantCount =
        variantsResult.status === "fulfilled"
          ? variantsResult.value.data?.variants?.length ?? 0
          : null;
      const inventoryError =
        inventoryResult.status === "rejected" ? inventoryResult.reason : null;
      const isInventoryNotFound =
        typeof inventoryError === "object" &&
        inventoryError !== null &&
        "status" in inventoryError &&
        inventoryError.status === 404;
      const inventory =
        inventoryResult.status === "fulfilled"
          ? inventoryResult.value.data?.inventory ?? null
          : null;

      const inventoryFailed =
        inventoryResult.status === "rejected" && !isInventoryNotFound;
      if (variantsResult.status === "rejected" || inventoryFailed) {
        failed += 1;
      }

      variantSummaries.value = {
        ...variantSummaries.value,
        [product.id]: {
          variantCount,
          inventory,
          stockLabel: inventory
            ? ""
            : inventoryResult.status === "fulfilled" || isInventoryNotFound
              ? "Not tracked"
              : "Unavailable",
        },
      };
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, productList.length) }, worker));
  if (requestId === summaryRequestId.value && failed) {
    toast.error(
      "Some product data is unavailable",
      `Could not load inventory or variant data for ${failed} product${failed === 1 ? "" : "s"}.`,
    );
  }
};

const fetchProducts = async () => {
  const storeId = selectedStoreId.value;
  const requestId = ++summaryRequestId.value;
  variantSummaries.value = {};
  if (!storeId) {
    products.value = [];
    pagination.value = null;
    return;
  }
  loadingProducts.value = true;
  productError.value = "";
  try {
    const response = await getStoreProducts(storeId, {
      page: page.value,
      per_page: perPage.value,
    });
    products.value = Array.isArray(response.data?.products) ? response.data.products : [];
    pagination.value = response.data?.pagination || null;
    void fetchVariantSummaries(products.value, requestId);
    if (pagination.value?.current_page) page.value = pagination.value.current_page;
    if (pagination.value?.per_page) perPage.value = Math.min(pagination.value.per_page, 100);
  } catch (error: any) {
    productError.value = error.message || "Failed to load products.";
    toast.error("Products failed", productError.value);
  } finally {
    loadingProducts.value = false;
  }
};

const fetchStores = async () => {
  loadingStores.value = true;
  storeError.value = "";
  try {
    const response = await getStores();
    stores.value = response.data.stores || [];
    if (!stores.value.some((store) => store.id === selectedStoreId.value)) {
      selectedStoreId.value = stores.value[0]?.id || "";
    }
    if (selectedStoreId.value) await fetchProducts();
    else {
      products.value = [];
      pagination.value = null;
    }
  } catch (error: any) {
    storeError.value = error.message || "Failed to load your stores.";
    toast.error("Stores failed", storeError.value);
  } finally {
    loadingStores.value = false;
  }
};

const selectStore = async (storeId: string) => {
  selectedStoreId.value = storeId;
  page.value = 1;
  pagination.value = null;
  await fetchProducts();
};
const changePage = async (nextPage: number) => {
  if (nextPage < 1 || (lastPage.value !== undefined && nextPage > lastPage.value)) return;
  page.value = nextPage;
  await fetchProducts();
};
const changePerPage = async (value: string) => {
  perPage.value = Math.min(Number(value) || 15, 100);
  page.value = 1;
  await fetchProducts();
};
const resetFilters = () => {
  search.value = "";
  statusFilter.value = "";
};
const navigateToProduct = (product: Product, edit = false) =>
  router.push({
    path: `/vendor/products/${encodeURIComponent(product.id)}`,
    query: {
      store_id: selectedStoreId.value,
      ...(edit ? { mode: "edit" } : {}),
    },
  });
const navigateToVariants = (product: Product) =>
  router.push({
    path: `/vendor/products/${encodeURIComponent(product.id)}/variants`,
    query: { store_id: selectedStoreId.value },
  });
const navigateToCreate = () =>
  router.push({
    path: "/vendor/products/create",
    query: { store_id: selectedStoreId.value },
  });

const toggleProductStatus = async (product: Product) => {
  const active = !["active", "published", "live"].includes(product.status.toLowerCase());
  productActionId.value = product.id;
  try {
    const response = await setStoreProductActive(selectedStoreId.value, product.id, active);
    toast.success(
      active ? "Product activated" : "Product deactivated",
      response.message || `Product ${active ? "activated" : "deactivated"} successfully.`,
    );
    await fetchProducts();
  } catch (error: any) {
    toast.error("Product status failed", error.message || "Could not update product status.");
  } finally {
    productActionId.value = "";
  }
};

const deleteProduct = async () => {
  if (!productToDelete.value || !selectedStoreId.value) return;
  deletingProduct.value = true;
  try {
    const response = await deleteStoreProduct(selectedStoreId.value, productToDelete.value.id);
    toast.success("Product deleted", response.message || "Product deleted successfully.");
    if (products.value.length === 1 && page.value > 1) page.value -= 1;
    productToDelete.value = null;
    deleteDialogOpen.value = false;
    await fetchProducts();
  } catch (error: any) {
    toast.error("Product deletion failed", error.message || "Could not delete product.");
  } finally {
    deletingProduct.value = false;
  }
};

onMounted(fetchStores);
</script>

<template>
  <main class="mx-auto max-w-[1600px] space-y-6 pb-8">
    <section class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-semibold text-sky-700 dark:text-sky-300">Vendor workspace</p>
        <h1 class="mt-1 text-3xl font-bold tracking-tight text-card-foreground">Products</h1>
        <p class="mt-2 text-sm text-muted-foreground">
          Manage your catalog, product visibility, pricing, and variants.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <AppButton variant="secondary" :loading="loadingStores || loadingProducts" @click="fetchStores">
          <RefreshCcw class="h-4 w-4" />
          Refresh
        </AppButton>
        <AppButton :disabled="!selectedStoreId" @click="navigateToCreate">
          <Plus class="h-4 w-4" />
          Add product
        </AppButton>
      </div>
    </section>

    <AlertMessage v-if="storeError" type="error" title="Unable to load stores" :message="storeError" />
    <AlertMessage v-else-if="productError" type="error" title="Unable to load products" :message="productError" />

    <ProductStats
      :total="productTotal ?? products.length"
      :total-description="productTotal === undefined ? 'Loaded products' : 'Across this store'"
      :active="activeProducts"
      :drafts="draftProducts"
      :out-of-stock="null"
    />

    <ProductFilters
      v-model="search"
      :status="statusFilter"
      :statuses="availableStatuses"
      :store-id="selectedStoreId"
      :stores="storeOptions"
      :per-page="perPage"
      :loading="loadingStores"
      @update:status="statusFilter = $event"
      @update:store-id="selectStore"
      @update:per-page="changePerPage"
      @reset="resetFilters"
    />

    <section class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div class="flex flex-col gap-2 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 class="font-semibold text-card-foreground">Product catalog</h2>
          <p class="mt-1 text-xs text-muted-foreground">
            {{ filteredProducts.length }} shown from {{ products.length }} loaded products
          </p>
        </div>
        <p class="text-xs text-muted-foreground">
          Stock shows total, reserved, and available inventory.
        </p>
      </div>
      <ProductTable
        :rows="productRows"
        :loading="loadingStores || loadingProducts"
        :busy-product-id="productActionId"
        :empty-title="stores.length ? 'No products found' : 'No stores available'"
        :empty-message="
          stores.length
            ? search || statusFilter
              ? 'Try adjusting your search or status filter.'
              : 'Add a product to start building your store catalog.'
            : 'Create a vendor store before managing its products.'
        "
        @view="navigateToProduct"
        @edit="(product) => navigateToProduct(product, true)"
        @images="navigateToProduct"
        @variants="navigateToVariants"
        @toggle-status="toggleProductStatus"
        @delete="(product) => { productToDelete = product; deleteDialogOpen = true; }"
      />
    </section>

    <TablePagination
      v-if="hasPaginationMetadata"
      :current-page="currentPage"
      :last-page="lastPage || 1"
      :total="productTotal || 0"
      :per-page="currentPerPage"
      :loading="loadingProducts"
      label="products"
      @previous="changePage(currentPage - 1)"
      @next="changePage(currentPage + 1)"
      @page="changePage"
    />
    <div
      v-else-if="selectedStoreId && (products.length > 0 || page > 1)"
      class="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm"
    >
      <span class="text-muted-foreground">Page {{ currentPage }} · {{ products.length }} products</span>
      <div class="flex gap-2">
        <AppButton variant="secondary" size="sm" :disabled="currentPage <= 1 || loadingProducts" @click="changePage(currentPage - 1)">
          Previous
        </AppButton>
        <AppButton variant="secondary" size="sm" :disabled="!canGoNext" @click="changePage(currentPage + 1)">
          Next
        </AppButton>
      </div>
    </div>
    <div
      v-if="!loadingStores && !stores.length && !storeError"
      class="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground"
    >
      <StoreIcon class="h-5 w-5 shrink-0" />
      No vendor stores are connected to this account.
    </div>
    <div v-if="loadingStores && !stores.length" class="sr-only" role="status" aria-live="polite">
      <Box class="h-4 w-4" />
      Loading stores
    </div>

    <ConfirmDialog
      :open="deleteDialogOpen"
      title="Delete product"
      :message="`Delete ${productToDelete?.name || 'this product'}? This cannot be undone.`"
      confirm-label="Delete product"
      variant="danger"
      :loading="deletingProduct"
      @close="deleteDialogOpen = false"
      @confirm="deleteProduct"
    />
  </main>
</template>

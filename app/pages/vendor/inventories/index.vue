<script setup lang="ts">
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Clock3,
  RefreshCw,
  SlidersHorizontal,
  TriangleAlert,
  Warehouse,
} from "lucide-vue-next";
import type {
  ProductInventory,
  ProductInventoryMovement,
  ProductPagination,
} from "~/composables/useProduct";
import type { Store } from "~/composables/useVendor";

definePageMeta({
  layout: "vendor",
  middleware: ["auth", "permission"],
  permission: "vendor.view",
  title: "Inventory Management",
});

type InventoryView = "all" | "simple" | "variants" | "low-stock" | "out-of-stock";
type StockAction = "add" | "remove" | "adjust";

const route = useRoute();
const { getStores } = useVendor();
const {
  getVendorInventories,
  getVendorLowStockInventories,
  getVendorOutOfStockInventories,
  addProductStock,
  removeProductStock,
  adjustProductStock,
  addVariantStock,
  removeVariantStock,
  adjustVariantStock,
  getProductInventoryMovements,
  getVariantInventoryMovements,
} = useProduct();
const toast = useToast();
const stores = ref<Store[]>([]);
const selectedStoreId = ref("");
const loadingStores = ref(true);
const view = ref<InventoryView>(
  route.query.status === "low-stock" || route.query.status === "out-of-stock"
    ? route.query.status
    : "all",
);
const inventoryRows = ref<ProductInventory[]>([]);
const pagination = ref<ProductPagination | null>(null);
const page = ref(1);
const perPage = ref(15);
const search = ref("");
const loading = ref(false);
const error = ref("");
const stockModalItem = ref<ProductInventory | null>(null);
const stockAction = ref<StockAction>("add");
const stockQuantity = ref<string | number>("");
const stockReason = ref("");
const stockFormError = ref("");
const savingStock = ref(false);
const historyItem = ref<ProductInventory | null>(null);
const movements = ref<ProductInventoryMovement[]>([]);
const loadingMovements = ref(false);
const movementError = ref("");
const typeFilter = ref<"all" | "simple" | "variants">("all");

const scopedRows = computed(() => {
  const ownedStoreIds = new Set(stores.value.map((store) => store.id));
  return inventoryRows.value.filter((item) => {
    const productStoreId = item.product?.store_id;
    if (!productStoreId || !ownedStoreIds.has(productStoreId)) return false;
    if (selectedStoreId.value && productStoreId !== selectedStoreId.value) return false;
    if (typeFilter.value === "simple" && item.variant_id) return false;
    if (typeFilter.value === "variants" && !item.variant_id) return false;
    return true;
  });
});
const filteredRows = computed(() => {
  const query = search.value.trim().toLowerCase();
  return scopedRows.value.filter((item) => {
    if (!query) return true;
    return [item.product?.name, item.sku, item.product?.sku]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(query));
  });
});

const isStatusView = computed(() => view.value === "low-stock" || view.value === "out-of-stock");
const totalCount = computed(() => filteredRows.value.length);
const summary = computed(() => {
  const rows = scopedRows.value;
  const showingAllRows =
    view.value === "all" && typeFilter.value === "all" && !selectedStoreId.value && !search.value.trim();
  return {
    total: showingAllRows && pagination.value?.total !== undefined
      ? pagination.value.total
      : rows.length,
    totalDescription: showingAllRows && pagination.value?.total !== undefined
      ? "Across all stores"
      : "Loaded records",
    inStock: rows.filter((item) => !item.is_low_stock && !item.is_out_of_stock).length,
    lowStock: rows.filter((item) => item.is_low_stock && !item.is_out_of_stock).length,
    outOfStock: rows.filter((item) => item.is_out_of_stock).length,
  };
});
const lastPage = computed(() => {
  if (isStatusView.value) return Math.max(1, Math.ceil(filteredRows.value.length / perPage.value));
  return pagination.value?.last_page ?? Math.max(1, Math.ceil(totalCount.value / perPage.value));
});
const visibleRows = computed(() =>
  isStatusView.value
    ? filteredRows.value.slice((page.value - 1) * perPage.value, page.value * perPage.value)
    : filteredRows.value,
);

const loadInventories = async () => {
  loading.value = true;
  error.value = "";
  try {
    if (!stores.value.length) {
      inventoryRows.value = [];
      pagination.value = null;
      return;
    }
    if (view.value === "low-stock") {
      const response = await getVendorLowStockInventories();
      inventoryRows.value = response.data.inventories || [];
      pagination.value = null;
    } else if (view.value === "out-of-stock") {
      const response = await getVendorOutOfStockInventories();
      inventoryRows.value = response.data.inventories || [];
      pagination.value = null;
    } else {
      const response = await getVendorInventories({ page: page.value, per_page: perPage.value });
      inventoryRows.value = response.data.inventories || [];
      pagination.value = response.data.pagination || null;
      page.value = response.data.pagination?.current_page || page.value;
      perPage.value = Math.min(response.data.pagination?.per_page || perPage.value, 100);
    }
  } catch (requestError: any) {
    error.value = requestError.message || "Could not load inventory.";
    inventoryRows.value = [];
    pagination.value = null;
  } finally {
    loading.value = false;
  }
};

const loadStores = async () => {
  loadingStores.value = true;
  error.value = "";
  try {
    const response = await getStores();
    stores.value = response.data.stores || [];
    if (!stores.value.some((store) => store.id === selectedStoreId.value)) {
      selectedStoreId.value = "";
    }
    await loadInventories();
  } catch (requestError: any) {
    error.value = requestError.message || "Could not load your vendor stores.";
    inventoryRows.value = [];
    pagination.value = null;
  } finally {
    loadingStores.value = false;
  }
};

const selectView = async (nextView: InventoryView) => {
  view.value = nextView;
  typeFilter.value = nextView === "simple" || nextView === "variants" ? nextView : "all";
  page.value = 1;
  await loadInventories();
};

const selectStore = async (storeId: string) => {
  selectedStoreId.value = storeId;
  page.value = 1;
  if (!isStatusView.value) {
    await loadInventories();
  }
};

const changePage = async (nextPage: number) => {
  if (nextPage < 1 || nextPage > lastPage.value || loading.value) return;
  page.value = nextPage;
  if (!isStatusView.value) await loadInventories();
};

const changePageSize = async (event: Event) => {
  const value = Number((event.target as HTMLSelectElement).value);
  if (!Number.isInteger(value) || value < 1 || value > 100) return;
  perPage.value = value;
  page.value = 1;
  if (!isStatusView.value) await loadInventories();
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const openStockManager = (item: ProductInventory) => {
  stockModalItem.value = item;
  stockAction.value = "add";
  stockQuantity.value = "";
  stockReason.value = "";
  stockFormError.value = "";
};

const closeStockManager = () => {
  if (!savingStock.value) stockModalItem.value = null;
};

const saveStockChange = async () => {
  const item = stockModalItem.value;
  if (!item || (item.variant_id && !item.variant_id.trim())) return;
  const quantityInput = String(stockQuantity.value).trim();
  const quantity = Number(quantityInput);
  const reasonRequired = stockAction.value === "remove";
  const reservedQuantity = item.reserved_quantity ?? 0;
  if (
    !quantityInput ||
    !Number.isInteger(quantity) ||
    (stockAction.value === "adjust" ? quantity < 0 : quantity <= 0) ||
    (stockAction.value === "adjust" && quantity < reservedQuantity) ||
    (reasonRequired && !stockReason.value.trim())
  ) {
    stockFormError.value =
      stockAction.value === "adjust" && quantity < reservedQuantity
        ? `New total quantity cannot be below the reserved quantity (${reservedQuantity}).`
        : reasonRequired
          ? "Enter a positive whole-number quantity and a reason for removing stock."
          : stockAction.value === "adjust"
            ? "Enter a whole-number total quantity that is not below reserved stock."
            : "Enter a positive whole-number quantity.";
    return;
  }

  savingStock.value = true;
  stockFormError.value = "";
  try {
    const payload = {
      quantity,
      ...(stockReason.value.trim() ? { reason: stockReason.value.trim() } : {}),
    };
    const changeStock = item.variant_id
      ? stockAction.value === "add"
        ? addVariantStock(item.product_id, item.variant_id, payload)
        : stockAction.value === "remove"
          ? removeVariantStock(item.product_id, item.variant_id, payload)
          : adjustVariantStock(item.product_id, item.variant_id, payload)
      : stockAction.value === "add"
        ? addProductStock(item.product_id, payload)
        : stockAction.value === "remove"
          ? removeProductStock(item.product_id, payload)
          : adjustProductStock(item.product_id, payload);
    const response = await changeStock;
    toast.success(
      "Inventory updated",
      response.message || "Stock was updated successfully.",
    );
    stockModalItem.value = null;
    await loadInventories();
  } catch (requestError: any) {
    stockFormError.value = requestError.message || "Could not update inventory.";
    toast.error("Inventory update failed", stockFormError.value);
  } finally {
    savingStock.value = false;
  }
};

const openMovementHistory = async (item: ProductInventory) => {
  historyItem.value = item;
  movements.value = [];
  movementError.value = "";
  loadingMovements.value = true;
  try {
    if (item.variant_id) {
      const response = await getVariantInventoryMovements(item.product_id, item.variant_id);
      movements.value = response.data.movements || [];
    } else {
      const response = await getProductInventoryMovements(item.product_id);
      movements.value = (response.data.movements || []).filter(
        (movement) => movement.inventory_id === item.id,
      );
    }
  } catch (requestError: any) {
    movementError.value = requestError.message || "Could not load stock movement history.";
  } finally {
    loadingMovements.value = false;
  }
};

watch(search, () => {
  page.value = 1;
});

onMounted(loadStores);
</script>

<template>
  <main class="mx-auto max-w-7xl space-y-6 pb-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="flex items-center gap-2 text-sm font-medium text-sky-700 dark:text-sky-300">
          <Warehouse class="h-4 w-4" />
          Vendor operations
        </p>
        <h1 class="mt-2 text-3xl font-bold tracking-tight text-card-foreground">Inventory</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Monitor stock levels, resolve low-stock items, and review inventory activity.
        </p>
      </div>
      <AppButton variant="secondary" :loading="loading || loadingStores" :disabled="loading || loadingStores" @click="loadStores">
        <RefreshCw class="h-4 w-4" />
        Refresh
      </AppButton>
    </header>

    <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="stat in [
          { label: 'Total records', value: summary.total, description: summary.totalDescription, icon: Boxes, color: 'text-sky-700 dark:text-sky-300', tone: 'bg-sky-50 dark:bg-sky-950/40' },
          { label: 'In stock', value: summary.inStock, description: 'Loaded records', icon: CheckCircle2, color: 'text-emerald-700 dark:text-emerald-300', tone: 'bg-emerald-50 dark:bg-emerald-950/40' },
          { label: 'Low stock', value: summary.lowStock, description: 'Needs attention', icon: TriangleAlert, color: 'text-amber-700 dark:text-amber-300', tone: 'bg-amber-50 dark:bg-amber-950/40' },
          { label: 'Out of stock', value: summary.outOfStock, description: 'Unavailable items', icon: AlertTriangle, color: 'text-rose-700 dark:text-rose-300', tone: 'bg-rose-50 dark:bg-rose-950/40' },
        ]"
        :key="stat.label"
        class="rounded-2xl border border-border bg-card p-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-muted-foreground">{{ stat.label }}</p>
          <span class="flex h-9 w-9 items-center justify-center rounded-xl" :class="[stat.tone, stat.color]">
            <component :is="stat.icon" class="h-4 w-4" />
          </span>
        </div>
        <p class="mt-3 text-2xl font-bold tabular-nums text-card-foreground">{{ loadingStores ? "—" : stat.value }}</p>
        <p class="mt-1 text-xs text-muted-foreground">{{ stat.description }}</p>
      </article>
    </section>

    <section class="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="relative min-w-0 flex-1 lg:max-w-md">
          <label for="inventory-search" class="sr-only">Search inventory</label>
          <input
            id="inventory-search"
            v-model="search"
            type="search"
            placeholder="Search product name or SKU…"
            class="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-card-foreground outline-none transition placeholder:text-muted-foreground focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-950"
          />
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <label for="inventory-store" class="sr-only">Filter by your store</label>
          <select
            id="inventory-store"
            :value="selectedStoreId"
            :disabled="loadingStores || !stores.length"
            class="rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-card-foreground disabled:opacity-60"
            @change="selectStore(($event.target as HTMLSelectElement).value)"
          >
            <option value="">All my stores</option>
            <option v-for="store in stores" :key="store.id" :value="store.id">
              {{ store.name }}
            </option>
          </select>
          <label for="inventory-page-size" class="sr-only">Rows per page</label>
          <select
            v-if="!isStatusView"
            id="inventory-page-size"
            :value="perPage"
            class="rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-card-foreground"
            @change="changePageSize"
          >
            <option :value="15">15 per page</option>
            <option :value="30">30 per page</option>
            <option :value="50">50 per page</option>
            <option :value="100">100 per page</option>
          </select>
        </div>
      </div>

      <nav class="flex flex-wrap gap-2 border-t border-border pt-4" aria-label="Inventory filters">
          <button
            v-for="tab in [
              { id: 'all', label: 'All items' },
              { id: 'simple', label: 'Simple products' },
              { id: 'variants', label: 'Variants' },
              { id: 'low-stock', label: 'Low stock' },
              { id: 'out-of-stock', label: 'Out of stock' },
            ]"
            :key="tab.id"
            type="button"
            class="rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 dark:focus-visible:ring-sky-950"
            :class="view === tab.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-muted text-muted-foreground hover:text-card-foreground'"
            @click="selectView(tab.id as InventoryView)"
          >
            {{ tab.label }}
          </button>
      </nav>
      <p class="flex items-center gap-2 text-xs text-muted-foreground">
        <SlidersHorizontal class="h-3.5 w-3.5" />
        Each row represents one inventory record. Available stock and status follow the inventory API.
      </p>
    </section>

    <AlertMessage v-if="error" type="error" title="Inventory unavailable" :message="error" />

    <section class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <h2 class="font-semibold text-card-foreground">
            {{ view === "low-stock" ? "Low-stock items" : view === "out-of-stock" ? "Out-of-stock items" : typeFilter === "simple" ? "Simple product inventory" : typeFilter === "variants" ? "Variant inventory" : "Inventory items" }}
          </h2>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ totalCount }} matching {{ totalCount === 1 ? "record" : "records" }} · Available quantity is authoritative
          </p>
        </div>
      </div>

      <p v-if="loading || loadingStores" class="p-10 text-center text-sm text-muted-foreground">
        {{ loadingStores ? "Loading your stores…" : "Loading inventory…" }}
      </p>
      <p v-else-if="!stores.length && !error" class="p-10 text-center text-sm text-muted-foreground">
        No vendor stores are available for this account.
      </p>
      <div v-else-if="visibleRows.length" class="overflow-x-auto">
        <table class="w-full min-w-[1120px] text-left text-sm">
          <thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th class="px-5 py-3 font-semibold">Product</th>
              <th class="px-5 py-3 font-semibold">SKU</th>
              <th class="px-5 py-3 font-semibold">Type</th>
              <th class="px-5 py-3 font-semibold">Total</th>
              <th class="px-5 py-3 font-semibold">Reserved</th>
              <th class="px-5 py-3 font-semibold">Available</th>
              <th class="px-5 py-3 font-semibold">Status</th>
              <th class="px-5 py-3 font-semibold">Updated</th>
              <th class="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="item in visibleRows" :key="item.id" class="hover:bg-muted/30">
              <td class="px-5 py-4">
                <NuxtLink
                  :to="{
                    path: `/vendor/products/${encodeURIComponent(item.product_id)}`,
                    query: item.product?.store_id ? { store_id: item.product.store_id } : {},
                  }"
                  class="font-semibold text-card-foreground hover:text-sky-700 dark:hover:text-sky-300"
                >
                  {{ item.product?.name || "Unnamed product" }}
                </NuxtLink>
                <p class="mt-1 text-xs text-muted-foreground">
                  Threshold {{ item.low_stock_threshold }}
                </p>
              </td>
              <td class="px-5 py-4 font-mono text-xs text-muted-foreground">{{ item.sku || item.product?.sku || "—" }}</td>
              <td class="px-5 py-4">
                <AppBadge :variant="item.variant_id ? 'info' : 'default'">
                  {{ item.variant_id ? "Variant" : "Simple product" }}
                </AppBadge>
              </td>
              <td class="px-5 py-4 tabular-nums text-card-foreground">{{ item.quantity }}</td>
              <td class="px-5 py-4 tabular-nums text-card-foreground">{{ item.reserved_quantity ?? 0 }}</td>
              <td class="px-5 py-4 tabular-nums font-semibold text-card-foreground">{{ item.available_quantity }}</td>
              <td class="px-5 py-4">
                <AppBadge v-if="item.is_out_of_stock" variant="danger">Out of stock</AppBadge>
                <AppBadge v-else-if="item.is_low_stock" variant="warning">Low stock</AppBadge>
                <AppBadge v-else variant="success">In stock</AppBadge>
              </td>
              <td class="px-5 py-4 text-muted-foreground">{{ formatDate(item.updated_at) }}</td>
              <td class="px-5 py-4">
                <div class="flex justify-end gap-2">
                  <AppButton size="sm" variant="secondary" :disabled="savingStock" @click="openStockManager(item)">
                    Manage stock
                  </AppButton>
                  <AppButton size="sm" variant="ghost" :disabled="loadingMovements" @click="openMovementHistory(item)">
                    History
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else-if="!error" class="px-6 py-12 text-center">
        <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <AlertTriangle class="h-5 w-5" />
        </span>
        <h3 class="mt-4 font-semibold text-card-foreground">No inventory records found</h3>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ search ? "Try another product name or SKU." : "Inventory records will appear here when they are created for products." }}
        </p>
      </div>

      <footer
        v-if="!loading && !error && totalCount > 0"
        class="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4"
      >
        <p class="text-sm text-muted-foreground">Page {{ page }} of {{ lastPage }}</p>
        <div class="flex gap-2">
          <AppButton variant="secondary" size="sm" :disabled="page <= 1 || loading" @click="changePage(page - 1)">
            Previous
          </AppButton>
          <AppButton variant="secondary" size="sm" :disabled="page >= lastPage || loading" @click="changePage(page + 1)">
            Next
          </AppButton>
        </div>
      </footer>
    </section>

    <AppModal
      :open="!!stockModalItem"
      title="Manage stock"
      :subtitle="stockModalItem ? `${stockModalItem.product?.name || 'Product'}${stockModalItem.variant_id ? ' · Variant' : ''} · SKU ${stockModalItem.sku || stockModalItem.product?.sku || '—'}` : ''"
      @close="closeStockManager"
    >
      <div v-if="stockModalItem" class="grid grid-cols-3 gap-3">
        <div class="rounded-xl bg-muted/50 p-3">
          <p class="text-xs text-muted-foreground">Total</p>
          <p class="mt-1 text-xl font-bold tabular-nums text-card-foreground">{{ stockModalItem.quantity }}</p>
        </div>
        <div class="rounded-xl bg-muted/50 p-3">
          <p class="text-xs text-muted-foreground">Reserved</p>
          <p class="mt-1 text-xl font-bold tabular-nums text-card-foreground">{{ stockModalItem.reserved_quantity ?? 0 }}</p>
        </div>
        <div class="rounded-xl bg-muted/50 p-3">
          <p class="text-xs text-muted-foreground">Available</p>
          <p class="mt-1 text-xl font-bold tabular-nums text-card-foreground">{{ stockModalItem.available_quantity }}</p>
        </div>
      </div>

      <AlertMessage
        v-if="stockFormError"
        class="mt-4"
        type="error"
        title="Stock update failed"
        :message="stockFormError"
      />

      <div class="mt-5 space-y-4">
        <div>
          <label for="stock-operation" class="mb-2 block text-sm font-medium text-card-foreground">
            Stock operation
          </label>
          <select
            id="stock-operation"
            v-model="stockAction"
            :disabled="savingStock"
            class="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-card-foreground outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-950"
          >
            <option value="add">Add stock — receive new units</option>
            <option value="remove">Remove stock — damaged or lost</option>
            <option value="adjust">Adjust stock — set physical count</option>
          </select>
        </div>
        <div>
          <label for="stock-quantity" class="mb-2 block text-sm font-medium text-card-foreground">
            {{ stockAction === "adjust" ? "New total quantity" : "Quantity" }}
          </label>
          <input
            id="stock-quantity"
            v-model="stockQuantity"
            type="number"
            min="0"
            step="1"
            :placeholder="stockAction === 'adjust' ? 'Enter verified physical count' : 'Enter quantity'"
            :disabled="savingStock"
            class="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-card-foreground outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-950"
          />
          <p class="mt-1 text-xs text-muted-foreground">
            <template v-if="stockAction === 'adjust'">Sets total stock to the verified physical count.</template>
            <template v-else-if="stockAction === 'remove'">Subtracts this quantity from the current total.</template>
            <template v-else>Adds this quantity to the current total.</template>
          </p>
        </div>
        <div>
          <label for="stock-reason" class="mb-2 block text-sm font-medium text-card-foreground">
            Reason {{ stockAction === "remove" ? "(required)" : "(optional)" }}
          </label>
          <input
            id="stock-reason"
            v-model="stockReason"
            type="text"
            :required="stockAction === 'remove'"
            :placeholder="stockAction === 'remove' ? 'e.g. Damaged goods' : stockAction === 'adjust' ? 'e.g. Cycle count correction' : 'e.g. Restock received'"
            :disabled="savingStock"
            class="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-card-foreground outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-950"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <AppButton variant="secondary" :disabled="savingStock" @click="closeStockManager">
            Cancel
          </AppButton>
          <AppButton :loading="savingStock" @click="saveStockChange">
            Save stock change
          </AppButton>
        </div>
      </template>
    </AppModal>

    <AppModal
      :open="!!historyItem"
      title="Stock movement history"
      :subtitle="historyItem ? `${historyItem.product?.name || 'Product'}${historyItem.variant_id ? ' · Variant' : ''} · SKU ${historyItem.sku || historyItem.product?.sku || '—'}` : ''"
      size="lg"
      @close="historyItem = null"
    >
      <AlertMessage
        v-if="movementError"
        type="error"
        title="History unavailable"
        :message="movementError"
      />
      <p v-else-if="loadingMovements" class="py-10 text-center text-sm text-muted-foreground">
        Loading stock movements…
      </p>
      <ol v-else-if="movements.length" class="divide-y divide-border">
        <li
          v-for="movement in movements"
          :key="movement.id"
          class="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0"
        >
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <AppBadge
                :variant="movement.type === 'stock_in' ? 'success' : movement.type === 'stock_out' ? 'warning' : 'info'"
              >
                {{ movement.type.replace(/_/g, " ") }}
              </AppBadge>
              <span class="text-sm font-medium text-card-foreground">
                {{ movement.reason || "No reason provided" }}
              </span>
            </div>
            <p class="mt-1 text-xs text-muted-foreground">
              {{ movement.creator?.name ? `By ${movement.creator.name} · ` : "" }}{{ formatDateTime(movement.created_at) }}
            </p>
          </div>
          <p class="shrink-0 text-right text-sm tabular-nums text-card-foreground">
            {{ movement.before_quantity }} <span aria-hidden="true">→</span> {{ movement.after_quantity }}
            <span class="block text-xs text-muted-foreground">Change {{ movement.quantity }}</span>
          </p>
        </li>
      </ol>
      <div v-else class="py-10 text-center">
        <Clock3 class="mx-auto h-8 w-8 text-muted-foreground" />
        <p class="mt-3 text-sm font-medium text-card-foreground">No stock movements yet</p>
        <p class="mt-1 text-xs text-muted-foreground">Stock changes will appear here when recorded.</p>
      </div>
    </AppModal>
  </main>
</template>

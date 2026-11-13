<script setup lang="ts">
import {
  Eye,
  Image as ImageIcon,
  Layers3,
  MoreHorizontal,
  Package,
  Pencil,
  Play,
  Pause,
  Trash2,
} from "lucide-vue-next";
import type { Product } from "~/composables/useProduct";
import type { ProductInventorySummary } from "~/utils/productInventorySummary";
import InventorySummary from "./InventorySummary.vue";

export interface ProductTableRow extends Product {
  inventory_summary: ProductInventorySummary | null;
}

const props = defineProps<{
  rows: ProductTableRow[];
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  busyProductId?: string;
}>();

const emit = defineEmits<{
  (event: "view", product: Product): void;
  (event: "edit", product: Product): void;
  (event: "images", product: Product): void;
  (event: "variants", product: Product): void;
  (event: "toggle-status", product: Product): void;
  (event: "delete", product: Product): void;
}>();

const columns = [
  { key: "product", label: "Product", width: "18rem" },
  { key: "category", label: "Category" },
  { key: "price", label: "Price" },
  { key: "inventory", label: "Inventory" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Created" },
  { key: "actions", label: "Actions", align: "right" as const },
];

const formatPrice = (value: string) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : value;
};

const isActive = (status: string) =>
  ["active", "published", "live"].includes(status.toLowerCase());

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
};
</script>

<template>
  <DataTable
    :columns="columns"
    :rows="props.rows"
    :loading="props.loading"
    :empty-title="props.emptyTitle"
    :empty-message="props.emptyMessage"
  >
    <template #cell-product="{ row }">
      <div class="flex min-w-56 items-center gap-3">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted text-muted-foreground">
          <Package class="h-5 w-5" />
        </div>
        <div class="min-w-0">
          <p class="truncate font-semibold text-card-foreground">{{ row.name }}</p>
          <p class="mt-1 truncate font-mono text-xs text-muted-foreground">
            {{ row.sku || "No SKU" }}
          </p>
        </div>
      </div>
    </template>
    <template #cell-category="{ row }">
      <span class="text-sm text-muted-foreground">
        {{ row.categories?.length ? row.categories.map((category) => category.name).join(", ") : "Uncategorized" }}
      </span>
    </template>
    <template #cell-price="{ row }">
      <div>
        <p class="font-semibold text-card-foreground">{{ formatPrice(row.price) }}</p>
        <p
          v-if="row.compare_at_price && row.compare_at_price !== row.price"
          class="mt-1 text-xs text-muted-foreground line-through"
        >
          {{ formatPrice(row.compare_at_price) }}
        </p>
      </div>
    </template>
    <template #cell-inventory="{ row }">
      <InventorySummary :summary="row.inventory_summary" />
    </template>
    <template #cell-status="{ row }">
      <ProductStatusBadge :status="row.status" />
    </template>
    <template #cell-created_at="{ row }">
      <span class="text-xs text-muted-foreground">
        {{ formatDate(row.created_at) }}
      </span>
    </template>
    <template #cell-actions="{ row }">
      <div class="flex items-center justify-end gap-1">
        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
          :disabled="props.busyProductId === row.id"
          aria-label="View product"
          title="View product"
          @click="emit('view', row)"
        >
          <Eye class="h-4 w-4" />
        </button>
        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
          :disabled="props.busyProductId === row.id"
          aria-label="Edit product"
          title="Edit product"
          @click="emit('edit', row)"
        >
          <Pencil class="h-4 w-4" />
        </button>
        <AppDropdown
          :button-icon="MoreHorizontal"
          width="w-64"
          :items="[
            { label: 'Manage variants', value: 'variants', icon: Layers3, description: 'Options, variants, and inventory', disabled: props.busyProductId === row.id },
            { label: 'Manage images', value: 'images', icon: ImageIcon, description: 'Upload and organize product images', disabled: props.busyProductId === row.id },
            { label: isActive(row.status) ? 'Deactivate product' : 'Activate product', value: 'status', icon: isActive(row.status) ? Pause : Play, description: 'Change product visibility', disabled: props.busyProductId === row.id },
            { label: 'Delete product', value: 'delete', icon: Trash2, variant: 'danger', description: 'Permanently remove this product', disabled: props.busyProductId === row.id },
          ]"
          @select="
            $event === 'variants' ? emit('variants', row)
              : $event === 'images' ? emit('images', row)
              : $event === 'status' ? emit('toggle-status', row)
              : emit('delete', row)
          "
        />
      </div>
    </template>
  </DataTable>
</template>

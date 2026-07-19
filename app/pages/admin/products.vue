<script setup lang="ts">
import type { ProductItem, ProductPayload } from "~/composables/useProduct";
import {
  Archive,
  Boxes,
  CheckCircle2,
  Edit,
  Package,
  Plus,
  RefreshCcw,
  Trash2,
  TriangleAlert,
} from "lucide-vue-next";

import { useProductManagementStore } from "~/stores/inventory/productStore";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth", "permission"],
  permission: "product.view",
  title: "Products",
});
const { createProduct, updateProduct, deleteProduct } = useProduct();

const productStore = useProductManagementStore();

const toast = useToast();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const productRows = computed<ProductItem[]>(() => {
  return Array.isArray(productStore.products) ? productStore.products : [];
});

const productCount = computed(() => productRows.value.length);

const currentPage = computed(() => productStore.currentPage ?? 1);
const lastPage = computed(() => productStore.lastPage ?? 1);
const totalItems = computed(() => productStore.totalItems ?? 0);

const totalProducts = computed(() => productStore.totalProducts ?? 0);
const activeProducts = computed(() => productStore.activeProducts ?? 0);
const draftProducts = computed(() => productStore.draftProducts ?? 0);
const lowStockProducts = computed(() => productStore.lowStockProducts ?? 0);

const loading = computed(() => productStore.loading);
const refreshing = computed(() => productStore.refreshing);
const errorMessage = computed(() => productStore.errorMessage);

const search = ref("");
const status = ref("");
const page = ref(1);
const perPage = ref(10);

const modalOpen = ref(false);
const selectedProduct = ref<ProductItem | null>(null);

const confirmOpen = ref(false);
const confirmLoading = ref(false);
const confirmProduct = ref<ProductItem | null>(null);

const canCreateProduct = computed(() => {
  return authStore.hasPermission("product.create");
});

const canUpdateProduct = computed(() => {
  return authStore.hasPermission("product.update");
});

const canDeleteProduct = computed(() => {
  return authStore.hasPermission("product.delete");
});

const saving = ref(false);

const form = reactive<ProductPayload>({
  name: "",
  sku: "",
  description: "",
  price: 0,
  stock: 0,
  status: "active",
  image: null,
});

const formErrors = reactive<Record<string, string>>({
  name: "",
  sku: "",
  description: "",
  price: "",
  stock: "",
  status: "",
  image: "",
});

const imagePreview = ref<string | null>(null);

const columns = [
  { key: "product", label: "Product" },
  { key: "sku", label: "SKU" },
  { key: "price", label: "Price" },
  { key: "stock", label: "Stock" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Created" },
  { key: "actions", label: "Actions", align: "right" as const },
];

const fetchProducts = async (
  options: {
    force?: boolean;
    silent?: boolean;
  } = {}
) => {
  await productStore.fetchProducts(
    {
      search: search.value,
      status: status.value,
      page: page.value,
      per_page: perPage.value,
    },
    options
  );
};

const handleRefresh = async () => {
  await fetchProducts({
    force: true,
    silent: true,
  });
};

const resetFormErrors = () => {
  Object.keys(formErrors).forEach((key) => {
    formErrors[key] = "";
  });
};

const resetForm = () => {
  form.name = "";
  form.sku = "";
  form.description = "";
  form.price = 0;
  form.stock = 0;
  form.status = "active";
  form.image = null;
  imagePreview.value = null;

  resetFormErrors();
};

const handleImageChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    form.image = null;
    imagePreview.value = null;
    return;
  }

  form.image = file;
  imagePreview.value = URL.createObjectURL(file);
};

const openCreate = () => {
  selectedProduct.value = null;
  resetForm();
  modalOpen.value = true;
};

const openEdit = (product: ProductItem) => {
  selectedProduct.value = product;

  form.name = product.name;
  form.sku = product.sku;
  form.description = product.description || "";
  form.price = Number(product.price);
  form.stock = Number(product.stock);
  form.status = product.status;
  form.image = null;
  imagePreview.value = product.image_url || null;

  resetFormErrors();
  modalOpen.value = true;
};

const closeModal = () => {
  if (saving.value) return;

  modalOpen.value = false;
  selectedProduct.value = null;
  resetForm();
};

const saveProduct = async () => {
  saving.value = true;
  resetFormErrors();

  try {
    const payload = {
      name: form.name,
      sku: form.sku,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      status: form.status,
      image: form.image,
    };

    if (selectedProduct.value) {
      const response = await updateProduct(selectedProduct.value.id, payload);

      const updated =
        response?.data?.product || response?.product || response?.data || response;

      // refresh store data after update
      await productStore.invalidateAndRefresh();
      toast.success("Product updated", "Product information was updated successfully.");
    } else {
      const response = await createProduct(payload);

      const created =
        response?.data?.product || response?.product || response?.data || response;
      // refresh store data after create
      await productStore.invalidateAndRefresh();
      toast.success("Product created", "New product was created successfully.");
    }

    closeModal();
    await notificationStore.refreshNotifications();
  } catch (error: any) {
    const message =
      error.response?.data?.message || error.message || "Failed to save product";

    toast.error("Save failed", message);

    const errors = error.response?.data?.errors || error.errors;

    if (errors) {
      formErrors.name = errors.name?.[0] || "";
      formErrors.sku = errors.sku?.[0] || "";
      formErrors.description = errors.description?.[0] || "";
      formErrors.price = errors.price?.[0] || "";
      formErrors.stock = errors.stock?.[0] || "";
      formErrors.status = errors.status?.[0] || "";
      formErrors.image = errors.image?.[0] || "";
    }
  } finally {
    saving.value = false;
  }
};

const openDeleteConfirm = (product: ProductItem) => {
  confirmProduct.value = product;
  confirmOpen.value = true;
};

const closeDeleteConfirm = () => {
  if (confirmLoading.value) return;

  confirmOpen.value = false;
  confirmProduct.value = null;
};

const handleDelete = async () => {
  if (!confirmProduct.value) return;

  confirmLoading.value = true;

  try {
    await deleteProduct(confirmProduct.value.id);

    toast.success(
      "Product deleted",
      `${confirmProduct.value.name} was deleted successfully.`
    );

    closeDeleteConfirm();

    await productStore.invalidateAndRefresh();
    await notificationStore.refreshNotifications();
  } catch (error: any) {
    toast.error(
      "Delete failed",
      error.response?.data?.message || error.message || "Failed to delete product"
    );
  } finally {
    confirmLoading.value = false;
  }
};

const handleProductAction = (product: ProductItem, action: string) => {
  if (action === "edit") {
    openEdit(product);
    return;
  }

  if (action === "delete") {
    openDeleteConfirm(product);
  }
};

const resetFilters = async () => {
  search.value = "";
  status.value = "";
  page.value = 1;

  await fetchProducts();
};

const goPrevious = async () => {
  if (page.value <= 1) return;

  page.value--;
  await fetchProducts();
};

const goNext = async () => {
  if (page.value >= lastPage.value) return;

  page.value++;
  await fetchProducts();
};

const goToPage = async (targetPage: number) => {
  if (targetPage < 1) return;
  if (targetPage > lastPage.value) return;

  page.value = targetPage;
  await fetchProducts();
};

const statusVariant = (value: string) => {
  if (value === "active") return "success";
  if (value === "draft") return "warning";
  if (value === "inactive") return "default";

  return "default";
};
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

watch(search, () => {
  page.value = 1;

  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(async () => {
    await fetchProducts();
  }, 400);
});

watch(status, async () => {
  page.value = 1;
  await fetchProducts();
});

onMounted(async () => {
  await fetchProducts({
    silent: productStore.hasData,
  });
});

onBeforeUnmount(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Products Management"
      subtitle="Manage product inventory, pricing, stock, and publishing status."
    >
      <template #actions>
        <AppButton variant="secondary" :loading="refreshing" @click="handleRefresh">
          <RefreshCcw class="h-4 w-4" />
          Refresh
        </AppButton>

        <AppButton v-if="canCreateProduct" @click="openCreate">
          <Plus class="h-4 w-4" />
          Add Product
        </AppButton>
      </template>
    </PageHeader>

    <AlertMessage
      v-if="errorMessage"
      type="error"
      title="Unable to load products"
      :message="errorMessage"
    />

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        title="Total Products"
        :value="totalProducts"
        subtitle="All inventory items"
        tone="info"
      >
        <template #badge>
          <AppBadge variant="info" shape="square" size="md">
            <Package class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard
        title="Active"
        :value="activeProducts"
        subtitle="Published products"
        tone="success"
      >
        <template #badge>
          <AppBadge variant="success" shape="square" size="md">
            <CheckCircle2 class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard
        title="Draft"
        :value="draftProducts"
        subtitle="Not published yet"
        tone="warning"
      >
        <template #badge>
          <AppBadge variant="warning" shape="square" size="md">
            <Archive class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard
        title="Low Stock"
        :value="lowStockProducts"
        subtitle="Stock less than or equal 5"
        tone="danger"
      >
        <template #badge>
          <AppBadge variant="danger" shape="square" size="md">
            <TriangleAlert class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>
    </div>

    <FilterBar
      title="Filters"
      subtitle="Search and filter product inventory."
      columns="2"
    >
      <AppInput
        v-model="search"
        label="Search"
        placeholder="Search product name, SKU, description..."
      />

      <AppSelect
        v-model="status"
        label="Status"
        placeholder="All Status"
        :options="[
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Draft', value: 'draft' },
        ]"
      />

      <template #actions>
        <AppButton variant="secondary" @click="resetFilters"> Reset </AppButton>
      </template>
    </FilterBar>

    <DataTable
      :columns="columns"
      :rows="productRows"
      :loading="loading && productCount === 0"
      empty-title="No products found"
      empty-message="Create your first product to start managing inventory."
    >
      <template #cell-product="{ row }">
        <div class="flex items-center gap-3">
          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted"
          >
            <img
              v-if="row.image_url"
              :src="row.image_url"
              :alt="row.name"
              class="h-full w-full object-cover"
            />

            <Boxes v-else class="h-5 w-5 text-muted-foreground" />
          </div>

          <div class="min-w-0">
            <p class="truncate text-sm font-bold text-card-foreground">
              {{ row.name }}
            </p>

            <p class="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {{ row.description || "No description" }}
            </p>
          </div>
        </div>
      </template>

      <template #cell-sku="{ row }">
        <code
          class="rounded-lg border border-border bg-muted px-2 py-1 text-xs font-semibold text-card-foreground"
        >
          {{ row.sku }}
        </code>
      </template>

      <template #cell-price="{ row }">
        <span class="text-sm font-bold text-card-foreground">
          ${{ Number(row.price).toFixed(2) }}
        </span>
      </template>

      <template #cell-stock="{ row }">
        <AppBadge :variant="row.stock <= 5 ? 'danger' : 'success'">
          {{ row.stock }} stock
        </AppBadge>
      </template>

      <template #cell-status="{ row }">
        <AppBadge :variant="statusVariant(row.status)">
          {{ row.status }}
        </AppBadge>
      </template>

      <template #cell-created_at="{ row }">
        <span class="text-sm text-muted-foreground">
          {{ row.created_at || "—" }}
        </span>
      </template>

      <template #cell-actions="{ row }">
        <AppDropdown
          width="w-64"
          :items="[
            {
              label: 'Edit Product',
              value: 'edit',
              icon: Edit,
              visible: canUpdateProduct,
              description: 'Update product information',
            },
            {
              label: 'Delete Product',
              value: 'delete',
              icon: Trash2,
              variant: 'danger',
              visible: canDeleteProduct,
              description: 'Remove this product',
            },
          ]"
          @select="handleProductAction(row, $event)"
        />
      </template>
    </DataTable>

    <TablePagination
      :current-page="currentPage"
      :last-page="lastPage"
      :total="totalItems"
      :per-page="perPage"
      :loading="loading && productCount === 0"
      @previous="goPrevious"
      @next="goNext"
      @page="goToPage"
      label="products"
    />

    <AppModal
      :open="modalOpen"
      :title="selectedProduct ? 'Edit Product' : 'Create Product'"
      :subtitle="
        selectedProduct
          ? 'Update product inventory information.'
          : 'Create a new product inventory item.'
      "
      size="lg"
      @close="closeModal"
    >
      <template #icon>
        <Package class="h-5 w-5" />
      </template>

      <form class="space-y-5" @submit.prevent="saveProduct">
        <div class="grid gap-5 md:grid-cols-2">
          <AppInput
            v-model="form.name"
            label="Product Name"
            placeholder="Example: MacBook Pro 14"
            :error="formErrors.name"
          />

          <AppInput
            v-model="form.sku"
            label="SKU"
            placeholder="Example: MBP-14-001"
            :error="formErrors.sku"
          />

          <AppInput
            v-model.number="form.price"
            label="Price"
            type="number"
            placeholder="0.00"
            :error="formErrors.price"
          />

          <AppInput
            v-model.number="form.stock"
            label="Stock"
            type="number"
            placeholder="0"
            :error="formErrors.stock"
          />
          <AppSelect
            v-model="form.status"
            label="Status"
            placeholder="Select status"
            :options="[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
              { label: 'Draft', value: 'draft' },
            ]"
            :error="formErrors.status"
          />
        </div>

        <div class="rounded-3xl border border-border bg-muted/40 p-5">
          <label class="text-sm font-semibold text-card-foreground">
            Product Image
          </label>

          <div class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div
              class="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border border-border bg-card"
            >
              <img
                v-if="imagePreview"
                :src="imagePreview"
                alt="Product preview"
                class="h-full w-full object-cover"
              />

              <Package v-else class="h-8 w-8 text-muted-foreground" />
            </div>

            <div class="flex-1">
              <input
                type="file"
                name="image"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                class="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-xl file:border-0 file:bg-foreground file:px-4 file:py-2 file:text-sm file:font-semibold file:text-background hover:file:opacity-90"
                @change="handleImageChange"
              />

              <p class="mt-2 text-xs text-muted-foreground">
                Upload JPG, PNG, or WEBP. Max size 2MB.
              </p>

              <p
                v-if="formErrors.image"
                class="mt-2 text-sm font-medium text-rose-600 dark:text-rose-400"
              >
                {{ formErrors.image }}
              </p>
            </div>
          </div>
        </div>

        <AppTextarea
          v-model="form.description"
          label="Description"
          placeholder="Write product description..."
          :error="formErrors.description"
        />

        <div class="flex justify-end gap-3 border-t border-border pt-5">
          <AppButton
            type="button"
            variant="secondary"
            :disabled="saving"
            @click="closeModal"
          >
            Cancel
          </AppButton>

          <AppButton type="submit" variant="primary" :loading="saving">
            {{ selectedProduct ? "Update Product" : "Create Product" }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <ConfirmDialog
      :open="confirmOpen"
      title="Delete Product"
      :message="`Are you sure you want to delete ${
        confirmProduct?.name || 'this product'
      }? This action cannot be undone.`"
      confirm-label="Delete Product"
      variant="danger"
      :loading="confirmLoading"
      @close="closeDeleteConfirm"
      @confirm="handleDelete"
    />

    <AppRefreshingIndicator :show="refreshing" />
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, ImagePlus, Package, RefreshCw, Save, Star, Trash2 } from "lucide-vue-next";
import type {
  Product,
  ProductCategory,
  ProductImage,
  ProductInventory,
  ProductInventoryMovement,
  ProductPayload,
} from "~/composables/useProduct";
import type { Store } from "~/composables/useVendor";

definePageMeta({
  layout: "vendor",
  middleware: ["auth", "permission"],
  permission: "vendor.view",
  title: "Product Details",
});

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { getStores } = useVendor();
const {
  getStoreProduct,
  getProductInventory,
  createProductInventory,
  updateProductInventory,
  addProductStock,
  removeProductStock,
  adjustProductStock,
  getProductInventoryMovements,
  getVendorCategoryTree,
  syncStoreProductCategories,
  updateStoreProduct,
  setStoreProductActive,
  getStoreProductImages,
  uploadStoreProductImage,
  setStoreProductPrimaryImage,
  deleteStoreProductImage,
} = useProduct();

const productId = computed(() => String(route.params.id || ""));
const stores = ref<Store[]>([]);
const storeId = ref(typeof route.query.store_id === "string" ? route.query.store_id : "");
const product = ref<Product | null>(null);
const images = ref<ProductImage[]>([]);
const inventory = ref<ProductInventory | null>(null);
const loadingInventory = ref(false);
const inventoryError = ref("");
const inventoryNotFound = ref(false);
const inventorySaving = ref(false);
const stockActionAttempted = ref(false);
const inventoryMovements = ref<ProductInventoryMovement[]>([]);
const loadingInventoryMovements = ref(false);
const inventoryMovementsError = ref("");
const inventoryCreateForm = reactive({ quantity: "", low_stock_threshold: "" });
const stockAction = ref<"add" | "remove" | "adjust" | "change">("add");
const stockActionForm = reactive({ quantity: "", reason: "" });
const categoryTree = ref<ProductCategory[]>([]);
const selectedCategoryIds = ref<string[]>([]);
const categoryLoading = ref(false);
const categorySaving = ref(false);
const categoryError = ref("");
const categoryTreeLoaded = ref(false);
const categoryAssignmentsKnown = ref(false);
const confirmReplaceUnknownCategories = ref(false);
const loading = ref(true);
const saving = ref(false);
const loadingImages = ref(false);
const uploading = ref(false);
const imageActionId = ref("");
const imageToDelete = ref<ProductImage | null>(null);
const deleteImageDialogOpen = ref(false);
const deletingImage = ref(false);
const pageError = ref("");
const formError = ref("");
const imageError = ref("");
const editing = ref(route.query.mode === "edit");
const productFieldErrors = reactive<Partial<Record<keyof ProductPayload, string>>>({});
const form = reactive({
  name: "",
  sku: "",
  short_description: "",
  description: "",
  price: "",
  compare_at_price: "",
});
const savedCategoryIds = ref<string[]>([]);

const applyProduct = (value: Product) => {
  product.value = {
    ...value,
    ...(!value.categories && product.value?.categories
      ? { categories: product.value.categories }
      : {}),
  };
  fillProductForm(value);
};

const fillProductForm = (value: Product) => {
  Object.assign(form, {
    name: value.name || "",
    sku: value.sku || "",
    short_description: value.short_description || "",
    description: value.description || "",
    price: value.price || "",
    compare_at_price: value.compare_at_price || "",
  });
};

const flattenCategories = (
  categories: ProductCategory[],
  depth = 0,
): Array<{ category: ProductCategory; depth: number }> =>
  categories.flatMap((category) => [
    { category, depth },
    ...flattenCategories(category.children || [], depth + 1),
  ]);

const categoryRows = computed(() => flattenCategories(categoryTree.value));
const normalizeCategoryId = (id: string | number) => String(id);
const unavailableSelectedCategories = computed(() => {
  const treeIds = new Set(
    categoryRows.value.map(({ category }) => normalizeCategoryId(category.id)),
  );
  return (product.value?.categories || []).filter(
    (category) =>
      selectedCategoryIds.value.includes(normalizeCategoryId(category.id)) &&
      !treeIds.has(normalizeCategoryId(category.id)),
  );
});
const categoriesDirty = computed(() => {
  if (!categoryAssignmentsKnown.value) return confirmReplaceUnknownCategories.value;
  const selected = [...selectedCategoryIds.value].sort();
  const saved = [...savedCategoryIds.value].sort();
  return selected.length !== saved.length || selected.some((id, index) => id !== saved[index]);
});

const loadCategories = async (
  productCategories?: ProductCategory[],
  preserveSelection = false,
) => {
  categoryLoading.value = true;
  categoryError.value = "";
  categoryTreeLoaded.value = false;
  if (!preserveSelection) {
    categoryAssignmentsKnown.value = Array.isArray(productCategories);
    confirmReplaceUnknownCategories.value = false;
    selectedCategoryIds.value = Array.isArray(productCategories)
      ? productCategories.map((category) => normalizeCategoryId(category.id))
      : [];
    savedCategoryIds.value = [...selectedCategoryIds.value];
  }
  try {
    const response = await getVendorCategoryTree();
    categoryTree.value = response.data.categories || [];
    categoryTreeLoaded.value = true;
  } catch (error: any) {
    categoryError.value = error.message || "Could not load available categories.";
    toast.error("Categories failed", categoryError.value);
  } finally {
    categoryLoading.value = false;
  }
};

const toggleCategory = (category: ProductCategory, checked: boolean) => {
  const selected = new Set(selectedCategoryIds.value);
  const id = normalizeCategoryId(category.id);
  if (checked) selected.add(id);
  else selected.delete(id);
  selectedCategoryIds.value = [...selected];
};

const saveCategories = async () => {
  if (
    !product.value ||
    !storeId.value ||
    !categoryTreeLoaded.value ||
    (!categoryAssignmentsKnown.value && !confirmReplaceUnknownCategories.value)
  ) {
    return;
  }
  categorySaving.value = true;
  categoryError.value = "";
  try {
    const response = await syncStoreProductCategories(
      storeId.value,
      product.value.id,
      selectedCategoryIds.value,
    );
    product.value = { ...product.value, categories: response.data.categories };
    selectedCategoryIds.value = response.data.categories.map((category) =>
      normalizeCategoryId(category.id),
    );
    savedCategoryIds.value = [...selectedCategoryIds.value];
    categoryAssignmentsKnown.value = true;
    confirmReplaceUnknownCategories.value = false;
    toast.success(
      "Categories updated",
      response.message || "Product categories updated successfully.",
    );
  } catch (error: any) {
    categoryError.value = error.message || "Could not update product categories.";
    toast.error("Category update failed", categoryError.value);
  } finally {
    categorySaving.value = false;
  }
};

const loadImages = async () => {
  if (!storeId.value || !productId.value) return;
  loadingImages.value = true;
  imageError.value = "";
  try {
    const response = await getStoreProductImages(storeId.value, productId.value);
    images.value = Array.isArray(response.data?.images)
      ? [...response.data.images].sort((first, second) => first.sort_order - second.sort_order)
      : [];
  } catch (error: any) {
    imageError.value = error.message || "Could not load product images.";
    toast.error("Images failed", imageError.value);
  } finally {
    loadingImages.value = false;
  }
};

const loadInventory = async () => {
  if (!productId.value) return;
  loadingInventory.value = true;
  inventoryError.value = "";
  inventoryNotFound.value = false;
  try {
    const response = await getProductInventory(productId.value);
    inventory.value = response.data.inventory;
    void loadInventoryMovements();
  } catch (error: any) {
    inventory.value = null;
    inventoryNotFound.value = error.status === 404;
    inventoryError.value = inventoryNotFound.value
      ? ""
      : error.message || "Could not load product inventory.";
  } finally {
    loadingInventory.value = false;
  }
};

const loadInventoryMovements = async () => {
  if (!productId.value || !inventory.value) return;
  loadingInventoryMovements.value = true;
  inventoryMovementsError.value = "";
  try {
    const response = await getProductInventoryMovements(productId.value);
    inventoryMovements.value = response.data.movements || [];
  } catch (error: any) {
    inventoryMovementsError.value = error.message || "Could not load inventory movements.";
  } finally {
    loadingInventoryMovements.value = false;
  }
};

const saveNewInventory = async () => {
  const quantity = Number(inventoryCreateForm.quantity);
  const threshold = Number(inventoryCreateForm.low_stock_threshold);
  if (
    !inventoryCreateForm.quantity.trim() ||
    !inventoryCreateForm.low_stock_threshold.trim() ||
    !Number.isInteger(quantity) ||
    quantity < 0 ||
    !Number.isInteger(threshold) ||
    threshold < 0
  ) {
    toast.error("Check inventory values", "Enter non-negative whole numbers for stock and threshold.");
    return;
  }
  inventorySaving.value = true;
  inventoryError.value = "";
  try {
    const response = await createProductInventory(productId.value, {
      quantity,
      low_stock_threshold: threshold,
    });
    inventory.value = response.data.inventory;
    inventoryNotFound.value = false;
    inventoryCreateForm.quantity = "";
    inventoryCreateForm.low_stock_threshold = "";
    toast.success("Inventory created", response.message || "Inventory created successfully.");
    void loadInventoryMovements();
  } catch (error: any) {
    inventoryError.value = error.message || "Could not create product inventory.";
    toast.error("Inventory creation failed", inventoryError.value);
  } finally {
    inventorySaving.value = false;
  }
};

const saveStockAction = async () => {
  stockActionAttempted.value = true;
  const quantity = Number(stockActionForm.quantity);
  const reasonRequired = stockAction.value === "remove" || stockAction.value === "adjust";
  const invalidQuantity =
    !stockActionForm.quantity.trim() ||
    !Number.isInteger(quantity) ||
    (stockAction.value === "adjust" && quantity < 0) ||
    (stockAction.value === "change" && quantity === 0) ||
    (["add", "remove"].includes(stockAction.value) && quantity <= 0);
  if (
    invalidQuantity ||
    (reasonRequired && !stockActionForm.reason.trim())
  ) {
    toast.error(
      "Check stock change",
      reasonRequired
        ? "Enter a valid whole-number quantity and a reason."
        : "Enter a valid non-zero whole-number quantity.",
    );
    return;
  }

  inventorySaving.value = true;
  inventoryError.value = "";
  try {
    const payload = {
      quantity,
      ...(stockActionForm.reason.trim() ? { reason: stockActionForm.reason.trim() } : {}),
    };
    const response =
      stockAction.value === "add"
        ? await addProductStock(productId.value, payload)
        : stockAction.value === "remove"
          ? await removeProductStock(productId.value, payload)
          : stockAction.value === "adjust"
            ? await adjustProductStock(productId.value, payload)
            : await updateProductInventory(productId.value, payload);
    inventory.value = response.data.inventory;
    stockActionForm.quantity = "";
    stockActionForm.reason = "";
    stockActionAttempted.value = false;
    toast.success("Inventory updated", response.message || "Inventory updated successfully.");
    void loadInventoryMovements();
  } catch (error: any) {
    inventoryError.value = error.message || "Could not update product inventory.";
    toast.error("Inventory update failed", inventoryError.value);
  } finally {
    inventorySaving.value = false;
  }
};

const loadProduct = async () => {
  loading.value = true;
  pageError.value = "";
  try {
    const storeResponse = await getStores();
    stores.value = storeResponse.data.stores || [];

    const candidateStores = storeId.value
      ? stores.value.filter((store) => store.id === storeId.value)
      : stores.value;
    if (!candidateStores.length) {
      throw new Error("No accessible vendor store was found for this product.");
    }

    let lastError: unknown;
    for (const store of candidateStores) {
      try {
        const response = await getStoreProduct(store.id, productId.value);
        storeId.value = store.id;
        applyProduct(response.data.product);
        await loadCategories(response.data.product.categories);
        await Promise.all([loadImages(), loadInventory()]);
        return;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("The product could not be found in your vendor stores.");
  } catch (error: any) {
    pageError.value = error.message || "Could not load this product.";
    toast.error("Product failed", pageError.value);
  } finally {
    loading.value = false;
  }
};

const saveProduct = async () => {
  if (!product.value || !storeId.value) return;
  formError.value = "";
  Object.keys(productFieldErrors).forEach((key) => {
    delete productFieldErrors[key as keyof ProductPayload];
  });
  const requiredFields = ["name", "sku", "short_description", "description"] as const;
  const missing = requiredFields.find((key) => !form[key].trim());
  const price = Number(form.price);
  const compareAt = Number(form.compare_at_price);
  if (missing || !form.price.trim() || !Number.isFinite(price) || price < 0) {
    formError.value = missing
      ? "Product name, SKU, short description, and description are required."
      : "Enter a valid non-negative price.";
    if (missing) productFieldErrors[missing] = "This field is required.";
    else productFieldErrors.price = "Enter a valid non-negative price.";
    return;
  }
  if (form.compare_at_price.trim() && (!Number.isFinite(compareAt) || compareAt < 0)) {
    formError.value = "Enter a valid non-negative compare-at price.";
    productFieldErrors.compare_at_price = "Enter a valid non-negative price.";
    return;
  }

  saving.value = true;
  try {
    const payload: ProductPayload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      short_description: form.short_description.trim(),
      description: form.description.trim(),
      price,
    };
    if (form.compare_at_price.trim()) payload.compare_at_price = compareAt;
    const response = await updateStoreProduct(storeId.value, product.value.id, payload);
    applyProduct(response.data.product);
    editing.value = false;
    await router.replace({
      path: route.path,
      query: { store_id: storeId.value },
    });
    toast.success("Product updated", response.message || "Product updated successfully.");
  } catch (error: any) {
    formError.value = error.message || "The product could not be updated.";
    Object.entries(error.errors || {}).forEach(([key, message]) => {
      if (key in form) {
        productFieldErrors[key as keyof ProductPayload] = Array.isArray(message)
          ? String(message[0] || "")
          : String(message || "");
      }
    });
    toast.error("Product update failed", formError.value);
  } finally {
    saving.value = false;
  }
};

const cancelProductEdit = () => {
  if (product.value) fillProductForm(product.value);
  Object.keys(productFieldErrors).forEach((key) => {
    delete productFieldErrors[key as keyof ProductPayload];
  });
  formError.value = "";
  editing.value = false;
  if (route.query.mode === "edit") {
    void router.replace({
      path: route.path,
      query: { store_id: storeId.value },
    });
  }
};

const toggleStatus = async () => {
  if (!product.value || !storeId.value) return;
  const active = !["active", "published", "live"].includes(product.value.status.toLowerCase());
  saving.value = true;
  try {
    const response = await setStoreProductActive(storeId.value, product.value.id, active);
    applyProduct(response.data.product);
    toast.success(
      active ? "Product activated" : "Product deactivated",
      response.message || `Product ${active ? "activated" : "deactivated"} successfully.`,
    );
  } catch (error: any) {
    toast.error("Product status failed", error.message || "Could not update product status.");
  } finally {
    saving.value = false;
  }
};

const handleImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !product.value || !storeId.value) return;
  if (!file.type.startsWith("image/")) {
    imageError.value = "Choose an image file.";
    input.value = "";
    return;
  }
  uploading.value = true;
  imageError.value = "";
  try {
    const response = await uploadStoreProductImage(storeId.value, product.value.id, file);
    const uploaded = response.data.image;
    images.value = [
      ...images.value.filter((image) => image.id !== uploaded.id),
      uploaded,
    ].map((image) => ({
      ...image,
      is_primary: uploaded.is_primary ? image.id === uploaded.id : image.is_primary,
    }));
    toast.success("Image uploaded", response.message || "Product image uploaded.");
  } catch (error: any) {
    imageError.value = error.message || "Could not upload the image.";
    toast.error("Image upload failed", imageError.value);
  } finally {
    uploading.value = false;
    input.value = "";
  }
};

const makePrimary = async (image: ProductImage) => {
  if (!product.value || !storeId.value || image.is_primary) return;
  imageActionId.value = image.id;
  try {
    const response = await setStoreProductPrimaryImage(storeId.value, product.value.id, image.id);
    images.value = images.value.map((item) => ({
      ...item,
      is_primary: item.id === response.data.image.id,
    }));
    toast.success("Primary image updated", response.message || "Primary image updated.");
  } catch (error: any) {
    imageError.value = error.message || "Could not update the primary image.";
    toast.error("Image update failed", imageError.value);
  } finally {
    imageActionId.value = "";
  }
};

const confirmRemoveImage = (image: ProductImage) => {
  imageToDelete.value = image;
  deleteImageDialogOpen.value = true;
};

const removeImage = async () => {
  if (!product.value || !storeId.value || !imageToDelete.value) return;
  const imageId = imageToDelete.value.id;
  deletingImage.value = true;
  imageActionId.value = imageId;
  try {
    const response = await deleteStoreProductImage(storeId.value, product.value.id, imageId);
    images.value = images.value.filter((item) => item.id !== imageId);
    deleteImageDialogOpen.value = false;
    imageToDelete.value = null;
    toast.success("Image deleted", response.message || "Product image deleted.");
  } catch (error: any) {
    imageError.value = error.message || "Could not delete the image.";
    toast.error("Image deletion failed", imageError.value);
  } finally {
    imageActionId.value = "";
    deletingImage.value = false;
  }
};

const productIsActive = computed(
  () => !!product.value && ["active", "published", "live"].includes(product.value.status.toLowerCase()),
);

const formatPrice = (value: string) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : value || "—";
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

onMounted(loadProduct);
</script>

<template>
  <main class="mx-auto max-w-6xl space-y-6 pb-8">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <NuxtLink
          to="/vendor/products"
          class="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-card-foreground"
        >
          <ArrowLeft class="h-4 w-4" />
          Products
        </NuxtLink>
        <h1 class="mt-3 text-3xl font-bold tracking-tight text-card-foreground">
          {{ product?.name || "Product details" }}
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          <span v-if="product" class="font-mono">{{ product.sku }}</span>
          <span v-if="product" class="mx-2">·</span>
          {{ editing ? "Update product information." : "Review and manage this product." }}
        </p>
      </div>
      <div v-if="product" class="flex gap-2">
        <AppButton
          variant="secondary"
          :disabled="saving || editing"
          @click="navigateTo({
            path: `/vendor/products/${encodeURIComponent(product.id)}/variants`,
            query: { store_id: storeId },
          })"
        >
          Manage variants
        </AppButton>
        <AppButton
          variant="secondary"
          :disabled="saving"
          @click="editing ? cancelProductEdit() : (editing = true)"
        >
          {{ editing ? "Discard changes" : "Edit product" }}
        </AppButton>
        <AppButton
          :variant="productIsActive ? 'secondary' : 'primary'"
          :loading="saving"
          :disabled="editing"
          @click="toggleStatus"
        >
          {{ productIsActive ? "Deactivate" : "Activate" }}
        </AppButton>
      </div>
    </div>

    <div v-if="loading" class="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
      Loading product…
    </div>
    <AlertMessage v-else-if="pageError" type="error" title="Unable to load product" :message="pageError" />

    <template v-else-if="product">
      <AlertMessage v-if="formError" type="error" title="Unable to save product" :message="formError" />
      <section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article class="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <template v-if="editing">
            <h2 class="font-semibold text-card-foreground">Edit product information</h2>
            <div class="mt-5 grid gap-5 sm:grid-cols-2">
              <AppInput
                v-model="form.name"
                label="Product name"
                :error="productFieldErrors.name"
                required
              />
              <AppInput
                v-model="form.sku"
                label="SKU"
                :error="productFieldErrors.sku"
                required
              />
              <AppInput
                v-model="form.short_description"
                label="Short description"
                :error="productFieldErrors.short_description"
                required
              />
              <AppInput
                v-model="form.price"
                label="Price"
                type="number"
                :error="productFieldErrors.price"
                required
              />
              <AppInput
                v-model="form.compare_at_price"
                label="Compare-at price"
                type="number"
                :error="productFieldErrors.compare_at_price"
              />
              <div class="sm:col-span-2">
                <AppTextarea
                  v-model="form.description"
                  label="Description"
                  :error="productFieldErrors.description"
                  :rows="6"
                  required
                />
              </div>
            </div>
            <div class="mt-5 flex justify-end gap-2">
              <AppButton variant="secondary" :disabled="saving" @click="cancelProductEdit">
                Discard
              </AppButton>
              <AppButton :loading="saving" @click="saveProduct">
                <Save class="h-4 w-4" />
                Save changes
              </AppButton>
            </div>
          </template>
          <template v-else>
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 class="font-semibold text-card-foreground">Product information</h2>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{ product.short_description || "No short description provided." }}
                </p>
              </div>
              <p class="text-2xl font-bold text-card-foreground">
                {{ formatPrice(product.price) }}
                <span
                  v-if="product.compare_at_price"
                  class="ml-2 text-sm font-normal text-muted-foreground line-through"
                >
                  {{ formatPrice(product.compare_at_price) }}
                </span>
              </p>
            </div>
            <dl class="mt-6 grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SKU</dt>
                <dd class="mt-1 font-mono text-sm text-card-foreground">{{ product.sku || "—" }}</dd>
              </div>
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Slug</dt>
                <dd class="mt-1 text-sm text-card-foreground">{{ product.slug || "—" }}</dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</dt>
                <dd class="mt-2 whitespace-pre-wrap text-sm leading-6 text-card-foreground">
                  {{ product.description || "No description provided." }}
                </dd>
              </div>
            </dl>
          </template>
        </article>

        <aside class="space-y-4">
          <article class="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 class="font-semibold text-card-foreground">Status</h2>
            <div class="mt-3">
              <ProductStatusBadge :status="product.status" />
            </div>
            <dl class="mt-5 space-y-3 text-sm">
              <div>
                <dt class="text-xs text-muted-foreground">Created</dt>
                <dd class="mt-1 text-card-foreground">{{ formatDate(product.created_at) }}</dd>
              </div>
              <div>
                <dt class="text-xs text-muted-foreground">Updated</dt>
                <dd class="mt-1 text-card-foreground">{{ formatDate(product.updated_at) }}</dd>
              </div>
            </dl>
          </article>
        </aside>
      </section>

      <section class="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex items-start gap-3">
            <span class="rounded-xl bg-sky-50 p-2.5 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
              <Package class="h-5 w-5" />
            </span>
            <div>
              <h2 class="font-semibold text-card-foreground">Inventory</h2>
              <p class="mt-1 text-sm text-muted-foreground">
                Stock levels and reserved units reported by the inventory service.
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <NuxtLink
              to="/vendor/inventories"
              class="inline-flex h-9 items-center rounded-xl border border-border bg-card px-3 text-xs font-semibold text-card-foreground hover:bg-muted"
            >
              Inventory overview
            </NuxtLink>
            <AppButton
              size="sm"
              variant="secondary"
              :loading="loadingInventory"
              :disabled="loadingInventory"
              @click="loadInventory"
            >
              <RefreshCw class="h-4 w-4" />
              Refresh
            </AppButton>
          </div>
        </div>

        <div
          v-if="loadingInventory && !inventory"
          class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Loading inventory"
        >
          <div v-for="item in 4" :key="item" class="h-24 animate-pulse rounded-xl bg-muted" />
        </div>
        <AlertMessage
          v-else-if="inventoryError && !inventoryNotFound && !inventory"
          class="mt-5"
          type="error"
          title="Inventory unavailable"
          :message="inventoryError"
        />
        <div v-else-if="inventoryNotFound" class="mt-5 rounded-2xl border border-dashed border-border p-5">
          <h3 class="font-semibold text-card-foreground">Inventory is not set up</h3>
          <p class="mt-1 text-sm text-muted-foreground">
            Create the initial inventory record for this product.
          </p>
          <form class="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" @submit.prevent="saveNewInventory">
            <AppInput
              v-model="inventoryCreateForm.quantity"
              label="Initial quantity"
              type="number"
              placeholder="e.g. 100"
              required
            />
            <AppInput
              v-model="inventoryCreateForm.low_stock_threshold"
              label="Low-stock threshold"
              type="number"
              placeholder="e.g. 10"
              required
            />
            <AppButton type="submit" :loading="inventorySaving">Create inventory</AppButton>
          </form>
          <p v-if="inventoryError" class="mt-3 text-sm text-rose-600 dark:text-rose-400">
            {{ inventoryError }}
          </p>
        </div>
        <div v-else-if="inventory" class="mt-5">
          <div class="flex flex-wrap items-center gap-2">
            <AppBadge v-if="inventory.is_out_of_stock" variant="danger">Out of stock</AppBadge>
            <AppBadge v-else-if="inventory.is_low_stock" variant="warning">Low stock</AppBadge>
            <AppBadge v-else variant="success">In stock</AppBadge>
            <span class="text-sm text-muted-foreground">
              {{ inventory.variant_id ? "Variant inventory" : "Base product inventory" }}
            </span>
          </div>

          <dl class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-xl border border-border p-4">
              <dt class="text-sm text-muted-foreground">Total quantity</dt>
              <dd class="mt-2 text-2xl font-semibold tabular-nums text-card-foreground">
                {{ inventory.quantity }}
              </dd>
            </div>
            <div class="rounded-xl border border-border p-4">
              <dt class="text-sm text-muted-foreground">Reserved</dt>
              <dd class="mt-2 text-2xl font-semibold tabular-nums text-card-foreground">
                {{ inventory.reserved_quantity ?? 0 }}
              </dd>
            </div>
            <div class="rounded-xl border border-border p-4">
              <dt class="text-sm text-muted-foreground">Available to sell</dt>
              <dd class="mt-2 text-2xl font-semibold tabular-nums text-card-foreground">
                {{ inventory.available_quantity }}
              </dd>
            </div>
            <div class="rounded-xl border border-border p-4">
              <dt class="text-sm text-muted-foreground">Low-stock threshold</dt>
              <dd class="mt-2 text-2xl font-semibold tabular-nums text-card-foreground">
                {{ inventory.low_stock_threshold }}
              </dd>
            </div>
          </dl>

          <div class="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
            <span>Inventory SKU: <span class="font-mono text-card-foreground">{{ inventory.sku || "—" }}</span></span>
            <span v-if="inventory.variant_id">
              Variant ID: <span class="font-mono text-card-foreground">{{ inventory.variant_id }}</span>
            </span>
            <span>Updated {{ formatDate(inventory.updated_at) }}</span>
          </div>

          <form
            class="mt-5 grid gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-2"
            @submit.prevent="saveStockAction"
          >
            <div>
              <label for="stock-action" class="mb-2 block text-sm font-medium text-card-foreground">
                Stock operation
              </label>
              <select
                id="stock-action"
                v-model="stockAction"
                class="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-card-foreground outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-950"
              >
                <option value="add">Add stock</option>
                <option value="remove">Remove stock</option>
                <option value="adjust">Set stock level</option>
                <option value="change">Apply quantity adjustment</option>
              </select>
              <p class="mt-1.5 text-xs text-muted-foreground">
                <template v-if="stockAction === 'adjust'">Sets the new total quantity.</template>
                <template v-else-if="stockAction === 'change'">Applies a signed quantity change; use a negative number to reduce stock.</template>
                <template v-else-if="stockAction === 'remove'">Removes units from stock and requires a reason.</template>
                <template v-else>Adds units to the current stock.</template>
              </p>
            </div>
            <AppInput
              v-model="stockActionForm.quantity"
              :label="stockAction === 'adjust' ? 'New total quantity' : stockAction === 'change' ? 'Quantity adjustment' : 'Quantity'"
              type="number"
              :placeholder="stockAction === 'change' ? 'e.g. 5 or -2' : 'Enter quantity'"
              required
            />
            <div class="sm:col-span-2">
              <AppInput
                v-model="stockActionForm.reason"
                label="Reason"
                :placeholder="stockAction === 'remove' ? 'e.g. Customer order' : 'e.g. New stock received'"
                :required="stockAction === 'remove' || stockAction === 'adjust'"
                :error="stockActionAttempted && (stockAction === 'remove' || stockAction === 'adjust') && !stockActionForm.reason.trim() ? 'A reason is required for this operation.' : ''"
              />
            </div>
            <div class="sm:col-span-2 flex justify-end">
              <AppButton type="submit" :loading="inventorySaving">
                Save stock change
              </AppButton>
            </div>
            <AlertMessage
              v-if="inventoryError"
              class="sm:col-span-2"
              type="error"
              title="Stock update failed"
              :message="inventoryError"
            />
          </form>

          <div class="mt-6 border-t border-border pt-5">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 class="font-semibold text-card-foreground">Stock movement history</h3>
                <p class="mt-1 text-sm text-muted-foreground">A record of stock additions, removals, and adjustments.</p>
              </div>
              <AppButton
                size="sm"
                variant="secondary"
                :loading="loadingInventoryMovements"
                :disabled="loadingInventoryMovements"
                @click="loadInventoryMovements"
              >
                <RefreshCw class="h-4 w-4" />
                Refresh history
              </AppButton>
            </div>
            <AlertMessage
              v-if="inventoryMovementsError"
              class="mt-4"
              type="error"
              title="Movement history unavailable"
              :message="inventoryMovementsError"
            />
            <p v-else-if="loadingInventoryMovements" class="py-6 text-center text-sm text-muted-foreground">
              Loading stock movements…
            </p>
            <p
              v-else-if="!inventoryMovements.length"
              class="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground"
            >
              No stock movements have been recorded.
            </p>
            <ol v-else class="mt-4 divide-y divide-border">
              <li
                v-for="movement in inventoryMovements"
                :key="movement.id"
                class="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0"
              >
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <AppBadge
                      :variant="movement.type === 'stock_in' ? 'success' : movement.type === 'stock_out' ? 'warning' : 'info'"
                    >
                      {{ movement.type.replace(/_/g, " ") }}
                    </AppBadge>
                    <span class="text-sm font-medium text-card-foreground">{{ movement.reason || "No reason provided" }}</span>
                  </div>
                  <p class="mt-1 text-xs text-muted-foreground">
                    {{ movement.creator?.name ? `By ${movement.creator.name} · ` : "" }}{{ formatDateTime(movement.created_at) }}
                  </p>
                </div>
                <p class="shrink-0 text-right text-sm tabular-nums text-card-foreground">
                  {{ movement.before_quantity }} <span aria-hidden="true">→</span> {{ movement.after_quantity }}
                  <span class="block text-xs text-muted-foreground">change {{ movement.quantity }}</span>
                </p>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="font-semibold text-card-foreground">Categories</h2>
            <p class="mt-1 max-w-2xl text-sm text-muted-foreground">
              Select all categories this product belongs to. Saving replaces the product’s current category associations.
            </p>
          </div>
          <AppButton
            :loading="categorySaving"
            :disabled="
              categoryLoading ||
              !!categoryError ||
              !categoryTreeLoaded ||
              !categoriesDirty ||
              (!categoryAssignmentsKnown && !confirmReplaceUnknownCategories)
            "
            @click="saveCategories"
          >
            Save categories
          </AppButton>
        </div>
        <AlertMessage
          v-if="categoryError"
          class="mt-4"
          type="error"
          title="Category action failed"
          :message="categoryError"
        />
        <div v-if="categoryError" class="mt-3">
          <AppButton
            size="sm"
            variant="secondary"
            :disabled="categoryLoading"
            @click="loadCategories(product.categories, true)"
          >
            Retry category loading
          </AppButton>
        </div>
        <div v-if="categoryLoading" class="py-8 text-center text-sm text-muted-foreground">
          Loading category tree…
        </div>
        <div
          v-if="!categoryLoading && !categoryAssignmentsKnown"
          class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
        >
          <p>
            The product details response did not include its current categories. Saving the selection will replace all existing category associations.
          </p>
          <label class="mt-3 flex cursor-pointer items-start gap-2 font-medium">
            <input
              v-model="confirmReplaceUnknownCategories"
              type="checkbox"
              class="mt-1 h-4 w-4 shrink-0 accent-amber-700 focus-visible:ring-2 focus-visible:ring-amber-600"
            />
            <span>I understand and want to replace the product’s current categories.</span>
          </label>
        </div>
        <div v-if="!categoryLoading && unavailableSelectedCategories.length" class="mt-4 space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Existing categories outside the current tree
          </p>
          <label
            v-for="category in unavailableSelectedCategories"
            :key="category.id"
            class="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm dark:border-amber-900 dark:bg-amber-950/30"
          >
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-border accent-slate-900 focus-visible:ring-2 focus-visible:ring-sky-500"
              :checked="selectedCategoryIds.includes(normalizeCategoryId(category.id))"
              :disabled="categorySaving"
              @change="toggleCategory(category, ($event.target as HTMLInputElement).checked)"
            />
            <span class="flex-1 text-card-foreground">{{ category.name }}</span>
            <span class="text-xs text-muted-foreground">Not in current tree</span>
          </label>
        </div>
        <div
          v-if="!categoryLoading && categoryRows.length"
          class="mt-5 max-h-[28rem] space-y-1 overflow-y-auto rounded-xl border border-border p-3"
        >
          <label
            v-for="{ category, depth } in categoryRows"
            :key="category.id"
            class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-muted/60"
            :class="category.is_active === false ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'"
            :style="{ paddingInlineStart: `${12 + depth * 22}px` }"
          >
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-border accent-slate-900 focus-visible:ring-2 focus-visible:ring-sky-500"
              :checked="selectedCategoryIds.includes(normalizeCategoryId(category.id))"
              :disabled="(category.is_active === false && !selectedCategoryIds.includes(normalizeCategoryId(category.id))) || categorySaving"
              @change="toggleCategory(category, ($event.target as HTMLInputElement).checked)"
            />
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-medium text-card-foreground">{{ category.name }}</span>
              <span v-if="category.description" class="mt-0.5 block truncate text-xs text-muted-foreground">
                {{ category.description }}
              </span>
            </span>
            <AppBadge v-if="category.is_active === false" variant="warning">Inactive</AppBadge>
            <span
              v-if="selectedCategoryIds.includes(normalizeCategoryId(category.id))"
              class="text-xs text-muted-foreground"
            >
              Selected
            </span>
          </label>
        </div>
        <div
          v-else-if="!categoryLoading"
          class="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground"
        >
          No categories are available in the vendor category tree.
        </div>
        <p v-if="!categoryLoading && categoryTree.length" class="mt-3 text-xs text-muted-foreground">
          {{ selectedCategoryIds.length }} selected · Inactive categories cannot be newly assigned.
          <span v-if="!categoriesDirty && categoryAssignmentsKnown"> · No changes to save</span>
        </p>
      </section>

      <section class="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="font-semibold text-card-foreground">Product images</h2>
            <p class="mt-1 text-sm text-muted-foreground">
              {{ images.length }} {{ images.length === 1 ? "image" : "images" }} · Choose a primary image or remove images from the gallery.
            </p>
          </div>
          <label class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900">
            <ImagePlus class="h-4 w-4" />
            {{ uploading ? "Uploading…" : "Upload image" }}
            <input class="sr-only" type="file" accept="image/*" :disabled="uploading" @change="handleImageUpload" />
          </label>
        </div>
        <AlertMessage v-if="imageError" class="mt-4" type="error" title="Image action failed" :message="imageError" />
        <AppButton
          v-if="imageError && !loadingImages"
          class="mt-3"
          size="sm"
          variant="secondary"
          @click="loadImages"
        >
          Retry image loading
        </AppButton>
        <p v-if="loadingImages" class="py-8 text-center text-sm text-muted-foreground">Loading images…</p>
        <div v-else-if="images.length" class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article v-for="image in images" :key="image.id" class="overflow-hidden rounded-xl border border-border">
            <img :src="image.url || image.image" :alt="product.name" class="aspect-square w-full object-cover" />
            <div class="flex items-center justify-between gap-2 p-3">
              <AppBadge v-if="image.is_primary" variant="success">Primary</AppBadge>
              <span v-else class="text-xs text-muted-foreground">Product image</span>
              <div class="flex gap-1">
                <button
                  type="button"
                  class="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-card-foreground disabled:opacity-50"
                  title="Set as primary"
                  aria-label="Set as primary image"
                  :disabled="image.is_primary || imageActionId === image.id"
                  @click="makePrimary(image)"
                >
                  <Star class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-950/30"
                  title="Delete image"
                  aria-label="Delete image"
                  :disabled="imageActionId === image.id"
                  @click="confirmRemoveImage(image)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        </div>
        <p v-else class="mt-5 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No images have been added to this product.
        </p>
      </section>
    </template>

    <ConfirmDialog
      :open="deleteImageDialogOpen"
      title="Delete product image"
      :message="`Delete this image from ${product?.name || 'this product'}? This cannot be undone.`"
      confirm-label="Delete image"
      variant="danger"
      :loading="deletingImage"
      @close="deleteImageDialogOpen = false"
      @confirm="removeImage"
    />
  </main>
</template>

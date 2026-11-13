<script setup lang="ts">
import {
  Boxes,
  ChevronRight,
  Eye,
  EyeOff,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  X,
} from "lucide-vue-next";
import type {
  Product,
  ProductOption,
  ProductOptionPayload,
  ProductOptionValuePayload,
  ProductVariant,
  ProductVariantPayload,
} from "~/composables/useProduct";

definePageMeta({
  layout: "vendor",
  middleware: ["auth", "permission"],
  permission: "vendor.view",
  title: "Product Variants",
});

const route = useRoute();
const toast = useToast();
const { getStores } = useVendor();
const productId = computed(() => String(route.params.id || ""));
const {
  getStoreProduct,
  getStoreProductVariants,
  getStoreProductOptions,
  createStoreProductOption,
  updateStoreProductOption,
  deleteStoreProductOption,
  createStoreProductOptionValue,
  updateStoreProductOptionValue,
  deleteStoreProductOptionValue,
  createStoreProductVariant,
  updateStoreProductVariant,
  deleteStoreProductVariant,
} = useProduct();

const storeId = ref(typeof route.query.store_id === "string" ? route.query.store_id : "");
const product = ref<Product | null>(null);
const variants = ref<ProductVariant[]>([]);
const options = ref<ProductOption[]>([]);
const loading = ref(true);
const saving = ref(false);
const errorMessage = ref("");
const variantSearch = ref("");
const variantStatusFilter = ref<"all" | "active" | "inactive">("all");
const variantModalOpen = ref(false);
const editingVariant = ref<ProductVariant | null>(null);
const variantToDelete = ref<ProductVariant | null>(null);
const combinationPreviewOpen = ref(false);
const generationProgress = ref(0);
const generationTotal = ref(0);
const generationError = ref("");
const optionModalOpen = ref(false);
const editingOption = ref<ProductOption | null>(null);
const optionFormError = ref("");
const optionForm = reactive({ name: "", display_type: "text", sort_order: "0" });
const valueModalOpen = ref(false);
const valueOption = ref<ProductOption | null>(null);
const editingValue = ref<ProductOption["values"][number] | null>(null);
const valueFormError = ref("");
const valueForm = reactive({ value: "", color_code: "", sort_order: "0" });
const variantForm = reactive({
  sku: "",
  price: "",
  compare_at_price: "",
  is_active: true,
  sort_order: "0",
});
const selectedValues = reactive<Record<string, string>>({});
const variantFormError = ref("");

const createVariantPayload = (
  payload: Omit<ProductVariantPayload, "inventory">,
): ProductVariantPayload => ({
  ...payload,
  inventory: {
    quantity: 0,
    low_stock_threshold: 5,
  },
});

const canConfigureVariants = computed(
  () => options.value.length > 0 && options.value.every((option) => option.values?.length),
);
const filteredVariants = computed(() => {
  const query = variantSearch.value.trim().toLocaleLowerCase();
  return variants.value.filter((variant) => {
    const matchesSearch =
      !query ||
      variant.sku.toLocaleLowerCase().includes(query) ||
      variant.option_values.some((value) =>
        value.value.toLocaleLowerCase().includes(query),
      );
    const matchesStatus =
      variantStatusFilter.value === "all" ||
      (variantStatusFilter.value === "active" && variant.is_active) ||
      (variantStatusFilter.value === "inactive" && !variant.is_active);
    return matchesSearch && matchesStatus;
  });
});
const activeVariantCount = computed(
  () => variants.value.filter((variant) => variant.is_active).length,
);
const inactiveVariantCount = computed(
  () => variants.value.filter((variant) => !variant.is_active).length,
);
const inventoryManagedCount = computed(
  () => variants.value.filter((variant) => variant.inventory !== null).length,
);
const hasVariantFilters = computed(
  () => Boolean(variantSearch.value.trim()) || variantStatusFilter.value !== "all",
);
const clearVariantFilters = () => {
  variantSearch.value = "";
  variantStatusFilter.value = "all";
};
const combinationLimit = 200;
const combinationCount = computed(() => {
  if (!canConfigureVariants.value) return 0;
  return options.value.reduce(
    (count, option) => count * (option.values?.length || 0),
    1,
  );
});
const optionCombinations = computed(() => {
  if (!canConfigureVariants.value || combinationCount.value > combinationLimit) return [];
  return options.value.reduce<ProductOption["values"][]>((combinations, option) => {
    const values = option.values || [];
    return combinations.flatMap((combination) =>
      values.map((value) => [...combination, value]),
    );
  }, [[]]);
});
const existingVariantsByCombination = computed(
  () =>
    new Map<string, ProductVariant>(
      variants.value.map((variant): [string, ProductVariant] => [
        variant.option_values.map((value) => value.id).sort().join("|"),
        variant,
      ]),
    ),
);
const combinationPreview = computed(() => {
  const usedSkus = new Set(variants.value.map((variant) => variant.sku.toLowerCase()));
  return optionCombinations.value.map((values, index) => {
    const key = values.map((value) => value.id).sort().join("|");
    const existingVariant = existingVariantsByCombination.value.get(key);
    const skuBase = [
      product.value?.sku,
      ...values.map((value) => value.value),
    ]
      .filter(Boolean)
      .join("-");
    const normalizedSku = skuBase
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toUpperCase();
    const baseSku = normalizedSku || `VARIANT-${index + 1}`;
    let sku = existingVariant?.sku || baseSku;
    if (!existingVariant) {
      let suffix = 2;
      while (usedSkus.has(sku.toLowerCase())) {
        sku = `${baseSku}-${suffix++}`;
      }
      usedSkus.add(sku.toLowerCase());
    }
    return {
      key,
      values,
      sku,
      exists: Boolean(existingVariant),
    };
  });
});
const combinationsToCreate = computed(() =>
  combinationPreview.value.filter((combination) => !combination.exists),
);
const generationPlan = ref<
  Array<{
    key: string;
    values: ProductOption["values"];
    sku: string;
    exists: boolean;
  }>
>([]);

const sortData = () => {
  variants.value.sort((first, second) => first.sort_order - second.sort_order);
  options.value.sort((first, second) => first.sort_order - second.sort_order);
};

const load = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const storeResponse = await getStores();
    const stores = storeResponse.data.stores || [];
    const storeIds = storeId.value
      ? stores.filter((store) => store.id === storeId.value).map((store) => store.id)
      : stores.map((store) => store.id);
    if (!storeIds.length) {
      throw new Error("No accessible vendor store was found for this product.");
    }
    let productLoaded = false;
    let lastError: unknown;
    for (const id of storeIds) {
      try {
        const result = await getStoreProduct(id, productId.value);
        storeId.value = id;
        product.value = result.data.product;
        productLoaded = true;
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (!productLoaded) {
      throw lastError instanceof Error
        ? lastError
        : new Error("The product could not be found in your vendor stores.");
    }

    const [variantResult, optionResult] = await Promise.all([
      getStoreProductVariants(productId.value),
      getStoreProductOptions(productId.value),
    ]);
    variants.value = variantResult.data.variants || [];
    options.value = optionResult.data.options || [];
    sortData();
  } catch (error: any) {
    errorMessage.value = error.message || "Could not load this product’s variants.";
    toast.error("Variants failed", errorMessage.value);
  } finally {
    loading.value = false;
  }
};

const resetVariantForm = () => {
  variantForm.sku = "";
  variantForm.price = "";
  variantForm.compare_at_price = "";
  variantForm.is_active = true;
  variantForm.sort_order = String(variants.value.length + 1);
  Object.keys(selectedValues).forEach((key) => delete selectedValues[key]);
  options.value.forEach((option) => (selectedValues[option.id] = ""));
  editingVariant.value = null;
  variantFormError.value = "";
};

const openCreateVariant = () => {
  resetVariantForm();
  variantModalOpen.value = true;
};

const openEditVariant = (variant: ProductVariant) => {
  resetVariantForm();
  editingVariant.value = variant;
  Object.assign(variantForm, {
    sku: variant.sku,
    price: variant.price,
    compare_at_price: variant.compare_at_price || "",
    is_active: variant.is_active,
    sort_order: String(variant.sort_order),
  });
  for (const option of options.value) {
    const current = variant.option_values.find((value) => value.option_id === option.id);
    selectedValues[option.id] = current?.id || "";
  }
  variantModalOpen.value = true;
};

const saveVariant = async () => {
  variantFormError.value = "";
  const price = Number(variantForm.price);
  const compareAt = Number(variantForm.compare_at_price);
  const sortOrder = Number(variantForm.sort_order);
  if (!variantForm.sku.trim() || !variantForm.price.trim() || !Number.isFinite(price) || price < 0) {
    variantFormError.value = "Enter a SKU and valid non-negative price.";
    return;
  }
  if (variantForm.compare_at_price.trim() && (!Number.isFinite(compareAt) || compareAt < 0)) {
    variantFormError.value = "Enter a valid non-negative compare-at price.";
    return;
  }
  if (
    !Number.isInteger(sortOrder) ||
    sortOrder < 0 ||
    !canConfigureVariants.value ||
    options.value.some((option) => !selectedValues[option.id])
  ) {
    variantFormError.value = "Choose a value for every option and enter a non-negative whole-number sort order.";
    return;
  }
  saving.value = true;
  try {
    const payload: Omit<ProductVariantPayload, "inventory"> = {
      sku: variantForm.sku.trim(),
      price,
      is_active: variantForm.is_active,
      sort_order: sortOrder,
      option_value_ids: [...new Set(Object.values(selectedValues).filter(Boolean))],
    };
    if (variantForm.compare_at_price.trim()) payload.compare_at_price = compareAt;
    const response = editingVariant.value
      ? await updateStoreProductVariant(productId.value, editingVariant.value.id, payload)
      : await createStoreProductVariant(productId.value, createVariantPayload(payload));
    if (editingVariant.value) {
      variants.value = variants.value.map((item) =>
        item.id === response.data.variant.id ? response.data.variant : item,
      );
    } else {
      variants.value.push(response.data.variant);
    }
    sortData();
    variantModalOpen.value = false;
    toast.success(
      editingVariant.value ? "Variant updated" : "Variant created",
      response.message || "Variant saved successfully.",
    );
  } catch (error: any) {
    variantFormError.value = error.message || "The variant could not be saved.";
    toast.error("Variant save failed", variantFormError.value);
  } finally {
    saving.value = false;
  }
};

const openCombinationPreview = () => {
  if (!canConfigureVariants.value || combinationCount.value > combinationLimit) return;
  generationProgress.value = 0;
  generationPlan.value = [...combinationsToCreate.value];
  generationTotal.value = generationPlan.value.length;
  generationError.value = "";
  combinationPreviewOpen.value = true;
};

const closeCombinationPreview = () => {
  if (!saving.value) combinationPreviewOpen.value = false;
};

const getValidationDetails = (error: unknown) => {
  if (typeof error !== "object" || error === null || !("errors" in error)) return "";
  const errors = error.errors;
  if (typeof errors !== "object" || errors === null) return "";

  return Object.entries(errors)
    .flatMap(([field, messages]) => {
      const values = Array.isArray(messages) ? messages : [messages];
      return values
        .filter((message): message is string => typeof message === "string" && message.length > 0)
        .map((message) => `${field}: ${message}`);
    })
    .slice(0, 5)
    .join(" ");
};

const generateVariants = async () => {
  const pending = [...generationPlan.value];
  const currentProduct = product.value;
  if (!currentProduct || !pending.length) return;

  const price = Number(currentProduct.price);
  const compareAt = Number(currentProduct.compare_at_price);
  if (!Number.isFinite(price) || price < 0) {
    toast.error("Variants could not be generated", "The product has an invalid base price.");
    return;
  }
  if (
    currentProduct.compare_at_price &&
    (!Number.isFinite(compareAt) || compareAt < 0)
  ) {
    toast.error("Variants could not be generated", "The product has an invalid compare-at price.");
    return;
  }

  saving.value = true;
  generationError.value = "";
  let created = 0;
  generationProgress.value = 0;
  generationTotal.value = pending.length;
  try {
    for (const combination of pending) {
      const payload: Omit<ProductVariantPayload, "inventory"> = {
        sku: combination.sku,
        price,
        is_active: true,
        sort_order: variants.value.length + 1,
        option_value_ids: combination.values.map((value) => value.id),
      };
      if (currentProduct.compare_at_price) payload.compare_at_price = compareAt;
      try {
        const response = await createStoreProductVariant(
          productId.value,
          createVariantPayload(payload),
        );
        variants.value.push(response.data.variant);
        created += 1;
        generationProgress.value = created;
        generationPlan.value = generationPlan.value.filter(
          (item) => item.key !== combination.key,
        );
      } catch (error: any) {
        const combinationLabel = combination.values.map((value) => value.value).join(" / ");
        const validationDetails = getValidationDetails(error);
        generationError.value = [
          `Could not create "${combinationLabel}" (SKU ${combination.sku}).`,
          error.message || "Variant validation failed.",
          validationDetails,
        ]
          .filter(Boolean)
          .join(" ");
        throw error;
      }
    }
    sortData();
    combinationPreviewOpen.value = false;
    toast.success(
      "Variants generated",
      `${created} variant${created === 1 ? "" : "s"} created successfully.`,
    );
  } catch (error: any) {
    sortData();
    toast.error(
      "Variant generation stopped",
      `${created} variant${created === 1 ? "" : "s"} created. See the generation preview for the failed combination and validation details.`,
    );
  } finally {
    saving.value = false;
  }
};

const removeVariant = async () => {
  if (!variantToDelete.value) return;
  saving.value = true;
  try {
    const response = await deleteStoreProductVariant(productId.value, variantToDelete.value.id);
    variants.value = variants.value.filter((variant) => variant.id !== variantToDelete.value?.id);
    toast.success("Variant deleted", response.message || "Variant deleted successfully.");
    variantToDelete.value = null;
  } catch (error: any) {
    toast.error("Variant deletion failed", error.message || "The variant could not be deleted.");
  } finally {
    saving.value = false;
  }
};

const openCreateOption = () => {
  editingOption.value = null;
  optionFormError.value = "";
  Object.assign(optionForm, { name: "", display_type: "text", sort_order: String(options.value.length + 1) });
  optionModalOpen.value = true;
};

const openEditOption = (option: ProductOption) => {
  editingOption.value = option;
  optionFormError.value = "";
  Object.assign(optionForm, {
    name: option.name,
    display_type: option.display_type,
    sort_order: String(option.sort_order),
  });
  optionModalOpen.value = true;
};

const saveOption = async () => {
  if (!optionForm.name.trim() || !Number.isInteger(Number(optionForm.sort_order))) {
    optionFormError.value = "Enter an option name and valid sort order.";
    return;
  }
  saving.value = true;
  try {
    const payload: ProductOptionPayload = {
      name: optionForm.name.trim(),
      display_type: optionForm.display_type,
      sort_order: Number(optionForm.sort_order),
    };
    const response = editingOption.value
      ? await updateStoreProductOption(productId.value, editingOption.value.id, payload)
      : await createStoreProductOption(productId.value, payload);
    options.value = editingOption.value
      ? options.value.map((option) => option.id === response.data.option.id ? response.data.option : option)
      : [...options.value, response.data.option];
    sortData();
    optionModalOpen.value = false;
    toast.success("Option saved", response.message || "Product option saved.");
  } catch (error: any) {
    optionFormError.value = error.message || "The option could not be saved.";
    toast.error("Option save failed", optionFormError.value);
  } finally {
    saving.value = false;
  }
};

const removeOption = async (option: ProductOption) => {
  if (!window.confirm(`Delete the ${option.name} option and its values?`)) return;
  saving.value = true;
  try {
    const response = await deleteStoreProductOption(productId.value, option.id);
    options.value = options.value.filter((item) => item.id !== option.id);
    toast.success("Option deleted", response.message || "Product option deleted.");
  } catch (error: any) {
    toast.error("Option deletion failed", error.message || "The option could not be deleted.");
  } finally {
    saving.value = false;
  }
};

const openValueForm = (option: ProductOption, value?: ProductOption["values"][number]) => {
  valueOption.value = option;
  editingValue.value = value || null;
  valueFormError.value = "";
  Object.assign(valueForm, value
    ? { value: value.value, color_code: value.color_code || "", sort_order: String(value.sort_order) }
    : { value: "", color_code: "", sort_order: String((option.values || []).length + 1) });
  valueModalOpen.value = true;
};

const saveValue = async () => {
  if (!valueOption.value || !valueForm.value.trim() || !Number.isInteger(Number(valueForm.sort_order))) {
    valueFormError.value = "Enter a value label and valid sort order.";
    return;
  }
  saving.value = true;
  try {
    const payload: ProductOptionValuePayload = {
      value: valueForm.value.trim(),
      sort_order: Number(valueForm.sort_order),
    };
    if (valueForm.color_code.trim()) payload.color_code = valueForm.color_code.trim();
    const response = editingValue.value
      ? await updateStoreProductOptionValue(
          productId.value,
          valueOption.value.id,
          editingValue.value.id,
          payload,
        )
      : await createStoreProductOptionValue(productId.value, valueOption.value.id, payload);
    options.value = options.value.map((option) => {
      if (option.id !== valueOption.value?.id) return option;
      const nextValues = editingValue.value
        ? option.values.map((value) => value.id === response.data.value.id ? response.data.value : value)
        : [...(option.values || []), response.data.value];
      return { ...option, values: nextValues.sort((first, second) => first.sort_order - second.sort_order) };
    });
    valueModalOpen.value = false;
    toast.success("Option value saved", response.message || "Option value saved.");
  } catch (error: any) {
    valueFormError.value = error.message || "The option value could not be saved.";
    toast.error("Value save failed", valueFormError.value);
  } finally {
    saving.value = false;
  }
};

const removeValue = async (option: ProductOption, value: ProductOption["values"][number]) => {
  if (!window.confirm(`Delete option value “${value.value}”?`)) return;
  saving.value = true;
  try {
    const response = await deleteStoreProductOptionValue(productId.value, option.id, value.id);
    options.value = options.value.map((item) => item.id === option.id
      ? { ...item, values: item.values.filter((current) => current.id !== value.id) }
      : item);
    toast.success("Option value deleted", response.message || "Option value deleted.");
  } catch (error: any) {
    toast.error("Value deletion failed", error.message || "The option value could not be deleted.");
  } finally {
    saving.value = false;
  }
};

onMounted(load);
</script>

<template>
  <main class="mx-auto max-w-6xl space-y-6 pb-8">
    <nav class="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
      <NuxtLink
        to="/vendor/products"
        class="hover:text-card-foreground"
      >
        Products
      </NuxtLink>
      <ChevronRight class="h-4 w-4 shrink-0" />
      <NuxtLink
        :to="`/vendor/products/${encodeURIComponent(productId)}?store_id=${encodeURIComponent(storeId)}`"
        class="max-w-56 truncate hover:text-card-foreground"
      >
        {{ product?.name || "Product details" }}
      </NuxtLink>
      <ChevronRight class="h-4 w-4 shrink-0" />
      <span class="font-semibold text-card-foreground">Variants</span>
    </nav>

    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0">
        <p class="text-sm font-medium text-muted-foreground">Product variants</p>
        <h1 class="mt-1 truncate text-3xl font-bold tracking-tight text-card-foreground">
          {{ product?.name || "Manage variants" }}
        </h1>
        <div class="mt-2 flex flex-wrap items-center gap-2">
          <AppBadge v-if="product?.sku" variant="default" class="font-mono">
            {{ product.sku }}
          </AppBadge>
          <span class="text-sm text-muted-foreground">
            Manage product options, variant pricing, and availability.
          </span>
        </div>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row">
        <AppButton variant="secondary" :disabled="loading || saving" @click="load">
          <RefreshCw class="h-4 w-4" />
          Refresh
        </AppButton>
        <AppButton
          :disabled="loading || saving || !product || !canConfigureVariants"
          :title="canConfigureVariants ? undefined : 'Add options and values before creating variants.'"
          @click="openCreateVariant"
        >
          <Plus class="h-4 w-4" />
          Add variant
        </AppButton>
      </div>
    </div>

    <div v-if="loading" class="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
      Loading product variants…
    </div>
    <AlertMessage v-else-if="errorMessage" type="error" title="Unable to load variants" :message="errorMessage" />
    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total variants"
          :value="variants.length"
          subtitle="For this product"
          tone="info"
        >
          <template #badge>
            <AppBadge variant="info" shape="square" size="md"><Boxes class="h-5 w-5" /></AppBadge>
          </template>
        </StatsCard>
        <StatsCard
          title="Active"
          :value="activeVariantCount"
          subtitle="Available variants"
          tone="success"
        >
          <template #badge>
            <AppBadge variant="success" shape="square" size="md"><Eye class="h-5 w-5" /></AppBadge>
          </template>
        </StatsCard>
        <StatsCard
          title="Inactive"
          :value="inactiveVariantCount"
          subtitle="Hidden variants"
          tone="default"
        >
          <template #badge>
            <AppBadge variant="default" shape="square" size="md"><EyeOff class="h-5 w-5" /></AppBadge>
          </template>
        </StatsCard>
        <StatsCard
          title="Inventory records"
          :value="inventoryManagedCount"
          subtitle="Stock is managed separately"
          tone="warning"
        >
          <template #badge>
            <AppBadge variant="warning" shape="square" size="md"><PackageCheck class="h-5 w-5" /></AppBadge>
          </template>
        </StatsCard>
      </div>

      <FilterBar
        title="Find variants"
        subtitle="Search is local to the variants loaded for this product."
        columns="2"
      >
        <AppInput
          v-model="variantSearch"
          label="Search variants"
          placeholder="Search SKU or option value"
        >
          <template #icon><Search class="h-4 w-4" /></template>
        </AppInput>
        <AppSelect
          v-model="variantStatusFilter"
          label="Status"
          :options="[
            { label: 'All statuses', value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ]"
        />
        <template #actions>
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-sm text-muted-foreground" aria-live="polite">
              Showing {{ filteredVariants.length }} of {{ variants.length }}
            </span>
            <AppButton
              v-if="hasVariantFilters"
              size="sm"
              variant="secondary"
              @click="clearVariantFilters"
            >
              <X class="h-4 w-4" />
              Clear
            </AppButton>
          </div>
        </template>
      </FilterBar>

      <section class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <div>
            <h2 class="font-semibold text-card-foreground">Variant list</h2>
            <p class="mt-1 text-xs text-muted-foreground">
              Variant combinations and their current prices
            </p>
          </div>
          <span class="text-xs text-muted-foreground">
            Manage stock from the Inventory section.
          </span>
        </div>
        <div v-if="filteredVariants.length" class="overflow-x-auto">
          <table class="w-full min-w-[720px] text-left text-sm">
            <thead class="bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th class="px-5 py-3.5">Variant</th>
                <th class="px-5 py-3.5">SKU</th>
                <th class="px-5 py-3.5">Price</th>
                <th class="px-5 py-3.5">Inventory</th>
                <th class="px-5 py-3.5">Status</th>
                <th class="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr
                v-for="variant in filteredVariants"
                :key="variant.id"
                class="transition-colors hover:bg-muted/30"
              >
                <td class="px-5 py-4">
                  <div class="flex flex-wrap gap-1.5">
                    <AppBadge
                      v-for="value in variant.option_values"
                      :key="value.id"
                      variant="default"
                    >
                      <span
                        v-if="value.color_code"
                        class="mr-1.5 inline-block h-3 w-3 rounded-full border border-border"
                        :style="{ backgroundColor: value.color_code }"
                        aria-hidden="true"
                      />
                      {{ value.value }}
                    </AppBadge>
                    <span v-if="!variant.option_values.length" class="text-muted-foreground">
                      No option values
                    </span>
                  </div>
                </td>
                <td class="px-5 py-4 font-mono text-xs text-card-foreground">{{ variant.sku }}</td>
                <td class="px-5 py-4 font-medium">
                  {{ variant.price }}
                  <span
                    v-if="variant.compare_at_price && variant.compare_at_price !== variant.price"
                    class="mt-1 block text-xs font-normal text-muted-foreground line-through"
                  >
                    {{ variant.compare_at_price }}
                  </span>
                </td>
                <td class="px-5 py-4">
                  <AppBadge :variant="variant.inventory ? 'info' : 'default'">
                    {{ variant.inventory ? "Tracked" : "Not configured" }}
                  </AppBadge>
                </td>
                <td class="px-5 py-4">
                  <AppBadge :variant="variant.is_active ? 'success' : 'default'">
                    {{ variant.is_active ? "Active" : "Inactive" }}
                  </AppBadge>
                </td>
                <td class="px-5 py-4">
                  <div class="flex justify-end gap-2">
                    <AppButton size="sm" variant="secondary" :disabled="saving" @click="openEditVariant(variant)">
                      Edit
                    </AppButton>
                    <AppButton size="sm" variant="danger" :disabled="saving" @click="variantToDelete = variant">
                      <Trash2 class="h-4 w-4" />
                    </AppButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else-if="hasVariantFilters" class="space-y-2 p-8 text-center">
          <p class="font-medium text-card-foreground">No variants match these filters</p>
          <p class="text-sm text-muted-foreground">Clear the filters or try a different SKU or option value.</p>
          <AppButton size="sm" variant="secondary" @click="clearVariantFilters">
            <X class="h-4 w-4" />
            Clear filters
          </AppButton>
        </div>
        <div v-else class="space-y-3 p-8 text-center">
          <AppBadge variant="info" shape="square" size="lg" class="mx-auto">
            <Boxes class="h-6 w-6" />
          </AppBadge>
          <h3 class="font-semibold text-card-foreground">No variants yet</h3>
          <p class="text-sm text-muted-foreground">
            Add product options and values, then create variants or generate their combinations.
          </p>
          <AppButton size="sm" variant="secondary" @click="openCreateOption">
            <Plus class="h-4 w-4" />
            Add option
          </AppButton>
        </div>
      </section>

      <section class="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <Settings2 class="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 class="font-semibold text-card-foreground">Product options</h2>
              <p class="text-xs text-muted-foreground">Define attributes and values for variant combinations.</p>
            </div>
          </div>
          <AppButton size="sm" variant="secondary" @click="openCreateOption">
            <Plus class="h-4 w-4" />
            Add option
          </AppButton>
        </div>
        <article
          v-for="option in options"
          :key="option.id"
          class="rounded-xl border border-border bg-background/50 p-4"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="font-semibold text-card-foreground">{{ option.name }}</h3>
              <p class="mt-1 text-xs capitalize text-muted-foreground">
                {{ option.display_type }} · {{ option.values?.length || 0 }} values · order {{ option.sort_order }}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <AppButton size="sm" variant="secondary" :disabled="saving" @click="openEditOption(option)">Edit</AppButton>
              <AppButton size="sm" variant="secondary" :disabled="saving" @click="openValueForm(option)">
                <Plus class="h-4 w-4" />
                Add value
              </AppButton>
              <AppButton
                size="sm"
                variant="danger"
                :disabled="saving"
                :aria-label="`Delete ${option.name} option`"
                @click="removeOption(option)"
              >
                <Trash2 class="h-4 w-4" />
              </AppButton>
            </div>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <span
              v-for="value in option.values || []"
              :key="value.id"
              class="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm"
            >
              <span
                v-if="option.display_type === 'color' && value.color_code"
                class="h-4 w-4 rounded-full border border-border shadow-sm"
                :style="{ backgroundColor: value.color_code }"
                :aria-label="value.color_code"
              />
              {{ value.value }}
              <button
                type="button"
                class="ml-1 text-xs text-muted-foreground hover:text-card-foreground"
                :disabled="saving"
                :aria-label="`Edit ${value.value}`"
                @click="openValueForm(option, value)"
              >
                Edit
              </button>
              <button
                type="button"
                class="text-xs text-rose-600 hover:text-rose-700"
                :disabled="saving"
                :aria-label="`Delete ${value.value}`"
                @click="removeValue(option, value)"
              >
                Delete
              </button>
            </span>
            <span v-if="!option.values?.length" class="text-sm text-muted-foreground">No values yet.</span>
          </div>
        </article>
        <p v-if="!options.length" class="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Add an option such as Color or Size to define product variants.
        </p>
        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p class="text-sm text-muted-foreground">
            <template v-if="combinationCount > combinationLimit">
              {{ combinationCount }} combinations · Reduce the option values to 200 or fewer before generating.
            </template>
            <template v-else-if="canConfigureVariants">
              {{ combinationCount }} possible combinations · {{ combinationsToCreate.length }} new
            </template>
            <template v-else>
              Add at least one value to every option to generate variants.
            </template>
          </p>
          <AppButton
            variant="secondary"
            :disabled="!canConfigureVariants || combinationCount > combinationLimit || !combinationsToCreate.length || saving"
            @click="openCombinationPreview"
          >
            <Sparkles class="h-4 w-4" />
            Generate variants
          </AppButton>
        </div>
      </section>
    </template>

    <AppModal
      :open="variantModalOpen"
      :title="editingVariant ? 'Edit variant' : 'Create variant'"
      subtitle="Set the variant SKU, price, options, and availability."
      size="lg"
      @close="variantModalOpen = false"
    >
      <AlertMessage v-if="variantFormError" type="error" title="Variant could not be saved" :message="variantFormError" />
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <AppInput v-model="variantForm.sku" label="SKU" required />
        <AppInput v-model="variantForm.price" label="Price" type="number" required />
        <AppInput v-model="variantForm.compare_at_price" label="Compare-at price" type="number" />
        <AppInput v-model="variantForm.sort_order" label="Sort order" type="number" />
      </div>
      <p v-if="!editingVariant" class="mt-4 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
        New variants start with zero stock. You can update inventory separately in
        <NuxtLink to="/vendor/inventories" class="font-medium text-sky-700 hover:underline dark:text-sky-300">
          Inventory
        </NuxtLink>.
      </p>
      <div v-if="options.length" class="mt-5 space-y-4">
        <AppSelect
          v-for="option in options"
          :key="option.id"
          v-model="selectedValues[option.id]"
          :label="option.name"
          :options="(option.values || []).map((value) => ({ label: value.value, value: value.id }))"
          :placeholder="`Select ${option.name.toLowerCase()}`"
          :disabled="saving || !option.values?.length"
        />
      </div>
      <p v-if="!canConfigureVariants" class="mt-4 text-sm text-muted-foreground">
        Add an option and at least one value to create a variant.
      </p>
      <label class="mt-4 flex items-center gap-2 text-sm text-card-foreground">
        <input v-model="variantForm.is_active" type="checkbox" class="h-4 w-4 accent-slate-900" />
        Variant is active
      </label>
      <template #footer>
        <div class="flex justify-end gap-2">
          <AppButton variant="secondary" :disabled="saving" @click="variantModalOpen = false">Cancel</AppButton>
          <AppButton :loading="saving" @click="saveVariant">{{ editingVariant ? "Save changes" : "Create variant" }}</AppButton>
        </div>
      </template>
    </AppModal>

    <AppModal
      :open="optionModalOpen"
      :title="editingOption ? 'Edit product option' : 'Add product option'"
      @close="optionModalOpen = false"
    >
      <AlertMessage v-if="optionFormError" type="error" title="Option could not be saved" :message="optionFormError" />
      <div class="mt-4 space-y-4">
        <AppInput v-model="optionForm.name" label="Option name" placeholder="Color" />
        <AppSelect
          v-model="optionForm.display_type"
          label="Display type"
          :options="[{ label: 'Text', value: 'text' }, { label: 'Color', value: 'color' }, { label: 'Image', value: 'image' }]"
        />
        <AppInput v-model="optionForm.sort_order" label="Sort order" type="number" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <AppButton variant="secondary" :disabled="saving" @click="optionModalOpen = false">Cancel</AppButton>
          <AppButton :loading="saving" @click="saveOption">Save option</AppButton>
        </div>
      </template>
    </AppModal>

    <AppModal
      :open="valueModalOpen"
      :title="editingValue ? 'Edit option value' : `Add value${valueOption ? ` · ${valueOption.name}` : ''}`"
      @close="valueModalOpen = false"
    >
      <AlertMessage v-if="valueFormError" type="error" title="Value could not be saved" :message="valueFormError" />
      <div class="mt-4 space-y-4">
        <AppInput v-model="valueForm.value" label="Value" placeholder="Blue or Small" />
        <div v-if="valueOption?.display_type === 'color'" class="space-y-3">
          <label class="block text-sm font-medium text-card-foreground">Color (optional)</label>
          <div class="flex items-center gap-3">
            <input
              :value="valueForm.color_code || '#000000'"
              type="color"
              class="h-11 w-14 cursor-pointer rounded-lg border border-border bg-card p-1"
              aria-label="Choose option value color"
              @input="valueForm.color_code = ($event.target as HTMLInputElement).value"
            />
            <AppInput
              v-model="valueForm.color_code"
              label="Color code"
              placeholder="#000000"
            />
          </div>
        </div>
        <AppInput v-model="valueForm.sort_order" label="Sort order" type="number" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <AppButton variant="secondary" :disabled="saving" @click="valueModalOpen = false">Cancel</AppButton>
          <AppButton :loading="saving" @click="saveValue">Save value</AppButton>
        </div>
      </template>
    </AppModal>

    <AppModal
      :open="combinationPreviewOpen"
      title="Generate variants"
      subtitle="Review the option combinations and generated SKUs before creating them."
      size="lg"
      @close="closeCombinationPreview"
    >
      <AlertMessage
        v-if="generationError"
        class="mb-4"
        type="error"
        title="Variant generation stopped"
        :message="generationError"
      />
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm text-muted-foreground">
          {{ generationPlan.length }} new variants · Base price
          {{ product?.price || "—" }}
        </p>
        <p class="text-xs text-muted-foreground">
          {{ saving ? `Creating ${generationProgress} of ${generationTotal}…` : "Existing combinations will be skipped." }}
        </p>
      </div>
      <p class="mb-4 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
        Generated variants start with zero stock. Update quantities separately on the
        <NuxtLink to="/vendor/inventories" class="font-medium text-sky-700 hover:underline dark:text-sky-300">
          Inventory page
        </NuxtLink>.
      </p>
      <div class="max-h-[50vh] overflow-auto rounded-xl border border-border">
        <table class="w-full min-w-[540px] text-left text-sm">
          <thead class="sticky top-0 bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th class="px-4 py-3">Option values</th>
              <th class="px-4 py-3">Generated SKU</th>
              <th class="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="combination in combinationPreview" :key="combination.key">
              <td class="px-4 py-3">
                {{ combination.values.map((value) => value.value).join(" / ") }}
              </td>
              <td class="px-4 py-3 font-mono text-xs">{{ combination.sku }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="combination.exists ? 'default' : 'success'">
                  {{ combination.exists ? "Already exists" : "New" }}
                </AppBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <template #footer>
        <div class="flex flex-wrap justify-end gap-2">
          <AppButton
            variant="secondary"
            :disabled="saving"
            @click="closeCombinationPreview"
          >
            Cancel
          </AppButton>
          <AppButton
            :loading="saving"
            :disabled="!generationPlan.length"
            @click="generateVariants"
          >
            Create {{ generationPlan.length }} variants
          </AppButton>
        </div>
      </template>
    </AppModal>

    <ConfirmDialog
      :open="!!variantToDelete"
      title="Delete variant"
      :message="`Delete ${variantToDelete?.sku || 'this variant'}? This cannot be undone.`"
      confirm-label="Delete variant"
      variant="danger"
      :loading="saving"
      @close="variantToDelete = null"
      @confirm="removeVariant"
    />
  </main>
</template>

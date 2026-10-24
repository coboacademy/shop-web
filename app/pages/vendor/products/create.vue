<script setup lang="ts">
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers3,
  Package,
  Sparkles,
  Store as StoreIcon,
} from "lucide-vue-next";
import type { ProductCategory, ProductPayload } from "~/composables/useProduct";
import type { Store } from "~/composables/useVendor";

definePageMeta({
  layout: "vendor",
  middleware: ["auth", "permission"],
  permission: "vendor.view",
  title: "Create Product",
});

type ProductType = "simple" | "variants";

const route = useRoute();
const toast = useToast();
const { getStores } = useVendor();
const { getVendorCategoryTree, createStoreProduct, syncStoreProductCategories } = useProduct();

const currentStep = ref(0);
const productType = ref<ProductType>("simple");
const stores = ref<Store[]>([]);
const storeId = ref(typeof route.query.store_id === "string" ? route.query.store_id : "");
const categories = ref<ProductCategory[]>([]);
const selectedCategoryIds = ref<string[]>([]);
const loading = ref(true);
const saving = ref(false);
const pageError = ref("");
const categoryError = ref("");
const formError = ref("");
const fieldErrors = reactive<Record<string, string>>({});
const form = reactive({
  name: "",
  description: "",
  sku: "",
  short_description: "",
  price: "",
  compare_at_price: "",
});

const steps = [
  { label: "Basic information", icon: Package },
  { label: "Product details", icon: Layers3 },
  { label: "Review", icon: Check },
];

const categoryRows = computed(() => {
  const flatten = (
    nodes: ProductCategory[],
    depth = 0,
  ): Array<{ category: ProductCategory; depth: number }> =>
    nodes.flatMap((category) => [
      { category, depth },
      ...flatten(category.children || [], depth + 1),
    ]);
  return flatten(categories.value);
});

const selectedCategories = computed(() => {
  const selected = new Set(selectedCategoryIds.value);
  return categoryRows.value
    .filter(({ category }) => selected.has(category.id))
    .map(({ category }) => category);
});

const loadFormOptions = async () => {
  loading.value = true;
  pageError.value = "";
  categoryError.value = "";
  const results = await Promise.allSettled([getStores(), getVendorCategoryTree()]);
  const [storesResult, categoryResult] = results;

  if (storesResult.status === "fulfilled") {
    stores.value = storesResult.value.data.stores || [];
    if (!stores.value.some((store) => store.id === storeId.value)) {
      storeId.value = stores.value[0]?.id || "";
    }
  } else {
    pageError.value = storesResult.reason?.message || "Could not load vendor stores.";
    toast.error("Stores failed", pageError.value);
  }

  if (categoryResult.status === "fulfilled") {
    categories.value = categoryResult.value.data.categories || [];
  } else {
    categoryError.value = categoryResult.reason?.message || "Could not load categories.";
    toast.error("Categories failed", categoryError.value);
  }
  loading.value = false;
};

const retryCategories = async () => {
  categoryError.value = "";
  try {
    const response = await getVendorCategoryTree();
    categories.value = response.data.categories || [];
  } catch (error: any) {
    categoryError.value = error.message || "Could not load categories.";
    toast.error("Categories failed", categoryError.value);
  }
};

const toggleCategory = (categoryId: string, checked: boolean) => {
  const selected = new Set(selectedCategoryIds.value);
  if (checked) selected.add(categoryId);
  else selected.delete(categoryId);
  selectedCategoryIds.value = [...selected];
};

const validateBasicInformation = () => {
  delete fieldErrors.name;
  delete fieldErrors.description;
  if (!form.name.trim()) fieldErrors.name = "Product name is required.";
  if (!form.description.trim()) fieldErrors.description = "Description is required.";
  return !fieldErrors.name && !fieldErrors.description;
};

const validateProductDetails = () => {
  delete fieldErrors.sku;
  delete fieldErrors.short_description;
  delete fieldErrors.price;
  delete fieldErrors.compare_at_price;

  if (!form.sku.trim()) fieldErrors.sku = "SKU is required.";
  if (!form.short_description.trim()) {
    fieldErrors.short_description = "Short description is required.";
  }

  const price = Number(form.price);
  if (!form.price.trim() || !Number.isFinite(price) || price < 0) {
    fieldErrors.price = "Enter a valid non-negative price.";
  }
  if (form.compare_at_price.trim()) {
    const compareAtPrice = Number(form.compare_at_price);
    if (!Number.isFinite(compareAtPrice) || compareAtPrice < 0) {
      fieldErrors.compare_at_price = "Enter a valid non-negative price.";
    }
  }
  return !fieldErrors.sku &&
    !fieldErrors.short_description &&
    !fieldErrors.price &&
    !fieldErrors.compare_at_price;
};

const goToNextStep = () => {
  formError.value = "";
  if (currentStep.value === 0 && !validateBasicInformation()) return;
  if (currentStep.value === 1 && !validateProductDetails()) return;
  currentStep.value = Math.min(currentStep.value + 1, steps.length - 1);
};

const createProduct = async () => {
  formError.value = "";
  if (!validateBasicInformation() || !validateProductDetails()) {
    currentStep.value = fieldErrors.name || fieldErrors.description ? 0 : 1;
    formError.value = "Please review the highlighted required fields.";
    return;
  }
  if (!storeId.value) {
    formError.value = "Create or select a vendor store before creating a product.";
    currentStep.value = 0;
    return;
  }

  saving.value = true;
  try {
    const payload: ProductPayload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      short_description: form.short_description.trim(),
      description: form.description.trim(),
      price: Number(form.price),
    };
    if (form.compare_at_price.trim()) {
      payload.compare_at_price = Number(form.compare_at_price);
    }

    const response = await createStoreProduct(storeId.value, payload);
    const createdProduct = response.data.product;
    const destination = productType.value === "variants" ? "variants" : "details";
    const productPath = `/vendor/products/${encodeURIComponent(createdProduct.id)}`;

    if (selectedCategoryIds.value.length) {
      try {
        await syncStoreProductCategories(
          storeId.value,
          createdProduct.id,
          selectedCategoryIds.value,
        );
      } catch (error: any) {
        toast.error(
          "Product created, categories not saved",
          error.message || "Open product details to assign categories.",
        );
        await navigateTo({
          path: productPath,
          query: { store_id: storeId.value, mode: "edit" },
        });
        return;
      }
    }

    toast.success("Product created", response.message || "Product created successfully.");
    await navigateTo({
      path: destination === "variants" ? `${productPath}/variants` : productPath,
      query: { store_id: storeId.value },
    });
  } catch (error: any) {
    formError.value = error.message || "The product could not be created.";
    Object.entries(error.errors || {}).forEach(([key, message]) => {
      fieldErrors[key] = Array.isArray(message) ? String(message[0] || "") : String(message || "");
    });
    if (
      fieldErrors.name ||
      fieldErrors.description ||
      fieldErrors.category_ids
    ) {
      currentStep.value = 0;
    } else if (
      fieldErrors.sku ||
      fieldErrors.short_description ||
      fieldErrors.price ||
      fieldErrors.compare_at_price
    ) {
      currentStep.value = 1;
    }
    toast.error("Product creation failed", formError.value);
  } finally {
    saving.value = false;
  }
};

onMounted(loadFormOptions);
</script>

<template>
  <main class="mx-auto max-w-5xl space-y-6 pb-10">
    <header class="space-y-4">
      <NuxtLink
        to="/vendor/products"
        class="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-card-foreground"
      >
        <ArrowLeft class="h-4 w-4" />
        Products
      </NuxtLink>
      <div>
        <p class="text-sm font-semibold text-sky-700 dark:text-sky-300">
          Step {{ currentStep + 1 }} of {{ steps.length }}
        </p>
        <h1 class="mt-1 text-3xl font-bold tracking-tight text-card-foreground">Create product</h1>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Enter product details, review them, then create the product in your store.
        </p>
      </div>
    </header>

    <nav aria-label="Product setup steps" class="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <ol class="grid gap-3 sm:grid-cols-3">
        <li
          v-for="(step, index) in steps"
          :key="step.label"
          class="flex items-center gap-3"
          :aria-current="index === currentStep ? 'step' : undefined"
        >
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            :class="
              index <= currentStep
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-muted text-muted-foreground'
            "
          >
            <Check v-if="index < currentStep" class="h-4 w-4" />
            <component v-else :is="step.icon" class="h-4 w-4" />
          </span>
          <span
            class="text-sm font-medium"
            :class="index === currentStep ? 'text-card-foreground' : 'text-muted-foreground'"
          >
            <span class="mr-1 text-xs">{{ index + 1 }}.</span>
            {{ step.label }}
          </span>
        </li>
      </ol>
    </nav>

    <AlertMessage
      v-if="pageError"
      type="error"
      title="Unable to load setup information"
      :message="pageError"
    />
    <AlertMessage
      v-if="formError"
      type="error"
      title="Product could not be created"
      :message="formError"
    />

    <div v-if="loading" class="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
      Loading stores and categories…
    </div>

    <form v-else class="space-y-6" @submit.prevent="currentStep === steps.length - 1 ? createProduct() : goToNextStep()">
      <section v-if="currentStep === 0" class="space-y-6">
        <article class="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
          <div class="mb-7 flex items-start gap-4">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
              <Package class="h-5 w-5" />
            </span>
            <div>
              <h2 class="text-lg font-semibold text-card-foreground">Basic information</h2>
              <p class="mt-1 text-sm text-muted-foreground">
                Product name, category, description, and product type.
              </p>
            </div>
          </div>

          <div class="space-y-6">
            <AppSelect
              v-model="storeId"
              label="Vendor store"
              placeholder="Select a store"
              :options="stores.map((store) => ({ label: store.name, value: store.id }))"
              :disabled="!stores.length || saving"
            />
            <p v-if="!stores.length" class="-mt-4 text-sm text-rose-700 dark:text-rose-300">
              You need a vendor store before creating products.
            </p>

            <div>
              <label for="product-name" class="mb-2 block text-sm font-medium text-card-foreground">
                Product name <span class="text-rose-600">*</span>
              </label>
              <input
                id="product-name"
                v-model="form.name"
                type="text"
                maxlength="150"
                placeholder="e.g. Classic Cotton T-Shirt"
                :aria-invalid="!!fieldErrors.name"
                class="h-12 w-full rounded-xl border bg-background px-4 text-sm text-card-foreground outline-none transition placeholder:text-muted-foreground focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-950"
                :class="fieldErrors.name ? 'border-rose-500' : 'border-border'"
              />
              <p v-if="fieldErrors.name" class="mt-1 text-xs text-rose-600">{{ fieldErrors.name }}</p>
            </div>

            <fieldset>
              <legend class="mb-3 text-sm font-medium text-card-foreground">Product type</legend>
              <div class="grid gap-3 md:grid-cols-2">
                <label
                  class="flex cursor-pointer gap-4 rounded-2xl border p-4 transition focus-within:ring-4 focus-within:ring-sky-100 dark:focus-within:ring-sky-950 sm:p-5"
                  :class="productType === 'simple' ? 'border-sky-500 bg-sky-50/70 ring-1 ring-sky-500 dark:bg-sky-950/20' : 'border-border hover:bg-muted/30'"
                >
                  <input v-model="productType" type="radio" value="simple" name="product-type" class="mt-1 h-4 w-4 accent-slate-900" />
                  <span>
                    <span class="flex items-center gap-2 font-semibold text-card-foreground">
                      <Package class="h-4 w-4 text-muted-foreground" />
                      Simple product
                    </span>
                    <span class="mt-1 block text-sm text-muted-foreground">One product-level SKU and price.</span>
                  </span>
                </label>
                <label
                  class="flex cursor-pointer gap-4 rounded-2xl border p-4 transition focus-within:ring-4 focus-within:ring-sky-100 dark:focus-within:ring-sky-950 sm:p-5"
                  :class="productType === 'variants' ? 'border-sky-500 bg-sky-50/70 ring-1 ring-sky-500 dark:bg-sky-950/20' : 'border-border hover:bg-muted/30'"
                >
                  <input v-model="productType" type="radio" value="variants" name="product-type" class="mt-1 h-4 w-4 accent-slate-900" />
                  <span>
                    <span class="flex items-center gap-2 font-semibold text-card-foreground">
                      <Layers3 class="h-4 w-4 text-muted-foreground" />
                      Product with variants
                    </span>
                    <span class="mt-1 block text-sm text-muted-foreground">Different sizes, colors, or options.</span>
                  </span>
                </label>
              </div>
              <p class="mt-2 text-xs text-muted-foreground">
                Product type is a workflow choice; it is not part of the documented product-create request.
              </p>
            </fieldset>

            <div>
              <p class="mb-2 text-sm font-medium text-card-foreground">Categories</p>
              <p v-if="categoryError" class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
                {{ categoryError }}
                <button type="button" class="ml-2 font-semibold underline" @click="retryCategories">Retry</button>
              </p>
              <div v-else-if="categoryRows.length" class="max-h-64 divide-y divide-border overflow-y-auto rounded-xl border border-border">
                <label
                  v-for="{ category, depth } in categoryRows"
                  :key="category.id"
                  class="flex cursor-pointer items-center gap-3 px-3 py-3 transition hover:bg-muted/50"
                  :class="category.is_active === false ? 'cursor-not-allowed opacity-60' : ''"
                  :style="{ paddingInlineStart: `${12 + depth * 22}px` }"
                >
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-border accent-slate-900 focus-visible:ring-2 focus-visible:ring-sky-500"
                    :checked="selectedCategoryIds.includes(category.id)"
                    :disabled="category.is_active === false || saving"
                    @change="toggleCategory(category.id, ($event.target as HTMLInputElement).checked)"
                  />
                  <span class="min-w-0 flex-1">
                    <span class="block text-sm font-medium text-card-foreground">{{ category.name }}</span>
                    <span v-if="category.parent_id" class="block text-xs text-muted-foreground">Nested category</span>
                  </span>
                  <span v-if="category.is_active === false" class="text-xs text-muted-foreground">Inactive</span>
                </label>
              </div>
              <p v-else class="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                No categories are available. Category selection is optional in the documented create request.
              </p>
              <p v-if="selectedCategoryIds.length" class="mt-2 text-xs text-muted-foreground">
                {{ selectedCategoryIds.length }} categories selected. They will be assigned after the product is created.
              </p>
            </div>

            <div>
              <label for="product-description" class="mb-2 block text-sm font-medium text-card-foreground">
                Description <span class="text-rose-600">*</span>
              </label>
              <textarea
                id="product-description"
                v-model="form.description"
                rows="5"
                placeholder="Describe product features and details..."
                :aria-invalid="!!fieldErrors.description"
                class="w-full resize-y rounded-xl border bg-background px-4 py-3 text-sm leading-6 text-card-foreground outline-none transition placeholder:text-muted-foreground focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-950"
                :class="fieldErrors.description ? 'border-rose-500' : 'border-border'"
              />
              <p v-if="fieldErrors.description" class="mt-1 text-xs text-rose-600">{{ fieldErrors.description }}</p>
            </div>
          </div>
        </article>
      </section>

      <section v-else-if="currentStep === 1" class="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
        <div class="mb-7">
          <h2 class="text-lg font-semibold text-card-foreground">Product details</h2>
          <p class="mt-1 text-sm text-muted-foreground">
            These values map to the documented Laravel product creation fields.
          </p>
        </div>
        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <AppInput v-model="form.sku" label="SKU" placeholder="TSHIRT-001" :error="fieldErrors.sku" required />
            <p class="mt-1 text-xs text-muted-foreground">Must be unique for your catalog.</p>
          </div>
          <div>
            <AppInput v-model="form.short_description" label="Short description" placeholder="Soft cotton everyday T-shirt" :error="fieldErrors.short_description" required />
          </div>
          <div>
            <AppInput v-model="form.price" label="Price" type="number" placeholder="19.99" :error="fieldErrors.price" required />
          </div>
          <div>
            <AppInput v-model="form.compare_at_price" label="Compare-at price (optional)" type="number" placeholder="24.99" :error="fieldErrors.compare_at_price" />
          </div>
        </div>
        <div class="mt-6 rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-sm leading-6 text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
          Product images and variant options are managed after creation because their API endpoints require a product ID.
        </div>
      </section>

      <section v-else class="space-y-5">
        <article class="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
          <div class="mb-6 flex items-center gap-3">
            <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Check class="h-5 w-5" />
            </span>
            <div>
              <h2 class="text-lg font-semibold text-card-foreground">Review product</h2>
              <p class="text-sm text-muted-foreground">Confirm the details before creating the product.</p>
            </div>
          </div>
          <dl class="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <div>
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Store</dt>
              <dd class="mt-1 flex items-center gap-2 text-sm font-semibold text-card-foreground">
                <StoreIcon class="h-4 w-4 text-muted-foreground" />
                {{ stores.find((store) => store.id === storeId)?.name || "Not selected" }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Product type</dt>
              <dd class="mt-1 text-sm font-semibold text-card-foreground">
                {{ productType === "simple" ? "Simple product" : "Product with variants" }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</dt>
              <dd class="mt-1 text-sm font-semibold text-card-foreground">{{ form.name }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">SKU</dt>
              <dd class="mt-1 font-mono text-sm text-card-foreground">{{ form.sku }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Price</dt>
              <dd class="mt-1 text-sm font-semibold text-card-foreground">{{ form.price }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Compare-at price</dt>
              <dd class="mt-1 text-sm text-card-foreground">{{ form.compare_at_price || "Not provided" }}</dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Categories</dt>
              <dd class="mt-1 text-sm text-card-foreground">
                {{ selectedCategories.length ? selectedCategories.map((category) => category.name).join(", ") : "None selected" }}
              </dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Short description</dt>
              <dd class="mt-1 text-sm text-card-foreground">{{ form.short_description }}</dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</dt>
              <dd class="mt-1 whitespace-pre-wrap text-sm leading-6 text-card-foreground">{{ form.description }}</dd>
            </div>
          </dl>
        </article>
        <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          Product creation is the final step. After creation, you can manage images, variants, and inventory on the product pages.
        </div>
      </section>

      <footer class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <NuxtLink
          v-if="currentStep === 0"
          to="/vendor/products"
          class="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-semibold text-card-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 dark:focus-visible:ring-slate-700"
        >
          Cancel
        </NuxtLink>
        <AppButton
          v-else
          type="button"
          variant="secondary"
          :disabled="saving"
          @click="currentStep -= 1"
        >
          <ChevronLeft class="h-4 w-4" />
          Back
        </AppButton>

        <AppButton
          v-if="currentStep < steps.length - 1"
          type="submit"
          :disabled="saving || !stores.length"
        >
          Continue
          <ChevronRight class="h-4 w-4" />
        </AppButton>
        <AppButton
          v-else
          type="submit"
          :loading="saving"
          :disabled="!storeId"
        >
          <Sparkles class="h-4 w-4" />
          Create Product
        </AppButton>
      </footer>
    </form>
  </main>
</template>

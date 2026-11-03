<script setup lang="ts">
import {
  CalendarDays,
  Eye,
  EyeOff,
  FolderTree,
  House,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-vue-next";
import type {
  CategoryItem,
  CategoryPayload,
} from "~/composables/useCategory";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"],
  title: "Categories",
});

const {
  getCategories,
  getCategory,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  deleteCategoryImage,
  uploadCategoryIcon,
  deleteCategoryIcon,
} = useCategory();
const toast = useToast();

const categories = ref<CategoryItem[]>([]);
const categoryTree = ref<CategoryItem[]>([]);
const search = ref("");
const statusFilter = ref<"all" | "active" | "inactive">("all");
const hierarchyFilter = ref<"all" | "root" | "child">("all");
const page = ref(1);
const perPage = ref(15);
const totalItems = ref(0);
const lastPage = ref(1);
const loading = ref(false);
const categoriesLoaded = ref(false);
const refreshing = ref(false);
const saving = ref(false);
const deleting = ref(false);
const mediaAction = ref<"image" | "icon" | null>(null);
const mediaErrors = reactive<Record<"image" | "icon", string>>({
  image: "",
  icon: "",
});
const errorMessage = ref("");
const modalOpen = ref(false);
const detailOpen = ref(false);
const detailLoading = ref(false);
const detailCategory = ref<CategoryItem | null>(null);
const confirmOpen = ref(false);
const selectedCategory = ref<CategoryItem | null>(null);
const confirmCategory = ref<CategoryItem | null>(null);

interface CategoryForm {
  name: string;
  parent_id: string | null;
  description: string;
  is_active: boolean;
}

const emptyForm = (): CategoryForm => ({
  name: "",
  parent_id: null,
  description: "",
  is_active: true,
});

const form = reactive<CategoryForm>(emptyForm());
const formErrors = reactive<Record<keyof CategoryForm, string>>({
  name: "",
  parent_id: "",
  description: "",
  is_active: "",
});

const filteredCategories = computed(() => {
  const query = search.value.trim().toLocaleLowerCase();
  return categories.value.filter((category) => {
    const matchesSearch =
      !query ||
      [category.name, category.slug, category.parent?.name].some(
        (value) => value?.toLocaleLowerCase().includes(query) ?? false
      );
    const matchesStatus =
      statusFilter.value === "all" ||
      (statusFilter.value === "active" && category.is_active === true) ||
      (statusFilter.value === "inactive" && category.is_active === false);
    const matchesHierarchy =
      hierarchyFilter.value === "all" ||
      (hierarchyFilter.value === "root" && category.parent_id === null) ||
      (hierarchyFilter.value === "child" && category.parent_id !== null);

    return matchesSearch && matchesStatus && matchesHierarchy;
  });
});

const categoryCount = computed(() => categories.value.length);
const hasActiveFilters = computed(
  () =>
    Boolean(search.value.trim()) ||
    statusFilter.value !== "all" ||
    hierarchyFilter.value !== "all"
);
const allTreeCategories = computed(() => {
  const flattened: CategoryItem[] = [];
  const visit = (nodes: CategoryItem[]) => {
    for (const node of nodes) {
      flattened.push(node);
      visit(node.children || []);
    }
  };
  visit(categoryTree.value);
  return flattened;
});
const categoryStats = computed(() => ({
  total: allTreeCategories.value.length,
  active: allTreeCategories.value.filter((category) => category.is_active === true).length,
  inactive: allTreeCategories.value.filter((category) => category.is_active === false).length,
  root: categoryTree.value.length,
}));
const parentOptions = computed(() => {
  const excludedIds = new Set<string>();
  const findDescendants = (nodes: CategoryItem[], collect: boolean) => {
    for (const node of nodes) {
      const shouldExclude = collect || node.id === selectedCategory.value?.id;
      if (shouldExclude) excludedIds.add(node.id);
      findDescendants(node.children || [], shouldExclude);
    }
  };
  findDescendants(categoryTree.value, false);

  const options: Array<{ value: string; label: string }> = [];
  const flatten = (nodes: CategoryItem[], depth = 0) => {
    for (const node of nodes) {
      if (!excludedIds.has(node.id)) {
        options.push({
          value: node.id,
          label: `${"— ".repeat(depth)}${node.name}`,
        });
      }
      flatten(node.children || [], depth + 1);
    }
  };
  flatten(categoryTree.value);
  return options;
});

const columns = [
  { key: "category", label: "Category", width: "22rem" },
  { key: "media", label: "Media", width: "7rem" },
  { key: "slug", label: "Slug", width: "12rem" },
  { key: "parent", label: "Parent category", width: "14rem" },
  { key: "status", label: "Status", width: "8rem" },
  { key: "created_at", label: "Created", width: "12rem" },
  { key: "actions", label: "Actions", align: "right" as const, width: "5rem" },
];

const getErrorDetails = (error: unknown) => {
  const apiError = error as {
    response?: {
      data?: {
        message?: string;
        errors?: Partial<Record<keyof CategoryForm | "image" | "icon", string[]>>;
      };
    };
    message?: string;
  };

  return {
    message:
      apiError.response?.data?.message ||
      apiError.message ||
      "The request could not be completed.",
    errors: apiError.response?.data?.errors || {},
  };
};

const fetchCategories = async (silent = false) => {
  errorMessage.value = "";
  if (silent || categories.value.length > 0) refreshing.value = true;
  else loading.value = true;

  try {
    const [listResponse, treeResponse] = await Promise.all([
      getCategories({ page: page.value, per_page: perPage.value }),
      getCategoryTree(),
    ]);

    categories.value = listResponse.data.categories;
    totalItems.value = listResponse.data.pagination.total;
    lastPage.value = listResponse.data.pagination.last_page;
    categoryTree.value = treeResponse.data.categories;
    categoriesLoaded.value = true;
  } catch (error: unknown) {
    errorMessage.value = getErrorDetails(error).message;
    toast.error("Failed to load categories", errorMessage.value);
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

const resetFormErrors = () => {
  for (const key of Object.keys(formErrors) as Array<keyof CategoryForm>) {
    formErrors[key] = "";
  }
};

const resetForm = () => {
  Object.assign(form, emptyForm());
  resetFormErrors();
  mediaErrors.image = "";
  mediaErrors.icon = "";
};

const openCreate = () => {
  selectedCategory.value = null;
  resetForm();
  modalOpen.value = true;
};

const openEdit = (category: CategoryItem) => {
  selectedCategory.value = category;
  mediaErrors.image = "";
  mediaErrors.icon = "";
  Object.assign(form, {
    name: category.name,
    parent_id: category.parent_id,
    description: category.description || "",
    is_active: category.is_active !== false,
  });
  resetFormErrors();
  modalOpen.value = true;
};

const openDetails = async (category: CategoryItem) => {
  detailOpen.value = true;
  detailLoading.value = true;
  detailCategory.value = null;

  try {
    const response = await getCategory(category.id);
    detailCategory.value = response.data.category;
  } catch (error: unknown) {
    detailOpen.value = false;
    const message = getErrorDetails(error).message;
    errorMessage.value = message;
    toast.error("Failed to load category details", message);
  } finally {
    detailLoading.value = false;
  }
};

const closeDetails = () => {
  if (detailLoading.value) return;
  detailOpen.value = false;
  detailCategory.value = null;
};

const formatTimestamp = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const closeModal = () => {
  if (saving.value || mediaAction.value) return;
  modalOpen.value = false;
  selectedCategory.value = null;
  resetForm();
};

const saveCategory = async () => {
  resetFormErrors();
  const name = form.name.trim();

  if (name.length < 2 || name.length > 150) {
    formErrors.name = "Enter a category name between 2 and 150 characters.";
    return;
  }

  saving.value = true;
  errorMessage.value = "";
  const payload: CategoryPayload = {
    name,
    parent_id: form.parent_id || null,
    description: form.description.trim() || null,
  };

  if (selectedCategory.value) {
    payload.is_active = form.is_active;
  }

  try {
    if (selectedCategory.value) {
      await updateCategory(selectedCategory.value.id, payload);
      toast.success("Category updated", "The category was updated successfully.");
    } else {
      await createCategory(payload);
      page.value = 1;
      toast.success("Category created", "The category was created successfully.");
    }

    modalOpen.value = false;
    selectedCategory.value = null;
    resetForm();
    await fetchCategories(true);
  } catch (error: unknown) {
    const details = getErrorDetails(error);
    errorMessage.value = details.message;
    for (const key of Object.keys(formErrors) as Array<keyof CategoryForm>) {
      formErrors[key] = details.errors[key]?.[0] || "";
    }
    toast.error("Save failed", errorMessage.value);
  } finally {
    saving.value = false;
  }
};

const openDelete = (category: CategoryItem) => {
  confirmCategory.value = category;
  confirmOpen.value = true;
};

const closeDelete = () => {
  if (deleting.value) return;
  confirmOpen.value = false;
  confirmCategory.value = null;
};

const confirmDelete = async () => {
  if (!confirmCategory.value) return;
  deleting.value = true;
  errorMessage.value = "";

  try {
    await deleteCategory(confirmCategory.value.id);
    toast.success("Category deleted", `${confirmCategory.value.name} was deleted.`);
    confirmOpen.value = false;
    confirmCategory.value = null;
    if (categories.value.length === 1 && page.value > 1) page.value--;
    await fetchCategories(true);
  } catch (error: unknown) {
    errorMessage.value = getErrorDetails(error).message;
    toast.error("Delete failed", errorMessage.value);
  } finally {
    deleting.value = false;
  }
};

const uploadMedia = async (kind: "image" | "icon", event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file || !selectedCategory.value) return;

  const extension = file.name.split(".").pop()?.toLocaleLowerCase();
  const validExtensions =
    kind === "image" ? ["jpg", "jpeg", "png", "webp"] : ["svg", "png", "webp"];
  const maxBytes = kind === "image" ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
  if (!extension || !validExtensions.includes(extension) || file.size > maxBytes) {
    toast.error(
      "Invalid file",
      kind === "image"
        ? "Choose a JPG, PNG, or WebP image up to 5 MB."
        : "Choose an SVG, PNG, or WebP icon up to 2 MB."
    );
    (event.target as HTMLInputElement).value = "";
    return;
  }

  mediaAction.value = kind;
  mediaErrors[kind] = "";
  errorMessage.value = "";
  try {
    const response =
      kind === "image"
        ? await uploadCategoryImage(selectedCategory.value.id, file)
        : await uploadCategoryIcon(selectedCategory.value.id, file);
    selectedCategory.value = response.data.category;
    categories.value = categories.value.map((category) =>
      category.id === response.data.category.id ? response.data.category : category
    );
    toast.success(
      kind === "image" ? "Image uploaded" : "Icon uploaded",
      `The category ${kind} was uploaded successfully.`
    );
    await fetchCategories(true);
  } catch (error: unknown) {
    const details = getErrorDetails(error);
    errorMessage.value = details.message;
    mediaErrors[kind] = details.errors[kind]?.[0] || "";
    toast.error(`${kind === "image" ? "Image" : "Icon"} upload failed`, errorMessage.value);
  } finally {
    mediaAction.value = null;
    (event.target as HTMLInputElement).value = "";
  }
};

const removeMedia = async (kind: "image" | "icon") => {
  if (!selectedCategory.value) return;
  mediaAction.value = kind;
  mediaErrors[kind] = "";
  errorMessage.value = "";
  try {
    const response =
      kind === "image"
        ? await deleteCategoryImage(selectedCategory.value.id)
        : await deleteCategoryIcon(selectedCategory.value.id);
    selectedCategory.value = response.data.category;
    categories.value = categories.value.map((category) =>
      category.id === response.data.category.id ? response.data.category : category
    );
    toast.success(
      kind === "image" ? "Image removed" : "Icon removed",
      `The category ${kind} was removed.`
    );
    await fetchCategories(true);
  } catch (error: unknown) {
    const details = getErrorDetails(error);
    errorMessage.value = details.message;
    mediaErrors[kind] = details.errors[kind]?.[0] || "";
    toast.error(`${kind === "image" ? "Image" : "Icon"} removal failed`, errorMessage.value);
  } finally {
    mediaAction.value = null;
  }
};

const handleCategoryAction = (category: CategoryItem, action: string) => {
  if (action === "details") void openDetails(category);
  if (action === "edit") openEdit(category);
  if (action === "delete") openDelete(category);
};

const goPrevious = async () => {
  if (page.value <= 1) return;
  page.value--;
  await fetchCategories();
};

const goNext = async () => {
  if (page.value >= lastPage.value) return;
  page.value++;
  await fetchCategories();
};

const goToPage = async (targetPage: number) => {
  if (targetPage < 1 || targetPage > lastPage.value) return;
  page.value = targetPage;
  await fetchCategories();
};

const resetFilters = () => {
  search.value = "";
  statusFilter.value = "all";
  hierarchyFilter.value = "all";
};

onMounted(() => fetchCategories());
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Categories Management"
      subtitle="Organize your catalog with clear category names and parent relationships."
    >
      <template #actions>
        <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <AppButton
            variant="secondary"
            size="sm"
            :loading="refreshing"
            @click="fetchCategories(true)"
          >
          <RefreshCcw class="h-4 w-4" />
          Refresh
          </AppButton>
          <AppButton size="sm" @click="openCreate">
            <Plus class="h-4 w-4" />
            Add Category
          </AppButton>
        </div>
      </template>
    </PageHeader>

    <AlertMessage
      v-if="errorMessage"
      type="error"
      title="Unable to manage categories"
      :message="errorMessage"
    />

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        title="Total Categories"
        :value="categoriesLoaded ? categoryStats.total : '—'"
        subtitle="All categories in the tree"
        tone="info"
      >
        <template #badge>
          <AppBadge variant="info" shape="square" size="md">
            <FolderTree class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard
        title="Active"
        :value="categoriesLoaded ? categoryStats.active : '—'"
        subtitle="Across the full tree"
        tone="success"
      >
        <template #badge>
          <AppBadge variant="success" shape="square" size="md">
            <Eye class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard
        title="Inactive"
        :value="categoriesLoaded ? categoryStats.inactive : '—'"
        subtitle="Across the full tree"
        tone="warning"
      >
        <template #badge>
          <AppBadge variant="warning" shape="square" size="md">
            <EyeOff class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard
        title="Root Categories"
        :value="categoriesLoaded ? categoryStats.root : '—'"
        subtitle="Top-level categories"
        tone="default"
      >
        <template #badge>
          <AppBadge variant="default" shape="square" size="md">
            <House class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>
    </div>

    <FilterBar
      title="Filter categories"
      subtitle="Search and filters apply only to the currently loaded page; the API does not provide server-side filters."
      columns="3"
    >
      <AppInput
        v-model="search"
        label="Search categories"
        placeholder="Search name, slug, or parent..."
      >
        <template #icon><Search class="h-4 w-4" /></template>
      </AppInput>
      <AppSelect
        v-model="statusFilter"
        label="Status"
        :options="[
          { label: 'All statuses', value: 'all' },
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ]"
      />
      <AppSelect
        v-model="hierarchyFilter"
        label="Hierarchy"
        :options="[
          { label: 'All categories', value: 'all' },
          { label: 'Root categories', value: 'root' },
          { label: 'Subcategories', value: 'child' },
        ]"
      />
      <template #actions>
        <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <span class="text-sm text-muted-foreground" aria-live="polite">
            {{ filteredCategories.length }} of {{ categories.length }} on this page
          </span>
          <AppButton
            v-if="hasActiveFilters"
            variant="secondary"
            size="sm"
            @click="resetFilters"
          >
            <X class="h-4 w-4" />
            Clear filters
          </AppButton>
        </div>
      </template>
    </FilterBar>

    <DataTable
      :columns="columns"
      :rows="filteredCategories"
      :loading="loading && categoryCount === 0"
      :empty-title="hasActiveFilters ? 'No matching categories' : 'No categories yet'"
      :empty-message="
        hasActiveFilters
          ? 'Adjust or clear the search and filters to see more categories on this page.'
          : 'Create a category to start organizing your catalog.'
      "
    >
      <template #cell-category="{ row }">
        <div class="flex items-center gap-3">
          <img
            v-if="row.icon_url"
            :src="row.icon_url"
            :alt="`${row.name} icon`"
            class="h-10 w-10 rounded-xl border border-border object-contain p-1"
          />
          <AppBadge v-else variant="info" shape="square" size="md">
            <FolderTree class="h-4 w-4" />
          </AppBadge>
          <div class="min-w-0">
            <p class="truncate text-sm font-bold text-card-foreground">{{ row.name }}</p>
            <p v-if="row.description" class="mt-1 truncate text-xs text-muted-foreground">
              {{ row.description }}
            </p>
          </div>
        </div>
      </template>

      <template #cell-media="{ row }">
        <div class="flex items-center gap-2">
          <div
            class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-border bg-background"
            :title="row.image_url ? 'Category image' : 'No category image'"
          >
            <img
              v-if="row.image_url"
              :src="row.image_url"
              :alt="`${row.name} image`"
              class="h-full w-full object-cover"
            />
            <ImagePlus v-else class="h-4 w-4 text-muted-foreground/60" aria-hidden="true" />
          </div>
          <div
            class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-border bg-background"
            :title="row.icon_url ? 'Category icon' : 'No category icon'"
          >
            <img
              v-if="row.icon_url"
              :src="row.icon_url"
              :alt="`${row.name} icon`"
              class="h-full w-full object-contain p-1"
            />
            <FolderTree v-else class="h-4 w-4 text-muted-foreground/60" aria-hidden="true" />
          </div>
        </div>
      </template>

      <template #cell-slug="{ row }">
        <code class="rounded-lg border border-border bg-muted px-2 py-1 text-xs">
          {{ row.slug }}
        </code>
      </template>

      <template #cell-parent="{ row }">
        <AppBadge v-if="row.parent?.name" variant="default" class="max-w-52">
          <FolderTree class="h-3.5 w-3.5 shrink-0" />
          <span class="truncate">{{ row.parent.name }}</span>
        </AppBadge>
        <span v-else class="text-sm text-muted-foreground">Root category</span>
      </template>

      <template #cell-status="{ row }">
        <AppBadge :variant="row.is_active ? 'success' : 'default'">
          {{ row.is_active ? "Active" : "Inactive" }}
        </AppBadge>
      </template>

      <template #cell-created_at="{ row }">
        <span class="text-sm text-muted-foreground">{{ formatTimestamp(row.created_at) || "—" }}</span>
      </template>

      <template #cell-actions="{ row }">
        <AppDropdown
          width="w-64"
          :items="[
            {
              label: 'View details',
              value: 'details',
              icon: Eye,
              description: 'View category information',
            },
            {
              label: 'Edit Category',
              value: 'edit',
              icon: Pencil,
              description: 'Update category information',
            },
            {
              label: 'Delete Category',
              value: 'delete',
              icon: Trash2,
              variant: 'danger',
              description: 'Remove this category',
            },
          ]"
          @select="handleCategoryAction(row, $event)"
        />
      </template>
    </DataTable>

    <TablePagination
      :current-page="page"
      :last-page="lastPage"
      :total="totalItems"
      :per-page="perPage"
      :loading="loading && categoryCount === 0"
      label="categories"
      @previous="goPrevious"
      @next="goNext"
      @page="goToPage"
    />

    <AppModal
      :open="modalOpen"
      :title="selectedCategory ? 'Edit Category' : 'Create Category'"
      :subtitle="selectedCategory ? 'Update category information.' : 'Add a product category.'"
      size="lg"
      @close="closeModal"
    >
      <template #icon><FolderTree class="h-5 w-5" /></template>
      <form class="space-y-6" @submit.prevent="saveCategory">
        <section class="space-y-4">
          <div>
            <h3 class="text-sm font-semibold text-card-foreground">Basic information</h3>
            <p class="mt-1 text-xs text-muted-foreground">
              Choose a clear name and optional description for this category.
            </p>
          </div>
          <AppInput
            v-model="form.name"
            label="Category name *"
            placeholder="Kitchen"
            :error="formErrors.name"
            :required="true"
            :disabled="saving"
          />
          <label class="block space-y-2 text-sm font-medium text-card-foreground">
            <span>Description <span class="font-normal text-muted-foreground">(optional)</span></span>
            <textarea
              v-model="form.description"
              rows="3"
              :disabled="saving"
              class="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-card-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-foreground/30 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Describe this category"
            />
            <span v-if="formErrors.description" class="block text-xs text-destructive">
              {{ formErrors.description }}
            </span>
          </label>
        </section>

        <section class="space-y-4 border-t border-border pt-5">
          <div>
            <h3 class="text-sm font-semibold text-card-foreground">Hierarchy and status</h3>
            <p class="mt-1 text-xs text-muted-foreground">
              Nest this category under another one or keep it at the root.
            </p>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
          <label class="block space-y-2 text-sm font-medium text-card-foreground">
            Parent category
            <select
              v-model="form.parent_id"
              :disabled="saving"
              class="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-card-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-foreground/30 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Parent category"
            >
              <option :value="null">Root category</option>
              <option
                v-for="category in parentOptions"
                :key="category.value"
                :value="category.value"
              >
                {{ category.label }}
              </option>
            </select>
            <span v-if="formErrors.parent_id" class="text-xs text-destructive">
              {{ formErrors.parent_id }}
            </span>
          </label>
            <label
              v-if="selectedCategory"
              class="flex items-center gap-3 self-end rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm font-medium text-card-foreground"
            >
              <input
                v-model="form.is_active"
                type="checkbox"
                :disabled="saving"
                class="h-4 w-4 rounded border-border accent-foreground focus-visible:ring-2 focus-visible:ring-foreground/30"
              />
              <span>
                Active category
                <span class="mt-0.5 block text-xs font-normal text-muted-foreground">
                  Inactive categories remain visible in the API tree.
                </span>
              </span>
            </label>
          </div>
          <p v-if="formErrors.is_active" class="text-xs text-destructive">
            {{ formErrors.is_active }}
          </p>
        </section>

        <section v-if="selectedCategory" class="space-y-4 border-t border-border pt-5">
          <div>
            <h3 class="text-sm font-semibold text-card-foreground">Category media</h3>
            <p class="mt-1 text-xs text-muted-foreground">
              Upload images and icons to enrich category listings.
            </p>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
              <h4 class="text-sm font-semibold text-card-foreground">Image</h4>
              <img
                v-if="selectedCategory.image_url"
                :src="selectedCategory.image_url"
                :alt="`${selectedCategory.name} category`"
                class="h-28 w-full rounded-xl border border-border bg-background object-contain"
              />
              <p v-else class="text-sm text-muted-foreground">
                {{ selectedCategory.image ? "Image URL is unavailable." : "No image uploaded." }}
              </p>
              <div class="flex flex-wrap gap-2">
                <label
                  class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-card-foreground transition hover:bg-muted focus-within:ring-2 focus-within:ring-foreground/30"
                  :class="mediaAction ? 'pointer-events-none opacity-50' : ''"
                  :aria-busy="mediaAction === 'image'"
                >
                  <Loader2 v-if="mediaAction === 'image'" class="h-4 w-4 animate-spin" />
                  <Upload v-else class="h-4 w-4" />
                  {{
                    mediaAction === "image"
                      ? "Uploading image..."
                      : selectedCategory.image
                      ? "Replace image"
                      : "Upload image"
                  }}
                  <input
                    type="file"
                    class="sr-only"
                    aria-label="Upload category image"
                    accept=".jpg,.jpeg,.png,.webp"
                    :disabled="!!mediaAction || saving"
                    @change="uploadMedia('image', $event)"
                  />
                </label>
                <AppButton
                  v-if="selectedCategory.image"
                  type="button"
                  size="sm"
                  variant="secondary"
                  :disabled="!!mediaAction || saving"
                  :loading="mediaAction === 'image'"
                  @click="removeMedia('image')"
                >
                  <X class="h-4 w-4" />
                  Remove
                </AppButton>
              </div>
              <p class="text-xs text-muted-foreground">JPG, PNG, or WebP; maximum 5 MB.</p>
              <p v-if="mediaErrors.image" class="text-xs text-destructive">
                {{ mediaErrors.image }}
              </p>
            </div>

            <div class="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
              <h4 class="text-sm font-semibold text-card-foreground">Icon</h4>
              <img
                v-if="selectedCategory.icon_url"
                :src="selectedCategory.icon_url"
                :alt="`${selectedCategory.name} icon`"
                class="h-28 w-full rounded-xl border border-border bg-background object-contain"
              />
              <p v-else class="text-sm text-muted-foreground">
                {{ selectedCategory.icon ? "Icon URL is unavailable." : "No icon uploaded." }}
              </p>
              <div class="flex flex-wrap gap-2">
                <label
                  class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-card-foreground transition hover:bg-muted focus-within:ring-2 focus-within:ring-foreground/30"
                  :class="mediaAction ? 'pointer-events-none opacity-50' : ''"
                  :aria-busy="mediaAction === 'icon'"
                >
                  <Loader2 v-if="mediaAction === 'icon'" class="h-4 w-4 animate-spin" />
                  <ImagePlus v-else class="h-4 w-4" />
                  {{
                    mediaAction === "icon"
                      ? "Uploading icon..."
                      : selectedCategory.icon
                      ? "Replace icon"
                      : "Upload icon"
                  }}
                  <input
                    type="file"
                    class="sr-only"
                    aria-label="Upload category icon"
                    accept=".svg,.png,.webp"
                    :disabled="!!mediaAction || saving"
                    @change="uploadMedia('icon', $event)"
                  />
                </label>
                <AppButton
                  v-if="selectedCategory.icon"
                  type="button"
                  size="sm"
                  variant="secondary"
                  :disabled="!!mediaAction || saving"
                  :loading="mediaAction === 'icon'"
                  @click="removeMedia('icon')"
                >
                  <X class="h-4 w-4" />
                  Remove
                </AppButton>
              </div>
              <p class="text-xs text-muted-foreground">SVG, PNG, or WebP; maximum 2 MB.</p>
              <p v-if="mediaErrors.icon" class="text-xs text-destructive">
                {{ mediaErrors.icon }}
              </p>
            </div>
          </div>
        </section>

        <div class="flex justify-end gap-3 border-t border-border pt-5">
          <AppButton
            type="button"
            variant="secondary"
            :disabled="saving || !!mediaAction"
            @click="closeModal"
          >
            Cancel
          </AppButton>
          <AppButton type="submit" :loading="saving" :disabled="!!mediaAction">
            {{ selectedCategory ? "Update Category" : "Create Category" }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <AppModal
      :open="detailOpen"
      title="Category details"
      subtitle="Category information from the latest API response."
      size="md"
      @close="closeDetails"
    >
      <template #icon><Eye class="h-5 w-5" /></template>
      <div v-if="detailLoading" class="flex items-center justify-center gap-3 py-12 text-sm text-muted-foreground" aria-live="polite">
        <Loader2 class="h-5 w-5 animate-spin" />
        Loading category details...
      </div>
      <div v-else-if="detailCategory" class="space-y-5">
        <div class="flex items-start gap-4">
          <img
            v-if="detailCategory.image_url"
            :src="detailCategory.image_url"
            :alt="`${detailCategory.name} category image`"
            class="h-20 w-20 shrink-0 rounded-2xl border border-border bg-muted object-cover"
          />
          <AppBadge v-else variant="info" shape="square" size="lg">
            <FolderTree class="h-6 w-6" />
          </AppBadge>
          <div class="min-w-0 flex-1">
            <h3 class="break-words text-lg font-semibold text-card-foreground">
              {{ detailCategory.name }}
            </h3>
            <code class="mt-1 inline-block break-all text-xs text-muted-foreground">
              {{ detailCategory.slug }}
            </code>
            <AppBadge
              class="mt-3"
              :variant="detailCategory.is_active ? 'success' : 'default'"
            >
              {{ detailCategory.is_active ? "Active" : "Inactive" }}
            </AppBadge>
          </div>
          <img
            v-if="detailCategory.icon_url"
            :src="detailCategory.icon_url"
            :alt="`${detailCategory.name} icon`"
            class="h-12 w-12 shrink-0 rounded-xl border border-border bg-background object-contain p-1"
          />
        </div>

        <dl class="grid gap-4 rounded-2xl border border-border bg-muted/30 p-4 sm:grid-cols-2">
          <div>
            <dt class="text-xs font-medium text-muted-foreground">Parent category</dt>
            <dd class="mt-1 text-sm font-medium text-card-foreground">
              {{ detailCategory.parent?.name || "Root category" }}
            </dd>
          </div>
          <div>
            <dt class="text-xs font-medium text-muted-foreground">Category ID</dt>
            <dd class="mt-1 break-all font-mono text-xs text-card-foreground">
              {{ detailCategory.id }}
            </dd>
          </div>
          <div v-if="detailCategory.created_at">
            <dt class="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <CalendarDays class="h-3.5 w-3.5" />
              Created
            </dt>
            <dd class="mt-1 text-sm text-card-foreground">
              {{ formatTimestamp(detailCategory.created_at) }}
            </dd>
          </div>
          <div v-if="detailCategory.updated_at">
            <dt class="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <CalendarDays class="h-3.5 w-3.5" />
              Last updated
            </dt>
            <dd class="mt-1 text-sm text-card-foreground">
              {{ formatTimestamp(detailCategory.updated_at) }}
            </dd>
          </div>
        </dl>

        <div>
          <h3 class="text-xs font-medium text-muted-foreground">Description</h3>
          <p class="mt-1 whitespace-pre-wrap text-sm text-card-foreground">
            {{ detailCategory.description || "No description provided." }}
          </p>
        </div>

        <div class="flex justify-end border-t border-border pt-4">
          <AppButton variant="secondary" size="sm" @click="closeDetails">Close</AppButton>
        </div>
      </div>
    </AppModal>

    <ConfirmDialog
      :open="confirmOpen"
      title="Delete Category"
      :message="`Are you sure you want to delete ${confirmCategory?.name || 'this category'}? Categories with child categories cannot be deleted.`"
      confirm-label="Delete Category"
      variant="danger"
      :loading="deleting"
      @close="closeDelete"
      @confirm="confirmDelete"
    />
    <AppRefreshingIndicator :show="refreshing" />
  </div>
</template>

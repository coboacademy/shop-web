<script setup lang="ts">
import {
  FolderTree,
  ImagePlus,
  Pencil,
  Plus,
  RefreshCcw,
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
const page = ref(1);
const perPage = ref(15);
const totalItems = ref(0);
const lastPage = ref(1);
const loading = ref(false);
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
  if (!query) return categories.value;

  return categories.value.filter((category) =>
    [category.name, category.slug, category.parent?.name]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase().includes(query))
  );
});

const categoryCount = computed(() => categories.value.length);
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
  { key: "category", label: "Category" },
  { key: "slug", label: "Slug" },
  { key: "parent", label: "Parent category" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Created" },
  { key: "actions", label: "Actions", align: "right" as const },
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
};

onMounted(() => fetchCategories());
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Categories Management"
      subtitle="Organize product categories and their parent-child relationships."
    >
      <template #actions>
        <AppButton variant="secondary" :loading="refreshing" @click="fetchCategories(true)">
          <RefreshCcw class="h-4 w-4" />
          Refresh
        </AppButton>
        <AppButton @click="openCreate">
          <Plus class="h-4 w-4" />
          Add Category
        </AppButton>
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
        :value="totalItems"
        subtitle="All product categories"
        tone="info"
      >
        <template #badge>
          <AppBadge variant="info" shape="square" size="md">
            <FolderTree class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>
    </div>

    <FilterBar
      title="Filters"
      subtitle="Search within the categories on the current page; the API does not provide search."
    >
      <AppInput v-model="search" label="Search current page" placeholder="Search categories..." />
      <template #actions>
        <AppButton variant="secondary" @click="resetFilters">Reset</AppButton>
      </template>
    </FilterBar>

    <DataTable
      :columns="columns"
      :rows="filteredCategories"
      :loading="loading && categoryCount === 0"
      empty-title="No categories found"
      empty-message="Create your first product category."
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

      <template #cell-slug="{ row }">
        <code class="rounded-lg border border-border bg-muted px-2 py-1 text-xs">
          {{ row.slug }}
        </code>
      </template>

      <template #cell-parent="{ row }">
        <span class="text-sm text-muted-foreground">
          {{ row.parent?.name || "Root category" }}
        </span>
      </template>

      <template #cell-status="{ row }">
        <AppBadge :variant="row.is_active ? 'success' : 'default'">
          {{ row.is_active ? "Active" : "Inactive" }}
        </AppBadge>
      </template>

      <template #cell-created_at="{ row }">
        <span class="text-sm text-muted-foreground">{{ row.created_at || "—" }}</span>
      </template>

      <template #cell-actions="{ row }">
        <AppDropdown
          width="w-64"
          :items="[
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
      <form class="space-y-5" @submit.prevent="saveCategory">
        <div class="grid gap-5 md:grid-cols-2">
          <AppInput
            v-model="form.name"
            label="Category name"
            placeholder="Kitchen"
            :error="formErrors.name"
          />
          <label class="block space-y-2 text-sm font-medium text-card-foreground">
            Parent category
            <select
              v-model="form.parent_id"
              class="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
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
        </div>

        <label class="block space-y-2 text-sm font-medium text-card-foreground">
          Description
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            placeholder="Describe this category"
          />
          <span v-if="formErrors.description" class="text-xs text-destructive">
            {{ formErrors.description }}
          </span>
        </label>

        <label
          v-if="selectedCategory"
          class="flex flex-wrap items-center gap-3 text-sm font-medium text-card-foreground"
        >
          <input v-model="form.is_active" type="checkbox" class="h-4 w-4 rounded border-border" />
          Active category
          <span v-if="formErrors.is_active" class="w-full text-xs text-destructive">
            {{ formErrors.is_active }}
          </span>
        </label>

        <div v-if="selectedCategory" class="grid gap-4 border-t border-border pt-5 md:grid-cols-2">
          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-card-foreground">Category image</h3>
            <img
              v-if="selectedCategory.image_url"
              :src="selectedCategory.image_url"
              :alt="`${selectedCategory.name} category`"
              class="h-28 w-full rounded-xl border border-border bg-muted object-contain"
            />
            <p v-else class="text-sm text-muted-foreground">
              {{ selectedCategory.image ? "Image URL is unavailable." : "No image uploaded." }}
            </p>
            <div class="flex flex-wrap gap-2">
              <label
                class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted"
                :class="mediaAction ? 'pointer-events-none opacity-50' : ''"
              >
                <Upload class="h-4 w-4" />
                {{ selectedCategory.image ? "Replace image" : "Upload image" }}
                <input
                  type="file"
                  class="sr-only"
                  accept=".jpg,.jpeg,.png,.webp"
                  :disabled="!!mediaAction"
                  @change="uploadMedia('image', $event)"
                />
              </label>
              <AppButton
                v-if="selectedCategory.image"
                type="button"
                variant="secondary"
                :disabled="!!mediaAction"
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

          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-card-foreground">Category icon</h3>
            <img
              v-if="selectedCategory.icon_url"
              :src="selectedCategory.icon_url"
              :alt="`${selectedCategory.name} icon`"
              class="h-28 w-full rounded-xl border border-border bg-muted object-contain"
            />
            <p v-else class="text-sm text-muted-foreground">
              {{ selectedCategory.icon ? "Icon URL is unavailable." : "No icon uploaded." }}
            </p>
            <div class="flex flex-wrap gap-2">
              <label
                class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted"
                :class="mediaAction ? 'pointer-events-none opacity-50' : ''"
              >
                <ImagePlus class="h-4 w-4" />
                {{ selectedCategory.icon ? "Replace icon" : "Upload icon" }}
                <input
                  type="file"
                  class="sr-only"
                  accept=".svg,.png,.webp"
                  :disabled="!!mediaAction"
                  @change="uploadMedia('icon', $event)"
                />
              </label>
              <AppButton
                v-if="selectedCategory.icon"
                type="button"
                variant="secondary"
                :disabled="!!mediaAction"
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

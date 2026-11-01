<script setup lang="ts">
import {
  FolderTree,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-vue-next";
import type {
  CategoryItem,
  CategoryPayload,
} from "~/composables/useCategory";

definePageMeta({
  layout: "dashboard",

});

const { getCategories, createCategory, updateCategory, deleteCategory } = useCategory();
const authStore = useAuthStore();
const toast = useToast();

const categories = ref<CategoryItem[]>([]);
const search = ref("");
const page = ref(1);
const perPage = ref(10);
const totalItems = ref(0);
const lastPage = ref(1);
const totalCategories = ref(0);
const loading = ref(false);
const refreshing = ref(false);
const saving = ref(false);
const deleting = ref(false);
const errorMessage = ref("");
const modalOpen = ref(false);
const confirmOpen = ref(false);
const selectedCategory = ref<CategoryItem | null>(null);
const confirmCategory = ref<CategoryItem | null>(null);

const emptyForm = (): CategoryPayload => ({
  name: "",
  slug: "",
  parent_id: null,
  description: "",
  image: "",
  icon: "",
  is_active: true,
});

const form = reactive<CategoryPayload>(emptyForm());
const formErrors = reactive<Record<keyof CategoryPayload, string>>({
  name: "",
  slug: "",
  parent_id: "",
  description: "",
  image: "",
  icon: "",
  is_active: "",
});

const canCreateCategory = computed(() => authStore.hasPermission?.("category.create") ?? false);
const canUpdateCategory = computed(() => authStore.hasPermission?.("category.update") ?? false);
const canDeleteCategory = computed(() => authStore.hasPermission?.("category.delete") ?? false);
const categoryRows = computed(() => categories.value);
const parentOptions = computed(() =>
  categories.value
    .filter((category) => category.id !== selectedCategory.value?.id)
    .map((category) => ({
      value: category.id,
      label: category.name,
    }))
);

const columns = [
  { key: "name", label: "Category" },
  { key: "slug", label: "Slug" },
  { key: "parent", label: "Parent category" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Created" },
  { key: "actions", label: "Actions", align: "right" as const },
];

const fetchCategories = async (silent = false) => {
  errorMessage.value = "";
  if (silent || categories.value.length > 0) refreshing.value = true;
  else loading.value = true;

  try {
    const response = await getCategories({
      search: search.value.trim() || undefined,
      page: page.value,
      per_page: perPage.value,
    });
    const data = response.data;
    categories.value = Array.isArray(data.categories) ? data.categories : [];
    totalItems.value = data.pagination?.total ?? categories.value.length;
    lastPage.value = data.pagination?.last_page ?? 1;
    totalCategories.value = data.stats?.total_categories ?? totalItems.value;
  } catch (error: unknown) {
    const apiError = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    errorMessage.value =
      apiError.response?.data?.message || apiError.message || "Failed to load categories.";
    toast.error("Failed to load categories", errorMessage.value);
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

const resetFormErrors = () => {
  for (const key of Object.keys(formErrors) as Array<keyof CategoryPayload>) {
    formErrors[key] = "";
  }
};

const resetForm = () => {
  Object.assign(form, emptyForm());
  resetFormErrors();
};

const openCreate = () => {
  selectedCategory.value = null;
  resetForm();
  modalOpen.value = true;
};

const openEdit = (category: CategoryItem) => {
  selectedCategory.value = category;
  Object.assign(form, {
    name: category.name,
    slug: category.slug,
    parent_id: category.parent_id,
    description: category.description || "",
    image: category.image || "",
    icon: category.icon || "",
    is_active: category.is_active !== false,
  });
  resetFormErrors();
  modalOpen.value = true;
};

const closeModal = () => {
  if (saving.value) return;
  modalOpen.value = false;
  selectedCategory.value = null;
  resetForm();
};

const saveCategory = async () => {
  saving.value = true;
  errorMessage.value = "";
  resetFormErrors();

  const payload: CategoryPayload = {
    name: form.name.trim(),
    slug: form.slug.trim(),
    parent_id: form.parent_id || null,
    description: form.description.trim(),
    image: form.image.trim(),
    icon: form.icon.trim(),
    is_active: form.is_active,
  };

  if (!payload.name) formErrors.name = "Category name is required.";
  if (!payload.slug) formErrors.slug = "Slug is required.";
  if (Object.values(formErrors).some(Boolean)) {
    saving.value = false;
    return;
  }

  try {
    if (selectedCategory.value) {
      await updateCategory(selectedCategory.value.id, payload);
      toast.success("Category updated", "The category was updated successfully.");
    } else {
      await createCategory(payload);
      toast.success("Category created", "The category was created successfully.");
    }

    modalOpen.value = false;
    selectedCategory.value = null;
    resetForm();
    await fetchCategories(true);
  } catch (error: unknown) {
    const apiError = error as {
      response?: {
        data?: {
          message?: string;
          errors?: Partial<Record<keyof CategoryPayload, string[]>>;
        };
      };
      message?: string;
    };
    errorMessage.value =
      apiError.response?.data?.message || apiError.message || "Failed to save category.";
    for (const key of Object.keys(formErrors) as Array<keyof CategoryPayload>) {
      formErrors[key] = apiError.response?.data?.errors?.[key]?.[0] || "";
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
    const apiError = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    errorMessage.value =
      apiError.response?.data?.message || apiError.message || "Failed to delete category.";
    toast.error("Delete failed", errorMessage.value);
  } finally {
    deleting.value = false;
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
  if (search.value) {
    search.value = "";
    page.value = 1;
    return;
  }

  if (searchTimeout) clearTimeout(searchTimeout);
  page.value = 1;
  void fetchCategories();
};

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(search, () => {
  page.value = 1;
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => fetchCategories(), 350);
});

onMounted(() => fetchCategories());
onBeforeUnmount(() => {
  if (searchTimeout) clearTimeout(searchTimeout);
});
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
        <AppButton v-if="canCreateCategory" @click="openCreate">
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
        :value="totalCategories"
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

    <FilterBar title="Filters" subtitle="Search by category name or slug.">
      <AppInput v-model="search" label="Search" placeholder="Search categories..." />
      <template #actions>
        <AppButton
          variant="secondary"
          @click="resetFilters"
        >
          Reset
        </AppButton>
      </template>
    </FilterBar>

    <DataTable
      :columns="columns"
      :rows="categoryRows"
      :loading="loading && categoryRows.length === 0"
      empty-title="No categories found"
      empty-message="Create your first product category."
    >
      <template #cell-name="{ row }">
        <div class="flex items-center gap-3">
          <AppBadge variant="info" shape="square" size="md">
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
          {{
            categories.find((category) => category.id === row.parent_id)?.name ||
            (row.parent_id ? "Parent category" : "Root category")
          }}
        </span>
      </template>

      <template #cell-status="{ row }">
        <AppBadge :variant="row.is_active === false ? 'default' : 'success'">
          {{ row.is_active === false ? "Inactive" : "Active" }}
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
              visible: canUpdateCategory,
              description: 'Update category information',
            },
            {
              label: 'Delete Category',
              value: 'delete',
              icon: Trash2,
              variant: 'danger',
              visible: canDeleteCategory,
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
      :loading="loading && categoryRows.length === 0"
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
          <AppInput
            v-model="form.slug"
            label="Slug"
            placeholder="kitchen"
            :error="formErrors.slug"
          />
          <label class="block space-y-2 text-sm font-medium text-card-foreground">
            Parent category
            <select
              v-model="form.parent_id"
              class="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            >
              <option :value="null">Root category</option>
              <option v-for="category in parentOptions" :key="category.value" :value="category.value">
                {{ category.label }}
              </option>
            </select>
            <span v-if="formErrors.parent_id" class="text-xs text-destructive">
              {{ formErrors.parent_id }}
            </span>
          </label>
          <AppInput
            v-model="form.image"
            label="Image URL"
            placeholder="https://..."
            :error="formErrors.image"
          />
          <AppInput
            v-model="form.icon"
            label="Icon URL"
            placeholder="https://..."
            :error="formErrors.icon"
          />
          <label class="flex items-center gap-3 text-sm font-medium text-card-foreground">
            <input v-model="form.is_active" type="checkbox" class="h-4 w-4 rounded border-border" />
            Active category
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
        <div class="flex justify-end gap-3 border-t border-border pt-5">
          <AppButton type="button" variant="secondary" :disabled="saving" @click="closeModal">
            Cancel
          </AppButton>
          <AppButton type="submit" :loading="saving">
            {{ selectedCategory ? "Update Category" : "Create Category" }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <ConfirmDialog
      :open="confirmOpen"
      title="Delete Category"
      :message="`Are you sure you want to delete ${confirmCategory?.name || 'this category'}? This action cannot be undone.`"
      confirm-label="Delete Category"
      variant="danger"
      :loading="deleting"
      @close="closeDelete"
      @confirm="confirmDelete"
    />
    <AppRefreshingIndicator :show="refreshing" />
  </div>
</template>

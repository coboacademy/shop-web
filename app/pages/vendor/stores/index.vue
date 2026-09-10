<script setup lang="ts">
import {
  Ban,
  CheckCircle2,
  Eye,
  Pencil,
  Plus,
  RefreshCcw,
  Store as StoreIcon,
  Trash2,
  X,
} from "lucide-vue-next";
import type { CreateStorePayload, Store } from "~/composables/useVendor";

definePageMeta({
  layout: "vendor",
  middleware: ["auth", "permission"],
  permission: "vendor.view",
  title: "Store Management",
});

const { createStore, getStores, deleteStore } = useVendor();
const toast = useToast();

const form = reactive<CreateStorePayload>({
  name: "",
  email: "",
  phone: "",
  description: "",
  country: "",
  province: "",
  city: "",
  address: "",
});
const errors = reactive<Record<keyof CreateStorePayload, string>>({
  name: "",
  email: "",
  phone: "",
  description: "",
  country: "",
  province: "",
  city: "",
  address: "",
});
const generalError = ref("");
const saving = ref(false);
const stores = ref<Store[]>([]);
const loadingStores = ref(false);
const listError = ref("");
const createModalOpen = ref(false);
const editModalOpen = ref(false);
const deleteModalOpen = ref(false);
const deleting = ref(false);
const selectedEditStore = ref<Store | null>(null);
const selectedStore = ref<Store | null>(null);
const search = ref("");
const status = ref("");

const storeColumns = [
  { key: "store", label: "Store" },
  { key: "contact", label: "Contact" },
  { key: "location", label: "Location" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", align: "right" as const },
];

const storeRows = computed(() => {
  const searchTerm = search.value.trim().toLowerCase();

  return stores.value
    .filter((store) => {
      const matchesSearch = !searchTerm || [
        store.name,
        store.slug,
        store.email,
        store.phone,
        store.city,
        store.province,
        store.country,
      ].some((value) => value?.toLowerCase().includes(searchTerm));

      const matchesStatus = !status.value ||
        (status.value === "active" ? store.is_active : !store.is_active);

      return matchesSearch && matchesStatus;
    })
    .map((store) => ({
      ...store,
      store,
      contact: store.email,
      location: [store.city, store.province, store.country].filter(Boolean).join(", "),
      status: store.is_active ? "Active" : "Inactive",
    }));
});

const totalStores = computed(() => stores.value.length);
const activeStoreCount = computed(() => stores.value.filter((store) => store.is_active).length);
const inactiveStoreCount = computed(() => totalStores.value - activeStoreCount.value);

const fetchStores = async () => {
  loadingStores.value = true;
  listError.value = "";

  try {
    const response = await getStores();
    stores.value = response.data.stores || [];
  } catch (error: any) {
    listError.value = error.message || "Failed to load stores";
    toast.error("Stores failed", listError.value);
  } finally {
    loadingStores.value = false;
  }
};

const clearErrors = () => {
  generalError.value = "";
  Object.keys(errors).forEach((key) => {
    errors[key as keyof CreateStorePayload] = "";
  });
};

const openCreateModal = () => {
  clearErrors();
  createModalOpen.value = true;
};

const closeCreateModal = () => {
  if (saving.value) return;

  createModalOpen.value = false;
};

const handleCreateStore = async () => {
  clearErrors();
  saving.value = true;

  try {
    const response = await createStore({ ...form });
    await fetchStores();
    toast.success("Store created", response.message || "Your store was created successfully.");
    createModalOpen.value = false;
  } catch (error: any) {
    generalError.value = error.message || "Store creation failed";

    Object.entries(error.errors || {}).forEach(([key, value]) => {
      if (key in errors) {
        errors[key as keyof CreateStorePayload] = Array.isArray(value)
          ? String(value[0] || "")
          : String(value || "");
      }
    });

    toast.error("Store creation failed", generalError.value);
  } finally {
    saving.value = false;
  }
};

const openDeleteModal = (store: Store) => {
  selectedStore.value = store;
  deleteModalOpen.value = true;
};

const openEditModal = (store: Store) => {
  selectedEditStore.value = store;
  editModalOpen.value = true;
};

const closeEditModal = () => {
  editModalOpen.value = false;
  selectedEditStore.value = null;
};

const handleStoreUpdated = async (updatedStore: Store) => {
  stores.value = stores.value.map((store) =>
    store.id === updatedStore.id ? updatedStore : store
  );
  closeEditModal();
};

const closeDeleteModal = () => {
  if (deleting.value) return;

  deleteModalOpen.value = false;
  selectedStore.value = null;
};

const handleDeleteStore = async () => {
  if (!selectedStore.value) return;

  deleting.value = true;

  try {
    const response = await deleteStore(selectedStore.value.id);
    stores.value = stores.value.filter((store) => store.id !== selectedStore.value?.id);
    toast.success("Store deleted", response.message || "The store was deleted successfully.");
    closeDeleteModal();
  } catch (error: any) {
    toast.error("Delete failed", error.message || "Failed to delete store");
  } finally {
    deleting.value = false;
  }
};

const handleStoreAction = (store: Store, action: string) => {
  if (action === "edit") {
    return openEditModal(store);
  }

  if (action === "delete") {
    openDeleteModal(store);
  }
};

const resetFilters = () => {
  search.value = "";
  status.value = "";
};

onMounted(fetchStores);
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Store management"
      subtitle="View, create, edit, and remove the stores connected to your vendor account."
    >
      <template #actions>
        <AppButton variant="primary" @click="openCreateModal">
          <Plus class="h-4 w-4" />
          Add new store
        </AppButton>
        <AppButton variant="secondary" :loading="loadingStores" @click="fetchStores">
          <RefreshCcw class="h-4 w-4" />
          Refresh
        </AppButton>
      </template>
    </PageHeader>

    <AlertMessage
      v-if="listError"
      type="error"
      title="Unable to load stores"
      :message="listError"
    />

    <div class="grid gap-4 sm:grid-cols-3">
      <StatsCard title="Total Stores" :value="totalStores" subtitle="All vendor storefronts" tone="info">
        <template #badge>
          <AppBadge variant="info" shape="square" size="md">
            <StoreIcon class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard title="Active Stores" :value="activeStoreCount" subtitle="Currently available" tone="success">
        <template #badge>
          <AppBadge variant="success" shape="square" size="md">
            <CheckCircle2 class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard title="Inactive Stores" :value="inactiveStoreCount" subtitle="Need attention" tone="default">
        <template #badge>
          <AppBadge variant="default" shape="square" size="md">
            <Ban class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>
    </div>

    <FilterBar title="Filters" subtitle="Search and filter your vendor stores.">
      <AppInput
        v-model="search"
        label="Search"
        placeholder="Search by name, email, or location..."
      />

      <AppSelect
        v-model="status"
        label="Status"
        placeholder="All Status"
        :options="[
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ]"
      />

      <template #actions>
        <AppButton variant="secondary" @click="resetFilters">Reset</AppButton>
      </template>
    </FilterBar>

    <DataTable
      :columns="storeColumns"
      :rows="storeRows"
      :loading="loadingStores"
      empty-title="No stores yet"
      empty-message="Try changing your filters or add a new store."
    >
      <template #cell-store="{ row }">
        <div class="min-w-52">
          <p class="font-semibold text-card-foreground">{{ row.store.name }}</p>
          <p class="mt-1 text-xs text-muted-foreground">{{ row.store.slug }}</p>
        </div>
      </template>
      <template #cell-contact="{ row }">
        <div>
          <p class="font-medium text-card-foreground">{{ row.store.email }}</p>
          <p class="mt-1 text-xs text-muted-foreground">{{ row.store.phone }}</p>
        </div>
      </template>
      <template #cell-location="{ row }">
        <span class="whitespace-normal">{{ row.location || "-" }}</span>
      </template>
      <template #cell-status="{ row }">
        <AppBadge :variant="row.store.is_active ? 'success' : 'default'">
          {{ row.status }}
        </AppBadge>
      </template>
      <template #cell-actions="{ row }">
        <div class="flex items-center justify-end gap-2">
          <a
            :href="`/vendor/stores/${encodeURIComponent(row.store.id)}`"
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm hover:bg-muted hover:text-card-foreground"
            aria-label="View store"
            title="View store"
          >
            <Eye class="h-5 w-5" />
          </a>

          <AppDropdown
            width="w-64"
            :items="[
              { label: 'Edit Store', value: 'edit', icon: Pencil, description: 'Update store information' },
              { label: 'Delete Store', value: 'delete', icon: Trash2, variant: 'danger', description: 'Remove this storefront' },
            ]"
            @select="handleStoreAction(row.store, $event)"
          />
        </div>
      </template>
    </DataTable>

    <AppModal
      :open="createModalOpen"
      title="Add new store"
      subtitle="Create a storefront for your vendor account."
      size="lg"
      @close="closeCreateModal"
    >
      <template #icon><StoreIcon class="h-5 w-5" /></template>
      <AlertMessage
        v-if="generalError"
        type="error"
        title="Store creation failed"
        :message="generalError"
      />

      <form class="space-y-5" @submit.prevent="handleCreateStore">
        <div class="grid gap-5 md:grid-cols-2">
          <AuthInput
            v-model="form.name"
            label="Store name"
            placeholder="Rithy Technology Store"
            :error="errors.name"
            required
          />
          <AuthInput
            v-model="form.email"
            label="Contact email"
            type="email"
            placeholder="store@example.com"
            :error="errors.email"
            required
          />
          <AuthInput
            v-model="form.phone"
            label="Contact phone"
            type="tel"
            placeholder="012345678"
            :error="errors.phone"
            required
          />
          <AuthInput
            v-model="form.country"
            label="Country"
            placeholder="Cambodia"
            :error="errors.country"
            required
          />
          <AuthInput
            v-model="form.province"
            label="Province or state"
            placeholder="Phnom Penh"
            :error="errors.province"
            required
          />
          <AuthInput
            v-model="form.city"
            label="City"
            placeholder="Phnom Penh"
            :error="errors.city"
            required
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Description
          </label>
          <textarea
            v-model="form.description"
            rows="4"
            required
            placeholder="Technology and electronics store"
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
          />
          <p v-if="errors.description" class="mt-2 text-sm text-red-600 dark:text-red-400">
            {{ errors.description }}
          </p>
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Street address
          </label>
          <textarea
            v-model="form.address"
            rows="3"
            required
            placeholder="Street 271"
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
          />
          <p v-if="errors.address" class="mt-2 text-sm text-red-600 dark:text-red-400">
            {{ errors.address }}
          </p>
        </div>

        <div class="flex justify-end gap-3 border-t border-border pt-5">
          <AppButton type="button" variant="secondary" :disabled="saving" @click="closeCreateModal">
            Cancel
          </AppButton>
          <AppButton type="submit" variant="success" :loading="saving">
            <StoreIcon class="h-4 w-4" />
            Create store
          </AppButton>
        </div>
      </form>
    </AppModal>

    <EditStoreModal
      :open="editModalOpen"
      :store="selectedEditStore"
      @close="closeEditModal"
      @updated="handleStoreUpdated"
    />

    <AppModal
      :open="deleteModalOpen"
      title="Delete store"
      subtitle="This action cannot be undone."
      size="sm"
      @close="closeDeleteModal"
    >
      <template #icon><Trash2 class="h-5 w-5" /></template>
      <div class="space-y-5">
        <AlertMessage type="warning" title="Confirm delete">
          Are you sure you want to delete
          <strong>{{ selectedStore?.name || "this store" }}</strong>?
        </AlertMessage>
        <div class="flex justify-end gap-3 border-t border-border pt-5">
          <AppButton variant="secondary" :disabled="deleting" @click="closeDeleteModal">
            <X class="h-4 w-4" />
            Cancel
          </AppButton>
          <AppButton variant="danger" :loading="deleting" @click="handleDeleteStore">
            <Trash2 class="h-4 w-4" />
            Delete store
          </AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

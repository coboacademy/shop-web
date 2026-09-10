<script setup lang="ts">
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ImagePlus,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCcw,
  Store as StoreIcon,
  Trash2,
} from "lucide-vue-next";
import type { Store } from "~/composables/useVendor";

definePageMeta({
  layout: "vendor",
  middleware: ["auth", "permission"],
  permission: "vendor.view",
  title: "Store Details",
});

const route = useRoute();
const { getStore, updateStore, uploadStoreLogo, deleteStoreLogo, uploadStoreCover } = useVendor();
const toast = useToast();

const store = ref<Store | null>(null);
const loading = ref(true);
const saving = ref(false);
const editing = ref(false);
const errorMessage = ref("");
const logoInput = ref<HTMLInputElement | null>(null);
const logoUploading = ref(false);
const logoDeleting = ref(false);
const deleteLogoModalOpen = ref(false);
const coverInput = ref<HTMLInputElement | null>(null);
const coverUploading = ref(false);
const form = reactive({
  name: "",
  phone: "",
  description: "",
});
const formErrors = reactive<Record<keyof typeof form, string>>({
  name: "",
  phone: "",
  description: "",
});

const fillForm = (value: Store) => {
  form.name = value.name;
  form.phone = value.phone;
  form.description = value.description;
};

const clearFormErrors = () => {
  Object.keys(formErrors).forEach((key) => {
    formErrors[key as keyof typeof formErrors] = "";
  });
};

const fetchStore = async () => {
  loading.value = true;
  errorMessage.value = "";

  const storeId = String(route.params.id || "");

  if (!storeId) {
    errorMessage.value = "A store ID is required to load this page.";
    loading.value = false;
    return;
  }

  try {
    const response = await getStore(storeId);
    store.value = response.data.store;
    fillForm(response.data.store);
    editing.value = route.query.edit === "1";
  } catch (error: any) {
    errorMessage.value = error.message || `Failed to load store ${storeId}`;
    toast.error("Store details failed", errorMessage.value);
  } finally {
    loading.value = false;
  }
};

const handleUpdateStore = async () => {
  if (!store.value) return;

  clearFormErrors();
  saving.value = true;

  try {
    const response = await updateStore(String(route.params.id), { ...form });
    store.value = response.data.store;
    fillForm(response.data.store);
    editing.value = false;
    toast.success("Store updated", response.message || "Your store was updated successfully.");
  } catch (error: any) {
    Object.entries(error.errors || {}).forEach(([key, value]) => {
      if (key in formErrors) {
        formErrors[key as keyof typeof formErrors] = Array.isArray(value)
          ? String(value[0] || "")
          : String(value || "");
      }
    });
    toast.error("Store update failed", error.message || "Failed to update store");
  } finally {
    saving.value = false;
  }
};

const logoUrl = computed(() => {
  const logo = store.value?.logo;

  if (!logo) return "";

  if (/^https?:\/\//i.test(logo)) {
    return logo;
  }

  const storagePath = logo
    .replace(/^\/+/, "")
    .replace(/^storage\//i, "");

  return `http://127.0.0.1:8000/storage/${storagePath}`;
});

const coverUrl = computed(() => {
  const cover = store.value?.cover_image;

  if (!cover) return "";

  if (/^https?:\/\//i.test(cover)) {
    return cover;
  }

  const storagePath = cover
    .replace(/^\/+/, "")
    .replace(/^storage\//i, "");

  return `http://127.0.0.1:8000/storage/${storagePath}`;
});

const openLogoPicker = () => {
  logoInput.value?.click();
};

const handleLogoSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file || !store.value) return;

  logoUploading.value = true;

  try {
    const response = await uploadStoreLogo(String(route.params.id), file);
    store.value = response.data.store;
    toast.success("Logo uploaded", response.message || "The store logo was uploaded successfully.");
  } catch (error: any) {
    toast.error("Logo upload failed", error.message || "Failed to upload store logo");
  } finally {
    logoUploading.value = false;
    input.value = "";
  }
};

const handleDeleteLogo = async () => {
  if (!store.value?.logo) return;

  logoDeleting.value = true;

  try {
    const response = await deleteStoreLogo(String(route.params.id));
    store.value = response.data.store;
    deleteLogoModalOpen.value = false;
    toast.success("Logo deleted", response.message || "The store logo was deleted successfully.");
  } catch (error: any) {
    toast.error("Logo deletion failed", error.message || "Failed to delete store logo");
  } finally {
    logoDeleting.value = false;
  }
};

const openCoverPicker = () => {
  coverInput.value?.click();
};

const handleCoverSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file || !store.value) return;

  coverUploading.value = true;

  try {
    const response = await uploadStoreCover(String(route.params.id), file);
    store.value = response.data.store;
    toast.success("Cover uploaded", response.message || "The store cover was uploaded successfully.");
  } catch (error: any) {
    toast.error("Cover upload failed", error.message || "Failed to upload store cover");
  } finally {
    coverUploading.value = false;
    input.value = "";
  }
};

const formatDate = (value?: string) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

onMounted(fetchStore);
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Store details"
      subtitle="Review the store information returned by the vendor API."
    >
      <template #actions>
        <AppButton variant="secondary" :loading="loading" @click="fetchStore">
          <RefreshCcw class="h-4 w-4" />
          Refresh
        </AppButton>
        <NuxtLink
          to="/vendor/stores"
          class="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground shadow-sm hover:bg-muted"
        >
          <ArrowLeft class="h-4 w-4" />
          Store management
        </NuxtLink>
      </template>
    </PageHeader>

    <AlertMessage
      v-if="errorMessage"
      type="error"
      title="Unable to load store"
      :message="errorMessage"
    />

    <div v-if="loading" class="grid gap-4 md:grid-cols-2">
      <div v-for="item in 6" :key="item" class="h-24 animate-pulse rounded-2xl bg-muted" />
    </div>

    <template v-else-if="store">
      <AppCard :title="store.name" :subtitle="store.slug">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3">
          <AppBadge :variant="store.is_active ? 'success' : 'default'">
            <CheckCircle2 class="mr-1 h-3.5 w-3.5" />
            {{ store.is_active ? "Active" : "Inactive" }}
          </AppBadge>
          <span class="max-w-full truncate text-sm text-muted-foreground">ID: {{ store.id }}</span>
          </div>
          <AppButton variant="secondary" @click="editing = !editing">
            <Pencil class="h-4 w-4" />
            {{ editing ? "Cancel" : "Edit store" }}
          </AppButton>
        </div>
      </AppCard>

      <AppCard title="Store logo" subtitle="Upload a square image to represent your storefront.">
        <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted text-muted-foreground">
              <img
                v-if="logoUrl"
                :src="logoUrl"
                :alt="`${store.name} logo`"
                class="h-full w-full object-cover"
              />
              <StoreIcon v-else class="h-9 w-9" />
            </div>
            <div>
              <p class="font-semibold text-card-foreground">{{ store.logo ? "Logo uploaded" : "No logo uploaded" }}</p>
              <p class="mt-1 text-sm text-muted-foreground">PNG, JPG, or WEBP image</p>
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <input
              ref="logoInput"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              class="hidden"
              @change="handleLogoSelected"
            />
            <AppButton variant="secondary" :loading="logoUploading" @click="openLogoPicker">
              <ImagePlus class="h-4 w-4" />
              {{ store.logo ? "Change logo" : "Upload logo" }}
            </AppButton>
            <AppButton
              v-if="store.logo"
              variant="danger"
              :loading="logoDeleting"
              @click="deleteLogoModalOpen = true"
            >
              <Trash2 class="h-4 w-4" />
              Delete logo
            </AppButton>
          </div>
        </div>
      </AppCard>

      <AppCard title="Store cover" subtitle="Upload a wide image for the storefront header.">
        <div class="space-y-5">
          <div class="flex aspect-3/1 w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted text-muted-foreground">
            <img
              v-if="coverUrl"
              :src="coverUrl"
              :alt="`${store.name} cover`"
              class="h-full w-full object-cover"
            />
            <div v-else class="flex flex-col items-center gap-2 text-sm">
              <StoreIcon class="h-8 w-8" />
              <span>No cover uploaded</span>
            </div>
          </div>

          <div class="flex justify-end">
            <input
              ref="coverInput"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              class="hidden"
              @change="handleCoverSelected"
            />
            <AppButton variant="secondary" :loading="coverUploading" @click="openCoverPicker">
              <ImagePlus class="h-4 w-4" />
              {{ store.cover_image ? "Change cover" : "Upload cover" }}
            </AppButton>
          </div>
        </div>
      </AppCard>

      <AppCard v-if="editing" title="Update store" subtitle="Only the fields below will be sent to the update API.">
        <form class="space-y-5" @submit.prevent="handleUpdateStore">
          <AuthInput v-model="form.name" label="Store name" :error="formErrors.name" required />
          <AuthInput v-model="form.phone" label="Contact phone" type="tel" :error="formErrors.phone" required />
          <div>
            <label class="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              v-model="form.description"
              rows="4"
              required
              class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-950"
            />
            <p v-if="formErrors.description" class="mt-2 text-sm text-red-600 dark:text-red-400">
              {{ formErrors.description }}
            </p>
          </div>
          <div class="flex justify-end border-t border-border pt-5">
            <AppButton type="submit" variant="success" :loading="saving">
              Save changes
            </AppButton>
          </div>
        </form>
      </AppCard>

      <div class="grid gap-4 md:grid-cols-2">
        <AppCard title="Contact information">
          <div class="space-y-4 text-sm">
            <div class="flex items-center gap-3 text-muted-foreground">
              <Mail class="h-4 w-4 shrink-0" />
              <span>{{ store.email }}</span>
            </div>
            <div class="flex items-center gap-3 text-muted-foreground">
              <Phone class="h-4 w-4 shrink-0" />
              <span>{{ store.phone }}</span>
            </div>
            <div class="flex items-start gap-3 text-muted-foreground">
              <MapPin class="mt-0.5 h-4 w-4 shrink-0" />
              <span>{{ [store.address, store.city, store.province, store.country].filter(Boolean).join(", ") }}</span>
            </div>
          </div>
        </AppCard>

        <AppCard title="About this store">
          <div class="flex items-start gap-3">
            <StoreIcon class="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <p class="text-sm leading-6 text-muted-foreground">{{ store.description }}</p>
          </div>
        </AppCard>
      </div>

      <AppCard title="Store information" subtitle="Location and record details">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-2xl border border-border bg-muted/40 p-4">
            <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <MapPin class="h-4 w-4" />
              Country
            </div>
            <p class="mt-3 text-sm font-semibold text-card-foreground">{{ store.country || "-" }}</p>
          </div>

          <div class="rounded-2xl border border-border bg-muted/40 p-4">
            <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Province</p>
            <p class="mt-3 text-sm font-semibold text-card-foreground">{{ store.province || "-" }}</p>
          </div>

          <div class="rounded-2xl border border-border bg-muted/40 p-4">
            <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">City</p>
            <p class="mt-3 text-sm font-semibold text-card-foreground">{{ store.city || "-" }}</p>
          </div>

          <div class="rounded-2xl border border-border bg-muted/40 p-4">
            <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Clock3 class="h-4 w-4" />
              Created
            </div>
            <p class="mt-3 text-sm font-semibold text-card-foreground">{{ formatDate(store.created_at) }}</p>
          </div>
        </div>

        <div class="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4">
          <MapPin class="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Street address</p>
            <p class="mt-2 text-sm font-semibold text-card-foreground">{{ store.address || "-" }}</p>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          <Clock3 class="h-4 w-4" />
          <span>Last updated {{ formatDate(store.updated_at) }}</span>
        </div>
      </AppCard>
    </template>

    <AppModal
      :open="deleteLogoModalOpen"
      title="Delete store logo"
      subtitle="This will remove the current logo from the store."
      size="sm"
      @close="deleteLogoModalOpen = false"
    >
      <template #icon><Trash2 class="h-5 w-5" /></template>
      <div class="space-y-5">
        <AlertMessage type="warning" title="Confirm delete">
          Are you sure you want to delete the logo for <strong>{{ store?.name }}</strong>?
        </AlertMessage>
        <div class="flex justify-end gap-3 border-t border-border pt-5">
          <AppButton variant="secondary" :disabled="logoDeleting" @click="deleteLogoModalOpen = false">
            Cancel
          </AppButton>
          <AppButton variant="danger" :loading="logoDeleting" @click="handleDeleteLogo">
            <Trash2 class="h-4 w-4" />
            Delete logo
          </AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

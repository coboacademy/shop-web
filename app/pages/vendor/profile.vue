<script setup lang="ts">
import {
  Building2,
  Globe,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  ShieldCheck,
  Store,
} from "lucide-vue-next";

definePageMeta({
  layout: "vendor",
  middleware: ["auth", "permission"],
  permission: "vendor.view",
  title: "Vendor Profile",
});

const { getProfile, updateKyc } = useVendor();
const toast = useToast();
const authStore = useAuthStore();

const loading = ref(false);
const errorMessage = ref("");
const vendor = ref<any>(null);
const saving = ref(false);
const editing = ref(false);
const form = reactive({
  business_name: "",
  phone: "",
  description: "",
  website: "",
  country: "",
  province: "",
  city: "",
  address: "",
});
const formErrors = reactive<Record<string, string>>({});

const initials = computed(() => {
  const name = vendor.value?.business_name || authStore.user?.name || "Vendor";

  return name
    .split(" ")
    .map((part: string) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
});

const statusVariant = computed(() => {
  const status = (vendor.value?.status || "pending").toLowerCase();

  if (status === "approved" || status === "active") return "success";
  if (status === "pending") return "warning";
  return "default";
});

const fillForm = (profile: any) => {
  Object.keys(form).forEach((key) => {
    form[key as keyof typeof form] = profile?.[key] || "";
  });
};

const fetchProfile = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await getProfile();
    vendor.value = response.data.vendor;
    fillForm(vendor.value);
  } catch (error: any) {
    errorMessage.value =
      error.response?.data?.message || error.message || "Failed to load vendor profile";
    toast.error("Vendor profile failed", errorMessage.value);
  } finally {
    loading.value = false;
  }
};

const handleUpdate = async () => {
  saving.value = true;
  Object.keys(formErrors).forEach((key) => delete formErrors[key]);

  try {
    const response = await updateKyc({ ...form });
    vendor.value = response.data.vendor;
    fillForm(vendor.value);
    editing.value = false;
    toast.success("KYC updated", "Your vendor information was updated successfully.");
  } catch (error: any) {
    const validationErrors = error.errors || {};
    Object.keys(validationErrors).forEach((key) => {
      formErrors[key] = validationErrors[key]?.[0] || "";
    });
    toast.error("Update failed", error.message || "Failed to update vendor information");
  } finally {
    saving.value = false;
  }
};

const detailRows = computed(() => [
  {
    label: "Business name",
    value: vendor.value?.business_name || "-",
    icon: Store,
  },
  {
    label: "Email",
    value: vendor.value?.email || "-",
    icon: Mail,
  },
  {
    label: "Phone",
    value: vendor.value?.phone || "-",
    icon: Phone,
  },
  {
    label: "Website",
    value: vendor.value?.website || "-",
    icon: Globe,
  },
  {
    label: "Location",
    value:
      [vendor.value?.country, vendor.value?.province, vendor.value?.city]
        .filter(Boolean)
        .join(", ") || "-",
    icon: MapPin,
  },
  {
    label: "Address",
    value: vendor.value?.address || "-",
    icon: Building2,
  },
]);

onMounted(async () => {
  await fetchProfile();
});
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Vendor Profile"
      subtitle="Manage your vendor account, business information, and verification status."
    >
      <template #actions>
        <AppButton variant="secondary" :loading="loading" @click="fetchProfile">
          <RefreshCcw class="h-4 w-4" />
          Refresh
        </AppButton>
        <AppButton v-if="vendor" variant="primary" @click="editing = !editing">
          {{ editing ? "Cancel" : "Manage KYC" }}
        </AppButton>
      </template>
    </PageHeader>

    <AlertMessage
      v-if="errorMessage"
      type="error"
      title="Vendor profile error"
      :message="errorMessage"
    />

    <template v-if="loading">
      <div class="grid gap-6 lg:grid-cols-3">
        <div class="rounded-3xl border border-border bg-card p-6 shadow-sm lg:col-span-1">
          <div class="mx-auto h-24 w-24 animate-pulse rounded-3xl bg-muted" />
          <div class="mx-auto mt-5 h-5 w-36 animate-pulse rounded-full bg-muted" />
          <div class="mx-auto mt-3 h-4 w-48 animate-pulse rounded-full bg-muted" />
        </div>

        <div class="rounded-3xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <div class="h-5 w-44 animate-pulse rounded-full bg-muted" />
          <div class="mt-6 grid gap-5 md:grid-cols-2">
            <div class="h-12 animate-pulse rounded-2xl bg-muted" />
            <div class="h-12 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="grid gap-6 lg:grid-cols-3">
        <AppCard class="lg:col-span-1">
          <div class="flex flex-col items-center text-center">
            <div
              class="flex h-24 w-24 items-center justify-center rounded-3xl bg-foreground text-3xl font-black text-background shadow-lg shadow-slate-900/10"
            >
              {{ initials }}
            </div>

            <h2 class="mt-5 text-xl font-bold text-card-foreground">
              {{ vendor?.business_name || "Vendor" }}
            </h2>

            <div class="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Mail class="h-4 w-4" />
              <span class="max-w-[220px] truncate">
                {{ vendor?.email || "-" }}
              </span>
            </div>

            <div class="mt-5 flex flex-wrap justify-center gap-2">
              <AppBadge :variant="statusVariant as any">
                {{ (vendor?.status || "pending").toUpperCase() }}
              </AppBadge>
              <AppBadge variant="info">
                <ShieldCheck class="mr-1 h-3.5 w-3.5" />
                Vendor
              </AppBadge>
            </div>
          </div>
        </AppCard>

        <AppCard class="lg:col-span-2" title="Business Information" subtitle="Current vendor details from the API.">
          <form v-if="editing" class="space-y-5" @submit.prevent="handleUpdate">
            <div class="grid gap-5 md:grid-cols-2">
              <AuthInput v-model="form.business_name" label="Business name" :error="formErrors.business_name" required />
              <AuthInput v-model="form.phone" label="Phone number" :error="formErrors.phone" required />
              <AuthInput v-model="form.description" label="Description" :error="formErrors.description" />
              <AuthInput v-model="form.website" label="Website" type="url" :error="formErrors.website" />
              <AuthInput v-model="form.country" label="Country" :error="formErrors.country" required />
              <AuthInput v-model="form.province" label="Province" :error="formErrors.province" required />
              <AuthInput v-model="form.city" label="City" :error="formErrors.city" required />
              <AuthInput v-model="form.address" label="Address" :error="formErrors.address" required />
            </div>
            <div class="flex justify-end border-t border-border pt-5">
              <AppButton type="submit" variant="success" :loading="saving">
                Save KYC
              </AppButton>
            </div>
          </form>

          <div class="grid gap-5 md:grid-cols-2">
            <div
              v-for="row in detailRows"
              :key="row.label"
              class="rounded-2xl border border-border bg-muted/40 p-4"
            >
              <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <component :is="row.icon" class="h-4 w-4" />
                {{ row.label }}
              </div>

              <p class="mt-3 text-sm font-semibold text-card-foreground break-words">
                {{ row.value }}
              </p>
            </div>
          </div>
        </AppCard>
      </div>
    </template>
  </div>
</template>

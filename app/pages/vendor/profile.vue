<script setup lang="ts">
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Globe,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-vue-next";
import type { VendorProfile } from "~/composables/useVendor";

definePageMeta({
  layout: "vendor",
  middleware: ["auth", "permission"],
  permission: "vendor.view",
  title: "Vendor Profile",
});

const { getProfile, updateProfile } = useVendor();
const toast = useToast();
const authStore = useAuthStore();

const loading = ref(false);
const errorMessage = ref("");
const vendor = ref<VendorProfile | null>(null);
const saving = ref(false);
const editing = ref(false);
const form = reactive({
  business_name: "",
  email: "",
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

const statusVariant = computed<"success" | "warning" | "default">(() => {
  const status = (vendor.value?.status || "pending").toLowerCase();

  if (status === "approved" || status === "active") return "success";
  if (status === "pending") return "warning";
  return "default";
});

const fillForm = (profile: VendorProfile) => {
  form.business_name = profile.business_name || "";
  form.email = profile.email || "";
  form.phone = profile.phone || "";
  form.description = profile.description || "";
  form.website = profile.website || "";
  form.country = profile.country || "";
  form.province = profile.province || "";
  form.city = profile.city || "";
  form.address = profile.address || "";
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
    const response = await updateProfile({
      business_name: form.business_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      description: form.description.trim() || null,
      website: form.website.trim() || null,
      country: form.country.trim() || null,
      province: form.province.trim() || null,
      city: form.city.trim() || null,
      address: form.address.trim() || null,
    });
    vendor.value = response.data.vendor;
    fillForm(vendor.value);
    editing.value = false;
    toast.success("Profile updated", response.message || "Your vendor profile was saved.");
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
    label: "Business description",
    value: vendor.value?.description || "-",
    icon: Building2,
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

const cancelEditing = () => {
  if (vendor.value) fillForm(vendor.value);
  Object.keys(formErrors).forEach((key) => delete formErrors[key]);
  errorMessage.value = "";
  editing.value = false;
};

const statusLabel = computed(() => vendor.value?.status || "Unknown");

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
        <AppButton v-if="vendor && !editing" variant="primary" @click="editing = true">
          Edit profile
        </AppButton>
        <AppButton v-if="editing" variant="secondary" :disabled="saving" @click="cancelEditing">
          Cancel
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
      <div class="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.8fr)]">
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
        <AppCard class="overflow-hidden p-0">
          <div class="relative h-32 bg-gradient-to-br from-slate-800 to-slate-600 dark:from-slate-900 dark:to-slate-700">
            <img
              v-if="vendor?.cover_image"
              :src="vendor.cover_image"
              alt="Vendor cover"
              class="h-full w-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/55 to-transparent" />
          </div>
          <div class="px-6 pb-6">
            <div class="-mt-12 flex items-end justify-between gap-3">
              <div class="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-card bg-foreground text-2xl font-black text-background shadow-lg">
                <img
                  v-if="vendor?.logo"
                  :src="vendor.logo"
                  :alt="`${vendor.business_name} logo`"
                  class="h-full w-full object-cover"
                />
                <span v-else>{{ initials }}</span>
              </div>
              <AppBadge :variant="statusVariant" size="md" dot>
                {{ statusLabel }}
              </AppBadge>
            </div>
            <h2 class="mt-4 text-xl font-bold text-card-foreground">
              {{ vendor?.business_name || "Vendor" }}
            </h2>
            <a
              v-if="vendor?.website"
              :href="vendor.website"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-1 inline-flex items-center gap-1 break-all text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              {{ vendor.website }}
              <ArrowUpRight class="h-3.5 w-3.5 shrink-0" />
            </a>
            <p v-else class="mt-1 text-sm text-muted-foreground">Business profile</p>

            <div class="mt-5 space-y-3 border-t border-border pt-5">
              <p class="flex items-start gap-3 text-sm text-muted-foreground">
                <Mail class="mt-0.5 h-4 w-4 shrink-0" />
                <span class="break-all">{{ vendor?.email || "No email provided" }}</span>
              </p>
              <p class="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin class="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {{ [vendor?.city, vendor?.province, vendor?.country].filter(Boolean).join(", ") || "Location not provided" }}
                </span>
              </p>
              <p v-if="vendor?.verified_at" class="flex items-center gap-3 text-sm text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 class="h-4 w-4 shrink-0" />
                Verified {{ new Date(vendor.verified_at).toLocaleDateString() }}
              </p>
              <p v-else class="flex items-center gap-3 text-sm text-muted-foreground">
                <ShieldCheck class="h-4 w-4 shrink-0" />
                Not verified
              </p>
              <p v-if="vendor?.created_at" class="flex items-center gap-3 text-xs text-muted-foreground">
                <UserRound class="h-4 w-4 shrink-0" />
                Profile created {{ new Date(vendor.created_at).toLocaleDateString() }}
              </p>
            </div>
          </div>
        </AppCard>

        <AppCard
          class="lg:col-span-1"
          title="Business information"
          :subtitle="editing ? 'Update your vendor contact and business details.' : 'Details returned by your vendor profile.'"
        >
          <AlertMessage
            v-if="errorMessage && editing"
            class="mb-5"
            type="error"
            :message="errorMessage"
          />
          <form v-if="editing" @submit.prevent="handleUpdate">
            <fieldset :disabled="saving" class="min-w-0 space-y-5">
              <div class="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <AppInput
                v-model="form.business_name"
                label="Business name"
                placeholder="Your registered business name"
                :maxlength="100"
                :error="formErrors.business_name"
                required
              />
              <AppInput
                v-model="form.email"
                label="Business email"
                type="email"
                placeholder="name@example.com"
                :maxlength="255"
                :error="formErrors.email"
                required
              />
              <AppInput
                v-model="form.phone"
                label="Phone number"
                type="tel"
                placeholder="Optional"
                :maxlength="30"
                :error="formErrors.phone"
              />
              <AppInput
                v-model="form.website"
                label="Website"
                type="url"
                placeholder="https://example.com"
                :maxlength="255"
                :error="formErrors.website"
              />
              <AppTextarea
                v-model="form.description"
                class="sm:col-span-2"
                label="Description"
                placeholder="Tell customers about your business"
                :maxlength="1000"
                :error="formErrors.description"
                :rows="4"
              />
              <AppInput
                v-model="form.country"
                label="Country"
                placeholder="Optional"
                :maxlength="100"
                :error="formErrors.country"
              />
              <AppInput
                v-model="form.province"
                label="Province / region"
                placeholder="Optional"
                :maxlength="100"
                :error="formErrors.province"
              />
              <AppInput
                v-model="form.city"
                label="City"
                placeholder="Optional"
                :maxlength="100"
                :error="formErrors.city"
              />
              <AppInput
                v-model="form.address"
                label="Address"
                placeholder="Optional"
                :maxlength="255"
                :error="formErrors.address"
              />
              </div>
              <div class="flex justify-end border-t border-border pt-5">
                <AppButton type="submit" variant="primary" :loading="saving">
                  Save changes
                </AppButton>
              </div>
            </fieldset>
          </form>

          <div v-else class="grid gap-3 sm:grid-cols-2">
            <div
              v-for="row in detailRows"
              :key="row.label"
              class="min-w-0 rounded-2xl border border-border bg-muted/30 p-4"
            >
              <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <component :is="row.icon" class="h-4 w-4" />
                {{ row.label }}
              </div>

              <p class="mt-3 break-words text-sm font-semibold text-card-foreground">
                {{ row.value }}
              </p>
            </div>
          </div>
        </AppCard>
      </div>
    </template>
  </div>
</template>

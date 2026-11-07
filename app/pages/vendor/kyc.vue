<script setup lang="ts">
import type { VendorProfile } from "~/composables/useVendor";

definePageMeta({
  layout: "vendor",
  middleware: ["auth", "permission"],
  permission: "vendor.view",
  title: "Vendor KYC",
});

const toast = useToast();
const { getProfile, submitKyc, updateKyc } = useVendor();

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

const vendor = ref<VendorProfile | null>(null);
const loadingProfile = ref(false);
const submitting = ref(false);
const generalError = ref("");
const errors = reactive<Record<string, string>>({
  business_name: "",
  phone: "",
  description: "",
  website: "",
  country: "",
  province: "",
  city: "",
  address: "",
});

const vendorStatus = computed(() => String(vendor.value?.status ?? "").trim().toLowerCase());
const isResubmission = computed(() => vendorStatus.value === "rejected");
const canSubmit = computed(() => !vendor.value || isResubmission.value);
const pageTitle = computed(() =>
  isResubmission.value ? "Review and resubmit your vendor KYC" : "Submit your vendor KYC",
);
const pageSubtitle = computed(() =>
  isResubmission.value
    ? "Your application was rejected. Update the details below and submit again for review."
    : "Complete your business details so your vendor account can be reviewed.",
);
const submitLabel = computed(() => (isResubmission.value ? "Resubmit KYC" : "Submit KYC"));

const clearErrors = () => {
  generalError.value = "";
  Object.keys(errors).forEach((key) => {
    errors[key] = "";
  });
};

const fillForm = (profile: VendorProfile) => {
  form.business_name = profile.business_name || "";
  form.phone = profile.phone || "";
  form.description = profile.description || "";
  form.website = profile.website || "";
  form.country = profile.country || "";
  form.province = profile.province || "";
  form.city = profile.city || "";
  form.address = profile.address || "";
};

const fetchVendorProfile = async () => {
  loadingProfile.value = true;

  try {
    const response = await getProfile();
    vendor.value = response.data.vendor;

    if (vendor.value) {
      fillForm(vendor.value);
    }
  } catch (error: any) {
    if (error.status !== 404) {
      toast.error("Vendor profile failed", error.message || "Could not load your vendor profile.");
    }
    vendor.value = null;
  } finally {
    loadingProfile.value = false;
  }
};

const handleKyc = async () => {
  clearErrors();

  if (!canSubmit.value) {
    toast.warning(
      "Application already in review",
      "Your KYC is already being reviewed or has already been approved.",
    );
    return;
  }

  submitting.value = true;

  try {
    const payload = {
      business_name: form.business_name.trim(),
      phone: form.phone.trim(),
      description: form.description.trim() || null,
      website: form.website.trim() || null,
      country: form.country.trim(),
      province: form.province.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
    };

    const response = isResubmission.value ? await updateKyc(payload) : await submitKyc(payload);
    vendor.value = response.data.vendor;
    fillForm(vendor.value);
    await navigateTo("/vendor/dashboard");
  } catch (error: any) {
    generalError.value = error.message || "Vendor KYC submission failed";

    const validationErrors = error.errors || {};
    Object.keys(validationErrors).forEach((key) => {
      errors[key] = validationErrors[key]?.[0] || "";
    });
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  fetchVendorProfile();
});
</script>

<template>
  <AuthCard :title="pageTitle" :subtitle="pageSubtitle">
    <AlertMessage
      v-if="vendor && vendorStatus && ['pending', 'approved', 'suspended'].includes(vendorStatus)"
      type="info"
      :title="vendorStatus === 'pending' ? 'Application under review' : vendorStatus === 'approved' ? 'Vendor account active' : 'Vendor account suspended'"
      :message="vendorStatus === 'pending'
        ? 'Your KYC has already been submitted and is currently pending review.'
        : vendorStatus === 'approved'
          ? 'Your vendor profile has already been approved. You can manage your profile and storefront from the dashboard.'
          : 'Your vendor account has been suspended. Please use the dashboard notifications for additional guidance.'"
    >
      <div class="mt-3 flex flex-wrap gap-3">
        <NuxtLink
          to="/vendor/dashboard"
          class="inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          Back to dashboard
        </NuxtLink>
      </div>
    </AlertMessage>

    <div
      v-if="generalError"
      class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
    >
      {{ generalError }}
    </div>

    <form v-if="canSubmit" class="space-y-5" @submit.prevent="handleKyc">
      <AuthInput
        v-model="form.business_name"
        label="Business name"
        type="text"
        placeholder="Rithy Technology"
        :error="errors.business_name"
        required
      />

      <AuthInput
        v-model="form.phone"
        label="Phone number"
        type="tel"
        placeholder="012345678"
        :error="errors.phone"
        required
      />

      <AuthInput
        v-model="form.description"
        label="Description"
        type="text"
        placeholder="Technology Store"
        :error="errors.description"
      />

      <AuthInput
        v-model="form.website"
        label="Website"
        type="url"
        placeholder="https://example.com"
        :error="errors.website"
      />

      <div class="grid gap-5 md:grid-cols-2">
        <AuthInput
          v-model="form.country"
          label="Country"
          type="text"
          placeholder="Cambodia"
          :error="errors.country"
          required
        />

        <AuthInput
          v-model="form.province"
          label="Province"
          type="text"
          placeholder="Phnom Penh"
          :error="errors.province"
          required
        />
      </div>

      <div class="grid gap-5 md:grid-cols-2">
        <AuthInput
          v-model="form.city"
          label="City"
          type="text"
          placeholder="Phnom Penh"
          :error="errors.city"
          required
        />

        <AuthInput
          v-model="form.address"
          label="Address"
          type="text"
          placeholder="Street 271"
          :error="errors.address"
          required
        />
      </div>

      <AuthButton :label="submitLabel" :loading="submitting" variant="primary" />
    </form>

    <div v-else class="rounded-2xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
      <p class="font-medium text-card-foreground">This KYC submission is currently locked.</p>
      <p class="mt-2">Use the dashboard to monitor your application status, or return to your profile if you need to review your business information.</p>
      <div class="mt-4 flex flex-wrap gap-3">
        <NuxtLink
          to="/vendor/dashboard"
          class="inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          Go to dashboard
        </NuxtLink>
      </div>
    </div>
  </AuthCard>
</template>

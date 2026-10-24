<script setup lang="ts">
import type {
  AdminVendorDetails,
  VendorProfile,
  VendorPagination,
} from "~/composables/useVendor";
import {
  CheckCircle2,
  Eye,
  RefreshCcw,
  RotateCcw,
  ShieldAlert,
  Store,
  XCircle,
} from "lucide-vue-next";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth", "permission"],
  permission: "vendor.view",
  title: "Vendor Management",
});

const {
  getAdminVendors,
  getAdminVendor,
  approveAdminVendor,
  rejectAdminVendor,
  suspendAdminVendor,
  reactivateAdminVendor,
} = useVendor();
const toast = useToast();
const authStore = useAuthStore();

const vendors = ref<VendorProfile[]>([]);
const pagination = ref<VendorPagination>({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
});

const search = ref("");
const status = ref("");
const country = ref("");
const city = ref("");
const sortBy = ref("created_at");
const sortDirection = ref("desc");
const page = ref(1);
const loading = ref(false);
const errorMessage = ref("");
const selectedVendor = ref<VendorProfile | null>(null);
const vendorDetails = ref<AdminVendorDetails | null>(null);
const detailsOpen = ref(false);
const detailsLoading = ref(false);
const detailsError = ref("");
const reasonOpen = ref(false);
const reasonAction = ref<"reject" | "suspend">("reject");
const reasonText = ref("");
const reasonError = ref("");
const actionLoading = ref(false);
const approvalOpen = ref(false);
const approvalLoading = ref(false);
const approvalAction = ref<"approve" | "reactivate">("approve");

const canApprove = computed(() => authStore.hasPermission("vendors.approve"));
const canReject = computed(() => authStore.hasPermission("vendors.reject"));
const canSuspend = computed(() => authStore.hasPermission("vendors.suspend"));
const canReactivate = computed(() => authStore.hasPermission("vendors.reactivate"));
const approvalConfirmation = computed(() => {
  if (approvalAction.value === "reactivate") {
    return {
      title: "Reactivate vendor",
      message: `Reactivate ${selectedVendor.value?.business_name || "this vendor"}? The vendor will return to approved status.`,
      confirmLabel: "Reactivate vendor",
    };
  }

  return {
    title: "Approve vendor",
    message: `Approve ${selectedVendor.value?.business_name || "this vendor"}? The vendor will be able to participate in the marketplace.`,
    confirmLabel: "Approve vendor",
  };
});

const detailStores = computed(
  () => vendorDetails.value?.stores || vendorDetails.value?.vendor.stores || []
);
const detailStoreCount = computed(
  () =>
    vendorDetails.value?.store_count ??
    vendorDetails.value?.vendor.store_count ??
    vendorDetails.value?.vendor.stores_count ??
    detailStores.value.length
);

const columns = [
  { key: "vendor", label: "Vendor" },
  { key: "location", label: "Location" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Joined" },
  { key: "actions", label: "Actions", align: "right" as const },
];

const fetchVendors = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await getAdminVendors({
      search: search.value.trim() || undefined,
      status: status.value || undefined,
      country: country.value.trim() || undefined,
      city: city.value.trim() || undefined,
      sort_by: sortBy.value,
      sort_direction: sortDirection.value as "asc" | "desc",
      page: page.value,
      per_page: pagination.value.per_page,
    });

    vendors.value = Array.isArray(response.data?.vendors) ? response.data.vendors : [];
    pagination.value = {
      ...pagination.value,
      ...(response.data?.pagination || {}),
    };
    page.value = pagination.value.current_page;
  } catch (error: any) {
    errorMessage.value =
      error.response?.data?.message || error.message || "Failed to load vendors";
    toast.error("Failed to load vendors", errorMessage.value);
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  page.value = 1;
  void fetchVendors();
};

const resetFilters = () => {
  search.value = "";
  status.value = "";
  country.value = "";
  city.value = "";
  sortBy.value = "created_at";
  sortDirection.value = "desc";
  page.value = 1;
  void fetchVendors();
};

const goToPage = (nextPage: number) => {
  page.value = nextPage;
  void fetchVendors();
};

const openVendorDetails = async (vendor: VendorProfile) => {
  selectedVendor.value = vendor;
  vendorDetails.value = null;
  detailsError.value = "";
  detailsOpen.value = true;
  detailsLoading.value = true;

  try {
    vendorDetails.value = await getAdminVendor(vendor.id);
  } catch (error: any) {
    detailsError.value =
      error.response?.data?.message || error.message || "Failed to load vendor details";
  } finally {
    detailsLoading.value = false;
  }
};

const openReasonDialog = (vendor: VendorProfile, action: "reject" | "suspend") => {
  selectedVendor.value = vendor;
  reasonAction.value = action;
  reasonText.value = "";
  reasonError.value = "";
  reasonOpen.value = true;
};

const closeReasonDialog = () => {
  if (actionLoading.value) return;
  reasonOpen.value = false;
  reasonText.value = "";
  reasonError.value = "";
};

const submitReasonAction = async () => {
  const reason = reasonText.value.trim();

  if (reason.length < 5 || reason.length > 1000) {
    reasonError.value = "Enter a reason between 5 and 1000 characters.";
    return;
  }

  if (!selectedVendor.value) return;

  actionLoading.value = true;
  reasonError.value = "";

  try {
    if (reasonAction.value === "reject") {
      await rejectAdminVendor(selectedVendor.value.id, reason);
    } else {
      await suspendAdminVendor(selectedVendor.value.id, reason);
    }

    const actionLabel = reasonAction.value === "reject" ? "rejected" : "suspended";
    toast.success("Vendor status updated", `${selectedVendor.value.business_name} was ${actionLabel}.`);
    reasonOpen.value = false;
    reasonText.value = "";
    await fetchVendors();
  } catch (error: any) {
    reasonError.value =
      error.response?.data?.message || error.message || `Failed to ${reasonAction.value} vendor`;
    toast.error("Vendor action failed", reasonError.value);
  } finally {
    actionLoading.value = false;
  }
};

const confirmVendorStatusAction = async () => {
  if (!selectedVendor.value) return;

  approvalLoading.value = true;

  try {
    const vendorName = selectedVendor.value.business_name;

    if (approvalAction.value === "reactivate") {
      await reactivateAdminVendor(selectedVendor.value.id);
      toast.success("Vendor reactivated", `${vendorName} is now approved.`);
    } else {
      await approveAdminVendor(selectedVendor.value.id);
      toast.success("Vendor approved", `${vendorName} is now approved.`);
    }

    approvalOpen.value = false;
    await fetchVendors();
  } catch (error: any) {
    toast.error(
      "Approval failed",
      error.response?.data?.message || error.message || "Failed to approve vendor"
    );
  } finally {
    approvalLoading.value = false;
  }
};

const handleVendorAction = (vendor: VendorProfile, action: string) => {
  if (action === "details") {
    void openVendorDetails(vendor);
  } else if (action === "approve" || action === "reactivate") {
    selectedVendor.value = vendor;
    approvalAction.value = action;
    approvalOpen.value = true;
  } else if (action === "reject" || action === "suspend") {
    openReasonDialog(vendor, action);
  }
};

onMounted(() => {
  void fetchVendors();
});
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Vendor Management"
      subtitle="Review marketplace vendors and their current status."
    >
      <template #actions>
        <AppButton variant="secondary" :disabled="loading" @click="fetchVendors">
          <RefreshCcw class="mr-2 h-4 w-4" />
          Refresh
        </AppButton>
      </template>
    </PageHeader>

    <AlertMessage
      v-if="errorMessage"
      type="error"
      title="Unable to load vendors"
      :message="errorMessage"
    />

    <FilterBar title="Vendor directory" subtitle="Search, filter, and sort vendors.">
      <AppInput v-model="search" label="Search" placeholder="Name, email, or business..." />

      <AppSelect
        v-model="status"
        label="Status"
        placeholder="All statuses"
        :options="[
          { label: 'Pending', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
          { label: 'Suspended', value: 'suspended' },
        ]"
      />

      <AppInput v-model="country" label="Country" placeholder="Filter by country" />
      <AppInput v-model="city" label="City" placeholder="Filter by city" />

      <AppSelect
        v-model="sortBy"
        label="Sort by"
        :options="[
          { label: 'Date joined', value: 'created_at' },
          { label: 'Business name', value: 'business_name' },
          { label: 'Status', value: 'status' },
        ]"
      />

      <AppSelect
        v-model="sortDirection"
        label="Direction"
        :options="[
          { label: 'Newest first', value: 'desc' },
          { label: 'Oldest first', value: 'asc' },
        ]"
      />

      <template #actions>
        <AppButton variant="secondary" @click="resetFilters">Reset</AppButton>
        <AppButton @click="applyFilters">Apply filters</AppButton>
      </template>
    </FilterBar>

    <DataTable
      :columns="columns"
      :rows="vendors"
      :loading="loading && vendors.length === 0"
      empty-title="No vendors found"
      empty-message="Try changing your search or filter settings."
    >
      <template #cell-vendor="{ row }">
        <div class="flex items-center gap-3">
          <img
            v-if="row.logo"
            :src="row.logo"
            :alt="`${row.business_name} logo`"
            class="h-10 w-10 rounded-md border border-border object-cover"
          />
          <div
            v-else
            class="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground"
          >
            <Store class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-card-foreground">
              {{ row.business_name || "Unnamed vendor" }}
            </p>
            <p class="truncate text-sm text-muted-foreground">
              {{ row.email || row.slug || row.id }}
            </p>
          </div>
        </div>
      </template>

      <template #cell-location="{ row }">
        <span class="text-sm text-muted-foreground">
          {{ [row.city, row.country].filter(Boolean).join(", ") || "Not provided" }}
        </span>
      </template>

      <template #cell-status="{ row }">
        <AppBadge
          :variant="
            row.status === 'approved'
              ? 'success'
              : row.status === 'pending'
                ? 'warning'
                : row.status === 'rejected'
                  ? 'danger'
                  : row.status === 'suspended'
                    ? 'warning'
                    : 'default'
          "
        >
          {{ row.status || "unknown" }}
        </AppBadge>
      </template>

      <template #cell-created_at="{ row }">
        <span class="text-sm text-muted-foreground">{{ row.created_at || "—" }}</span>
      </template>

      <template #cell-actions="{ row }">
        <AppDropdown
          width="w-72"
          :items="[
            {
              label: 'View Vendor Details',
              value: 'details',
              icon: Eye,
              description: 'View account and store information',
            },
            {
              label: 'Approve Vendor',
              value: 'approve',
              icon: CheckCircle2,
              variant: 'success',
              description: 'Approve this pending vendor',
              visible: canApprove && row.status === 'pending',
            },
            {
              label: 'Reject Vendor',
              value: 'reject',
              icon: XCircle,
              variant: 'danger',
              description: 'Reject this pending vendor',
              visible: canReject && row.status === 'pending',
            },
            {
              label: 'Suspend Vendor',
              value: 'suspend',
              icon: ShieldAlert,
              variant: 'warning',
              description: 'Suspend this approved vendor',
              visible: canSuspend && row.status === 'approved',
            },
            {
              label: 'Reactivate Vendor',
              value: 'reactivate',
              icon: RotateCcw,
              variant: 'success',
              description: 'Return this suspended vendor to approved status',
              visible: canReactivate && row.status === 'suspended',
            },
          ]"
          @select="handleVendorAction(row, $event)"
        />
      </template>
    </DataTable>

    <TablePagination
      :current-page="pagination.current_page"
      :last-page="pagination.last_page"
      :total="pagination.total"
      :per-page="pagination.per_page"
      :loading="loading && vendors.length === 0"
      @previous="goToPage(Math.max(1, pagination.current_page - 1))"
      @next="goToPage(Math.min(pagination.last_page, pagination.current_page + 1))"
      @page="goToPage"
      label="vendors"
    />

    <AppModal
      :open="detailsOpen"
      :title="vendorDetails?.vendor.business_name || selectedVendor?.business_name || 'Vendor details'"
      subtitle="Vendor profile, account, and store information."
      size="lg"
      @close="detailsOpen = false"
    >
      <div v-if="detailsLoading" class="space-y-3">
        <div v-for="row in 5" :key="row" class="h-10 animate-pulse rounded-xl bg-muted" />
      </div>
      <AlertMessage
        v-else-if="detailsError"
        type="error"
        title="Unable to load vendor details"
        :message="detailsError"
      />
      <div v-else-if="vendorDetails" class="space-y-6">
        <section class="grid gap-4 sm:grid-cols-2">
          <div>
            <p class="text-xs font-semibold uppercase text-muted-foreground">Status</p>
            <AppBadge class="mt-2">{{ vendorDetails.vendor.status || "unknown" }}</AppBadge>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase text-muted-foreground">Store count</p>
            <p class="mt-2 text-sm font-semibold text-card-foreground">{{ detailStoreCount }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase text-muted-foreground">Business email</p>
            <p class="mt-2 break-all text-sm text-card-foreground">{{ vendorDetails.vendor.email || "Not provided" }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase text-muted-foreground">Phone</p>
            <p class="mt-2 text-sm text-card-foreground">{{ vendorDetails.vendor.phone || "Not provided" }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase text-muted-foreground">Created</p>
            <p class="mt-2 text-sm text-card-foreground">{{ vendorDetails.vendor.created_at || "—" }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase text-muted-foreground">Updated</p>
            <p class="mt-2 text-sm text-card-foreground">{{ vendorDetails.vendor.updated_at || "—" }}</p>
          </div>
        </section>

        <section class="border-t border-border pt-5">
          <h3 class="text-sm font-bold text-card-foreground">Account information</h3>
          <dl class="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt class="text-xs text-muted-foreground">Name</dt>
              <dd class="mt-1 text-sm text-card-foreground">{{ vendorDetails.account?.name || "Not provided" }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">Email</dt>
              <dd class="mt-1 break-all text-sm text-card-foreground">{{ vendorDetails.account?.email || "Not provided" }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">Phone</dt>
              <dd class="mt-1 text-sm text-card-foreground">{{ vendorDetails.account?.phone || "Not provided" }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">Account status</dt>
              <dd class="mt-1 text-sm text-card-foreground">{{ vendorDetails.account?.status || "Not provided" }}</dd>
            </div>
          </dl>
        </section>

        <section class="border-t border-border pt-5">
          <h3 class="text-sm font-bold text-card-foreground">Vendor stores</h3>
          <div v-if="detailStores.length" class="mt-3 divide-y divide-border">
            <div v-for="store in detailStores" :key="store.id" class="py-3 first:pt-0 last:pb-0">
              <p class="text-sm font-semibold text-card-foreground">{{ store.name }}</p>
              <p class="mt-1 text-sm text-muted-foreground">
                {{ [store.city, store.country].filter(Boolean).join(", ") || store.address || "Location not provided" }}
              </p>
            </div>
          </div>
          <p v-else class="mt-3 text-sm text-muted-foreground">No stores listed.</p>
        </section>
      </div>
    </AppModal>

    <AppModal
      :open="reasonOpen"
      :title="reasonAction === 'reject' ? 'Reject vendor' : 'Suspend vendor'"
      :subtitle="`Provide a reason for ${reasonAction === 'reject' ? 'rejecting' : 'suspending'} ${selectedVendor?.business_name || 'this vendor'}.`"
      size="md"
      @close="closeReasonDialog"
    >
      <form class="space-y-4" @submit.prevent="submitReasonAction">
        <div>
          <label for="vendor-action-reason" class="mb-2 block text-sm font-semibold text-card-foreground">
            Reason
          </label>
          <textarea
            id="vendor-action-reason"
            v-model="reasonText"
            maxlength="1000"
            rows="5"
            required
            class="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-card-foreground outline-none placeholder:text-muted-foreground focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-950"
            :aria-invalid="Boolean(reasonError)"
            placeholder="Enter at least 5 characters"
          />
          <p v-if="reasonError" class="mt-2 text-sm font-medium text-rose-600 dark:text-rose-400">
            {{ reasonError }}
          </p>
          <p class="mt-1 text-right text-xs text-muted-foreground">{{ reasonText.length }}/1000</p>
        </div>
        <div class="flex justify-end gap-3 border-t border-border pt-4">
          <AppButton type="button" variant="secondary" :disabled="actionLoading" @click="closeReasonDialog">
            Cancel
          </AppButton>
          <AppButton type="submit" :variant="reasonAction === 'reject' ? 'danger' : 'primary'" :loading="actionLoading">
            {{ reasonAction === "reject" ? "Reject vendor" : "Suspend vendor" }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <ConfirmDialog
      :open="approvalOpen"
      :title="approvalConfirmation.title"
      :message="approvalConfirmation.message"
      :confirm-label="approvalConfirmation.confirmLabel"
      variant="success"
      :loading="approvalLoading"
      @close="approvalOpen = false"
      @confirm="confirmVendorStatusAction"
    />

    <AppRefreshingIndicator :show="loading && vendors.length > 0" />
  </div>
</template>
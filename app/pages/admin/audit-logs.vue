<script setup lang="ts">
import type { AuditLogItem } from "~/composables/useAuditLog";
import { Download, Eye, FileClock, RefreshCcw } from "lucide-vue-next";
import { useAuditLogManagementStore } from "~/stores/system/auditLogStore";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth", "permission"],
  permission: "audit.view",
  title: "Audit Logs",
});

const { exportAuditLogs } = useAuditLog();

const auditLogStore = useAuditLogManagementStore();
const toast = useToast();

const search = ref("");
const moduleFilter = ref("");
const actionFilter = ref("");
const dateFrom = ref("");
const dateTo = ref("");
const page = ref(1);
const perPage = ref(10);

const exporting = ref(false);
const pageErrorMessage = ref("");

const selectedLog = ref<AuditLogItem | null>(null);
const detailsOpen = ref(false);

const logs = computed(() => {
  return Array.isArray(auditLogStore.logs) ? auditLogStore.logs : [];
});

const logCount = computed(() => logs.value.length);

const currentPage = computed(() => auditLogStore.currentPage ?? 1);
const lastPage = computed(() => auditLogStore.lastPage ?? 1);
const totalItems = computed(() => auditLogStore.totalItems ?? 0);

const loading = computed(() => auditLogStore.loading);
const refreshing = computed(() => auditLogStore.refreshing);
const errorMessage = computed(() => auditLogStore.errorMessage || pageErrorMessage.value);

const columns = [
  {
    key: "action",
    label: "Action",
  },
  {
    key: "module",
    label: "Module",
  },
  {
    key: "user",
    label: "User",
  },
  {
    key: "ip_address",
    label: "IP",
  },
  {
    key: "created_at",
    label: "Date",
  },
  {
    key: "actions",
    label: "Details",
    align: "right" as const,
  },
];

const moduleOptions = [
  { label: "Users", value: "users" },
  { label: "Roles", value: "roles" },
  { label: "Permissions", value: "permissions" },
  { label: "Settings", value: "settings" },
  { label: "Profile", value: "profile" },
  { label: "Products", value: "products" },
  { label: "Countries", value: "countries" },
  { label: "Menus", value: "menus" },
];

const actionOptions = [
  { label: "User Created", value: "user.created" },
  { label: "User Updated", value: "user.updated" },
  { label: "User Deleted", value: "user.deleted" },
  { label: "User Status Updated", value: "user.status_updated" },
  { label: "User Verification Resent", value: "user.verification_resent" },

  { label: "Role Created", value: "role.created" },
  { label: "Role Updated", value: "role.updated" },
  { label: "Role Deleted", value: "role.deleted" },
  { label: "Role Permissions Synced", value: "role.permissions.synced" },

  { label: "Permission Created", value: "permission.created" },
  { label: "Permission Updated", value: "permission.updated" },
  { label: "Permission Deleted", value: "permission.deleted" },

  { label: "Product Created", value: "product.created" },
  { label: "Product Updated", value: "product.updated" },
  { label: "Product Deleted", value: "product.deleted" },

  { label: "Country Created", value: "country.created" },
  { label: "Country Updated", value: "country.updated" },
  { label: "Country Deleted", value: "country.deleted" },

  { label: "Menu Created", value: "menu.created" },
  { label: "Menu Updated", value: "menu.updated" },
  { label: "Menu Deleted", value: "menu.deleted" },
  { label: "Menu Reordered", value: "menu.reordered" },

  { label: "Settings Updated", value: "settings.updated" },
  { label: "Profile Updated", value: "profile.updated" },
  { label: "Profile Password Updated", value: "profile.password_updated" },
];

const fetchLogs = async (
  options: {
    force?: boolean;
    silent?: boolean;
  } = {}
) => {
  pageErrorMessage.value = "";

  await auditLogStore.fetchLogs(
    {
      search: search.value || undefined,
      module: moduleFilter.value || undefined,
      action: actionFilter.value || undefined,
      date_from: dateFrom.value || undefined,
      date_to: dateTo.value || undefined,
      page: page.value,
      per_page: perPage.value,
    },
    options
  );

  if (auditLogStore.errorMessage) {
    toast.error("Failed to load audit logs", auditLogStore.errorMessage);
  }
};

const handleRefresh = async () => {
  await fetchLogs({
    force: true,
    silent: true,
  });
};

const resetFilters = async () => {
  search.value = "";
  moduleFilter.value = "";
  actionFilter.value = "";
  dateFrom.value = "";
  dateTo.value = "";
  page.value = 1;

  await fetchLogs();
};

const openDetails = (log: AuditLogItem) => {
  selectedLog.value = log;
  detailsOpen.value = true;
};

const closeDetails = () => {
  selectedLog.value = null;
  detailsOpen.value = false;
};

const handleExport = async () => {
  exporting.value = true;

  try {
    await exportAuditLogs({
      search: search.value || undefined,
      module: moduleFilter.value || undefined,
      action: actionFilter.value || undefined,
      date_from: dateFrom.value || undefined,
      date_to: dateTo.value || undefined,
    });

    toast.success("Export started", "Audit logs CSV has been downloaded.");
  } catch (error: any) {
    toast.error(
      "Export failed",
      error.response?.data?.message || error.message || "Failed to export audit logs"
    );
  } finally {
    exporting.value = false;
  }
};

const goPrevious = async () => {
  if (page.value <= 1) return;

  page.value--;
  await fetchLogs();
};

const goNext = async () => {
  if (page.value >= lastPage.value) return;

  page.value++;
  await fetchLogs();
};

const goToPage = async (targetPage: number) => {
  if (targetPage < 1) return;
  if (targetPage > lastPage.value) return;

  page.value = targetPage;
  await fetchLogs();
};

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

watch(search, () => {
  page.value = 1;

  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(async () => {
    await fetchLogs();
  }, 400);
});

watch([moduleFilter, actionFilter, dateFrom, dateTo], async () => {
  page.value = 1;
  await fetchLogs();
});

onMounted(async () => {
  await fetchLogs({
    silent: auditLogStore.hasData,
  });
});

onBeforeUnmount(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Audit Logs"
      subtitle="Track important RBAC and user management actions."
    >
      <template #actions>
        <AppButton variant="secondary" :loading="exporting" @click="handleExport">
          <Download class="mr-2 h-4 w-4" />
          Export
        </AppButton>

        <AppButton variant="secondary" :loading="refreshing" @click="handleRefresh">
          <RefreshCcw class="mr-2 h-4 w-4" />
          Refresh
        </AppButton>
      </template>
    </PageHeader>

    <AlertMessage
      v-if="errorMessage"
      type="error"
      title="Unable to load audit logs"
      :message="errorMessage"
    />

    <FilterBar
      title="Advanced Filters"
      subtitle="Search by user, module, action, IP address, or date range."
      columns="4"
    >
      <AppInput
        v-model="search"
        label="Search"
        placeholder="Search action, module, user, IP..."
      />

      <AppSelect
        v-model="moduleFilter"
        label="Module"
        placeholder="All Modules"
        :options="moduleOptions"
      />

      <AppSelect
        v-model="actionFilter"
        label="Action"
        placeholder="All Actions"
        :options="actionOptions"
      />

      <AppInput v-model="dateFrom" label="Date From" type="date" />

      <AppInput v-model="dateTo" label="Date To" type="date" />

      <template #actions>
        <AppButton variant="secondary" @click="resetFilters"> Reset </AppButton>

        <AppButton variant="secondary" :loading="refreshing" @click="handleRefresh">
          Refresh
        </AppButton>
      </template>
    </FilterBar>

    <DataTable
      :columns="columns"
      :rows="logs"
      :loading="loading && logCount === 0"
      empty-title="No audit logs found"
      empty-message="RBAC actions will appear here after changes are made."
    >
      <template #cell-action="{ row }">
        <AppBadge variant="default">
          {{ row.action }}
        </AppBadge>
      </template>

      <template #cell-module="{ row }">
        <AppBadge variant="info">
          {{ row.module || "-" }}
        </AppBadge>
      </template>

      <template #cell-user="{ row }">
        <div v-if="row.user">
          <p class="text-sm font-semibold text-card-foreground">
            {{ row.user.name }}
          </p>

          <p class="text-xs text-muted-foreground">
            {{ row.user.email }}
          </p>
        </div>

        <span v-else class="text-sm text-muted-foreground"> System </span>
      </template>

      <template #cell-ip_address="{ row }">
        <code
          class="rounded-lg border border-border bg-muted px-2 py-1 text-xs font-semibold text-card-foreground"
        >
          {{ row.ip_address || "-" }}
        </code>
      </template>

      <template #cell-created_at="{ row }">
        <span class="text-sm text-muted-foreground">
          {{ row.created_at || "—" }}
        </span>
      </template>

      <template #cell-actions="{ row }">
        <AppButton size="sm" variant="secondary" @click="openDetails(row)">
          <Eye class="mr-2 h-4 w-4" />
          View
        </AppButton>
      </template>
    </DataTable>

    <TablePagination
      :current-page="currentPage"
      :last-page="lastPage"
      :total="totalItems"
      :per-page="perPage"
      :loading="loading && logCount === 0"
      @previous="goPrevious"
      @next="goNext"
      @page="goToPage"
      label="audit logs"
    />

    <AppModal
      :open="detailsOpen"
      title="Audit Details"
      :subtitle="selectedLog?.action || ''"
      size="lg"
      @close="closeDetails"
    >
      <template #icon>
        <FileClock class="h-5 w-5" />
      </template>

      <div class="space-y-5">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="rounded-2xl bg-muted/60 p-4">
            <p class="text-xs font-semibold uppercase text-muted-foreground">Module</p>

            <p class="mt-1 text-sm font-semibold text-card-foreground">
              {{ selectedLog?.module || "-" }}
            </p>
          </div>

          <div class="rounded-2xl bg-muted/60 p-4">
            <p class="text-xs font-semibold uppercase text-muted-foreground">
              IP Address
            </p>

            <p class="mt-1 text-sm font-semibold text-card-foreground">
              {{ selectedLog?.ip_address || "-" }}
            </p>
          </div>
        </div>

        <div class="rounded-2xl border border-border p-4">
          <p class="mb-3 text-sm font-bold text-card-foreground">Old Values</p>

          <pre class="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-white">{{
            JSON.stringify(selectedLog?.old_values || {}, null, 2)
          }}</pre>
        </div>

        <div class="rounded-2xl border border-border p-4">
          <p class="mb-3 text-sm font-bold text-card-foreground">New Values</p>

          <pre class="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-white">{{
            JSON.stringify(selectedLog?.new_values || {}, null, 2)
          }}</pre>
        </div>
      </div>
    </AppModal>

    <AppRefreshingIndicator :show="refreshing" />
  </div>
</template>

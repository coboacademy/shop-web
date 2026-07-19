<script setup lang="ts">
import type { RoleItem } from "~/composables/useRole";
import {
  Copy,
  Download,
  FileSpreadsheet,
  KeyRound,
  Pencil,
  Plus,
  RefreshCcw,
  Shield,
  ShieldCheck,
  Trash2,
} from "lucide-vue-next";

import { useRoleManagementStore } from "~/stores/management/roleStore";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth", "permission"],
  permission: "role.view",
  title: "Roles",
});

const { createRole, updateRole, deleteRole, exportRoles } = useRole();

const roleStore = useRoleManagementStore();
const toast = useToast();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const search = ref("");
const guardName = ref("");
const page = ref(1);
const perPage = ref(10);

const saving = ref(false);
const exporting = ref(false);
const pageErrorMessage = ref("");

const modalOpen = ref(false);
const importModalOpen = ref(false);
const cloneModalOpen = ref(false);
const permissionModalOpen = ref(false);

const selectedRole = ref<RoleItem | null>(null);
const selectedCloneRole = ref<RoleItem | null>(null);
const selectedPermissionRole = ref<RoleItem | null>(null);

const form = reactive({
  name: "",
  guard_name: "web",
});

const formErrors = reactive<Record<string, string>>({
  name: "",
  guard_name: "",
});

const roleRows = computed(() => {
  return Array.isArray(roleStore.roles) ? roleStore.roles : [];
});

const roleCount = computed(() => roleRows.value.length);

const currentPage = computed(() => roleStore.currentPage ?? 1);
const lastPage = computed(() => roleStore.lastPage ?? 1);
const totalItems = computed(() => roleStore.totalItems ?? 0);

const totalRoles = computed(() => roleStore.totalRoles ?? 0);
const protectedRoles = computed(() => roleStore.protectedRoles ?? 0);

const loading = computed(() => roleStore.loading);
const refreshing = computed(() => roleStore.refreshing);
const errorMessage = computed(() => roleStore.errorMessage || pageErrorMessage.value);

const canCreateRole = computed(() => {
  return typeof authStore.hasPermission === "function"
    ? authStore.hasPermission("role.create")
    : false;
});

const canUpdateRole = computed(() => {
  return typeof authStore.hasPermission === "function"
    ? authStore.hasPermission("role.update")
    : false;
});

const canDeleteRole = computed(() => {
  return typeof authStore.hasPermission === "function"
    ? authStore.hasPermission("role.delete")
    : false;
});

const columns = [
  { key: "name", label: "Role" },
  { key: "guard_name", label: "Guard" },
  { key: "permissions_count", label: "Permissions" },
  { key: "created_at", label: "Created" },
  { key: "actions", label: "Actions", align: "right" as const },
];

type RoleConfirmAction = "delete" | null;

const confirmOpen = ref(false);
const confirmLoading = ref(false);
const confirmAction = ref<RoleConfirmAction>(null);
const confirmRole = ref<RoleItem | null>(null);

const confirmConfig = computed(() => {
  const roleName = confirmRole.value?.name || "this role";

  if (confirmAction.value === "delete") {
    return {
      title: "Delete Role",
      message: `Are you sure you want to delete ${roleName}? This action cannot be undone.`,
      confirmLabel: "Delete Role",
      variant: "danger" as const,
    };
  }

  return {
    title: "Confirm Action",
    message: "Are you sure you want to continue?",
    confirmLabel: "Confirm",
    variant: "default" as const,
  };
});

const fetchRoles = async (
  options: {
    force?: boolean;
    silent?: boolean;
  } = {}
) => {
  pageErrorMessage.value = "";

  await roleStore.fetchRoles(
    {
      search: search.value || undefined,
      guard_name: guardName.value || undefined,
      page: page.value,
      per_page: perPage.value,
    },
    options
  );

  if (roleStore.errorMessage) {
    toast.error("Failed to load roles", roleStore.errorMessage);
  }
};

const handleRefresh = async () => {
  await fetchRoles({
    force: true,
    silent: true,
  });
};

const resetFormErrors = () => {
  formErrors.name = "";
  formErrors.guard_name = "";
};

const resetForm = () => {
  form.name = "";
  form.guard_name = "web";
  resetFormErrors();
};

const openCreate = () => {
  selectedRole.value = null;
  resetForm();
  modalOpen.value = true;
};

const openEdit = (role: RoleItem) => {
  if (role.is_protected) {
    toast.warning("Protected role", "This system role cannot be edited.");
    return;
  }

  selectedRole.value = role;
  form.name = role.name;
  form.guard_name = role.guard_name || "web";
  resetFormErrors();
  modalOpen.value = true;
};

const closeModal = () => {
  if (saving.value) return;

  modalOpen.value = false;
  selectedRole.value = null;
  resetForm();
};

const saveRole = async () => {
  saving.value = true;
  pageErrorMessage.value = "";
  resetFormErrors();

  try {
    if (selectedRole.value) {
      await updateRole(selectedRole.value.id, {
        name: form.name,
        guard_name: form.guard_name,
      });

      toast.success("Role updated", "Role information was updated successfully.");
    } else {
      await createRole({
        name: form.name,
        guard_name: form.guard_name,
      });

      toast.success("Role created", "New role was created successfully.");
    }

    closeModal();

    await roleStore.invalidateAndRefresh();
    await notificationStore.refreshNotifications();
  } catch (error: any) {
    pageErrorMessage.value =
      error.response?.data?.message || error.message || "Failed to save role";

    toast.error("Save failed", pageErrorMessage.value);

    const errors = error.response?.data?.errors || error.errors;

    if (errors) {
      formErrors.name = errors.name?.[0] || "";
      formErrors.guard_name = errors.guard_name?.[0] || "";
    }
  } finally {
    saving.value = false;
  }
};

const openPermissionModal = (role: RoleItem) => {
  if (role.is_protected) {
    toast.warning(
      "Protected role",
      "This system role permissions cannot be changed manually."
    );
    return;
  }

  selectedPermissionRole.value = role;
  permissionModalOpen.value = true;
};

const closePermissionModal = () => {
  permissionModalOpen.value = false;
  selectedPermissionRole.value = null;
};

const handlePermissionSaved = async () => {
  closePermissionModal();

  await roleStore.invalidateAndRefresh();
  await notificationStore.refreshNotifications();
};

const openImportModal = () => {
  importModalOpen.value = true;
};

const closeImportModal = () => {
  importModalOpen.value = false;
};

const handleImported = async () => {
  closeImportModal();

  await roleStore.invalidateAndRefresh();
  await notificationStore.refreshNotifications();
};

const openClone = (role: RoleItem) => {
  selectedCloneRole.value = role;
  cloneModalOpen.value = true;
};

const closeClone = () => {
  selectedCloneRole.value = null;
  cloneModalOpen.value = false;
};

const handleCloned = async () => {
  closeClone();

  await roleStore.invalidateAndRefresh();
  await notificationStore.refreshNotifications();
};

const openConfirmDialog = (role: RoleItem, action: RoleConfirmAction) => {
  if (role.is_protected) {
    toast.warning("Protected role", "This system role cannot be deleted.");
    return;
  }

  confirmRole.value = role;
  confirmAction.value = action;
  confirmOpen.value = true;
};

const closeConfirmDialog = () => {
  if (confirmLoading.value) return;

  confirmOpen.value = false;
  confirmRole.value = null;
  confirmAction.value = null;
};

const handleConfirmAction = async () => {
  if (!confirmRole.value || !confirmAction.value) return;

  confirmLoading.value = true;
  pageErrorMessage.value = "";

  try {
    if (confirmAction.value === "delete") {
      await deleteRole(confirmRole.value.id);

      toast.success(
        "Role deleted",
        `${confirmRole.value.name} was deleted successfully.`
      );

      await roleStore.invalidateAndRefresh();
      await notificationStore.refreshNotifications();
    }

    closeConfirmDialog();
  } catch (error: any) {
    pageErrorMessage.value =
      error.response?.data?.message || error.message || "Failed to complete action";

    toast.error("Action failed", pageErrorMessage.value);
  } finally {
    confirmLoading.value = false;
  }
};

const handleRoleAction = (role: RoleItem, action: string) => {
  if (action === "edit") {
    openEdit(role);
    return;
  }

  if (action === "permissions") {
    openPermissionModal(role);
    return;
  }

  if (action === "clone") {
    openClone(role);
    return;
  }

  if (action === "delete") {
    openConfirmDialog(role, "delete");
  }
};

const handleExport = async () => {
  exporting.value = true;

  try {
    await exportRoles({
      search: search.value || undefined,
      guard_name: guardName.value || undefined,
    });

    toast.success("Export started", "Roles CSV has been downloaded.");
  } catch (error: any) {
    toast.error("Export failed", error.message || "Failed to export roles");
  } finally {
    exporting.value = false;
  }
};

const resetFilters = async () => {
  search.value = "";
  guardName.value = "";
  page.value = 1;

  await fetchRoles();
};

const goPrevious = async () => {
  if (page.value <= 1) return;

  page.value--;
  await fetchRoles();
};

const goNext = async () => {
  if (page.value >= lastPage.value) return;

  page.value++;
  await fetchRoles();
};

const goToPage = async (targetPage: number) => {
  if (targetPage < 1) return;
  if (targetPage > lastPage.value) return;

  page.value = targetPage;
  await fetchRoles();
};

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

watch(search, () => {
  page.value = 1;

  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(async () => {
    await fetchRoles();
  }, 400);
});

watch(guardName, async () => {
  page.value = 1;
  await fetchRoles();
});

onMounted(async () => {
  await fetchRoles({
    silent: roleStore.hasData,
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
      title="Roles Management"
      subtitle="Manage user roles for your RBAC system."
    >
      <template #actions>
        <AppButton variant="secondary" :loading="refreshing" @click="handleRefresh">
          <RefreshCcw class="mr-2 h-4 w-4" />
          Refresh
        </AppButton>

        <AppButton variant="secondary" :loading="exporting" @click="handleExport">
          <Download class="mr-2 h-4 w-4" />
          Export
        </AppButton>

        <AppButton v-if="canCreateRole" variant="secondary" @click="openImportModal">
          <FileSpreadsheet class="mr-2 h-4 w-4" />
          Import
        </AppButton>

        <AppButton v-if="canCreateRole" @click="openCreate">
          <Plus class="mr-2 h-4 w-4" />
          Add Role
        </AppButton>
      </template>
    </PageHeader>

    <AlertMessage
      v-if="errorMessage"
      type="error"
      title="Unable to load roles"
      :message="errorMessage"
    />

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        title="Total Roles"
        :value="totalRoles"
        subtitle="System access groups"
        tone="info"
      >
        <template #badge>
          <AppBadge variant="info" shape="square" size="md">
            <ShieldCheck class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard
        title="Protected"
        :value="protectedRoles"
        subtitle="System protected roles"
        tone="warning"
      >
        <template #badge>
          <AppBadge variant="warning" shape="square" size="md">
            <Shield class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>
    </div>

    <FilterBar title="Filters" subtitle="Search and filter roles." columns="2">
      <AppInput v-model="search" label="Search" placeholder="Search role..." />

      <AppSelect
        v-model="guardName"
        label="Guard"
        placeholder="All Guards"
        :options="[
          { label: 'Web', value: 'web' },
          { label: 'API', value: 'api' },
        ]"
      />

      <template #actions>
        <AppButton variant="secondary" @click="resetFilters"> Reset </AppButton>
      </template>
    </FilterBar>

    <DataTable
      :columns="columns"
      :rows="roleRows"
      :loading="loading && roleCount === 0"
      empty-title="No roles found"
      empty-message="Create your first role to start managing access."
    >
      <template #cell-name="{ row }">
        <div class="flex items-center gap-3">
          <AppBadge variant="info" shape="square" size="md">
            <ShieldCheck class="h-5 w-5" />
          </AppBadge>

          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <p class="truncate text-sm font-bold text-card-foreground">
                {{ row.name }}
              </p>

              <AppBadge v-if="row.is_protected" variant="warning"> Protected </AppBadge>
            </div>

            <p class="mt-1 text-xs text-muted-foreground">Role access group</p>
          </div>
        </div>
      </template>

      <template #cell-guard_name="{ row }">
        <AppBadge variant="default">
          {{ row.guard_name }}
        </AppBadge>
      </template>

      <template #cell-permissions_count="{ row }">
        <AppBadge variant="info"> {{ row.permissions_count ?? 0 }} permissions </AppBadge>
      </template>

      <template #cell-created_at="{ row }">
        <span class="text-sm text-muted-foreground">
          {{ row.created_at || "—" }}
        </span>
      </template>

      <template #cell-actions="{ row }">
        <AppDropdown
          width="w-72"
          :items="[
            {
              label: 'Edit Role',
              value: 'edit',
              icon: Pencil,
              description: row.is_protected
                ? 'Protected roles cannot be edited'
                : 'Update role information',
              disabled: row.is_protected,
              visible: canUpdateRole,
            },
            {
              label: 'Assign Permissions',
              value: 'permissions',
              icon: KeyRound,
              description: row.is_protected
                ? 'Protected role permissions cannot be changed manually'
                : 'Manage role permissions',
              disabled: row.is_protected,
              visible: canUpdateRole,
            },
            {
              label: 'Clone Role',
              value: 'clone',
              icon: Copy,
              variant: 'success',
              description: 'Duplicate this role',
              visible: canCreateRole,
            },
            {
              label: 'Delete Role',
              value: 'delete',
              icon: Trash2,
              variant: 'danger',
              description: row.is_protected
                ? 'Protected roles cannot be deleted'
                : 'Remove this role',
              disabled: row.is_protected,
              visible: canDeleteRole,
            },
          ]"
          @select="handleRoleAction(row, $event)"
        />
      </template>
    </DataTable>

    <TablePagination
      :current-page="currentPage"
      :last-page="lastPage"
      :total="totalItems"
      :per-page="perPage"
      :loading="loading && roleCount === 0"
      @previous="goPrevious"
      @next="goNext"
      @page="goToPage"
      label="roles"
    />

    <AppModal
      :open="modalOpen"
      :title="selectedRole ? 'Edit Role' : 'Create Role'"
      :subtitle="selectedRole ? 'Update role information.' : 'Create a new access role.'"
      size="sm"
      @close="closeModal"
    >
      <template #icon>
        <ShieldCheck class="h-5 w-5" />
      </template>

      <form class="space-y-5" @submit.prevent="saveRole">
        <AppInput
          v-model="form.name"
          label="Role Name"
          placeholder="Example: Admin"
          :error="formErrors.name"
        />

        <AppInput
          v-model="form.guard_name"
          label="Guard Name"
          placeholder="web"
          :error="formErrors.guard_name"
        />

        <div class="flex justify-end gap-3 border-t border-border pt-5">
          <AppButton
            type="button"
            variant="secondary"
            :disabled="saving"
            @click="closeModal"
          >
            Cancel
          </AppButton>

          <AppButton type="submit" variant="primary" :loading="saving">
            {{ selectedRole ? "Update Role" : "Create Role" }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <AssignRolePermissionsModal
      :open="permissionModalOpen"
      :role="selectedPermissionRole"
      @close="closePermissionModal"
      @saved="handlePermissionSaved"
    />

    <ImportRoleModal
      :open="importModalOpen"
      @close="closeImportModal"
      @imported="handleImported"
    />

    <CloneRoleModal
      :open="cloneModalOpen"
      :role="selectedCloneRole"
      @close="closeClone"
      @cloned="handleCloned"
    />

    <ConfirmDialog
      :open="confirmOpen"
      :title="confirmConfig.title"
      :message="confirmConfig.message"
      :confirm-label="confirmConfig.confirmLabel"
      :variant="confirmConfig.variant"
      :loading="confirmLoading"
      @close="closeConfirmDialog"
      @confirm="handleConfirmAction"
    />

    <AppRefreshingIndicator :show="refreshing" />
  </div>
</template>

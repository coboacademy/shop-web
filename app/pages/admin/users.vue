<script setup lang="ts">
import type { UserItem } from "~/composables/useUser";
import {
  Ban,
  CheckCircle2,
  Download,
  Mail,
  Pencil,
  RefreshCcw,
  ShieldAlert,
  Timer,
  Trash2,
  UserPlus,
  Users,
} from "lucide-vue-next";

import { useUserManagementStore } from "~/stores/management/userStore";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth", "permission"],
  permission: "user.view",
  title: "Users",
});

const { resendUserVerification, updateUserStatus, exportUsers } = useUser();

const userStore = useUserManagementStore();
const toast = useToast();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const search = ref("");
const status = ref("");
const emailVerified = ref("");
const page = ref(1);
const perPage = ref(10);

const exporting = ref(false);
const pageErrorMessage = ref("");

const createModalOpen = ref(false);
const editModalOpen = ref(false);
const deleteModalOpen = ref(false);

const selectedUser = ref<UserItem | null>(null);
const selectedDeleteUser = ref<UserItem | null>(null);

const userRows = computed(() => {
  return Array.isArray(userStore.users) ? userStore.users : [];
});

const userCount = computed(() => userRows.value.length);

const currentPage = computed(() => userStore.currentPage ?? 1);
const lastPage = computed(() => userStore.lastPage ?? 1);
const totalItems = computed(() => userStore.totalItems ?? 0);

const totalUsers = computed(() => userStore.totalUsers ?? 0);
const activeUsers = computed(() => userStore.activeUsers ?? 0);
const pendingUsers = computed(() => userStore.pendingUsers ?? 0);
const inactiveUsers = computed(() => userStore.inactiveUsers ?? 0);
const verifiedUsers = computed(() => userStore.verifiedUsers ?? 0);
const unverifiedUsers = computed(() => userStore.unverifiedUsers ?? 0);

const loading = computed(() => userStore.loading);
const refreshing = computed(() => userStore.refreshing);
const errorMessage = computed(() => userStore.errorMessage || pageErrorMessage.value);

const canCreateUser = computed(() => {
  return typeof authStore.hasPermission === "function"
    ? authStore.hasPermission("user.create")
    : false;
});

const canUpdateUser = computed(() => {
  return typeof authStore.hasPermission === "function"
    ? authStore.hasPermission("user.update")
    : false;
});

const canDeleteUser = computed(() => {
  return typeof authStore.hasPermission === "function"
    ? authStore.hasPermission("user.delete")
    : false;
});

const columns = [
  { key: "user", label: "User" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
  { key: "email_verification", label: "Email" },
  { key: "created_at", label: "Created At" },
  { key: "actions", label: "Actions", align: "right" as const },
];

const fetchUsers = async (
  options: {
    force?: boolean;
    silent?: boolean;
  } = {}
) => {
  pageErrorMessage.value = "";

  await userStore.fetchUsers(
    {
      search: search.value || undefined,
      status: status.value || undefined,
      email_verified: emailVerified.value || undefined,
      page: page.value,
      per_page: perPage.value,
    },
    options
  );

  if (userStore.errorMessage) {
    toast.error("Failed to load users", userStore.errorMessage);
  }
};

const handleRefresh = async () => {
  await fetchUsers({
    force: true,
    silent: true,
  });
};

const openCreateModal = () => {
  createModalOpen.value = true;
};

const closeCreateModal = () => {
  createModalOpen.value = false;
};

const handleCreated = async () => {
  createModalOpen.value = false;

  await userStore.invalidateAndRefresh();
  await notificationStore.refreshNotifications();

  toast.success("User created", "The new user account was created successfully.");
};

const openEditModal = (user: UserItem) => {
  selectedUser.value = user;
  editModalOpen.value = true;
};

const closeEditModal = () => {
  editModalOpen.value = false;
  selectedUser.value = null;
};

const handleUpdated = async () => {
  editModalOpen.value = false;
  selectedUser.value = null;

  await userStore.invalidateAndRefresh();
  await notificationStore.refreshNotifications();

  toast.success("User updated", "User information was updated successfully.");
};

const openDeleteModal = (user: UserItem) => {
  selectedDeleteUser.value = user;
  deleteModalOpen.value = true;
};

const closeDeleteModal = () => {
  deleteModalOpen.value = false;
  selectedDeleteUser.value = null;
};

const handleDeleted = async () => {
  deleteModalOpen.value = false;
  selectedDeleteUser.value = null;

  await userStore.invalidateAndRefresh();
  await notificationStore.refreshNotifications();

  toast.success("User deleted", "The user account was deleted successfully.");
};

const handleResendVerification = async (user: UserItem) => {
  try {
    await resendUserVerification(user.id);

    toast.success("Verification sent", `Verification email was sent to ${user.email}.`);
  } catch (error: any) {
    toast.error(
      "Resend failed",
      error.response?.data?.message ||
        error.message ||
        "Failed to resend verification email"
    );
  }
};

const handleStatusChange = async (
  user: UserItem,
  nextStatus: "active" | "pending" | "suspended" | "blocked"
) => {
  try {
    await updateUserStatus(user.id, nextStatus);

    toast.success("Status updated", `${user.name} is now ${nextStatus}.`);

    await userStore.invalidateAndRefresh();
    await notificationStore.refreshNotifications();
  } catch (error: any) {
    toast.error(
      "Status update failed",
      error.response?.data?.message || error.message || "Failed to update status"
    );
  }
};

type ConfirmAction = "activate" | "pending" | "suspend" | "block" | "delete" | null;

const confirmOpen = ref(false);
const confirmLoading = ref(false);
const confirmAction = ref<ConfirmAction>(null);
const confirmUser = ref<UserItem | null>(null);

const confirmConfig = computed(() => {
  const userName = confirmUser.value?.name || "this user";

  if (confirmAction.value === "activate") {
    return {
      title: "Activate User",
      message: `Are you sure you want to activate ${userName}? This user will be able to access the system.`,
      confirmLabel: "Activate",
      variant: "success" as const,
    };
  }

  if (confirmAction.value === "pending") {
    return {
      title: "Set User as Pending",
      message: `Are you sure you want to set ${userName} as pending?`,
      confirmLabel: "Set Pending",
      variant: "warning" as const,
    };
  }

  if (confirmAction.value === "suspend") {
    return {
      title: "Suspend User",
      message: `Are you sure you want to suspend ${userName}? This will temporarily restrict their account.`,
      confirmLabel: "Suspend",
      variant: "warning" as const,
    };
  }

  if (confirmAction.value === "block") {
    return {
      title: "Block User",
      message: `Are you sure you want to block ${userName}? This user will not be able to access the system.`,
      confirmLabel: "Block",
      variant: "danger" as const,
    };
  }

  if (confirmAction.value === "delete") {
    return {
      title: "Delete User",
      message: `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      confirmLabel: "Delete",
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

const openConfirmDialog = (user: UserItem, action: ConfirmAction) => {
  confirmUser.value = user;
  confirmAction.value = action;
  confirmOpen.value = true;
};

const closeConfirmDialog = () => {
  if (confirmLoading.value) return;

  confirmOpen.value = false;
  confirmUser.value = null;
  confirmAction.value = null;
};

const handleConfirmAction = async () => {
  if (!confirmUser.value || !confirmAction.value) return;

  confirmLoading.value = true;

  try {
    if (confirmAction.value === "activate") {
      await handleStatusChange(confirmUser.value, "active");
    }

    if (confirmAction.value === "pending") {
      await handleStatusChange(confirmUser.value, "pending");
    }

    if (confirmAction.value === "suspend") {
      await handleStatusChange(confirmUser.value, "suspended");
    }

    if (confirmAction.value === "block") {
      await handleStatusChange(confirmUser.value, "blocked");
    }

    if (confirmAction.value === "delete") {
      selectedDeleteUser.value = confirmUser.value;
      confirmOpen.value = false;
      deleteModalOpen.value = true;
      return;
    }

    closeConfirmDialog();
  } finally {
    confirmLoading.value = false;
  }
};

const handleUserAction = async (user: UserItem, action: string) => {
  if (action === "resend-verification") {
    await handleResendVerification(user);
    return;
  }

  if (action === "edit") {
    openEditModal(user);
    return;
  }

  if (
    action === "activate" ||
    action === "pending" ||
    action === "suspend" ||
    action === "block" ||
    action === "delete"
  ) {
    openConfirmDialog(user, action);
  }
};

const handleExport = async () => {
  exporting.value = true;

  try {
    await exportUsers({
      search: search.value || undefined,
      status: status.value || undefined,
      email_verified: emailVerified.value || undefined,
    });

    toast.success("Export started", "Users CSV has been downloaded.");
  } catch (error: any) {
    toast.error(
      "Export failed",
      error.response?.data?.message || error.message || "Failed to export users"
    );
  } finally {
    exporting.value = false;
  }
};

const resetFilters = async () => {
  search.value = "";
  status.value = "";
  emailVerified.value = "";
  page.value = 1;

  await fetchUsers();
};

const goPrevious = async () => {
  if (page.value <= 1) return;

  page.value--;
  await fetchUsers();
};

const goNext = async () => {
  if (page.value >= lastPage.value) return;

  page.value++;
  await fetchUsers();
};

const goToPage = async (targetPage: number) => {
  if (targetPage < 1) return;
  if (targetPage > lastPage.value) return;

  page.value = targetPage;
  await fetchUsers();
};

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

watch(search, () => {
  page.value = 1;

  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(async () => {
    await fetchUsers();
  }, 400);
});

watch([status, emailVerified], async () => {
  page.value = 1;
  await fetchUsers();
});

onMounted(async () => {
  await fetchUsers({
    silent: userStore.hasData,
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
      title="Users Management"
      subtitle="Manage all users, roles, status, and account actions from this page."
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

        <AppButton v-if="canCreateUser" @click="openCreateModal">
          <UserPlus class="mr-2 h-4 w-4" />
          Add New User
        </AppButton>
      </template>
    </PageHeader>

    <AlertMessage
      v-if="errorMessage"
      type="error"
      title="Unable to load users"
      :message="errorMessage"
    />

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        title="Total Users"
        :value="totalUsers"
        subtitle="All registered accounts"
        tone="info"
      >
        <template #badge>
          <AppBadge variant="info" shape="square" size="md">
            <Users class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard
        title="Active Users"
        :value="activeUsers"
        subtitle="Currently active users"
        tone="success"
      >
        <template #badge>
          <AppBadge variant="success" shape="square" size="md">
            <CheckCircle2 class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard
        title="Pending Users"
        :value="pendingUsers"
        subtitle="Waiting for approval"
        tone="warning"
      >
        <template #badge>
          <AppBadge variant="warning" shape="square" size="md">
            <Timer class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard
        title="Inactive Users"
        :value="inactiveUsers"
        subtitle="Disabled or inactive"
        tone="default"
      >
        <template #badge>
          <AppBadge variant="default" shape="square" size="md">
            <Ban class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard
        title="Verified Users"
        :value="verifiedUsers"
        subtitle="Emails verified"
        tone="success"
      >
        <template #badge>
          <AppBadge variant="success" shape="square" size="md">
            <Mail class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard
        title="Unverified Users"
        :value="unverifiedUsers"
        subtitle="Need email verification"
        tone="warning"
      >
        <template #badge>
          <AppBadge variant="warning" shape="square" size="md">
            <ShieldAlert class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>
    </div>

    <FilterBar title="Filters" subtitle="Search and filter user accounts.">
      <AppInput
        v-model="search"
        label="Search"
        placeholder="Search by name or email..."
      />

      <AppSelect
        v-model="status"
        label="Status"
        placeholder="All Status"
        :options="[
          { label: 'Active', value: 'active' },
          { label: 'Pending', value: 'pending' },
          { label: 'Suspended', value: 'suspended' },
          { label: 'Blocked', value: 'blocked' },
        ]"
      />

      <AppSelect
        v-model="emailVerified"
        label="Email Verification"
        placeholder="All"
        :options="[
          { label: 'Verified', value: 'verified' },
          { label: 'Unverified', value: 'unverified' },
        ]"
      />

      <template #actions>
        <AppButton variant="secondary" @click="resetFilters"> Reset </AppButton>
      </template>
    </FilterBar>

    <DataTable
      :columns="columns"
      :rows="userRows"
      :loading="loading && userCount === 0"
      empty-title="No users found"
      empty-message="Try changing your search or filter settings."
    >
      <template #cell-user="{ row }">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-sm font-bold text-background shadow-sm"
          >
            {{ row.name?.charAt(0)?.toUpperCase() || "U" }}
          </div>

          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-card-foreground">
              {{ row.name }}
            </p>

            <p class="truncate text-sm text-muted-foreground">
              {{ row.email }}
            </p>
          </div>
        </div>
      </template>

      <template #cell-role="{ row }">
        <span class="text-sm text-muted-foreground">
          {{ row.role || "No Role" }}
        </span>
      </template>

      <template #cell-status="{ row }">
        <AppBadge
          :variant="
            row.status === 'active'
              ? 'success'
              : row.status === 'pending'
              ? 'warning'
              : row.status === 'suspended'
              ? 'warning'
              : row.status === 'blocked'
              ? 'danger'
              : 'default'
          "
        >
          {{ row.status }}
        </AppBadge>
      </template>

      <template #cell-email_verification="{ row }">
        <AppBadge :variant="row.is_email_verified ? 'success' : 'warning'">
          {{ row.is_email_verified ? "Verified" : "Unverified" }}
        </AppBadge>
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
              label: 'Resend Verification',
              value: 'resend-verification',
              icon: Mail,
              description: 'Send verification email again',
              visible: canUpdateUser && !row.is_email_verified,
            },
            {
              label: 'Activate User',
              value: 'activate',
              icon: CheckCircle2,
              variant: 'success',
              description: 'Allow user access',
              visible: canUpdateUser && row.status !== 'active',
            },
            {
              label: 'Set Pending',
              value: 'pending',
              icon: Timer,
              variant: 'warning',
              description: 'Move user to pending status',
              visible: canUpdateUser && row.status !== 'pending',
            },
            {
              label: 'Suspend User',
              value: 'suspend',
              icon: ShieldAlert,
              variant: 'warning',
              description: 'Temporarily restrict account',
              visible: canUpdateUser && row.status !== 'suspended',
            },
            {
              label: 'Block User',
              value: 'block',
              icon: Ban,
              variant: 'danger',
              description: 'Block this account',
              visible: canUpdateUser && row.status !== 'blocked',
            },
            {
              label: 'Edit User',
              value: 'edit',
              icon: Pencil,
              description: 'Update user information',
              visible: canUpdateUser,
            },
            {
              label: 'Delete User',
              value: 'delete',
              icon: Trash2,
              variant: 'danger',
              description: 'Remove this account',
              visible: canDeleteUser,
            },
          ]"
          @select="handleUserAction(row, $event)"
        />
      </template>
    </DataTable>

    <TablePagination
      :current-page="currentPage"
      :last-page="lastPage"
      :total="totalItems"
      :per-page="perPage"
      :loading="loading && userCount === 0"
      @previous="goPrevious"
      @next="goNext"
      @page="goToPage"
      label="users"
    />

    <CreateUserModal
      :open="createModalOpen"
      :user="null"
      @close="closeCreateModal"
      @created="handleCreated"
    />

    <EditUserModal
      :open="editModalOpen"
      :user="selectedUser"
      @close="closeEditModal"
      @updated="handleUpdated"
    />

    <DeleteUserModal
      :open="deleteModalOpen"
      :user="selectedDeleteUser"
      @close="closeDeleteModal"
      @deleted="handleDeleted"
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

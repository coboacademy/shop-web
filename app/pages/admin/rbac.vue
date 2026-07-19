<script setup lang="ts">
import { KeyRound, RefreshCcw, ShieldCheck, Users, Workflow } from "lucide-vue-next";

import { useRbacManagementStore } from "~/stores/management/rbacStore";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth", "permission"],
  permission: "role.view",
  title: "RBAC",
});

const rbacStore = useRbacManagementStore();
const authStore = useAuthStore();

const loading = computed(() => rbacStore.loading);
const refreshing = computed(() => rbacStore.refreshing);
const errorMessage = computed(() => rbacStore.errorMessage);

const totalUsers = computed(() => rbacStore.totalUsers);
const activeUsers = computed(() => rbacStore.activeUsers);
const inactiveUsers = computed(() => rbacStore.inactiveUsers);
const pendingUsers = computed(() => rbacStore.pendingUsers);
const totalRoles = computed(() => rbacStore.totalRoles);
const totalPermissions = computed(() => rbacStore.totalPermissions);
const totalAssignedPermissions = computed(() => rbacStore.totalAssignedPermissions);

const topRoles = computed(() => {
  return Array.isArray(rbacStore.topRoles) ? rbacStore.topRoles : [];
});

const permissionModules = computed(() => {
  return Array.isArray(rbacStore.permissionModules) ? rbacStore.permissionModules : [];
});

const canViewRoles = computed(() => {
  return typeof authStore.hasPermission === "function"
    ? authStore.hasPermission("role.view")
    : false;
});

const canCreateRole = computed(() => {
  return typeof authStore.hasPermission === "function"
    ? authStore.hasPermission("role.create")
    : false;
});

const canViewPermissions = computed(() => {
  return typeof authStore.hasPermission === "function"
    ? authStore.hasPermission("permission.view")
    : false;
});

const canCreatePermission = computed(() => {
  return typeof authStore.hasPermission === "function"
    ? authStore.hasPermission("permission.create")
    : false;
});

const canCreateUser = computed(() => {
  return typeof authStore.hasPermission === "function"
    ? authStore.hasPermission("user.create")
    : false;
});

const fetchDashboard = async (
  options: {
    force?: boolean;
    silent?: boolean;
  } = {}
) => {
  await rbacStore.fetchRbacDashboard(options);
};

const handleRefresh = async () => {
  await fetchDashboard({
    force: true,
    silent: true,
  });
};

const rolePercent = (count: number) => {
  if (!totalPermissions.value) return 0;

  return Math.min(Math.round((count / totalPermissions.value) * 100), 100);
};

onMounted(async () => {
  await fetchDashboard({
    silent: totalRoles.value > 0,
  });
});
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="RBAC Dashboard"
      subtitle="Overview of users, roles, permissions, and role coverage."
    >
      <template #actions>
        <AppButton variant="secondary" :loading="refreshing" @click="handleRefresh">
          <RefreshCcw class="h-4 w-4" />
          Refresh
        </AppButton>

        <NuxtLink
          v-if="canViewRoles"
          to="/roles"
          class="rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-card-foreground hover:bg-muted"
        >
          Manage Roles
        </NuxtLink>

        <NuxtLink
          v-if="canViewPermissions"
          to="/permissions"
          class="rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background hover:opacity-90"
        >
          Manage Permissions
        </NuxtLink>
      </template>
    </PageHeader>

    <AlertMessage
      v-if="errorMessage"
      type="error"
      title="Unable to load RBAC dashboard"
      :message="errorMessage"
    />

    <PageSkeleton v-if="loading && topRoles.length === 0" />

    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Users"
          :value="totalUsers"
          :subtitle="`${activeUsers} active users`"
          tone="info"
        >
          <template #badge>
            <AppBadge variant="info" shape="square" size="md">
              <Users class="h-5 w-5" />
            </AppBadge>
          </template>
        </StatsCard>

        <StatsCard
          title="Roles"
          :value="totalRoles"
          subtitle="System access groups"
          tone="default"
        >
          <template #badge>
            <AppBadge variant="default" shape="square" size="md">
              <ShieldCheck class="h-5 w-5" />
            </AppBadge>
          </template>
        </StatsCard>

        <StatsCard
          title="Permissions"
          :value="totalPermissions"
          subtitle="Fine-grained controls"
          tone="success"
        >
          <template #badge>
            <AppBadge variant="success" shape="square" size="md">
              <KeyRound class="h-5 w-5" />
            </AppBadge>
          </template>
        </StatsCard>

        <StatsCard
          title="Assigned Permissions"
          :value="totalAssignedPermissions"
          subtitle="Across all roles"
          tone="warning"
        >
          <template #badge>
            <AppBadge variant="warning" shape="square" size="md">
              <Workflow class="h-5 w-5" />
            </AppBadge>
          </template>
        </StatsCard>
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <AppCard title="User Status" subtitle="Account status summary.">
          <div class="space-y-3">
            <div
              class="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 dark:bg-emerald-950/30"
            >
              <span class="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Active
              </span>

              <AppBadge variant="success">
                {{ activeUsers }}
              </AppBadge>
            </div>

            <div
              class="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 dark:bg-amber-950/30"
            >
              <span class="text-sm font-semibold text-amber-700 dark:text-amber-300">
                Pending
              </span>

              <AppBadge variant="warning">
                {{ pendingUsers }}
              </AppBadge>
            </div>

            <div
              class="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3"
            >
              <span class="text-sm font-semibold text-muted-foreground"> Inactive </span>

              <AppBadge variant="default">
                {{ inactiveUsers }}
              </AppBadge>
            </div>
          </div>
        </AppCard>

        <AppCard
          title="Role Coverage"
          subtitle="Roles with the highest permission coverage."
          class="lg:col-span-2"
        >
          <div v-if="topRoles.length > 0" class="space-y-4">
            <div
              v-for="role in topRoles"
              :key="role.id"
              class="rounded-2xl border border-border bg-muted/40 px-4 py-4"
            >
              <div class="flex items-center justify-between gap-4">
                <div class="min-w-0">
                  <p class="truncate text-sm font-bold text-card-foreground">
                    {{ role.name }}
                  </p>

                  <p class="mt-1 text-xs text-muted-foreground">
                    {{ role.users_count }} users · {{ role.guard_name }} guard
                  </p>
                </div>

                <AppBadge variant="info">
                  {{ role.permissions_count }} permissions
                </AppBadge>
              </div>

              <div class="mt-4 h-2 overflow-hidden rounded-full bg-background">
                <div
                  class="h-full rounded-full bg-sky-600 dark:bg-sky-400"
                  :style="{ width: `${rolePercent(role.permissions_count)}%` }"
                />
              </div>
            </div>
          </div>

          <EmptyState
            v-else
            title="No roles found"
            message="Create roles and assign permissions to see coverage."
          />
        </AppCard>
      </div>

      <AppCard title="Permission Modules" subtitle="Permission rules grouped by module.">
        <div v-if="permissionModules.length > 0" class="grid gap-4 lg:grid-cols-2">
          <div
            v-for="module in permissionModules"
            :key="module.module"
            class="rounded-2xl border border-border bg-muted/40 p-4"
          >
            <div class="flex items-center justify-between gap-4">
              <h3 class="text-sm font-bold capitalize text-card-foreground">
                {{ module.module }}
              </h3>

              <AppBadge variant="info">
                {{ module.total }}
              </AppBadge>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <AppBadge
                v-for="permission in (module.permissions || []).slice(0, 5)"
                :key="permission"
                variant="default"
              >
                {{ permission }}
              </AppBadge>

              <span
                v-if="(module.permissions || []).length > 5"
                class="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background"
              >
                +{{ (module.permissions || []).length - 5 }} more
              </span>
            </div>
          </div>
        </div>

        <EmptyState
          v-else
          title="No permission modules"
          message="Create permissions to see module grouping."
        />
      </AppCard>

      <div class="grid gap-4 md:grid-cols-3">
        <NuxtLink
          v-if="canCreateUser"
          to="/users"
          class="rounded-2xl border border-border bg-card p-5 shadow-sm hover:bg-muted"
        >
          <p class="text-sm font-bold text-card-foreground">Create User</p>

          <p class="mt-2 text-sm text-muted-foreground">
            Add a new user and assign role access.
          </p>
        </NuxtLink>

        <NuxtLink
          v-if="canCreateRole"
          to="/roles"
          class="rounded-2xl border border-border bg-card p-5 shadow-sm hover:bg-muted"
        >
          <p class="text-sm font-bold text-card-foreground">Create Role</p>

          <p class="mt-2 text-sm text-muted-foreground">
            Create a new role for your system.
          </p>
        </NuxtLink>

        <NuxtLink
          v-if="canCreatePermission"
          to="/permissions"
          class="rounded-2xl border border-border bg-card p-5 shadow-sm hover:bg-muted"
        >
          <p class="text-sm font-bold text-card-foreground">Create Permission</p>

          <p class="mt-2 text-sm text-muted-foreground">
            Add fine-grained permission rules.
          </p>
        </NuxtLink>
      </div>
    </template>

    <AppRefreshingIndicator :show="refreshing" />
  </div>
</template>

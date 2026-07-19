<script setup lang="ts">
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-vue-next";
import type { RoleItem } from "~/composables/useRole";
import type { PermissionItem } from "~/composables/usePermission";
import { usePermissionManagementStore } from "~/stores/management/permissionStore";

const props = defineProps<{
  open: boolean;
  role: RoleItem | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "saved"): void;
}>();

const { getRole, syncRolePermissions } = useRole();
const permissionStore = usePermissionManagementStore();
const toast = useToast();

const loading = ref(false);
const saving = ref(false);
const errorMessage = ref("");

const search = ref("");
const originalPermissions = ref<string[]>([]);
const permissions = ref<PermissionItem[]>([]);
const selectedPermissions = ref<string[]>([]);

const filteredPermissions = computed(() => {
  const q = search.value.trim().toLowerCase();

  if (!q) {
    return permissions.value;
  }

  return permissions.value.filter((permission) => {
    return (
      permission.name.toLowerCase().includes(q) ||
      permission.module?.toLowerCase().includes(q) ||
      permission.action?.toLowerCase().includes(q)
    );
  });
});

const groupedPermissions = computed(() => {
  const groups: Record<string, PermissionItem[]> = {};

  filteredPermissions.value.forEach((permission) => {
    const moduleName = permission.module || permission.name.split(".")[0] || "other";

    if (!groups[moduleName]) {
      groups[moduleName] = [];
    }

    groups[moduleName].push(permission);
  });

  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((result, [key, value]) => {
      result[key] = value.sort((a, b) => a.name.localeCompare(b.name));
      return result;
    }, {} as Record<string, PermissionItem[]>);
});

const totalPermissions = computed(() => permissions.value.length);

const selectedCount = computed(() => selectedPermissions.value.length);

const newPermissionsCount = computed(
  () =>
    selectedPermissions.value.filter((p) => !originalPermissions.value.includes(p)).length
);

const removedPermissionsCount = computed(
  () =>
    originalPermissions.value.filter((p) => !selectedPermissions.value.includes(p)).length
);

const arraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  for (const item of b) {
    if (!setA.has(item)) return false;
  }
  return true;
};

const hasChanges = computed(
  () =>
    !arraysEqual(
      [...originalPermissions.value].sort(),
      [...selectedPermissions.value].sort()
    )
);

const selectedPercent = computed(() =>
  totalPermissions.value
    ? Math.round((selectedCount.value / totalPermissions.value) * 100)
    : 0
);

const isAllSelectedInGroup = (groupPermissions: PermissionItem[]) =>
  groupPermissions.length > 0 &&
  groupPermissions.every((p) => selectedPermissions.value.includes(p.name));

const isSomeSelectedInGroup = (groupPermissions: PermissionItem[]) => {
  const count = groupPermissions.reduce(
    (acc, p) => acc + (selectedPermissions.value.includes(p.name) ? 1 : 0),
    0
  );
  return count > 0 && count < groupPermissions.length;
};

const selectedCountInGroup = (groupPermissions: PermissionItem[]) =>
  groupPermissions.filter((p) => selectedPermissions.value.includes(p.name)).length;

const toggleGroup = (groupPermissions: PermissionItem[]) => {
  const allSelected = isAllSelectedInGroup(groupPermissions);
  if (allSelected) {
    const namesToRemove = new Set(groupPermissions.map((p) => p.name));
    selectedPermissions.value = selectedPermissions.value.filter(
      (name) => !namesToRemove.has(name)
    );
    return;
  }
  const names = groupPermissions.map((p) => p.name);
  selectedPermissions.value = Array.from(
    new Set([...selectedPermissions.value, ...names])
  );
};

const togglePermission = (permissionName: string) => {
  if (selectedPermissions.value.includes(permissionName)) {
    selectedPermissions.value = selectedPermissions.value.filter(
      (n) => n !== permissionName
    );
  } else {
    selectedPermissions.value.push(permissionName);
  }
};

const selectAll = () => {
  selectedPermissions.value = permissions.value.map((p) => p.name);
};

const clearAll = () => {
  selectedPermissions.value = [];
};

const resetToOriginal = () => {
  selectedPermissions.value = [...originalPermissions.value];
};

const fetchData = async () => {
  if (!props.role) return;

  loading.value = true;
  errorMessage.value = "";
  search.value = "";

  try {
    // ensure permissions are cached and available
    await permissionStore.fetchPermissions({ per_page: 100 }, { silent: true });
    const roleData = await getRole(props.role.id);

    permissions.value = permissionStore.permissions || [];

    const rolePermissions = roleData.data.role.permissions || [];

    selectedPermissions.value = rolePermissions.map((permission: any) => {
      return typeof permission === "string" ? permission : permission.name;
    });

    originalPermissions.value = [...selectedPermissions.value];
  } catch (error: any) {
    errorMessage.value = error.message || "Failed to load role permissions";
    toast.error("Failed to load permissions", errorMessage.value);
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.open,
  async (value) => {
    if (value && props.role) {
      await fetchData();
    }
  }
);

const handleClose = () => {
  if (saving.value) return;

  errorMessage.value = "";
  search.value = "";
  permissions.value = [];
  selectedPermissions.value = [];
  originalPermissions.value = [];

  emit("close");
};

const handleSave = async () => {
  if (!props.role) return;

  saving.value = true;
  errorMessage.value = "";

  try {
    await syncRolePermissions(props.role.id, {
      permissions: selectedPermissions.value,
    });

    toast.success(
      "Permissions updated",
      `${props.role.name} permissions were updated successfully.`
    );

    const notificationStore = useNotificationStore();
    await notificationStore.refreshNotifications();

    emit("saved");
    handleClose();
  } catch (error: any) {
    errorMessage.value = error.message || "Failed to save permissions";
    toast.error("Permission update failed", errorMessage.value);
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          @click="handleClose"
        />

        <Transition name="modal-panel" appear>
          <div
            class="relative z-10 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
          >
            <!-- Header -->
            <div
              class="border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-950"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex items-start gap-4">
                  <div
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 dark:bg-white dark:text-slate-900"
                  >
                    <ShieldCheck class="h-6 w-6" />
                  </div>

                  <div>
                    <h2 class="text-xl font-bold text-ui">Assign Role Permissions</h2>

                    <p class="mt-1 text-sm text-muted-foreground">
                      Manage access rules for
                      <strong class="text-ui">
                        {{ role?.name || "Selected Role" }}
                      </strong>
                    </p>

                    <div class="mt-3 flex flex-wrap items-center gap-2">
                      <AppBadge variant="info"> {{ selectedCount }} selected </AppBadge>

                      <AppBadge variant="default">
                        {{ totalPermissions }} total
                      </AppBadge>

                      <AppBadge v-if="hasChanges" variant="warning">
                        Unsaved changes
                      </AppBadge>

                      <AppBadge v-else variant="success"> Saved </AppBadge>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  class="rounded-2xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  @click="handleClose"
                >
                  <X class="h-5 w-5" />
                </button>
              </div>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto px-6 py-6">
              <div class="space-y-6">
                <AlertMessage
                  v-if="errorMessage"
                  type="error"
                  title="Unable to process permissions"
                  :message="errorMessage"
                />

                <!-- Loading State -->
                <div v-if="loading" class="space-y-4">
                  <div class="grid gap-4 sm:grid-cols-3">
                    <div
                      v-for="i in 3"
                      :key="i"
                      class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div
                        class="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800"
                      />
                      <div
                        class="mt-4 h-8 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div
                    v-for="i in 4"
                    :key="i"
                    class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div
                      class="h-5 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800"
                    />
                    <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div
                        v-for="j in 6"
                        :key="j"
                        class="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/70"
                      />
                    </div>
                  </div>
                </div>

                <template v-else>
                  <!-- Summary Cards -->
                  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div
                      class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div class="flex items-center justify-between">
                        <p class="text-sm font-medium text-muted-foreground">Selected</p>
                        <CheckCircle2
                          class="h-5 w-5 text-green-600 dark:text-green-400"
                        />
                      </div>
                      <p class="mt-3 text-3xl font-bold text-ui">{{ selectedCount }}</p>
                      <p class="mt-1 text-xs text-muted-foreground">
                        {{ selectedPercent }}% of permissions
                      </p>
                    </div>

                    <div
                      class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div class="flex items-center justify-between">
                        <p class="text-sm font-medium text-muted-foreground">Available</p>
                        <KeyRound class="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p class="mt-3 text-3xl font-bold text-ui">
                        {{ totalPermissions }}
                      </p>
                      <p class="mt-1 text-xs text-muted-foreground">
                        Total system permissions
                      </p>
                    </div>

                    <div
                      class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div class="flex items-center justify-between">
                        <p class="text-sm font-medium text-muted-foreground">
                          Newly Added
                        </p>
                        <Sparkles class="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p class="mt-3 text-3xl font-bold text-ui">
                        {{ newPermissionsCount }}
                      </p>
                      <p class="mt-1 text-xs text-muted-foreground">Added in this edit</p>
                    </div>

                    <div
                      class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div class="flex items-center justify-between">
                        <p class="text-sm font-medium text-muted-foreground">Removed</p>
                        <AlertCircle class="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <p class="mt-3 text-3xl font-bold text-ui">
                        {{ removedPermissionsCount }}
                      </p>
                      <p class="mt-1 text-xs text-muted-foreground">
                        Removed in this edit
                      </p>
                    </div>
                  </div>

                  <!-- Toolbar -->
                  <div
                    class="sticky top-0 z-10 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90"
                  >
                    <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
                      <div class="relative flex-1">
                        <Search
                          class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          v-model="search"
                          type="search"
                          placeholder="Search permissions, modules, or actions..."
                          class="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
                        />
                      </div>

                      <div class="flex flex-wrap gap-2">
                        <AppButton type="button" variant="secondary" @click="selectAll">
                          Select All
                        </AppButton>

                        <AppButton type="button" variant="secondary" @click="clearAll">
                          Clear
                        </AppButton>

                        <AppButton
                          type="button"
                          variant="ghost"
                          :disabled="!hasChanges"
                          @click="resetToOriginal"
                        >
                          Reset
                        </AppButton>
                      </div>
                    </div>

                    <div
                      v-if="totalPermissions"
                      class="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                    >
                      <div
                        class="h-full rounded-full bg-blue-600 transition-all duration-300 dark:bg-blue-400"
                        :style="{ width: `${selectedPercent}%` }"
                      />
                    </div>
                  </div>

                  <!-- Empty Search -->
                  <EmptyState
                    v-if="Object.keys(groupedPermissions).length === 0"
                    title="No permissions found"
                    message="Try changing your search keyword."
                  >
                    <template #icon>
                      <Search class="h-6 w-6" />
                    </template>
                  </EmptyState>

                  <!-- Permission Groups -->
                  <div
                    v-for="(groupPermissions, moduleName) in groupedPermissions"
                    :key="moduleName"
                    class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div
                      class="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div class="flex items-center gap-4">
                        <label class="relative flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            :checked="isAllSelectedInGroup(groupPermissions)"
                            class="peer h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                            @change="toggleGroup(groupPermissions)"
                          />

                          <span
                            v-if="isSomeSelectedInGroup(groupPermissions)"
                            class="pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-blue-600 dark:bg-blue-400"
                          />
                        </label>

                        <div>
                          <h3 class="text-sm font-bold capitalize text-ui">
                            {{ moduleName }}
                          </h3>

                          <p class="mt-1 text-xs text-muted-foreground">
                            {{ selectedCountInGroup(groupPermissions) }} of
                            {{ groupPermissions.length }} selected
                          </p>
                        </div>
                      </div>

                      <AppButton
                        type="button"
                        size="sm"
                        variant="secondary"
                        @click="toggleGroup(groupPermissions)"
                      >
                        {{
                          isAllSelectedInGroup(groupPermissions)
                            ? "Unselect Module"
                            : "Select Module"
                        }}
                      </AppButton>
                    </div>

                    <div class="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
                      <button
                        v-for="permission in groupPermissions"
                        :key="permission.id"
                        type="button"
                        class="group flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition"
                        :class="
                          selectedPermissions.includes(permission.name)
                            ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:ring-blue-950'
                            : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800/60'
                        "
                        @click="togglePermission(permission.name)"
                      >
                        <input
                          :checked="selectedPermissions.includes(permission.name)"
                          type="checkbox"
                          class="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                          tabindex="-1"
                          readonly
                        />

                        <div class="min-w-0 flex-1">
                          <div class="flex flex-wrap items-center gap-2">
                            <p class="break-all text-sm font-semibold text-ui">
                              {{ permission.name }}
                            </p>

                            <AppBadge
                              v-if="originalPermissions.includes(permission.name)"
                              variant="default"
                            >
                              Assigned
                            </AppBadge>

                            <AppBadge
                              v-else-if="selectedPermissions.includes(permission.name)"
                              variant="info"
                            >
                              New
                            </AppBadge>
                          </div>

                          <p class="mt-1 text-xs text-muted-foreground">
                            {{ permission.module || moduleName }}
                            <span v-if="permission.action"
                              >· {{ permission.action }}</span
                            >
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <!-- Footer -->
            <div
              class="border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-950"
            >
              <div
                class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div class="text-sm text-muted-foreground">
                  <span v-if="hasChanges"> You have unsaved permission changes. </span>
                  <span v-else> No changes to save. </span>
                </div>

                <div class="flex justify-end gap-3">
                  <AppButton
                    type="button"
                    variant="secondary"
                    :disabled="saving"
                    @click="handleClose"
                  >
                    Cancel
                  </AppButton>

                  <AppButton
                    type="button"
                    :loading="saving"
                    :disabled="loading || saving || !hasChanges"
                    @click="handleSave"
                  >
                    <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
                    Save Permissions
                  </AppButton>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Scoped modal-panel transition to avoid global dependency */
.modal-panel-enter-active,
.modal-panel-leave-active {
  transition: opacity 220ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.modal-panel-enter-from,
.modal-panel-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.995);
}
</style>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.18s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-panel-enter-active,
.modal-panel-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.modal-panel-enter-from,
.modal-panel-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}
</style>

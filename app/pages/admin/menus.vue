<script setup lang="ts">
import {
  Eye,
  EyeOff,
  GripVertical,
  PanelTop,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-vue-next";
import type { MenuItem } from "~/composables/useMenu";
import { useSystemMenuStore } from "~/stores/system/menuStore";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth", "permission"],
  permission: "menu.view",
  title: "Menus",
});

const { reorderMenus, toggleMenuActive } = useMenu();

const systemMenuStore = useSystemMenuStore();
const sidebarMenuStore = useMenuStore();
const authStore = useAuthStore();
const toast = useToast();

const search = ref("");
const groupFilter = ref("");
const statusFilter = ref<"all" | "active" | "inactive" | "system">("all");
const page = ref(1);
const perPage = ref(10);

const pageErrorMessage = ref("");

const reorderMode = ref(false);
const savingOrder = ref(false);
const draggedIndex = ref<number | null>(null);
const togglingId = ref<number | null>(null);

const localMenuOrder = ref<MenuItem[]>([]);

const formModalOpen = ref(false);
const deleteModalOpen = ref(false);
const selectedMenu = ref<MenuItem | null>(null);

const menus = computed(() => {
  return Array.isArray(systemMenuStore.menus) ? systemMenuStore.menus : [];
});

const loading = computed(() => systemMenuStore.loading);
const refreshing = computed(() => systemMenuStore.refreshing);
const errorMessage = computed(
  () => systemMenuStore.errorMessage || pageErrorMessage.value
);

const canCreateMenu = computed(() => {
  return typeof authStore.hasPermission === "function"
    ? authStore.hasPermission("menu.create")
    : false;
});

const canUpdateMenu = computed(() => {
  return typeof authStore.hasPermission === "function"
    ? authStore.hasPermission("menu.update")
    : false;
});

const canDeleteMenu = computed(() => {
  return typeof authStore.hasPermission === "function"
    ? authStore.hasPermission("menu.delete")
    : false;
});

const columns = computed(() => {
  const base = [
    { key: "menu", label: "Menu" },
    { key: "group", label: "Group" },
    { key: "route", label: "Route" },
    { key: "permission", label: "Permission" },
    { key: "status", label: "Status" },
    { key: "sort_order", label: "Order" },
    { key: "actions", label: "Actions", align: "right" as const },
  ];

  if (reorderMode.value) {
    return [
      { key: "drag", label: "", width: "70px" },
      ...base.filter((column) => column.key !== "actions"),
    ];
  }

  return base;
});

const flatMenus = computed(() => {
  const result: MenuItem[] = [];

  menus.value.forEach((menu) => {
    result.push(menu);

    menu.children?.forEach((child) => {
      result.push({
        ...child,
        label: `— ${child.label}`,
      });
    });
  });

  return result;
});

const groupOptions = computed(() => {
  const groups = flatMenus.value.map((item) => item.group || "Main").filter(Boolean);

  return [...new Set(groups)].sort().map((group) => ({
    label: group,
    value: group,
  }));
});

const filteredMenus = computed(() => {
  const keyword = search.value.trim().toLowerCase();

  return flatMenus.value.filter((item) => {
    const matchesSearch =
      !keyword ||
      item.name?.toLowerCase().includes(keyword) ||
      item.label?.toLowerCase().includes(keyword) ||
      item.route?.toLowerCase().includes(keyword) ||
      item.permission?.toLowerCase().includes(keyword) ||
      item.group?.toLowerCase().includes(keyword);

    const matchesGroup = !groupFilter.value || item.group === groupFilter.value;

    const matchesStatus =
      statusFilter.value === "all" ||
      (statusFilter.value === "active" && item.is_active) ||
      (statusFilter.value === "inactive" && !item.is_active) ||
      (statusFilter.value === "system" && item.is_system);

    return matchesSearch && matchesGroup && matchesStatus;
  });
});

const totalItems = computed(() => filteredMenus.value.length);
const lastPage = computed(() => Math.max(Math.ceil(totalItems.value / perPage.value), 1));
const currentPage = computed(() => Math.min(page.value, lastPage.value));

const paginatedMenus = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;

  return filteredMenus.value.slice(start, end);
});

const tableRows = computed(() => {
  return reorderMode.value ? localMenuOrder.value : paginatedMenus.value;
});

const menuCount = computed(() => tableRows.value.length);

const stats = computed(() => {
  const items = flatMenus.value;

  return {
    total: items.length,
    active: items.filter((item) => item.is_active).length,
    inactive: items.filter((item) => !item.is_active).length,
    system: items.filter((item) => item.is_system).length,
  };
});

const fetchMenus = async (
  options: {
    force?: boolean;
    silent?: boolean;
  } = {}
) => {
  pageErrorMessage.value = "";

  await systemMenuStore.fetchMenus(options);

  if (systemMenuStore.errorMessage) {
    toast.error("Failed to load menus", systemMenuStore.errorMessage);
  }
};

const handleRefresh = async () => {
  await fetchMenus({
    force: true,
    silent: true,
  });
};

const refreshAllMenus = async () => {
  await systemMenuStore.invalidateAndRefreshMenus();

  if (typeof sidebarMenuStore.clearMenus === "function") {
    sidebarMenuStore.clearMenus();
  }

  if (typeof sidebarMenuStore.fetchMenus === "function") {
    await sidebarMenuStore.fetchMenus();
  }
};

const resetFilters = () => {
  search.value = "";
  groupFilter.value = "";
  statusFilter.value = "all";
  page.value = 1;
};

const openCreate = () => {
  selectedMenu.value = null;
  formModalOpen.value = true;
};

const openEdit = (menu: MenuItem) => {
  selectedMenu.value = menu;
  formModalOpen.value = true;
};

const openDelete = (menu: MenuItem) => {
  if (menu.is_system) {
    toast.warning("System menu", "System menus cannot be deleted.");
    return;
  }

  selectedMenu.value = menu;
  deleteModalOpen.value = true;
};

const closeForm = () => {
  selectedMenu.value = null;
  formModalOpen.value = false;
};

const closeDelete = () => {
  selectedMenu.value = null;
  deleteModalOpen.value = false;
};

const handleSaved = async () => {
  closeForm();
  await refreshAllMenus();
};

const handleDeleted = async () => {
  closeDelete();
  await refreshAllMenus();
};

const handleToggleActive = async (menu: MenuItem) => {
  togglingId.value = menu.id;
  pageErrorMessage.value = "";

  try {
    await toggleMenuActive(menu.id);

    toast.success(
      "Menu updated",
      `${menu.label} is now ${menu.is_active ? "inactive" : "active"}.`
    );

    await refreshAllMenus();
  } catch (error: any) {
    pageErrorMessage.value =
      error.response?.data?.message || error.message || "Failed to update menu status";

    toast.error("Update failed", pageErrorMessage.value);
  } finally {
    togglingId.value = null;
  }
};

const handleMenuAction = async (menu: MenuItem, action: string) => {
  if (action === "toggle-active") {
    await handleToggleActive(menu);
    return;
  }

  if (action === "edit") {
    openEdit(menu);
    return;
  }

  if (action === "delete") {
    openDelete(menu);
  }
};

const startReorder = () => {
  reorderMode.value = true;
  draggedIndex.value = null;

  // Reorder should use the full menu list, not filtered/paginated rows.
  localMenuOrder.value = flatMenus.value.map((menu) => ({ ...menu }));
};

const cancelReorder = () => {
  reorderMode.value = false;
  draggedIndex.value = null;
  localMenuOrder.value = [];
};

const handleDragStart = (index: number) => {
  if (!reorderMode.value) return;

  draggedIndex.value = index;
};

const handleDragOver = (event: DragEvent) => {
  if (!reorderMode.value) return;

  event.preventDefault();
};

const handleDrop = (targetIndex: number) => {
  if (!reorderMode.value) return;
  if (draggedIndex.value === null) return;

  const sourceIndex = draggedIndex.value;

  if (sourceIndex === targetIndex) {
    draggedIndex.value = null;
    return;
  }

  const items = [...localMenuOrder.value];
  const [movedItem] = items.splice(sourceIndex, 1);

  if (!movedItem) {
    draggedIndex.value = null;
    return;
  }

  items.splice(targetIndex, 0, movedItem);

  localMenuOrder.value = items.map((item, index) => ({
    ...item,
    sort_order: index + 1,
    parent_id: null,
  }));

  draggedIndex.value = null;
};

const saveMenuOrder = async () => {
  savingOrder.value = true;
  pageErrorMessage.value = "";

  try {
    await reorderMenus({
      menus: localMenuOrder.value.map((menu, index) => ({
        id: menu.id,
        sort_order: index + 1,
        parent_id: null,
      })),
    });

    toast.success("Menu order saved", "Sidebar menu order was updated successfully.");

    reorderMode.value = false;
    draggedIndex.value = null;
    localMenuOrder.value = [];

    await refreshAllMenus();
  } catch (error: any) {
    pageErrorMessage.value =
      error.response?.data?.message || error.message || "Failed to save menu order";

    toast.error("Save failed", pageErrorMessage.value);
  } finally {
    savingOrder.value = false;
  }
};

const goPrevious = () => {
  if (page.value <= 1) return;

  page.value--;
};

const goNext = () => {
  if (page.value >= lastPage.value) return;

  page.value++;
};

const goToPage = (targetPage: number) => {
  if (targetPage < 1) return;
  if (targetPage > lastPage.value) return;

  page.value = targetPage;
};

watch([search, groupFilter, statusFilter], () => {
  page.value = 1;
});

watch(lastPage, () => {
  if (page.value > lastPage.value) {
    page.value = lastPage.value;
  }
});

onMounted(async () => {
  await fetchMenus({
    silent: systemMenuStore.hasMenus,
  });
});
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Menus Management"
      subtitle="Manage sidebar navigation items, permissions, visibility, and order."
    >
      <template #actions>
        <AppButton
          v-if="!reorderMode"
          variant="secondary"
          :loading="refreshing"
          @click="handleRefresh"
        >
          <RefreshCcw class="h-4 w-4" />
          Refresh
        </AppButton>

        <AppButton
          v-if="canUpdateMenu && !reorderMode"
          variant="secondary"
          @click="startReorder"
        >
          <GripVertical class="h-4 w-4" />
          Reorder
        </AppButton>

        <AppButton
          v-if="reorderMode"
          variant="secondary"
          :disabled="savingOrder"
          @click="cancelReorder"
        >
          Cancel
        </AppButton>

        <AppButton v-if="reorderMode" :loading="savingOrder" @click="saveMenuOrder">
          <Save class="h-4 w-4" />
          Save Order
        </AppButton>

        <AppButton v-if="canCreateMenu && !reorderMode" @click="openCreate">
          <Plus class="h-4 w-4" />
          Add Menu
        </AppButton>
      </template>
    </PageHeader>

    <AlertMessage
      v-if="errorMessage"
      type="error"
      title="Unable to load menus"
      :message="errorMessage"
    />

    <AlertMessage
      v-if="reorderMode"
      type="info"
      title="Reorder Mode"
      message="Drag menu rows using the handle icon, then click Save Order. Filters and pagination are disabled in reorder mode."
    />

    <PageSkeleton v-if="loading && flatMenus.length === 0" />

    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Menus"
          :value="stats.total"
          subtitle="All menu items"
          tone="info"
        >
          <template #badge>
            <AppBadge variant="info" shape="square" size="md">
              <PanelTop class="h-5 w-5" />
            </AppBadge>
          </template>
        </StatsCard>

        <StatsCard
          title="Active"
          :value="stats.active"
          subtitle="Visible menus"
          tone="success"
        >
          <template #badge>
            <AppBadge variant="success" shape="square" size="md">
              <Eye class="h-5 w-5" />
            </AppBadge>
          </template>
        </StatsCard>

        <StatsCard
          title="Inactive"
          :value="stats.inactive"
          subtitle="Hidden menus"
          tone="warning"
        >
          <template #badge>
            <AppBadge variant="warning" shape="square" size="md">
              <EyeOff class="h-5 w-5" />
            </AppBadge>
          </template>
        </StatsCard>

        <StatsCard
          title="System"
          :value="stats.system"
          subtitle="Protected system menus"
          tone="default"
        >
          <template #badge>
            <AppBadge variant="default" shape="square" size="md">
              <ShieldCheck class="h-5 w-5" />
            </AppBadge>
          </template>
        </StatsCard>
      </div>

      <FilterBar
        v-if="!reorderMode"
        title="Filters"
        subtitle="Search and filter menu records."
        columns="3"
      >
        <AppInput
          v-model="search"
          label="Search"
          placeholder="Search name, label, route, permission..."
        />

        <AppSelect
          v-model="groupFilter"
          label="Group"
          placeholder="All Groups"
          :options="groupOptions"
        />

        <AppSelect
          v-model="statusFilter"
          label="Status"
          placeholder="All Status"
          :options="[
            { label: 'All', value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'System', value: 'system' },
          ]"
        />

        <template #actions>
          <AppButton variant="secondary" @click="resetFilters"> Reset </AppButton>
        </template>
      </FilterBar>

      <DataTable
        :columns="columns"
        :rows="tableRows"
        :loading="loading && menuCount === 0"
        empty-title="No menus found"
        empty-message="Create your first menu item to customize the sidebar."
        @row-dragstart="handleDragStart"
        @row-dragover="handleDragOver"
        @row-drop="handleDrop"
      >
        <template #cell-menu="{ row }">
          <div class="flex items-center gap-3">
            <AppBadge variant="info" shape="square" size="md">
              <MenuIcon
                :name="row.name"
                :label="row.label"
                :route="row.route"
                :group="row.group"
              />
            </AppBadge>

            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <p class="truncate text-sm font-bold text-card-foreground">
                  {{ row.label }}
                </p>

                <AppBadge v-if="row.is_system" variant="warning"> System </AppBadge>
              </div>

              <p class="mt-1 truncate text-xs text-muted-foreground">
                {{ row.name }} · {{ row.route || "No route" }}
              </p>
            </div>
          </div>
        </template>

        <template #cell-group="{ row }">
          <AppBadge variant="default">
            {{ row.group || "Main" }}
          </AppBadge>
        </template>

        <template #cell-route="{ row }">
          <code
            class="rounded-lg border border-border bg-muted px-2 py-1 text-xs font-semibold text-card-foreground"
          >
            {{ row.route || "-" }}
          </code>
        </template>

        <template #cell-permission="{ row }">
          <AppBadge v-if="row.permission" variant="info">
            {{ row.permission }}
          </AppBadge>

          <span v-else class="text-sm text-muted-foreground"> Public </span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge :variant="row.is_active ? 'success' : 'warning'">
            {{ row.is_active ? "Active" : "Inactive" }}
          </AppBadge>
        </template>

        <template #cell-sort_order="{ row }">
          <AppBadge variant="default"> #{{ row.sort_order }} </AppBadge>
        </template>

        <template #cell-actions="{ row }">
          <AppDropdown
            width="w-72"
            :items="[
              {
                label: row.is_active ? 'Disable Menu' : 'Enable Menu',
                value: 'toggle-active',
                icon: row.is_active ? EyeOff : Eye,
                variant: row.is_active ? 'warning' : 'success',
                visible: canUpdateMenu,
                disabled: togglingId === row.id,
                description: row.is_active
                  ? 'Hide this menu from sidebar'
                  : 'Show this menu in sidebar',
              },
              {
                label: 'Edit Menu',
                value: 'edit',
                icon: Pencil,
                visible: canUpdateMenu,
                description: 'Update menu details',
              },
              {
                label: 'Delete Menu',
                value: 'delete',
                icon: Trash2,
                variant: 'danger',
                visible: canDeleteMenu && !row.is_system,
                description: 'Remove this menu item',
              },
              {
                label: 'System Menu',
                value: 'system',
                icon: ShieldCheck,
                disabled: true,
                visible: row.is_system,
                description: 'Protected system menu',
              },
            ]"
            @select="handleMenuAction(row, $event)"
          />
        </template>

        <template #cell-drag>
          <div
            class="flex cursor-grab items-center justify-center rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-card-foreground active:cursor-grabbing"
          >
            <GripVertical class="h-5 w-5" />
          </div>
        </template>
      </DataTable>

      <TablePagination
        v-if="!reorderMode && totalItems > 0"
        :current-page="currentPage"
        :last-page="lastPage"
        :total="totalItems"
        :per-page="perPage"
        :loading="loading && menuCount === 0"
        @previous="goPrevious"
        @next="goNext"
        @page="goToPage"
        label="menus"
      />
    </template>

    <MenuFormModal
      :open="formModalOpen"
      :menu="selectedMenu"
      :menus="flatMenus"
      @close="closeForm"
      @saved="handleSaved"
    />

    <DeleteMenuModal
      :open="deleteModalOpen"
      :menu="selectedMenu"
      @close="closeDelete"
      @deleted="handleDeleted"
    />

    <AppRefreshingIndicator :show="refreshing" />
  </div>
</template>

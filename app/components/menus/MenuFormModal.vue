<script setup lang="ts">
import { PanelTop, Save, X } from "lucide-vue-next";
import type { MenuItem, MenuPayload } from "~/composables/useMenu";

const props = defineProps<{
  open: boolean;
  menu: MenuItem | null;
  menus: MenuItem[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "saved"): void;
}>();

const { createMenu, updateMenu } = useMenu();
const toast = useToast();

const loading = ref(false);
const generalError = ref("");

const form = reactive<MenuPayload>({
  name: "",
  label: "",
  route: "",
  permission: "",
  group: "Main",
  parent_id: null,
  sort_order: 0,
  is_active: true,
});

const errors = reactive<Record<string, string>>({
  name: "",
  label: "",
  route: "",
  permission: "",
  group: "",
  parent_id: "",
  sort_order: "",
  is_active: "",
});

const groupOptions = [
  { label: "Main", value: "Main" },
  { label: "Management", value: "Management" },
  { label: "Administration", value: "Administration" },
  { label: "Inventory", value: "Inventory" },
  { label: "System", value: "System" },
  { label: "Account", value: "Account" },
  { label: "Reports", value: "Reports" },
  { label: "Custom", value: "Custom" },
];

const permissionOptions = [
  { label: "No Permission", value: "" },

  { label: "Dashboard View", value: "dashboard.view" },

  { label: "User View", value: "user.view" },
  { label: "User Create", value: "user.create" },
  { label: "User Update", value: "user.update" },
  { label: "User Delete", value: "user.delete" },

  { label: "Role View", value: "role.view" },
  { label: "Role Create", value: "role.create" },
  { label: "Role Update", value: "role.update" },
  { label: "Role Delete", value: "role.delete" },

  { label: "Permission View", value: "permission.view" },
  { label: "Permission Create", value: "permission.create" },
  { label: "Permission Update", value: "permission.update" },
  { label: "Permission Delete", value: "permission.delete" },

  { label: "RBAC View", value: "rbac.view" },

  { label: "Product View", value: "product.view" },
  { label: "Product Create", value: "product.create" },
  { label: "Product Update", value: "product.update" },
  { label: "Product Delete", value: "product.delete" },

  { label: "Country View", value: "country.view" },
  { label: "Country Create", value: "country.create" },
  { label: "Country Update", value: "country.update" },
  { label: "Country Delete", value: "country.delete" },

  { label: "Audit View", value: "audit.view" },

  { label: "Menu View", value: "menu.view" },
  { label: "Menu Create", value: "menu.create" },
  { label: "Menu Update", value: "menu.update" },
  { label: "Menu Delete", value: "menu.delete" },

  { label: "Setting View", value: "setting.view" },
  { label: "Setting Update", value: "setting.update" },

  { label: "Profile View", value: "profile.view" },
  { label: "Profile Update", value: "profile.update" },
];

const parentOptions = computed(() => {
  const safeMenus = Array.isArray(props.menus) ? props.menus : [];

  const options = safeMenus
    .filter((item) => item.id !== props.menu?.id)
    .map((item) => ({
      label: item.label,
      value: item.id,
    }));

  return [{ label: "No Parent", value: "" }, ...options];
});

const previewIconData = computed(() => {
  return {
    name: form.name,
    label: form.label,
    route: form.route,
    group: form.group,
  };
});

const resetErrors = () => {
  generalError.value = "";

  Object.keys(errors).forEach((key) => {
    errors[key] = "";
  });
};

const fillForm = () => {
  if (props.menu) {
    form.name = props.menu.name || "";
    form.label = props.menu.label || "";
    form.route = props.menu.route || "";
    form.permission = props.menu.permission || "";
    form.parent_id = props.menu.parent_id;
    form.group = props.menu.group || "Main";
    form.sort_order = props.menu.sort_order || 0;
    form.is_active = Boolean(props.menu.is_active);
    return;
  }

  form.name = "";
  form.label = "";
  form.route = "";
  form.permission = "";
  form.parent_id = null;
  form.group = "Main";
  form.sort_order = Array.isArray(props.menus) ? props.menus.length + 1 : 1;
  form.is_active = true;
};

watch(
  () => props.open,
  (open) => {
    if (open) {
      resetErrors();
      fillForm();
    }
  }
);

const normalizedPayload = (): MenuPayload => {
  return {
    name: form.name.trim(),
    label: form.label.trim(),
    route: form.route?.trim() || null,
    permission: form.permission || null,
    group: form.group || "Main",
    parent_id: form.parent_id ? Number(form.parent_id) : null,
    sort_order: Number(form.sort_order || 0),
    is_active: Boolean(form.is_active),
  };
};

const handleClose = () => {
  if (loading.value) return;

  resetErrors();
  emit("close");
};

const handleSubmit = async () => {
  loading.value = true;
  resetErrors();

  try {
    const payload = normalizedPayload();

    if (props.menu) {
      await updateMenu(props.menu.id, payload);

      toast.success("Menu updated", "Menu item was updated successfully.");
    } else {
      await createMenu(payload);

      toast.success("Menu created", "Menu item was created successfully.");
    }

    emit("saved");
    handleClose();
  } catch (error: any) {
    generalError.value =
      error.response?.data?.message || error.message || "Failed to save menu";

    toast.error("Save failed", generalError.value);

    const validationErrors = error.response?.data?.errors || error.errors;

    if (validationErrors) {
      Object.keys(errors).forEach((key) => {
        errors[key] = validationErrors[key]?.[0] || "";
      });
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <AppModal
    :open="open"
    :title="menu ? 'Edit Menu' : 'Create Menu'"
    :subtitle="menu ? 'Update sidebar menu item.' : 'Create a new sidebar menu item.'"
    size="md"
    @close="handleClose"
  >
    <template #icon>
      <PanelTop class="h-5 w-5" />
    </template>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <AlertMessage
        v-if="generalError"
        type="error"
        title="Unable to save menu"
        :message="generalError"
      />

      <div class="grid gap-4 sm:grid-cols-2">
        <AppInput
          v-model="form.name"
          label="Name"
          placeholder="Example: countries"
          :error="errors.name"
        >
          <template #icon>
            <PanelTop class="h-5 w-5" />
          </template>
        </AppInput>

        <AppInput
          v-model="form.label"
          label="Label"
          placeholder="Example: Countries"
          :error="errors.label"
        >
          <template #icon>
            <PanelTop class="h-5 w-5" />
          </template>
        </AppInput>
      </div>

      <AppInput
        v-model="form.route"
        label="Route"
        placeholder="Example: /countries"
        :error="errors.route"
      >
        <template #icon>
          <MenuIcon
            :name="previewIconData.name"
            :label="previewIconData.label"
            :route="previewIconData.route"
            :group="previewIconData.group"
          />
        </template>
      </AppInput>

      <div
        class="flex items-center gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-3"
      >
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-card-foreground"
        >
          <MenuIcon
            :name="previewIconData.name"
            :label="previewIconData.label"
            :route="previewIconData.route"
            :group="previewIconData.group"
          />
        </div>

        <div>
          <p class="text-sm font-semibold text-card-foreground">Icon Preview</p>

          <p class="text-xs text-muted-foreground">
            Icon is resolved by frontend from name, route, label, or group.
          </p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <AppSelect
          v-model="form.group"
          label="Group"
          placeholder="Select group"
          :options="groupOptions"
          :error="errors.group"
        />

        <AppSelect
          v-model="form.permission"
          label="Required Permission"
          placeholder="No Permission"
          :options="permissionOptions"
          :error="errors.permission"
        />
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <AppSelect
          v-model="form.parent_id"
          label="Parent Menu"
          placeholder="No Parent"
          :options="parentOptions"
          :error="errors.parent_id"
        />

        <AppInput
          v-model="form.sort_order"
          label="Sort Order"
          type="number"
          placeholder="1"
          :error="errors.sort_order"
        />
      </div>

      <label
        class="flex cursor-pointer items-center justify-between rounded-2xl border border-border p-4 transition hover:bg-muted/60"
      >
        <div>
          <p class="text-sm font-bold text-card-foreground">Active Menu</p>
          <p class="mt-1 text-sm text-muted-foreground">
            Show this menu item in the sidebar.
          </p>
        </div>

        <input
          v-model="form.is_active"
          type="checkbox"
          class="h-5 w-5 rounded border-border"
        />
      </label>

      <div class="flex justify-end gap-3 border-t border-border pt-5">
        <AppButton
          type="button"
          variant="secondary"
          :disabled="loading"
          @click="handleClose"
        >
          <X class="mr-2 h-4 w-4" />
          Cancel
        </AppButton>

        <AppButton type="submit" :loading="loading">
          <Save class="mr-2 h-4 w-4" />
          {{ menu ? "Update Menu" : "Create Menu" }}
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

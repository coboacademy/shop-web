<script setup lang="ts">
import { Copy, ShieldCheck, X } from "lucide-vue-next";
import { useRoleManagementStore } from "~/stores/management/roleStore";
import type { RoleItem } from "~/composables/useRole";

const props = defineProps<{
  open: boolean;
  role: RoleItem | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "cloned"): void;
}>();

const { cloneRole } = useRole();
const roleStore = useRoleManagementStore();
const toast = useToast();

const loading = ref(false);
const generalError = ref("");

const form = reactive({
  name: "",
  guard_name: "web",
});

const errors = reactive<Record<string, string>>({
  name: "",
  guard_name: "",
});

watch(
  () => props.role,
  (role) => {
    if (role) {
      form.name = `${role.name} Copy`;
      form.guard_name = role.guard_name || "web";
    }
  },
  { immediate: true }
);

const resetErrors = () => {
  generalError.value = "";
  errors.name = "";
  errors.guard_name = "";
};

const handleClose = () => {
  resetErrors();
  emit("close");
};

const handleSubmit = async () => {
  if (!props.role) return;

  loading.value = true;
  resetErrors();

  try {
    await cloneRole(props.role.id, {
      name: form.name,
      guard_name: form.guard_name,
    });

    toast.success("Role cloned", `${props.role.name} was duplicated successfully.`);
    await roleStore.invalidateAndRefresh();
    emit("cloned");
    handleClose();
  } catch (error: any) {
    generalError.value = error.message || "Failed to clone role";
    toast.error("Clone failed", generalError.value);

    if (error.errors) {
      errors.name = error.errors.name?.[0] || "";
      errors.guard_name = error.errors.guard_name?.[0] || "";
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <AppModal
    :open="open"
    title="Clone Role"
    subtitle="Duplicate this role and copy all assigned permissions."
    size="sm"
    @close="handleClose"
  >
    <template #icon>
      <Copy class="h-5 w-5" />
    </template>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <AlertMessage v-if="generalError" type="error" :message="generalError" />

      <AlertMessage v-if="role" type="info" title="Source Role">
        You are cloning
        <strong>{{ role.name }}</strong>
        with
        <strong>{{ role.permissions_count || role.permissions?.length || 0 }}</strong>
        permission(s).
      </AlertMessage>

      <AppInput
        v-model="form.name"
        label="New Role Name"
        placeholder="Example: Senior Manager"
        :error="errors.name"
      >
        <template #icon>
          <ShieldCheck class="h-5 w-5" />
        </template>
      </AppInput>

      <AppSelect
        v-model="form.guard_name"
        label="Guard"
        placeholder="Select guard"
        :options="[
          { label: 'Web', value: 'web' },
          { label: 'API', value: 'api' },
        ]"
        :error="errors.guard_name"
      />

      <div
        class="flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800"
      >
        <AppButton type="button" variant="secondary" @click="handleClose">
          <X class="mr-2 h-4 w-4" />
          Cancel
        </AppButton>

        <AppButton type="submit" :loading="loading">
          <Copy class="mr-2 h-4 w-4" />
          Clone Role
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

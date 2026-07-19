<script setup lang="ts">
import type { UpdateUserPayload, UserItem } from "~/composables/useUser";
import type { RoleItem } from "~/composables/useRole";
import { useRoleManagementStore } from "~/stores/management/roleStore";

const props = defineProps<{
  open: boolean;
  user: UserItem | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "updated"): void;
}>();

const { updateUser } = useUser();
const roleStore = useRoleManagementStore();
const toast = useToast();

const loading = ref(false);
const generalError = ref("");

const roles = ref<RoleItem[]>([]);
const rolesLoading = ref(false);

const form = reactive<UpdateUserPayload>({
  name: "",
  email: "",
  password: "",
  password_confirmation: "",
  status: "active",
  role: "",
});

const errors = reactive<Record<string, string>>({
  name: "",
  email: "",
  password: "",
  password_confirmation: "",
  status: "",
  role: "",
});

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Suspended", value: "suspended" },
  { label: "Blocked", value: "blocked" },
];

const roleOptions = computed(() => {
  return roles.value.map((role) => ({
    label: role.name,
    value: role.name,
  }));
});

const resetErrors = () => {
  generalError.value = "";

  Object.keys(errors).forEach((key) => {
    errors[key] = "";
  });
};

const fillForm = () => {
  form.name = props.user?.name || "";
  form.email = props.user?.email || "";
  form.password = "";
  form.password_confirmation = "";
  form.status = props.user?.status || "active";
  form.role = props.user?.role || "";
};

const fetchRoles = async () => {
  rolesLoading.value = true;

  try {
    await roleStore.fetchRoles({ per_page: 100 }, { silent: true });
    roles.value = roleStore.roles;
  } catch (error) {
    console.error("Failed to load roles", error);
  } finally {
    rolesLoading.value = false;
  }
};

watch(
  () => props.open,
  async (value) => {
    if (value && props.user) {
      fillForm();
      resetErrors();
      await fetchRoles();
    }
  }
);

watch(
  () => props.user,
  () => {
    if (props.user) {
      fillForm();
      resetErrors();
    }
  }
);

const handleClose = () => {
  resetErrors();
  emit("close");
};

const handleSubmit = async () => {
  if (!props.user) return;

  resetErrors();
  loading.value = true;

  try {
    const payload: UpdateUserPayload = {
      name: form.name,
      email: form.email,
      status: form.status,
      role: form.role || undefined,
    };

    if (form.password) {
      payload.password = form.password;
      payload.password_confirmation = form.password_confirmation;
    }

    await updateUser(props.user.id, payload);
    toast.success("User updated", "User information was updated successfully.");
    emit("updated");
    handleClose();
  } catch (error: any) {
    generalError.value =
      error.response?.data?.message || error.message || "Failed to update user";
    toast.error("Update failed", generalError.value);

    const validationErrors = error.response?.data?.errors || error.errors;

    if (validationErrors) {
      errors.name = validationErrors.name?.[0] || "";
      errors.email = validationErrors.email?.[0] || "";
      errors.password = validationErrors.password?.[0] || "";
      errors.password_confirmation = validationErrors.password_confirmation?.[0] || "";
      errors.status = validationErrors.status?.[0] || "";
      errors.role = validationErrors.role?.[0] || "";
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <AppModal
    :open="open"
    title="Edit User"
    subtitle="Update user information and account settings."
    size="md"
    @close="handleClose"
  >
    <form class="space-y-5" @submit.prevent="handleSubmit">
      <AlertMessage v-if="generalError" type="error" :message="generalError" />

      <div class="grid gap-5 md:grid-cols-2">
        <AppInput
          v-model="form.name"
          label="Full Name"
          placeholder="Enter full name"
          :error="errors.name"
        />

        <AppInput
          v-model="form.email"
          label="Email Address"
          type="email"
          placeholder="Enter email address"
          :error="errors.email"
        />

        <AppInput
          v-model="form.password"
          label="New Password"
          type="password"
          placeholder="Leave blank to keep current password"
          :error="errors.password"
        />

        <AppInput
          v-model="form.password_confirmation"
          label="Confirm New Password"
          type="password"
          placeholder="Confirm new password"
          :error="errors.password_confirmation"
        />

        <AppSelect
          v-model="form.status"
          label="Status"
          :options="statusOptions"
          placeholder="Select status"
          :error="errors.status"
        />

        <AppSelect
          v-model="form.role"
          label="Role"
          :options="roleOptions"
          :placeholder="rolesLoading ? 'Loading roles...' : 'Select role'"
          :disabled="rolesLoading"
          :error="errors.role"
        />
      </div>

      <div class="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
        <AppButton type="button" variant="secondary" @click="handleClose">
          Cancel
        </AppButton>

        <AppButton type="submit" variant="primary" :loading="loading">
          Update User
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

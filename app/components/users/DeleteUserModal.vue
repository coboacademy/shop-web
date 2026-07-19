<script setup lang="ts">
import type { UserItem } from "~/composables/useUser";

const props = defineProps<{
  open: boolean;
  user: UserItem | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "deleted"): void;
}>();

const { deleteUser } = useUser();
const toast = useToast();

const loading = ref(false);
const generalError = ref("");

const handleClose = () => {
  generalError.value = "";
  emit("close");
};

const handleDelete = async () => {
  if (!props.user) return;

  generalError.value = "";
  loading.value = true;

  try {
    await deleteUser(props.user.id);
    toast.success("User deleted", "The user account was deleted successfully.");
    emit("deleted");
    handleClose();
  } catch (error: any) {
    generalError.value =
      error.response?.data?.message || error.message || "Failed to delete user";
    toast.error("Delete failed", generalError.value);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <AppModal
    :open="open"
    title="Delete User"
    subtitle="This action cannot be undone."
    size="sm"
    @close="handleClose"
  >
    <div class="space-y-5">
      <AlertMessage v-if="generalError" type="error" :message="generalError" />

      <AlertMessage type="warning" title="Confirm delete">
        Are you sure you want to delete this user?

        <div
          class="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
        >
          <p class="text-sm font-semibold text-ui">
            {{ user?.name || "Unknown User" }}
          </p>
          <p class="text-sm text-muted">
            {{ user?.email || "-" }}
          </p>
        </div>
      </AlertMessage>

      <div class="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
        <AppButton type="button" variant="secondary" @click="handleClose">
          Cancel
        </AppButton>

        <AppButton
          type="button"
          variant="danger"
          :loading="loading"
          @click="handleDelete"
        >
          Delete User
        </AppButton>
      </div>
    </div>
  </AppModal>
</template>

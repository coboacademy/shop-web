<script setup lang="ts">
import { Trash2, X } from "lucide-vue-next";
import type { MenuItem } from "~/composables/useMenu";

const props = defineProps<{
  open: boolean;
  menu: MenuItem | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "deleted"): void;
}>();

const { deleteMenu } = useMenu();
const toast = useToast();

const loading = ref(false);
const generalError = ref("");

const menuTitle = computed(() => {
  return props.menu?.label || props.menu?.name || "this menu";
});

const canDelete = computed(() => {
  return Boolean(props.menu && !props.menu.is_system);
});

const handleClose = () => {
  if (loading.value) return;

  generalError.value = "";
  emit("close");
};

const handleDelete = async () => {
  if (!props.menu) return;

  if (props.menu.is_system) {
    generalError.value = "System menu cannot be deleted.";
    return;
  }

  loading.value = true;
  generalError.value = "";

  try {
    await deleteMenu(props.menu.id);

    toast.success("Menu deleted", "Menu item was deleted successfully.");

    emit("deleted");
    handleClose();
  } catch (error: any) {
    generalError.value =
      error.response?.data?.message || error.message || "Failed to delete menu";

    toast.error("Delete failed", generalError.value);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <AppModal
    :open="open"
    title="Delete Menu"
    subtitle="This action cannot be undone."
    size="sm"
    @close="handleClose"
  >
    <template #icon>
      <Trash2 class="h-5 w-5" />
    </template>

    <div class="space-y-5">
      <AlertMessage
        v-if="generalError"
        type="error"
        title="Delete failed"
        :message="generalError"
      />

      <AlertMessage
        v-if="menu?.is_system"
        type="warning"
        title="System Menu"
        message="This menu is protected and cannot be deleted."
      />

      <AlertMessage v-else type="warning" title="Confirm delete">
        Are you sure you want to delete
        <strong>{{ menuTitle }}</strong
        >?
      </AlertMessage>

      <div v-if="menu" class="rounded-2xl border border-border bg-muted/50 p-4">
        <div class="flex items-center gap-3">
          <AppBadge variant="danger" shape="square" size="md">
            <Trash2 class="h-5 w-5" />
          </AppBadge>

          <div class="min-w-0">
            <p class="truncate text-sm font-bold text-card-foreground">
              {{ menu.label }}
            </p>

            <p class="mt-1 truncate text-xs text-muted-foreground">
              {{ menu.name }} · {{ menu.route || "No route" }}
            </p>
          </div>
        </div>
      </div>

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

        <AppButton
          type="button"
          variant="danger"
          :loading="loading"
          :disabled="!canDelete"
          @click="handleDelete"
        >
          <Trash2 class="mr-2 h-4 w-4" />
          Delete Menu
        </AppButton>
      </div>
    </div>
  </AppModal>
</template>

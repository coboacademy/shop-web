<script setup lang="ts">
import { Pencil } from "lucide-vue-next";
import type { Store, UpdateStorePayload } from "~/composables/useVendor";

const props = defineProps<{
  open: boolean;
  store: Store | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "updated", store: Store): void;
}>();

const { updateStore } = useVendor();
const toast = useToast();
const saving = ref(false);
const generalError = ref("");
const form = reactive<Required<UpdateStorePayload>>({
  name: "",
  phone: "",
  description: "",
});
const errors = reactive<Record<keyof typeof form, string>>({
  name: "",
  phone: "",
  description: "",
});

const resetErrors = () => {
  generalError.value = "";
  Object.keys(errors).forEach((key) => {
    errors[key as keyof typeof errors] = "";
  });
};

const fillForm = (store: Store | null) => {
  form.name = store?.name || "";
  form.phone = store?.phone || "";
  form.description = store?.description || "";
};

watch(
  () => [props.open, props.store?.id],
  () => {
    if (props.open) {
      resetErrors();
      fillForm(props.store);
    }
  },
  { immediate: true }
);

const handleClose = () => {
  if (saving.value) return;

  resetErrors();
  emit("close");
};

const handleSubmit = async () => {
  if (!props.store) return;

  resetErrors();
  saving.value = true;

  try {
    const response = await updateStore(props.store.id, { ...form });
    toast.success("Store updated", response.message || "Store information was updated successfully.");
    emit("updated", response.data.store);
    handleClose();
  } catch (error: any) {
    generalError.value = error.message || "Failed to update store";

    Object.entries(error.errors || {}).forEach(([key, value]) => {
      if (key in errors) {
        errors[key as keyof typeof errors] = Array.isArray(value)
          ? String(value[0] || "")
          : String(value || "");
      }
    });

    toast.error("Update failed", generalError.value);
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <AppModal
    :open="open"
    title="Edit Store"
    subtitle="Update the store name, contact phone, or description."
    size="md"
    @close="handleClose"
  >
    <template #icon><Pencil class="h-5 w-5" /></template>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <AlertMessage v-if="generalError" type="error" title="Update failed" :message="generalError" />

      <AppInput
        v-model="form.name"
        label="Store name"
        placeholder="Enter store name"
        :error="errors.name"
      />

      <AppInput
        v-model="form.phone"
        label="Contact phone"
        type="tel"
        placeholder="Enter contact phone"
        :error="errors.phone"
      />

      <div>
        <label class="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Description
        </label>
        <textarea
          v-model="form.description"
          rows="4"
          placeholder="Describe what your store offers"
          class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
          :class="errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : ''"
        />
        <p v-if="errors.description" class="mt-2 text-sm text-red-600 dark:text-red-400">
          {{ errors.description }}
        </p>
      </div>

      <div class="flex items-center justify-end gap-3 border-t border-border pt-5">
        <AppButton type="button" variant="secondary" :disabled="saving" @click="handleClose">
          Cancel
        </AppButton>
        <AppButton type="submit" variant="primary" :loading="saving">
          Save changes
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

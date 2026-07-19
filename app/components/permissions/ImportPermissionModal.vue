<script setup lang="ts">
import { FileSpreadsheet, Upload, X } from "lucide-vue-next";
import { usePermissionManagementStore } from "~/stores/management/permissionStore";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "imported"): void;
}>();

const { importPermissions } = usePermission();
const permissionStore = usePermissionManagementStore();
const toast = useToast();

const loading = ref(false);
const selectedFile = ref<File | null>(null);
const generalError = ref("");
const result = ref<any | null>(null);

const resetState = () => {
  selectedFile.value = null;
  generalError.value = "";
  result.value = null;
};

const handleClose = () => {
  resetState();
  emit("close");
};

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  selectedFile.value = input.files?.[0] || null;
  generalError.value = "";
  result.value = null;
};

const handleImport = async () => {
  if (!selectedFile.value) {
    generalError.value = "Please select a CSV file first.";
    return;
  }

  loading.value = true;
  generalError.value = "";

  try {
    const response = await importPermissions(selectedFile.value);

    result.value = response.data.result;
    toast.success(
      "Import completed",
      response.message || "Permissions imported successfully."
    );
    await permissionStore.invalidateAndRefresh();
    emit("imported");
  } catch (error: any) {
    generalError.value =
      error.response?.data?.message || error.message || "Failed to import permissions";
    toast.error("Import failed", generalError.value);
  } finally {
    loading.value = false;
  }
};

const downloadPermissionSample = () => {
  const content = [
    "name,guard_name",
    "dashboard.view,web",
    "user.view,web",
    "user.create,web",
    "user.update,web",
    "user.delete,web",
    "role.view,web",
    "role.create,web",
    "role.update,web",
    "role.delete,web",
    "permission.view,web",
    "permission.create,web",
    "permission.update,web",
    "permission.delete,web",
    "audit.view,web",
  ].join("\n");

  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8;",
  });

  downloadBlobFile(blob, "permissions-sample.csv");
};
</script>

<template>
  <AppModal
    :open="open"
    title="Import Permissions"
    subtitle="Upload a CSV file to create or update permissions in bulk."
    size="md"
    @close="handleClose"
  >
    <template #icon>
      <FileSpreadsheet class="h-5 w-5" />
    </template>

    <div class="space-y-5">
      <AlertMessage v-if="generalError" type="error" :message="generalError" />

      <AlertMessage type="info" title="CSV Format">
        Your CSV must include a <strong>name</strong> column. The
        <strong>guard_name</strong> column is optional and defaults to
        <strong>web</strong>.
      </AlertMessage>

      <div
        class="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60"
      >
        <p class="mb-2 text-sm font-bold text-ui">Example CSV</p>

        <pre
          class="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-white dark:bg-slate-950"
        >
name,guard_name
user.view,web
user.create,web
role.update,web
audit.view,web
</pre
        >
      </div>

      <label
        class="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-8 text-center transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
      >
        <Upload class="h-8 w-8 text-slate-400" />

        <p class="mt-3 text-sm font-semibold text-ui">
          {{ selectedFile ? selectedFile.name : "Click to upload CSV file" }}
        </p>

        <p class="mt-1 text-xs text-muted">CSV or TXT file, max 2MB</p>

        <input type="file" accept=".csv,.txt" class="hidden" @change="handleFileChange" />
      </label>

      <div v-if="result" class="grid gap-3 sm:grid-cols-3">
        <div class="rounded-2xl bg-green-50 p-4 text-center dark:bg-green-950/40">
          <p class="text-2xl font-bold text-green-700 dark:text-green-300">
            {{ result.created }}
          </p>
          <p class="text-xs text-green-700 dark:text-green-300">Created</p>
        </div>

        <div class="rounded-2xl bg-blue-50 p-4 text-center dark:bg-blue-950/40">
          <p class="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {{ result.updated }}
          </p>
          <p class="text-xs text-blue-700 dark:text-blue-300">Updated</p>
        </div>

        <div class="rounded-2xl bg-amber-50 p-4 text-center dark:bg-amber-950/40">
          <p class="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {{ result.skipped }}
          </p>
          <p class="text-xs text-amber-700 dark:text-amber-300">Skipped</p>
        </div>
      </div>

      <AlertMessage v-if="result?.errors?.length" type="warning" title="Import warnings">
        <ul class="list-inside list-disc space-y-1">
          <li v-for="error in result.errors.slice(0, 5)" :key="error">
            {{ error }}
          </li>
        </ul>

        <p v-if="result.errors.length > 5" class="mt-2 text-xs opacity-80">
          And {{ result.errors.length - 5 }} more warning(s).
        </p>
      </AlertMessage>

      <div
        class="flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800"
      >
        <AppButton
          type="button"
          :loading="loading"
          :disabled="!selectedFile"
          @click="handleImport"
        >
          <Upload class="mr-2 h-4 w-4" />
          Import
        </AppButton>
        <AppButton type="button" variant="secondary" @click="downloadPermissionSample">
          Download Sample
        </AppButton>
      </div>
    </div>
  </AppModal>
</template>

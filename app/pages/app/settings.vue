<script setup lang="ts">
import { LockKeyhole, Save, Settings } from "lucide-vue-next";

definePageMeta({
  layout: "user",
  middleware: ["auth", "permission"],
  permission: "account.view",
  title: "Account Settings",
});

const { updateProfilePassword } = useProfile();
const toast = useToast();

const savingPassword = ref(false);
const errorMessage = ref("");

const passwordForm = reactive({
  current_password: "",
  password: "",
  password_confirmation: "",
});

const errors = reactive<Record<string, string>>({
  current_password: "",
  password: "",
  password_confirmation: "",
});

const resetErrors = () => {
  errorMessage.value = "";
  errors.current_password = "";
  errors.password = "";
  errors.password_confirmation = "";
};

const resetPasswordForm = () => {
  passwordForm.current_password = "";
  passwordForm.password = "";
  passwordForm.password_confirmation = "";
};

const handleUpdatePassword = async () => {
  savingPassword.value = true;
  resetErrors();

  try {
    await updateProfilePassword({
      current_password: passwordForm.current_password,
      password: passwordForm.password,
      password_confirmation: passwordForm.password_confirmation,
    });

    resetPasswordForm();

    toast.success("Password updated", "Your password was updated successfully.");
  } catch (error: any) {
    errorMessage.value =
      error.response?.data?.message || error.message || "Failed to update password";

    const validationErrors = error.response?.data?.errors || error.errors;

    if (validationErrors) {
      errors.current_password = validationErrors.current_password?.[0] || "";
      errors.password = validationErrors.password?.[0] || "";
      errors.password_confirmation = validationErrors.password_confirmation?.[0] || "";
    }

    toast.error("Update failed", errorMessage.value);
  } finally {
    savingPassword.value = false;
  }
};
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Account Settings"
      subtitle="Manage your security and account preferences."
    />

    <AlertMessage
      v-if="errorMessage"
      type="error"
      title="Settings error"
      :message="errorMessage"
    />

    <div class="grid gap-6 lg:grid-cols-3">
      <AppCard title="Settings Menu" subtitle="Manage account preferences.">
        <div class="space-y-3">
          <div class="flex items-center gap-3 rounded-2xl bg-muted/50 p-4">
            <AppBadge variant="default" shape="square" size="md">
              <Settings class="h-5 w-5" />
            </AppBadge>

            <div>
              <p class="text-sm font-bold text-card-foreground">Account</p>
              <p class="text-xs text-muted-foreground">General settings</p>
            </div>
          </div>

          <div class="flex items-center gap-3 rounded-2xl bg-muted/50 p-4">
            <AppBadge variant="warning" shape="square" size="md">
              <LockKeyhole class="h-5 w-5" />
            </AppBadge>

            <div>
              <p class="text-sm font-bold text-card-foreground">Security</p>
              <p class="text-xs text-muted-foreground">Password settings</p>
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard
        title="Update Password"
        subtitle="Change your account password."
        class="lg:col-span-2"
      >
        <form class="space-y-5" @submit.prevent="handleUpdatePassword">
          <AppInput
            v-model="passwordForm.current_password"
            label="Current Password"
            type="password"
            placeholder="Enter current password"
            :error="errors.current_password"
          />

          <div class="grid gap-5 md:grid-cols-2">
            <AppInput
              v-model="passwordForm.password"
              label="New Password"
              type="password"
              placeholder="Enter new password"
              :error="errors.password"
            />

            <AppInput
              v-model="passwordForm.password_confirmation"
              label="Confirm Password"
              type="password"
              placeholder="Confirm new password"
              :error="errors.password_confirmation"
            />
          </div>

          <div class="flex justify-end border-t border-border pt-5">
            <AppButton type="submit" :loading="savingPassword">
              <Save class="h-4 w-4" />
              Update Password
            </AppButton>
          </div>
        </form>
      </AppCard>
    </div>
  </div>
</template>

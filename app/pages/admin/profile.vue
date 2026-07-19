<script setup lang="ts">
import { KeyRound, Mail, RefreshCcw, Save, ShieldCheck, User } from "lucide-vue-next";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth", "permission"],
  permission: "profile.view",
  title: "Profile",
});

const { getProfile, updateProfile, updatePassword } = useProfile();
const authStore = useAuthStore();
const toast = useToast();
const notificationStore = useNotificationStore();

const loading = ref(false);
const profileSaving = ref(false);
const passwordSaving = ref(false);
const errorMessage = ref("");

const profileForm = reactive({
  name: "",
  email: "",
});

const passwordForm = reactive({
  current_password: "",
  password: "",
  password_confirmation: "",
});

const profileErrors = reactive<Record<string, string>>({
  name: "",
  email: "",
});

const passwordErrors = reactive<Record<string, string>>({
  current_password: "",
  password: "",
  password_confirmation: "",
});

const initials = computed(() => {
  const name = profileForm.name || authStore.user?.name || "User";

  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
});

const userRoles = computed(() => {
  return authStore.user?.roles || [];
});

const resetProfileErrors = () => {
  profileErrors.name = "";
  profileErrors.email = "";
};

const resetPasswordErrors = () => {
  passwordErrors.current_password = "";
  passwordErrors.password = "";
  passwordErrors.password_confirmation = "";
};

const fetchProfile = async (options: { force?: boolean } = {}) => {
  loading.value = true;
  errorMessage.value = "";

  try {
    // Use cached auth user when available unless force-refresh requested
    if (authStore.user && !options.force) {
      profileForm.name = authStore.user.name || "";
      profileForm.email = authStore.user.email || "";
      loading.value = false;
      return;
    }

    const response = await getProfile();

    profileForm.name = response.data.user.name;
    profileForm.email = response.data.user.email;

    authStore.user = response.data.user as any;

    if (import.meta.client) {
      localStorage.setItem("auth_user", JSON.stringify(response.data.user));
    }
  } catch (error: any) {
    errorMessage.value =
      error.response?.data?.message || error.message || "Failed to load profile";

    toast.error("Profile failed", errorMessage.value);
  } finally {
    loading.value = false;
  }
};

const handleUpdateProfile = async () => {
  profileSaving.value = true;
  errorMessage.value = "";
  resetProfileErrors();

  try {
    const response = await updateProfile({
      name: profileForm.name,
      email: profileForm.email,
    });

    authStore.user = response.data.user as any;

    if (import.meta.client) {
      localStorage.setItem("auth_user", JSON.stringify(response.data.user));
    }

    await notificationStore.refreshNotifications();

    toast.success(
      "Profile updated",
      "Your profile information was updated successfully."
    );
  } catch (error: any) {
    errorMessage.value =
      error.response?.data?.message || error.message || "Failed to update profile";

    toast.error("Update failed", errorMessage.value);

    const validationErrors = error.response?.data?.errors || error.errors;

    if (validationErrors) {
      profileErrors.name = validationErrors.name?.[0] || "";
      profileErrors.email = validationErrors.email?.[0] || "";
    }
  } finally {
    profileSaving.value = false;
  }
};

const resetPasswordForm = () => {
  passwordForm.current_password = "";
  passwordForm.password = "";
  passwordForm.password_confirmation = "";
};

const handleUpdatePassword = async () => {
  passwordSaving.value = true;
  errorMessage.value = "";
  resetPasswordErrors();

  try {
    await updatePassword({
      current_password: passwordForm.current_password,
      password: passwordForm.password,
      password_confirmation: passwordForm.password_confirmation,
    });

    resetPasswordForm();

    await notificationStore.refreshNotifications();

    toast.success("Password updated", "Your password was updated successfully.");
  } catch (error: any) {
    errorMessage.value =
      error.response?.data?.message || error.message || "Failed to update password";

    toast.error("Password update failed", errorMessage.value);

    const validationErrors = error.response?.data?.errors || error.errors;

    if (validationErrors) {
      passwordErrors.current_password = validationErrors.current_password?.[0] || "";
      passwordErrors.password = validationErrors.password?.[0] || "";
      passwordErrors.password_confirmation =
        validationErrors.password_confirmation?.[0] || "";
    }
  } finally {
    passwordSaving.value = false;
  }
};

onMounted(async () => {
  await fetchProfile();
});
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Profile"
      subtitle="Manage your account information, roles, and password security."
    >
      <template #actions>
        <AppButton
          variant="secondary"
          :loading="loading"
          @click="() => fetchProfile({ force: true })"
        >
          <RefreshCcw class="h-4 w-4" />
          Refresh
        </AppButton>
      </template>
    </PageHeader>

    <AlertMessage
      v-if="errorMessage"
      type="error"
      title="Profile error"
      :message="errorMessage"
    />

    <template v-if="loading">
      <div class="grid gap-6 lg:grid-cols-3">
        <div class="rounded-3xl border border-border bg-card p-6 shadow-sm lg:col-span-1">
          <div class="mx-auto h-24 w-24 animate-pulse rounded-3xl bg-muted" />
          <div class="mx-auto mt-5 h-5 w-36 animate-pulse rounded-full bg-muted" />
          <div class="mx-auto mt-3 h-4 w-48 animate-pulse rounded-full bg-muted" />
        </div>

        <div class="rounded-3xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <div class="h-5 w-44 animate-pulse rounded-full bg-muted" />

          <div class="mt-6 grid gap-5 md:grid-cols-2">
            <div class="h-12 animate-pulse rounded-2xl bg-muted" />
            <div class="h-12 animate-pulse rounded-2xl bg-muted" />
          </div>

          <div class="mt-6 flex justify-end border-t border-border pt-5">
            <div class="h-10 w-32 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Profile Summary -->
        <AppCard class="lg:col-span-1">
          <div class="flex flex-col items-center text-center">
            <div
              class="flex h-24 w-24 items-center justify-center rounded-3xl bg-foreground text-3xl font-black text-background shadow-lg shadow-slate-900/10"
            >
              {{ initials }}
            </div>

            <h2 class="mt-5 text-xl font-bold text-card-foreground">
              {{ profileForm.name || "User" }}
            </h2>

            <div class="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Mail class="h-4 w-4" />
              <span class="max-w-[220px] truncate">
                {{ profileForm.email || "-" }}
              </span>
            </div>

            <div class="mt-5 flex flex-wrap justify-center gap-2">
              <AppBadge v-for="role in userRoles" :key="role" variant="info">
                {{ role }}
              </AppBadge>

              <AppBadge v-if="userRoles.length === 0" variant="default">
                No Role
              </AppBadge>
            </div>

            <div
              class="mt-6 w-full rounded-3xl border border-border bg-muted/50 p-4 text-left"
            >
              <div class="flex items-center gap-3">
                <AppBadge variant="success" shape="square" size="sm">
                  <ShieldCheck class="h-4 w-4" />
                </AppBadge>

                <div>
                  <p class="text-sm font-bold text-card-foreground">Account Security</p>
                  <p class="mt-1 text-xs text-muted-foreground">
                    Keep your email and password updated.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </AppCard>

        <!-- Update Profile -->
        <AppCard
          title="Profile Information"
          subtitle="Update your name and email address."
          class="lg:col-span-2"
        >
          <form class="space-y-5" @submit.prevent="handleUpdateProfile">
            <div class="grid gap-5 md:grid-cols-2">
              <AppInput
                v-model="profileForm.name"
                label="Name"
                placeholder="Enter your name"
                :error="profileErrors.name"
              />

              <AppInput
                v-model="profileForm.email"
                label="Email"
                type="email"
                placeholder="Enter your email"
                :error="profileErrors.email"
              />
            </div>

            <div class="flex justify-end border-t border-border pt-5">
              <AppButton
                type="submit"
                variant="primary"
                :loading="profileSaving"
                :disabled="!authStore.hasPermission('profile.update')"
              >
                <Save class="h-4 w-4" />
                Save Changes
              </AppButton>
            </div>
          </form>
        </AppCard>
      </div>

      <!-- Update Password -->
      <AppCard
        title="Change Password"
        subtitle="Update your password securely. Use a strong password to protect your account."
      >
        <form class="space-y-5" @submit.prevent="handleUpdatePassword">
          <div class="grid gap-5 md:grid-cols-3">
            <AppInput
              v-model="passwordForm.current_password"
              label="Current Password"
              type="password"
              placeholder="Current password"
              :error="passwordErrors.current_password"
            />

            <AppInput
              v-model="passwordForm.password"
              label="New Password"
              type="password"
              placeholder="New password"
              :error="passwordErrors.password"
            />

            <AppInput
              v-model="passwordForm.password_confirmation"
              label="Confirm Password"
              type="password"
              placeholder="Confirm password"
              :error="passwordErrors.password_confirmation"
            />
          </div>

          <div class="flex justify-end border-t border-border pt-5">
            <AppButton
              type="submit"
              variant="primary"
              :loading="passwordSaving"
              :disabled="!authStore.hasPermission('profile.update')"
            >
              <KeyRound class="h-4 w-4" />
              Update Password
            </AppButton>
          </div>
        </form>
      </AppCard>
    </template>
  </div>
</template>

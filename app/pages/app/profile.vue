<script setup lang="ts">
import { Mail, Save, ShieldCheck, User } from "lucide-vue-next";

definePageMeta({
  layout: "user",
  middleware: ["auth", "permission"],
  permission: "profile.view",
  title: "Profile",
});

const authStore = useAuthStore();
const { updateProfile } = useProfile();
const toast = useToast();

const saving = ref(false);
const errorMessage = ref("");

const form = reactive({
  name: "",
  email: "",
});

const errors = reactive<Record<string, string>>({
  name: "",
  email: "",
});

const user = computed(() => authStore.user);

const resetErrors = () => {
  errorMessage.value = "";
  errors.name = "";
  errors.email = "";
};

const fillForm = () => {
  form.name = user.value?.name || "";
  form.email = user.value?.email || "";
};

const handleSubmit = async () => {
  saving.value = true;
  resetErrors();

  try {
    await updateProfile({
      name: form.name,
      email: form.email,
    });

    await authStore.fetchUser();

    toast.success("Profile updated", "Your profile information was updated.");
  } catch (error: any) {
    errorMessage.value =
      error.response?.data?.message || error.message || "Failed to update profile";

    const validationErrors = error.response?.data?.errors || error.errors;

    if (validationErrors) {
      errors.name = validationErrors.name?.[0] || "";
      errors.email = validationErrors.email?.[0] || "";
    }

    toast.error("Update failed", errorMessage.value);
  } finally {
    saving.value = false;
  }
};

onMounted(fillForm);

watch(user, fillForm);
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="My Profile" subtitle="Manage your personal account information." />

    <AlertMessage
      v-if="errorMessage"
      type="error"
      title="Profile error"
      :message="errorMessage"
    />

    <div class="grid gap-6 lg:grid-cols-3">
      <AppCard title="Account Summary" subtitle="Your current account information.">
        <div class="space-y-4">
          <div class="flex items-center gap-3 rounded-2xl bg-muted/50 p-4">
            <AppBadge variant="default" shape="square" size="md">
              <User class="h-5 w-5" />
            </AppBadge>

            <div class="min-w-0">
              <p class="truncate text-sm font-bold text-card-foreground">
                {{ user?.name || "-" }}
              </p>
              <p class="text-xs text-muted-foreground">Full name</p>
            </div>
          </div>

          <div class="flex items-center gap-3 rounded-2xl bg-muted/50 p-4">
            <AppBadge variant="info" shape="square" size="md">
              <Mail class="h-5 w-5" />
            </AppBadge>

            <div class="min-w-0">
              <p class="truncate text-sm font-bold text-card-foreground">
                {{ user?.email || "-" }}
              </p>
              <p class="text-xs text-muted-foreground">Email address</p>
            </div>
          </div>

          <div class="flex items-center gap-3 rounded-2xl bg-muted/50 p-4">
            <AppBadge variant="success" shape="square" size="md">
              <ShieldCheck class="h-5 w-5" />
            </AppBadge>

            <div>
              <p class="text-sm font-bold text-card-foreground">Verified</p>
              <p class="text-xs text-muted-foreground">Account status</p>
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard
        title="Edit Profile"
        subtitle="Update your personal details."
        class="lg:col-span-2"
      >
        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div class="grid gap-5 md:grid-cols-2">
            <AppInput
              v-model="form.name"
              label="Name"
              placeholder="Your name"
              :error="errors.name"
            />

            <AppInput
              v-model="form.email"
              label="Email"
              type="email"
              placeholder="your@email.com"
              :error="errors.email"
            />
          </div>

          <div class="flex justify-end border-t border-border pt-5">
            <AppButton type="submit" :loading="saving">
              <Save class="h-4 w-4" />
              Save Changes
            </AppButton>
          </div>
        </form>
      </AppCard>
    </div>
  </div>
</template>

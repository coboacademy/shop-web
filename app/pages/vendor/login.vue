<script setup lang="ts">
definePageMeta({
  layout: "auth",
  middleware: ["guest"],
  title: "Vendor Login",
});

const authStore = useAuthStore();
const toast = useToast();

const form = reactive({
  email: "",
  password: "",
});

const generalError = ref("");
const errors = reactive<Record<string, string>>({ email: "", password: "" });

const clearErrors = () => {
  generalError.value = "";
  errors.email = "";
  errors.password = "";
};

const handleLogin = async () => {
  clearErrors();

  try {
    const redirectTo = await authStore.login({
      email: form.email,
      password: form.password,
    });

    if (!authStore.user?.is_email_verified) {
      await navigateTo("/email-verification");
      return;
    }

    if (!redirectTo.startsWith("/vendor")) {
      toast.warning(
        "No vendor access",
        "This account is not assigned to the vendor dashboard."
      );
    }

    await navigateTo(redirectTo || "/vendor/dashboard");
  } catch (error: any) {
    generalError.value = error.message || "Login failed";

    if (error.errors) {
      errors.email = error.errors.email?.[0] || "";
      errors.password = error.errors.password?.[0] || "";
    }
  }
};
</script>

<template>
  <AuthCard title="Vendor sign in" subtitle="Sign in to access your vendor dashboard">
    <div
      v-if="generalError"
      class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ generalError }}
    </div>

    <form class="space-y-5" @submit.prevent="handleLogin">
      <AuthInput
        v-model="form.email"
        label="Email address"
        type="email"
        :error="errors.email"
        required
      />

      <AuthInput
        v-model="form.password"
        label="Password"
        type="password"
        :error="errors.password"
        required
      />

      <AuthButton label="Sign In" :loading="authStore.loading" variant="primary" />
    </form>

    <div class="mt-6 text-center text-sm text-slate-600">
      Want to become a vendor?
      <NuxtLink to="/vendor/register" class="font-semibold text-blue-600 hover:text-blue-700">
        Create vendor account
      </NuxtLink>
    </div>
  </AuthCard>
</template>

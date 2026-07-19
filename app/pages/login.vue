<script setup lang="ts">
definePageMeta({
  layout: "public",
  middleware: "guest",
  title: "Login",
});

const authStore = useAuthStore();

const form = reactive({
  email: "",
  password: "",
});

const generalError = ref("");
const errors = reactive<Record<string, string>>({
  email: "",
  password: "",
});

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

    await navigateTo(redirectTo || "/");
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
  <AuthCard
    title="Sign in to your account"
    subtitle="Enter your email and password to access your dashboard."
  >
    <div
      v-if="generalError"
      class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
    >
      {{ generalError }}
    </div>

    <form class="space-y-5" @submit.prevent="handleLogin">
      <AuthInput
        v-model="form.email"
        label="Email address"
        type="email"
        placeholder="Enter your email"
        :error="errors.email"
        required
      />

      <AuthInput
        v-model="form.password"
        label="Password"
        type="password"
        placeholder="Enter your password"
        :error="errors.password"
        required
      />

      <div class="flex items-center justify-between text-sm">
        <NuxtLink
          to="/forgot-password"
          class="font-medium text-blue-600 hover:text-blue-700"
        >
          Forgot password?
        </NuxtLink>
      </div>

      <AuthButton label="Sign In" :loading="authStore.loading" variant="primary" />
    </form>

    <div class="mt-6 text-center text-sm text-slate-600">
      Don’t have an account?
      <NuxtLink to="/register" class="font-semibold text-blue-600 hover:text-blue-700">
        Create account
      </NuxtLink>
    </div>
  </AuthCard>
</template>

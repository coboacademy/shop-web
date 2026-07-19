<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest',
  title: 'Register',
})

const auth = useAuth()

const form = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const generalError = ref('')
const errors = reactive<Record<string, string>>({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const clearErrors = () => {
  generalError.value = ''
  errors.name = ''
  errors.email = ''
  errors.password = ''
  errors.password_confirmation = ''
}

const handleRegister = async () => {
  clearErrors()

  try {
    await auth.register({
      name: form.name,
      email: form.email,
      password: form.password,
      password_confirmation: form.password_confirmation,
    })

    await navigateTo('/email-verification')
  } catch (error: any) {
    generalError.value = error.message || 'Registration failed'

    if (error.errors) {
      errors.name = error.errors.name?.[0] || ''
      errors.email = error.errors.email?.[0] || ''
      errors.password = error.errors.password?.[0] || ''
      errors.password_confirmation = error.errors.password_confirmation?.[0] || ''
    }
  }
}
</script>

<template>
  <AuthCard
    title="Create your account"
    subtitle="Set up your account to start using your admin dashboard."
  >
    <div v-if="generalError" class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
      {{ generalError }}
    </div>

    <form class="space-y-5" @submit.prevent="handleRegister">
      <AuthInput
        v-model="form.name"
        label="Full name"
        type="text"
        placeholder="Enter your full name"
        :error="errors.name"
        required
      />

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
        placeholder="Create password"
        :error="errors.password"
        required
      />

      <AuthInput
        v-model="form.password_confirmation"
        label="Confirm password"
        type="password"
        placeholder="Confirm password"
        :error="errors.password_confirmation"
        required
      />

      <AuthButton
        label="Create Account"
        :loading="auth.loading.value"
        variant="success"
      />
    </form>

    <div class="mt-6 text-center text-sm text-slate-600">
      Already have an account?
      <NuxtLink to="/login" class="font-semibold text-blue-600 hover:text-blue-700">
        Sign in
      </NuxtLink>
    </div>
  </AuthCard>
</template>
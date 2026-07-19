<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest',
  title: 'Reset Password',
})

const route = useRoute()
const { resetPassword } = usePasswordReset()
const toast = useToast()

const loading = ref(false)
const successMessage = ref('')
const generalError = ref('')

const form = reactive({
  token: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const errors = reactive<Record<string, string>>({
  token: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const resetErrors = () => {
  generalError.value = ''
  successMessage.value = ''
  errors.token = ''
  errors.email = ''
  errors.password = ''
  errors.password_confirmation = ''
}

onMounted(() => {
  form.token = String(route.query.token || '')
  form.email = String(route.query.email || '')
})

const handleSubmit = async () => {
  loading.value = true
  resetErrors()

  try {
    const response = await resetPassword({
      token: form.token,
      email: form.email,
      password: form.password,
      password_confirmation: form.password_confirmation,
    })

    successMessage.value = response.message
    toast.success('Password reset', response.message)

    setTimeout(async () => {
      await navigateTo('/login')
    }, 1200)
  } catch (error: any) {
    generalError.value = error.message || 'Failed to reset password'
    toast.error('Reset failed', generalError.value)

    if (error.errors) {
      errors.token = error.errors.token?.[0] || ''
      errors.email = error.errors.email?.[0] || ''
      errors.password = error.errors.password?.[0] || ''
      errors.password_confirmation = error.errors.password_confirmation?.[0] || ''
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthCard
    title="Reset password"
    subtitle="Create a new password for your account."
  >
    <div
      v-if="successMessage"
      class="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/50 dark:text-green-300"
    >
      {{ successMessage }}
    </div>

    <div
      v-if="generalError"
      class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
    >
      {{ generalError }}
    </div>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <AuthInput
        v-model="form.email"
        label="Email Address"
        type="email"
        placeholder="Enter your email"
        :error="errors.email"
        required
      />

      <AuthInput
        v-model="form.password"
        label="New Password"
        type="password"
        placeholder="Enter new password"
        :error="errors.password"
        required
      />

      <AuthInput
        v-model="form.password_confirmation"
        label="Confirm New Password"
        type="password"
        placeholder="Confirm new password"
        :error="errors.password_confirmation"
        required
      />

      <p v-if="errors.token" class="text-sm text-red-600">
        {{ errors.token }}
      </p>

      <AuthButton
        label="Reset Password"
        :loading="loading"
        variant="primary"
      />
    </form>

    <div class="mt-6 text-center text-sm text-slate-600">
      Back to
      <NuxtLink to="/login" class="font-semibold text-blue-600 hover:text-blue-700">
        Sign in
      </NuxtLink>
    </div>
  </AuthCard>
</template>
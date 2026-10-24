<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest',
  title: 'Vendor Register',
})

const api = useApi()
const authStore = useAuthStore()

const form = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const generalError = ref('')
const loading = ref(false)
const errors = reactive<Record<string, string>>({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const clearErrors = () => {
  generalError.value = ''
  Object.keys(errors).forEach((key) => {
    errors[key] = ''
  })
}

const handleRegister = async () => {
  clearErrors()
  loading.value = true

  try {
    const response = await api.post('/vendor/register', {
      name: form.name,
      email: form.email,
      password: form.password,
      password_confirmation: form.password_confirmation,
    })

    const data = response.data?.data
    const token = data?.token || data?.access_token || response.data?.token
    const user = data?.user || response.data?.user

    if (token && user) {
      authStore.setAuth(user, token)
    } else if (!authStore.isAuthenticated) {
      await authStore.login({
        email: form.email,
        password: form.password,
      })
    }

    await navigateTo('/email-verification')
  } catch (error: any) {
    generalError.value = error.response?.data?.message || 'Vendor registration failed'

    const validationErrors = error.response?.data?.errors || {}
    Object.keys(validationErrors).forEach((key) => {
      errors[key] = validationErrors[key]?.[0] || ''
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthCard
    title="Register your vendor account"
    subtitle="Create your user account first. After email verification, you'll complete your business details."
  >
    <div
      v-if="generalError"
      class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
    >
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
        placeholder="vendor@example.com"
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

      <AuthButton label="Create Vendor Account" :loading="loading" variant="success" />
    </form>

    <div class="mt-6 text-center text-sm text-slate-600">
      Already have a vendor account?
      <NuxtLink to="/vendor/login" class="font-semibold text-blue-600 hover:text-blue-700">
        Sign in
      </NuxtLink>
    </div>
  </AuthCard>
</template>

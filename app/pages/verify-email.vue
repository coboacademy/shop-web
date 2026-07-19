<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  title: 'Verify Email',
})

const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()
const { verifyEmailByUrl, resendVerificationEmail } = useEmailVerification()

const loading = ref(false)
const resending = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const signedUrl = computed(() => {
  return String(route.query.url || '')
})

const handleVerify = async () => {
  if (!signedUrl.value) {
    errorMessage.value = 'Verification link is missing.'
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await verifyEmailByUrl(signedUrl.value)

    successMessage.value = response.message
    toast.success('Email verified', response.message)

    if (authStore.token) {
      await authStore.fetchUser()
    }

    setTimeout(async () => {
      await navigateTo(authStore.redirectPath())
    }, 1200)
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to verify email'
    toast.error('Verification failed', errorMessage.value)
  } finally {
    loading.value = false
  }
}

const handleResend = async () => {
  resending.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await resendVerificationEmail()
    successMessage.value = response.message
    toast.success('Verification email sent', response.message)
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to resend email'
    toast.error('Resend failed', errorMessage.value)
  } finally {
    resending.value = false
  }
}

onMounted(async () => {
  if (signedUrl.value) {
    await handleVerify()
  }
})
</script>

<template>
  <AuthCard
    title="Verify your email"
    subtitle="Confirm your email address to activate your account."
  >
    <div
      v-if="successMessage"
      class="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/50 dark:text-green-300"
    >
      {{ successMessage }}
    </div>

    <div
      v-if="errorMessage"
      class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
    >
      {{ errorMessage }}
    </div>

    <div class="space-y-4">
      <AuthButton
        v-if="signedUrl"
        label="Verify Email"
        :loading="loading"
        variant="primary"
        @click="handleVerify"
      />

      <AuthButton
        label="Resend Verification Email"
        :loading="resending"
        variant="success"
        @click="handleResend"
      />

      <div class="text-center text-sm text-slate-600">
        <NuxtLink to="/login" class="font-semibold text-blue-600 hover:text-blue-700">
          Back to login
        </NuxtLink>
      </div>
    </div>
  </AuthCard>
</template>

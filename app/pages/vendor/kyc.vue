<script setup lang="ts">
const api = useApi()
const authStore = useAuthStore()

const form = reactive({
  business_name: '',
  phone: '',
  description: '',
  website: '',
  country: '',
  province: '',
  city: '',
  address: '',
})

const generalError = ref('')
const errors = reactive<Record<string, string>>({
  business_name: '',
  phone: '',
  description: '',
  website: '',
  country: '',
  province: '',
  city: '',
  address: '',
})

const clearErrors = () => {
  generalError.value = ''
  Object.keys(errors).forEach((key) => {
    errors[key] = ''
  })
}

const handleKyc = async () => {
  clearErrors()

  try {
    await api.post('/vendor/kyc', {
      business_name: form.business_name,
      phone: form.phone,
      description: form.description,
      website: form.website,
      country: form.country,
      province: form.province,
      city: form.city,
      address: form.address,
    })

    await navigateTo('/vendor/dashboard')
  } catch (error: any) {
    generalError.value = error.response?.data?.message || 'Vendor KYC submission failed'

    const validationErrors = error.response?.data?.errors || {}
    Object.keys(validationErrors).forEach((key) => {
      errors[key] = validationErrors[key]?.[0] || ''
    })
  }
}
</script>

<template>
  <AuthCard
    title="Submit your vendor KYC"
    subtitle="Complete your business details so your vendor account can be reviewed."
  >
    <div
      v-if="generalError"
      class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
    >
      {{ generalError }}
    </div>

    <form class="space-y-5" @submit.prevent="handleKyc">
      <AuthInput
        v-model="form.business_name"
        label="Business name"
        type="text"
        placeholder="Rithy Technology"
        :error="errors.business_name"
        required
      />

      <AuthInput
        v-model="form.phone"
        label="Phone number"
        type="tel"
        placeholder="012345678"
        :error="errors.phone"
        required
      />

      <AuthInput
        v-model="form.description"
        label="Description"
        type="text"
        placeholder="Technology Store"
        :error="errors.description"
      />

      <AuthInput
        v-model="form.website"
        label="Website"
        type="url"
        placeholder="https://example.com"
        :error="errors.website"
      />

      <div class="grid gap-5 md:grid-cols-2">
        <AuthInput
          v-model="form.country"
          label="Country"
          type="text"
          placeholder="Cambodia"
          :error="errors.country"
          required
        />

        <AuthInput
          v-model="form.province"
          label="Province"
          type="text"
          placeholder="Phnom Penh"
          :error="errors.province"
          required
        />
      </div>

      <div class="grid gap-5 md:grid-cols-2">
        <AuthInput
          v-model="form.city"
          label="City"
          type="text"
          placeholder="Phnom Penh"
          :error="errors.city"
          required
        />

        <AuthInput
          v-model="form.address"
          label="Address"
          type="text"
          placeholder="Street 271"
          :error="errors.address"
          required
        />
      </div>

      <AuthButton label="Submit KYC" :loading="false" variant="primary" />
    </form>
  </AuthCard>
</template>

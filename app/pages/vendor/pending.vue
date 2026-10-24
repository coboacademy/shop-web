<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: ['auth', 'permission'],
  title: 'Vendor Pending Approval',
})

const authStore = useAuthStore()
const user = computed(() => authStore.user)

const statusText = computed(() => {
  const status = user.value?.status || 'pending'
  return status.toLowerCase() === 'approved' ? 'Approved' : 'Pending approval'
})
</script>

<template>
  <AuthCard
    title="Vendor account pending"
    :subtitle="`Your vendor account is currently ${statusText.toLowerCase()}. We will review it shortly.`"
  >
    <div class="space-y-5">
      <div class="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <p class="text-sm font-semibold uppercase tracking-wide">Status</p>
        <h2 class="mt-2 text-2xl font-bold">{{ statusText }}</h2>
        <p class="mt-3 text-sm leading-6">
          Your vendor registration is being reviewed. Once approved, you will be able to
          access your vendor dashboard and manage your storefront.
        </p>
      </div>

      <div class="rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p><span class="font-semibold text-card-foreground">Business:</span> {{ user?.business_name || user?.name || 'Vendor profile' }}</p>
        <p class="mt-2"><span class="font-semibold text-card-foreground">Email:</span> {{ user?.email || 'Not available' }}</p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row">
        <NuxtLink
          to="/vendor/login"
          class="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Back to login
        </NuxtLink>

        <button
          type="button"
          class="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-card-foreground hover:bg-muted"
          @click="authStore.logout()"
        >
          Sign out
        </button>
      </div>
    </div>
  </AuthCard>
</template>

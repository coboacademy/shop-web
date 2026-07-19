<script setup lang="ts">
import { Package, Settings, ShoppingBag, User } from "lucide-vue-next";

definePageMeta({
  layout: "user",
  middleware: ["auth", "permission"],
  permission: "account.view",
  title: "My Account",
});

const authStore = useAuthStore();

const user = computed(() => authStore.user);

const cards = [
  {
    title: "My Orders",
    subtitle: "View your order history and status.",
    to: "/app/orders",
    icon: Package,
    tone: "info",
  },
  {
    title: "My Profile",
    subtitle: "Manage your personal information.",
    to: "/app/profile",
    icon: User,
    tone: "success",
  },
  {
    title: "Account Settings",
    subtitle: "Update password and preferences.",
    to: "/app/settings",
    icon: Settings,
    tone: "warning",
  },
];
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      :title="`Welcome back, ${user?.name || 'User'}`"
      subtitle="Manage your orders, profile, and account settings."
    />

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard title="Orders" :value="0" subtitle="Total orders" tone="info">
        <template #badge>
          <AppBadge variant="info" shape="square" size="md">
            <ShoppingBag class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard title="Pending" :value="0" subtitle="Waiting for process" tone="warning">
        <template #badge>
          <AppBadge variant="warning" shape="square" size="md">
            <Package class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard title="Completed" :value="0" subtitle="Finished orders" tone="success">
        <template #badge>
          <AppBadge variant="success" shape="square" size="md">
            <ShoppingBag class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>

      <StatsCard title="Profile" value="Active" subtitle="Account status" tone="default">
        <template #badge>
          <AppBadge variant="default" shape="square" size="md">
            <User class="h-5 w-5" />
          </AppBadge>
        </template>
      </StatsCard>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <NuxtLink
        v-for="card in cards"
        :key="card.to"
        :to="card.to"
        class="rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
      >
        <AppBadge :variant="card.tone as any" shape="square" size="lg">
          <component :is="card.icon" class="h-6 w-6" />
        </AppBadge>

        <h3 class="mt-5 text-lg font-bold text-card-foreground">
          {{ card.title }}
        </h3>

        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          {{ card.subtitle }}
        </p>
      </NuxtLink>
    </div>
  </div>
</template>

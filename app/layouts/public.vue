<script setup lang="ts">
import { ArrowRight, Heart, ShoppingBag, ShoppingCart, UserRound } from "lucide-vue-next";

const authStore = useAuthStore();

const isCustomer = computed(
  () =>
    authStore.initialized &&
    authStore.isAuthenticated &&
    authStore.hasPermission("account.view") &&
    !authStore.hasPermission("dashboard.view") &&
    !authStore.hasRole("Vendor") &&
    !authStore.hasPermission("vendor.view"),
);
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <NuxtLink
          to="/"
          class="group inline-flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition group-hover:scale-105">
            <ShoppingBag class="h-5 w-5" />
          </span>
          <span class="text-lg font-bold tracking-tight">Cobo <span class="text-primary">Shop</span></span>
        </NuxtLink>

        <nav aria-label="Main navigation" class="hidden items-center gap-1 md:flex">
          <NuxtLink
            to="/"
            class="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Home
          </NuxtLink>
          <NuxtLink
            to="/products"
            class="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Shop
          </NuxtLink>
          <NuxtLink
            to="/about"
            class="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            About
          </NuxtLink>
          <NuxtLink
            v-if="isCustomer"
            to="/app/orders"
            class="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            My orders
          </NuxtLink>
          <NuxtLink
            v-if="isCustomer"
            to="/app/cart"
            class="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Cart
          </NuxtLink>
          <NuxtLink
            v-if="isCustomer"
            to="/app/wishlist"
            class="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Wishlist
          </NuxtLink>
        </nav>

        <div class="flex shrink-0 items-center gap-2">
          <NuxtLink
            to="/products"
            class="inline-flex h-10 items-center justify-center rounded-xl px-3 text-sm font-semibold text-foreground transition hover:bg-muted md:hidden"
          >
            Shop
          </NuxtLink>
          <NuxtLink
            v-if="isCustomer"
            to="/app/cart"
            aria-label="View cart"
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <ShoppingCart class="h-4 w-4" />
          </NuxtLink>
          <NuxtLink
            v-if="isCustomer"
            to="/app/wishlist"
            aria-label="View wishlist"
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Heart class="h-4 w-4" />
          </NuxtLink>
          <NuxtLink
            v-if="isCustomer"
            to="/app"
            class="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:px-4"
          >
            <UserRound class="h-4 w-4" />
            <span class="hidden sm:inline">My account</span>
            <ArrowRight class="hidden h-4 w-4 sm:block" />
          </NuxtLink>
          <template v-else>
            <NuxtLink
              to="/login"
              class="inline-flex h-10 items-center justify-center rounded-xl px-3 text-sm font-semibold text-foreground transition hover:bg-muted sm:px-4"
            >
              Sign in
            </NuxtLink>
            <NuxtLink
              to="/register"
              class="hidden h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:inline-flex"
            >
              Create account
            </NuxtLink>
          </template>
        </div>
      </div>
    </header>

    <main>
      <slot />
    </main>
  </div>
</template>

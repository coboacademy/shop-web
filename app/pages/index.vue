<script setup lang="ts">
import { ShoppingCart, Star, TrendingUp, Zap } from "lucide-vue-next";

definePageMeta({
  layout: "public",
  title: "Home",
});

const cartStore = useCartStore();
const toast = useToast();

const loading = ref(false);
const error = ref("");

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
    <!-- Hero Section -->
    <section
      class="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-4 py-20 sm:px-6 lg:px-8"
    >
      <div class="absolute inset-0 opacity-20">
        <div class="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-white/10"></div>
      </div>

      <div class="relative mx-auto max-w-7xl">
        <div class="text-center">
          <h1 class="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Welcome to Our Store
          </h1>

          <p class="mx-auto mt-4 max-w-2xl text-lg text-blue-100 sm:text-xl">
            Discover premium products with exclusive deals and fast delivery
          </p>

          <div class="mt-8 flex flex-wrap justify-center gap-4">
            <NuxtLink to="/products">
              <AppButton size="lg" class="bg-white text-blue-600 hover:bg-blue-50">
                <ShoppingCart class="h-5 w-5" />
                Shop Now
              </AppButton>
            </NuxtLink>

            <AppButton size="lg" variant="secondary" class="border-white text-white hover:bg-white/10">
              Learn More
            </AppButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section removed -->

    <!-- Products Section removed -->

    <!-- CTA Section -->
    <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div
        class="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center text-white sm:p-12"
      >
        <h2 class="text-3xl font-bold">Ready to Shop?</h2>
        <p class="mt-2 text-lg text-blue-100">
          Browse our complete collection and find what you're looking for
        </p>
        <NuxtLink to="/products" class="mt-6 inline-block">
          <AppButton size="lg" class="bg-white text-blue-600 hover:bg-blue-50">
            View All Products
          </AppButton>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

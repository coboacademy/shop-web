<script setup lang="ts">
import { ArrowUpRight, ShoppingBag } from "lucide-vue-next";
</script>

<template>
  <footer class="border-t border-slate-200 bg-white">
    <div class="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8 lg:py-14">
      <div>
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
        >
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB] text-white">
            <ShoppingBag class="h-5 w-5" aria-hidden="true" />
          </span>
          <span class="text-lg font-extrabold tracking-tight text-[#0F172A]">
            Cobo <span class="text-[#2563EB]">Shop</span>
          </span>
        </NuxtLink>
        <p class="mt-4 max-w-sm text-sm leading-6 text-[#64748B]">
          Discover products from Cobo Shop stores and manage your shopping in one place.
        </p>
      </div>

      <div>
        <h2 class="text-sm font-bold text-[#0F172A]">Explore</h2>
        <ul class="mt-3 space-y-2.5">
          <li>
            <NuxtLink
              to="/#categories"
              class="inline-flex items-center gap-1 text-sm text-[#64748B] transition hover:text-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            >
              Shop by category
              <ArrowUpRight class="h-3.5 w-3.5" aria-hidden="true" />
            </NuxtLink>
            <NuxtLink
              to="/#new-arrivals"
              class="inline-flex items-center gap-1 text-sm text-[#64748B] transition hover:text-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            >
              New arrivals
              <ArrowUpRight class="h-3.5 w-3.5" aria-hidden="true" />
            </NuxtLink>
          </li>
        </ul>
      </div>

      <div>
        <h2 class="text-sm font-bold text-[#0F172A]">Customer support</h2>
        <p class="mt-3 max-w-xs text-sm leading-6 text-[#64748B]">
          Need help with an order? Visit your account to review your orders.
        </p>
        <NuxtLink
          to="/app/orders"
          class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#2563EB] transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
        >
          Order support
          <ArrowUpRight class="h-3.5 w-3.5" aria-hidden="true" />
        </NuxtLink>
      </div>

      <div>
        <h2 class="text-sm font-bold text-[#0F172A]">Your account</h2>
        <ul class="mt-3 space-y-2.5">
          <li>
            <NuxtLink
              to="/login"
              class="text-sm text-[#64748B] transition hover:text-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            >
              Sign in
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              to="/register"
              class="text-sm text-[#64748B] transition hover:text-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            >
              Create account
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>

    <div class="border-t border-slate-100">
      <div class="mx-auto max-w-7xl px-4 py-4 text-xs text-[#64748B] sm:px-6 lg:px-8">
        © {{ new Date().getFullYear() }} Cobo Shop
      </div>
    </div>
  </footer>
</template>

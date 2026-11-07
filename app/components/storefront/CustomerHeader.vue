<script setup lang="ts">
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-vue-next";

const authStore = useAuthStore();
const route = useRoute();
const searchQuery = ref("");
const mobileMenuOpen = ref(false);
const accountMenu = ref<HTMLDetailsElement | null>(null);

const isCustomer = computed(
  () =>
    authStore.initialized &&
    authStore.isAuthenticated &&
    authStore.hasPermission("account.view") &&
    !authStore.hasPermission("dashboard.view") &&
    !authStore.hasRole("Vendor") &&
    !authStore.hasPermission("vendor.view"),
);

watch(
  () => route.query.search,
  (value) => {
    searchQuery.value = typeof value === "string" ? value.slice(0, 100) : "";
  },
  { immediate: true },
);

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false;
    if (accountMenu.value) accountMenu.value.open = false;
  },
);

const closeAccountMenu = () => {
  if (accountMenu.value) accountMenu.value.open = false;
};

const submitSearch = async () => {
  const search = searchQuery.value.trim();

  await navigateTo({
    path: "/products",
    query: search ? { search } : {},
  });
  mobileMenuOpen.value = false;
};
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex min-h-16 items-center gap-3 py-3 md:gap-6">
        <NuxtLink
          to="/"
          aria-label="Cobo Shop home"
          class="inline-flex shrink-0 items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
        >
          <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB] text-white">
            <ShoppingBag class="h-5 w-5" aria-hidden="true" />
          </span>
          <span class="text-lg font-extrabold tracking-tight text-[#0F172A]">
            Cobo <span class="text-[#2563EB]">Shop</span>
          </span>
        </NuxtLink>

        <form
          role="search"
          class="hidden min-w-0 flex-1 md:block md:max-w-xl"
          @submit.prevent="submitSearch"
        >
          <label class="relative block">
            <span class="sr-only">Search products</span>
            <Search
              class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
              aria-hidden="true"
            />
            <input
              v-model="searchQuery"
              type="search"
              name="search"
              maxlength="100"
              placeholder="Search products"
              class="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] pl-10 pr-4 text-sm text-[#0F172A] outline-none transition placeholder:text-[#64748B] focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </form>

        <div class="ml-auto flex shrink-0 items-center gap-2">
          <NuxtLink
            v-if="!authStore.isAuthenticated || isCustomer"
            to="/app/cart"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-[#0F172A] transition hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
          >
            <ShoppingCart class="h-4 w-4" aria-hidden="true" />
            <span class="hidden lg:inline">Cart</span>
          </NuxtLink>

          <details
            v-if="isCustomer"
            ref="accountMenu"
            class="group relative hidden sm:block"
          >
            <summary
              class="flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#0F172A] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden"
            >
              <UserRound class="h-4 w-4 text-[#2563EB]" aria-hidden="true" />
              <span>Account</span>
              <ChevronDown
                class="h-4 w-4 text-[#64748B] transition group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <nav
              aria-label="Customer account"
              class="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10"
            >
              <NuxtLink
                to="/app"
                class="block rounded-xl px-3 py-2.5 text-sm font-medium text-[#0F172A] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                @click="closeAccountMenu"
              >
                My account
              </NuxtLink>
              <NuxtLink
                to="/app/orders"
                class="block rounded-xl px-3 py-2.5 text-sm font-medium text-[#0F172A] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                @click="closeAccountMenu"
              >
                My orders
              </NuxtLink>
              <NuxtLink
                to="/app/wishlist"
                class="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[#0F172A] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                @click="closeAccountMenu"
              >
                <Heart class="h-4 w-4 text-[#64748B]" aria-hidden="true" />
                Wishlist
              </NuxtLink>
              <NuxtLink
                to="/app/profile"
                class="block rounded-xl px-3 py-2.5 text-sm font-medium text-[#0F172A] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                @click="closeAccountMenu"
              >
                Profile
              </NuxtLink>
            </nav>
          </details>

          <template v-else-if="!authStore.isAuthenticated">
            <NuxtLink
              to="/login"
              class="hidden h-10 items-center rounded-xl px-3 text-sm font-semibold text-[#0F172A] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 sm:inline-flex"
            >
              Sign in
            </NuxtLink>
            <NuxtLink
              to="/register"
              class="hidden h-10 items-center rounded-xl bg-[#2563EB] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 sm:inline-flex"
            >
              Create account
            </NuxtLink>
          </template>

          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-[#0F172A] transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 md:hidden"
            :aria-expanded="mobileMenuOpen"
            aria-controls="customer-mobile-menu"
            :aria-label="mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <X v-if="mobileMenuOpen" class="h-5 w-5" aria-hidden="true" />
            <Menu v-else class="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <form role="search" class="pb-3 md:hidden" @submit.prevent="submitSearch">
        <label class="relative block">
          <span class="sr-only">Search products</span>
          <Search
            class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
            aria-hidden="true"
          />
          <input
            v-model="searchQuery"
            type="search"
            name="search"
            maxlength="100"
            placeholder="Search products"
            class="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] pl-10 pr-4 text-sm text-[#0F172A] outline-none transition placeholder:text-[#64748B] focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </label>
      </form>
    </div>

    <nav
      aria-label="Product categories"
      class="border-t border-slate-100 bg-white"
    >
      <div class="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-4 py-2.5 text-sm sm:px-6 lg:px-8">
        <span class="shrink-0 font-semibold text-[#64748B]">Browse</span>
        <NuxtLink
          to="/products"
          class="shrink-0 rounded-lg px-3 py-1.5 font-semibold text-[#2563EB] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
        >
          All products
        </NuxtLink>
        <span class="hidden text-xs text-[#64748B] sm:inline">
          Category browsing will appear when public category listings are available.
        </span>
      </div>
    </nav>

    <nav
      v-if="mobileMenuOpen"
      id="customer-mobile-menu"
      aria-label="Mobile navigation"
      class="border-t border-slate-200 bg-white px-4 py-3 shadow-lg md:hidden"
    >
      <div class="mx-auto flex max-w-7xl flex-col gap-1">
        <NuxtLink
          to="/"
          class="rounded-xl px-3 py-2.5 text-sm font-semibold text-[#0F172A] hover:bg-slate-50"
          @click="mobileMenuOpen = false"
        >
          Home
        </NuxtLink>
        <NuxtLink
          to="/products"
          class="rounded-xl px-3 py-2.5 text-sm font-semibold text-[#0F172A] hover:bg-slate-50"
          @click="mobileMenuOpen = false"
        >
          All products
        </NuxtLink>
        <template v-if="isCustomer">
          <NuxtLink
            to="/app/orders"
            class="rounded-xl px-3 py-2.5 text-sm font-semibold text-[#0F172A] hover:bg-slate-50"
            @click="mobileMenuOpen = false"
          >
            My orders
          </NuxtLink>
          <NuxtLink
            to="/app/wishlist"
            class="rounded-xl px-3 py-2.5 text-sm font-semibold text-[#0F172A] hover:bg-slate-50"
            @click="mobileMenuOpen = false"
          >
            Wishlist
          </NuxtLink>
          <NuxtLink
            to="/app/profile"
            class="rounded-xl px-3 py-2.5 text-sm font-semibold text-[#0F172A] hover:bg-slate-50"
            @click="mobileMenuOpen = false"
          >
            Profile
          </NuxtLink>
        </template>
        <template v-else-if="!authStore.isAuthenticated">
          <NuxtLink
            to="/login"
            class="rounded-xl px-3 py-2.5 text-sm font-semibold text-[#0F172A] hover:bg-slate-50"
            @click="mobileMenuOpen = false"
          >
            Sign in
          </NuxtLink>
          <NuxtLink
            to="/register"
            class="rounded-xl px-3 py-2.5 text-sm font-semibold text-[#2563EB] hover:bg-blue-50"
            @click="mobileMenuOpen = false"
          >
            Create account
          </NuxtLink>
        </template>
      </div>
    </nav>
  </header>
</template>

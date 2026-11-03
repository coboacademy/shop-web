<script setup lang="ts">
import {
  Bell,
  ChevronDown,
  CreditCard,
  Heart,
  Home,
  LogOut,
  Menu,
  MoreHorizontal,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  User,
  X,
} from "lucide-vue-next";

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const route = useRoute();
const toast = useToast();

const mobileOpen = ref(false);
const loggingOut = ref(false);
const moreMenuOpen = ref(false);
const accountMenuOpen = ref(false);
const moreMenuRef = ref<HTMLElement | null>(null);
const accountMenuRef = ref<HTMLElement | null>(null);

const primaryNavigation = [
  {
    label: "Overview",
    to: "/app",
    icon: Home,
  },
  {
    label: "Orders",
    to: "/app/orders",
    icon: Package,
  },
];

const moreNavigation = [
  {
    label: "Payments",
    to: "/app/payments",
    icon: CreditCard,
  },
  {
    label: "Shipments",
    to: "/app/shipments",
    icon: Truck,
  },
  {
    label: "Cart",
    to: "/app/cart",
    icon: ShoppingCart,
  },
  {
    label: "Wishlist",
    to: "/app/wishlist",
    icon: Heart,
  },
];

const accountNavigation = [
  {
    label: "Profile",
    to: "/app/profile",
    icon: User,
  },
  {
    label: "Settings",
    to: "/app/settings",
    icon: Settings,
  },
];

const navigation = [
  ...primaryNavigation,
  {
    label: "Notifications",
    to: "/app/notifications",
    icon: Bell,
  },
  ...moreNavigation,
  ...accountNavigation,
];

const user = computed(() => authStore.user);
const unreadNotificationCount = computed(() => notificationStore.unreadCount);

const isActive = (path: string) => {
  return route.path === path;
};

const isSectionActive = (paths: string[]) =>
  paths.some((path) => route.path === path);

const closeHeaderMenus = () => {
  moreMenuOpen.value = false;
  accountMenuOpen.value = false;
};

const closeMobile = () => {
  mobileOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node | null;
  if (!target) return;
  if (moreMenuRef.value && !moreMenuRef.value.contains(target)) {
    moreMenuOpen.value = false;
  }
  if (accountMenuRef.value && !accountMenuRef.value.contains(target)) {
    accountMenuOpen.value = false;
  }
};

const handleEscape = (event: KeyboardEvent) => {
  if (event.key !== "Escape") return;
  closeHeaderMenus();
  mobileOpen.value = false;
};

const handleLogout = async () => {
  loggingOut.value = true;

  try {
    await authStore.logout();
    closeHeaderMenus();
    await navigateTo("/login");
  } catch (error: any) {
    toast.error("Logout failed", error.message || "Please try again.");
  } finally {
    loggingOut.value = false;
  }
};

watch(
  () => route.path,
  () => closeHeaderMenus(),
);

onMounted(() => {
  void notificationStore.fetchNotifications();
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleEscape);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleEscape);
});
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:bg-muted lg:hidden"
            @click="mobileOpen = true"
          >
            <Menu class="h-5 w-5" />
          </button>

          <NuxtLink to="/" class="text-lg font-bold text-card-foreground">
            Cobo Core
          </NuxtLink>
        </div>

        <nav aria-label="Account navigation" class="hidden items-center gap-2 lg:flex">
          <NuxtLink
            v-for="item in primaryNavigation"
            :key="item.to"
            :to="item.to"
            class="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition"
            :class="
              isActive(item.to)
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:bg-muted hover:text-card-foreground'
            "
          >
            <component :is="item.icon" class="h-4 w-4" />
            {{ item.label }}
          </NuxtLink>

          <div ref="moreMenuRef" class="relative">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              :class="
                isSectionActive(moreNavigation.map((item) => item.to))
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted hover:text-card-foreground'
              "
              aria-haspopup="true"
              :aria-expanded="moreMenuOpen"
              aria-controls="account-more-menu"
              @click="moreMenuOpen = !moreMenuOpen; accountMenuOpen = false"
            >
              <MoreHorizontal class="h-4 w-4" />
              More
              <ChevronDown
                class="h-4 w-4 transition-transform"
                :class="moreMenuOpen ? 'rotate-180' : ''"
              />
            </button>
            <Transition name="menu">
              <div
                v-if="moreMenuOpen"
                id="account-more-menu"
                class="absolute left-0 z-50 mt-2 w-60 rounded-2xl border border-border bg-card p-2 shadow-xl"
              >
                <NuxtLink
                  v-for="item in moreNavigation"
                  :key="item.to"
                  :to="item.to"
                  class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition"
                  :class="
                    isActive(item.to)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-card-foreground'
                  "
                  @click="closeHeaderMenus"
                >
                  <component :is="item.icon" class="h-4 w-4" />
                  {{ item.label }}
                </NuxtLink>
              </div>
            </Transition>
          </div>
        </nav>

        <div class="flex items-center gap-3">
          <NuxtLink
            to="/app/notifications"
            class="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-card-foreground"
            :class="isActive('/app/notifications') ? 'border-primary/40 text-primary' : ''"
            aria-label="Notifications"
          >
            <Bell class="h-5 w-5" />
            <span
              v-if="unreadNotificationCount > 0"
              class="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-5 text-destructive-foreground"
              :aria-label="`${unreadNotificationCount} unread notifications`"
            >
              {{ unreadNotificationCount > 99 ? "99+" : unreadNotificationCount }}
            </span>
          </NuxtLink>
          <div ref="accountMenuRef" class="relative">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-2xl border border-border bg-background p-1.5 pr-2.5 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:gap-3 sm:pr-3"
              aria-haspopup="true"
              :aria-expanded="accountMenuOpen"
              aria-controls="account-profile-menu"
              @click="accountMenuOpen = !accountMenuOpen; moreMenuOpen = false"
            >
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-sm font-bold text-background"
                aria-hidden="true"
              >
                {{ user?.name?.charAt(0)?.toUpperCase() || "U" }}
              </span>
              <span class="hidden min-w-0 sm:block">
                <span class="block max-w-32 truncate text-sm font-bold text-card-foreground">
                  {{ user?.name || "Account" }}
                </span>
                <span class="block max-w-32 truncate text-xs text-muted-foreground">
                  My account
                </span>
              </span>
              <ChevronDown
                class="h-4 w-4 text-muted-foreground transition-transform"
                :class="accountMenuOpen ? 'rotate-180' : ''"
              />
            </button>
            <Transition name="menu">
              <div
                v-if="accountMenuOpen"
                id="account-profile-menu"
                class="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-border bg-card p-2 shadow-xl"
              >
                <div class="border-b border-border px-3 py-3">
                  <p class="truncate text-sm font-bold text-card-foreground">
                    {{ user?.name || "User" }}
                  </p>
                  <p class="mt-1 truncate text-xs text-muted-foreground">
                    {{ user?.email || "-" }}
                  </p>
                </div>
                <nav aria-label="Account menu" class="space-y-1 py-2">
                  <NuxtLink
                    v-for="item in accountNavigation"
                    :key="item.to"
                    :to="item.to"
                    class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition"
                    :class="
                      isActive(item.to)
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-card-foreground'
                    "
                    @click="closeHeaderMenus"
                  >
                    <component :is="item.icon" class="h-4 w-4" />
                    {{ item.label }}
                  </NuxtLink>
                </nav>
                <div class="border-t border-border pt-2">
                  <button
                    type="button"
                    class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="loggingOut"
                    @click="handleLogout"
                  >
                    <LogOut class="h-4 w-4" />
                    {{ loggingOut ? "Signing out…" : "Sign out" }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </header>

    <Transition name="fade">
      <div
        v-if="mobileOpen"
        class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        @click="closeMobile"
      />
    </Transition>

    <Transition name="slide">
      <aside
        v-if="mobileOpen"
        class="fixed inset-y-0 left-0 z-50 w-80 border-r border-border bg-card shadow-2xl lg:hidden"
      >
        <div class="flex h-16 items-center justify-between border-b border-border px-5">
          <p class="text-base font-bold text-card-foreground">My Account</p>

          <button
            type="button"
            class="rounded-xl p-2 text-muted-foreground hover:bg-muted"
            @click="closeMobile"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <nav class="space-y-2 p-4">
          <NuxtLink
            v-for="item in navigation"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold"
            :class="
              isActive(item.to)
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:bg-muted hover:text-card-foreground'
            "
            @click="closeMobile"
          >
            <component :is="item.icon" class="h-5 w-5" />
            {{ item.label }}
          </NuxtLink>
        </nav>
      </aside>
    </Transition>

    <main class="mx-auto max-w-7xl px-4 py-8">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 180ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 220ms ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

.menu-enter-active,
.menu-leave-active {
  transition: opacity 140ms ease, transform 140ms ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>

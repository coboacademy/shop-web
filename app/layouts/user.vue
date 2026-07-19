<script setup lang="ts">
import { Bell, Home, LogOut, Menu, Package, Settings, User, X } from "lucide-vue-next";

const authStore = useAuthStore();
const route = useRoute();
const toast = useToast();

const mobileOpen = ref(false);
const loggingOut = ref(false);

const navigation = [
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

const user = computed(() => authStore.user);

const isActive = (path: string) => {
  return route.path === path;
};

const closeMobile = () => {
  mobileOpen.value = false;
};

const handleLogout = async () => {
  loggingOut.value = true;

  try {
    await authStore.logout();
    await navigateTo("/login");
  } catch (error: any) {
    toast.error("Logout failed", error.message || "Please try again.");
  } finally {
    loggingOut.value = false;
  }
};
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

        <nav class="hidden items-center gap-2 lg:flex">
          <NuxtLink
            v-for="item in navigation"
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
        </nav>

        <div class="flex items-center gap-3">
          <button
            type="button"
            class="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:bg-muted"
          >
            <Bell class="h-5 w-5" />
          </button>

          <div
            class="hidden items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2 sm:flex"
          >
            <div
              class="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-sm font-bold text-background"
            >
              {{ user?.name?.charAt(0)?.toUpperCase() || "U" }}
            </div>

            <div class="min-w-0">
              <p class="truncate text-sm font-bold text-card-foreground">
                {{ user?.name || "User" }}
              </p>
              <p class="truncate text-xs text-muted-foreground">
                {{ user?.email || "-" }}
              </p>
            </div>
          </div>

          <AppButton
            variant="secondary"
            size="sm"
            :loading="loggingOut"
            @click="handleLogout"
          >
            <LogOut class="h-4 w-4" />
            <span class="hidden sm:inline">Logout</span>
          </AppButton>
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
</style>

<script setup lang="ts">
import { LogOut, Settings, User } from "lucide-vue-next";

const authStore = useAuthStore();
const auth = useAuth();
const open = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const close = () => {
  open.value = false;
};

const toggleDropdown = () => {
  open.value = !open.value;
};

const handleClickOutside = (event: MouseEvent) => {
  if (!open.value) return;
  const target = event.target as Node | null;
  if (dropdownRef.value && target && !dropdownRef.value.contains(target)) {
    close();
  }
};

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') close();
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleEscape);
});

const handleLogout = async () => {
  const notificationStore = useNotificationStore();

  await auth.logout();

  notificationStore.clearLocal();

  open.value = false;
  await navigateTo("/login");
};
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <button
      class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-1.5 pr-3 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
      @click="toggleDropdown"
    >
      <div
        class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white dark:bg-white dark:text-slate-900"
      >
        {{ authStore.user?.name?.charAt(0)?.toUpperCase() || "U" }}
      </div>

      <div class="hidden text-left sm:block">
        <p class="max-w-28 truncate text-sm font-semibold text-slate-900 dark:text-white">
          {{ authStore.user?.name || "User" }}
        </p>
        <p class="max-w-28 truncate text-xs text-slate-500 dark:text-slate-400">
          {{ authStore.user?.role || "Account" }}
        </p>
      </div>
    </button>

    <div
      v-if="open"
      class="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900"
    >
      <div class="border-b border-slate-200 px-3 py-3 dark:border-slate-800">
        <p class="text-sm font-bold text-slate-900 dark:text-white">
          {{ authStore.user?.name || "User" }}
        </p>
        <p class="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
          {{ authStore.user?.email }}
        </p>
      </div>

      <div class="py-2">
        <NuxtLink
          to="/app/profile"
          class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          @click="close"
        >
          <User class="h-4 w-4" />
          Profile
        </NuxtLink>

        <NuxtLink
          to="/admin/settings"
          class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          @click="close"
        >
          <Settings class="h-4 w-4" />
          Settings
        </NuxtLink>

        <button
          class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
          @click="handleLogout"
        >
          <LogOut class="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  </div>
</template>

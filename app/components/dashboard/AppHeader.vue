<script setup lang="ts">
import { Menu, Search } from "lucide-vue-next";

defineProps<{
  sidebarCollapsed?: boolean;
  title: string;
  subtitle?: string;
}>();

const emit = defineEmits<{
  (e: "toggle-sidebar"): void;
  (e: "toggle-sidebar-collapse"): void;
  (e: "open-command-palette"): void;
}>();

const route = useRoute();

const pageTitle = computed(() => {
  const map: Record<string, string> = {
    "/admin/dashboard": "Dashboard",
    "/admin/rbac": "RBAC Overview",
    "/admin/users": "Users",
    "/admin/roles": "Roles",
    "/admin/permissions": "Permissions",
    "/admin/audit-logs": "Audit Logs",
    "/admin/menus": "Menus",
    "/admin/settings": "Settings",
    "/admin/products": "Products",
    "/admin/countries": "Countries",
    "/notifications": "Notifications",
    "/ui-components": "UI Components",
    "/app/profile": "Profile",
    "/app/settings": "Settings",
  };

  return map[route.path] || "Dashboard";
});
</script>

<template>
  <header
    class="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-xl transition-colors dark:border-slate-800 dark:bg-slate-950/80"
  >
    <div class="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-3">
        <button
          class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
          @click="emit('toggle-sidebar')"
        >
          <Menu class="h-5 w-5" />
        </button>

        <div>
          <h2 class="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
            {{ pageTitle }}
          </h2>

          <div class="mt-1 hidden sm:block">
            <AppBreadcrumbs />
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          class="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-500 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 md:inline-flex"
          @click="emit('open-command-palette')"
        >
          <Search class="h-4 w-4" />
          Search

          <kbd
            class="ml-2 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
          >
            Ctrl K
          </kbd>
        </button>
        <!-- mobile search -->
        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden"
          @click="emit('open-command-palette')"
        >
          <Search class="h-5 w-5" />
        </button>

        <NotificationDropdown />

        <ThemeToggle />

        <UserDropdown />
      </div>
    </div>
  </header>
</template>

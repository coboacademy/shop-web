<script setup lang="ts">
import { ChevronRight, Home } from "lucide-vue-next";
import type { MenuItem } from "~/composables/useMenu";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

const route = useRoute();
const menuStore = useMenuStore();

const flattenMenus = (menus: MenuItem[]): MenuItem[] => {
  return menus.flatMap((menu) => [
    menu,
    ...(menu.children ? flattenMenus(menu.children) : []),
  ]);
};

const normalizePath = (path?: string) => {
  if (!path) return "";

  return path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
};

const pageTitleMap: Record<string, string> = {
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

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const currentPath = normalizePath(route.path);
  const menus = flattenMenus(menuStore.menus);

  const currentMenu = menus.find((menu) => {
    return normalizePath(menu.route) === currentPath;
  });

  const items: BreadcrumbItem[] = [
    {
      label: "Dashboard",
      to: "/admin/dashboard",
    },
  ];

  if (currentPath === "/admin/dashboard") {
    return items;
  }

  if (currentMenu) {
    if (currentMenu.group && currentMenu.group !== "Main") {
      items.push({
        label: currentMenu.group,
      });
    }

    items.push({
      label: currentMenu.label,
    });

    return items;
  }

  items.push({
    label: (route.meta?.title as string) || pageTitleMap[currentPath] || "Page",
  });

  return items;
});
</script>

<template>
  <nav
    class="flex min-w-0 items-center gap-1 overflow-hidden text-sm text-muted-foreground"
    aria-label="Breadcrumb"
  >
    <NuxtLink
      to="/admin/dashboard"
      class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-card-foreground"
      aria-label="Go to dashboard"
    >
      <Home class="h-4 w-4" />
    </NuxtLink>

    <template v-for="(item, index) in breadcrumbs" :key="`${item.label}-${index}`">
      <ChevronRight v-if="index > 0" class="h-4 w-4 shrink-0 text-muted-foreground/50" />

      <NuxtLink
        v-if="item.to && index !== breadcrumbs.length - 1"
        :to="item.to"
        class="max-w-[140px] truncate rounded-xl px-2 py-1 font-semibold text-muted-foreground hover:bg-muted hover:text-card-foreground sm:max-w-none"
      >
        {{ item.label }}
      </NuxtLink>

      <span
        v-else
        class="max-w-[180px] truncate rounded-xl px-2 py-1 font-bold text-card-foreground sm:max-w-none"
      >
        {{ item.label }}
      </span>
    </template>
  </nav>
</template>

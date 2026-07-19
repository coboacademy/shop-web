<script setup lang="ts">
import {
  FileText,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  PanelTop,
  Search,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from "lucide-vue-next";

interface CommandItem {
  label: string;
  description: string;
  to: string;
  permission: string;
  icon: any;
  keywords: string[];
}

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const authStore = useAuthStore();

const search = ref("");

const openFirstResult = async () => {
  const first = filteredCommands.value[0];

  if (first) {
    await goTo(first);
  }
};

const commands: CommandItem[] = [
  {
    label: "Dashboard",
    description: "View system overview and statistics",
    to: "/admin/dashboard",
    permission: "dashboard.view",
    icon: LayoutDashboard,
    keywords: ["dashboard", "home", "overview", "stats"],
  },
  {
    label: "RBAC Overview",
    description: "View roles, permissions, and access summary",
    to: "/admin/rbac",
    permission: "role.view",
    icon: ShieldCheck,
    keywords: ["rbac", "access", "security", "overview"],
  },
  {
    label: "Users",
    description: "Manage users, status, roles, and verification",
    to: "/admin/users",
    permission: "user.view",
    icon: Users,
    keywords: ["users", "accounts", "members"],
  },
  {
    label: "Roles",
    description: "Manage roles and role permissions",
    to: "/admin/roles",
    permission: "role.view",
    icon: UserCog,
    keywords: ["roles", "groups", "access"],
  },
  {
    label: "Permissions",
    description: "Manage system permissions",
    to: "/admin/permissions",
    permission: "permission.view",
    icon: KeyRound,
    keywords: ["permissions", "rules", "abilities"],
  },
  {
    label: "Menus",
    description: "Manage sidebar menus and navigation",
    to: "/admin/menus",
    permission: "menu.view",
    icon: PanelTop,
    keywords: ["menus", "navigation", "sidebar"],
  },
  {
    label: "Audit Logs",
    description: "Review system activity and admin changes",
    to: "/admin/audit-logs",
    permission: "audit.view",
    icon: FileText,
    keywords: ["audit", "logs", "activity", "history"],
  },
  {
    label: "Profile",
    description: "Manage your account information",
    to: "/app/profile",
    permission: "profile.view",
    icon: LockKeyhole,
    keywords: ["profile", "account", "me"],
  },
  {
    label: "Settings",
    description: "Manage global system settings",
    to: "/admin/settings",
    permission: "setting.view",
    icon: Settings,
    keywords: ["settings", "config", "system"],
  },
];

const visibleCommands = computed(() => {
  return commands.filter((item) => authStore.hasPermission(item.permission));
});

const filteredCommands = computed(() => {
  const keyword = search.value.trim().toLowerCase();

  if (!keyword) {
    return visibleCommands.value;
  }

  return visibleCommands.value.filter((item) => {
    return (
      item.label.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword) ||
      item.keywords.some((word) => word.includes(keyword))
    );
  });
});

const close = () => {
  search.value = "";
  emit("close");
};

const navigating = ref(false);

const goTo = async (item: CommandItem) => {
  navigating.value = true;

  try {
    await navigateTo(item.to);
    close();
  } finally {
    navigating.value = false;
  }
};
watch(
  () => props.open,
  async (open) => {
    if (open) {
      await nextTick();

      const input = document.getElementById(
        "command-search-input"
      ) as HTMLInputElement | null;
      input?.focus();
    }
  }
);
</script>

<template>
  <span>
    {{ navigating ? "Navigating..." : "Use search to quickly navigate" }}
  </span>
  <Teleport to="body">
    <Transition name="command-overlay">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/60 px-4 pt-24 backdrop-blur-sm"
        @click.self="close"
      >
        <Transition name="command-panel" appear>
          <div
            class="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div
              class="flex items-center gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800"
            >
              <Search class="h-5 w-5 text-slate-400" />

              <input
                id="command-search-input"
                v-model="search"
                type="text"
                placeholder="Search pages or actions..."
                class="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                @keydown.enter.prevent="openFirstResult"
              />

              <button
                type="button"
                class="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                @click="close"
              >
                <X class="h-5 w-5" />
              </button>
            </div>

            <div class="max-h-[420px] overflow-y-auto p-3">
              <button
                v-for="item in filteredCommands"
                :key="item.to"
                type="button"
                class="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800"
                @click="goTo(item)"
              >
                <div
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <component :is="item.icon" class="h-5 w-5" />
                </div>

                <div class="min-w-0 flex-1">
                  <p class="text-sm font-bold text-slate-900 dark:text-white">
                    {{ item.label }}
                  </p>
                  <p class="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                    {{ item.description }}
                  </p>
                </div>

                <kbd
                  class="hidden rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 sm:inline-flex"
                >
                  Enter
                </kbd>
              </button>

              <div v-if="filteredCommands.length === 0" class="px-6 py-12 text-center">
                <Search class="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
                <p class="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
                  No results found
                </p>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Try searching for users, roles, permissions, menus, or settings.
                </p>
              </div>
            </div>

            <div
              class="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400"
            >
              <span>Use search to quickly navigate</span>
              <span>Esc to close</span>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.command-overlay-enter-active,
.command-overlay-leave-active {
  transition: opacity 0.18s ease;
}

.command-overlay-enter-from,
.command-overlay-leave-to {
  opacity: 0;
}

.command-panel-enter-active,
.command-panel-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.command-panel-enter-from,
.command-panel-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}
</style>

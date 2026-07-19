<script setup lang="ts">
import { Activity, ChevronDown, Gauge, PanelLeftClose, X } from "lucide-vue-next";
import type { MenuItem } from "~/composables/useMenu";

defineProps<{
  open: boolean;
  collapsed?: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "toggle-collapse"): void;
}>();

const route = useRoute();
const menuStore = useMenuStore();

const isActive = (href?: string | null) => {
  if (!href) return false;

  return route.path === href || route.path.startsWith(`${href}/`);
};

const visibleNavigation = computed<MenuItem[]>(() => {
  return Array.isArray(menuStore.menus) ? menuStore.menus : [];
});

const groupedNavigation = computed(() => {
  const groups: Record<string, MenuItem[]> = {};

  visibleNavigation.value.forEach((item) => {
    const group = item.group || "Main";

    if (!groups[group]) {
      groups[group] = [];
    }

    groups[group].push(item);
  });

  return Object.entries(groups).map(([label, items]) => ({
    label,
    items,
  }));
});

const hasNavigation = computed(() => groupedNavigation.value.length > 0);

const openGroups = ref<Record<string, boolean>>({
  Main: true,
  Management: true,
  Administration: true,
  Inventory: true,
  System: true,
  Account: true,
});

const toggleGroup = (label: string) => {
  openGroups.value[label] = !openGroups.value[label];
};

const isGroupOpen = (label: string) => {
  return openGroups.value[label] !== false;
};

onMounted(async () => {
  if (!menuStore.initialized) {
    await menuStore.fetchMenus();
  }
});
</script>

<template>
  <div>
    <!-- Mobile overlay -->
    <Transition name="sidebar-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        @click="emit('close')"
      />
    </Transition>

    <!-- Mobile sidebar -->
    <Transition name="sidebar-slide">
      <aside
        v-if="open"
        class="fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-border bg-card shadow-2xl lg:hidden"
      >
        <div class="flex h-16 items-center justify-between border-b border-border px-5">
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-background shadow-sm"
            >
              <Activity class="h-5 w-5" />
            </div>

            <div>
              <h1 class="text-sm font-bold text-card-foreground">Admin Panel</h1>
              <p class="text-xs text-muted-foreground">RBAC Management</p>
            </div>
          </div>

          <button
            type="button"
            class="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-card-foreground"
            aria-label="Close sidebar"
            @click="emit('close')"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div v-if="menuStore.loading" class="space-y-2 p-4">
            <div
              v-for="i in 6"
              :key="i"
              class="h-11 animate-pulse rounded-2xl bg-muted"
            />
          </div>

          <div v-else-if="!hasNavigation" class="p-4">
            <div class="rounded-2xl border border-border bg-muted/40 p-4 text-center">
              <p class="text-sm font-semibold text-card-foreground">No menu found</p>
              <p class="mt-1 text-xs text-muted-foreground">
                Menus will appear after they are assigned to your permissions.
              </p>
            </div>
          </div>

          <nav v-else class="space-y-5 p-4">
            <div v-for="group in groupedNavigation" :key="group.label" class="space-y-2">
              <div
                class="px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/70"
              >
                {{ group.label }}
              </div>

              <div class="space-y-1">
                <NuxtLink
                  v-for="item in group.items"
                  :key="item.id || item.route || item.name"
                  :to="item.route || '#'"
                  class="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold"
                  :class="
                    isActive(item.route)
                      ? 'bg-foreground text-background shadow-lg shadow-slate-900/10'
                      : 'text-muted-foreground hover:bg-muted hover:text-card-foreground'
                  "
                  @click="emit('close')"
                >
                  <MenuIcon
                    :name="item.name"
                    :label="item.label"
                    :route="item.route"
                    :group="item.group"
                    size="h-5 w-5"
                  />

                  <span>{{ item.label }}</span>
                </NuxtLink>
              </div>
            </div>
          </nav>
        </div>
      </aside>
    </Transition>

    <!-- Desktop sidebar -->
    <aside
      class="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:flex-col lg:border-r lg:border-border lg:bg-card"
      :class="collapsed ? 'lg:w-24' : 'lg:w-72'"
    >
      <!-- Header -->
      <div
        class="flex h-16 items-center border-b border-border px-4"
        :class="collapsed ? 'justify-center' : 'justify-between'"
      >
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background shadow-lg shadow-slate-900/10"
          >
            <Gauge class="h-5 w-5" />
          </div>

          <Transition name="sidebar-label">
            <div v-if="!collapsed" class="min-w-0">
              <h1 class="truncate text-base font-bold text-card-foreground">
                Admin Panel
              </h1>
              <p class="truncate text-xs text-muted-foreground">Enterprise RBAC</p>
            </div>
          </Transition>
        </div>

        <button
          v-if="!collapsed"
          type="button"
          class="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-card-foreground"
          aria-label="Collapse sidebar"
          @click="emit('toggle-collapse')"
        >
          <PanelLeftClose class="h-5 w-5" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div v-if="menuStore.loading" class="space-y-2 p-4">
          <div v-for="i in 6" :key="i" class="h-11 animate-pulse rounded-2xl bg-muted" />
        </div>

        <div v-else-if="!hasNavigation && !collapsed" class="p-4">
          <div class="rounded-2xl border border-border bg-muted/40 p-4 text-center">
            <p class="text-sm font-semibold text-card-foreground">No menu found</p>
            <p class="mt-1 text-xs text-muted-foreground">
              Check your permissions or menu settings.
            </p>
          </div>
        </div>

        <nav v-else class="p-4" :class="collapsed ? 'space-y-3' : 'space-y-5'">
          <div v-for="group in groupedNavigation" :key="group.label" class="space-y-2">
            <button
              v-if="!collapsed"
              type="button"
              class="flex w-full items-center justify-between px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/70 hover:text-card-foreground"
              @click="toggleGroup(group.label)"
            >
              <span>{{ group.label }}</span>

              <ChevronDown
                class="h-4 w-4 sidebar-chevron"
                :class="isGroupOpen(group.label) ? 'rotate-0' : '-rotate-90'"
              />
            </button>

            <Transition name="sidebar-group">
              <div v-if="collapsed || isGroupOpen(group.label)" class="space-y-1">
                <NuxtLink
                  v-for="item in group.items"
                  :key="item.id || item.route || item.name"
                  :to="item.route || '#'"
                  class="group relative flex items-center rounded-2xl px-4 py-3 text-sm font-semibold"
                  :class="[
                    collapsed ? 'justify-center px-3' : 'gap-3',
                    isActive(item.route)
                      ? 'bg-foreground text-background shadow-lg shadow-slate-900/10'
                      : 'text-muted-foreground hover:bg-muted hover:text-card-foreground',
                  ]"
                >
                  <MenuIcon
                    :name="item.name"
                    :label="item.label"
                    :route="item.route"
                    :group="item.group"
                    size="h-5 w-5 shrink-0"
                  />

                  <Transition name="sidebar-label">
                    <span v-if="!collapsed" class="truncate">
                      {{ item.label }}
                    </span>
                  </Transition>

                  <!-- Tooltip when collapsed -->
                  <span
                    v-if="collapsed"
                    class="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-card-foreground opacity-0 shadow-xl group-hover:opacity-100"
                  >
                    {{ item.label }}
                  </span>
                </NuxtLink>
              </div>
            </Transition>
          </div>
        </nav>
      </div>

      <!-- Footer collapsed toggle -->
      <div v-if="collapsed" class="border-t border-border p-4">
        <button
          type="button"
          class="flex h-11 w-full items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground hover:bg-background hover:text-card-foreground"
          aria-label="Expand sidebar"
          @click="emit('toggle-collapse')"
        >
          <PanelLeftClose class="h-5 w-5 rotate-180" />
        </button>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.sidebar-fade-enter-active,
.sidebar-fade-leave-active {
  transition: opacity 180ms ease;
}

.sidebar-fade-enter-from,
.sidebar-fade-leave-to {
  opacity: 0;
}

.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition: transform 240ms ease;
}

.sidebar-slide-enter-from,
.sidebar-slide-leave-to {
  transform: translateX(-100%);
}

.sidebar-group-enter-active,
.sidebar-group-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.sidebar-group-enter-from,
.sidebar-group-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.sidebar-label-enter-active,
.sidebar-label-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.sidebar-label-enter-from,
.sidebar-label-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}

.sidebar-chevron {
  transition: transform 160ms ease;
}

aside {
  transition: width 240ms ease, background-color 180ms ease, border-color 180ms ease;
}

a,
button {
  transition: background-color 180ms ease, color 180ms ease, border-color 180ms ease,
    box-shadow 180ms ease, opacity 180ms ease;
}
</style>

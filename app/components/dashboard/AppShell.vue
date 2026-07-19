<script setup lang="ts">
const sidebarOpen = ref(false);
const sidebarCollapsed = ref(false);
const commandOpen = ref(false);

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const closeSidebar = () => {
  sidebarOpen.value = false;
};

const toggleSidebarCollapsed = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

const openCommandPalette = () => {
  commandOpen.value = true;
};

const closeCommandPalette = () => {
  commandOpen.value = false;
};

const handleKeydown = (event: KeyboardEvent) => {
  const isMac = navigator.platform.toLowerCase().includes("mac");
  const isCommandKey = isMac ? event.metaKey : event.ctrlKey;

  if (isCommandKey && event.key.toLowerCase() === "k") {
    event.preventDefault();
    commandOpen.value = true;
  }

  if (event.key === "Escape") {
    commandOpen.value = false;
  }
};

onMounted(async () => {
  window.addEventListener("keydown", handleKeydown);

  await notificationStore.fetchNotifications();

  notificationTimer = setInterval(() => {
    notificationStore.refreshNotifications();
  }, 60000);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);

  if (notificationTimer) {
    clearInterval(notificationTimer);
  }
});

const notificationStore = useNotificationStore();

let notificationTimer: ReturnType<typeof setInterval> | null = null;
</script>

<template>
  <div
    class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
  >
    <div class="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        class="absolute -left-40 top-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/5"
      />
      <div
        class="absolute -right-40 top-40 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl dark:bg-purple-500/5"
      />
    </div>

    <AppSidebar
      :open="sidebarOpen"
      :collapsed="sidebarCollapsed"
      @close="closeSidebar"
      @toggle-collapse="toggleSidebarCollapsed"
    />

    <div
      class="relative transition-all duration-300"
      :class="sidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'"
    >
      <AppHeader
        :sidebar-collapsed="sidebarCollapsed"
        @toggle-sidebar="toggleSidebar"
        @toggle-sidebar-collapse="toggleSidebarCollapsed"
        @open-command-palette="openCommandPalette"
      />
      <main class="px-4 py-6 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-7xl">
          <slot />
        </div>
      </main>
    </div>

    <CommandPalette :open="commandOpen" @close="closeCommandPalette" />
  </div>
</template>

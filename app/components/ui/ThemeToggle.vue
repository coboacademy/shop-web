<script setup lang="ts">
import { Monitor, Moon, Sun, Check } from "lucide-vue-next";
import type { ThemeMode } from "~/stores/theme";

const theme = useThemeStore();

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
  if (event.key === "Escape") close();
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleEscape);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleEscape);
});

const options: {
  label: string;
  value: ThemeMode;
  icon: typeof Sun;
}[] = [
  { label: "Light", value: "light", icon: Sun },
  { label: "Dark", value: "dark", icon: Moon },
  { label: "System", value: "system", icon: Monitor },
];

const currentIcon = computed(() => {
  if (theme.mode === "light") return Sun;
  if (theme.mode === "dark") return Moon;

  return Monitor;
});

const selectTheme = (mode: ThemeMode) => {
  theme.setTheme(mode);
  open.value = false;
};
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <button
      type="button"
      @click="toggleDropdown"
      class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:scale-105 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <component :is="currentIcon" class="h-5 w-5" />
    </button>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="open"
        class="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <button
          v-for="item in options"
          :key="item.value"
          type="button"
          @click="selectTheme(item.value)"
          class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          :class="theme.mode === item.value ? 'bg-slate-100 dark:bg-slate-800' : ''"
        >
          <div class="flex items-center gap-3">
            <component :is="item.icon" class="h-4 w-4" />
            {{ item.label }}
          </div>

          <Check v-if="theme.mode === item.value" class="h-4 w-4 text-emerald-500" />
        </button>
      </div>
    </Transition>
  </div>
</template>

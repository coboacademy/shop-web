<script setup lang="ts">
import { MoreHorizontal } from "lucide-vue-next";

export interface ActionDropdownItem {
  label: string;
  action: string;
  icon?: any;
  variant?: "default" | "danger" | "success" | "warning";
  disabled?: boolean;
  visible?: boolean;
}

const props = defineProps<{
  items: ActionDropdownItem[];
}>();

const emit = defineEmits<{
  (e: "select", action: string): void;
}>();

const open = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const visibleItems = computed(() => {
  return props.items.filter((item) => item.visible !== false);
});

const itemClass = (variant?: ActionDropdownItem["variant"]) => {
  const variants: Record<string, string> = {
    default: "text-card-foreground hover:bg-muted",

    success:
      "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40",

    warning:
      "text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/40",

    danger: "text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40",
  };

  return variants[variant || "default"];
};

const handleSelect = (item: ActionDropdownItem) => {
  if (item.disabled) return;

  emit("select", item.action);
  open.value = false;
};

const close = () => {
  open.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  if (!dropdownRef.value) return;

  if (!dropdownRef.value.contains(event.target as Node)) {
    close();
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    close();
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div
    ref="dropdownRef"
    class="relative inline-block text-left"
    data-ignore-row-click="true"
  >
    <button
      type="button"
      class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm local-transition-smooth hover:-translate-y-0.5 hover:bg-muted hover:text-card-foreground local-active-press"
      :class="open ? 'bg-muted text-card-foreground' : ''"
      aria-label="Open actions"
      @click.stop="open = !open"
    >
      <MoreHorizontal class="h-5 w-5" />
    </button>

    <Transition name="dropdown">
      <div
        v-if="open"
        class="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-xl"
        data-ignore-row-click="true"
      >
        <div v-if="visibleItems.length" class="space-y-1">
          <button
            v-for="item in visibleItems"
            :key="item.action"
            type="button"
            :disabled="item.disabled"
            :class="[
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold local-transition-smooth',
              'disabled:cursor-not-allowed disabled:opacity-50',
              itemClass(item.variant),
            ]"
            @click="handleSelect(item)"
          >
            <span
              v-if="item.icon"
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background/60"
            >
              <component :is="item.icon" class="h-4 w-4" />
            </span>

            <span class="min-w-0 flex-1 truncate">
              {{ item.label }}
            </span>
          </button>
        </div>

        <div v-else class="px-4 py-6 text-center">
          <p class="text-sm font-semibold text-card-foreground">No actions</p>

          <p class="mt-1 text-xs text-muted-foreground">
            There are no available actions.
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Local transition/press utilities to avoid global dependency */
.local-transition-smooth {
  transition: transform 180ms cubic-bezier(.2,.8,.2,1),
    background-color 180ms cubic-bezier(.2,.8,.2,1),
    color 180ms cubic-bezier(.2,.8,.2,1),
    box-shadow 180ms cubic-bezier(.2,.8,.2,1);
}

.local-active-press:active { transform: scale(.985); }

/* Scoped dropdown transition (replaces global .dropdown-* selectors) */
.dropdown-enter-active,
.dropdown-leave-active { transition: opacity 160ms cubic-bezier(.2,.8,.2,1), transform 160ms cubic-bezier(.2,.8,.2,1); }
.dropdown-enter-from,
.dropdown-leave-to { opacity: 0; transform: translateY(-6px) scale(.995); }
</style>

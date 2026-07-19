<script setup lang="ts">
import { MoreHorizontal } from "lucide-vue-next";

export interface AppDropdownItem {
  label: string;
  value: string;
  icon?: any;
  description?: string;
  variant?: "default" | "danger" | "success" | "warning";
  disabled?: boolean;
  visible?: boolean;
}

const props = withDefaults(
  defineProps<{
    items: AppDropdownItem[];
    buttonIcon?: any;
    buttonLabel?: string;
    align?: "left" | "right";
    width?: string;
  }>(),
  {
    buttonLabel: "",
    align: "right",
    width: "w-72",
  }
);

const emit = defineEmits<{
  (e: "select", value: string): void;
}>();

const open = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const panelStyle = ref<Record<string, string>>({});

const currentButtonIcon = computed(() => {
  return props.buttonIcon || MoreHorizontal;
});

const visibleItems = computed(() => {
  return props.items.filter((item) => item.visible !== false);
});

const itemClass = (variant?: AppDropdownItem["variant"]) => {
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

const updatePosition = async () => {
  await nextTick();

  if (!triggerRef.value) return;

  const rect = triggerRef.value.getBoundingClientRect();

  const dropdownWidth = props.width.includes("72")
    ? 288
    : props.width.includes("64")
    ? 256
    : props.width.includes("60")
    ? 240
    : 288;

  const spacing = 8;
  const viewportPadding = 12;

  let top = rect.bottom + spacing;
  let left = props.align === "left" ? rect.left : rect.right - dropdownWidth;

  if (left + dropdownWidth > window.innerWidth - viewportPadding) {
    left = window.innerWidth - dropdownWidth - viewportPadding;
  }

  if (left < viewportPadding) {
    left = viewportPadding;
  }

  const estimatedHeight = Math.min(visibleItems.value.length * 64 + 24, 420);

  if (top + estimatedHeight > window.innerHeight - viewportPadding) {
    top = rect.top - estimatedHeight - spacing;
  }

  if (top < viewportPadding) {
    top = viewportPadding;
  }

  panelStyle.value = {
    position: "fixed",
    top: `${top}px`,
    left: `${left}px`,
  };
};

const openDropdown = async () => {
  open.value = true;
  await updatePosition();
};

const close = () => {
  open.value = false;
};

const toggle = async () => {
  if (open.value) {
    close();
    return;
  }

  await openDropdown();
};

const handleSelect = (item: AppDropdownItem) => {
  if (item.disabled) return;

  emit("select", item.value);
  close();
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node;

  if (triggerRef.value?.contains(target)) return;

  close();
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    close();
  }
};

const handleScrollOrResize = () => {
  if (open.value) {
    updatePosition();
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleKeydown);
  window.addEventListener("resize", handleScrollOrResize);
  window.addEventListener("scroll", handleScrollOrResize, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("resize", handleScrollOrResize);
  window.removeEventListener("scroll", handleScrollOrResize, true);
});
</script>

<template>
  <div
    ref="triggerRef"
    class="relative inline-block text-left"
    data-ignore-row-click="true"
  >
    <button
      type="button"
      class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold text-muted-foreground shadow-sm local-transition-smooth hover:-translate-y-0.5 hover:bg-muted hover:text-card-foreground local-active-press"
      :class="[
        open ? 'bg-muted text-card-foreground' : '',
        buttonLabel ? 'w-auto' : 'w-10',
      ]"
      aria-label="Open dropdown"
      @click.stop="toggle"
    >
      <component :is="currentButtonIcon" class="h-5 w-5" />

      <span v-if="buttonLabel">
        {{ buttonLabel }}
      </span>
    </button>

    <Teleport to="body">
      <Transition name="dropdown">
        <div
          v-if="open"
          class="fixed inset-0 z-[9998]"
          data-ignore-row-click="true"
          @click.self="close"
        >
          <div
            :class="[
              'z-[9999] max-h-[420px] overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-2xl',
              width,
            ]"
            :style="panelStyle"
            @click.stop
          >
            <div v-if="visibleItems.length" class="space-y-1">
              <button
                v-for="item in visibleItems"
                :key="item.value"
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
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background/70"
                >
                  <component :is="item.icon" class="h-4 w-4" />
                </span>

                <span class="min-w-0 flex-1">
                  <span class="block truncate">
                    {{ item.label }}
                  </span>

                  <span
                    v-if="item.description"
                    class="mt-0.5 block truncate text-xs font-normal text-muted-foreground"
                  >
                    {{ item.description }}
                  </span>
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
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
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

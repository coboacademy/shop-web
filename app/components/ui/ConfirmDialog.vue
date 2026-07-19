<script setup lang="ts">
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "success" | "warning" | "danger" | "info";
    loading?: boolean;
  }>(),
  {
    message: "",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    variant: "default",
    loading: false,
  }
);

const emit = defineEmits<{
  (e: "close"): void;
  (e: "confirm"): void;
}>();

const iconMap = {
  default: Info,
  success: CheckCircle2,
  warning: ShieldAlert,
  danger: Trash2,
  info: AlertTriangle,
};

const iconClass = computed(() => {
  return {
    default: "bg-muted text-muted-foreground",
    success:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    danger: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    info: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  }[props.variant];
});

const confirmVariant = computed(() => {
  if (props.variant === "danger") return "danger";
  if (props.variant === "success") return "success";

  return "primary";
});

const currentIcon = computed(() => {
  return iconMap[props.variant];
});

const handleClose = () => {
  if (props.loading) return;

  emit("close");
};

const handleConfirm = () => {
  if (props.loading) return;

  emit("confirm");
};

const handleKeydown = (event: KeyboardEvent) => {
  if (!props.open) return;

  if (event.key === "Escape") {
    handleClose();
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-overlay">
      <div v-if="open" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          @click="handleClose"
        />

        <Transition name="modal-panel" appear>
          <div
            class="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
          >
            <div class="flex items-start gap-4 px-6 pt-6">
              <div
                :class="[
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                  iconClass,
                ]"
              >
                <component :is="currentIcon" class="h-6 w-6" />
              </div>

              <div class="min-w-0 flex-1">
                <h2 class="text-lg font-bold text-card-foreground">
                  {{ title }}
                </h2>

                <p v-if="message" class="mt-2 text-sm leading-6 text-muted-foreground">
                  {{ message }}
                </p>
              </div>

              <button
                type="button"
                class="rounded-xl p-2 text-muted-foreground local-transition-smooth hover:bg-muted hover:text-card-foreground"
                :disabled="loading"
                @click="handleClose"
              >
                <X class="h-5 w-5" />
              </button>
            </div>

            <div v-if="$slots.default" class="px-6 py-5">
              <slot />
            </div>

            <div
              class="mt-6 flex justify-end gap-3 border-t border-border bg-muted/40 px-6 py-4"
            >
              <AppButton
                type="button"
                variant="secondary"
                :disabled="loading"
                @click="handleClose"
              >
                {{ cancelLabel }}
              </AppButton>

              <AppButton
                type="button"
                :variant="confirmVariant"
                :loading="loading"
                @click="handleConfirm"
              >
                <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
                {{ confirmLabel }}
              </AppButton>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Scoped modal transitions that previously relied on global selectors */
.modal-overlay-enter-active,
.modal-overlay-leave-active {
  transition: opacity 160ms cubic-bezier(.2,.8,.2,1);
}
.modal-overlay-enter-from,
.modal-overlay-leave-to { opacity: 0; }

.modal-panel-enter-active,
.modal-panel-leave-active {
  transition: opacity 220ms cubic-bezier(.2,.8,.2,1), transform 220ms cubic-bezier(.2,.8,.2,1);
}
.modal-panel-enter-from,
.modal-panel-leave-to { opacity: 0; transform: translateY(8px) scale(.995); }

.local-transition-smooth {
  transition: transform 180ms cubic-bezier(.2,.8,.2,1), background-color 180ms cubic-bezier(.2,.8,.2,1), color 180ms cubic-bezier(.2,.8,.2,1);
}
</style>

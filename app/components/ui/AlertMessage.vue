<script setup lang="ts">
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    type?: "success" | "error" | "warning" | "info";
    title?: string;
    message?: string;
    closable?: boolean;
  }>(),
  {
    type: "info",
    title: "",
    message: "",
    closable: false,
  }
);

const emit = defineEmits<{
  (e: "close"): void;
}>();

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info,
};

const alertClass = computed(() => {
  return {
    success:
      "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/50 dark:text-green-200",
    error:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200",
    warning:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
    info:
      "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200",
  }[props.type];
});

const iconComponent = computed(() => iconMap[props.type]);
</script>

<template>
  <div
    :class="['flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm', alertClass]"
  >
    <component :is="iconComponent" class="mt-0.5 h-5 w-5 shrink-0" />

    <div class="min-w-0 flex-1">
      <p v-if="title" class="font-bold">
        {{ title }}
      </p>

      <p v-if="message" :class="title ? 'mt-1 opacity-90' : ''">
        {{ message }}
      </p>

      <div v-if="$slots.default" :class="title || message ? 'mt-2' : ''">
        <slot />
      </div>
    </div>

    <button
      v-if="closable"
      type="button"
      class="rounded-lg p-1 opacity-70 transition hover:opacity-100"
      @click="emit('close')"
    >
      <X class="h-4 w-4" />
    </button>
  </div>
</template>

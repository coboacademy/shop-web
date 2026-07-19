<script setup lang="ts">
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-vue-next";
import type { ToastItem } from "~/stores/toast";

const toast = useToast();

const typeClass = (type: ToastItem["type"]) => {
  const classes = {
    success:
      "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200",
    error:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
    info:
      "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200",
    warning:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  };

  return classes[type];
};

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: TriangleAlert,
};
</script>

<template>
  <Teleport to="body">
    <div class="fixed right-4 top-4 z-[9999] w-full max-w-sm space-y-3">
      <TransitionGroup name="toast" tag="div" class="space-y-3">
        <div
          v-for="item in toast.items.value"
          :key="item.id"
          :class="[
            'rounded-2xl border p-4 shadow-lg backdrop-blur',
            typeClass(item.type),
          ]"
        >
          <div class="flex items-start gap-3">
            <component :is="iconMap[item.type]" class="mt-0.5 h-5 w-5 shrink-0" />

            <div class="flex-1">
              <p class="text-sm font-bold">
                {{ item.title }}
              </p>

              <p v-if="item.message" class="mt-1 text-sm opacity-80">
                {{ item.message }}
              </p>
            </div>

            <button
              class="rounded-lg p-1 opacity-70 hover:opacity-100"
              @click="toast.remove(item.id)"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>

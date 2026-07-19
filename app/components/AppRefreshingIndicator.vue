<script setup lang="ts">
withDefaults(
  defineProps<{
    show?: boolean;
    text?: string;
  }>(),
  {
    show: false,
    text: "Refreshing data...",
  }
);
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-3 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-3 opacity-0"
  >
    <div
      v-if="show"
      class="fixed bottom-5 right-5 z-50 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
    >
      {{ text }}
    </div>
  </Transition>
</template>

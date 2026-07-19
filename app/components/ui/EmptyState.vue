<script setup lang="ts">
defineProps<{
  title: string;
  message?: string;
}>();
</script>

<template>
  <div class="px-6 py-12 text-center">
    <div
      v-if="$slots.icon"
      class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
    >
      <slot name="icon" />
    </div>

    <p class="text-base font-semibold text-ui">
      {{ title }}
    </p>

    <p v-if="message" class="mt-2 text-sm text-muted">
      {{ message }}
    </p>

    <div v-if="$slots.actions" class="mt-5 flex justify-center">
      <slot name="actions" />
    </div>
  </div>
</template>

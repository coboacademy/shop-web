<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
  }>(),
  {
    title: "",
    subtitle: "",
  }
);
</script>

<template>
  <div
    class="rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900"
  >
    <div
      v-if="title || subtitle || $slots.header"
      class="border-b border-slate-200 px-6 py-4 dark:border-slate-800"
    >
      <slot name="header">
        <h3 v-if="title" class="text-lg font-bold text-slate-900 dark:text-white">
          {{ title }}
        </h3>
        <p v-if="subtitle" class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {{ subtitle }}
        </p>
      </slot>
    </div>

    <div class="p-6">
      <slot />
    </div>
  </div>
</template>

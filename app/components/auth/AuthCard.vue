<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>

<template>
  <div class="mx-auto w-full max-w-md">
    <div class="mb-8 text-center">
      <div
        class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 dark:bg-white dark:text-slate-900"
      >
        <span class="text-lg font-black">A</span>
      </div>

      <h1 class="text-2xl font-bold tracking-tight text-ui">
        {{ title }}
      </h1>

      <p v-if="subtitle" class="mt-2 text-sm leading-6 text-muted">
        {{ subtitle }}
      </p>
    </div>

    <div
      class="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-2xl shadow-slate-200/60 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/30"
    >
      <slot />
    </div>
  </div>
</template>

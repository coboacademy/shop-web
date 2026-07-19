<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <div class="h-7 w-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div
          class="mt-3 h-4 w-72 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/70"
        />
      </div>

      <div class="h-11 w-32 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="i in 4"
        :key="i"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div class="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div class="mt-4 h-8 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div
          class="mt-3 h-4 w-36 animate-pulse rounded bg-slate-100 dark:bg-slate-800/70"
        />
      </div>
    </div>

    <div
      class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div class="space-y-4">
        <div
          v-for="i in 6"
          :key="i"
          class="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/70"
        />
      </div>
    </div>
  </div>
</template>

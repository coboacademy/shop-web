<template>
  <div
    class="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100"
  >
    <div class="absolute right-5 top-5 z-20">
      <ThemeToggle />
    </div>

    <div class="pointer-events-none absolute inset-0">
      <div
        class="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl dark:bg-blue-500/10"
      />
      <div
        class="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl dark:bg-purple-500/10"
      />
    </div>

    <div class="relative w-full">
      <slot />
    </div>
  </div>
</template>

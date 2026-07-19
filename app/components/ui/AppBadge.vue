<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: "default" | "success" | "danger" | "warning" | "info";
    size?: "sm" | "md" | "lg";
    tone?: "soft" | "solid" | "outline";
    shape?: "pill" | "square";
    dot?: boolean;
  }>(),
  {
    variant: "default",
    size: "sm",
    tone: "soft",
    shape: "pill",
    dot: false,
  }
);

const badgeClass = computed(() => {
  const base = [
    "inline-flex shrink-0 items-center justify-center gap-1.5 font-bold",
    "local-transition-smooth whitespace-nowrap",
  ];

  const shapes = {
    pill: "rounded-full",
    square: "rounded-2xl",
  };

  const sizes = {
    sm: props.shape === "square" ? "h-8 w-8 text-xs" : "px-2.5 py-1 text-xs",

    md: props.shape === "square" ? "h-10 w-10 text-xs" : "px-3 py-1.5 text-xs",

    lg: props.shape === "square" ? "h-12 w-12 text-sm" : "px-3.5 py-2 text-sm",
  };

  const soft = {
    default: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",

    success:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/70",

    danger:
      "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900/70",

    warning:
      "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-900/70",

    info:
      "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900/70",
  };

  const solid = {
    default: "bg-foreground text-background",

    success: "bg-emerald-600 text-white",

    danger: "bg-rose-600 text-white",

    warning: "bg-orange-500 text-white",

    info: "bg-sky-600 text-white",
  };

  const outline = {
    default: "border border-border bg-transparent text-muted-foreground",

    success:
      "border border-emerald-300 bg-transparent text-emerald-700 dark:border-emerald-800 dark:text-emerald-300",

    danger:
      "border border-rose-300 bg-transparent text-rose-700 dark:border-rose-800 dark:text-rose-300",

    warning:
      "border border-orange-300 bg-transparent text-orange-700 dark:border-orange-800 dark:text-orange-300",

    info:
      "border border-sky-300 bg-transparent text-sky-700 dark:border-sky-800 dark:text-sky-300",
  };

  const tones = {
    soft,
    solid,
    outline,
  };

  return [
    ...base,
    shapes[props.shape],
    sizes[props.size],
    tones[props.tone][props.variant],
  ];
});

const dotClass = computed(() => {
  const colors = {
    default: "bg-muted-foreground",
    success: "bg-emerald-500",
    danger: "bg-rose-500",
    warning: "bg-orange-500",
    info: "bg-sky-500",
  };

  return colors[props.variant];
});
</script>

<template>
  <span :class="badgeClass">
    <span v-if="dot" :class="['h-1.5 w-1.5 rounded-full', dotClass]" />

    <slot />
  </span>
</template>

<style scoped>
.local-transition-smooth { transition: background-color 160ms cubic-bezier(.2,.8,.2,1), color 160ms cubic-bezier(.2,.8,.2,1); }
</style>

<script setup lang="ts">
import { Loader2 } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    type?: "button" | "submit";
    variant?: "primary" | "secondary" | "danger" | "success" | "warning" | "ghost";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    disabled?: boolean;
  }>(),
  {
    type: "button",
    variant: "primary",
    size: "md",
    loading: false,
    disabled: false,
  }
);

const buttonClass = computed(() => {
  const variants = {
    primary:
      "bg-slate-900 text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200",

    secondary:
      "border border-border bg-card text-card-foreground shadow-sm hover:bg-muted",

    success: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",

    warning: "bg-amber-500 text-white shadow-sm hover:bg-amber-600",

    danger: "bg-rose-600 text-white shadow-sm hover:bg-rose-700",

    ghost: "bg-transparent text-card-foreground hover:bg-muted",
  };

  const sizes = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-3 text-sm",
    lg: "px-5 py-3.5 text-base",
  };

  return [
    "inline-flex items-center justify-center rounded-xl font-medium transition focus:outline-none focus:ring-4",
    "disabled:cursor-not-allowed disabled:opacity-60",
    variants[props.variant],
    sizes[props.size],
  ];
});
</script>

<template>
  <button :type="type" :disabled="disabled || loading" :class="buttonClass">
    <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />

    <slot />
  </button>
</template>

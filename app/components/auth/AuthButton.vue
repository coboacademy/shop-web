<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label?: string;
    loading?: boolean;
    type?: "button" | "submit";
    variant?: "primary" | "success" | "secondary";
  }>(),
  {
    label: "",
    loading: false,
    type: "submit",
    variant: "primary",
  }
);

const buttonClass = computed(() => {
  const variants = {
    primary:
      "bg-slate-900 hover:bg-slate-800 focus:ring-slate-200 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200",
    success:
      "bg-blue-600 hover:bg-blue-700 focus:ring-blue-100 text-white dark:bg-blue-600 dark:hover:bg-blue-500",
    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
  };

  return [
    "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition duration-200",
    "disabled:cursor-not-allowed disabled:opacity-70",
    "focus:outline-none focus:ring-4",
    variants[props.variant],
  ];
});
</script>

<template>
  <button :type="type" :disabled="loading" :class="buttonClass">
    <slot>
      <span>{{ loading ? "Please wait..." : label }}</span>
    </slot>
  </button>
</template>

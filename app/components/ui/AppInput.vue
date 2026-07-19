<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string | number;
    label?: string;
    type?: string;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
  }>(),
  {
    label: "",
    type: "text",
    placeholder: "",
    error: "",
    disabled: false,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const slots = useSlots();

const inputClass = computed(() => {
  return [
    "w-full rounded-xl border px-4 py-3 text-sm outline-none transition",
    "bg-white text-slate-900 placeholder:text-slate-400",
    "dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500",
    "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
    "dark:disabled:bg-slate-800 dark:disabled:text-slate-500",
    slots.icon ? "pl-11" : "",
    props.error
      ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-red-800 dark:focus:ring-red-950"
      : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:focus:border-blue-500 dark:focus:ring-blue-950",
  ];
});
</script>

<template>
  <div>
    <label
      v-if="label"
      class="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
    >
      {{ label }}
    </label>

    <div class="relative">
      <div
        v-if="$slots.icon"
        class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
      >
        <slot name="icon" />
      </div>

      <input
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="inputClass"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <p v-if="error" class="mt-2 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </p>
  </div>
</template>

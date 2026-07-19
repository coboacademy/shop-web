<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    type?: string;
    placeholder?: string;
    error?: string;
    required?: boolean;
  }>(),
  {
    type: "text",
    placeholder: "",
    error: "",
    required: false,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.value);
};
</script>

<template>
  <div>
    <label class="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
      {{ label }}
    </label>

    <input
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :required="required"
      class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
      @input="onInput"
    />

    <p v-if="error" class="mt-2 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    error?: string;
    length?: number;
  }>(),
  {
    label: "OTP Code",
    error: "",
    length: 6,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const localValue = computed({
  get: () => props.modelValue,
  set: (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, props.length);
    emit("update:modelValue", cleaned);
  },
});
</script>

<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {{ label }}
    </label>

    <input
      v-model="localValue"
      type="text"
      inputmode="numeric"
      :maxlength="length"
      placeholder="000000"
      class="w-full rounded-xl border border-slate-200 bg-white py-4 text-center text-2xl font-bold tracking-[0.4em] text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-600 dark:focus:ring-blue-950"
    />

    <p v-if="error" class="text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </p>
  </div>
</template>

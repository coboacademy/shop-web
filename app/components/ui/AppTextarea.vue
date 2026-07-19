<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue?: string | null;
    label?: string;
    placeholder?: string;
    error?: string;
    rows?: number;
  }>(),
  {
    modelValue: "",
    label: "",
    placeholder: "",
    error: "",
    rows: 4,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
</script>

<template>
  <div class="space-y-2">
    <label v-if="label" class="text-sm font-semibold text-card-foreground">
      {{ label }}
    </label>

    <textarea
      :value="modelValue || ''"
      :placeholder="placeholder"
      :rows="rows"
      class="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-card-foreground outline-none placeholder:text-muted-foreground focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-950"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />

    <p v-if="error" class="text-sm font-medium text-rose-600 dark:text-rose-400">
      {{ error }}
    </p>
  </div>
</template>

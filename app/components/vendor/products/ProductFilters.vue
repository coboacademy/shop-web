<script setup lang="ts">
import { Search, SlidersHorizontal, X } from "lucide-vue-next";

defineProps<{
  modelValue: string;
  status: string;
  statuses: string[];
  storeId: string;
  stores: Array<{ label: string; value: string }>;
  perPage: number;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
  (event: "update:status", value: string): void;
  (event: "update:storeId", value: string): void;
  (event: "update:perPage", value: string): void;
  (event: "reset"): void;
}>();

const statusLabel = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);
</script>

<template>
  <section class="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label class="relative min-w-0 flex-1">
          <span class="sr-only">Search products by name or SKU</span>
          <Search
            class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            :value="modelValue"
            type="search"
            placeholder="Search products by name or SKU"
            class="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-card-foreground outline-none transition placeholder:text-muted-foreground focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-950"
            @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          />
        </label>

        <div class="grid gap-3 sm:grid-cols-2 lg:flex">
          <AppSelect
            :model-value="storeId"
            label="Store"
            placeholder="Select a store"
            :options="stores"
            :disabled="loading || stores.length === 0"
            @update:model-value="emit('update:storeId', $event)"
          />
          <AppSelect
            :model-value="perPage"
            label="Rows"
            :options="[15, 30, 50, 100].map((value) => ({ label: String(value), value }))"
            @update:model-value="emit('update:perPage', $event)"
          />
        </div>
      </div>

      <div class="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-wrap items-center gap-2">
          <span class="mr-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <SlidersHorizontal class="h-3.5 w-3.5" />
            Status
          </span>
          <button
            type="button"
            class="rounded-full px-3 py-1.5 text-xs font-semibold transition"
            :class="!status ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-muted text-muted-foreground hover:text-card-foreground'"
            @click="emit('update:status', '')"
          >
            All
          </button>
          <button
            v-for="item in statuses"
            :key="item"
            type="button"
            class="rounded-full px-3 py-1.5 text-xs font-semibold transition"
            :class="status === item ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-muted text-muted-foreground hover:text-card-foreground'"
            @click="emit('update:status', item)"
          >
            {{ statusLabel(item) }}
          </button>
        </div>
        <button
          v-if="modelValue || status"
          type="button"
          class="inline-flex items-center gap-1 self-start text-xs font-semibold text-muted-foreground transition hover:text-card-foreground sm:self-auto"
          @click="emit('reset')"
        >
          <X class="h-3.5 w-3.5" />
          Clear filters
        </button>
      </div>
      <p class="-mt-2 text-xs text-muted-foreground">
        Search and status filters apply to the currently loaded page. Category and stock filters need API support.
      </p>
    </div>
  </section>
</template>

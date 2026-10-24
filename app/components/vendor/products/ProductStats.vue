<script setup lang="ts">
import { CheckCircle2, Package, Pencil, Warehouse } from "lucide-vue-next";

const props = defineProps<{
  total: number;
  totalDescription: string;
  active: number;
  drafts: number;
  outOfStock: number | null;
}>();

const stats = computed(() => [
  {
    label: "Total products",
    value: props.total,
    description: props.totalDescription,
    icon: Package,
    iconClass: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  },
  {
    label: "Active",
    value: props.active,
    description: "On this page",
    icon: CheckCircle2,
    iconClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  {
    label: "Draft",
    value: props.drafts,
    description: "On this page",
    icon: Pencil,
    iconClass: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  {
    label: "Out of stock",
    value: props.outOfStock ?? "—",
    description: props.outOfStock === null ? "Inventory data unavailable" : "Across this store",
    icon: Warehouse,
    iconClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
]);
</script>

<template>
  <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <article
      v-for="stat in stats"
      :key="stat.label"
      class="rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <div class="flex items-center justify-between">
        <p class="text-sm font-medium text-muted-foreground">{{ stat.label }}</p>
        <span
          class="flex h-9 w-9 items-center justify-center rounded-xl"
          :class="stat.iconClass"
        >
          <component :is="stat.icon" class="h-4 w-4" />
        </span>
      </div>
      <p class="mt-3 text-2xl font-bold text-card-foreground">{{ stat.value }}</p>
      <p class="mt-1 text-xs text-muted-foreground">{{ stat.description }}</p>
    </article>
  </section>
</template>

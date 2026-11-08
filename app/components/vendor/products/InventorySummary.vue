<script setup lang="ts">
import type { ProductInventorySummary } from "~/utils/productInventorySummary";

const props = defineProps<{
  summary: ProductInventorySummary | null;
}>();

const display = computed(() => {
  const summary = props.summary;
  if (!summary) return { label: "Loading…", variant: "default" as const };

  switch (summary.state) {
    case "tracked": {
      if (
        summary.variantCount !== null &&
        summary.variantCount > 0 &&
        summary.totalQuantity !== null
      ) {
        return {
          label: `${summary.variantCount} ${
            summary.variantCount === 1 ? "variant" : "variants"
          } · ${summary.totalQuantity.toLocaleString()} total`,
          variant: "success" as const,
        };
      }

      if (summary.variantCount === 0 && summary.inventory) {
        return {
          label: `${summary.inventory.quantity.toLocaleString()} in stock`,
          variant: "success" as const,
        };
      }

      return {
        label: "Unavailable",
        variant: "danger" as const,
      };
    }
    case "partially-tracked":
      return {
        label: `${summary.trackedVariantCount} of ${summary.variantCount} tracked`,
        variant: "warning" as const,
      };
    case "not-tracked":
      return { label: "Not tracked", variant: "default" as const };
    case "unavailable":
      return { label: "Unavailable", variant: "danger" as const };
  }
});
</script>

<template>
  <AppBadge :variant="display.variant" class="font-medium">
    {{ display.label }}
  </AppBadge>
</template>

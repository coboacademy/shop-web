<script setup lang="ts">
const props = defineProps<{
  status: string;
}>();

const variant = computed(() => {
  const status = props.status.toLowerCase();
  if (["active", "published", "live"].includes(status)) return "success";
  if (["inactive", "archived", "suspended"].includes(status)) return "warning";
  if (status === "rejected") return "danger";
  return "default";
});
</script>

<template>
  <AppBadge :variant="variant" dot>
    {{ status || "Unknown" }}
  </AppBadge>
</template>

<script setup lang="ts">
const props = defineProps<{
  status: 'active' | 'inactive' | 'pending'
}>()

const badgeClass = computed(() => {
  const styles = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-slate-100 text-slate-600',
    pending: 'bg-amber-100 text-amber-700',
  }

  return [
    'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize',
    styles[props.status],
  ]
})
</script>

<template>
  <span :class="badgeClass">
    {{ status }}
  </span>
</template>
